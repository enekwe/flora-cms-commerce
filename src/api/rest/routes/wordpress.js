import express from 'express';
import WordPressProvider from '../../../providers/wordpress/WordPressProvider.js';
import logger from '../../../utils/logger.js';

const router = express.Router();

// OAuth endpoints
router.post('/auth/connect', async (req, res, next) => {
  try {
    const { userId, organizationId, redirectUri } = req.body;

    if (!userId || !organizationId) {
      return res.status(400).json({ error: 'userId and organizationId are required' });
    }

    const authUrl = await WordPressProvider.initiateOAuth(userId, organizationId, redirectUri);

    res.json({ authUrl });
  } catch (error) {
    next(error);
  }
});

router.get('/auth/callback', async (req, res, next) => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.status(400).json({ error: 'code and state are required' });
    }

    const result = await WordPressProvider.handleOAuthCallback(code, state);

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Self-hosted connection
router.post('/auth/connect-self-hosted', async (req, res, next) => {
  try {
    const { userId, organizationId, siteUrl, username, applicationPassword } = req.body;

    if (!userId || !organizationId || !siteUrl || !username || !applicationPassword) {
      return res.status(400).json({
        error: 'userId, organizationId, siteUrl, username, and applicationPassword are required',
      });
    }

    const result = await WordPressProvider.connectSelfHosted(
      userId,
      organizationId,
      siteUrl,
      username,
      applicationPassword
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Connection management
router.post('/disconnect', async (req, res, next) => {
  try {
    const { connectionId } = req.body;

    if (!connectionId) {
      return res.status(400).json({ error: 'connectionId is required' });
    }

    await WordPressProvider.disconnect(connectionId);

    res.json({ success: true, message: 'Disconnected successfully' });
  } catch (error) {
    next(error);
  }
});

router.get('/verify/:connectionId', async (req, res, next) => {
  try {
    const { connectionId } = req.params;

    const isValid = await WordPressProvider.verifyConnection(connectionId);

    res.json({ valid: isValid });
  } catch (error) {
    next(error);
  }
});

// Theme management
router.get('/:connectionId/themes', async (req, res, next) => {
  try {
    const { connectionId } = req.params;

    const themes = await WordPressProvider.listThemes(connectionId, connectionId);

    res.json({ themes });
  } catch (error) {
    next(error);
  }
});

router.get('/:connectionId/themes/active', async (req, res, next) => {
  try {
    const { connectionId } = req.params;

    const theme = await WordPressProvider.getActiveTheme(connectionId, connectionId);

    res.json({ theme });
  } catch (error) {
    next(error);
  }
});

router.post('/:connectionId/themes/:themeId/activate', async (req, res, next) => {
  try {
    const { connectionId, themeId } = req.params;

    await WordPressProvider.activateTheme(connectionId, connectionId, themeId);

    res.json({ success: true, message: 'Theme activated successfully' });
  } catch (error) {
    next(error);
  }
});

router.post('/:connectionId/themes/customize', async (req, res, next) => {
  try {
    const { connectionId } = req.params;
    const { customCSS } = req.body;

    if (!customCSS) {
      return res.status(400).json({ error: 'customCSS is required' });
    }

    await WordPressProvider.customizeTheme(connectionId, connectionId, customCSS);

    res.json({ success: true, message: 'Custom CSS applied successfully' });
  } catch (error) {
    next(error);
  }
});

router.get('/:connectionId/themes/customizations', async (req, res, next) => {
  try {
    const { connectionId } = req.params;

    const customizations = await WordPressProvider.getThemeCustomizations(connectionId, connectionId);

    res.json({ customizations });
  } catch (error) {
    next(error);
  }
});

// Content sync
router.get('/:connectionId/content/:contentType/sync', async (req, res, next) => {
  try {
    const { connectionId, contentType } = req.params;
    const options = req.query;

    const content = await WordPressProvider.syncContent(connectionId, connectionId, contentType, options);

    res.json({ content, count: content.length });
  } catch (error) {
    next(error);
  }
});

router.post('/:connectionId/content/:contentType', async (req, res, next) => {
  try {
    const { connectionId, contentType } = req.params;
    const data = req.body;

    const content = await WordPressProvider.createContent(connectionId, connectionId, contentType, data);

    res.status(201).json({ content });
  } catch (error) {
    next(error);
  }
});

router.put('/:connectionId/content/:contentType/:contentId', async (req, res, next) => {
  try {
    const { connectionId, contentType, contentId } = req.params;
    const data = req.body;

    const content = await WordPressProvider.updateContent(connectionId, connectionId, contentType, contentId, data);

    res.json({ content });
  } catch (error) {
    next(error);
  }
});

router.delete('/:connectionId/content/:contentType/:contentId', async (req, res, next) => {
  try {
    const { connectionId, contentType, contentId } = req.params;

    await WordPressProvider.deleteContent(connectionId, connectionId, contentType, contentId);

    res.json({ success: true, message: 'Content deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Categories and tags
router.get('/:connectionId/categories', async (req, res, next) => {
  try {
    const { connectionId } = req.params;

    const categories = await WordPressProvider.getCategories(connectionId);

    res.json({ categories });
  } catch (error) {
    next(error);
  }
});

router.get('/:connectionId/tags', async (req, res, next) => {
  try {
    const { connectionId } = req.params;

    const tags = await WordPressProvider.getTags(connectionId);

    res.json({ tags });
  } catch (error) {
    next(error);
  }
});

export default router;
