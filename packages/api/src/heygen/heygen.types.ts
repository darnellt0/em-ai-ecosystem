/**
 * HeyGen Types and Validation Schemas
 * Zod schemas for request validation
 */

import { z } from 'zod';

// ============================================================================
// REQUEST SCHEMAS
// ============================================================================

/**
 * Start session request schema
 */
export const StartSessionSchema = z.object({
  avatarId: z.string().min(1, 'Avatar ID is required'),
  voiceId: z.string().optional(),
  userId: z.string().optional(),
  language: z.string().optional(),
  quality: z.enum(['low', 'medium', 'high']).optional(),
});

export type StartSessionRequest = z.infer<typeof StartSessionSchema>;

/**
 * Send message request schema
 */
export const SendMessageSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
  text: z.string().min(1, 'Message text is required').max(5000, 'Message text too long'),
  userId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export type SendMessageRequest = z.infer<typeof SendMessageSchema>;

/**
 * End session request schema
 */
export const EndSessionSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
});

export type EndSessionRequest = z.infer<typeof EndSessionSchema>;

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface StartSessionResponse {
  sessionId: string;
  streamUrl?: string;
  widgetToken?: string;
  sessionToken?: string;
  expiresAt?: string;
}

export interface SendMessageResponse {
  sessionId: string;
  messageId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  timestamp: string;
}

export interface EndSessionResponse {
  sessionId: string;
  success: boolean;
  message: string;
}

export interface HeygenErrorResponse {
  status: 'error';
  message: string;
  code?: string;
}

// ============================================================================
// VALIDATION HELPER
// ============================================================================

export function parseHeygenRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; status: number; errors: string[] } {
  const result = schema.safeParse(data);

  if (!result.success) {
    const errors = result.error.errors.map((err) => `${err.path.join('.')}: ${err.message}`);
    return {
      success: false,
      status: 400,
      errors,
    };
  }

  return {
    success: true,
    data: result.data,
  };
}
