import mongoose from 'mongoose';
import { encrypt, decrypt } from '../../../utils/encryption.js';

const wordPressConnectionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    // WordPress site details
    siteId: {
      type: String,
      required: true,
    },
    siteName: {
      type: String,
      required: true,
    },
    siteUrl: {
      type: String,
      required: true,
    },
    siteType: {
      type: String,
      enum: ['wordpress.com', 'self-hosted'],
      default: 'wordpress.com',
    },
    // OAuth credentials (encrypted)
    accessToken: {
      type: String,
      required: true,
      select: false, // Never return in queries by default
    },
    refreshToken: {
      type: String,
      select: false,
    },
    tokenType: {
      type: String,
      default: 'bearer',
    },
    expiresAt: {
      type: Date,
    },
    // For self-hosted WordPress using Application Passwords
    username: {
      type: String,
    },
    applicationPassword: {
      type: String,
      select: false,
    },
    // Connection metadata
    scopes: [String],
    status: {
      type: String,
      enum: ['active', 'expired', 'revoked', 'error'],
      default: 'active',
      index: true,
    },
    lastSyncedAt: {
      type: Date,
    },
    lastVerifiedAt: {
      type: Date,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for multi-tenant queries
wordPressConnectionSchema.index({ userId: 1, organizationId: 1 });
wordPressConnectionSchema.index({ organizationId: 1, status: 1 });

// Encrypt tokens before saving
wordPressConnectionSchema.pre('save', function (next) {
  if (this.isModified('accessToken') && this.accessToken) {
    this.accessToken = encrypt(this.accessToken);
  }
  if (this.isModified('refreshToken') && this.refreshToken) {
    this.refreshToken = encrypt(this.refreshToken);
  }
  if (this.isModified('applicationPassword') && this.applicationPassword) {
    this.applicationPassword = encrypt(this.applicationPassword);
  }
  next();
});

// Method to get decrypted access token
wordPressConnectionSchema.methods.getAccessToken = function () {
  return this.accessToken ? decrypt(this.accessToken) : null;
};

// Method to get decrypted refresh token
wordPressConnectionSchema.methods.getRefreshToken = function () {
  return this.refreshToken ? decrypt(this.refreshToken) : null;
};

// Method to get decrypted application password
wordPressConnectionSchema.methods.getApplicationPassword = function () {
  return this.applicationPassword ? decrypt(this.applicationPassword) : null;
};

// Method to check if token is expired
wordPressConnectionSchema.methods.isTokenExpired = function () {
  if (!this.expiresAt) {
    return false;
  }
  return new Date() >= this.expiresAt;
};

// Method to update token
wordPressConnectionSchema.methods.updateToken = async function (accessToken, refreshToken, expiresIn) {
  this.accessToken = accessToken;
  if (refreshToken) {
    this.refreshToken = refreshToken;
  }
  if (expiresIn) {
    this.expiresAt = new Date(Date.now() + expiresIn * 1000);
  }
  this.status = 'active';
  this.lastVerifiedAt = new Date();
  await this.save();
};

// Static method to find active connections for user
wordPressConnectionSchema.statics.findActiveByUser = function (userId, organizationId) {
  return this.find({
    userId,
    organizationId,
    status: 'active',
  });
};

// Static method to find connection by site
wordPressConnectionSchema.statics.findBySite = function (userId, organizationId, siteId) {
  return this.findOne({
    userId,
    organizationId,
    siteId,
  });
};

const WordPressConnection = mongoose.model('WordPressConnection', wordPressConnectionSchema);

export default WordPressConnection;
