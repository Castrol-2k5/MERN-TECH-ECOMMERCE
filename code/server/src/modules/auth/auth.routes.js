import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { registerSchema, loginSchema } from './auth.dto.js';
import { validateDto } from '../../middlewares/validate.middleware.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { authRateLimiter } from '../../middlewares/rateLimiter.middleware.js';

const router = Router();

// Public auth routes with rate limiting
router.post('/register', authRateLimiter, validateDto(registerSchema), AuthController.register);
router.post('/login', authRateLimiter, validateDto(loginSchema), AuthController.login);

// Token management & session routes
router.post('/refresh-token', AuthController.refreshToken);
router.post('/logout', AuthController.logout);

// Protected routes
router.post('/logout-all', protect, AuthController.logoutAll);
router.get('/me', protect, AuthController.getMe);

export default router;
