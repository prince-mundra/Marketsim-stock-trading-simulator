import { ArrowDownRight, ArrowUpRight, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatINR, formatPercent } from '../utils/formatters.js';
import WatchlistButton from './WatchlistButton.jsx';

export default function StockRow({ stock, livePrice, watched = false, onWatch, onBuy }) {
  const currentPrice = livePrice?.currentPrice ?? stock.currentPrice;
  const change = livePrice?.change ?? stock.change;
  const changePercent = livePrice?.changePercent ?? stock.changePercent;
  const positive = Number(change) >= 0;
  const ChangeIcon = positive ? ArrowUpRight : ArrowDownRight;
  return (
    <div className="stock-row">
      <Link className="stock-row__main" to={`/stocks/${encodeURIComponent(stock.symbol)}`}>
        <span className="ticker-avatar">{stock.symbol.slice(0, 1)}</span>
        <span className="stock-row__identity"><strong>{stock.symbol}</strong><small>{stock.companyName}</small></span>
      </Link>
      <div className="stock-row__price"><strong>{formatINR(currentPrice)}</strong><span className={positive ? 'positive' : 'negative'}><ChangeIcon size={13} />{formatPercent(changePercent, { signed: true })}</span></div>
      {onWatch && <WatchlistButton active={watched} onClick={() => onWatch(stock.symbol)} />}
      {onBuy && <button className="button button--subtle button--small" onClick={() => onBuy(stock)}>Buy</button>}
      <Link className="stock-row__open" to={`/stocks/${encodeURIComponent(stock.symbol)}`} aria-label={`View ${stock.symbol}`}><ChevronRight size={17} /></Link>
    </div>
  );
}
