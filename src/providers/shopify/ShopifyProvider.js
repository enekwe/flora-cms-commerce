import shopifyAuthService from './services/shopifyAuthService.js';
import shopifyThemeService from './services/shopifyThemeService.js';
import shopifyProductService from './services/shopifyProductService.js';
import logger from '../../utils/logger.js';

/**
 * Shopify Provider Implementation
 * Implements ICommerceProvider interface for Shopify stores
 */
class ShopifyProvider {
  getName() {
    return 'shopify';
  }

  async initiateOAuth(userId, organizationId, shopDomain, redirectUri) {
    try {
      const result = shopifyAuthService.initiateOAuth(userId, organizationId, shopDomain, redirectUri);
      return result.authUrl;
    } catch (error) {
      logger.error(`Shopify initiateOAuth error: ${error.message}`);
      throw error;
    }
  }

  async handleOAuthCallback(code, shop, state, hmac) {
    try {
      return await shopifyAuthService.handleOAuthCallback(code, shop, state, hmac);
    } catch (error) {
      logger.error(`Shopify handleOAuthCallback error: ${error.message}`);
      throw error;
    }
  }

  async verifyConnection(connectionId) {
    try {
      return await shopifyAuthService.verifyConnection(connectionId);
    } catch (error) {
      logger.error(`Shopify verifyConnection error: ${error.message}`);
      throw error;
    }
  }

  async disconnect(connectionId) {
    try {
      await shopifyAuthService.disconnect(connectionId);
    } catch (error) {
      logger.error(`Shopify disconnect error: ${error.message}`);
      throw error;
    }
  }

  async getStore(connectionId) {
    try {
      const connections = await shopifyAuthService.getUserConnections(connectionId);
      return connections[0]; // Return the store for this connection
    } catch (error) {
      logger.error(`Shopify getStore error: ${error.message}`);
      throw error;
    }
  }

  async listProducts(connectionId, options) {
    try {
      return await shopifyProductService.listProducts(connectionId, options);
    } catch (error) {
      logger.error(`Shopify listProducts error: ${error.message}`);
      throw error;
    }
  }

  async getProduct(connectionId, productId) {
    try {
      return await shopifyProductService.getProduct(connectionId, productId);
    } catch (error) {
      logger.error(`Shopify getProduct error: ${error.message}`);
      throw error;
    }
  }

  async createProduct(connectionId, productData) {
    try {
      return await shopifyProductService.createProduct(connectionId, productData);
    } catch (error) {
      logger.error(`Shopify createProduct error: ${error.message}`);
      throw error;
    }
  }

  async updateProduct(connectionId, productId, productData) {
    try {
      return await shopifyProductService.updateProduct(connectionId, productId, productData);
    } catch (error) {
      logger.error(`Shopify updateProduct error: ${error.message}`);
      throw error;
    }
  }

  async deleteProduct(connectionId, productId) {
    try {
      await shopifyProductService.deleteProduct(connectionId, productId);
    } catch (error) {
      logger.error(`Shopify deleteProduct error: ${error.message}`);
      throw error;
    }
  }

  async listCollections(connectionId, options) {
    try {
      return await shopifyProductService.listCollections(connectionId, options);
    } catch (error) {
      logger.error(`Shopify listCollections error: ${error.message}`);
      throw error;
    }
  }

  async getCollection(connectionId, collectionId) {
    try {
      return await shopifyProductService.getCollection(connectionId, collectionId);
    } catch (error) {
      logger.error(`Shopify getCollection error: ${error.message}`);
      throw error;
    }
  }

  async listOrders(connectionId, options) {
    try {
      // Orders functionality can be implemented similarly to products
      throw new Error('Orders API not yet implemented');
    } catch (error) {
      logger.error(`Shopify listOrders error: ${error.message}`);
      throw error;
    }
  }

  async getOrder(connectionId, orderId) {
    try {
      throw new Error('Orders API not yet implemented');
    } catch (error) {
      logger.error(`Shopify getOrder error: ${error.message}`);
      throw error;
    }
  }

  async listThemes(connectionId) {
    try {
      return await shopifyThemeService.listThemes(connectionId);
    } catch (error) {
      logger.error(`Shopify listThemes error: ${error.message}`);
      throw error;
    }
  }

  async getActiveTheme(connectionId) {
    try {
      return await shopifyThemeService.getActiveTheme(connectionId);
    } catch (error) {
      logger.error(`Shopify getActiveTheme error: ${error.message}`);
      throw error;
    }
  }

  async getThemeAssets(connectionId, themeId) {
    try {
      return await shopifyThemeService.getThemeAssets(connectionId, themeId);
    } catch (error) {
      logger.error(`Shopify getThemeAssets error: ${error.message}`);
      throw error;
    }
  }

  async updateThemeAsset(connectionId, themeId, assetKey, content) {
    try {
      await shopifyThemeService.updateAsset(connectionId, themeId, assetKey, content);
    } catch (error) {
      logger.error(`Shopify updateThemeAsset error: ${error.message}`);
      throw error;
    }
  }

  async customizeTheme(connectionId, themeId, customCSS) {
    try {
      await shopifyThemeService.customizeTheme(connectionId, themeId, customCSS);
    } catch (error) {
      logger.error(`Shopify customizeTheme error: ${error.message}`);
      throw error;
    }
  }

  async getThemeCustomizations(connectionId, themeId) {
    try {
      return await shopifyThemeService.getThemeCustomizations(connectionId, themeId);
    } catch (error) {
      logger.error(`Shopify getThemeCustomizations error: ${error.message}`);
      throw error;
    }
  }

  async syncProducts(connectionId, options) {
    try {
      return await shopifyProductService.syncProducts(connectionId, options);
    } catch (error) {
      logger.error(`Shopify syncProducts error: ${error.message}`);
      throw error;
    }
  }

  // Additional Shopify-specific methods
  async duplicateTheme(connectionId, themeId) {
    try {
      return await shopifyThemeService.duplicateTheme(connectionId, themeId);
    } catch (error) {
      logger.error(`Shopify duplicateTheme error: ${error.message}`);
      throw error;
    }
  }

  async publishTheme(connectionId, themeId) {
    try {
      return await shopifyThemeService.publishTheme(connectionId, themeId);
    } catch (error) {
      logger.error(`Shopify publishTheme error: ${error.message}`);
      throw error;
    }
  }

  async previewTheme(connectionId, themeId) {
    try {
      return await shopifyThemeService.previewTheme(connectionId, themeId);
    } catch (error) {
      logger.error(`Shopify previewTheme error: ${error.message}`);
      throw error;
    }
  }

  async getProductCount(connectionId) {
    try {
      return await shopifyProductService.getProductCount(connectionId);
    } catch (error) {
      logger.error(`Shopify getProductCount error: ${error.message}`);
      throw error;
    }
  }

  async createWebhook(connectionId, topic, address) {
    try {
      return await shopifyAuthService.createWebhook(connectionId, topic, address);
    } catch (error) {
      logger.error(`Shopify createWebhook error: ${error.message}`);
      throw error;
    }
  }
}

export default new ShopifyProvider();
