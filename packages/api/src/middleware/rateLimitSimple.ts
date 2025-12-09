/**
 * Simple in-memory rate limiter for voice API endpoints.
 * Enforces 20 requests per 10 seconds per IP using a sliding window.
 *
 * NOTE: For production at scale, replace with Redis-backed limiter:
 * - Use a Redis list with LPUSH for window entries
 * - LRANGE to count entries within TTL
 * - LTRIM to clean expired entries
 * - Use redisClient.incr(key) with EXPIRE for atomic operations
 * Example: https://redis.io/commands/sliding-window-counter
 */

import { Request, Response, NextFunction } from 'express';

interface RateLimitEntry {
  timestamp: number;
  count: number;
}

// In-memory store: IP -> { timestamp of window start, count }
const rateLimitMap = new Map<string, RateLimitEntry>();

const WINDOW_MS = 10000; // 10 seconds
const MAX_REQUESTS = 20; // 20 requests per window

/**
 * Middleware to enforce rate limit: 20 req/10s per IP.
 * Returns 429 if limit exceeded.
 */
export function rateLimitSimple(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const clientIp = (req.ip || req.socket.remoteAddress || 'unknown').toString();
  const now = Date.now();

  let entry = rateLimitMap.get(clientIp);

  // Initialize or reset expired window
  if (!entry || now - entry.timestamp > WINDOW_MS) {
    entry = { timestamp: now, count: 1 };
    rateLimitMap.set(clientIp, entry);
    next();
    return;
  }

  // Increment count within current window
  entry.count++;

  if (entry.count > MAX_REQUESTS) {
    res.status(429).json({
      status: 'error',
      humanSummary: `Rate limit exceeded: ${MAX_REQUESTS} requests per ${WINDOW_MS / 1000}s allowed.`,
      nextBestAction: 'Retry after a moment.',
    });
    return;
  }

  next();
}

/**
 * Utility to reset rate limit for a specific IP (for testing).
 */
export function resetRateLimitForIP(ip: string): void {
  rateLimitMap.delete(ip);
}

/**
 * Utility to clear all rate limit entries (for testing).
 */
export function clearAllRateLimits(): void {
  rateLimitMap.clear();
}
