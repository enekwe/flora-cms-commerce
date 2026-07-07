import axios from 'axios';
import WordPressConnection from '../models/WordPressConnection.js';
import logger from '../../../utils/logger.js';

/**
 * WordPress Theme Service
 * Handles theme management and customization
 */
class WordPressThemeService {
  /**
   * Get axios instance for WordPress.com API
   */
  getWordPressComAxios(accessToken) {
    return axios.create({
      baseURL: 'https://public-api.wordpress.com/rest/v1.1',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  /**
   * Get axios instance for self-hosted WordPress
   */
  getSelfHostedAxios(connection) {
    const applicationPassword = connection.getApplicationPassword();
    return axios.create({
      baseURL: `${connection.siteUrl}/wp-json`,
      auth: {
        username: connection.username,
        password: applicationPassword,
      },
    });
  }

  /**
   * List all themes for a site
   */
  async listThemes(connectionId) {
    try {
      const connection = await WordPressConnection.findById(connectionId).select('+accessToken +applicationPassword');

      if (!connection) {
        throw new Error('Connection not found');
      }

      if (connection.siteType === 'wordpress.com') {
        const api = this.getWordPressComAxios(connection.getAccessToken());
        const response = await api.get(`/sites/${connection.siteId}/themes`);
        return response.data.themes;
      } else {
        // Self-hosted WordPress doesn't have a standard REST API endpoint for themes
        // We'll need to use a custom endpoint or WP-CLI
        const api = this.getSelfHostedAxios(connection);
        const response = await api.get('/wp/v2/themes');
        return response.data;
      }
    } catch (error) {
      logger.error(`Error listing WordPress themes: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get active theme
   */
  async getActiveTheme(connectionId) {
    try {
      const connection = await WordPressConnection.findById(connectionId).select('+accessToken +applicationPassword');

      if (!connection) {
        throw new Error('Connection not found');
      }

      const themes = await this.listThemes(connectionId);
      const activeTheme = themes.find((theme) => theme.active || theme.status === 'active');

      return activeTheme;
    } catch (error) {
      logger.error(`Error getting active WordPress theme: ${error.message}`);
      throw error;
    }
  }

  /**
   * Activate a theme
   */
  async activateTheme(connectionId, themeId) {
    try {
      const connection = await WordPressConnection.findById(connectionId).select('+accessToken +applicationPassword');

      if (!connection) {
        throw new Error('Connection not found');
      }

      if (connection.siteType === 'wordpress.com') {
        const api = this.getWordPressComAxios(connection.getAccessToken());
        const response = await api.post(`/sites/${connection.siteId}/themes/mine`, {
          theme: themeId,
        });
        logger.info(`Theme ${themeId} activated for site ${connection.siteId}`);
        return response.data;
      } else {
        // Self-hosted activation would require custom implementation
        throw new Error('Theme activation not supported for self-hosted WordPress via REST API');
      }
    } catch (error) {
      logger.error(`Error activating WordPress theme: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get theme customizations (Custom CSS)
   */
  async getThemeCustomizations(connectionId) {
    try {
      const connection = await WordPressConnection.findById(connectionId).select('+accessToken +applicationPassword');

      if (!connection) {
        throw new Error('Connection not found');
      }

      if (connection.siteType === 'wordpress.com') {
        const api = this.getWordPressComAxios(connection.getAccessToken());
        const response = await api.get(`/sites/${connection.siteId}/customcss`);
        return {
          customCSS: response.data.css || '',
          preprocessor: response.data.preprocessor || 'none',
        };
      } else {
        // For self-hosted, we'll get from wp_options
        const api = this.getSelfHostedAxios(connection);
        // This endpoint might need a custom plugin
        const response = await api.get('/wp/v2/customcss');
        return response.data;
      }
    } catch (error) {
      logger.error(`Error getting WordPress theme customizations: ${error.message}`);
      throw error;
    }
  }

  /**
   * Apply custom CSS to theme
   */
  async customizeTheme(connectionId, customCSS) {
    try {
      const connection = await WordPressConnection.findById(connectionId).select('+accessToken +applicationPassword');

      if (!connection) {
        throw new Error('Connection not found');
      }

      if (connection.siteType === 'wordpress.com') {
        const api = this.getWordPressComAxios(connection.getAccessToken());
        const response = await api.post(`/sites/${connection.siteId}/customcss`, {
          css: customCSS,
          preprocessor: 'none',
        });
        logger.info(`Custom CSS applied to site ${connection.siteId}`);
        return response.data;
      } else {
        // For self-hosted, update via custom endpoint
        const api = this.getSelfHostedAxios(connection);
        const response = await api.post('/wp/v2/customcss', {
          css: customCSS,
        });
        return response.data;
      }
    } catch (error) {
      logger.error(`Error applying WordPress custom CSS: ${error.message}`);
      throw error;
    }
  }

  /**
   * Preview theme changes
   */
  async previewThemeChanges(connectionId, changes) {
    try {
      const connection = await WordPressConnection.findById(connectionId).select('+accessToken +applicationPassword');

      if (!connection) {
        throw new Error('Connection not found');
      }

      // For WordPress.com, we can create a preview
      if (connection.siteType === 'wordpress.com') {
        const api = this.getWordPressComAxios(connection.getAccessToken());

        // Apply CSS in preview mode
        const response = await api.post(`/sites/${connection.siteId}/customcss`, {
          css: changes.customCSS,
          preprocessor: 'none',
          // WordPress.com automatically creates previews
        });

        return {
          previewUrl: `${connection.siteUrl}?preview=true`,
          previewId: response.data.id,
        };
      } else {
        // Self-hosted preview would require Customizer API
        return {
          previewUrl: `${connection.siteUrl}/wp-admin/customize.php`,
        };
      }
    } catch (error) {
      logger.error(`Error previewing WordPress theme changes: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get theme settings/options
   */
  async getThemeSettings(connectionId) {
    try {
      const connection = await WordPressConnection.findById(connectionId).select('+accessToken +applicationPassword');

      if (!connection) {
        throw new Error('Connection not found');
      }

      if (connection.siteType === 'wordpress.com') {
        const api = this.getWordPressComAxios(connection.getAccessToken());
        const response = await api.get(`/sites/${connection.siteId}/settings`);
        return response.data;
      } else {
        const api = this.getSelfHostedAxios(connection);
        const response = await api.get('/wp/v2/settings');
        return response.data;
      }
    } catch (error) {
      logger.error(`Error getting WordPress theme settings: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update theme settings
   */
  async updateThemeSettings(connectionId, settings) {
    try {
      const connection = await WordPressConnection.findById(connectionId).select('+accessToken +applicationPassword');

      if (!connection) {
        throw new Error('Connection not found');
      }

      if (connection.siteType === 'wordpress.com') {
        const api = this.getWordPressComAxios(connection.getAccessToken());
        const response = await api.post(`/sites/${connection.siteId}/settings`, settings);
        logger.info(`Theme settings updated for site ${connection.siteId}`);
        return response.data;
      } else {
        const api = this.getSelfHostedAxios(connection);
        const response = await api.post('/wp/v2/settings', settings);
        return response.data;
      }
    } catch (error) {
      logger.error(`Error updating WordPress theme settings: ${error.message}`);
      throw error;
    }
  }
}

export default new WordPressThemeService();
