/**
 * Interface for theme management capabilities
 * Implemented by both CMS and Commerce providers
 */

export interface IThemeProvider {
  /**
   * List available themes
   * @param connectionId - Connection ID
   * @param siteId - Site/Store ID
   * @returns List of themes
   */
  listThemes(connectionId: string, siteId: string): Promise<any[]>;

  /**
   * Get active theme
   * @param connectionId - Connection ID
   * @param siteId - Site/Store ID
   * @returns Active theme details
   */
  getActiveTheme(connectionId: string, siteId: string): Promise<any>;

  /**
   * Activate a theme
   * @param connectionId - Connection ID
   * @param siteId - Site/Store ID
   * @param themeId - Theme ID to activate
   */
  activateTheme(connectionId: string, siteId: string, themeId: string): Promise<void>;

  /**
   * Customize theme (apply custom CSS)
   * @param connectionId - Connection ID
   * @param siteId - Site/Store ID
   * @param customCSS - Custom CSS to apply
   */
  customizeTheme(connectionId: string, siteId: string, customCSS: string): Promise<void>;

  /**
   * Get theme customizations
   * @param connectionId - Connection ID
   * @param siteId - Site/Store ID
   * @returns Current customizations including CSS
   */
  getThemeCustomizations(connectionId: string, siteId: string): Promise<any>;

  /**
   * Preview theme changes
   * @param connectionId - Connection ID
   * @param siteId - Site/Store ID
   * @param changes - Changes to preview
   * @returns Preview URL or preview data
   */
  previewThemeChanges(connectionId: string, siteId: string, changes: any): Promise<any>;

  /**
   * Apply theme changes (publish preview)
   * @param connectionId - Connection ID
   * @param siteId - Site/Store ID
   * @param previewId - Preview ID to publish
   */
  applyThemeChanges(connectionId: string, siteId: string, previewId: string): Promise<void>;

  /**
   * Revert theme changes
   * @param connectionId - Connection ID
   * @param siteId - Site/Store ID
   * @param version - Version to revert to
   */
  revertThemeChanges(connectionId: string, siteId: string, version: string): Promise<void>;

  /**
   * Get theme change history
   * @param connectionId - Connection ID
   * @param siteId - Site/Store ID
   * @returns List of theme versions/changes
   */
  getThemeHistory(connectionId: string, siteId: string): Promise<any[]>;
}
