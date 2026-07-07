import mongoose from 'mongoose';
import config from './index.js';
import logger from '../utils/logger.js';

let isConnected = false;

export const connectDatabase = async () => {
  if (isConnected) {
    logger.info('Using existing database connection');
    return;
  }

  try {
    mongoose.set('strictQuery', false);

    const conn = await mongoose.connect(config.database.mongodb.uri, config.database.mongodb.options);

    isConnected = true;

    logger.info(`MongoDB Connected: ${conn.connection.host}`);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error(`MongoDB connection error: ${err}`);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
      isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
      isConnected = true;
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed through app termination');
      process.exit(0);
    });
  } catch (error) {
    logger.error(`Error connecting to MongoDB: ${error.message}`);
    throw error;
  }
};

export const disconnectDatabase = async () => {
  if (!isConnected) {
    return;
  }

  try {
    await mongoose.connection.close();
    isConnected = false;
    logger.info('MongoDB connection closed');
  } catch (error) {
    logger.error(`Error disconnecting from MongoDB: ${error.message}`);
    throw error;
  }
};

export default {
  connectDatabase,
  disconnectDatabase,
};
