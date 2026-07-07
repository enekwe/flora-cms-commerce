import WordPressProvider from '../providers/wordpress/WordPressProvider.js';
import ShopifyProvider from '../providers/shopify/ShopifyProvider.js';
import logger from '../utils/logger.js';

/**
 * Provider Manager
 * Central registry and factory for all CMS and Commerce providers
 */
class ProviderManager {
  private providers: Map<string, any>;

  constructor() {
    this.providers = new Map();
    this.registerProviders();
  }

  /**
   * Register all available providers
   */
  private registerProviders(): void {
    this.providers.set('wordpress', WordPressProvider);
    this.providers.set('shopify', ShopifyProvider);
    // Future providers:
    // this.providers.set('webflow', WebflowProvider);
    // this.providers.set('woocommerce', WooCommerceProvider);

    logger.info(`Registered ${this.providers.size} providers`);
  }

  /**
   * Get provider by name
   */
  getProvider(providerName: string): any {
    const provider = this.providers.get(providerName.toLowerCase());

    if (!provider) {
      throw new Error(`Provider '${providerName}' not found`);
    }

    return provider;
  }

  /**
   * Check if provider exists
   */
  hasProvider(providerName: string): boolean {
    return this.providers.has(providerName.toLowerCase());
  }

  /**
   * Get all registered provider names
   */
  getProviderNames(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Get provider capabilities
   */
  getProviderCapabilities(providerName: string): any {
    const provider = this.getProvider(providerName);

    return {
      name: provider.getName(),
      features: {
        cms: this.isCMSProvider(provider),
        commerce: this.isCommerceProvider(provider),
        themes: this.hasThemeSupport(provider),
        content: this.hasContentSupport(provider),
        products: this.hasProductSupport(provider),
      },
    };
  }

  /**
   * Check if provider implements CMS functionality
   */
  private isCMSProvider(provider: any): boolean {
    return typeof provider.syncContent === 'function';
  }

  /**
   * Check if provider implements Commerce functionality
   */
  private isCommerceProvider(provider: any): boolean {
    return typeof provider.listProducts === 'function';
  }

  /**
   * Check if provider supports themes
   */
  private hasThemeSupport(provider: any): boolean {
    return typeof provider.listThemes === 'function' && typeof provider.customizeTheme === 'function';
  }

  /**
   * Check if provider supports content operations
   */
  private hasContentSupport(provider: any): boolean {
    return (
      typeof provider.createContent === 'function' &&
      typeof provider.updateContent === 'function' &&
      typeof provider.deleteContent === 'function'
    );
  }

  /**
   * Check if provider supports product operations
   */
  private hasProductSupport(provider: any): boolean {
    return (
      typeof provider.createProduct === 'function' &&
      typeof provider.updateProduct === 'function' &&
      typeof provider.deleteProduct === 'function'
    );
  }

  /**
   * Execute operation on provider with error handling
   */
  async executeProviderOperation(
    providerName: string,
    operation: string,
    ...args: any[]
  ): Promise<any> {
    try {
      const provider = this.getProvider(providerName);

      if (typeof provider[operation] !== 'function') {
        throw new Error(`Operation '${operation}' not supported by provider '${providerName}'`);
      }

      logger.info(`Executing ${operation} on ${providerName} provider`);

      const result = await provider[operation](...args);

      logger.info(`Successfully executed ${operation} on ${providerName} provider`);

      return result;
    } catch (error) {
      logger.error(`Error executing ${operation} on ${providerName}: ${error.message}`);
      throw error;
    }
  }
}

export default new ProviderManager();
