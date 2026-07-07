import wordpressAuthService from './services/wordpressAuthService.js';
import wordpressThemeService from './services/wordpressThemeService.js';
import wordpressContentService from './services/wordpressContentService.js';
import logger from '../../utils/logger.js';

/**
 * WordPress Provider Implementation
 * Implements ICMSProvider interface for WordPress.com and self-hosted WordPress
 */
class WordPressProvider {
  getName() {
    return 'wordpress';
  }

  async initiateOAuth(userId, organizationId, redirectUri) {
    try {
      const result = wordpressAuthService.initiateOAuth(userId, organizationId, redirectUri);
      return result.authUrl;
    } catch (error) {
      logger.error(`WordPress initiateOAuth error: ${error.message}`);
      throw error;
    }
  }

  async handleOAuthCallback(code, state) {
    try {
      return await wordpressAuthService.handleOAuthCallback(code, state);
    } catch (error) {
      logger.error(`WordPress handleOAuthCallback error: ${error.message}`);
      throw error;
    }
  }

  async verifyConnection(connectionId) {
    try {
      return await wordpressAuthService.verifyConnection(connectionId);
    } catch (error) {
      logger.error(`WordPress verifyConnection error: ${error.message}`);
      throw error;
    }
  }

  async refreshToken(connectionId) {
    // WordPress.com OAuth tokens don't expire
    // For self-hosted, Application Passwords don't require refresh
    logger.info(`WordPress tokens don't require refresh for connection ${connectionId}`);
    return null;
  }

  async disconnect(connectionId) {
    try {
      await wordpressAuthService.disconnect(connectionId);
    } catch (error) {
      logger.error(`WordPress disconnect error: ${error.message}`);
      throw error;
    }
  }

  async listSites(connectionId) {
    try {
      // For WordPress, a connection represents a single site
      // Return the connected site as an array
      const connections = await wordpressAuthService.getUserConnections(connectionId);
      return connections;
    } catch (error) {
      logger.error(`WordPress listSites error: ${error.message}`);
      throw error;
    }
  }

  async getSite(connectionId, siteId) {
    try {
      const connection = await wordpressAuthService.verifyConnection(connectionId);
      return connection;
    } catch (error) {
      logger.error(`WordPress getSite error: ${error.message}`);
      throw error;
    }
  }

  async listThemes(connectionId, siteId) {
    try {
      return await wordpressThemeService.listThemes(connectionId);
    } catch (error) {
      logger.error(`WordPress listThemes error: ${error.message}`);
      throw error;
    }
  }

  async getActiveTheme(connectionId, siteId) {
    try {
      return await wordpressThemeService.getActiveTheme(connectionId);
    } catch (error) {
      logger.error(`WordPress getActiveTheme error: ${error.message}`);
      throw error;
    }
  }

  async activateTheme(connectionId, siteId, themeId) {
    try {
      await wordpressThemeService.activateTheme(connectionId, themeId);
    } catch (error) {
      logger.error(`WordPress activateTheme error: ${error.message}`);
      throw error;
    }
  }

  async customizeTheme(connectionId, siteId, customCSS) {
    try {
      await wordpressThemeService.customizeTheme(connectionId, customCSS);
    } catch (error) {
      logger.error(`WordPress customizeTheme error: ${error.message}`);
      throw error;
    }
  }

  async getThemeCustomizations(connectionId, siteId) {
    try {
      return await wordpressThemeService.getThemeCustomizations(connectionId);
    } catch (error) {
      logger.error(`WordPress getThemeCustomizations error: ${error.message}`);
      throw error;
    }
  }

  async syncContent(connectionId, siteId, contentType, options = {}) {
    try {
      switch (contentType) {
        case 'posts':
          return await wordpressContentService.syncPosts(connectionId, options);
        case 'pages':
          return await wordpressContentService.syncPages(connectionId, options);
        case 'media':
          return await wordpressContentService.syncMedia(connectionId, options);
        default:
          throw new Error(`Unsupported content type: ${contentType}`);
      }
    } catch (error) {
      logger.error(`WordPress syncContent error: ${error.message}`);
      throw error;
    }
  }

  async createContent(connectionId, siteId, contentType, data) {
    try {
      switch (contentType) {
        case 'posts':
        case 'pages':
          return await wordpressContentService.createPost(connectionId, data);
        default:
          throw new Error(`Unsupported content type: ${contentType}`);
      }
    } catch (error) {
      logger.error(`WordPress createContent error: ${error.message}`);
      throw error;
    }
  }

  async updateContent(connectionId, siteId, contentType, contentId, data) {
    try {
      switch (contentType) {
        case 'posts':
        case 'pages':
          return await wordpressContentService.updatePost(connectionId, contentId, data);
        default:
          throw new Error(`Unsupported content type: ${contentType}`);
      }
    } catch (error) {
      logger.error(`WordPress updateContent error: ${error.message}`);
      throw error;
    }
  }

  async deleteContent(connectionId, siteId, contentType, contentId) {
    try {
      switch (contentType) {
        case 'posts':
        case 'pages':
          await wordpressContentService.deletePost(connectionId, contentId);
          break;
        default:
          throw new Error(`Unsupported content type: ${contentType}`);
      }
    } catch (error) {
      logger.error(`WordPress deleteContent error: ${error.message}`);
      throw error;
    }
  }

  // Additional WordPress-specific methods
  async connectSelfHosted(userId, organizationId, siteUrl, username, applicationPassword) {
    try {
      return await wordpressAuthService.connectSelfHosted(
        userId,
        organizationId,
        siteUrl,
        username,
        applicationPassword
      );
    } catch (error) {
      logger.error(`WordPress connectSelfHosted error: ${error.message}`);
      throw error;
    }
  }

  async getCategories(connectionId) {
    try {
      return await wordpressContentService.getCategories(connectionId);
    } catch (error) {
      logger.error(`WordPress getCategories error: ${error.message}`);
      throw error;
    }
  }

  async getTags(connectionId) {
    try {
      return await wordpressContentService.getTags(connectionId);
    } catch (error) {
      logger.error(`WordPress getTags error: ${error.message}`);
      throw error;
    }
  }

  async uploadMedia(connectionId, file, filename, mimeType) {
    try {
      return await wordpressContentService.uploadMedia(connectionId, file, filename, mimeType);
    } catch (error) {
      logger.error(`WordPress uploadMedia error: ${error.message}`);
      throw error;
    }
  }
}

export default new WordPressProvider();
