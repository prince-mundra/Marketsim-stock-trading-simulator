import assert from 'node:assert/strict';
import { after, before, beforeEach, test } from 'node:test';
import { createServer } from 'node:http';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import request from 'supertest';
import { io as createClient } from 'socket.io-client';
import { Server as SocketServer } from 'socket.io';
import { createApp } from '../app.js';
import User from '../models/User.js';
import Stock from '../models/Stock.js';
import Portfolio from '../models/Portfolio.js';
import Transaction from '../models/Transaction.js';
import Watchlist from '../models/Watchlist.js';
import { seedStocks } from '../services/stockPriceService.js';
import { attachStockSocket, startPriceEngine } from '../sockets/stockSocket.js';

const jwtSecret = 'test-only-signing-secret-that-is-at-least-32-characters-long';
const collections = [User, Stock, Portfolio, Transaction, Watchlist];
let mongo;
let app;
let agent;
let lastRegistrationCookie;

before(async () => {
  mongo = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: 'wiredTiger' } });
  await mongoose.connect(mongo.getUri('stocksim_test'));
  await Promise.all(collections.map((model) => model.init()));
  app = createApp({ jwtSecret, cookieSecure: false });
});

after(async () => {
  await mongoose.disconnect();
  await mongo?.stop();
});

beforeEach(async () => {
  await Promise.all(collections.map((model) => model.deleteMany({})));
  await seedStocks();
  agent = request.agent(app);
});

async function register(email = 'learner@example.com') {
  const response = await agent.post('/api/auth/register').send({ name: 'Market Learner', email, password: 'PracticePass123' });
  assert.equal(response.status, 201, response.body.message);
  lastRegistrationCookie = response.headers['set-cookie']?.[0] || '';
  return response.body.user;
}

test('paper-trading end-to-end account, market, watchlist, atomic trades and realtime flow', async (t) => {
  await t.test('registration, login and protected routes create a ₹100,000 account safely', async () => {
    const user = await register();
    assert.equal(user.virtualBalance, 100000);
    assert.equal(user.email, 'learner@example.com');
    assert.equal('passwordHash' in user, false);
    assert.match(lastRegistrationCookie, /papertrade_session=/);
    assert.match(lastRegistrationCookie, /HttpOnly/i, 'authentication cookie is not exposed to client JavaScript');

    const record = await User.findById(user.id).select('+passwordHash').lean();
    assert.notEqual(record.passwordHash, 'PracticePass123');
    assert.ok(record.passwordHash.length > 30);
    assert.equal('password' in record, false);
    assert.equal((await agent.get('/api/auth/me')).status, 200);
    assert.equal((await agent.get('/api/portfolio')).status, 200);
    assert.equal((await request(app).get('/api/portfolio')).status, 401);

    const duplicate = await agent.post('/api/auth/register').send({ name: 'Market Learner', email: 'learner@example.com', password: 'PracticePass123' });
    assert.equal(duplicate.status, 409);
    const loggedOut = await agent.post('/api/auth/logout');
    assert.equal(loggedOut.status, 200);
    assert.equal((await agent.get('/api/portfolio')).status, 401);

    const loggedIn = await agent.post('/api/auth/login').send({ email: 'learner@example.com', password: 'PracticePass123' });
    assert.equal(loggedIn.status, 200);
    assert.equal((await agent.get('/api/auth/me')).status, 200);
  });

  await t.test('stock search/details and user-scoped watchlist persist', async () => {
    await register();
    const search = await agent.get('/api/stocks/search?q=TCS');
    assert.equal(search.status, 200);
    assert.ok(search.body.stocks.some((stock) => stock.symbol === 'TCS'));
    assert.equal(search.body.dataSource, 'SIMULATED');
    const detail = await agent.get('/api/stocks/TCS/chart?period=1M');
    assert.equal(detail.status, 200);
    assert.equal(detail.body.stock.dataSource, 'SIMULATED');
    assert.ok(detail.body.stock.priceHistory.length > 1);
    const day = await agent.get('/api/stocks/TCS/chart?period=1D');
    const year = await agent.get('/api/stocks/TCS/chart?period=1Y');
    const spanHours = (history) => (new Date(history.at(-1).time) - new Date(history[0].time)) / 3_600_000;
    assert.equal(day.body.stock.selectedPeriod, '1D');
    assert.ok(spanHours(day.body.stock.priceHistory) >= 23 && spanHours(day.body.stock.priceHistory) <= 25);
    assert.equal(year.body.stock.selectedPeriod, '1Y');
    assert.ok(spanHours(year.body.stock.priceHistory) >= 364 * 24);

    assert.equal((await agent.post('/api/watchlist').send({ symbol: 'TCS' })).status, 201);
    const saved = await agent.get('/api/watchlist');
    assert.equal(saved.body.watchlist.length, 1);
    assert.equal(saved.body.watchlist[0].symbol, 'TCS');
    assert.equal((await agent.delete('/api/watchlist/TCS')).status, 200);
    assert.equal((await agent.get('/api/watchlist')).body.watchlist.length, 0);
  });

  await t.test('valid buy and sell atomically update cash, cost basis, holdings and ledger', async () => {
    const user = await register();
    const stock = await Stock.findOne({ symbol: 'RELIANCE' }).lean();
    const buy = await agent.post('/api/transactions/buy').send({ symbol: 'RELIANCE', quantity: 10 });
    assert.equal(buy.status, 201, buy.body.message);
    assert.equal(buy.body.transaction.type, 'BUY');
    assert.equal(buy.body.transaction.totalAmount, stock.currentPrice * 10);
    assert.equal(buy.body.portfolio.account.virtualBalance, 100000 - stock.currentPrice * 10);
    assert.equal(buy.body.portfolio.holdings[0].quantity, 10);
    assert.equal(buy.body.portfolio.holdings[0].investedAmount, stock.currentPrice * 10);

    const partialSell = await agent.post('/api/transactions/sell').send({ symbol: 'RELIANCE', quantity: 4 });
    assert.equal(partialSell.status, 201, partialSell.body.message);
    assert.equal(partialSell.body.portfolio.holdings[0].quantity, 6);
    assert.equal(partialSell.body.portfolio.holdings[0].investedAmount, stock.currentPrice * 6);
    assert.equal(partialSell.body.portfolio.account.virtualBalance, 100000 - stock.currentPrice * 6);
    const ledger = await agent.get('/api/transactions');
    assert.equal(ledger.body.total, 2);
    assert.deepEqual(ledger.body.transactions.map((item) => item.type), ['SELL', 'BUY']);

    const fullSell = await agent.post('/api/transactions/sell').send({ symbol: 'RELIANCE', quantity: 6 });
    assert.equal(fullSell.status, 201);
    assert.equal(fullSell.body.portfolio.holdings.length, 0);
    assert.equal(fullSell.body.portfolio.account.virtualBalance, 100000);
    assert.equal((await agent.get('/api/portfolio/summary')).body.summary.totalPortfolioValue, 100000);
    assert.equal((await agent.get('/api/transactions')).body.total, 3);
    assert.ok(await User.findById(user.id));
  });

  await t.test('invalid or unaffordable orders leave no partial balances, holdings, or transaction rows', async () => {
    await register();
    const buyTooMuch = await agent.post('/api/transactions/buy').send({ symbol: 'RELIANCE', quantity: 1000 });
    assert.equal(buyTooMuch.status, 400);
    assert.match(buyTooMuch.body.message, /insufficient virtual balance/i);
    const sellNone = await agent.post('/api/transactions/sell').send({ symbol: 'TCS', quantity: 1 });
    assert.equal(sellNone.status, 400);
    assert.match(sellNone.body.message, /enough shares/i);
    const badQuantity = await agent.post('/api/transactions/buy').send({ symbol: 'TCS', quantity: 0 });
    assert.equal(badQuantity.status, 400);
    const missingStock = await agent.post('/api/transactions/buy').send({ symbol: 'NOPE', quantity: 1 });
    assert.equal(missingStock.status, 404);

    const portfolio = await agent.get('/api/portfolio');
    assert.equal(portfolio.body.account.virtualBalance, 100000);
    assert.equal(portfolio.body.holdings.length, 0);
    assert.equal((await agent.get('/api/transactions')).body.total, 0);
    assert.equal((await Transaction.countDocuments({})), 0);
  });

  await t.test('Socket.IO broadcasts simulated price updates to connected clients', async () => {
    const httpServer = createServer(app);
    const ioServer = new SocketServer(httpServer);
    attachStockSocket(ioServer);
    await new Promise((resolve) => httpServer.listen(0, '127.0.0.1', resolve));
    const client = createClient(`http://127.0.0.1:${httpServer.address().port}`, {
      autoConnect: false, reconnection: false, transports: ['websocket'],
    });
    const statusPromise = new Promise((resolve) => client.once('market:status', resolve));
    const snapshotPromise = new Promise((resolve) => client.once('price:snapshot', resolve));
    client.connect();
    const [status, snapshot] = await Promise.all([statusPromise, snapshotPromise]);
    assert.equal(status.dataSource, 'SIMULATED');
    assert.equal(snapshot.length, 15);

    const updatePromise = new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('No simulated Socket.IO price update received.')), 8000);
      client.once('price:update', (event) => { clearTimeout(timer); resolve(event); });
    });
    const priceTimer = startPriceEngine(ioServer, 80);
    const update = await updatePromise;
    clearInterval(priceTimer);
    assert.equal(update.dataSource, 'SIMULATED');
    assert.ok(update.prices.length > 0);
    assert.ok(update.prices.every((item) => item.dataSource === 'SIMULATED'));
    const refreshed = await agent.get(`/api/stocks/${update.prices[0].symbol}`);
    assert.equal(refreshed.body.stock.currentPrice, update.prices[0].currentPrice);
    client.close();
    await new Promise((resolve) => ioServer.close(resolve));
  });
});
