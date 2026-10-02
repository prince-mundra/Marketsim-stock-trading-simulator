import { findStock, getStockChart, listStocks } from '../services/stockPriceService.js';

export async function getStocks(req, res) {
  const search = String(req.query.search || req.query.q || '').slice(0, 80);
  const stocks = await listStocks(search);
  return res.json({ stocks, dataSource: 'SIMULATED' });
}

export async function searchStocks(req, res) {
  const search = String(req.query.q || '').slice(0, 80);
  const stocks = await listStocks(search);
  return res.json({ stocks, dataSource: 'SIMULATED' });
}

export async function getStock(req, res) {
  const stock = await findStock(req.params.symbol);
  if (!stock) return res.status(404).json({ message: 'Stock not found.' });
  return res.json({ stock: { ...stock, dataSource: 'SIMULATED' } });
}

export async function getStockChartData(req, res) {
  const period = String(req.query.period || '1M').toUpperCase();
  if (!['1D', '1W', '1M', '6M', '1Y'].includes(period)) {
    return res.status(400).json({ message: 'Period must be 1D, 1W, 1M, 6M, or 1Y.' });
  }
  const stock = await getStockChart(req.params.symbol, period);
  if (!stock) return res.status(404).json({ message: 'Stock not found.' });
  return res.json({ stock });
}
