import Portfolio from '../models/Portfolio.js';
import User from '../models/User.js';
import { calculateHolding, calculatePortfolioSummary } from '../utils/financial.js';

export async function getPortfolio(userId, session = null) {
  const holdingsQuery = Portfolio.find({ userId }).populate('stockId');
  const userQuery = User.findById(userId).select('_id name email virtualBalance');
  if (session) {
    holdingsQuery.session(session);
    userQuery.session(session);
  }
  const [holdings, user] = await Promise.all([holdingsQuery.lean(), userQuery.lean()]);
  if (!user) {
    const error = new Error('Account not found.');
    error.statusCode = 404;
    throw error;
  }

  const rows = holdings.map((holding) => {
    const stock = holding.stockId;
    const currentPrice = stock?.currentPrice || 0;
    return {
      id: String(holding._id),
      symbol: holding.symbol,
      quantity: holding.quantity,
      averageBuyPrice: holding.averageBuyPrice,
      investedAmount: holding.investedAmount,
      updatedAt: holding.updatedAt,
      stock: stock ? {
        symbol: stock.symbol,
        companyName: stock.companyName,
        currentPrice,
        change: stock.change,
        changePercent: stock.changePercent,
        dataSource: 'SIMULATED',
      } : null,
      ...calculateHolding(holding, currentPrice),
    };
  });

  return {
    holdings: rows,
    summary: calculatePortfolioSummary(rows.map((row) => ({ ...row, currentPrice: row.stock?.currentPrice })), user.virtualBalance),
    account: { id: String(user._id), name: user.name, email: user.email, virtualBalance: user.virtualBalance },
  };
}
