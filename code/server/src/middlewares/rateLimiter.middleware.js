import rateLimit from 'express-rate-limit';
import { env } from '../config/environment.js';

export const authRateLimiter =
  env.NODE_ENV === 'development' || env.NODE_ENV === 'test'
    ? (req, res, next) => next() // Bypass rate limiting in test suite to avoid throttling
    : rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 5, // Maximum 5 attempts per windowMs
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
          res.status(429).json({
            success: false,
            statusCode: 429,
            errorCode: 'TOO_MANY_REQUESTS',
            message: 'Bạn đã thử xác thực quá nhiều lần (tối đa 5 lần/15 phút). Vui lòng thử lại sau 15 phút.',
            errors: []
          });
        }
      });
