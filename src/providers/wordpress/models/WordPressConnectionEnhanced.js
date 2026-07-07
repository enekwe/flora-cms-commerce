import mongoose from 'mongoose';
import { encrypt, decrypt } from '../../../utils/encryption.js';

/**
 * Enhanced WordPress Connection Schema
 * Combines microservice multi-tenancy with monolith feature parity
 *
 * Supports both:
 * - Modern: userId + organizationId (multi-tenant)
 * - Legacy: companyId (backward compatibility with monolith)
 */
const wordPressConnectionSchema = new mongoose.Schema(
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
      required: false, // Optional for backward compatibility
    },
    installedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },

    // ============================================================================
    // WORDPRESS SITE DETAILS
    // ============================================================================
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
      lowercase: true,
      trim: true,
    },
    siteDescription: {
      type: String,
      trim: true,
    },
    siteType: {
      type: String,
      enum: ['wordpress.com', 'self-hosted'],
      default: 'wordpress.com',
    },
    wordpressVersion: {
      type: String,
      trim: true,
    },
    isMultisite: {
      type: Boolean,
      default: false,
    },

    // ============================================================================
    // AUTHENTICATION
    // ============================================================================
    authMethod: {
      type: String,
      enum: ['application_password', 'jwt', 'basic_auth', 'oauth'],
      default: 'application_password',
    },

    // OAuth credentials (encrypted) - for WordPress.com
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

    // Application Password (encrypted) - for self-hosted
    username: {
      type: String,
    },
    applicationPassword: {
      type: String,
      select: false,
    },

    // JWT token (encrypted) - alternative auth
    jwtToken: {
      type: String,
      select: false,
    },
    jwtExpiry: {
      type: Date,
    },

    // ============================================================================
    // FTP/SFTP CONFIGURATION (for file access)
    // ============================================================================
    ftpConfig: {
      enabled: {
        type: Boolean,
        default: false,
      },
      protocol: {
        type: String,
        enum: ['ftp', 'ftps', 'sftp'],
        default: 'sftp',
      },
      host: {
        type: String,
        trim: true,
      },
      port: {
        type: Number,
        default: 22,
      },
      username: {
        type: String,
        trim: true,
      },
      password: {
        type: String,
        select: false, // Encrypted
      },
      basePath: {
        type: String,
        default: '/',
        trim: true,
      },
    },

    // ============================================================================
    // THEME TRACKING
    // ============================================================================
    activeTheme: {
      slug: String,
      name: String,
      version: String,
      author: String,
      authorUri: String,
      themeUri: String,
      description: String,
      screenshot: String,
      tags: [String],
      lastUpdated: Date,
    },

    installedThemes: [
      {
        slug: { type: String, required: true },
        name: String,
        version: String,
        author: String,
        isActive: Boolean,
        lastChecked: Date,
      },
    ],

    // ============================================================================
    // PLUGIN TRACKING
    // ============================================================================
    installedPlugins: [
      {
        slug: { type: String, required: true },
        name: String,
        version: String,
        author: String,
        pluginUri: String,
        description: String,
        isActive: Boolean,
        requiresUpdate: Boolean,
        lastChecked: Date,
      },
    ],

    // ============================================================================
    // WEBHOOK CONFIGURATION
    // ============================================================================
    webhook: {
      enabled: {
        type: Boolean,
        default: false,
      },
      webhookId: {
        type: String,
        index: true,
      },
      secret: {
        type: String,
        select: false, // Encrypted
      },
      callbackUrl: {
        type: String,
        trim: true,
      },
      events: [
        {
          type: String,
          enum: [
            'theme_switched',
            'plugin_activated',
            'plugin_deactivated',
            'plugin_updated',
            'theme_updated',
            'core_updated',
            'post_updated',
            'post_published',
            'site_health_changed',
            'user_registered',
          ],
        },
      ],
      lastWebhookAt: Date,
      totalWebhooks: {
        type: Number,
        default: 0,
      },
    },

    // ============================================================================
    // INDEXING CONFIGURATION
    // ============================================================================
    indexing: {
      enabled: {
        type: Boolean,
        default: true,
      },
      autoSync: {
        type: Boolean,
        default: true,
      },
      lastIndexedAt: Date,
      indexStatus: {
        type: String,
        enum: ['pending', 'indexing', 'completed', 'failed', 'disabled'],
        default: 'pending',
      },
      totalFiles: {
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
      errorMessage: String,
      checks: {
        apiAvailable: {
          type: Boolean,
          default: null,
        },
        authenticationValid: {
          type: Boolean,
          default: null,
        },
        themeActive: {
          type: Boolean,
          default: null,
        },
        coreUpToDate: {
          type: Boolean,
          default: null,
        },
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
      totalIndexingRuns: {
        type: Number,
        default: 0,
      },
      averageResponseTime: Number,
      uptimePercentage: Number,
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
      enableAutoUpdates: {
        type: Boolean,
        default: false,
      },
      notifyOnThemeChange: {
        type: Boolean,
        default: true,
      },
      notifyOnPluginChange: {
        type: Boolean,
        default: true,
      },
      notifyOnCoreUpdate: {
        type: Boolean,
        default: true,
      },
    },

    // ============================================================================
    // CONNECTION STATUS
    // ============================================================================
    status: {
      type: String,
      enum: ['active', 'suspended', 'expired', 'revoked', 'error', 'disconnected'],
      default: 'active',
      index: true,
    },

    // ============================================================================
    // TIMESTAMPS
    // ============================================================================
    installedAt: {
      type: Date,
      default: Date.now,
    },
    lastSyncedAt: {
      type: Date,
    },
    lastVerifiedAt: {
      type: Date,
    },
    suspendedAt: {
      type: Date,
    },
    disconnectedAt: {
      type: Date,
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
wordPressConnectionSchema.index({ userId: 1, organizationId: 1 });
wordPressConnectionSchema.index({ organizationId: 1, status: 1 });

// Legacy monolith queries
wordPressConnectionSchema.index({ companyId: 1, status: 1, isDeleted: 1 });

// Site URL lookup
wordPressConnectionSchema.index({ siteUrl: 1, isDeleted: 1 });

// Health checks
wordPressConnectionSchema.index({ 'settings.enableHealthMonitoring': 1, status: 1 });

// Webhook lookups
wordPressConnectionSchema.index({ 'webhook.webhookId': 1 });

// ============================================================================
// PRE-SAVE MIDDLEWARE - Encrypt sensitive fields
// ============================================================================

wordPressConnectionSchema.pre('save', function (next) {
  try {
    // Encrypt access token
    if (this.isModified('accessToken') && this.accessToken && !this._accessTokenEncrypted) {
      this.accessToken = encrypt(this.accessToken);
      this._accessTokenEncrypted = true;
    }

    // Encrypt refresh token
    if (this.isModified('refreshToken') && this.refreshToken && !this._refreshTokenEncrypted) {
      this.refreshToken = encrypt(this.refreshToken);
      this._refreshTokenEncrypted = true;
    }

    // Encrypt application password
    if (this.isModified('applicationPassword') && this.applicationPassword && !this._appPasswordEncrypted) {
      this.applicationPassword = encrypt(this.applicationPassword);
      this._appPasswordEncrypted = true;
    }

    // Encrypt JWT token
    if (this.isModified('jwtToken') && this.jwtToken && !this._jwtTokenEncrypted) {
      this.jwtToken = encrypt(this.jwtToken);
      this._jwtTokenEncrypted = true;
    }

    // Encrypt FTP password
    if (this.isModified('ftpConfig.password') && this.ftpConfig.password && !this._ftpPasswordEncrypted) {
      this.ftpConfig.password = encrypt(this.ftpConfig.password);
      this._ftpPasswordEncrypted = true;
    }

    // Encrypt webhook secret
    if (this.isModified('webhook.secret') && this.webhook.secret && !this._webhookSecretEncrypted) {
      this.webhook.secret = encrypt(this.webhook.secret);
      this._webhookSecretEncrypted = true;
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
wordPressConnectionSchema.methods.getAccessToken = function () {
  return this.accessToken ? decrypt(this.accessToken) : null;
};

/**
 * Get decrypted refresh token
 */
wordPressConnectionSchema.methods.getRefreshToken = function () {
  return this.refreshToken ? decrypt(this.refreshToken) : null;
};

/**
 * Get decrypted application password
 */
wordPressConnectionSchema.methods.getApplicationPassword = function () {
  return this.applicationPassword ? decrypt(this.applicationPassword) : null;
};

/**
 * Get decrypted JWT token
 */
wordPressConnectionSchema.methods.getJwtToken = function () {
  return this.jwtToken ? decrypt(this.jwtToken) : null;
};

/**
 * Check if JWT token is expired
 */
wordPressConnectionSchema.methods.isJwtTokenExpired = function () {
  if (!this.jwtExpiry) return true;
  return new Date() > this.jwtExpiry;
};

/**
 * Get decrypted FTP password
 */
wordPressConnectionSchema.methods.getFtpPassword = function () {
  if (!this.ftpConfig.password) return null;
  return decrypt(this.ftpConfig.password);
};

/**
 * Get decrypted webhook secret
 */
wordPressConnectionSchema.methods.getWebhookSecret = function () {
  if (!this.webhook.secret) return null;
  return decrypt(this.webhook.secret);
};

/**
 * Check if token is expired
 */
wordPressConnectionSchema.methods.isTokenExpired = function () {
  if (!this.expiresAt) return false;
  return new Date() >= this.expiresAt;
};

/**
 * Update access token
 */
wordPressConnectionSchema.methods.updateToken = async function (accessToken, refreshToken, expiresIn) {
  this._accessTokenEncrypted = false; // Reset flag for re-encryption
  this.accessToken = accessToken;

  if (refreshToken) {
    this._refreshTokenEncrypted = false;
    this.refreshToken = refreshToken;
  }

  if (expiresIn) {
    this.expiresAt = new Date(Date.now() + expiresIn * 1000);
  }

  this.status = 'active';
  this.lastVerifiedAt = new Date();
  await this.save();
};

/**
 * Update active theme
 */
wordPressConnectionSchema.methods.updateActiveTheme = async function (themeData) {
  this.activeTheme = {
    slug: themeData.slug,
    name: themeData.name,
    version: themeData.version,
    author: themeData.author,
    authorUri: themeData.author_uri,
    themeUri: themeData.theme_uri,
    description: themeData.description,
    screenshot: themeData.screenshot,
    tags: themeData.tags || [],
    lastUpdated: new Date(),
  };

  // Update in installed themes list
  const existingTheme = this.installedThemes.find((t) => t.slug === themeData.slug);
  if (existingTheme) {
    existingTheme.isActive = true;
  }

  // Mark all other themes as inactive
  this.installedThemes.forEach((theme) => {
    if (theme.slug !== themeData.slug) {
      theme.isActive = false;
    }
  });

  return await this.save();
};

/**
 * Sync installed themes
 */
wordPressConnectionSchema.methods.syncThemes = async function (themesData) {
  this.installedThemes = themesData.map((theme) => ({
    slug: theme.slug,
    name: theme.name,
    version: theme.version,
    author: theme.author,
    isActive: theme.status === 'active' || theme.isActive,
    lastChecked: new Date(),
  }));

  return await this.save();
};

/**
 * Sync installed plugins
 */
wordPressConnectionSchema.methods.syncPlugins = async function (pluginsData) {
  this.installedPlugins = pluginsData.map((plugin) => ({
    slug: plugin.slug,
    name: plugin.name,
    version: plugin.version,
    author: plugin.author,
    pluginUri: plugin.plugin_uri || plugin.pluginUri,
    description: plugin.description,
    isActive: plugin.status === 'active' || plugin.isActive,
    requiresUpdate: plugin.update_available || plugin.requiresUpdate || false,
    lastChecked: new Date(),
  }));

  return await this.save();
};

/**
 * Record health check result
 */
wordPressConnectionSchema.methods.recordHealthCheck = async function (healthData) {
  const now = new Date();

  if (healthData.success) {
    this.health.consecutiveFailures = 0;
    this.health.lastSuccess = now;
    this.health.errorMessage = null;
  } else {
    this.health.consecutiveFailures++;
    this.health.errorMessage = healthData.error;

    // Auto-suspend after 5 consecutive failures
    if (this.health.consecutiveFailures >= 5 && this.status === 'active') {
      this.status = 'suspended';
      this.suspendedAt = now;
    }
  }

  this.health.lastCheck = now;
  this.health.checks = {
    apiAvailable: healthData.apiAvailable,
    authenticationValid: healthData.authenticationValid,
    themeActive: healthData.themeActive,
    coreUpToDate: healthData.coreUpToDate,
    lastChecked: now,
  };

  return await this.save();
};

/**
 * Track API call
 */
wordPressConnectionSchema.methods.trackApiCall = async function (responseTime) {
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
wordPressConnectionSchema.methods.trackWebhook = async function () {
  this.webhook.lastWebhookAt = new Date();
  this.webhook.totalWebhooks++;
  this.metrics.totalWebhooksReceived++;

  return await this.save();
};

/**
 * Soft delete connection
 */
wordPressConnectionSchema.methods.softDelete = async function (userId) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = userId;
  this.status = 'disconnected';
  this.disconnectedAt = new Date();

  return await this.save();
};

// ============================================================================
// STATIC METHODS
// ============================================================================

/**
 * Find connection by either modern or legacy identifier
 * Supports both multi-tenant (userId + organizationId) and monolith (companyId) lookups
 */
wordPressConnectionSchema.statics.findConnection = function (params) {
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

  if (params.siteId) {
    query.siteId = params.siteId;
  }

  return this.findOne(query);
};

/**
 * Find active connections for user/organization
 */
wordPressConnectionSchema.statics.findActiveByUser = function (userId, organizationId) {
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
wordPressConnectionSchema.statics.findActiveByCompany = function (companyId) {
  return this.find({
    companyId,
    status: 'active',
    isDeleted: false,
  });
};

/**
 * Find connection by site URL
 */
wordPressConnectionSchema.statics.findBySiteUrl = function (siteUrl) {
  return this.findOne({
    siteUrl: siteUrl.toLowerCase(),
    isDeleted: false,
  });
};

/**
 * Find connections requiring health check
 */
wordPressConnectionSchema.statics.findNeedingHealthCheck = function () {
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

const WordPressConnection = mongoose.model('WordPressConnection', wordPressConnectionSchema);

export default WordPressConnection;
