/**
 * HeyGen + EM-AI Integration Helper
 *
 * This module provides integration hooks between the EM-AI orchestration system
 * and HeyGen Interactive Avatar service. It enables EM-AI agents to deliver
 * responses as avatar speech.
 *
 * Usage:
 * 1. Start a HeyGen session for a user
 * 2. When EM-AI generates a response, call sendEmAiReplyAsAvatarSpeech
 * 3. The response will be sent to the avatar for TTS playback
 */

import { heygenService } from './heygen.service';

// ============================================================================
// TYPES
// ============================================================================

export interface EmAiAvatarSessionContext {
  sessionId: string;
  userId: string;
  avatarId: string;
  createdAt: string;
  conversationContext?: Record<string, any>;
}

export interface SendEmAiReplyParams {
  sessionId: string;
  emAiText: string;
  userId?: string;
  agentName?: string;
  conversationId?: string;
  metadata?: Record<string, any>;
}

export interface SendEmAiReplyResult {
  success: boolean;
  messageId?: string;
  status?: 'queued' | 'processing' | 'completed' | 'failed';
  error?: string;
}

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

/**
 * In-memory store for active avatar sessions.
 * In production, this should be replaced with Redis or similar persistent storage.
 */
const activeSessions = new Map<string, EmAiAvatarSessionContext>();

/**
 * Register an active avatar session for EM-AI integration
 */
export function registerEmAiAvatarSession(context: EmAiAvatarSessionContext): void {
  activeSessions.set(context.sessionId, context);
  console.log('[EM-AI HeyGen] Registered avatar session:', {
    sessionId: context.sessionId,
    userId: context.userId,
  });
}

/**
 * Unregister an avatar session
 */
export function unregisterEmAiAvatarSession(sessionId: string): void {
  activeSessions.delete(sessionId);
  console.log('[EM-AI HeyGen] Unregistered avatar session:', sessionId);
}

/**
 * Get session context by session ID
 */
export function getEmAiAvatarSession(sessionId: string): EmAiAvatarSessionContext | undefined {
  return activeSessions.get(sessionId);
}

/**
 * Get session by user ID
 */
export function getEmAiAvatarSessionByUserId(userId: string): EmAiAvatarSessionContext | undefined {
  for (const [_, session] of activeSessions) {
    if (session.userId === userId) {
      return session;
    }
  }
  return undefined;
}

// ============================================================================
// EM-AI INTEGRATION
// ============================================================================

/**
 * Send EM-AI generated response as avatar speech
 *
 * This is the primary integration function that EM-AI agents should call
 * to deliver responses via the HeyGen avatar.
 *
 * @param params - Parameters including session ID and EM-AI text
 * @returns Result indicating success/failure and message details
 *
 * @example
 * ```typescript
 * // In your EM-AI agent:
 * const emAiResponse = await generateEmAiResponse(userQuery);
 *
 * // Send to avatar
 * const result = await sendEmAiReplyAsAvatarSpeech({
 *   sessionId: 'session-123',
 *   emAiText: emAiResponse,
 *   userId: 'user-456',
 *   agentName: 'calendar-optimizer',
 * });
 *
 * if (result.success) {
 *   console.log('Avatar is speaking:', result.messageId);
 * }
 * ```
 */
export async function sendEmAiReplyAsAvatarSpeech(
  params: SendEmAiReplyParams
): Promise<SendEmAiReplyResult> {
  const { sessionId, emAiText, userId, agentName, conversationId, metadata } = params;

  try {
    // Validate session exists
    const session = getEmAiAvatarSession(sessionId);
    if (!session) {
      console.warn('[EM-AI HeyGen] Session not found:', sessionId);
      return {
        success: false,
        error: 'Avatar session not found or expired',
      };
    }

    // Optional: Log EM-AI response for analytics/debugging
    console.log('[EM-AI HeyGen] Sending EM-AI response to avatar:', {
      sessionId,
      userId,
      agentName,
      textLength: emAiText.length,
      conversationId,
    });

    // Send to HeyGen avatar
    const result = await heygenService.sendMessageToAvatar({
      sessionId,
      text: emAiText,
      userId,
      metadata: {
        ...metadata,
        agentName,
        conversationId,
        timestamp: new Date().toISOString(),
        source: 'em-ai',
      },
    });

    console.log('[EM-AI HeyGen] Avatar speech queued:', {
      messageId: result.messageId,
      status: result.status,
    });

    return {
      success: true,
      messageId: result.messageId,
      status: result.status,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[EM-AI HeyGen] Failed to send to avatar:', {
      error: errorMessage,
      sessionId,
    });

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Check if a user has an active avatar session
 */
export function hasActiveAvatarSession(userId: string): boolean {
  return getEmAiAvatarSessionByUserId(userId) !== undefined;
}

/**
 * Get all active avatar sessions (for monitoring/admin)
 */
export function getAllActiveAvatarSessions(): EmAiAvatarSessionContext[] {
  return Array.from(activeSessions.values());
}

/**
 * Clear all sessions (useful for testing or cleanup)
 */
export function clearAllAvatarSessions(): void {
  const count = activeSessions.size;
  activeSessions.clear();
  console.log(`[EM-AI HeyGen] Cleared ${count} avatar sessions`);
}

// ============================================================================
// EXAMPLE: Orchestrator Integration
// ============================================================================

/**
 * Example function showing how to integrate with EM-AI orchestrator.
 * This would typically be called from within an EM-AI agent or orchestrator.
 *
 * @example Usage in EM-AI orchestrator:
 * ```typescript
 * import { processEmAiQueryWithAvatar } from './services/heygen-em-ai.integration';
 *
 * // When user sends a query and has an active avatar session:
 * const result = await processEmAiQueryWithAvatar({
 *   userId: 'user-123',
 *   userQuery: 'What's on my calendar today?',
 *   agentName: 'calendar-optimizer',
 * });
 * ```
 */
export async function processEmAiQueryWithAvatar(params: {
  userId: string;
  userQuery: string;
  agentName?: string;
}): Promise<{ success: boolean; avatarResponse?: string; error?: string }> {
  try {
    // 1. Check if user has active avatar session
    const session = getEmAiAvatarSessionByUserId(params.userId);
    if (!session) {
      return {
        success: false,
        error: 'No active avatar session for user',
      };
    }

    // 2. Generate EM-AI response (this is a placeholder - replace with actual EM-AI logic)
    const emAiResponse = await generateMockEmAiResponse(params.userQuery);

    // 3. Send to avatar
    const result = await sendEmAiReplyAsAvatarSpeech({
      sessionId: session.sessionId,
      emAiText: emAiResponse,
      userId: params.userId,
      agentName: params.agentName,
    });

    if (!result.success) {
      return {
        success: false,
        error: result.error,
      };
    }

    return {
      success: true,
      avatarResponse: emAiResponse,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[EM-AI HeyGen] Query processing failed:', errorMessage);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Mock EM-AI response generator (replace with actual EM-AI orchestrator call)
 */
async function generateMockEmAiResponse(query: string): Promise<string> {
  // This is a placeholder. In production, this would call your actual EM-AI orchestrator
  // or specific agent to generate a response.
  return `I received your query: "${query}". This is a mock response from EM-AI. Replace this with actual EM-AI orchestration logic.`;
}
