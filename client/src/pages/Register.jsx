import { useState } from 'react';
import { Activity, ArrowRight, LockKeyhole, Mail, UserRound } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await register(form);
      navigate('/', { replace: true });
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
        <div className="auth-story__content"><span className="eyebrow eyebrow--lime">A CLEAR-HEADED PRACTICE FLOOR</span><h1>Learn by<br /><em>making a move.</em></h1><p>Build a virtual portfolio with INR-denominated practice cash and price changes made for learning.</p><div className="auth-story__balance"><span>YOUR FIRST PAPER BALANCE</span><strong>₹100,000</strong><small>Simulated · no real-money value</small></div></div>
        <div className="auth-story__footer"><span>Practice, not prediction.</span><span>Prices are simulated</span></div>
      </section>
      <section className="auth-form-wrap"><div className="auth-form-card">
        <span className="eyebrow">GET STARTED</span><h2>Create your paper account</h2><p className="muted">Set up your workspace in a moment.</p>
        <form onSubmit={submit} className="form-stack">
          <label className="field-label" htmlFor="register-name">Full name</label><div className="input-wrap"><UserRound size={17} /><input id="register-name" className="input" autoComplete="name" required minLength={2} maxLength={80} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Your name" /></div>
          <label className="field-label" htmlFor="register-email">Email address</label><div className="input-wrap"><Mail size={17} /><input id="register-email" className="input" type="email" autoComplete="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@example.com" /></div>
          <label className="field-label" htmlFor="register-password">Password</label><div className="input-wrap"><LockKeyhole size={17} /><input id="register-password" className="input" type="password" autoComplete="new-password" required minLength={8} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="At least 8 characters" /></div>
          <p className="field-hint">Use 8 or more characters. Passwords are hashed before storage.</p>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button button--primary auth-submit" disabled={busy}>{busy ? 'Creating account…' : <>Create account <ArrowRight size={17} /></>}</button>
        </form>
        <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
        <div className="auth-note"><LockKeyhole size={14} /> This simulator never places real brokerage orders.</div>
      </div></section>
    </main>
  );
}
