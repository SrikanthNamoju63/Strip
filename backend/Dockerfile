# Healthcare Platform Backend - Docker Production Image
# Multi-stage build for optimized image size

# ========================================
# STAGE 1: BUILD
# ========================================
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# ========================================
# STAGE 2: RUNTIME
# ========================================
FROM node:18-alpine

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init curl

WORKDIR /app

# Copy from build stage
COPY --from=build /app/node_modules ./node_modules

# Copy application code
COPY . .

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

# Expose ports
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["npm", "start"]
