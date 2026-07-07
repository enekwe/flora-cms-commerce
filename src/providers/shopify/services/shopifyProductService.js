import axios from 'axios';
import config from '../../../config/index.js';
import ShopifyConnection from '../models/ShopifyConnection.js';
import logger from '../../../utils/logger.js';

/**
 * Shopify Product Service
 * Handles product and collection synchronization
 */
class ShopifyProductService {
  /**
   * Get Shopify API axios instance
   */
  getShopifyAxios(shop, accessToken) {
    return axios.create({
      baseURL: `https://${shop}/admin/api/${config.shopify.apiVersion}`,
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * List products
   */
  async listProducts(connectionId, options = {}) {
    try {
      const connection = await ShopifyConnection.findById(connectionId).select('+accessToken');

      if (!connection) {
        throw new Error('Connection not found');
      }

      const { limit = 50, sinceId, status = 'active', fields } = options;

      const api = this.getShopifyAxios(connection.shopDomain, connection.getAccessToken());
      const params = {
        limit,
        status,
      };

      if (sinceId) params.since_id = sinceId;
      if (fields) params.fields = fields;

      const response = await api.get('/products.json', { params });

      logger.info(`Fetched ${response.data.products.length} products from ${connection.shopDomain}`);

      return response.data.products;
    } catch (error) {
      logger.error(`Error listing Shopify products: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get product by ID
   */
  async getProduct(connectionId, productId) {
    try {
      const connection = await ShopifyConnection.findById(connectionId).select('+accessToken');

      if (!connection) {
        throw new Error('Connection not found');
      }

      const api = this.getShopifyAxios(connection.shopDomain, connection.getAccessToken());
      const response = await api.get(`/products/${productId}.json`);

      return response.data.product;
    } catch (error) {
      logger.error(`Error getting Shopify product: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create product
   */
  async createProduct(connectionId, productData) {
    try {
      const connection = await ShopifyConnection.findById(connectionId).select('+accessToken');

      if (!connection) {
        throw new Error('Connection not found');
      }

      const api = this.getShopifyAxios(connection.shopDomain, connection.getAccessToken());
      const response = await api.post('/products.json', {
        product: productData,
      });

      logger.info(`Product created on ${connection.shopDomain}`);

      return response.data.product;
    } catch (error) {
      logger.error(`Error creating Shopify product: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update product
   */
  async updateProduct(connectionId, productId, productData) {
    try {
      const connection = await ShopifyConnection.findById(connectionId).select('+accessToken');

      if (!connection) {
        throw new Error('Connection not found');
      }

      const api = this.getShopifyAxios(connection.shopDomain, connection.getAccessToken());
      const response = await api.put(`/products/${productId}.json`, {
        product: productData,
      });

      logger.info(`Product ${productId} updated on ${connection.shopDomain}`);

      return response.data.product;
    } catch (error) {
      logger.error(`Error updating Shopify product: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete product
   */
  async deleteProduct(connectionId, productId) {
    try {
      const connection = await ShopifyConnection.findById(connectionId).select('+accessToken');

      if (!connection) {
        throw new Error('Connection not found');
      }

      const api = this.getShopifyAxios(connection.shopDomain, connection.getAccessToken());
      await api.delete(`/products/${productId}.json`);

      logger.info(`Product ${productId} deleted from ${connection.shopDomain}`);
    } catch (error) {
      logger.error(`Error deleting Shopify product: ${error.message}`);
      throw error;
    }
  }

  /**
   * List collections
   */
  async listCollections(connectionId, options = {}) {
    try {
      const connection = await ShopifyConnection.findById(connectionId).select('+accessToken');

      if (!connection) {
        throw new Error('Connection not found');
      }

      const { limit = 50, sinceId } = options;

      const api = this.getShopifyAxios(connection.shopDomain, connection.getAccessToken());
      const params = { limit };
      if (sinceId) params.since_id = sinceId;

      // Shopify has both smart collections and custom collections
      const [smartCollections, customCollections] = await Promise.all([
        api.get('/smart_collections.json', { params }),
        api.get('/custom_collections.json', { params }),
      ]);

      const collections = [
        ...smartCollections.data.smart_collections.map((c) => ({ ...c, type: 'smart' })),
        ...customCollections.data.custom_collections.map((c) => ({ ...c, type: 'custom' })),
      ];

      logger.info(`Fetched ${collections.length} collections from ${connection.shopDomain}`);

      return collections;
    } catch (error) {
      logger.error(`Error listing Shopify collections: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get collection by ID
   */
  async getCollection(connectionId, collectionId, collectionType = 'smart') {
    try {
      const connection = await ShopifyConnection.findById(connectionId).select('+accessToken');

      if (!connection) {
        throw new Error('Connection not found');
      }

      const api = this.getShopifyAxios(connection.shopDomain, connection.getAccessToken());
      const endpoint =
        collectionType === 'smart'
          ? `/smart_collections/${collectionId}.json`
          : `/custom_collections/${collectionId}.json`;

      const response = await api.get(endpoint);

      return response.data.smart_collection || response.data.custom_collection;
    } catch (error) {
      logger.error(`Error getting Shopify collection: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get products in a collection
   */
  async getCollectionProducts(connectionId, collectionId) {
    try {
      const connection = await ShopifyConnection.findById(connectionId).select('+accessToken');

      if (!connection) {
        throw new Error('Connection not found');
      }

      const api = this.getShopifyAxios(connection.shopDomain, connection.getAccessToken());
      const response = await api.get(`/collections/${collectionId}/products.json`);

      return response.data.products;
    } catch (error) {
      logger.error(`Error getting collection products: ${error.message}`);
      throw error;
    }
  }

  /**
   * Sync products (comprehensive sync)
   */
  async syncProducts(connectionId, options = {}) {
    try {
      const connection = await ShopifyConnection.findById(connectionId).select('+accessToken');

      if (!connection) {
        throw new Error('Connection not found');
      }

      const allProducts = [];
      let sinceId = null;
      let hasMore = true;

      while (hasMore) {
        const products = await this.listProducts(connectionId, {
          ...options,
          sinceId,
          limit: 250, // Max allowed by Shopify
        });

        allProducts.push(...products);

        if (products.length < 250) {
          hasMore = false;
        } else {
          sinceId = products[products.length - 1].id;
        }
      }

      connection.lastSyncedAt = new Date();
      await connection.save();

      logger.info(`Synced ${allProducts.length} total products from ${connection.shopDomain}`);

      return {
        products: allProducts,
        count: allProducts.length,
        syncedAt: connection.lastSyncedAt,
      };
    } catch (error) {
      logger.error(`Error syncing Shopify products: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get product count
   */
  async getProductCount(connectionId) {
    try {
      const connection = await ShopifyConnection.findById(connectionId).select('+accessToken');

      if (!connection) {
        throw new Error('Connection not found');
      }

      const api = this.getShopifyAxios(connection.shopDomain, connection.getAccessToken());
      const response = await api.get('/products/count.json');

      return response.data.count;
    } catch (error) {
      logger.error(`Error getting product count: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get product variants
   */
  async getProductVariants(connectionId, productId) {
    try {
      const connection = await ShopifyConnection.findById(connectionId).select('+accessToken');

      if (!connection) {
        throw new Error('Connection not found');
      }

      const api = this.getShopifyAxios(connection.shopDomain, connection.getAccessToken());
      const response = await api.get(`/products/${productId}/variants.json`);

      return response.data.variants;
    } catch (error) {
      logger.error(`Error getting product variants: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update inventory
   */
  async updateInventory(connectionId, inventoryItemId, locationId, available) {
    try {
      const connection = await ShopifyConnection.findById(connectionId).select('+accessToken');

      if (!connection) {
        throw new Error('Connection not found');
      }

      const api = this.getShopifyAxios(connection.shopDomain, connection.getAccessToken());
      const response = await api.post('/inventory_levels/set.json', {
        location_id: locationId,
        inventory_item_id: inventoryItemId,
        available,
      });

      logger.info(`Inventory updated for item ${inventoryItemId}`);

      return response.data.inventory_level;
    } catch (error) {
      logger.error(`Error updating inventory: ${error.message}`);
      throw error;
    }
  }
}

export default new ShopifyProductService();
