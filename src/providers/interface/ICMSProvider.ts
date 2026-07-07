/**
 * Interface for CMS providers (WordPress, Webflow, etc.)
 * All CMS integrations must implement this interface
 */

export interface ICMSProvider {
  /**
   * Get the provider name
   */
  getName(): string;

  /**
   * Initialize OAuth flow
   * @param userId - User ID
   * @param organizationId - Organization ID
   * @param redirectUri - Redirect URI after OAuth
   * @returns OAuth authorization URL
   */
  initiateOAuth(userId: string, organizationId: string, redirectUri: string): Promise<string>;

  /**
   * Handle OAuth callback
   * @param code - Authorization code from OAuth callback
   * @param state - State parameter for validation
   * @returns Connection details
   */
  handleOAuthCallback(code: string, state: string): Promise<any>;

  /**
   * Verify connection is valid and active
   * @param connectionId - Connection ID
   * @returns true if connection is valid
   */
  verifyConnection(connectionId: string): Promise<boolean>;

  /**
   * Refresh access token
   * @param connectionId - Connection ID
   * @returns New access token
   */
  refreshToken(connectionId: string): Promise<string>;

  /**
   * Disconnect and revoke access
   * @param connectionId - Connection ID
   */
  disconnect(connectionId: string): Promise<void>;

  /**
   * List all sites/blogs for this connection
   * @param connectionId - Connection ID
   * @returns List of sites
   */
  listSites(connectionId: string): Promise<any[]>;

  /**
   * Get site details
   * @param connectionId - Connection ID
   * @param siteId - Site ID
   * @returns Site details
   */
  getSite(connectionId: string, siteId: string): Promise<any>;

  /**
   * List available themes
   * @param connectionId - Connection ID
   * @param siteId - Site ID
   * @returns List of themes
   */
  listThemes(connectionId: string, siteId: string): Promise<any[]>;

  /**
   * Get active theme
   * @param connectionId - Connection ID
   * @param siteId - Site ID
   * @returns Active theme details
   */
  getActiveTheme(connectionId: string, siteId: string): Promise<any>;

  /**
   * Activate a theme
   * @param connectionId - Connection ID
   * @param siteId - Site ID
   * @param themeId - Theme ID to activate
   */
  activateTheme(connectionId: string, siteId: string, themeId: string): Promise<void>;

  /**
   * Customize theme (apply custom CSS)
   * @param connectionId - Connection ID
   * @param siteId - Site ID
   * @param customCSS - Custom CSS to apply
   */
  customizeTheme(connectionId: string, siteId: string, customCSS: string): Promise<void>;

  /**
   * Get theme customizations
   * @param connectionId - Connection ID
   * @param siteId - Site ID
   * @returns Current customizations
   */
  getThemeCustomizations(connectionId: string, siteId: string): Promise<any>;

  /**
   * Sync content from CMS
   * @param connectionId - Connection ID
   * @param siteId - Site ID
   * @param contentType - Type of content (posts, pages, media)
   * @param options - Sync options (filters, pagination)
   * @returns Synced content
   */
  syncContent(connectionId: string, siteId: string, contentType: string, options?: any): Promise<any>;

  /**
   * Create content in CMS
   * @param connectionId - Connection ID
   * @param siteId - Site ID
   * @param contentType - Type of content
   * @param data - Content data
   * @returns Created content
   */
  createContent(connectionId: string, siteId: string, contentType: string, data: any): Promise<any>;

  /**
   * Update content in CMS
   * @param connectionId - Connection ID
   * @param siteId - Site ID
   * @param contentType - Type of content
   * @param contentId - Content ID
   * @param data - Updated content data
   * @returns Updated content
   */
  updateContent(connectionId: string, siteId: string, contentType: string, contentId: string, data: any): Promise<any>;

  /**
   * Delete content from CMS
   * @param connectionId - Connection ID
   * @param siteId - Site ID
   * @param contentType - Type of content
   * @param contentId - Content ID
   */
  deleteContent(connectionId: string, siteId: string, contentType: string, contentId: string): Promise<void>;
}
