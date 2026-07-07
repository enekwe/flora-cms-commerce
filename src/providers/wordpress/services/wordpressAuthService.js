import axios from 'axios';
import crypto from 'crypto';
import config from '../../../config/index.js';
import WordPressConnection from '../models/WordPressConnection.js';
import logger from '../../../utils/logger.js';

/**
 * WordPress Authentication Service
 * Handles OAuth flow for WordPress.com and Application Passwords for self-hosted
 */
class WordPressAuthService {
  /**
   * Generate OAuth state parameter
   */
  generateState(userId, organizationId) {
    const stateData = {
      userId,
      organizationId,
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
   * Initiate WordPress.com OAuth flow
   */
  initiateOAuth(userId, organizationId, redirectUri) {
    const state = this.generateState(userId, organizationId);

    const authUrl = new URL('https://public-api.wordpress.com/oauth2/authorize');
    authUrl.searchParams.append('client_id', config.wordpress.clientId);
    authUrl.searchParams.append('redirect_uri', redirectUri || config.wordpress.redirectUri);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('state', state);
    authUrl.searchParams.append('scope', 'global');

    logger.info(`WordPress OAuth initiated for user ${userId}`);

    return {
      authUrl: authUrl.toString(),
      state,
    };
  }

  /**
   * Handle OAuth callback and exchange code for tokens
   */
  async handleOAuthCallback(code, state) {
    try {
      // Validate state
      const stateData = this.parseState(state);
      const { userId, organizationId } = stateData;

      // Exchange code for tokens
      const tokenResponse = await axios.post('https://public-api.wordpress.com/oauth2/token', {
        client_id: config.wordpress.clientId,
        client_secret: config.wordpress.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: config.wordpress.redirectUri,
      });

      const { access_token, token_type, blog_id, blog_url } = tokenResponse.data;

      // Get site details
      const siteDetails = await this.getSiteDetails(access_token, blog_id);

      // Check if connection already exists
      let connection = await WordPressConnection.findBySite(userId, organizationId, blog_id.toString());

      if (connection) {
        // Update existing connection
        await connection.updateToken(access_token, null, null);
        logger.info(`WordPress connection updated for user ${userId}, site ${blog_id}`);
      } else {
        // Create new connection
        connection = new WordPressConnection({
          userId,
          organizationId,
          siteId: blog_id.toString(),
          siteName: siteDetails.name,
          siteUrl: blog_url,
          siteType: 'wordpress.com',
          accessToken: access_token,
          tokenType: token_type,
          status: 'active',
          lastVerifiedAt: new Date(),
          metadata: {
            blogDetails: siteDetails,
          },
        });
        await connection.save();
        logger.info(`WordPress connection created for user ${userId}, site ${blog_id}`);
      }

      return {
        connectionId: connection._id,
        siteId: blog_id.toString(),
        siteName: siteDetails.name,
        siteUrl: blog_url,
      };
    } catch (error) {
      logger.error(`WordPress OAuth callback error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Connect self-hosted WordPress using Application Passwords
   */
  async connectSelfHosted(userId, organizationId, siteUrl, username, applicationPassword) {
    try {
      // Validate credentials
      const response = await axios.get(`${siteUrl}/wp-json/wp/v2/users/me`, {
        auth: {
          username,
          password: applicationPassword,
        },
      });

      const userDetails = response.data;

      // Get site details
      const siteResponse = await axios.get(`${siteUrl}/wp-json`, {
        auth: {
          username,
          password: applicationPassword,
        },
      });

      const siteDetails = siteResponse.data;
      const siteId = crypto.createHash('md5').update(siteUrl).digest('hex');

      // Check if connection already exists
      let connection = await WordPressConnection.findBySite(userId, organizationId, siteId);

      if (connection) {
        // Update existing connection
        connection.username = username;
        connection.applicationPassword = applicationPassword;
        connection.status = 'active';
        connection.lastVerifiedAt = new Date();
        await connection.save();
        logger.info(`Self-hosted WordPress connection updated for user ${userId}`);
      } else {
        // Create new connection
        connection = new WordPressConnection({
          userId,
          organizationId,
          siteId,
          siteName: siteDetails.name,
          siteUrl,
          siteType: 'self-hosted',
          username,
          applicationPassword,
          status: 'active',
          lastVerifiedAt: new Date(),
          metadata: {
            siteDetails,
            userDetails,
          },
        });
        await connection.save();
        logger.info(`Self-hosted WordPress connection created for user ${userId}`);
      }

      return {
        connectionId: connection._id,
        siteId,
        siteName: siteDetails.name,
        siteUrl,
      };
    } catch (error) {
      logger.error(`Self-hosted WordPress connection error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get site details from WordPress.com
   */
  async getSiteDetails(accessToken, siteId) {
    try {
      const response = await axios.get(`https://public-api.wordpress.com/rest/v1.1/sites/${siteId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      return response.data;
    } catch (error) {
      logger.error(`Error fetching WordPress site details: ${error.message}`);
      throw error;
    }
  }

  /**
   * Verify connection is valid
   */
  async verifyConnection(connectionId) {
    try {
      const connection = await WordPressConnection.findById(connectionId).select('+accessToken +applicationPassword');

      if (!connection) {
        throw new Error('Connection not found');
      }

      if (connection.siteType === 'wordpress.com') {
        const accessToken = connection.getAccessToken();
        const response = await axios.get(`https://public-api.wordpress.com/rest/v1.1/sites/${connection.siteId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        connection.lastVerifiedAt = new Date();
        connection.status = 'active';
        await connection.save();

        return true;
      } else {
        // Self-hosted
        const applicationPassword = connection.getApplicationPassword();
        const response = await axios.get(`${connection.siteUrl}/wp-json`, {
          auth: {
            username: connection.username,
            password: applicationPassword,
          },
        });

        connection.lastVerifiedAt = new Date();
        connection.status = 'active';
        await connection.save();

        return true;
      }
    } catch (error) {
      logger.error(`Error verifying WordPress connection: ${error.message}`);

      // Update connection status
      const connection = await WordPressConnection.findById(connectionId);
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
      const connection = await WordPressConnection.findById(connectionId).select('+accessToken');

      if (!connection) {
        throw new Error('Connection not found');
      }

      // For WordPress.com, we could revoke the token
      // (WordPress.com doesn't provide a revoke endpoint in their public API)

      connection.status = 'revoked';
      await connection.save();

      logger.info(`WordPress connection ${connectionId} disconnected`);
    } catch (error) {
      logger.error(`Error disconnecting WordPress: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all connections for user
   */
  async getUserConnections(userId, organizationId) {
    try {
      const connections = await WordPressConnection.findActiveByUser(userId, organizationId);
      return connections.map((conn) => ({
        connectionId: conn._id,
        siteId: conn.siteId,
        siteName: conn.siteName,
        siteUrl: conn.siteUrl,
        siteType: conn.siteType,
        status: conn.status,
        lastSyncedAt: conn.lastSyncedAt,
        lastVerifiedAt: conn.lastVerifiedAt,
      }));
    } catch (error) {
      logger.error(`Error fetching WordPress connections: ${error.message}`);
      throw error;
    }
  }
}

export default new WordPressAuthService();
