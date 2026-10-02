import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatINR, formatDate } from '../utils/formatters.js';

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return <div className="chart-tooltip"><span>{formatDate(point.time, { hour: '2-digit', minute: '2-digit' })}</span><strong>{formatINR(point.price)}</strong></div>;
}

export default function PriceChart({ data = [], id = 'price', height = 270 }) {
  const chartData = data.map((point) => ({ ...point, time: new Date(point.time).getTime() }));
  return (
    <div className="price-chart" style={{ height }} aria-label="Simulated price chart">
      {chartData.length > 1 ? (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs><linearGradient id={`fill-${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#c9f36a" stopOpacity={0.26} /><stop offset="95%" stopColor="#c9f36a" stopOpacity={0} /></linearGradient></defs>
            <CartesianGrid stroke="#263029" strokeDasharray="3 5" vertical={false} />
            <XAxis dataKey="time" type="number" scale="time" domain={['dataMin', 'dataMax']} tickFormatter={(value) => new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit' }).format(value)} stroke="#69756b" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} minTickGap={34} />
            <YAxis orientation="right" domain={['auto', 'auto']} tickFormatter={(value) => `₹${new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 }).format(value)}`} stroke="#69756b" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} width={54} />
            <Tooltip content={<ChartTooltip />} />
            <Area type="monotone" dataKey="price" stroke="#c9f36a" strokeWidth={2} fill={`url(#fill-${id})`} activeDot={{ r: 4, fill: '#c9f36a', stroke: '#0c100d', strokeWidth: 2 }} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      ) : <div className="chart-empty">Price history will appear as simulated ticks arrive.</div>}
    </div>
  );
}
