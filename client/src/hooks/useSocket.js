import { useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';

export function useSocket() {
  const [prices, setPrices] = useState({});
  const [marketStatus, setMarketStatus] = useState({ mode: 'PAPER_TRADING', dataSource: 'SIMULATED' });

  useEffect(() => {
    const socket = io('/', { withCredentials: true, transports: ['websocket', 'polling'] });
    socket.on('market:status', setMarketStatus);
    socket.on('price:snapshot', (snapshot) => {
      setPrices(Object.fromEntries(snapshot.map((item) => [item.symbol, item])));
    });
    socket.on('price:update', (update) => {
      setPrices((current) => ({
        ...current,
        ...Object.fromEntries((update.prices || []).map((item) => [item.symbol, item])),
      }));
    });
    return () => socket.close();
  }, []);

  return useMemo(() => ({ prices, marketStatus }), [prices, marketStatus]);
}
