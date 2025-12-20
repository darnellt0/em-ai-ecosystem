# Dashboard Dockerfile - Next.js Application
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files for the dashboard
COPY packages/dashboard/package*.json ./packages/dashboard/
RUN cd packages/dashboard && npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Copy dependencies
COPY --from=deps /app/packages/dashboard/node_modules ./packages/dashboard/node_modules

# Copy dashboard source code
COPY packages/dashboard ./packages/dashboard

# Set working directory to dashboard
WORKDIR /app/packages/dashboard

# Set environment variable for API URL (can be overridden at runtime)
ENV NEXT_PUBLIC_API_BASE_URL=http://api:3000

# Build the Next.js application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/packages/dashboard/public ./public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/packages/dashboard/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/packages/dashboard/.next/static ./.next/static

USER nextjs

EXPOSE 3001

ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
