import mongoose from 'mongoose';
import { encrypt, decrypt } from '../../../utils/encryption.js';

const shopifyConnectionSchema = new mongoose.Schema(
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
    // Shopify store details
    shopDomain: {
      type: String,
      required: true,
      unique: true,
    },
    shopName: {
      type: String,
      required: true,
    },
    shopEmail: {
      type: String,
    },
    shopCurrency: {
      type: String,
    },
    shopTimezone: {
      type: String,
    },
    shopifyStoreId: {
      type: String,
      required: true,
    },
    // OAuth credentials (encrypted)
    accessToken: {
      type: String,
      required: true,
      select: false, // Never return in queries by default
    },
    tokenType: {
      type: String,
      default: 'bearer',
    },
    // Shopify doesn't provide refresh tokens, access tokens don't expire
    // Connection metadata
    scopes: [String],
    installedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'revoked', 'error'],
      default: 'active',
      index: true,
    },
    // Sync tracking
    lastSyncedAt: {
      type: Date,
    },
    lastVerifiedAt: {
      type: Date,
    },
    syncSettings: {
      autoSyncProducts: {
        type: Boolean,
        default: false,
      },
      autoSyncOrders: {
        type: Boolean,
        default: false,
      },
      syncInterval: {
        type: Number,
        default: 3600, // seconds
      },
    },
    // Webhooks
    webhooks: [
      {
        webhookId: String,
        topic: String,
        address: String,
        createdAt: Date,
      },
    ],
    // Store capabilities
    planName: {
      type: String,
    },
    planDisplayName: {
      type: String,
    },
    hasStorefront: {
      type: Boolean,
      default: true,
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
shopifyConnectionSchema.index({ userId: 1, organizationId: 1 });
shopifyConnectionSchema.index({ organizationId: 1, status: 1 });
shopifyConnectionSchema.index({ shopDomain: 1 }, { unique: true });

// Encrypt access token before saving
shopifyConnectionSchema.pre('save', function (next) {
  if (this.isModified('accessToken') && this.accessToken) {
    this.accessToken = encrypt(this.accessToken);
  }
  next();
});

// Method to get decrypted access token
shopifyConnectionSchema.methods.getAccessToken = function () {
  return this.accessToken ? decrypt(this.accessToken) : null;
};

// Method to update token
shopifyConnectionSchema.methods.updateToken = async function (accessToken) {
  this.accessToken = accessToken;
  this.status = 'active';
  this.lastVerifiedAt = new Date();
  await this.save();
};

// Static method to find active connections for user
shopifyConnectionSchema.statics.findActiveByUser = function (userId, organizationId) {
  return this.find({
    userId,
    organizationId,
    status: 'active',
  });
};

// Static method to find connection by shop domain
shopifyConnectionSchema.statics.findByShopDomain = function (shopDomain) {
  return this.findOne({ shopDomain });
};

const ShopifyConnection = mongoose.model('ShopifyConnection', shopifyConnectionSchema);

export default ShopifyConnection;
