import axios from 'axios';
import config from '../../../config/index.js';
import ShopifyConnection from '../models/ShopifyConnection.js';
import logger from '../../../utils/logger.js';

/**
 * Shopify Theme Service
 * Handles theme management and Liquid template editing
 */
class ShopifyThemeService {
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
   * List all themes
   */
  async listThemes(connectionId) {
    try {
      const connection = await ShopifyConnection.findById(connectionId).select('+accessToken');

      if (!connection) {
        throw new Error('Connection not found');
      }

      const api = this.getShopifyAxios(connection.shopDomain, connection.getAccessToken());
      const response = await api.get('/themes.json');

      return response.data.themes;
    } catch (error) {
      logger.error(`Error listing Shopify themes: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get active theme
   */
  async getActiveTheme(connectionId) {
    try {
      const themes = await this.listThemes(connectionId);
      const activeTheme = themes.find((theme) => theme.role === 'main');

      return activeTheme;
    } catch (error) {
      logger.error(`Error getting active Shopify theme: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get theme by ID
   */
  async getTheme(connectionId, themeId) {
    try {
      const connection = await ShopifyConnection.findById(connectionId).select('+accessToken');

      if (!connection) {
        throw new Error('Connection not found');
      }

      const api = this.getShopifyAxios(connection.shopDomain, connection.getAccessToken());
      const response = await api.get(`/themes/${themeId}.json`);

      return response.data.theme;
    } catch (error) {
      logger.error(`Error getting Shopify theme: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get theme assets (templates, CSS, Liquid files)
   */
  async getThemeAssets(connectionId, themeId) {
    try {
      const connection = await ShopifyConnection.findById(connectionId).select('+accessToken');

      if (!connection) {
        throw new Error('Connection not found');
      }

      const api = this.getShopifyAxios(connection.shopDomain, connection.getAccessToken());
      const response = await api.get(`/themes/${themeId}/assets.json`);

      return response.data.assets;
    } catch (error) {
      logger.error(`Error getting Shopify theme assets: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get single asset
   */
  async getAsset(connectionId, themeId, assetKey) {
    try {
      const connection = await ShopifyConnection.findById(connectionId).select('+accessToken');

      if (!connection) {
        throw new Error('Connection not found');
      }

      const api = this.getShopifyAxios(connection.shopDomain, connection.getAccessToken());
      const response = await api.get(`/themes/${themeId}/assets.json`, {
        params: {
          'asset[key]': assetKey,
        },
      });

      return response.data.asset;
    } catch (error) {
      logger.error(`Error getting Shopify asset: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update theme asset (Liquid template or CSS)
   */
  async updateAsset(connectionId, themeId, assetKey, content) {
    try {
      const connection = await ShopifyConnection.findById(connectionId).select('+accessToken');

      if (!connection) {
        throw new Error('Connection not found');
      }

      const api = this.getShopifyAxios(connection.shopDomain, connection.getAccessToken());
      const response = await api.put(`/themes/${themeId}/assets.json`, {
        asset: {
          key: assetKey,
          value: content,
        },
      });

      logger.info(`Asset ${assetKey} updated for theme ${themeId}`);

      return response.data.asset;
    } catch (error) {
      logger.error(`Error updating Shopify asset: ${error.message}`);
      throw error;
    }
  }

  /**
   * Customize theme (apply custom CSS)
   */
  async customizeTheme(connectionId, themeId, customCSS) {
    try {
      const connection = await ShopifyConnection.findById(connectionId).select('+accessToken');

      if (!connection) {
        throw new Error('Connection not found');
      }

      // Find or create a custom CSS file
      const customCSSKey = 'assets/custom.css';

      // Get existing custom CSS if it exists
      let existingCSS = '';
      try {
        const existingAsset = await this.getAsset(connectionId, themeId, customCSSKey);
        existingCSS = existingAsset.value || '';
      } catch (error) {
        // File doesn't exist yet, that's okay
      }

      // Append or replace custom CSS
      const updatedCSS = `${existingCSS}\n\n/* Custom CSS added by Flora */\n${customCSS}`;

      // Update the asset
      await this.updateAsset(connectionId, themeId, customCSSKey, updatedCSS);

      // Also need to ensure it's included in theme.liquid
      await this.ensureCustomCSSIncluded(connectionId, themeId);

      logger.info(`Custom CSS applied to theme ${themeId}`);

      return {
        success: true,
        assetKey: customCSSKey,
      };
    } catch (error) {
      logger.error(`Error customizing Shopify theme: ${error.message}`);
      throw error;
    }
  }

  /**
   * Ensure custom CSS is included in theme.liquid
   */
  async ensureCustomCSSIncluded(connectionId, themeId) {
    try {
      const themeKey = 'layout/theme.liquid';
      const customCSSTag = "{{ 'custom.css' | asset_url | stylesheet_tag }}";

      // Get theme.liquid
      const asset = await this.getAsset(connectionId, themeId, themeKey);
      const themeContent = asset.value;

      // Check if custom CSS is already included
      if (themeContent.includes(customCSSTag)) {
        return; // Already included
      }

      // Find the </head> tag and insert before it
      const headCloseIndex = themeContent.indexOf('</head>');
      if (headCloseIndex === -1) {
        throw new Error('Could not find </head> tag in theme.liquid');
      }

      const updatedContent =
        themeContent.slice(0, headCloseIndex) +
        `  ${customCSSTag}\n` +
        themeContent.slice(headCloseIndex);

      // Update theme.liquid
      await this.updateAsset(connectionId, themeId, themeKey, updatedContent);

      logger.info('Custom CSS link added to theme.liquid');
    } catch (error) {
      logger.error(`Error ensuring custom CSS inclusion: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get theme customizations
   */
  async getThemeCustomizations(connectionId, themeId) {
    try {
      const customCSSKey = 'assets/custom.css';

      try {
        const asset = await this.getAsset(connectionId, themeId, customCSSKey);
        return {
          customCSS: asset.value || '',
          lastUpdated: asset.updated_at,
        };
      } catch (error) {
        // Custom CSS file doesn't exist
        return {
          customCSS: '',
          lastUpdated: null,
        };
      }
    } catch (error) {
      logger.error(`Error getting Shopify theme customizations: ${error.message}`);
      throw error;
    }
  }

  /**
   * Duplicate theme (for safe editing)
   */
  async duplicateTheme(connectionId, themeId) {
    try {
      const connection = await ShopifyConnection.findById(connectionId).select('+accessToken');

      if (!connection) {
        throw new Error('Connection not found');
      }

      const api = this.getShopifyAxios(connection.shopDomain, connection.getAccessToken());

      // Get source theme
      const sourceTheme = await this.getTheme(connectionId, themeId);

      // Create duplicate
      const response = await api.post('/themes.json', {
        theme: {
          name: `${sourceTheme.name} (Copy)`,
          src: sourceTheme.src,
          role: 'unpublished',
        },
      });

      logger.info(`Theme ${themeId} duplicated`);

      return response.data.theme;
    } catch (error) {
      logger.error(`Error duplicating Shopify theme: ${error.message}`);
      throw error;
    }
  }

  /**
   * Publish theme (make it the active theme)
   */
  async publishTheme(connectionId, themeId) {
    try {
      const connection = await ShopifyConnection.findById(connectionId).select('+accessToken');

      if (!connection) {
        throw new Error('Connection not found');
      }

      const api = this.getShopifyAxios(connection.shopDomain, connection.getAccessToken());
      const response = await api.put(`/themes/${themeId}.json`, {
        theme: {
          id: themeId,
          role: 'main',
        },
      });

      logger.info(`Theme ${themeId} published`);

      return response.data.theme;
    } catch (error) {
      logger.error(`Error publishing Shopify theme: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete theme
   */
  async deleteTheme(connectionId, themeId) {
    try {
      const connection = await ShopifyConnection.findById(connectionId).select('+accessToken');

      if (!connection) {
        throw new Error('Connection not found');
      }

      const api = this.getShopifyAxios(connection.shopDomain, connection.getAccessToken());
      await api.delete(`/themes/${themeId}.json`);

      logger.info(`Theme ${themeId} deleted`);
    } catch (error) {
      logger.error(`Error deleting Shopify theme: ${error.message}`);
      throw error;
    }
  }

  /**
   * Preview theme changes
   */
  async previewTheme(connectionId, themeId) {
    try {
      const connection = await ShopifyConnection.findById(connectionId);

      if (!connection) {
        throw new Error('Connection not found');
      }

      // Generate preview URL
      const previewUrl = `https://${connection.shopDomain}/?preview_theme_id=${themeId}`;

      return {
        previewUrl,
        themeId,
      };
    } catch (error) {
      logger.error(`Error generating theme preview: ${error.message}`);
      throw error;
    }
  }
}

export default new ShopifyThemeService();
