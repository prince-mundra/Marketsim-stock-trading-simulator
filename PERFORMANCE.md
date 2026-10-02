# MarketSim Performance Investigation

**Date:** 2026-10-02
**Environment:** Local Sandbox and the project's public HTTPS Preview
**Scope:** Diagnose perceived slowness and apply only behavior-preserving optimizations. Authentication/session semantics, MongoDB configuration, transaction/trading logic, API payloads, and simulated-price cadence were left unchanged.

## Findings

### Database round trips dominate authenticated data reads

Six direct, read-only MongoDB samples measured ping round trips at **615.4 ms p50 / 619.6 ms p95** and indexed stock lookup round trips at **1,189.6 ms p50 / 1,199.9 ms p95**. MongoDB's explain result for the indexed symbol lookup reported **0 ms server execution**, examined/returned **1/1** document, and used the `symbol_1` index. This separates the major delay from server-side query work: driver/network round trips are expensive, while the indexed query itself is not.

On the authenticated dashboard, identical GETs were initially issued twice within about 4 ms by React development StrictMode. Before coalescing, individual samples included `/api/portfolio` at 4.3–5.2 s, `/api/watchlist` at 1.2–2.4 s (and 4.89 s in a later run), and `/api/transactions` at 8.4–9.4 s. The dashboard originally waited for every panel, so a slow secondary request could hold back the whole page.

### Stock reads were the worst shared read path

Before the cache, warmed market API medians were about 0.93–1.40 s, and public stock-list p95 reached **11.08 s**. Those endpoints repeatedly crossed the MongoDB network boundary even though the stock universe is shared simulated data refreshed on a five-second cycle.

### Rendering and assets

The authenticated dashboard's browser timing recorded **356 ms first contentful paint**, **317 ms DOMContentLoaded**, and a **1.13 s load event**. The Vite development assets are much larger when decoded than their transferred size: `recharts.js` was 1,294,183 decoded / 212,278 transferred bytes; `lucide-react.js` was 1,244,072 / 157,191; and `/@vite/client` was 176,473 / 36,309. Compression was active (gzip locally and Brotli in Preview). Compression savings for these resources were approximately **83.6%**, **87.4%**, and **79.4%**, respectively.

## Targeted changes

- Added HTTP compression for responses larger than 1 KiB.
- Replaced sequential per-stock writes with one ordered MongoDB bulk write per simulated-price tick, preserving the same calculations, retained history, and five-second cadence.
- Hydrated a process-local snapshot for shared simulated stock list/search/detail/chart reads and Socket.IO initial snapshots; refreshed it only after successful MongoDB price writes. MongoDB remains the source of truth, and account, portfolio, watchlist, and trade records remain database-backed.
- Added client-side coalescing for **identical concurrent GET requests only**. The shared promise is removed when the request settles; no completed response, user data, or write operation is cached/coalesced.
- Split dashboard loading so the required portfolio/market data gates core content, while watchlist and recent-transaction panels fetch concurrently with their own loading states.
- Kept Vite HMR disabled (`hmr: false`) for the single-port Preview. The browser console showed no HMR WebSocket failure. This is separate from the app's Socket.IO channel; source changes in Preview require a manual refresh.

## Post-change results

### Warmed stock API response timings

Ten sequential samples per route were taken after one warm-up request. The p95 shown is nearest-rank (with 10 observations, the maximum sample); Node's Fetch API reports decoded body size while the `Content-Encoding` header indicates the on-wire format.

| Endpoint | Local p50 / p95 | Preview p50 / p95 | Encoding | Decoded payload |
| --- | ---: | ---: | --- | ---: |
| `GET /api/stocks` | 14 / 18.8 ms | 20.3 / 23 ms | gzip / Brotli | 191,055 bytes |
| `GET /api/stocks/search?q=TCS` | 2.3 / 2.9 ms | 8.7 / 10.5 ms | gzip / Brotli | 12,819 bytes |
| `GET /api/stocks/TCS` | 2.1 / 2.8 ms | 9.3 / 11.2 ms | gzip / Brotli | 12,791 bytes |
| `GET /api/stocks/TCS/chart?period=1M` | 1.8 / 2.8 ms | 8.4 / 9.8 ms | gzip / Brotli | 5,351 bytes |

The public stock-list p95 fell from **11,080 ms to 23 ms** in these samples (about **482× lower / 99.8% reduction**). The authenticated browser run also showed exactly **one request per endpoint** for `/api/auth/me`, `/api/portfolio`, `/api/stocks`, `/api/watchlist`, and `/api/transactions`, instead of duplicate requests.

In the final authenticated browser sample, `/api/auth/me` took 4.12 s, `/api/portfolio` 4.52 s, `/api/stocks` 42 ms, `/api/watchlist` 0.99 s, and `/api/transactions` 5.11 s. Other authenticated samples varied, consistent with the measured remote MongoDB round-trip latency. The dashboard now keeps watchlist/history reads from blocking its core portfolio view; the required session check and portfolio read remain unchanged.

### Socket.IO

After the shared snapshot cache, local connect/initial-snapshot latency was **63 ms** and Preview was **100 ms**. Three price updates arrived at approximately **4.8–5.3 s** intervals; client receive lag was **1–4 ms**. These observations confirm app Socket.IO remains healthy and distinct from Vite HMR.

### Health and build

- Local and public Preview: `/api/health` **200**, `/` **200 HTML**, `/manus-routes.json` **200 JSON**.
- The public route manifest matched the source manifest exactly (**9 routes**).
- `pnpm check`, `pnpm test`, and `pnpm build` passed; the integration suite reported **8/8 passing**.
- A temporary, randomly generated profiling account was logged out and deleted, along with any user-scoped test records. No other user records were changed.

## Remaining constraint

Some authenticated reads and the existing session check still vary from roughly one to five seconds because external MongoDB round trips are slow. Since the instruction was not to change authentication or MongoDB configuration, those paths were left authoritative and uncached. The browser shell paints quickly; the remaining delay is primarily external database latency, not a Vite HMR or app Socket.IO failure.
