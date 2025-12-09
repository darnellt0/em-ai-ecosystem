/**
 * Sentry Error Tracking Integration
 *
 * Initializes Sentry for production error tracking and performance monitoring
 */

import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

/**
 * Initialize Sentry error tracking
 */
export function initSentry(): void {
  const sentryDsn = process.env.SENTRY_DSN;
  const environment = process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development';
  const tracesSampleRate = parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1');

  // Only initialize if DSN is provided
  if (!sentryDsn) {
    console.warn('⚠️  Sentry DSN not provided - error tracking disabled');
    return;
  }

  Sentry.init({
    dsn: sentryDsn,
    environment,
    integrations: [
      nodeProfilingIntegration(),
    ],
    // Performance Monitoring
    tracesSampleRate,
    // Set sampling rate for profiling - this is relative to tracesSampleRate
    profilesSampleRate: 1.0,
  });

  console.log(`✅ Sentry initialized for environment: ${environment}`);
}

/**
 * Capture exception with Sentry
 */
export function captureException(error: Error, context?: Record<string, any>): void {
  if (context) {
    Sentry.setContext('additional', context);
  }
  Sentry.captureException(error);
}

/**
 * Capture message with Sentry
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info'): void {
  Sentry.captureMessage(message, level);
}

/**
 * Set user context for Sentry
 */
export function setUser(user: { id: string; email?: string; username?: string }): void {
  Sentry.setUser(user);
}

/**
 * Add breadcrumb to Sentry
 */
export function addBreadcrumb(breadcrumb: Sentry.Breadcrumb): void {
  Sentry.addBreadcrumb(breadcrumb);
}

/**
 * Flush Sentry events (useful before shutdown)
 */
export async function flushSentry(timeout: number = 2000): Promise<boolean> {
  return await Sentry.close(timeout);
}
