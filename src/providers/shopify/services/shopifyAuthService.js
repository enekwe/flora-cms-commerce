import axios from 'axios';
import crypto from 'crypto';
import config from '../../../config/index.js';
import ShopifyConnection from '../models/ShopifyConnection.js';
import logger from '../../../utils/logger.js';

/**
 * Shopify Authentication Service
 * Handles OAuth flow for Shopify stores
 */
class ShopifyAuthService {
  /**
   * Generate OAuth state parameter
   */
  generateState(userId, organizationId, shopDomain) {
    const stateData = {
      userId,
      organizationId,
      shopDomain,
      nonce: crypto.randomBytes(16).toString('hex'),
      timestamp: Date.now(),
    };
    return Buffer.from(JSON.stringify(stateData)).toString('base64');
  }

  /**
   * Parse OAuth state parameter
   */
  parseState(state) {
    try {
      const decoded = Buffer.from(state, 'base64').toString('utf8');
      return JSON.parse(decoded);
    } catch (error) {
      throw new Error('Invalid state parameter');
    }
  }

  /**
   * Verify HMAC signature from Shopify
   */
  verifyHmac(query) {
    const { hmac, ...params } = query;

    const message = Object.keys(params)
      .sort()
      .map((key) => `${key}=${params[key]}`)
      .join('&');

    const generatedHash = crypto
      .createHmac('sha256', config.shopify.clientSecret)
      .update(message)
      .digest('hex');

    return crypto.timingSafeEqual(Buffer.from(generatedHash), Buffer.from(hmac));
  }

  /**
   * Initiate Shopify OAuth flow
   */
  initiateOAuth(userId, organizationId, shopDomain, redirectUri) {
    // Ensure shop domain has .myshopify.com
    let normalizedShop = shopDomain.toLowerCase().trim();
    if (!normalizedShop.includes('.myshopify.com')) {
      normalizedShop = `${normalizedShop}.myshopify.com`;
    }

    const state = this.generateState(userId, organizationId, normalizedShop);

    const authUrl = new URL(`https://${normalizedShop}/admin/oauth/authorize`);
    authUrl.searchParams.append('client_id', config.shopify.clientId);
    authUrl.searchParams.append('scope', config.shopify.scopes);
    authUrl.searchParams.append('redirect_uri', redirectUri || config.shopify.redirectUri);
    authUrl.searchParams.append('state', state);

    logger.info(`Shopify OAuth initiated for user ${userId}, shop ${normalizedShop}`);

    return {
      authUrl: authUrl.toString(),
      state,
      shopDomain: normalizedShop,
    };
  }

  /**
   * Handle OAuth callback and exchange code for access token
   */
  async handleOAuthCallback(code, shop, state, hmac) {
    try {
      // Verify HMAC
      if (!this.verifyHmac({ code, shop, state, hmac })) {
        throw new Error('Invalid HMAC signature');
      }

      // Validate state
      const stateData = this.parseState(state);
      const { userId, organizationId, shopDomain } = stateData;

      if (shopDomain !== shop) {
        throw new Error('Shop domain mismatch');
      }

      // Exchange code for access token
      const tokenResponse = await axios.post(`https://${shop}/admin/oauth/access_token`, {
        client_id: config.shopify.clientId,
        client_secret: config.shopify.clientSecret,
        code,
      });

      const { access_token, scope } = tokenResponse.data;

      // Get store details
      const storeDetails = await this.getStoreDetails(shop, access_token);

      // Check if connection already exists
      let connection = await ShopifyConnection.findByShopDomain(shop);

      if (connection) {
        // Update existing connection
        await connection.updateToken(access_token);
        connection.scopes = scope.split(',');
        connection.metadata.storeDetails = storeDetails;
        await connection.save();
        logger.info(`Shopify connection updated for user ${userId}, shop ${shop}`);
      } else {
        // Create new connection
        connection = new ShopifyConnection({
          userId,
          organizationId,
          shopDomain: shop,
          shopName: storeDetails.name,
          shopEmail: storeDetails.email,
          shopCurrency: storeDetails.currency,
          shopTimezone: storeDetails.timezone,
          shopifyStoreId: storeDetails.id.toString(),
          accessToken: access_token,
          scopes: scope.split(','),
          planName: storeDetails.plan_name,
          planDisplayName: storeDetails.plan_display_name,
          status: 'active',
          installedAt: new Date(),
          lastVerifiedAt: new Date(),
          metadata: {
            storeDetails,
          },
        });
        await connection.save();
        logger.info(`Shopify connection created for user ${userId}, shop ${shop}`);
      }

      return {
        connectionId: connection._id,
        shopDomain: shop,
        shopName: storeDetails.name,
        shopId: storeDetails.id.toString(),
      };
    } catch (error) {
      logger.error(`Shopify OAuth callback error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get store details from Shopify
   */
  async getStoreDetails(shop, accessToken) {
    try {
      const response = await axios.get(`https://${shop}/admin/api/${config.shopify.apiVersion}/shop.json`, {
        headers: {
          'X-Shopify-Access-Token': accessToken,
        },
      });
      return response.data.shop;
    } catch (error) {
      logger.error(`Error fetching Shopify store details: ${error.message}`);
      throw error;
    }
  }

  /**
   * Verify connection is valid
   */
  async verifyConnection(connectionId) {
    try {
      const connection = await ShopifyConnection.findById(connectionId).select('+accessToken');

      if (!connection) {
        throw new Error('Connection not found');
      }

      const accessToken = connection.getAccessToken();

      // Try to fetch shop details
      const response = await axios.get(
        `https://${connection.shopDomain}/admin/api/${config.shopify.apiVersion}/shop.json`,
        {
          headers: {
            'X-Shopify-Access-Token': accessToken,
          },
        }
      );

      connection.lastVerifiedAt = new Date();
      connection.status = 'active';
      await connection.save();

      return true;
    } catch (error) {
      logger.error(`Error verifying Shopify connection: ${error.message}`);

      // Update connection status
      const connection = await ShopifyConnection.findById(connectionId);
      if (connection) {
        connection.status = 'error';
        await connection.save();
      }

      return false;
    }
  }

  /**
   * Disconnect and revoke access
   */
  async disconnect(connectionId) {
    try {
      const connection = await ShopifyConnection.findById(connectionId).select('+accessToken');

      if (!connection) {
        throw new Error('Connection not found');
      }

      const accessToken = connection.getAccessToken();

      // Uninstall app (delete access token)
      try {
        await axios.delete(
          `https://${connection.shopDomain}/admin/api/${config.shopify.apiVersion}/api_clients/current.json`,
          {
            headers: {
              'X-Shopify-Access-Token': accessToken,
            },
          }
        );
      } catch (error) {
        // Token might already be revoked
        logger.warn(`Error revoking Shopify token: ${error.message}`);
      }

      connection.status = 'revoked';
      await connection.save();

      logger.info(`Shopify connection ${connectionId} disconnected`);
    } catch (error) {
      logger.error(`Error disconnecting Shopify: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all connections for user
   */
  async getUserConnections(userId, organizationId) {
    try {
      const connections = await ShopifyConnection.findActiveByUser(userId, organizationId);
      return connections.map((conn) => ({
        connectionId: conn._id,
        shopDomain: conn.shopDomain,
        shopName: conn.shopName,
        shopId: conn.shopifyStoreId,
        status: conn.status,
        planName: conn.planName,
        lastSyncedAt: conn.lastSyncedAt,
        lastVerifiedAt: conn.lastVerifiedAt,
      }));
    } catch (error) {
      logger.error(`Error fetching Shopify connections: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create webhook
   */
  async createWebhook(connectionId, topic, address) {
    try {
      const connection = await ShopifyConnection.findById(connectionId).select('+accessToken');

      if (!connection) {
        throw new Error('Connection not found');
      }

      const accessToken = connection.getAccessToken();

      const response = await axios.post(
        `https://${connection.shopDomain}/admin/api/${config.shopify.apiVersion}/webhooks.json`,
        {
          webhook: {
            topic,
            address,
            format: 'json',
          },
        },
        {
          headers: {
            'X-Shopify-Access-Token': accessToken,
            'Content-Type': 'application/json',
          },
        }
      );

      const webhook = response.data.webhook;

      // Store webhook info
      connection.webhooks.push({
        webhookId: webhook.id.toString(),
        topic,
        address,
        createdAt: new Date(),
      });
      await connection.save();

      logger.info(`Webhook created for topic ${topic} on shop ${connection.shopDomain}`);

      return webhook;
    } catch (error) {
      logger.error(`Error creating Shopify webhook: ${error.message}`);
      throw error;
    }
  }
}

export default new ShopifyAuthService();
