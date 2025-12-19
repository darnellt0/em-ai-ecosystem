/**
 * Centralized Redis Configuration
 * Provides consistent Redis connection setup across all services
 */

import Redis from 'ioredis';

/**
 * Get Redis URL with smart environment-aware fallback
 *
 * Priority:
 * 1. REDIS_URL environment variable (Docker containers use redis://redis:6379)
 * 2. Fallback to localhost:6380 (matches docker-compose port mapping for local dev)
 */
export function getRedisUrl(): string {
  const url = process.env.REDIS_URL;

  if (url) {
    return url;
  }

  // For local development outside Docker, use port 6380 to match docker-compose mapping
  const fallbackUrl = 'redis://localhost:6380';

  if (process.env.NODE_ENV !== 'test') {
    console.warn(
      `[Redis Config] REDIS_URL not set, using fallback: ${fallbackUrl}\n` +
      `  For Docker: Set REDIS_URL=redis://redis:6379\n` +
      `  For local dev: Set REDIS_URL=redis://localhost:6380 or ensure Redis runs on :6380`
    );
  }

  return fallbackUrl;
}

/**
 * Create a new Redis client with consistent configuration
 * @param options Additional IORedis options
 */
export function createRedisClient(options?: Redis.RedisOptions): Redis {
  const url = getRedisUrl();

  const defaultOptions: Redis.RedisOptions = {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: false,
    ...options,
  };

  const client = new Redis(url, defaultOptions);

  // Add connection error handler
  client.on('error', (err) => {
    if (process.env.NODE_ENV !== 'test') {
      console.error(`[Redis Error] Failed to connect to ${url}:`, err.message);
    }
  });

  client.on('connect', () => {
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[Redis] Connected to ${url}`);
    }
  });

  return client;
}

/**
 * Create a Redis client for lazy connection (for background services)
 * @param options Additional IORedis options
 */
export function createLazyRedisClient(options?: Redis.RedisOptions): Redis {
  return createRedisClient({
    ...options,
    lazyConnect: true,
  });
}
