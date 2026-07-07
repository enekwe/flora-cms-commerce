/**
 * Interface for eCommerce providers (Shopify, WooCommerce, etc.)
 * All commerce integrations must implement this interface
 */

export interface ICommerceProvider {
  /**
   * Get the provider name
   */
  getName(): string;

  /**
   * Initialize OAuth flow
   * @param userId - User ID
   * @param organizationId - Organization ID
   * @param shopDomain - Shop domain (e.g., mystore.myshopify.com)
   * @param redirectUri - Redirect URI after OAuth
   * @returns OAuth authorization URL
   */
  initiateOAuth(userId: string, organizationId: string, shopDomain: string, redirectUri: string): Promise<string>;

  /**
   * Handle OAuth callback
   * @param code - Authorization code from OAuth callback
   * @param shop - Shop domain
   * @param state - State parameter for validation
   * @returns Connection details
   */
  handleOAuthCallback(code: string, shop: string, state: string): Promise<any>;

  /**
   * Verify connection is valid and active
   * @param connectionId - Connection ID
   * @returns true if connection is valid
   */
  verifyConnection(connectionId: string): Promise<boolean>;

  /**
   * Disconnect and revoke access
   * @param connectionId - Connection ID
   */
  disconnect(connectionId: string): Promise<void>;

  /**
   * Get store details
   * @param connectionId - Connection ID
   * @returns Store details
   */
  getStore(connectionId: string): Promise<any>;

  /**
   * List products
   * @param connectionId - Connection ID
   * @param options - Filter and pagination options
   * @returns List of products
   */
  listProducts(connectionId: string, options?: any): Promise<any[]>;

  /**
   * Get product details
   * @param connectionId - Connection ID
   * @param productId - Product ID
   * @returns Product details
   */
  getProduct(connectionId: string, productId: string): Promise<any>;

  /**
   * Create product
   * @param connectionId - Connection ID
   * @param productData - Product data
   * @returns Created product
   */
  createProduct(connectionId: string, productData: any): Promise<any>;

  /**
   * Update product
   * @param connectionId - Connection ID
   * @param productId - Product ID
   * @param productData - Updated product data
   * @returns Updated product
   */
  updateProduct(connectionId: string, productId: string, productData: any): Promise<any>;

  /**
   * Delete product
   * @param connectionId - Connection ID
   * @param productId - Product ID
   */
  deleteProduct(connectionId: string, productId: string): Promise<void>;

  /**
   * List collections/categories
   * @param connectionId - Connection ID
   * @param options - Filter and pagination options
   * @returns List of collections
   */
  listCollections(connectionId: string, options?: any): Promise<any[]>;

  /**
   * Get collection details
   * @param connectionId - Connection ID
   * @param collectionId - Collection ID
   * @returns Collection details
   */
  getCollection(connectionId: string, collectionId: string): Promise<any>;

  /**
   * List orders
   * @param connectionId - Connection ID
   * @param options - Filter and pagination options
   * @returns List of orders
   */
  listOrders(connectionId: string, options?: any): Promise<any[]>;

  /**
   * Get order details
   * @param connectionId - Connection ID
   * @param orderId - Order ID
   * @returns Order details
   */
  getOrder(connectionId: string, orderId: string): Promise<any>;

  /**
   * List themes
   * @param connectionId - Connection ID
   * @returns List of themes
   */
  listThemes(connectionId: string): Promise<any[]>;

  /**
   * Get active theme
   * @param connectionId - Connection ID
   * @returns Active theme details
   */
  getActiveTheme(connectionId: string): Promise<any>;

  /**
   * Get theme assets
   * @param connectionId - Connection ID
   * @param themeId - Theme ID
   * @returns Theme assets (templates, CSS, JS)
   */
  getThemeAssets(connectionId: string, themeId: string): Promise<any[]>;

  /**
   * Update theme asset
   * @param connectionId - Connection ID
   * @param themeId - Theme ID
   * @param assetKey - Asset key (e.g., 'templates/index.liquid')
   * @param content - New content
   */
  updateThemeAsset(connectionId: string, themeId: string, assetKey: string, content: string): Promise<void>;

  /**
   * Customize theme (apply custom CSS/SCSS)
   * @param connectionId - Connection ID
   * @param themeId - Theme ID
   * @param customCSS - Custom CSS to apply
   */
  customizeTheme(connectionId: string, themeId: string, customCSS: string): Promise<void>;

  /**
   * Get theme customizations
   * @param connectionId - Connection ID
   * @param themeId - Theme ID
   * @returns Current customizations
   */
  getThemeCustomizations(connectionId: string, themeId: string): Promise<any>;

  /**
   * Sync products to external system
   * @param connectionId - Connection ID
   * @param options - Sync options
   * @returns Sync results
   */
  syncProducts(connectionId: string, options?: any): Promise<any>;
}
