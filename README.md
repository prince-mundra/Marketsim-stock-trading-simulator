# MarketSim — Stock Trading Simulator

MarketSim is a full-stack **paper-trading** app for practising with Indian-equity scenarios. Every account starts with **₹100,000 of virtual INR**. The app uses controlled mock prices, persists simulated accounts and trades in MongoDB, and never submits real brokerage orders or handles real money. All market prices are explicitly simulated.

## Features

- Secure user registration and JWT-based authentication
- ₹100,000 virtual starting balance
- Indian-equity paper trading with simulated prices
- Server-side buy/sell validation
- Atomic MongoDB transactions for trades
- Portfolio tracking with average cost basis
- Unrealized P&L calculation
- Real-time simulated price updates using Socket.IO
- Stock search, details, and simulated price charts
- User-specific watchlist
- Persistent transaction history
- Responsive React dashboard
- RESTful Express APIs
- MongoDB/Mongoose persistence

## Stack and architecture

The application follows a MERN-style full-stack JavaScript architecture.

The client uses JavaScript, React, Vite, Tailwind CSS, React Router, Axios, Recharts, and Socket.IO Client. The server uses JavaScript, Node.js, Express, Socket.IO, JWT, bcryptjs, and Mongoose. Express serves the REST API and React app on the same origin; Socket.IO shares that HTTP server. The included stock universe uses Indian-market symbols with invented scenario prices clearly labeled as simulated.

`client/src/components` contains reusable charts, cards, tables, watchlist controls, and the trade confirmation dialog. `client/src/pages` owns login, registration, dashboard, markets, stock details, portfolio, watchlist, transactions, and profile routes. `client/src/services`, `context`, `hooks`, and `utils` centralize REST calls, auth state, live price updates, and INR/P&L formatting. `server/models`, `routes`, `controllers`, `middleware`, `services`, `sockets`, `config`, and `utils` separate persistence, validation, request handling, paper-trading rules, realtime prices, and shared calculations.

## Local setup

Requirements: Node.js 22+, pnpm 11, and Docker Engine with the Docker Compose plugin for the bundled setup.

### Option A: Run the complete app and MongoDB locally with Docker Compose

This is the simplest self-contained setup. Compose starts the app plus a local MongoDB single-node replica set, which supports the simulator's atomic paper-trade transactions.

1. Copy the environment template and set a local signing secret:

   ```sh
   cp .env.example .env
   openssl rand -hex 32
   ```

   Copy the generated random text into the local `.env` as the value of `JWT_SECRET`. Leave `MONGO_URI` blank to use the bundled MongoDB service. The value belongs only in your local `.env`; do not commit or share it.

2. Build and start the local stack:

   ```sh
   docker compose up --build
   ```

3. Open `http://localhost:3000`. Compose binds the app and MongoDB ports to loopback only. The MongoDB data volume persists across restarts. Stop the stack with `Ctrl+C` or `docker compose down`; to permanently remove local database data, use `docker compose down -v`.

For Compose, `COOKIE_SECURE` defaults to `false` for plain-HTTP localhost. This local-only MongoDB instance has no database authentication; do not expose it to an untrusted network or use it for production.

### Option B: Run the Node server directly

Use this option when you already have a MongoDB replica set or sharded cluster reachable from your computer.

1. Copy `.env.example` to `.env`.
2. Set `MONGO_URI` to your accessible transaction-capable MongoDB connection string. Set `JWT_SECRET` to at least 32 random characters (64 hexadecimal characters from `openssl rand -hex 32` are recommended). For plain-HTTP localhost, add `COOKIE_SECURE=false` to `.env` so the browser can send the session cookie.
3. Install and start:

   ```sh
   pnpm install --frozen-lockfile
   pnpm dev
   ```

The server listens on port 3000 by default. Set `PORT` only if you need a different available port. The server rejects MongoDB deployments that do not support replica-set or sharded-cluster transactions. `.env` is ignored by Git; never commit it.

### Build and test

```sh
pnpm check
pnpm test
pnpm build
pnpm start
```

`pnpm start` is the production-mode Node server command. It expects `MONGO_URI` and `JWT_SECRET` in its runtime environment; it does not require a committed `.env` file. The root `Dockerfile`, `docker-compose.yml`, and `.dockerignore` provide container/local deployment configuration. The container listens on `PORT` (default 3000) and provides unauthenticated `GET /api/health` for readiness.

## Configuration files

- `.env.example` lists required variable names only; it contains no example secret values or database URI.
- `.gitignore` and `.dockerignore` exclude `.env`, dependencies, generated build output, and other local artifacts.
- `Dockerfile` builds the React assets and runs the Node/Express server as an unprivileged user.
- `docker-compose.yml` defines a loopback-only local app and MongoDB replica set; it uses `JWT_SECRET` from your local `.env` and a Compose-internal MongoDB URI by default.
- - `public/market-sim-logo.svg` contains the application brand mark.

## Performance behavior

HTTP responses larger than 1 KiB are compressed. The simulated-price engine persists each five-second tick with one ordered MongoDB bulk write. Stock list/search/detail/chart reads and Socket.IO initial snapshots use a process-local view hydrated from MongoDB at startup and refreshed only after successful simulated-price writes; account, watchlist, portfolio and trade records remain MongoDB-backed, and trade operations continue to read authoritative database prices. The client coalesces only identical concurrent GET requests and discards the shared promise as soon as it settles—no stale response cache is retained. The dashboard's core portfolio/market content renders independently of its watchlist and recent-transaction panels, each of which has its own loading state.

## MongoDB models

- **User:** name, email, passwordHash, virtualBalance, timestamps.
- **Stock:** symbol, companyName, currentPrice, previousClose, change, changePercent, exchange, open/high/low/volume, simulated priceHistory, dataSource, updatedAt.
- **Portfolio:** userId, stockId, symbol, quantity, averageBuyPrice, investedAmount, updatedAt.
- **Transaction:** userId, stockId, symbol, type, quantity, price, totalAmount, status, createdAt.
- **Watchlist:** userId, stockId, symbol, addedAt.

Indexes enforce unique emails, stock symbols, per-user holdings, and per-user watchlist entries. Buy/sell operations use MongoDB session transactions so cash, holdings, and the transaction ledger commit or roll back together. **The MongoDB deployment must support replica-set or sharded-cluster transactions.**

## API endpoints

### Authentication

- `POST /api/auth/register` — `{ "name", "email", "password" }`; creates a bcrypt-hashed account and secure JWT session.
- `POST /api/auth/login` — `{ "email", "password" }`.
- `GET /api/auth/me` — authenticated profile.
- `POST /api/auth/logout` — authenticated session-cookie removal.

### Stocks

- `GET /api/stocks?search=` — list and optionally search by symbol/company.
- `GET /api/stocks/search?q=` — search endpoint.
- `GET /api/stocks/:symbol` — stock facts and current simulated price.
- `GET /api/stocks/:symbol/chart?period=1D|1W|1M|6M|1Y` — simulated price history.

### Portfolio, trading, and watchlist

- `GET /api/portfolio` and `GET /api/portfolio/summary` — authenticated holdings and summary.
- `POST /api/transactions/buy` and `POST /api/transactions/sell` — `{ "symbol", "quantity" }`; all validation and fill-price selection happen server-side.
- `GET /api/transactions?page=1&limit=20` — authenticated transaction ledger.
- `GET /api/watchlist`, `POST /api/watchlist` with `{ "symbol" }`, and `DELETE /api/watchlist/:symbol` — authenticated, user-scoped watchlist.
- `GET /api/health` — readiness and paper-trading mode (no authentication required).

### Socket.IO

Clients receive `market:status`, `price:snapshot`, and periodic `price:update` events. Events are labeled `SIMULATED`; updates modify mock prices/valuations only.

## Trading and account safety

The server rejects unauthenticated requests, non-positive quantities, unknown stocks, buys above available virtual cash, and sells above the user's owned quantity. Trade price is read from the simulated MongoDB stock record. Valid cash, holding, and transaction changes are atomic. Portfolio P&L is current simulated value minus cost basis; the percentage is P&L divided by invested amount. INR amounts are rounded to two decimal places. **This is educational software only—not a broker, investment service, source of live quotes, or financial advice. No real-money order can be placed from this app.**
