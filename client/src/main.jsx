import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { useSocket } from './hooks/useSocket.js';
import App from './App.jsx';
import './styles.css';

function MarketConnection({ children }) {
  const { prices, marketStatus } = useSocket();
  return <App prices={prices} marketStatus={marketStatus} />;
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <MarketConnection />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
