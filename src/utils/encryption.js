import crypto from 'crypto';
import config from '../config/index.js';

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

/**
 * Encrypt a string value
 * @param {string} text - The text to encrypt
 * @returns {string} - The encrypted text in format: iv:encryptedData
 */
export const encrypt = (text) => {
  if (!text) {
    return null;
  }

  if (!config.encryption.key) {
    throw new Error('ENCRYPTION_KEY is not configured');
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const key = Buffer.from(config.encryption.key, 'hex');
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return `${iv.toString('hex')}:${encrypted}`;
};

/**
 * Decrypt a string value
 * @param {string} text - The encrypted text in format: iv:encryptedData
 * @returns {string} - The decrypted text
 */
export const decrypt = (text) => {
  if (!text) {
    return null;
  }

  if (!config.encryption.key) {
    throw new Error('ENCRYPTION_KEY is not configured');
  }

  const parts = text.split(':');
  if (parts.length !== 2) {
    throw new Error('Invalid encrypted text format');
  }

  const iv = Buffer.from(parts[0], 'hex');
  const encryptedText = parts[1];
  const key = Buffer.from(config.encryption.key, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
};

/**
 * Generate a random encryption key
 * @returns {string} - A random 32-byte hex string
 */
export const generateEncryptionKey = () => crypto.randomBytes(32).toString('hex');

export default {
  encrypt,
  decrypt,
  generateEncryptionKey,
};
