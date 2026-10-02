import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowDownWideNarrow, ArrowRight, BookmarkPlus, Plus, Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { marketService } from '../services/marketService.js';
import { useMarketData } from '../context/MarketContext.jsx';
import { formatINR, formatPercent } from '../utils/formatters.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import StateBlock from '../components/StateBlock.jsx';

export default function Watchlist() {
  const { prices } = useMarketData();
  const [items, setItems] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [search, setSearch] = useState('');
  const [addSearch, setAddSearch] = useState('');
  const [sort, setSort] = useState('added');
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const [watchlist, stockResult] = await Promise.all([marketService.getWatchlist(), marketService.getStocks()]);
      setItems(watchlist);
      setStocks(stockResult.stocks);
    } catch (requestError) { setError(requestError.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => items.filter((item) => `${item.symbol} ${item.stock?.companyName || ''}`.toLowerCase().includes(search.toLowerCase().trim())).sort((a, b) => {
    if (sort === 'price') return (prices[b.symbol]?.currentPrice ?? b.stock?.currentPrice ?? 0) - (prices[a.symbol]?.currentPrice ?? a.stock?.currentPrice ?? 0);
    if (sort === 'change') return (prices[b.symbol]?.changePercent ?? b.stock?.changePercent ?? 0) - (prices[a.symbol]?.changePercent ?? a.stock?.changePercent ?? 0);
    if (sort === 'symbol') return a.symbol.localeCompare(b.symbol);
    return new Date(b.addedAt) - new Date(a.addedAt);
  }), [items, search, sort, prices]);
  const addMatches = stocks.filter((stock) => !items.some((item) => item.symbol === stock.symbol) && `${stock.symbol} ${stock.companyName}`.toLowerCase().includes(addSearch.toLowerCase().trim())).slice(0, 5);

  async function add(symbol) {
    try {
      await marketService.addWatchlist(symbol);
      setAddSearch('');
      setAdding(false);
      await load();
    } catch (requestError) { setError(requestError.message); }
  }
  async function remove(symbol) {
    try { await marketService.removeWatchlist(symbol); setItems((current) => current.filter((item) => item.symbol !== symbol)); }
    catch (requestError) { setError(requestError.message); }
  }

  if (loading) return <LoadingSpinner label="Loading your watchlist…" />;
  return (
    <div className="page-stack">
      <div className="page-heading"><div><span className="eyebrow">YOUR MARKET SHORTLIST</span><h1>Watch closely.</h1><p>Follow simulated price movement, then open a stock to learn more.</p></div><button className="button button--primary" onClick={() => setAdding(!adding)}><Plus size={16} /> Add a symbol</button></div>
      <div className="sim-disclosure"><BookmarkPlus size={16} /><span>Saved to your account</span> Watchlist entries are private to your paper-trading profile; displayed prices are simulated.</div>
      {error && <p className="inline-alert" role="alert">{error}</p>}
      {adding && <section className="panel add-watch-panel"><div className="panel-heading"><div><span className="eyebrow">ADD TO WATCHLIST</span><h2>Choose a simulated symbol</h2></div><button className="icon-button" onClick={() => setAdding(false)} aria-label="Close add panel"><X size={17} /></button></div><label className="table-search"><Search size={16} /><input autoFocus value={addSearch} onChange={(event) => setAddSearch(event.target.value)} placeholder="Search symbol or company" /></label><div className="add-symbol-results">{addMatches.length ? addMatches.map((stock) => <button className="add-symbol-row" key={stock.symbol} onClick={() => add(stock.symbol)}><span className="ticker-avatar">{stock.symbol.slice(0, 1)}</span><span><strong>{stock.symbol}</strong><small>{stock.companyName}</small></span><span className="add-symbol-row__price">{formatINR(prices[stock.symbol]?.currentPrice ?? stock.currentPrice)}<Plus size={15} /></span></button>) : <p className="field-hint">No matching unlisted symbols.</p>}</div></section>}
      <section className="panel watchlist-table-panel"><div className="market-tools"><label className="table-search"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Filter your watchlist" aria-label="Filter watchlist" /></label><div className="sort-tools"><ArrowDownWideNarrow size={15} /><label htmlFor="watch-sort">Sort</label><select id="watch-sort" value={sort} onChange={(event) => setSort(event.target.value)}><option value="added">Recently added</option><option value="symbol">Symbol A–Z</option><option value="price">Price</option><option value="change">Daily move</option></select></div></div>
        {filtered.length ? <div className="watch-cards">{filtered.map((item) => {
          const stock = item.stock || { symbol: item.symbol, companyName: item.symbol };
          const live = prices[item.symbol];
          const price = live?.currentPrice ?? stock.currentPrice ?? 0;
          const change = live?.change ?? stock.change ?? 0;
          const changePercent = live?.changePercent ?? stock.changePercent ?? 0;
          return <article className="watch-card" key={item.id || item.symbol}><div className="watch-card__top"><Link to={`/stocks/${item.symbol}`} className="stock-row__main"><span className="ticker-avatar">{item.symbol.slice(0, 1)}</span><span className="stock-row__identity"><strong>{item.symbol}</strong><small>{stock.companyName}</small></span></Link><button className="icon-button icon-button--danger" onClick={() => remove(item.symbol)} aria-label={`Remove ${item.symbol}`}><X size={16} /></button></div><div className="watch-card__price"><strong>{formatINR(price)}</strong><span className={`${change >= 0 ? 'positive' : 'negative'}`}>{formatPercent(changePercent, { signed: true })}</span></div><div className="watch-card__foot"><span className="tag tag--simulated"><span /> simulated</span><Link className="text-link" to={`/stocks/${item.symbol}`}>View stock <ArrowRight size={13} /></Link></div></article>;
        })}</div> : <StateBlock title={search ? 'No matches in your watchlist' : 'Your watchlist is empty'} description={search ? 'Try another ticker or company name.' : 'Add a symbol to start tracking its simulated movement.'} action={!search && <button className="button button--subtle" onClick={() => setAdding(true)}>Add your first symbol</button>} />}
      </section>
    </div>
  );
}
