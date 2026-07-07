# Flora CMS-Commerce Microservice

Unified CMS and eCommerce platform integrations for Flora with AI-powered theme editing capabilities.

## Overview

This microservice provides seamless integration with multiple CMS and eCommerce platforms:
- **WordPress**: Theme management, content sync, custom CSS injection
- **Shopify**: Store management, Liquid template editing, product sync
- **Webflow**: (Future) CMS collection sync, design system integration

## Features

- Multi-tenant OAuth authentication for all platforms
- AI-powered theme customization and CSS editing
- Bidirectional content synchronization
- Real-time updates via GraphQL subscriptions
- gRPC integration with Flora Command Center
- Encrypted token storage with MongoDB
- Event-driven architecture with Redis/Bull

## Architecture

```
flora-cms-commerce/
├── src/
│   ├── api/              # REST and GraphQL APIs
│   ├── providers/        # Platform integrations (WordPress, Shopify, Webflow)
│   ├── core/            # Core business logic
│   ├── events/          # Event publishers/consumers
│   ├── config/          # Configuration
│   └── utils/           # Utilities
├── tests/               # Unit and integration tests
├── Dockerfile
└── docker-compose.yml
```

## Environment Variables

```bash
# Server
PORT=4002
NODE_ENV=production

# Database
MONGODB_URI=mongodb://localhost:27017/flora-cms-commerce

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Encryption
ENCRYPTION_KEY=32_character_hex_key

# WordPress
WORDPRESS_CLIENT_ID=your_client_id
WORDPRESS_CLIENT_SECRET=your_client_secret
WORDPRESS_REDIRECT_URI=https://api.flora.passbook.vc/api/v1/cms-commerce/wordpress/callback

# Shopify
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
SHOPIFY_REDIRECT_URI=https://api.flora.passbook.vc/api/v1/cms-commerce/shopify/callback

# Webflow (Future)
WEBFLOW_CLIENT_ID=your_client_id
WEBFLOW_CLIENT_SECRET=your_client_secret

# Command Center
COMMAND_CENTER_URL=http://flora-command-center:4000
GRPC_PORT=50052
```

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run integration tests
npm run test:integration

# Watch mode
npm run test:watch
```

## Docker

```bash
# Build
docker build -t flora-cms-commerce .

# Run
docker-compose up
```

## API Documentation

### REST Endpoints

#### WordPress
- `POST /api/v1/wordpress/auth/connect` - Initiate OAuth
- `GET /api/v1/wordpress/auth/callback` - OAuth callback
- `GET /api/v1/wordpress/sites` - List connected sites
- `POST /api/v1/wordpress/themes` - Manage themes
- `POST /api/v1/wordpress/content/sync` - Sync content

#### Shopify
- `POST /api/v1/shopify/auth/connect` - Initiate OAuth
- `GET /api/v1/shopify/auth/callback` - OAuth callback
- `GET /api/v1/shopify/stores` - List connected stores
- `POST /api/v1/shopify/themes` - Manage themes
- `POST /api/v1/shopify/products/sync` - Sync products

### GraphQL

```graphql
query {
  cmsConnections {
    id
    provider
    status
    metadata
  }
}

mutation {
  customizeTheme(input: {
    connectionId: "123"
    cssRules: ["body { color: red; }"]
  }) {
    success
    message
  }
}

subscription {
  themeUpdated(connectionId: "123") {
    status
    preview
  }
}
```

## gRPC Services

- `ThemeEditService`: AI-powered theme editing
- `ContentSyncService`: Bidirectional content sync
- `HealthService`: Service health checks

## License

MIT
