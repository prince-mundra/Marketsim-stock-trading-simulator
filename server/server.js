import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import { Server as SocketServer } from 'socket.io';
import { readRuntimeConfig } from './config/env.js';
import { connectDatabase, closeDatabase } from './config/db.js';
import { createApp } from './app.js';
import { seedStocks } from './services/stockPriceService.js';
import { attachStockSocket, startPriceEngine } from './sockets/stockSocket.js';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function startServer() {
  const config = readRuntimeConfig();
  await connectDatabase(config.mongoUri);
  await seedStocks();

  let vite;
  let viteMiddleware = null;
  const production = process.env.NODE_ENV === 'production';
  if (!production) {
    const { createServer: createViteServer } = await import('vite');
    vite = await createViteServer({
      configFile: path.join(projectRoot, 'vite.config.js'),
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    viteMiddleware = vite.middlewares;
  }

  const app = createApp({
    jwtSecret: config.jwtSecret,
    cookieSecure: config.cookieSecure,
    viteMiddleware,
    production,
  });
  const httpServer = createServer(app);
  const io = new SocketServer(httpServer, { serveClient: true });
  attachStockSocket(io);
  const priceTimer = startPriceEngine(io);

  await new Promise((resolve, reject) => {
    httpServer.once('error', reject);
    httpServer.listen(config.port, '0.0.0.0', resolve);
  });
  console.log(`[server] Paper-trading simulator listening on port ${config.port}; market data is simulated.`);

  const shutdown = async () => {
    clearInterval(priceTimer);
    await new Promise((resolve) => io.close(() => resolve()));
    await new Promise((resolve) => httpServer.close(() => resolve()));
    if (vite) await vite.close();
    await closeDatabase();
  };
  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);
  return { app, httpServer, io };
}

startServer().catch(async (error) => {
  const safeMessage = error?.message?.includes('replica set')
    ? 'MongoDB must run as a replica set or sharded cluster to support atomic paper trades.'
    : 'Server startup failed. Verify the protected MongoDB and JWT environment values and database connectivity.';
  console.error(`[server] ${safeMessage}`);
  if (mongoose.connection.readyState !== 0) await closeDatabase();
  process.exitCode = 1;
});
