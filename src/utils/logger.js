import winston from 'winston';
import config from '../config/index.js';

const { combine, timestamp, printf, colorize, json } = winston.format;

// Define log format
const customFormat = printf(({ level, message, timestamp: ts, ...metadata }) => {
  let msg = `${ts} [${level}]: ${message}`;
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  return msg;
});

// Create logger instance
const logger = winston.createLogger({
  level: config.logging.level,
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    config.logging.format === 'json' ? json() : customFormat
  ),
  transports: [
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        customFormat
      ),
    }),
  ],
});

// Add file transport in production
// Cloud-native platforms (Railway, Vercel, etc.) aggregate logs from stdout/stderr,
// so file logging is disabled when running in these environments to avoid permission issues.
// File logging can be explicitly enabled by setting ENABLE_FILE_LOGGING=true
const isRailway = process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_DEPLOYMENT_ID;
const isVercel = process.env.VERCEL || process.env.VERCEL_ENV;
const isCloudPlatform = isRailway || isVercel;
const fileLoggingEnabled = process.env.ENABLE_FILE_LOGGING === 'true';

if (config.server.env === 'production' && !isCloudPlatform && fileLoggingEnabled) {
  logger.add(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: json(),
    })
  );
  logger.add(
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: json(),
    })
  );
  logger.info('File logging enabled: logs will be written to logs/ directory');
} else if (config.server.env === 'production') {
  const reason = isCloudPlatform
    ? 'running on cloud platform (logs aggregated from stdout)'
    : 'ENABLE_FILE_LOGGING not set to true';
  logger.info(`File logging disabled: ${reason}`);
}

export default logger;
