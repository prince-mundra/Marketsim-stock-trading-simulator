import { getPortfolio } from '../services/portfolioService.js';

export async function getPortfolioData(req, res) {
  return res.json(await getPortfolio(req.user._id));
}

export async function getPortfolioSummary(req, res) {
  const portfolio = await getPortfolio(req.user._id);
  return res.json({ summary: portfolio.summary, account: portfolio.account });
}
