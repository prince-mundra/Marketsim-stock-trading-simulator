import api, { getApi } from './api.js';

export const marketService = {
  async getStocks(search = '') {
    return (await getApi('/stocks', { params: search ? { search } : {} })).data;
  },
  async getStock(symbol, period = '1M') {
    return (await getApi(`/stocks/${encodeURIComponent(symbol)}/chart`, { params: { period } })).data.stock;
  },
  async getPortfolio() {
    return (await getApi('/portfolio')).data;
  },
  async getSummary() {
    return (await getApi('/portfolio/summary')).data;
  },
  async getTransactions(page = 1, limit = 20) {
    return (await getApi('/transactions', { params: { page, limit } })).data;
  },
  async getWatchlist() {
    return (await getApi('/watchlist')).data.watchlist;
  },
  async addWatchlist(symbol) {
    return (await api.post('/watchlist', { symbol })).data;
  },
  async removeWatchlist(symbol) {
    return (await api.delete(`/watchlist/${encodeURIComponent(symbol)}`)).data;
  },
  async buy(symbol, quantity) {
    return (await api.post('/transactions/buy', { symbol, quantity })).data;
  },
  async sell(symbol, quantity) {
    return (await api.post('/transactions/sell', { symbol, quantity })).data;
  },
};
