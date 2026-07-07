# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies for TypeScript compilation)
RUN npm ci

# Copy TypeScript config and source code
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript to JavaScript
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled JavaScript from builder (dist directory)
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

# Pre-create logs directory with proper ownership (fallback for file logging)
# This ensures file logging works if ENABLE_FILE_LOGGING=true is set
RUN mkdir -p logs && chown -R nodejs:nodejs logs

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 4002

# Health check (using ES module syntax)
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node --eval "import('http').then(http => http.get('http://localhost:4002/health', res => process.exit(res.statusCode === 200 ? 0 : 1)));"

# Start application from compiled dist directory
CMD ["node", "dist/index.js"]
