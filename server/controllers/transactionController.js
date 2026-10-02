import Transaction from '../models/Transaction.js';
import { buyShares, sellShares } from '../services/tradingService.js';

export async function buy(req, res) {
  const result = await buyShares({ userId: req.user._id, symbol: req.body.symbol, quantity: req.body.quantity });
  return res.status(201).json(result);
}

export async function sell(req, res) {
  const result = await sellShares({ userId: req.user._id, symbol: req.body.symbol, quantity: req.body.quantity });
  return res.status(201).json(result);
}

export async function listTransactions(req, res) {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
  const filter = { userId: req.user._id };
  const [transactions, total] = await Promise.all([
    Transaction.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Transaction.countDocuments(filter),
  ]);
  return res.json({
    transactions: transactions.map((item) => ({ ...item, id: String(item._id), dataSource: 'SIMULATED' })),
    page,
    limit,
    total,
    hasMore: page * limit < total,
  });
}
