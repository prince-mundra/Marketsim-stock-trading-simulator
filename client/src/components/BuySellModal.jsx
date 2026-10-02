import { useEffect, useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, X } from 'lucide-react';
import { marketService } from '../services/marketService.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatINR, formatQuantity } from '../utils/formatters.js';

export default function BuySellModal({ stock, side = 'BUY', onClose, onComplete, availableShares = 0 }) {
  const [quantity, setQuantity] = useState('1');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const { user, refreshUser } = useAuth();
  const price = Number(stock?.currentPrice) || 0;
  const shares = Number(quantity);
  const total = useMemo(() => Math.round((shares * price + Number.EPSILON) * 100) / 100, [shares, price]);
  const isBuy = side === 'BUY';
  const canSubmit = Number.isFinite(shares) && shares > 0 && total > 0
    && (isBuy ? total <= Number(user?.virtualBalance || 0) : shares <= availableShares);

  useEffect(() => {
    const closeOnEscape = (event) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  if (!stock) return null;

  async function handleSubmit(event) {
    event.preventDefault();
    if (!canSubmit || busy) return;
    setBusy(true);
    setError('');
    try {
      const result = isBuy
        ? await marketService.buy(stock.symbol, shares)
        : await marketService.sell(stock.symbol, shares);
      await refreshUser();
      await onComplete?.(result);
      onClose();
    } catch (requestError) {
      setError(requestError.message || 'The simulated order could not be completed.');
    } finally {
      setBusy(false);
    }
  }

  const OrderIcon = isBuy ? ArrowDownLeft : ArrowUpRight;
  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="trade-modal" role="dialog" aria-modal="true" aria-labelledby="trade-title">
        <header className="trade-modal__header">
          <div><span className={`trade-modal__icon ${isBuy ? 'buy' : 'sell'}`}><OrderIcon size={18} /></span><div><p className="eyebrow">Paper trade · simulated price</p><h2 id="trade-title">{isBuy ? 'Buy' : 'Sell'} {stock.symbol}</h2></div></div>
          <button className="icon-button" onClick={onClose} aria-label="Close trade dialog"><X size={18} /></button>
        </header>
        <form onSubmit={handleSubmit}>
          <div className="trade-modal__stock"><span>{stock.companyName}</span><strong>{formatINR(price)} <small>/ share</small></strong></div>
          <label className="field-label" htmlFor="trade-quantity">Quantity</label>
          <input id="trade-quantity" className="input" inputMode="decimal" type="number" min="0.000001" step="any" value={quantity} onChange={(event) => setQuantity(event.target.value)} autoFocus />
          <div className="trade-modal__limits"><span>Available {isBuy ? 'cash' : 'shares'}</span><strong>{isBuy ? formatINR(user?.virtualBalance) : formatQuantity(availableShares)}</strong></div>
          <div className="trade-modal__total"><span>Estimated order total</span><strong>{formatINR(total)}</strong></div>
          <p className="trade-modal__note">This order uses a simulated price and virtual INR only. No real broker or money is involved.</p>
          {error && <p className="form-error" role="alert">{error}</p>}
          {!isBuy && shares > availableShares && <p className="form-error">You can sell up to {formatQuantity(availableShares)} shares.</p>}
          {isBuy && total > Number(user?.virtualBalance || 0) && <p className="form-error">Your available virtual cash is not enough for this order.</p>}
          <button className={`button ${isBuy ? 'button--primary' : 'button--danger'}`} type="submit" disabled={!canSubmit || busy}>
            {busy ? 'Processing paper order…' : `Confirm ${isBuy ? 'simulated buy' : 'simulated sell'}`}
          </button>
        </form>
      </section>
    </div>
  );
}
