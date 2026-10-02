import Stock from '../models/Stock.js';
import { roundMoney } from '../utils/financial.js';

const STOCKS = [
  { symbol: 'RELIANCE', companyName: 'Reliance Industries', price: 1260 },
  { symbol: 'TCS', companyName: 'Tata Consultancy Services', price: 3480 },
  { symbol: 'INFY', companyName: 'Infosys', price: 1420 },
  { symbol: 'HDFCBANK', companyName: 'HDFC Bank', price: 1580 },
  { symbol: 'ICICIBANK', companyName: 'ICICI Bank', price: 1120 },
  { symbol: 'ITC', companyName: 'ITC Limited', price: 420 },
  { symbol: 'LT', companyName: 'Larsen & Toubro', price: 2940 },
  { symbol: 'SBIN', companyName: 'State Bank of India', price: 760 },
  { symbol: 'BHARTIARTL', companyName: 'Bharti Airtel', price: 1510 },
  { symbol: 'WIPRO', companyName: 'Wipro', price: 490 },
  { symbol: 'MARUTI', companyName: 'Maruti Suzuki India', price: 11400 },
  { symbol: 'TATAMOTORS', companyName: 'Tata Motors', price: 710 },
  { symbol: 'SUNPHARMA', companyName: 'Sun Pharmaceutical Industries', price: 1680 },
  { symbol: 'AXISBANK', companyName: 'Axis Bank', price: 1080 },
  { symbol: 'ASIANPAINT', companyName: 'Asian Paints', price: 2380 },
];

const PERIOD_DAYS = { '1D': 1, '1W': 7, '1M': 30, '6M': 180, '1Y': 365 };

let cachedStocks = null;
let stockSnapshotPromise = null;

async function refreshStockSnapshot() {
  const stocks = await Stock.find().lean();
  cachedStocks = stocks;
  return stocks;
}

async function loadStockSnapshot() {
  if (cachedStocks) return cachedStocks;
  if (!stockSnapshotPromise) {
    stockSnapshotPromise = refreshStockSnapshot().finally(() => { stockSnapshotPromise = null; });
  }
  return stockSnapshotPromise;
}

function makeHistory(price, points = 96) {
  const now = Date.now();
  return Array.from({ length: points }, (_, index) => {
    const progress = index / points;
    const wave = Math.sin(index * 0.37) * 0.009 + Math.sin(index * 0.11) * 0.006;
    const value = roundMoney(price * (1 - (1 - progress) * 0.018 + wave));
    return { time: new Date(now - (points - index) * 15 * 60_000), price: Math.max(0.01, value) };
  });
}

function makeScenarioHistory(stock, period) {
  const points = 96;
  const end = Date.now();
  const duration = (PERIOD_DAYS[period] || 30) * 24 * 60 * 60 * 1000;
  const start = end - duration;
  const seed = [...stock.symbol].reduce((sum, character) => sum + character.charCodeAt(0), 0);
  const current = Number(stock.currentPrice);
  return Array.from({ length: points }, (_, index) => {
    const progress = index / (points - 1);
    const wave = Math.sin(index * 0.22 + seed) * 0.008 + Math.sin(index * 0.071 + seed * 0.4) * 0.005;
    const trend = -0.008 * (1 - progress);
    const price = index === points - 1 ? current : roundMoney(current * (1 + trend + wave * Math.sin(Math.PI * progress)));
    return { time: new Date(start + progress * duration), price: Math.max(0.01, price) };
  });
}

export async function seedStocks() {
  const now = new Date();
  await Stock.bulkWrite(STOCKS.map(({ symbol, companyName, price }) => ({
    updateOne: {
      filter: { symbol },
      update: { $setOnInsert: {
        symbol, companyName,
        currentPrice: price,
        previousClose: price,
        change: 0,
        changePercent: 0,
        exchange: 'NSE · simulated',
        open: price,
        high: roundMoney(price * 1.012),
        low: roundMoney(price * 0.988),
        volume: Math.floor(150_000 + Math.random() * 2_000_000),
        priceHistory: makeHistory(price),
        dataSource: 'SIMULATED',
        updatedAt: now,
      } },
      upsert: true,
    },
  })), { ordered: false });
  cachedStocks = null;
  await refreshStockSnapshot();
}

export async function listStocks(search = '') {
  const stocks = await loadStockSnapshot();
  const query = search.trim();
  const matcher = query ? new RegExp(escapeRegex(query), 'i') : null;
  const matching = matcher
    ? stocks.filter((stock) => matcher.test(stock.symbol) || matcher.test(stock.companyName))
    : stocks;
  return matching.slice().sort((left, right) => left.symbol.localeCompare(right.symbol));
}

export async function getStockSnapshot() {
  const stocks = await loadStockSnapshot();
  return stocks.map(({ symbol, currentPrice, previousClose, change, changePercent, updatedAt }) => ({
    symbol, currentPrice, previousClose, change, changePercent, updatedAt, dataSource: 'SIMULATED',
  }));
}

export async function findStock(symbol) {
  return (await loadStockSnapshot()).find((stock) => stock.symbol === symbol.toUpperCase()) || null;
}

export async function getStockChart(symbol, period = '1M') {
  const stock = (await loadStockSnapshot()).find((item) => item.symbol === symbol.toUpperCase());
  if (!stock) return null;
  const selectedPeriod = Object.hasOwn(PERIOD_DAYS, period) ? period : '1M';
  return {
    ...stock,
    priceHistory: makeScenarioHistory(stock, selectedPeriod),
    selectedPeriod,
    dataSource: 'SIMULATED',
  };
}

export async function updateSimulatedPrices() {
  const stocks = await Stock.find().lean();
  const now = new Date();
  const changes = [];
  const operations = [];
  for (const stock of stocks) {
    const drift = (Math.random() - 0.49) * 0.0032;
    const nextPrice = Math.max(0.01, roundMoney(stock.currentPrice * (1 + drift)));
    const change = roundMoney(nextPrice - stock.previousClose);
    const changePercent = stock.previousClose > 0
      ? roundMoney((change / stock.previousClose) * 100)
      : 0;
    const high = Math.max(stock.high, nextPrice);
    const low = Math.min(stock.low || nextPrice, nextPrice);
    const volume = stock.volume + Math.floor(50 + Math.random() * 900);
    operations.push({
      updateOne: {
        filter: { _id: stock._id },
        update: {
          $set: { currentPrice: nextPrice, change, changePercent, high, low, volume, updatedAt: now },
          $push: { priceHistory: { $each: [{ time: now, price: nextPrice }], $slice: -240 } },
        },
      },
    });
    changes.push({
      symbol: stock.symbol,
      currentPrice: nextPrice,
      previousClose: stock.previousClose,
      change,
      changePercent,
      high,
      low,
      volume,
      updatedAt: now,
      dataSource: 'SIMULATED',
    });
  }
  if (operations.length) {
    await Stock.bulkWrite(operations, { ordered: true });
    const bySymbol = new Map(changes.map((change) => [change.symbol, change]));
    cachedStocks = stocks.map((stock) => {
      const change = bySymbol.get(stock.symbol);
      if (!change) return stock;
      return {
        ...stock,
        ...change,
        priceHistory: [...(stock.priceHistory || []), { time: now, price: change.currentPrice }].slice(-240),
      };
    });
  }
  return changes;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
