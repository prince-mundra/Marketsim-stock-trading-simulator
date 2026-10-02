import Stock from '../models/Stock.js';
import Watchlist from '../models/Watchlist.js';

export async function listWatchlist(req, res) {
  const entries = await Watchlist.find({ userId: req.user._id }).populate('stockId').sort({ addedAt: -1 }).lean();
  const items = entries.map((entry) => ({
    id: String(entry._id),
    symbol: entry.symbol,
    addedAt: entry.addedAt,
    stock: entry.stockId ? {
      symbol: entry.stockId.symbol,
      companyName: entry.stockId.companyName,
      currentPrice: entry.stockId.currentPrice,
      change: entry.stockId.change,
      changePercent: entry.stockId.changePercent,
      updatedAt: entry.stockId.updatedAt,
      dataSource: 'SIMULATED',
    } : null,
  }));
  return res.json({ watchlist: items });
}

export async function addWatchlist(req, res) {
  const symbol = req.body.symbol.toUpperCase();
  const stock = await Stock.findOne({ symbol });
  if (!stock) return res.status(404).json({ message: 'Stock not found.' });
  const item = await Watchlist.create({ userId: req.user._id, stockId: stock._id, symbol });
  return res.status(201).json({ watchlistItem: { id: String(item._id), symbol, addedAt: item.addedAt } });
}

export async function removeWatchlist(req, res) {
  const result = await Watchlist.findOneAndDelete({ userId: req.user._id, symbol: req.params.symbol });
  if (!result) return res.status(404).json({ message: 'Stock is not in your watchlist.' });
  return res.json({ message: `${req.params.symbol} removed from watchlist.` });
}
