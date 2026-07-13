import dotenv from 'dotenv';

dotenv.config();

// Validate critical environment variables in production
if (process.env.NODE_ENV === 'production') {
  const requiredVars = [
    'MONGODB_URI',
    'ENCRYPTION_KEY',
    'JWT_SECRET',
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error('❌ CRITICAL: Missing required environment variables:');
    missingVars.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\nApplication cannot start. Please configure these variables in Railway.');
    process.exit(1);
  }
}

export default {
  server: {
    port: process.env.PORT || 4002,
    env: process.env.NODE_ENV || 'development',
  },
  database: {
    mongodb: {
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/flora-cms-commerce',
      options: {
        maxPoolSize: 10,
        minPoolSize: 2,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      },
    },
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    retryStrategy: (times) => Math.min(times * 50, 2000),
  },
  encryption: {
    key: process.env.ENCRYPTION_KEY,
    algorithm: 'aes-256-cbc',
  },
  wordpress: {
    clientId: process.env.WORDPRESS_CLIENT_ID,
    clientSecret: process.env.WORDPRESS_CLIENT_SECRET,
    redirectUri: process.env.WORDPRESS_REDIRECT_URI,
    apiBaseUrl: 'https://public-api.wordpress.com',
  },
  shopify: {
    clientId: process.env.SHOPIFY_CLIENT_ID,
    clientSecret: process.env.SHOPIFY_CLIENT_SECRET,
    redirectUri: process.env.SHOPIFY_REDIRECT_URI,
    scopes: process.env.SHOPIFY_SCOPES || 'read_products,write_products,read_themes,write_themes,read_content,write_content',
    apiVersion: '2024-01',
  },
  webflow: {
    clientId: process.env.WEBFLOW_CLIENT_ID,
    clientSecret: process.env.WEBFLOW_CLIENT_SECRET,
    redirectUri: process.env.WEBFLOW_REDIRECT_URI,
    apiBaseUrl: 'https://api.webflow.com',
  },
  commandCenter: {
    url: process.env.COMMAND_CENTER_URL || 'http://localhost:4000',
    grpcPort: parseInt(process.env.GRPC_PORT, 10) || 50052,
    grpcHost: process.env.GRPC_HOST || '0.0.0.0',
  },
  graphql: {
    path: process.env.GRAPHQL_PATH || '/graphql',
    subscriptionsPath: process.env.GRAPHQL_SUBSCRIPTIONS_PATH || '/graphql/subscriptions',
  },
  security: {
    jwtSecret: process.env.JWT_SECRET,
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
  },
  queue: {
    name: process.env.QUEUE_NAME || 'cms-commerce-events',
    retryAttempts: parseInt(process.env.QUEUE_RETRY_ATTEMPTS, 10) || 3,
    retryDelay: parseInt(process.env.QUEUE_RETRY_DELAY, 10) || 5000,
  },
  cache: {
    ttl: parseInt(process.env.CACHE_TTL, 10) || 300,
    checkPeriod: parseInt(process.env.CACHE_CHECK_PERIOD, 10) || 60,
  },
};
