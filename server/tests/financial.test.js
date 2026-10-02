import assert from 'node:assert/strict';
import { test } from 'node:test';
import { calculateHolding, calculatePortfolioSummary, roundMoney, STARTING_VIRTUAL_BALANCE } from '../utils/financial.js';

test('virtual accounts use ₹100,000 and monetary values round to paise', () => {
  assert.equal(STARTING_VIRTUAL_BALANCE, 100000);
  assert.equal(roundMoney(123.456), 123.46);
  assert.equal(roundMoney(1000.001), 1000);
});

test('holding and portfolio summaries calculate cost basis, unrealized P&L and total account value', () => {
  const holding = calculateHolding({ quantity: 10, averageBuyPrice: 500, investedAmount: 5000 }, 550);
  assert.deepEqual(holding, {
    quantity: 10,
    averageBuyPrice: 500,
    investedAmount: 5000,
    currentValue: 5500,
    profitLoss: 500,
    profitLossPercent: 10,
  });
  const summary = calculatePortfolioSummary([
    { quantity: 10, averageBuyPrice: 500, investedAmount: 5000, currentPrice: 550 },
  ], 95000);
  assert.equal(summary.totalPortfolioValue, 100500);
  assert.equal(summary.totalInvested, 5000);
  assert.equal(summary.availableCash, 95000);
  assert.equal(summary.profitLoss, 500);
  assert.equal(summary.numberOfHoldings, 1);
});
