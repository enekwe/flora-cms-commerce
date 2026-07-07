import express from 'express';
import ThemeEngine from '../../../core/ThemeEngine.js';
import ProviderManager from '../../../core/ProviderManager.js';
import logger from '../../../utils/logger.js';

const router = express.Router();

// AI-powered theme editing
router.post('/ai/customize', async (req, res, next) => {
  try {
    const { provider, connectionId, siteId, instructions } = req.body;

    if (!provider || !connectionId || !siteId || !instructions) {
      return res.status(400).json({
        error: 'provider, connectionId, siteId, and instructions are required',
      });
    }

    const result = await ThemeEngine.applyAIThemeChanges(provider, connectionId, siteId, instructions);

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Theme preview
router.post('/preview', async (req, res, next) => {
  try {
    const { provider, connectionId, siteId, cssChanges } = req.body;

    if (!provider || !connectionId || !siteId || !cssChanges) {
      return res.status(400).json({
        error: 'provider, connectionId, siteId, and cssChanges are required',
      });
    }

    const result = await ThemeEngine.previewThemeChanges(provider, connectionId, siteId, cssChanges);

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Customization history
router.get('/:provider/:connectionId/:siteId/history', async (req, res, next) => {
  try {
    const { provider, connectionId, siteId } = req.params;

    const history = await ThemeEngine.getCustomizationHistory(provider, connectionId, siteId);

    res.json(history);
  } catch (error) {
    next(error);
  }
});

// Theme analysis
router.get('/:provider/:connectionId/:siteId/analyze', async (req, res, next) => {
  try {
    const { provider, connectionId, siteId } = req.params;

    const analysis = await ThemeEngine.analyzeTheme(provider, connectionId, siteId);

    res.json(analysis);
  } catch (error) {
    next(error);
  }
});

// Color scheme
router.post('/:provider/:connectionId/:siteId/color-scheme', async (req, res, next) => {
  try {
    const { provider, connectionId, siteId } = req.params;
    const colorScheme = req.body;

    const result = await ThemeEngine.applyColorScheme(provider, connectionId, siteId, colorScheme);

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Typography
router.post('/:provider/:connectionId/:siteId/typography', async (req, res, next) => {
  try {
    const { provider, connectionId, siteId } = req.params;
    const typography = req.body;

    const result = await ThemeEngine.applyTypography(provider, connectionId, siteId, typography);

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Layout
router.post('/:provider/:connectionId/:siteId/layout', async (req, res, next) => {
  try {
    const { provider, connectionId, siteId } = req.params;
    const layout = req.body;

    const result = await ThemeEngine.applyLayout(provider, connectionId, siteId, layout);

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Provider capabilities
router.get('/providers', async (req, res, next) => {
  try {
    const providerNames = ProviderManager.getProviderNames();
    const providers = providerNames.map((name) => ProviderManager.getProviderCapabilities(name));

    res.json({ providers });
  } catch (error) {
    next(error);
  }
});

router.get('/providers/:provider/capabilities', async (req, res, next) => {
  try {
    const { provider } = req.params;

    const capabilities = ProviderManager.getProviderCapabilities(provider);

    res.json(capabilities);
  } catch (error) {
    next(error);
  }
});

export default router;
