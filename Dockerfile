FROM node:20-alpine

WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./
COPY packages/api/package*.json ./packages/api/
COPY packages/orchestrator/package*.json ./packages/orchestrator/ 2>/dev/null || true
COPY packages/agents/daily-brief/package*.json ./packages/agents/daily-brief/ 2>/dev/null || true

# Install dependencies (use npm ci for faster, reproducible builds)
RUN npm ci --workspaces --include-workspace-root || npm install --workspaces --include-workspace-root

# Copy source code
COPY packages ./packages

# Build TypeScript for production
RUN cd packages/api && npm run build

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    mkdir -p /app/logs /app/data && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000
ENV PORT=3000 NODE_ENV=production

# Use built JavaScript instead of ts-node for better performance
CMD ["node", "packages/api/dist/index.js"]
