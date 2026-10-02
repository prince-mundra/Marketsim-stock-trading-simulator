import { Router } from 'express';
import { getStock, getStockChartData, getStocks, searchStocks } from '../controllers/stockController.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { normalizeSymbol } from '../middleware/validationMiddleware.js';

const router = Router();
router.get('/search', asyncHandler(searchStocks));
router.get('/', asyncHandler(getStocks));
router.get('/:symbol/chart', normalizeSymbol, asyncHandler(getStockChartData));
router.get('/:symbol', normalizeSymbol, asyncHandler(getStock));
export default router;
