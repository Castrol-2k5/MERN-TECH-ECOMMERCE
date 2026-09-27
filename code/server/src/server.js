import app from './app.js';
import { env } from './config/environment.js';
import { connectDB } from './config/db.js';

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION] Shutting down...', err.name, err.message);
  console.error(err.stack);
  process.exit(1);
});

// Connect to Database and start server
const startServer = async () => {
  await connectDB();

  const server = app.listen(env.PORT, () => {
    console.log(`[Server] Running in ${env.NODE_ENV} mode on port ${env.PORT}`);
    console.log(`[Server] API Prefix: ${env.API_PREFIX}`);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    console.error('[UNHANDLED REJECTION] Shutting down server...', err.name, err.message);
    server.close(() => {
      process.exit(1);
    });
  });

  // Handle termination signals
  process.on('SIGTERM', () => {
    console.log('[SIGTERM RECEIVED] Shutting down gracefully...');
    server.close(() => {
      console.log('Process terminated.');
    });
  });
};

startServer();
