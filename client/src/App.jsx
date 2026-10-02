import { lazy, Suspense } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import { MarketProvider } from './context/MarketContext.jsx';
import AppShell from './components/AppShell.jsx';
import LoadingSpinner from './components/LoadingSpinner.jsx';

const Login = lazy(() => import('./pages/Login.jsx'));
const Register = lazy(() => import('./pages/Register.jsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const Stocks = lazy(() => import('./pages/Stocks.jsx'));
const StockDetails = lazy(() => import('./pages/StockDetails.jsx'));
const Portfolio = lazy(() => import('./pages/Portfolio.jsx'));
const Watchlist = lazy(() => import('./pages/Watchlist.jsx'));
const Transactions = lazy(() => import('./pages/Transactions.jsx'));
const Profile = lazy(() => import('./pages/Profile.jsx'));

function AuthenticatedRoutes() {
  const { user, authReady } = useAuth();
  if (!authReady) return <div className="full-screen-state"><LoadingSpinner label="Checking your paper-trading session…" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <AppShell><Outlet /></AppShell>;
}

function GuestRoute({ children }) {
  const { user, authReady } = useAuth();
  if (!authReady) return <div className="full-screen-state"><LoadingSpinner /></div>;
  return user ? <Navigate to="/" replace /> : children;
}

export default function App({ prices = {}, marketStatus = {} }) {
  return (
    <MarketProvider value={{ prices, marketStatus }}>
      <Suspense fallback={<div className="full-screen-state"><LoadingSpinner label="Opening your simulator…" /></div>}>
        <Routes>
          <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
          <Route element={<AuthenticatedRoutes />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/stocks" element={<Stocks />} />
            <Route path="/stocks/:symbol" element={<StockDetails />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/watchlist" element={<Watchlist />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </MarketProvider>
  );
}
