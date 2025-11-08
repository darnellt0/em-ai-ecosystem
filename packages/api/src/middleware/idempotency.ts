/**
 * Idempotency middleware for voice API endpoints.
 * Accepts optional "Idempotency-Key" header and deduplicates within 60s TTL.
 *
 * NOTE: For production at scale, replace with Redis-backed store:
 * - Store: HSET idempotency:<key> response <jsonResponse> expireAt <timestamp>
 * - Check: HGET idempotency:<key> response + compare expireAt
 * - Use EXPIRE or check timestamp to handle TTL
 * Example: HSET:
 *   redis.hset(`idempotency:${key}`, 'response', JSON.stringify(response), 'expireAt', now + 60000)
 *   redis.expire(`idempotency:${key}`, 60)
 */

import { Request, Response, NextFunction } from "express";

interface IdempotencyEntry {
  ts: number;
  response: unknown;
}

// In-memory store: idempotency-key -> { ts, response }
const idempotencyMap = new Map<string, IdempotencyEntry>();

const TTL_MS = 60000; // 60 seconds

/**
 * Middleware to handle idempotency via Idempotency-Key header.
 * - If key present and within TTL: immediately return cached response.
 * - If key present but TTL expired: treat as new request.
 * - If no key: allow request normally.
 * - Response captured in a custom response hook.
 */
export function idempotency(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const key = req.headers["idempotency-key"] as string | undefined;

  if (!key) {
    // No key provided; allow request normally
    next();
    return;
  }

  const now = Date.now();
  const entry = idempotencyMap.get(key);

  // If key exists and within TTL, return cached response immediately
  if (entry && now - entry.ts < TTL_MS) {
    res.status(200).json(entry.response);
    return;
  }

  // Key expired or not found; proceed with request
  // Capture the response to store for future idempotent requests
  const originalJson = res.json.bind(res);
  res.json = function (body: unknown) {
    idempotencyMap.set(key, { ts: now, response: body });
    return originalJson.call(this, body);
  };

  next();
}

/**
 * Utility to clear a specific idempotency key (for testing).
 */
export function clearIdempotencyKey(key: string): void {
  idempotencyMap.delete(key);
}

/**
 * Utility to clear all idempotency entries (for testing).
 */
export function clearAllIdempotency(): void {
  idempotencyMap.clear();
}
