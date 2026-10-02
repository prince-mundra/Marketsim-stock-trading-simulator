import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import compression from 'compression';
import authRoutes from './routes/authRoutes.js';
import stockRoutes from './routes/stockRoutes.js';
import portfolioRoutes from './routes/portfolioRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import watchlistRoutes from './routes/watchlistRoutes.js';
import { errorMiddleware, notFoundMiddleware } from './middleware/errorMiddleware.js';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function createApp({ jwtSecret, cookieSecure = true, viteMiddleware = null, production = false } = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.locals.jwtSecret = jwtSecret;
  app.locals.cookieSecure = cookieSecure;
  app.use(compression({ threshold: 1024 }));
  app.use(express.json({ limit: '32kb', strict: true }));
  app.use(cookieParser());

  const allowedOrigins = new Set((process.env.CORS_ORIGINS || '').split(',').map((item) => item.trim()).filter(Boolean));
  app.use((req, res, next) => {
    const origin = req.get('origin');
    if (origin && allowedOrigins.has(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    }
    if (req.method === 'OPTIONS') return res.sendStatus(origin && !allowedOrigins.has(origin) ? 403 : 204);
    return next();
  });

  app.get('/api/health', (req, res) => res.json({
    ok: true,
    mode: 'PAPER_TRADING',
    dataSource: 'SIMULATED',
  }));
  app.use('/api/auth', authRoutes);
  app.use('/api/stocks', stockRoutes);
  app.use('/api/portfolio', portfolioRoutes);
  app.use('/api/transactions', transactionRoutes);
  app.use('/api/watchlist', watchlistRoutes);

  if (viteMiddleware) {
    app.use(viteMiddleware);
  } else if (production) {
    const distPath = path.join(projectRoot, 'client', 'dist');
    app.use(express.static(distPath, { index: false, maxAge: '1h' }));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/')) return next();
      return res.sendFile(path.join(distPath, 'index.html'), (error) => error && next(error));
    });
  }

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);
  return app;
}
