# ============================================
# EM-AI ECOSYSTEM - PRODUCTION DOCKERFILE
# ============================================

FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
COPY packages/api/package*.json ./packages/api/

RUN npm ci --workspace=packages/api

# Copy source
COPY packages/api ./packages/api
COPY tsconfig*.json ./

# Build
RUN npm run build --workspace=packages/api

# ============================================
# PRODUCTION IMAGE
# ============================================

FROM node:20-alpine AS production

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
COPY packages/api/package*.json ./packages/api/

RUN npm ci --workspace=packages/api --omit=dev

# Copy built files
COPY --from=builder /app/packages/api/dist ./packages/api/dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Start
CMD ["node", "packages/api/dist/index.js"]
