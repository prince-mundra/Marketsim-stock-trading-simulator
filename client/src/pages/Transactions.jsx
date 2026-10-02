import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Clock3 } from 'lucide-react';
import { marketService } from '../services/marketService.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import StateBlock from '../components/StateBlock.jsx';
import TransactionTable from '../components/TransactionTable.jsx';

export default function Transactions() {
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ transactions: [], total: 0, hasMore: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try { setResult(await marketService.getTransactions(page, 20)); }
    catch (requestError) { setError(requestError.message); }
    finally { setLoading(false); }
  }, [page]);
  useEffect(() => { load(); }, [load]);

  return (
    <div className="page-stack">
      <div className="page-heading"><div><span className="eyebrow">PAPER-TRADE LEDGER</span><h1>Every move, recorded.</h1><p>Completed simulated buys and sells from your account.</p></div><span className="tag tag--simulated"><span /> no real orders</span></div>
      <section className="panel transaction-panel"><div className="panel-heading"><div><span className="eyebrow">YOUR ACTIVITY</span><h2>Transaction history <span className="count-chip">{result.total}</span></h2></div><span className="muted-label"><Clock3 size={14} /> Most recent first</span></div>
        {loading ? <LoadingSpinner compact label="Loading transaction history…" /> : error ? <StateBlock kind="error" title="History unavailable" description={error} action={<button className="button button--subtle" onClick={load}>Try again</button>} /> : <TransactionTable transactions={result.transactions} />}
        <div className="pagination"><span>Page {page} · {result.total} total paper trades</span><div><button className="button button--subtle button--small" disabled={page <= 1 || loading} onClick={() => setPage((current) => Math.max(1, current - 1))}><ArrowLeft size={14} /> Previous</button><button className="button button--subtle button--small" disabled={!result.hasMore || loading} onClick={() => setPage((current) => current + 1)}>Next <ArrowRight size={14} /></button></div></div>
      </section>
    </div>
  );
}
