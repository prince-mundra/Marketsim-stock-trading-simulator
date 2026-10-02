import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { formatDate, formatINR, formatQuantity } from '../utils/formatters.js';
import StateBlock from './StateBlock.jsx';

export default function TransactionTable({ transactions = [], compact = false }) {
  if (!transactions.length) return <StateBlock title="No paper trades yet" description="Your simulated buys and sells will show up here." />;
  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead><tr><th>Activity</th><th>Symbol</th><th>Shares</th><th>Price / share</th><th>Total</th>{!compact && <th>Date</th>}</tr></thead>
        <tbody>
          {transactions.map((item) => {
            const isBuy = item.type === 'BUY';
            const Icon = isBuy ? ArrowDownLeft : ArrowUpRight;
            return <tr key={item.id || item._id}>
              <td><span className={`trade-type ${isBuy ? 'trade-type--buy' : 'trade-type--sell'}`}><Icon size={14} />{isBuy ? 'Buy' : 'Sell'}</span></td>
              <td><span className="symbol-cell">{item.symbol}</span></td>
              <td>{formatQuantity(item.quantity)}</td>
              <td>{formatINR(item.price)}</td>
              <td className="table-strong">{formatINR(item.totalAmount)}</td>
              {!compact && <td className="muted">{formatDate(item.createdAt, { hour: '2-digit', minute: '2-digit' })}</td>}
            </tr>;
          })}
        </tbody>
      </table>
    </div>
  );
}
