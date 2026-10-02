export const roundMoney = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

export function calculateHoldingValue(quantity, averageBuyPrice, currentPrice) {
  const invested = roundMoney(Number(quantity) * Number(averageBuyPrice));
  const value = roundMoney(Number(quantity) * Number(currentPrice));
  const profitLoss = roundMoney(value - invested);
  return {
    investedAmount: invested,
    currentValue: value,
    profitLoss,
    profitLossPercent: invested > 0 ? roundMoney((profitLoss / invested) * 100) : 0,
  };
}
