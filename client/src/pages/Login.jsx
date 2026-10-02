import { useState } from 'react';
import { Activity, ArrowRight, LockKeyhole, Mail } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(form);
      navigate(location.state?.from || '/', { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-story">
        <Link className="brand brand--auth" to="/login"><span className="brand-mark"><Activity size={17} /></span><span className="brand-word">market<span>sim</span></span><span className="brand-dot" /></Link>
        <div className="auth-story__content"><span className="eyebrow eyebrow--lime">PAPER-TRADING WORKSPACE</span><h1>Build your<br /><em>market instincts.</em></h1><p>Explore a simulated Indian market, test your thinking, and learn how every decision moves a portfolio.</p><div className="auth-story__balance"><span>YOUR PRACTICE ACCOUNT STARTS WITH</span><strong>₹100,000</strong><small>Virtual cash · no real orders</small></div></div>
        <div className="auth-story__footer"><span>Practice, not prediction.</span><span>Prices are simulated</span></div>
      </section>
      <section className="auth-form-wrap">
        <div className="auth-form-card">
          <span className="eyebrow">WELCOME BACK</span><h2>Sign in to your workspace</h2><p className="muted">Continue where your paper portfolio left off.</p>
          <form onSubmit={submit} className="form-stack">
            <label className="field-label" htmlFor="login-email">Email address</label>
            <div className="input-wrap"><Mail size={17} /><input id="login-email" className="input" type="email" autoComplete="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@example.com" /></div>
            <label className="field-label" htmlFor="login-password">Password</label>
            <div className="input-wrap"><LockKeyhole size={17} /><input id="login-password" className="input" type="password" autoComplete="current-password" required value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="Your password" /></div>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="button button--primary auth-submit" disabled={busy}>{busy ? 'Signing in…' : <>Sign in <ArrowRight size={17} /></>}</button>
          </form>
          <p className="auth-switch">New to the simulator? <Link to="/register">Create an account</Link></p>
          <div className="auth-note"><LockKeyhole size={14} /> Your practice balance has no cash value.</div>
        </div>
      </section>
    </main>
  );
}
