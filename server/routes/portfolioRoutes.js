import { Router } from 'express';
import { getPortfolioData, getPortfolioSummary } from '../controllers/portfolioController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();
router.use(requireAuth);
router.get('/', asyncHandler(getPortfolioData));
router.get('/summary', asyncHandler(getPortfolioSummary));
export default router;
