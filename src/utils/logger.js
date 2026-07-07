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
if (config.server.env === 'production') {
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
}

export default logger;
