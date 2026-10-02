import { Router } from 'express';
import { addWatchlist, listWatchlist, removeWatchlist } from '../controllers/watchlistController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { normalizeSymbol } from '../middleware/validationMiddleware.js';

const router = Router();
router.use(requireAuth);
router.get('/', asyncHandler(listWatchlist));
router.post('/', normalizeSymbol, asyncHandler(addWatchlist));
router.delete('/:symbol', normalizeSymbol, asyncHandler(removeWatchlist));
export default router;
