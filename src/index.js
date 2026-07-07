import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import config from './config/index.js';
import { connectDatabase } from './config/database.js';
import logger from './utils/logger.js';

// Import routes
import wordpressRoutes from './api/rest/routes/wordpress.js';
import shopifyRoutes from './api/rest/routes/shopify.js';
import themesRoutes from './api/rest/routes/themes.js';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({ origin: config.security.corsOrigin }));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Logging
if (config.server.env !== 'test') {
  app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
}

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'flora-cms-commerce',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use('/api/v1/wordpress', wordpressRoutes);
app.use('/api/v1/shopify', shopifyRoutes);
app.use('/api/v1/themes', themesRoutes);

// GraphQL endpoint (to be implemented)
// app.use('/graphql', graphqlRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}`, {
    stack: err.stack,
    url: req.url,
    method: req.method,
  });

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: err.name || 'Internal Server Error',
    message: err.message,
    ...(config.server.env === 'development' && { stack: err.stack }),
  });
});

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase();
    logger.info('Database connected successfully');

    // Start Express server
    const PORT = config.server.port;
    app.listen(PORT, () => {
      logger.info(`Flora CMS-Commerce microservice running on port ${PORT}`);
      logger.info(`Environment: ${config.server.env}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`);
  process.exit(1);
});

startServer();

export default app;
