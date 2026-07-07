import express from 'express';
import ShopifyProvider from '../../../providers/shopify/ShopifyProvider.js';
import logger from '../../../utils/logger.js';

const router = express.Router();

// OAuth endpoints
router.post('/auth/connect', async (req, res, next) => {
  try {
    const { userId, organizationId, shopDomain, redirectUri } = req.body;

    if (!userId || !organizationId || !shopDomain) {
      return res.status(400).json({ error: 'userId, organizationId, and shopDomain are required' });
    }

    const authUrl = await ShopifyProvider.initiateOAuth(userId, organizationId, shopDomain, redirectUri);

    res.json({ authUrl });
  } catch (error) {
    next(error);
  }
});

router.get('/auth/callback', async (req, res, next) => {
  try {
    const { code, shop, state, hmac } = req.query;

    if (!code || !shop || !state || !hmac) {
      return res.status(400).json({ error: 'code, shop, state, and hmac are required' });
    }

    const result = await ShopifyProvider.handleOAuthCallback(code, shop, state, hmac);

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

    await ShopifyProvider.disconnect(connectionId);

    res.json({ success: true, message: 'Disconnected successfully' });
  } catch (error) {
    next(error);
  }
});

router.get('/verify/:connectionId', async (req, res, next) => {
  try {
    const { connectionId } = req.params;

    const isValid = await ShopifyProvider.verifyConnection(connectionId);

    res.json({ valid: isValid });
  } catch (error) {
    next(error);
  }
});

router.get('/:connectionId/store', async (req, res, next) => {
  try {
    const { connectionId } = req.params;

    const store = await ShopifyProvider.getStore(connectionId);

    res.json({ store });
  } catch (error) {
    next(error);
  }
});

// Product management
router.get('/:connectionId/products', async (req, res, next) => {
  try {
    const { connectionId } = req.params;
    const options = req.query;

    const products = await ShopifyProvider.listProducts(connectionId, options);

    res.json({ products, count: products.length });
  } catch (error) {
    next(error);
  }
});

router.get('/:connectionId/products/:productId', async (req, res, next) => {
  try {
    const { connectionId, productId } = req.params;

    const product = await ShopifyProvider.getProduct(connectionId, productId);

    res.json({ product });
  } catch (error) {
    next(error);
  }
});

router.post('/:connectionId/products', async (req, res, next) => {
  try {
    const { connectionId } = req.params;
    const productData = req.body;

    const product = await ShopifyProvider.createProduct(connectionId, productData);

    res.status(201).json({ product });
  } catch (error) {
    next(error);
  }
});

router.put('/:connectionId/products/:productId', async (req, res, next) => {
  try {
    const { connectionId, productId } = req.params;
    const productData = req.body;

    const product = await ShopifyProvider.updateProduct(connectionId, productId, productData);

    res.json({ product });
  } catch (error) {
    next(error);
  }
});

router.delete('/:connectionId/products/:productId', async (req, res, next) => {
  try {
    const { connectionId, productId } = req.params;

    await ShopifyProvider.deleteProduct(connectionId, productId);

    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
});

router.post('/:connectionId/products/sync', async (req, res, next) => {
  try {
    const { connectionId } = req.params;
    const options = req.body;

    const result = await ShopifyProvider.syncProducts(connectionId, options);

    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/:connectionId/products/count', async (req, res, next) => {
  try {
    const { connectionId } = req.params;

    const count = await ShopifyProvider.getProductCount(connectionId);

    res.json({ count });
  } catch (error) {
    next(error);
  }
});

// Collection management
router.get('/:connectionId/collections', async (req, res, next) => {
  try {
    const { connectionId } = req.params;
    const options = req.query;

    const collections = await ShopifyProvider.listCollections(connectionId, options);

    res.json({ collections, count: collections.length });
  } catch (error) {
    next(error);
  }
});

router.get('/:connectionId/collections/:collectionId', async (req, res, next) => {
  try {
    const { connectionId, collectionId } = req.params;

    const collection = await ShopifyProvider.getCollection(connectionId, collectionId);

    res.json({ collection });
  } catch (error) {
    next(error);
  }
});

// Theme management
router.get('/:connectionId/themes', async (req, res, next) => {
  try {
    const { connectionId } = req.params;

    const themes = await ShopifyProvider.listThemes(connectionId);

    res.json({ themes });
  } catch (error) {
    next(error);
  }
});

router.get('/:connectionId/themes/active', async (req, res, next) => {
  try {
    const { connectionId } = req.params;

    const theme = await ShopifyProvider.getActiveTheme(connectionId);

    res.json({ theme });
  } catch (error) {
    next(error);
  }
});

router.get('/:connectionId/themes/:themeId/assets', async (req, res, next) => {
  try {
    const { connectionId, themeId } = req.params;

    const assets = await ShopifyProvider.getThemeAssets(connectionId, themeId);

    res.json({ assets });
  } catch (error) {
    next(error);
  }
});

router.put('/:connectionId/themes/:themeId/assets', async (req, res, next) => {
  try {
    const { connectionId, themeId } = req.params;
    const { assetKey, content } = req.body;

    if (!assetKey || !content) {
      return res.status(400).json({ error: 'assetKey and content are required' });
    }

    await ShopifyProvider.updateThemeAsset(connectionId, themeId, assetKey, content);

    res.json({ success: true, message: 'Asset updated successfully' });
  } catch (error) {
    next(error);
  }
});

router.post('/:connectionId/themes/:themeId/customize', async (req, res, next) => {
  try {
    const { connectionId, themeId } = req.params;
    const { customCSS } = req.body;

    if (!customCSS) {
      return res.status(400).json({ error: 'customCSS is required' });
    }

    await ShopifyProvider.customizeTheme(connectionId, themeId, customCSS);

    res.json({ success: true, message: 'Custom CSS applied successfully' });
  } catch (error) {
    next(error);
  }
});

router.get('/:connectionId/themes/:themeId/customizations', async (req, res, next) => {
  try {
    const { connectionId, themeId } = req.params;

    const customizations = await ShopifyProvider.getThemeCustomizations(connectionId, themeId);

    res.json({ customizations });
  } catch (error) {
    next(error);
  }
});

router.post('/:connectionId/themes/:themeId/duplicate', async (req, res, next) => {
  try {
    const { connectionId, themeId } = req.params;

    const theme = await ShopifyProvider.duplicateTheme(connectionId, themeId);

    res.json({ theme });
  } catch (error) {
    next(error);
  }
});

router.post('/:connectionId/themes/:themeId/publish', async (req, res, next) => {
  try {
    const { connectionId, themeId } = req.params;

    const theme = await ShopifyProvider.publishTheme(connectionId, themeId);

    res.json({ theme });
  } catch (error) {
    next(error);
  }
});

router.get('/:connectionId/themes/:themeId/preview', async (req, res, next) => {
  try {
    const { connectionId, themeId } = req.params;

    const preview = await ShopifyProvider.previewTheme(connectionId, themeId);

    res.json(preview);
  } catch (error) {
    next(error);
  }
});

// Webhooks
router.post('/:connectionId/webhooks', async (req, res, next) => {
  try {
    const { connectionId } = req.params;
    const { topic, address } = req.body;

    if (!topic || !address) {
      return res.status(400).json({ error: 'topic and address are required' });
    }

    const webhook = await ShopifyProvider.createWebhook(connectionId, topic, address);

    res.status(201).json({ webhook });
  } catch (error) {
    next(error);
  }
});

export default router;
