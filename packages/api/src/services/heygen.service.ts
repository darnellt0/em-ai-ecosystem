/**
 * HeyGen Interactive Avatar Service
 * Manages avatar sessions and message sending for HeyGen integration
 */

import { heygenConfig } from '../config/heygen.config';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface StartSessionParams {
  avatarId: string;
  voiceId?: string;
  userId?: string;
  language?: string;
  quality?: 'low' | 'medium' | 'high';
}

export interface StartSessionResult {
  sessionId: string;
  streamUrl?: string;
  widgetToken?: string;
  sessionToken?: string;
  expiresAt?: string;
  metadata?: Record<string, any>;
}

export interface SendMessageParams {
  sessionId: string;
  text: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface SendMessageResult {
  sessionId: string;
  messageId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface EndSessionResult {
  sessionId: string;
  success: boolean;
  message: string;
}

// ============================================================================
// HEYGEN SERVICE CLASS
// ============================================================================

export class HeygenService {
  private logger = console;

  /**
   * Start a new interactive avatar session
   */
  async startInteractiveAvatarSession(
    params: StartSessionParams
  ): Promise<StartSessionResult> {
    const config = heygenConfig.getConfig();

    this.logger.info('[HeyGen Service] Starting interactive avatar session', {
      avatarId: params.avatarId,
      userId: params.userId,
    });

    try {
      // Call HeyGen API to create a new session
      const response = await this.makeRequest<any>(
        'POST',
        '/v1/streaming.new',
        {
          avatar_id: params.avatarId,
          voice_id: params.voiceId,
          language: params.language || 'en',
          quality: params.quality || 'medium',
        }
      );

      // Map HeyGen response to our internal format
      const result: StartSessionResult = {
        sessionId: response.data?.session_id || response.session_id,
        streamUrl: response.data?.stream_url || response.stream_url,
        widgetToken: response.data?.access_token || response.access_token,
        sessionToken: response.data?.session_token || response.session_token,
        expiresAt: response.data?.expires_at || response.expires_at,
        metadata: {
          userId: params.userId,
          createdAt: new Date().toISOString(),
        },
      };

      this.logger.info('[HeyGen Service] Session created successfully', {
        sessionId: result.sessionId,
      });

      return result;
    } catch (error) {
      this.logger.error('[HeyGen Service] Failed to start session', {
        error: error instanceof Error ? error.message : String(error),
        avatarId: params.avatarId,
      });
      throw this.handleError(error, 'Failed to start interactive avatar session');
    }
  }

  /**
   * Send a message (text) to an active avatar session for TTS playback
   */
  async sendMessageToAvatar(
    params: SendMessageParams
  ): Promise<SendMessageResult> {
    const config = heygenConfig.getConfig();

    this.logger.info('[HeyGen Service] Sending message to avatar', {
      sessionId: params.sessionId,
      textLength: params.text.length,
    });

    try {
      // Call HeyGen API to send message
      const response = await this.makeRequest<any>(
        'POST',
        '/v1/streaming.task',
        {
          session_id: params.sessionId,
          text: params.text,
          task_type: 'talk',
        }
      );

      const result: SendMessageResult = {
        sessionId: params.sessionId,
        messageId: response.data?.task_id || response.task_id || `msg_${Date.now()}`,
        status: this.mapStatus(response.data?.status || response.status),
        timestamp: new Date().toISOString(),
        metadata: params.metadata,
      };

      this.logger.info('[HeyGen Service] Message sent successfully', {
        sessionId: result.sessionId,
        messageId: result.messageId,
      });

      return result;
    } catch (error) {
      this.logger.error('[HeyGen Service] Failed to send message', {
        error: error instanceof Error ? error.message : String(error),
        sessionId: params.sessionId,
      });
      throw this.handleError(error, 'Failed to send message to avatar');
    }
  }

  /**
   * End an interactive avatar session
   */
  async endInteractiveAvatarSession(sessionId: string): Promise<EndSessionResult> {
    const config = heygenConfig.getConfig();

    this.logger.info('[HeyGen Service] Ending session', { sessionId });

    try {
      const response = await this.makeRequest<any>(
        'POST',
        '/v1/streaming.stop',
        {
          session_id: sessionId,
        }
      );

      this.logger.info('[HeyGen Service] Session ended successfully', {
        sessionId,
      });

      return {
        sessionId,
        success: true,
        message: 'Session ended successfully',
      };
    } catch (error) {
      this.logger.error('[HeyGen Service] Failed to end session', {
        error: error instanceof Error ? error.message : String(error),
        sessionId,
      });

      // Don't throw on cleanup errors, just return failure
      return {
        sessionId,
        success: false,
        message: 'Failed to end session gracefully',
      };
    }
  }

  // ==========================================================================
  // PRIVATE HELPER METHODS
  // ==========================================================================

  /**
   * Make authenticated HTTP request to HeyGen API
   */
  private async makeRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    body?: any
  ): Promise<T> {
    const config = heygenConfig.getConfig();
    const url = `${config.baseUrl}${endpoint}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': config.apiKey,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }

        throw new Error(
          `HeyGen API error (${response.status}): ${errorData.message || errorText}`
        );
      }

      const data = await response.json();
      return data as T;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`HeyGen API request timed out after ${config.timeoutMs}ms`);
      }

      throw error;
    }
  }

  /**
   * Map HeyGen status to our internal status
   */
  private mapStatus(heygenStatus?: string): SendMessageResult['status'] {
    switch (heygenStatus?.toLowerCase()) {
      case 'queued':
      case 'pending':
        return 'queued';
      case 'processing':
      case 'running':
        return 'processing';
      case 'completed':
      case 'success':
        return 'completed';
      case 'failed':
      case 'error':
        return 'failed';
      default:
        return 'queued';
    }
  }

  /**
   * Handle and normalize errors
   */
  private handleError(error: unknown, context: string): Error {
    if (error instanceof Error) {
      return new Error(`${context}: ${error.message}`);
    }
    return new Error(`${context}: ${String(error)}`);
  }
}

// Export singleton instance
export const heygenService = new HeygenService();
