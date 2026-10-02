import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { formatINR, formatPercent } from '../utils/formatters.js';

export default function MetricCard({ label, value, currency = true, change, footnote, accent = false }) {
  const numeric = Number(value) || 0;
  const positive = numeric > 0;
  const negative = numeric < 0;
  const Icon = positive ? ArrowUpRight : negative ? ArrowDownRight : Minus;
  return (
    <article className={`metric-card ${accent ? 'metric-card--accent' : ''}`}>
      <p className="eyebrow">{label}</p>
      <strong className="metric-card__value">{currency ? formatINR(numeric) : new Intl.NumberFormat('en-IN').format(numeric)}</strong>
      {change !== undefined && (
        <p className={`metric-card__change ${positive ? 'positive' : negative ? 'negative' : ''}`}>
          <Icon size={15} /> {formatPercent(change, { signed: true })}
          {footnote && <span className="muted">{footnote}</span>}
        </p>
      )}
      {!change && footnote && <p className="metric-card__footnote">{footnote}</p>}
    </article>
  );
}
