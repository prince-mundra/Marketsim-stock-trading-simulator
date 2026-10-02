import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight, BriefcaseBusiness } from 'lucide-react';
import { Link } from 'react-router-dom';
import { marketService } from '../services/marketService.js';
import { useMarketData } from '../context/MarketContext.jsx';
import { calculateHoldingValue } from '../utils/calculations.js';
import { formatINR, formatPercent, formatQuantity } from '../utils/formatters.js';
import MetricCard from '../components/MetricCard.jsx';
import BuySellModal from '../components/BuySellModal.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import StateBlock from '../components/StateBlock.jsx';

export default function Portfolio() {
  const { prices } = useMarketData();
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [trade, setTrade] = useState(null);

  const load = useCallback(async () => {
    setError('');
    try { setPortfolio(await marketService.getPortfolio()); }
    catch (requestError) { setError(requestError.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const holdings = useMemo(() => (portfolio?.holdings || []).map((item) => {
    const currentPrice = prices[item.symbol]?.currentPrice ?? item.stock?.currentPrice ?? 0;
    return { ...item, currentPrice, ...calculateHoldingValue(item.quantity, item.averageBuyPrice, currentPrice) };
  }), [portfolio, prices]);
  const metrics = useMemo(() => {
    const invested = holdings.reduce((sum, item) => sum + item.investedAmount, 0);
    const value = holdings.reduce((sum, item) => sum + item.currentValue, 0);
    const profitLoss = value - invested;
    const cash = Number(portfolio?.summary?.availableCash || 0);
    return { invested, value, profitLoss, cash, portfolioValue: cash + value, pnlPercent: invested ? profitLoss / invested * 100 : 0 };
  }, [holdings, portfolio]);

  if (loading) return <LoadingSpinner label="Loading your paper portfolio…" />;
  if (error && !portfolio) return <StateBlock kind="error" title="Portfolio unavailable" description={error} action={<button className="button button--subtle" onClick={load}>Try again</button>} />;

  return (
    <div className="page-stack">
      <div className="page-heading"><div><span className="eyebrow">ACCOUNT VIEW · INR</span><h1>Your portfolio.</h1><p>Holdings are practice positions valued using simulated prices.</p></div><Link className="button button--primary" to="/stocks">Add a position <ArrowRight size={16} /></Link></div>
      {error && <p className="inline-alert" role="alert">{error}</p>}
      <section className="metrics-grid metrics-grid--three"><MetricCard label="Portfolio value" value={metrics.portfolioValue} footnote="Virtual cash + simulated holdings" accent /><MetricCard label="Invested in holdings" value={metrics.invested} footnote={`${holdings.length} open positions`} /><MetricCard label="Unrealized P&L" value={metrics.profitLoss} change={metrics.pnlPercent} footnote="Based on simulated prices" /></section>
      <section className="panel portfolio-table-panel">
        <div className="panel-heading"><div><span className="eyebrow">OPEN POSITIONS</span><h2>Holdings <span className="count-chip">{holdings.length}</span></h2></div><Link className="text-link" to="/transactions">Trade history <ArrowRight size={14} /></Link></div>
        {holdings.length ? <div className="table-scroll"><table className="data-table portfolio-table"><thead><tr><th>Asset</th><th>Shares</th><th>Avg. buy price</th><th>Simulated price</th><th>Market value</th><th>Unrealized P&L</th><th /></tr></thead><tbody>{holdings.map((holding) => <tr key={holding.id || holding.symbol}><td><Link className="stock-cell-link" to={`/stocks/${holding.symbol}`}><span className="ticker-avatar">{holding.symbol.slice(0, 1)}</span><span><strong>{holding.symbol}</strong><small>{holding.stock?.companyName}</small></span></Link></td><td>{formatQuantity(holding.quantity)}</td><td>{formatINR(holding.averageBuyPrice)}</td><td>{formatINR(holding.currentPrice)}<small className="table-sub-label">practice price</small></td><td className="table-strong">{formatINR(holding.currentValue)}</td><td className={holding.profitLoss >= 0 ? 'positive' : 'negative'}><strong>{formatINR(holding.profitLoss)}</strong><small className="table-sub-label">{formatPercent(holding.profitLossPercent, { signed: true })}</small></td><td><button className="button button--subtle button--small" onClick={() => setTrade({ ...holding.stock, currentPrice: holding.currentPrice, availableShares: holding.quantity })}>Sell</button></td></tr>)}</tbody></table></div>
          : <div className="portfolio-empty"><span className="empty-icon"><BriefcaseBusiness size={22} /></span><h3>Your portfolio is clear.</h3><p>Choose a stock and make a simulated buy to create your first position.</p><Link className="button button--primary" to="/stocks">Explore simulated stocks <ArrowRight size={16} /></Link></div>}
      </section>
      {trade && <BuySellModal stock={trade} side="SELL" availableShares={trade.availableShares} onClose={() => setTrade(null)} onComplete={load} />}
    </div>
  );
}
