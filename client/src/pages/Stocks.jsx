import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowDownWideNarrow, ArrowUpRight, Search, SlidersHorizontal } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { marketService } from '../services/marketService.js';
import { useMarketData } from '../context/MarketContext.jsx';
import { formatINR, formatPercent } from '../utils/formatters.js';
import BuySellModal from '../components/BuySellModal.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import StateBlock from '../components/StateBlock.jsx';

export default function Stocks() {
  const [params, setParams] = useSearchParams();
  const { prices } = useMarketData();
  const [query, setQuery] = useState(params.get('search') || '');
  const [stocks, setStocks] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [sort, setSort] = useState('symbol');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tradeStock, setTradeStock] = useState(null);

  const loadWatchlist = useCallback(async () => {
    try { setWatchlist(await marketService.getWatchlist()); } catch (requestError) { setError(requestError.message); }
  }, []);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const result = await marketService.getStocks(query);
        if (active) setStocks(result.stocks);
      } catch (requestError) {
        if (active) setError(requestError.message);
      } finally {
        if (active) setLoading(false);
      }
    }, 180);
    return () => { active = false; window.clearTimeout(timer); };
  }, [query]);

  useEffect(() => { loadWatchlist(); }, [loadWatchlist]);

  const sortedStocks = useMemo(() => [...stocks].sort((a, b) => {
    if (sort === 'price') return (prices[b.symbol]?.currentPrice ?? b.currentPrice) - (prices[a.symbol]?.currentPrice ?? a.currentPrice);
    if (sort === 'change') return (prices[b.symbol]?.changePercent ?? b.changePercent) - (prices[a.symbol]?.changePercent ?? a.changePercent);
    return a.symbol.localeCompare(b.symbol);
  }), [stocks, sort, prices]);

  async function toggleWatch(symbol) {
    const active = watchlist.some((item) => item.symbol === symbol);
    try {
      if (active) await marketService.removeWatchlist(symbol);
      else await marketService.addWatchlist(symbol);
      await loadWatchlist();
    } catch (requestError) { setError(requestError.message); }
  }

  function updateSearch(value) {
    setQuery(value);
    const next = new URLSearchParams(params);
    if (value) next.set('search', value); else next.delete('search');
    setParams(next, { replace: true });
  }

  const positiveCount = stocks.filter((stock) => (prices[stock.symbol]?.change ?? stock.change) >= 0).length;
  return (
    <div className="page-stack">
      <div className="page-heading"><div><span className="eyebrow">MARKET DESK · INDIAN EQUITIES</span><h1>Find your next move.</h1><p>Search simulated stock scenarios and build a watchlist before you paper trade.</p></div><span className="tag tag--simulated"><span /> mock prices only</span></div>
      <div className="market-overview-strip"><div><span className="market-overview-strip__icon"><ArrowUpRight size={17} /></span><div><small>SIMULATED UNIVERSE</small><strong>{stocks.length} symbols</strong></div></div><span className="market-overview-strip__divider" /><div><div className="market-pulse"><i /><i /><i /><i /><i /></div><div><small>POSITIVE SCENARIOS</small><strong>{positiveCount} of {stocks.length}</strong></div></div><span className="market-overview-strip__note">Training data · not market quotes</span></div>
      <section className="panel market-table-panel">
        <div className="market-tools"><label className="table-search"><Search size={17} /><input value={query} onChange={(event) => updateSearch(event.target.value)} placeholder="Search ticker or company" aria-label="Search ticker or company" /><kbd>/</kbd></label><div className="sort-tools"><SlidersHorizontal size={15} /><label htmlFor="market-sort">Sort</label><select id="market-sort" value={sort} onChange={(event) => setSort(event.target.value)}><option value="symbol">Symbol A–Z</option><option value="price">Price</option><option value="change">Daily move</option></select><ArrowDownWideNarrow size={15} /></div></div>
        <div className="market-table-head"><span>COMPANY / TICKER</span><span>SIMULATED PRICE</span><span>DAY MOVE</span><span>ACTIONS</span></div>
        {loading ? <LoadingSpinner compact label="Searching simulated symbols…" /> : error ? <StateBlock kind="error" title="Couldn’t load stocks" description={error} action={<button className="button button--subtle" onClick={() => setQuery(query)}>Try again</button>} /> : sortedStocks.length ? <div className="market-stock-list">{sortedStocks.map((stock) => {
          const live = prices[stock.symbol];
          const price = live?.currentPrice ?? stock.currentPrice;
          const change = live?.change ?? stock.change;
          const changePercent = live?.changePercent ?? stock.changePercent;
          const active = watchlist.some((item) => item.symbol === stock.symbol);
          return <div className="market-stock-row" key={stock.symbol}>
            <div className="stock-row__main"><span className="ticker-avatar">{stock.symbol.slice(0, 1)}</span><div className="stock-row__identity"><strong>{stock.symbol}</strong><small>{stock.companyName}</small></div></div>
            <div><strong className="market-stock-price">{formatINR(price)}</strong><small className="muted block">INR · simulated</small></div>
            <div className={`market-stock-change ${change >= 0 ? 'positive' : 'negative'}`}>{formatPercent(changePercent, { signed: true })}</div>
            <div className="market-stock-actions"><button className="button button--subtle button--small" onClick={() => setTradeStock({ ...stock, currentPrice: price })}>Buy</button><button type="button" className={`icon-button ${active ? 'icon-button--active' : ''}`} onClick={() => toggleWatch(stock.symbol)} aria-label={active ? 'Remove from watchlist' : 'Add to watchlist'}>{active ? '★' : '☆'}</button><Link className="stock-row__open" to={`/stocks/${encodeURIComponent(stock.symbol)}`} aria-label={`View ${stock.symbol}`}><ArrowUpRight size={15} /></Link></div>
          </div>;
        })}</div> : <StateBlock title="No symbols found" description="Try a ticker like TCS, INFY, or a company name." />}
        <div className="market-table-foot"><span>Prices are generated by a controlled simulator, not a market-data provider.</span><span>{sortedStocks.length} shown</span></div>
      </section>
      {tradeStock && <BuySellModal stock={tradeStock} onClose={() => setTradeStock(null)} onComplete={loadWatchlist} />}
    </div>
  );
}
