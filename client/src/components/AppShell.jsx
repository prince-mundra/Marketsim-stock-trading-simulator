import { useState } from 'react';
import { Activity, ArrowUpRight, BarChart3, ChevronDown, LayoutDashboard, ListChecks, LogOut, Menu, Search, Settings2, Wallet, X } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useMarketData } from '../context/MarketContext.jsx';

const navItems = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/stocks', label: 'Markets', icon: BarChart3 },
  { to: '/portfolio', label: 'Portfolio', icon: Wallet },
  { to: '/watchlist', label: 'Watchlist', icon: ListChecks },
  { to: '/transactions', label: 'Activity', icon: Activity },
];

export default function AppShell({ children }) {
  const { user, logout } = useAuth();
  const { marketStatus } = useMarketData();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);

  function submitSearch(event) {
    event.preventDefault();
    navigate(`/stocks${search.trim() ? `?search=${encodeURIComponent(search.trim())}` : ''}`);
    setMobileOpen(false);
  }

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="app-layout">
      <aside className={`sidebar ${mobileOpen ? 'sidebar--open' : ''}`}>
        <NavLink to="/" className="brand" onClick={() => setMobileOpen(false)}>
          <span className="brand-mark"><Activity size={17} strokeWidth={2.6} /></span>
          <span className="brand-word">market<span>sim</span></span>
          <span className="brand-dot" />
        </NavLink>
        <div className="sidebar__label">WORKSPACE</div>
        <nav className="side-nav" aria-label="Main navigation">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} onClick={() => setMobileOpen(false)} className={({ isActive }) => `side-nav__link ${isActive ? 'active' : ''}`}>
              <Icon size={18} strokeWidth={1.8} /><span>{label}</span>{label === 'Markets' && <span className="nav-arrow"><ArrowUpRight size={13} /></span>}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar__bottom">
          <div className="sim-card"><span className="sim-card__pulse" /><div><strong>Practice mode</strong><small>Simulated prices · INR</small></div></div>
          <NavLink to="/profile" className={({ isActive }) => `profile-link ${isActive ? 'active' : ''}`} onClick={() => setMobileOpen(false)}>
            <span className="avatar">{user?.name?.slice(0, 1)?.toUpperCase() || 'U'}</span>
            <span className="profile-link__text"><strong>{user?.name || 'Trader'}</strong><small>Paper account</small></span>
            <Settings2 size={16} className="profile-link__settings" />
          </NavLink>
          <button className="side-logout" onClick={handleLogout}><LogOut size={16} /> Sign out</button>
        </div>
      </aside>
      {mobileOpen && <button className="sidebar-scrim" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
      <main className="main-column">
        <header className="topbar">
          <button className="mobile-menu icon-button" onClick={() => setMobileOpen(!mobileOpen)} aria-label={mobileOpen ? 'Close menu' : 'Open menu'}>{mobileOpen ? <X size={20} /> : <Menu size={20} />}</button>
          <form className="global-search" onSubmit={submitSearch}>
            <Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search symbols or companies…" aria-label="Search stocks" /><kbd>↵</kbd>
          </form>
          <div className="topbar__right">
            <span className={`market-live ${marketStatus?.dataSource === 'SIMULATED' ? 'market-live--on' : ''}`}><span />{marketStatus?.dataSource === 'SIMULATED' ? 'SIMULATED' : 'PAPER MODE'}</span>
            <button className="topbar-user" onClick={() => navigate('/profile')} aria-label="Open profile"><span className="avatar avatar--small">{user?.name?.slice(0, 1)?.toUpperCase() || 'U'}</span><ChevronDown size={14} /></button>
          </div>
        </header>
        <div className="mobile-disclaimer"><span>SIMULATED MARKET</span> Prices and orders are practice-only.</div>
        <div className="page-content">{children || <Outlet />}</div>
      </main>
    </div>
  );
}
