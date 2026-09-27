import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import { env } from './config/environment.js';
import { AppError } from './utils/appError.js';
import { globalErrorHandler } from './middlewares/error.middleware.js';
import { protect } from './middlewares/auth.middleware.js';
import { authorize, scopeBranch } from './middlewares/rbac.middleware.js';
import authRoutes from './modules/auth/auth.routes.js';

const app = express();

// Security HTTP headers
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Body and Cookie Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Development logging
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get(`${env.API_PREFIX}/health`, (req, res) => {
  res.status(200).json({
    success: true,
    statusCode: 200,
    message: 'Omnichannel Retail Backend API is running smoothly',
    timestamp: new Date().toISOString()
  });
});

// Mount Module Routes
app.use(`${env.API_PREFIX}/auth`, authRoutes);

// Internal routes for integration testing RBAC and data scoping
app.get(`${env.API_PREFIX}/test/admin-only`, protect, authorize('SUPER_ADMIN'), (req, res) => {
  res.status(200).json({ success: true, message: 'Super admin access granted' });
});

app.get(`${env.API_PREFIX}/test/scoped-branch`, protect, scopeBranch, (req, res) => {
  res.status(200).json({
    success: true,
    scopedBranchId: req.scopedBranchId,
    branchId: req.query?.branchId
  });
});

// Unhandled route handler (404)
app.all('*', (req, res, next) => {
  next(new AppError(`Đường dẫn '${req.originalUrl}' không tồn tại trên máy chủ.`, 404, 'ROUTE_NOT_FOUND'));
});

// Global Error Handler Middleware
app.use(globalErrorHandler);

export default app;
