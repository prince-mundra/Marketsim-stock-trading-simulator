import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight, CircleDollarSign, Clock3, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useMarketData } from '../context/MarketContext.jsx';
import { marketService } from '../services/marketService.js';
import { calculateHoldingValue } from '../utils/calculations.js';
import { formatINR, formatPercent } from '../utils/formatters.js';
import BuySellModal from '../components/BuySellModal.jsx';
import MetricCard from '../components/MetricCard.jsx';
import PriceChart from '../components/PriceChart.jsx';
import StockRow from '../components/StockRow.jsx';
import StateBlock from '../components/StateBlock.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import TransactionTable from '../components/TransactionTable.jsx';

export default function Dashboard() {
  const { user } = useAuth();
  const { prices } = useMarketData();
  const [data, setData] = useState({ portfolio: null, stocks: [], watchlist: [], transactions: [] });
  const [loading, setLoading] = useState(true);
  const [watchlistLoading, setWatchlistLoading] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [error, setError] = useState('');
  const [tradeStock, setTradeStock] = useState(null);

  const load = useCallback(async () => {
    setError('');
    setWatchlistLoading(true);
    setTransactionsLoading(true);
    const watchlistRequest = marketService.getWatchlist()
      .then((watchlist) => setData((current) => ({ ...current, watchlist })))
      .catch((requestError) => setError(requestError.message))
      .finally(() => setWatchlistLoading(false));
    const transactionRequest = marketService.getTransactions(1, 6)
      .then((result) => setData((current) => ({ ...current, transactions: result.transactions })))
      .catch((requestError) => setError(requestError.message))
      .finally(() => setTransactionsLoading(false));
    try {
      const [portfolio, stocksResult] = await Promise.all([
        marketService.getPortfolio(), marketService.getStocks(),
      ]);
      setData((current) => ({ ...current, portfolio, stocks: stocksResult.stocks }));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
    await Promise.all([watchlistRequest, transactionRequest]);
  }, []);

  useEffect(() => { load(); }, [load]);

  const liveHoldings = useMemo(() => (data.portfolio?.holdings || []).map((holding) => {
    const currentPrice = prices[holding.symbol]?.currentPrice ?? holding.stock?.currentPrice ?? 0;
    const metrics = calculateHoldingValue(holding.quantity, holding.averageBuyPrice, currentPrice);
    return { ...holding, stock: { ...holding.stock, currentPrice }, ...metrics };
  }), [data.portfolio, prices]);

  const liveSummary = useMemo(() => {
    const invested = liveHoldings.reduce((sum, item) => sum + item.investedAmount, 0);
    const holdingsValue = liveHoldings.reduce((sum, item) => sum + item.currentValue, 0);
    const profitLoss = holdingsValue - invested;
    const todayChange = liveHoldings.reduce((sum, item) => sum + item.quantity * (prices[item.symbol]?.change ?? item.stock?.change ?? 0), 0);
    const cash = Number(data.portfolio?.summary?.availableCash ?? user?.virtualBalance ?? 0);
    return {
      totalPortfolioValue: cash + holdingsValue,
      totalInvested: invested,
      availableCash: cash,
      profitLoss,
      profitLossPercent: invested ? profitLoss / invested * 100 : 0,
      todayChange,
      numberOfHoldings: liveHoldings.length,
    };
  }, [liveHoldings, data.portfolio, user, prices]);

  const chartData = useMemo(() => {
    if (!liveHoldings.length) return [];
    const stocks = new Map(data.stocks.map((stock) => [stock.symbol, stock]));
    return Array.from({ length: 96 }, (_, index) => {
      let value = 0;
      let time = null;
      for (const holding of liveHoldings) {
        const points = stocks.get(holding.symbol)?.priceHistory || [];
        const point = points[Math.max(0, points.length - 96 + index)];
        value += holding.quantity * (point?.price ?? holding.stock?.currentPrice ?? 0);
        time ||= point?.time;
      }
      return { time: time || new Date(Date.now() - (95 - index) * 900_000), price: Math.round((value + Number.EPSILON) * 100) / 100 };
    });
  }, [liveHoldings, data.stocks]);

  async function toggleWatch(symbol) {
    const active = data.watchlist.some((item) => item.symbol === symbol);
    try {
      if (active) await marketService.removeWatchlist(symbol);
      else await marketService.addWatchlist(symbol);
      const watchlist = await marketService.getWatchlist();
      setData((current) => ({ ...current, watchlist }));
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  if (loading) return <LoadingSpinner label="Loading your portfolio and the simulated market…" />;
  if (error && !data.portfolio) return <StateBlock kind="error" title="Dashboard couldn’t load" description={error} action={<button className="button button--subtle" onClick={load}>Try again</button>} />;

  return (
    <div className="page-stack">
      <div className="page-heading">
        <div><span className="eyebrow">YOUR PRACTICE DESK · NSE SIMULATION</span><h1>Good to see you, {user?.name?.split(' ')[0] || 'Trader'}.</h1><p>Simulated prices. Real learning. No real-money trades.</p></div>
        <Link className="button button--primary" to="/stocks">Explore markets <ArrowRight size={16} /></Link>
      </div>
      {error && <p className="inline-alert" role="alert">{error}</p>}
      <div className="paper-banner"><span className="paper-banner__icon"><Sparkles size={16} /></span><div><strong>Paper mode is on</strong><span>Every price and order here is simulated. Nothing is sent to a brokerage.</span></div><span className="paper-banner__balance">₹100k <small>starting cash</small></span></div>
      <section className="metrics-grid">
        <MetricCard label="Total portfolio value" value={liveSummary.totalPortfolioValue} footnote="Virtual cash + holdings" accent />
        <MetricCard label="Available cash" value={liveSummary.availableCash} footnote="Ready for simulated trades" />
        <MetricCard label="Total P&L" value={liveSummary.profitLoss} change={liveSummary.profitLossPercent} footnote="Unrealized · simulated" />
        <MetricCard label="Today's change" value={liveSummary.todayChange} footnote={`${liveSummary.numberOfHoldings} open ${liveSummary.numberOfHoldings === 1 ? 'position' : 'positions'}`} />
      </section>
      <section className="dashboard-grid dashboard-grid--primary">
        <article className="panel portfolio-chart-panel">
          <div className="panel-heading"><div><span className="eyebrow">PORTFOLIO TRACKER</span><h2>{formatINR(liveSummary.totalPortfolioValue)}</h2></div><span className="tag tag--simulated"><span /> simulated</span></div>
          <p className="panel-subtitle">Your holdings move with the practice market. Cash remains virtual.</p>
          {chartData.length > 1 ? <PriceChart data={chartData} id="portfolio" height={244} /> : <div className="portfolio-chart-empty"><CircleDollarSign size={25} /><strong>Your chart starts with your first holding</strong><span>Explore the market to make your first paper trade.</span><Link to="/stocks" className="text-link">Browse simulated stocks <ArrowRight size={14} /></Link></div>}
          <div className="chart-footer"><span><i className="legend-dot" /> Portfolio value · INR</span><span><Clock3 size={13} /> updates every few seconds</span></div>
        </article>
        <article className="panel watchlist-panel">
          <div className="panel-heading"><div><span className="eyebrow">KEEP AN EYE ON</span><h2>Your watchlist</h2></div><Link to="/watchlist" className="icon-link" aria-label="View full watchlist"><ArrowRight size={17} /></Link></div>
          {watchlistLoading ? <LoadingSpinner label="Loading watchlist…" compact /> : <div className="rows-list rows-list--compact">
            {data.watchlist.length ? data.watchlist.slice(0, 5).map((entry) => <StockRow key={entry.id || entry.symbol} stock={entry.stock || { symbol: entry.symbol, companyName: entry.symbol }} livePrice={prices[entry.symbol]} onWatch={toggleWatch} watched />)
              : <div className="panel-empty"><span>Add a few symbols to follow their simulated movement.</span><Link to="/stocks" className="text-link">Find stocks <ArrowRight size={14} /></Link></div>}
          </div>}
        </article>
      </section>
      <section className="dashboard-grid dashboard-grid--secondary">
        <article className="panel"><div className="panel-heading"><div><span className="eyebrow">YOUR LATEST MOVES</span><h2>Recent paper trades</h2></div><Link to="/transactions" className="text-link">See history <ArrowRight size={14} /></Link></div>{transactionsLoading ? <LoadingSpinner label="Loading recent activity…" compact /> : <TransactionTable transactions={data.transactions} compact />}</article>
        <article className="panel"><div className="panel-heading"><div><span className="eyebrow">SIMULATED MARKET</span><h2>Stocks to explore</h2></div><Link to="/stocks" className="icon-link" aria-label="Browse all stocks"><ArrowRight size={17} /></Link></div><div className="rows-list rows-list--compact">{data.stocks.slice(0, 5).map((stock) => <StockRow key={stock.symbol} stock={stock} livePrice={prices[stock.symbol]} onBuy={setTradeStock} />)}</div></article>
      </section>
      {tradeStock && <BuySellModal stock={{ ...tradeStock, currentPrice: prices[tradeStock.symbol]?.currentPrice ?? tradeStock.currentPrice }} onClose={() => setTradeStock(null)} onComplete={load} />}
    </div>
  );
}
