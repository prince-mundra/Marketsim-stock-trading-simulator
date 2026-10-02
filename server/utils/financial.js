export const STARTING_VIRTUAL_BALANCE = 100000;

export function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

export function calculateHolding(holding, currentPrice) {
  const quantity = Number(holding.quantity) || 0;
  const averageBuyPrice = Number(holding.averageBuyPrice) || 0;
  const investedAmount = roundMoney(Number(holding.investedAmount ?? quantity * averageBuyPrice));
  const currentValue = roundMoney(quantity * Number(currentPrice || 0));
  const profitLoss = roundMoney(currentValue - investedAmount);
  return {
    quantity,
    averageBuyPrice,
    investedAmount,
    currentValue,
    profitLoss,
    profitLossPercent: investedAmount > 0 ? roundMoney((profitLoss / investedAmount) * 100) : 0,
  };
}

export function calculatePortfolioSummary(holdings, availableCash) {
  const positions = holdings.map((holding) => calculateHolding(holding, holding.stock?.currentPrice ?? holding.currentPrice));
  const totalInvested = roundMoney(positions.reduce((sum, item) => sum + item.investedAmount, 0));
  const holdingsValue = roundMoney(positions.reduce((sum, item) => sum + item.currentValue, 0));
  const profitLoss = roundMoney(holdingsValue - totalInvested);
  const cash = roundMoney(availableCash);
  return {
    totalPortfolioValue: roundMoney(cash + holdingsValue),
    totalInvested,
    availableCash: cash,
    holdingsValue,
    profitLoss,
    profitLossPercent: totalInvested > 0 ? roundMoney((profitLoss / totalInvested) * 100) : 0,
    numberOfHoldings: positions.length,
  };
}
