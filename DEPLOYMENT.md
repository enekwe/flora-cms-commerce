# Flora CMS-Commerce Deployment Guide

## Railway Deployment (Port 4002)

### Prerequisites
- Railway account configured
- GitHub repository connected to Railway
- MongoDB Atlas or Railway MongoDB service
- Redis service (Railway or external)

### Step 1: Create Railway Project

```bash
railway login
railway init
railway link
```

### Step 2: Configure Environment Variables

In Railway dashboard, add the following environment variables:

```bash
# Server
PORT=4002
NODE_ENV=production

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/flora-cms-commerce

# Redis
REDIS_HOST=redis.railway.internal
REDIS_PORT=6379

# Encryption (Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
ENCRYPTION_KEY=your_32_character_hex_key_here

# WordPress Integration
WORDPRESS_CLIENT_ID=your_wordpress_client_id
WORDPRESS_CLIENT_SECRET=your_wordpress_client_secret
WORDPRESS_REDIRECT_URI=https://your-railway-domain.up.railway.app/api/v1/wordpress/auth/callback

# Shopify Integration
SHOPIFY_CLIENT_ID=your_shopify_client_id
SHOPIFY_CLIENT_SECRET=your_shopify_client_secret
SHOPIFY_REDIRECT_URI=https://your-railway-domain.up.railway.app/api/v1/shopify/auth/callback
SHOPIFY_SCOPES=read_products,write_products,read_themes,write_themes,read_content,write_content

# Command Center Integration
COMMAND_CENTER_URL=https://flora-command-center.up.railway.app
GRPC_PORT=50052

# Security
JWT_SECRET=your_jwt_secret_here
CORS_ORIGIN=https://your-frontend-domain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
```

### Step 3: Deploy to Railway

```bash
railway up
```

Or connect your GitHub repository in Railway dashboard and enable auto-deployments.

### Step 4: Verify Deployment

```bash
curl https://your-railway-domain.up.railway.app/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "flora-cms-commerce",
  "version": "1.0.0",
  "timestamp": "2026-07-06T..."
}
```

### Step 5: Test Endpoints

#### WordPress OAuth
```bash
curl -X POST https://your-railway-domain.up.railway.app/api/v1/wordpress/auth/connect \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "organizationId": "org456",
    "redirectUri": "https://your-app.com/callback"
  }'
```

#### Shopify OAuth
```bash
curl -X POST https://your-railway-domain.up.railway.app/api/v1/shopify/auth/connect \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "organizationId": "org456",
    "shopDomain": "mystore.myshopify.com",
    "redirectUri": "https://your-app.com/callback"
  }'
```

#### Provider Capabilities
```bash
curl https://your-railway-domain.up.railway.app/api/v1/themes/providers
```

## Local Development

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Redis (local or cloud)

### Setup

1. Clone the repository:
```bash
git clone https://github.com/enekwe/flora-cms-commerce.git
cd flora-cms-commerce
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Edit `.env` with your credentials

5. Start development server:
```bash
npm run dev
```

6. Run tests:
```bash
npm test
```

## Docker Deployment

### Build and Run Locally

```bash
# Build image
docker build -t flora-cms-commerce .

# Run with docker-compose
docker-compose up -d

# Check logs
docker-compose logs -f flora-cms-commerce

# Stop services
docker-compose down
```

### Access Services

- API: http://localhost:4002
- Health: http://localhost:4002/health
- MongoDB: localhost:27017
- Redis: localhost:6379

## Monitoring and Logging

### Health Checks

The service includes built-in health checks:
- HTTP: `GET /health`
- Docker: Configured in Dockerfile
- Railway: Automatic health checks enabled

### Logs

In production (Railway):
```bash
railway logs
```

Locally:
```bash
docker-compose logs -f
```

### Metrics

Monitor the following:
- API response times
- Database connection pool
- Redis connection status
- OAuth success/failure rates
- Theme customization operations

## Troubleshooting

### Connection Issues

1. Check MongoDB connection:
```bash
railway logs | grep "MongoDB"
```

2. Verify environment variables:
```bash
railway variables
```

3. Test Redis connection:
```bash
railway run redis-cli ping
```

### OAuth Issues

1. Verify redirect URIs match exactly in provider settings
2. Check HTTPS is enabled for production
3. Validate client IDs and secrets
4. Review OAuth callback logs

### Theme Customization Issues

1. Check provider connection status
2. Verify theme permissions/scopes
3. Validate CSS syntax
4. Review provider-specific limitations

## Security Considerations

1. **Encryption Key**: Generate a strong 32-byte hex key
2. **JWT Secret**: Use a long, random string
3. **HTTPS**: Always use HTTPS in production
4. **CORS**: Restrict to specific origins
5. **Rate Limiting**: Adjust based on usage patterns
6. **Token Storage**: All tokens are encrypted at rest
7. **Input Validation**: All endpoints validate inputs
8. **Dependency Updates**: Regularly update dependencies

## Scaling

### Horizontal Scaling

Railway supports horizontal scaling:
```bash
railway scale --replicas 3
```

### Database Optimization

- Use MongoDB indexes (already configured in models)
- Enable connection pooling (configured)
- Consider read replicas for high traffic

### Caching

- Redis caching implemented for theme assets
- Configure cache TTL based on usage patterns
- Monitor cache hit rates

## Backup and Recovery

### Database Backups

Configure automatic backups in MongoDB Atlas or Railway.

### Disaster Recovery

1. Export environment variables
2. Backup MongoDB data
3. Document Redis data structures
4. Version control all code
5. Test restore procedures regularly

## API Documentation

Access the full API documentation:
- Swagger/OpenAPI: (to be implemented)
- Postman Collection: (to be created)

### Key Endpoints

#### WordPress
- `POST /api/v1/wordpress/auth/connect` - Initiate OAuth
- `GET /api/v1/wordpress/auth/callback` - OAuth callback
- `GET /api/v1/wordpress/:connectionId/themes` - List themes
- `POST /api/v1/wordpress/:connectionId/themes/customize` - Apply CSS

#### Shopify
- `POST /api/v1/shopify/auth/connect` - Initiate OAuth
- `GET /api/v1/shopify/auth/callback` - OAuth callback
- `GET /api/v1/shopify/:connectionId/products` - List products
- `POST /api/v1/shopify/:connectionId/themes/:themeId/customize` - Apply CSS

#### Themes (AI-Powered)
- `POST /api/v1/themes/ai/customize` - AI theme customization
- `POST /api/v1/themes/preview` - Preview changes
- `GET /api/v1/themes/:provider/:connectionId/:siteId/analyze` - Analyze theme

## Support

For issues or questions:
- GitHub Issues: https://github.com/enekwe/flora-cms-commerce/issues
- Documentation: See README.md
- API Reference: (to be published)
