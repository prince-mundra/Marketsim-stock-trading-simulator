import { createContext, useContext } from 'react';

const MarketContext = createContext({ prices: {}, marketStatus: { dataSource: 'SIMULATED' } });

export function MarketProvider({ value, children }) {
  return <MarketContext.Provider value={value}>{children}</MarketContext.Provider>;
}

export function useMarketData() {
  return useContext(MarketContext);
}
