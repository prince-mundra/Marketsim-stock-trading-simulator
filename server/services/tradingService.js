import mongoose from 'mongoose';
import User from '../models/User.js';
import Stock from '../models/Stock.js';
import Portfolio from '../models/Portfolio.js';
import Transaction from '../models/Transaction.js';
import { getPortfolio } from './portfolioService.js';
import { roundMoney } from '../utils/financial.js';

function tradeError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function validateQuantity(quantity) {
  const parsed = Number(quantity);
  if (!Number.isFinite(parsed) || parsed <= 0) throw tradeError('Quantity must be greater than zero.');
  return parsed;
}

async function performTrade({ userId, symbol, quantity, side }) {
  const shares = validateQuantity(quantity);
  const session = await mongoose.startSession();
  let result;
  try {
    await session.withTransaction(async () => {
      const [user, stock] = await Promise.all([
        User.findById(userId).session(session),
        Stock.findOne({ symbol: symbol.toUpperCase() }).session(session),
      ]);
      if (!user) throw tradeError('Account not found.', 404);
      if (!stock) throw tradeError('Stock not found.', 404);
      const price = Number(stock.currentPrice);
      if (!Number.isFinite(price) || price <= 0) throw tradeError('The simulated price is unavailable.', 409);
      const totalAmount = roundMoney(shares * price);
      if (totalAmount <= 0) throw tradeError('Order total must be greater than ₹0.');

      let position = await Portfolio.findOne({ userId, stockId: stock._id }).session(session);
      if (side === 'BUY') {
        if (user.virtualBalance + 1e-8 < totalAmount) {
          throw tradeError('Insufficient virtual balance for this simulated buy.', 400);
        }
        user.virtualBalance = roundMoney(user.virtualBalance - totalAmount);
        await user.save({ session });

        if (!position) {
          [position] = await Portfolio.create([{
            userId,
            stockId: stock._id,
            symbol: stock.symbol,
            quantity: shares,
            averageBuyPrice: price,
            investedAmount: totalAmount,
            updatedAt: new Date(),
          }], { session });
        } else {
          const nextQuantity = Number(position.quantity) + shares;
          const nextInvested = roundMoney(Number(position.investedAmount) + totalAmount);
          position.quantity = nextQuantity;
          position.investedAmount = nextInvested;
          position.averageBuyPrice = roundMoney(nextInvested / nextQuantity);
          position.updatedAt = new Date();
          await position.save({ session });
        }
      } else {
        if (!position || Number(position.quantity) + 1e-8 < shares) {
          throw tradeError('You do not own enough shares for this simulated sell.', 400);
        }
        user.virtualBalance = roundMoney(user.virtualBalance + totalAmount);
        await user.save({ session });
        const remainingQuantity = Math.max(0, Number(position.quantity) - shares);
        if (remainingQuantity <= 1e-8) {
          await Portfolio.deleteOne({ _id: position._id }).session(session);
        } else {
          position.quantity = remainingQuantity;
          position.investedAmount = roundMoney(Math.max(0, position.investedAmount - roundMoney(position.averageBuyPrice * shares)));
          position.averageBuyPrice = position.quantity > 0
            ? roundMoney(position.investedAmount / position.quantity)
            : 0;
          position.updatedAt = new Date();
          await position.save({ session });
        }
      }

      const [transaction] = await Transaction.create([{
        userId,
        stockId: stock._id,
        symbol: stock.symbol,
        type: side,
        quantity: shares,
        price,
        totalAmount,
        status: 'COMPLETED',
        createdAt: new Date(),
      }], { session });
      const portfolio = await getPortfolio(userId, session);
      result = {
        transaction: {
          id: String(transaction._id),
          symbol: transaction.symbol,
          type: transaction.type,
          quantity: transaction.quantity,
          price: transaction.price,
          totalAmount: transaction.totalAmount,
          status: transaction.status,
          createdAt: transaction.createdAt,
        },
        portfolio,
      };
    }, { readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' } });
    return result;
  } finally {
    await session.endSession();
  }
}

export const buyShares = (input) => performTrade({ ...input, side: 'BUY' });
export const sellShares = (input) => performTrade({ ...input, side: 'SELL' });
