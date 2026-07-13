import express from 'express';
import config from '../../../config/index.js';
import ShopifyConnection from '../../../providers/shopify/models/ShopifyConnection.js';
import WordPressConnection from '../../../providers/wordpress/models/WordPressConnection.js';
import logger from '../../../utils/logger.js';

const router = express.Router();

/**
 * Get platform status for a given organization
 * Reports credential availability + active connection records
 * Used by the main backend to determine Shopify/WordPress integration status
 */
router.get('/:organizationId', async (req, res, next) => {
  try {
    const { organizationId } = req.params;

    if (!organizationId) {
      return res.status(400).json({ error: 'organizationId is required' });
    }

    // Shopify status
    const shopifyCredentialsPresent = !!config.shopify.clientId && !!config.shopify.clientSecret;
    const shopifyConnection = await ShopifyConnection.findOne({
      organizationId,
      status: 'active',
    }).lean().select('-accessToken -__v');

    // WordPress status
    const wordpressCredentialsPresent = !!config.wordpress.clientId && !!config.wordpress.clientSecret;
    const wordpressConnection = await WordPressConnection.findOne({
      organizationId,
      status: { $in: ['active'] },
    }).lean().select('-accessToken -refreshToken -applicationPassword -__v');

    const result = {
      service: 'flora-cms-commerce',
      timestamp: new Date().toISOString(),
      platforms: {
        shopify: {
          credentialsPresent: shopifyCredentialsPresent,
          connected: !!shopifyConnection,
          status: shopifyConnection?.status || (shopifyCredentialsPresent ? 'configured' : 'not_configured'),
          connection: shopifyConnection ? {
            shopDomain: shopifyConnection.shopDomain,
            shopName: shopifyConnection.shopName,
            scopes: shopifyConnection.scopes,
            planName: shopifyConnection.planName,
            lastSyncedAt: shopifyConnection.lastSyncedAt,
          } : null,
        },
        wordpress: {
          credentialsPresent: wordpressCredentialsPresent,
          connected: !!wordpressConnection,
          status: wordpressConnection?.status || (wordpressCredentialsPresent ? 'configured' : 'not_configured'),
          connection: wordpressConnection ? {
            siteUrl: wordpressConnection.siteUrl,
            siteName: wordpressConnection.siteName,
            siteType: wordpressConnection.siteType,
            lastSyncedAt: wordpressConnection.lastSyncedAt,
          } : null,
        },
      },
    };

    res.json(result);
  } catch (error) {
    logger.error('Error in status endpoint:', error);
    next(error);
  }
});

/**
 * Health check with credential status (no organization required)
 * Used by the main backend to check if the service is reachable and has credentials
 */
router.get('/health', async (req, res) => {
  const shopifyCredentialsPresent = !!config.shopify.clientId && !!config.shopify.clientSecret;
  const wordpressCredentialsPresent = !!config.wordpress.clientId && !!config.wordpress.clientSecret;

  res.json({
    service: 'flora-cms-commerce',
    status: 'ok',
    timestamp: new Date().toISOString(),
    credentials: {
      shopify: shopifyCredentialsPresent,
      wordpress: wordpressCredentialsPresent,
    },
  });
});

export default router;
