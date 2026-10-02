const rupee = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatINR(value, options = {}) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return rupee.format(0);
  if (options.compact && Math.abs(amount) >= 10_000_000) {
    return `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2, notation: 'compact' }).format(amount)}`;
  }
  return rupee.format(amount);
}

export function formatQuantity(value) {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 6 }).format(Number(value) || 0);
}

export function formatPercent(value, { signed = false } = {}) {
  const amount = Number(value) || 0;
  const prefix = signed && amount > 0 ? '+' : '';
  return `${prefix}${amount.toFixed(2)}%`;
}

export function formatDate(value, options = {}) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', ...options,
  }).format(date);
}
