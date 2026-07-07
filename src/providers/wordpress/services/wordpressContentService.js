import axios from 'axios';
import WordPressConnection from '../models/WordPressConnection.js';
import logger from '../../../utils/logger.js';

/**
 * WordPress Content Service
 * Handles content synchronization (posts, pages, media)
 */
class WordPressContentService {
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
   * Sync posts from WordPress
   */
  async syncPosts(connectionId, options = {}) {
    try {
      const connection = await WordPressConnection.findById(connectionId).select('+accessToken +applicationPassword');

      if (!connection) {
        throw new Error('Connection not found');
      }

      const { page = 1, perPage = 20, status = 'publish', orderBy = 'date' } = options;

      let posts = [];

      if (connection.siteType === 'wordpress.com') {
        const api = this.getWordPressComAxios(connection.getAccessToken());
        const response = await api.get(`/sites/${connection.siteId}/posts`, {
          params: {
            page,
            number: perPage,
            status,
            order_by: orderBy,
          },
        });
        posts = response.data.posts;
      } else {
        const api = this.getSelfHostedAxios(connection);
        const response = await api.get('/wp/v2/posts', {
          params: {
            page,
            per_page: perPage,
            status,
            orderby: orderBy,
          },
        });
        posts = response.data;
      }

      connection.lastSyncedAt = new Date();
      await connection.save();

      logger.info(`Synced ${posts.length} posts from site ${connection.siteId}`);

      return posts;
    } catch (error) {
      logger.error(`Error syncing WordPress posts: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get single post
   */
  async getPost(connectionId, postId) {
    try {
      const connection = await WordPressConnection.findById(connectionId).select('+accessToken +applicationPassword');

      if (!connection) {
        throw new Error('Connection not found');
      }

      if (connection.siteType === 'wordpress.com') {
        const api = this.getWordPressComAxios(connection.getAccessToken());
        const response = await api.get(`/sites/${connection.siteId}/posts/${postId}`);
        return response.data;
      } else {
        const api = this.getSelfHostedAxios(connection);
        const response = await api.get(`/wp/v2/posts/${postId}`);
        return response.data;
      }
    } catch (error) {
      logger.error(`Error getting WordPress post: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create post
   */
  async createPost(connectionId, postData) {
    try {
      const connection = await WordPressConnection.findById(connectionId).select('+accessToken +applicationPassword');

      if (!connection) {
        throw new Error('Connection not found');
      }

      if (connection.siteType === 'wordpress.com') {
        const api = this.getWordPressComAxios(connection.getAccessToken());
        const response = await api.post(`/sites/${connection.siteId}/posts/new`, postData);
        logger.info(`Post created on site ${connection.siteId}`);
        return response.data;
      } else {
        const api = this.getSelfHostedAxios(connection);
        const response = await api.post('/wp/v2/posts', postData);
        return response.data;
      }
    } catch (error) {
      logger.error(`Error creating WordPress post: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update post
   */
  async updatePost(connectionId, postId, postData) {
    try {
      const connection = await WordPressConnection.findById(connectionId).select('+accessToken +applicationPassword');

      if (!connection) {
        throw new Error('Connection not found');
      }

      if (connection.siteType === 'wordpress.com') {
        const api = this.getWordPressComAxios(connection.getAccessToken());
        const response = await api.post(`/sites/${connection.siteId}/posts/${postId}`, postData);
        logger.info(`Post ${postId} updated on site ${connection.siteId}`);
        return response.data;
      } else {
        const api = this.getSelfHostedAxios(connection);
        const response = await api.post(`/wp/v2/posts/${postId}`, postData);
        return response.data;
      }
    } catch (error) {
      logger.error(`Error updating WordPress post: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete post
   */
  async deletePost(connectionId, postId) {
    try {
      const connection = await WordPressConnection.findById(connectionId).select('+accessToken +applicationPassword');

      if (!connection) {
        throw new Error('Connection not found');
      }

      if (connection.siteType === 'wordpress.com') {
        const api = this.getWordPressComAxios(connection.getAccessToken());
        await api.post(`/sites/${connection.siteId}/posts/${postId}/delete`);
        logger.info(`Post ${postId} deleted from site ${connection.siteId}`);
      } else {
        const api = this.getSelfHostedAxios(connection);
        await api.delete(`/wp/v2/posts/${postId}`);
      }
    } catch (error) {
      logger.error(`Error deleting WordPress post: ${error.message}`);
      throw error;
    }
  }

  /**
   * Sync pages from WordPress
   */
  async syncPages(connectionId, options = {}) {
    try {
      const connection = await WordPressConnection.findById(connectionId).select('+accessToken +applicationPassword');

      if (!connection) {
        throw new Error('Connection not found');
      }

      const { page = 1, perPage = 20, status = 'publish' } = options;

      let pages = [];

      if (connection.siteType === 'wordpress.com') {
        // WordPress.com uses posts endpoint with type=page
        const api = this.getWordPressComAxios(connection.getAccessToken());
        const response = await api.get(`/sites/${connection.siteId}/posts`, {
          params: {
            page,
            number: perPage,
            status,
            type: 'page',
          },
        });
        pages = response.data.posts;
      } else {
        const api = this.getSelfHostedAxios(connection);
        const response = await api.get('/wp/v2/pages', {
          params: {
            page,
            per_page: perPage,
            status,
          },
        });
        pages = response.data;
      }

      logger.info(`Synced ${pages.length} pages from site ${connection.siteId}`);

      return pages;
    } catch (error) {
      logger.error(`Error syncing WordPress pages: ${error.message}`);
      throw error;
    }
  }

  /**
   * Sync media from WordPress
   */
  async syncMedia(connectionId, options = {}) {
    try {
      const connection = await WordPressConnection.findById(connectionId).select('+accessToken +applicationPassword');

      if (!connection) {
        throw new Error('Connection not found');
      }

      const { page = 1, perPage = 20, mimeType } = options;

      let media = [];

      if (connection.siteType === 'wordpress.com') {
        const api = this.getWordPressComAxios(connection.getAccessToken());
        const params = {
          page,
          number: perPage,
        };
        if (mimeType) params.mime_type = mimeType;

        const response = await api.get(`/sites/${connection.siteId}/media`, { params });
        media = response.data.media;
      } else {
        const api = this.getSelfHostedAxios(connection);
        const params = {
          page,
          per_page: perPage,
        };
        if (mimeType) params.media_type = mimeType;

        const response = await api.get('/wp/v2/media', { params });
        media = response.data;
      }

      logger.info(`Synced ${media.length} media items from site ${connection.siteId}`);

      return media;
    } catch (error) {
      logger.error(`Error syncing WordPress media: ${error.message}`);
      throw error;
    }
  }

  /**
   * Upload media to WordPress
   */
  async uploadMedia(connectionId, file, filename, mimeType) {
    try {
      const connection = await WordPressConnection.findById(connectionId).select('+accessToken +applicationPassword');

      if (!connection) {
        throw new Error('Connection not found');
      }

      if (connection.siteType === 'wordpress.com') {
        const api = this.getWordPressComAxios(connection.getAccessToken());
        const formData = new FormData();
        formData.append('media[]', file, filename);

        const response = await api.post(`/sites/${connection.siteId}/media/new`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        logger.info(`Media uploaded to site ${connection.siteId}`);
        return response.data;
      } else {
        const api = this.getSelfHostedAxios(connection);
        const response = await api.post('/wp/v2/media', file, {
          headers: {
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Content-Type': mimeType,
          },
        });
        return response.data;
      }
    } catch (error) {
      logger.error(`Error uploading WordPress media: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get categories
   */
  async getCategories(connectionId) {
    try {
      const connection = await WordPressConnection.findById(connectionId).select('+accessToken +applicationPassword');

      if (!connection) {
        throw new Error('Connection not found');
      }

      if (connection.siteType === 'wordpress.com') {
        const api = this.getWordPressComAxios(connection.getAccessToken());
        const response = await api.get(`/sites/${connection.siteId}/categories`);
        return response.data.categories;
      } else {
        const api = this.getSelfHostedAxios(connection);
        const response = await api.get('/wp/v2/categories');
        return response.data;
      }
    } catch (error) {
      logger.error(`Error getting WordPress categories: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get tags
   */
  async getTags(connectionId) {
    try {
      const connection = await WordPressConnection.findById(connectionId).select('+accessToken +applicationPassword');

      if (!connection) {
        throw new Error('Connection not found');
      }

      if (connection.siteType === 'wordpress.com') {
        const api = this.getWordPressComAxios(connection.getAccessToken());
        const response = await api.get(`/sites/${connection.siteId}/tags`);
        return response.data.tags;
      } else {
        const api = this.getSelfHostedAxios(connection);
        const response = await api.get('/wp/v2/tags');
        return response.data;
      }
    } catch (error) {
      logger.error(`Error getting WordPress tags: ${error.message}`);
      throw error;
    }
  }
}

export default new WordPressContentService();
