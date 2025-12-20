FROM node:20-alpine

WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./
COPY packages/api/package*.json ./packages/api/
COPY packages/orchestrator/package*.json ./packages/orchestrator/

# Install dependencies (use npm ci for faster, reproducible builds)
RUN npm ci --workspaces --include-workspace-root || npm install --workspaces --include-workspace-root

# Copy source code (includes packages/shared needed by orchestrator)
COPY packages ./packages

# Skip TypeScript build - use ts-node at runtime for development
# Both API and orchestrator will use ts-node with runtime compilation
# RUN cd packages/orchestrator && npm run build
# RUN cd packages/api && npm run build

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    mkdir -p /app/logs /app/data && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000
ENV PORT=3000 NODE_ENV=production

# Use ts-node for runtime TypeScript execution
CMD ["npx", "ts-node", "packages/api/src/index.ts"]
