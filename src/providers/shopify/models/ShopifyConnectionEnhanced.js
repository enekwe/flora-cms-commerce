import mongoose from 'mongoose';
import { encrypt, decrypt } from '../../../utils/encryption.js';

/**
 * Enhanced Shopify Connection Schema
 * Combines microservice multi-tenancy with monolith feature parity
 *
 * Supports both:
 * - Modern: userId + organizationId (multi-tenant)
 * - Legacy: companyId (backward compatibility with monolith)
 */
const shopifyConnectionSchema = new mongoose.Schema(
  {
    // ============================================================================
    // MULTI-TENANT IDENTIFIERS (PRIMARY)
    // ============================================================================
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

    // ============================================================================
    // BACKWARD COMPATIBILITY (LEGACY MONOLITH SUPPORT)
    // ============================================================================
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudioCompany',
      index: true,
      required: false,
    },
    installedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },

    // ============================================================================
    // SHOPIFY STORE DETAILS
    // ============================================================================
    shopDomain: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
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

    // ============================================================================
    // OAUTH CREDENTIALS (encrypted)
    // ============================================================================
    accessToken: {
      type: String,
      required: true,
      select: false, // Never return in queries by default
    },
    tokenType: {
      type: String,
      default: 'bearer',
    },
    // Note: Shopify doesn't provide refresh tokens - access tokens don't expire

    // ============================================================================
    // CONNECTION METADATA
    // ============================================================================
    scopes: [String],
    installedAt: {
      type: Date,
      default: Date.now,
    },

    // ============================================================================
    // STATUS & TRACKING
    // ============================================================================
    status: {
      type: String,
      enum: ['active', 'suspended', 'revoked', 'error'],
      default: 'active',
      index: true,
    },
    lastSyncedAt: {
      type: Date,
    },
    lastVerifiedAt: {
      type: Date,
    },

    // ============================================================================
    // SYNC SETTINGS
    // ============================================================================
    syncSettings: {
      autoSyncProducts: {
        type: Boolean,
        default: false,
      },
      autoSyncOrders: {
        type: Boolean,
        default: false,
      },
      autoSyncThemes: {
        type: Boolean,
        default: true,
      },
      syncInterval: {
        type: Number,
        default: 3600, // seconds
      },
    },

    // ============================================================================
    // WEBHOOKS
    // ============================================================================
    webhooks: [
      {
        webhookId: String,
        topic: String,
        address: String,
        createdAt: Date,
      },
    ],

    // ============================================================================
    // STORE CAPABILITIES
    // ============================================================================
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

    // ============================================================================
    // THEME INDEXING & TRACKING
    // ============================================================================
    indexing: {
      enabled: {
        type: Boolean,
        default: true,
      },
      lastIndexedAt: Date,
      indexStatus: {
        type: String,
        enum: ['pending', 'indexing', 'completed', 'failed'],
        default: 'pending',
      },
      themesIndexed: {
        type: Number,
        default: 0,
      },
      assetsIndexed: {
        type: Number,
        default: 0,
      },
      filesAnalyzed: {
        type: Number,
        default: 0,
      },
      lastError: String,
    },

    // ============================================================================
    // HEALTH MONITORING
    // ============================================================================
    health: {
      lastCheck: {
        type: Date,
        index: true,
      },
      consecutiveFailures: {
        type: Number,
        default: 0,
      },
      lastSuccess: Date,
      isValid: Boolean,
      errorMessage: String,
      checks: {
        storeAccessible: Boolean,
        apiAvailable: Boolean,
        scopesValid: Boolean,
        lastChecked: Date,
      },
    },

    // ============================================================================
    // METRICS
    // ============================================================================
    metrics: {
      totalApiCalls: {
        type: Number,
        default: 0,
      },
      lastApiCallAt: Date,
      totalWebhooksReceived: {
        type: Number,
        default: 0,
      },
      productsCount: Number,
      collectionsCount: Number,
      ordersCount: Number,
      themesCount: Number,
      averageResponseTime: Number,
    },

    // ============================================================================
    // SETTINGS
    // ============================================================================
    settings: {
      enableHealthMonitoring: {
        type: Boolean,
        default: true,
      },
      healthCheckInterval: {
        type: Number,
        default: 3600000, // 1 hour in milliseconds
      },
      enableIndexing: {
        type: Boolean,
        default: true,
      },
      notifyOnThemeChange: {
        type: Boolean,
        default: true,
      },
      notifyOnProductChange: {
        type: Boolean,
        default: false,
      },
    },

    // ============================================================================
    // SOFT DELETE
    // ============================================================================
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: Date,
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    // ============================================================================
    // FLEXIBLE METADATA
    // ============================================================================
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// ============================================================================
// INDEXES
// ============================================================================

// Multi-tenant queries
shopifyConnectionSchema.index({ userId: 1, organizationId: 1 });
shopifyConnectionSchema.index({ organizationId: 1, status: 1 });

// Legacy monolith queries
shopifyConnectionSchema.index({ companyId: 1, status: 1, isDeleted: 1 });

// Shop domain lookup (unique)
shopifyConnectionSchema.index({ shopDomain: 1 }, { unique: true });

// Health checks
shopifyConnectionSchema.index({ 'settings.enableHealthMonitoring': 1, status: 1 });

// ============================================================================
// PRE-SAVE MIDDLEWARE - Encrypt sensitive fields
// ============================================================================

shopifyConnectionSchema.pre('save', function (next) {
  try {
    // Encrypt access token
    if (this.isModified('accessToken') && this.accessToken && !this._accessTokenEncrypted) {
      this.accessToken = encrypt(this.accessToken);
      this._accessTokenEncrypted = true;
    }

    next();
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// INSTANCE METHODS
// ============================================================================

/**
 * Get decrypted access token
 */
shopifyConnectionSchema.methods.getAccessToken = function () {
  return this.accessToken ? decrypt(this.accessToken) : null;
};

/**
 * Update access token
 */
shopifyConnectionSchema.methods.updateToken = async function (accessToken) {
  this._accessTokenEncrypted = false; // Reset flag for re-encryption
  this.accessToken = accessToken;
  this.status = 'active';
  this.lastVerifiedAt = new Date();
  await this.save();
};

/**
 * Record health check result
 */
shopifyConnectionSchema.methods.recordHealthCheck = async function (healthData) {
  const now = new Date();

  if (healthData.valid || healthData.success) {
    this.health.consecutiveFailures = 0;
    this.health.lastSuccess = now;
    this.health.isValid = true;
    this.health.errorMessage = null;
  } else {
    this.health.consecutiveFailures++;
    this.health.isValid = false;
    this.health.errorMessage = healthData.error || healthData.errorMessage;

    // Auto-suspend after 5 consecutive failures
    if (this.health.consecutiveFailures >= 5 && this.status === 'active') {
      this.status = 'suspended';
    }
  }

  this.health.lastCheck = now;
  this.health.checks = {
    storeAccessible: healthData.storeAccessible !== undefined ? healthData.storeAccessible : true,
    apiAvailable: healthData.apiAvailable !== undefined ? healthData.apiAvailable : true,
    scopesValid: healthData.scopesValid !== undefined ? healthData.scopesValid : true,
    lastChecked: now,
  };

  return await this.save();
};

/**
 * Track API call
 */
shopifyConnectionSchema.methods.trackApiCall = async function (responseTime) {
  this.metrics.totalApiCalls++;
  this.metrics.lastApiCallAt = new Date();

  if (responseTime) {
    // Calculate running average
    const prevAvg = this.metrics.averageResponseTime || 0;
    const count = this.metrics.totalApiCalls;
    this.metrics.averageResponseTime = (prevAvg * (count - 1) + responseTime) / count;
  }

  return await this.save();
};

/**
 * Track webhook received
 */
shopifyConnectionSchema.methods.trackWebhook = async function () {
  this.metrics.totalWebhooksReceived++;
  return await this.save();
};

/**
 * Update indexing status
 */
shopifyConnectionSchema.methods.updateIndexingStatus = async function (status, stats = {}) {
  this.indexing.indexStatus = status;
  this.indexing.lastIndexedAt = new Date();

  if (stats.themesIndexed !== undefined) {
    this.indexing.themesIndexed = stats.themesIndexed;
  }
  if (stats.assetsIndexed !== undefined) {
    this.indexing.assetsIndexed = stats.assetsIndexed;
  }
  if (stats.filesAnalyzed !== undefined) {
    this.indexing.filesAnalyzed = stats.filesAnalyzed;
  }
  if (stats.error) {
    this.indexing.lastError = stats.error;
  }

  return await this.save();
};

/**
 * Update store metrics
 */
shopifyConnectionSchema.methods.updateMetrics = async function (metrics) {
  if (metrics.productsCount !== undefined) {
    this.metrics.productsCount = metrics.productsCount;
  }
  if (metrics.collectionsCount !== undefined) {
    this.metrics.collectionsCount = metrics.collectionsCount;
  }
  if (metrics.ordersCount !== undefined) {
    this.metrics.ordersCount = metrics.ordersCount;
  }
  if (metrics.themesCount !== undefined) {
    this.metrics.themesCount = metrics.themesCount;
  }

  return await this.save();
};

/**
 * Soft delete connection
 */
shopifyConnectionSchema.methods.softDelete = async function (userId) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = userId;
  this.status = 'revoked';

  return await this.save();
};

// ============================================================================
// STATIC METHODS
// ============================================================================

/**
 * Find connection by either modern or legacy identifier
 */
shopifyConnectionSchema.statics.findConnection = function (params) {
  const query = { isDeleted: false };

  if (params.userId && params.organizationId) {
    // Modern multi-tenant lookup
    query.userId = params.userId;
    query.organizationId = params.organizationId;
  } else if (params.companyId) {
    // Legacy monolith lookup
    query.companyId = params.companyId;
  } else {
    throw new Error('Must provide either (userId + organizationId) or companyId');
  }

  if (params.shopDomain) {
    query.shopDomain = params.shopDomain.toLowerCase();
  }

  return this.findOne(query);
};

/**
 * Find active connections for user
 */
shopifyConnectionSchema.statics.findActiveByUser = function (userId, organizationId) {
  return this.find({
    userId,
    organizationId,
    status: 'active',
    isDeleted: false,
  });
};

/**
 * Find active connections for company (legacy)
 */
shopifyConnectionSchema.statics.findActiveByCompany = function (companyId) {
  return this.find({
    companyId,
    status: 'active',
    isDeleted: false,
  });
};

/**
 * Find connection by shop domain
 */
shopifyConnectionSchema.statics.findByShopDomain = function (shopDomain) {
  return this.findOne({
    shopDomain: shopDomain.toLowerCase(),
    isDeleted: false,
  });
};

/**
 * Find connections requiring health check
 */
shopifyConnectionSchema.statics.findNeedingHealthCheck = function () {
  const now = new Date();

  return this.find({
    status: 'active',
    isDeleted: false,
    'settings.enableHealthMonitoring': true,
    $or: [
      { 'health.lastCheck': { $exists: false } },
      {
        'health.lastCheck': {
          $lt: new Date(now - this.schema.path('settings.healthCheckInterval').default()),
        },
      },
    ],
  });
};

/**
 * Find connections requiring theme indexing
 */
shopifyConnectionSchema.statics.findNeedingIndexing = function () {
  const now = new Date();
  const indexInterval = 86400000; // 24 hours

  return this.find({
    status: 'active',
    isDeleted: false,
    'settings.enableIndexing': true,
    'indexing.enabled': true,
    $or: [
      { 'indexing.lastIndexedAt': { $exists: false } },
      {
        'indexing.lastIndexedAt': {
          $lt: new Date(now - indexInterval),
        },
      },
      { 'indexing.indexStatus': 'pending' },
    ],
  });
};

const ShopifyConnection = mongoose.model('ShopifyConnection', shopifyConnectionSchema);

export default ShopifyConnection;
