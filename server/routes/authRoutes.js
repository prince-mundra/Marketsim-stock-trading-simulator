import { Router } from 'express';
import { getMe, login, logout, register } from '../controllers/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validateLogin, validateRegistration } from '../middleware/validationMiddleware.js';

const router = Router();
router.post('/register', validateRegistration, asyncHandler(register));
router.post('/login', validateLogin, asyncHandler(login));
router.get('/me', requireAuth, asyncHandler(getMe));
router.post('/logout', requireAuth, asyncHandler(logout));
export default router;
