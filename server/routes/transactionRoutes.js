import { Router } from 'express';
import { buy, listTransactions, sell } from '../controllers/transactionController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { normalizeSymbol, parseTradeQuantity } from '../middleware/validationMiddleware.js';

const router = Router();
router.use(requireAuth);
router.post('/buy', normalizeSymbol, parseTradeQuantity, asyncHandler(buy));
router.post('/sell', normalizeSymbol, parseTradeQuantity, asyncHandler(sell));
router.get('/', asyncHandler(listTransactions));
export default router;
