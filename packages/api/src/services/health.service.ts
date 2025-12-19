/**
 * Health Check Service
 * Provides comprehensive health checks for all system dependencies
 */

import { createRedisClient } from '../config/redis.config';
import { Pool } from 'pg';

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: {
    redis: {
      status: 'up' | 'down';
      responseTime?: number;
      error?: string;
    };
    database: {
      status: 'up' | 'down';
      responseTime?: number;
      error?: string;
    };
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
  };
}

/**
 * Check Redis connectivity
 */
async function checkRedis(): Promise<{ status: 'up' | 'down'; responseTime?: number; error?: string }> {
  const startTime = Date.now();

  try {
    const redis = createRedisClient({ lazyConnect: true, maxRetriesPerRequest: 1 });

    await redis.connect();
    await redis.ping();
    await redis.quit();

    return {
      status: 'up',
      responseTime: Date.now() - startTime,
    };
  } catch (error) {
    return {
      status: 'down',
      error: (error as Error).message,
    };
  }
}

/**
 * Check PostgreSQL connectivity
 */
async function checkDatabase(): Promise<{ status: 'up' | 'down'; responseTime?: number; error?: string }> {
  const startTime = Date.now();

  if (!process.env.DATABASE_URL) {
    return {
      status: 'down',
      error: 'DATABASE_URL not configured',
    };
  }

  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      connectionTimeoutMillis: 3000,
    });

    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    await pool.end();

    return {
      status: 'up',
      responseTime: Date.now() - startTime,
    };
  } catch (error) {
    return {
      status: 'down',
      error: (error as Error).message,
    };
  }
}

/**
 * Get memory usage information
 */
function getMemoryUsage() {
  const mem = process.memoryUsage();
  const totalHeap = mem.heapTotal;
  const usedHeap = mem.heapUsed;

  return {
    used: Math.round(usedHeap / 1024 / 1024), // MB
    total: Math.round(totalHeap / 1024 / 1024), // MB
    percentage: Math.round((usedHeap / totalHeap) * 100),
  };
}

/**
 * Perform full health check
 */
export async function performHealthCheck(): Promise<HealthCheckResult> {
  const [redisCheck, dbCheck] = await Promise.allSettled([
    checkRedis(),
    checkDatabase(),
  ]);

  const redis = redisCheck.status === 'fulfilled' ? redisCheck.value : { status: 'down' as const, error: 'Check failed' };
  const database = dbCheck.status === 'fulfilled' ? dbCheck.value : { status: 'down' as const, error: 'Check failed' };

  // Determine overall status
  let status: 'healthy' | 'degraded' | 'unhealthy';
  if (redis.status === 'up' && database.status === 'up') {
    status = 'healthy';
  } else if (redis.status === 'down' && database.status === 'down') {
    status = 'unhealthy';
  } else {
    status = 'degraded';
  }

  return {
    status,
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    checks: {
      redis,
      database,
      memory: getMemoryUsage(),
    },
  };
}
