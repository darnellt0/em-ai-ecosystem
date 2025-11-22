/**
 * Jest tests for HeyGen Service
 * Tests session management, message sending, and error handling
 */

import { HeygenService } from '../src/services/heygen.service';
import { heygenConfig } from '../src/config/heygen.config';

// Mock the config module
jest.mock('../src/config/heygen.config', () => ({
  heygenConfig: {
    getConfig: jest.fn(),
    isReady: jest.fn(),
  },
}));

// Mock global fetch
global.fetch = jest.fn();

describe('HeygenService', () => {
  let service: HeygenService;
  const mockConfig = {
    apiKey: 'test-api-key',
    baseUrl: 'https://api.heygen.test',
    timeoutMs: 5000,
  };

  beforeEach(() => {
    service = new HeygenService();
    (heygenConfig.getConfig as jest.Mock).mockReturnValue(mockConfig);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  // ========================================================================
  // START SESSION TESTS
  // ========================================================================

  describe('startInteractiveAvatarSession', () => {
    it('should successfully start a session', async () => {
      const mockResponse = {
        data: {
          session_id: 'session-123',
          stream_url: 'https://stream.heygen.test/session-123',
          access_token: 'token-abc',
          expires_at: '2025-12-31T23:59:59Z',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await service.startInteractiveAvatarSession({
        avatarId: 'avatar-456',
        voiceId: 'voice-789',
      });

      expect(result.sessionId).toBe('session-123');
      expect(result.streamUrl).toBe('https://stream.heygen.test/session-123');
      expect(result.widgetToken).toBe('token-abc');
      expect(result.expiresAt).toBe('2025-12-31T23:59:59Z');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.heygen.test/v1/streaming.new',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Api-Key': 'test-api-key',
          }),
          body: expect.stringContaining('avatar-456'),
        })
      );
    });

    it('should handle API errors during session start', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => JSON.stringify({ message: 'Invalid avatar ID' }),
      });

      await expect(
        service.startInteractiveAvatarSession({
          avatarId: 'invalid-avatar',
        })
      ).rejects.toThrow('Failed to start interactive avatar session');
    });

    it('should handle network timeouts', async () => {
      (global.fetch as jest.Mock).mockImplementationOnce(
        () =>
          new Promise((_, reject) => {
            const error = new Error('Timeout');
            error.name = 'AbortError';
            reject(error);
          })
      );

      await expect(
        service.startInteractiveAvatarSession({
          avatarId: 'avatar-123',
        })
      ).rejects.toThrow();
    });

    it('should include optional parameters in request', async () => {
      const mockResponse = {
        session_id: 'session-123',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await service.startInteractiveAvatarSession({
        avatarId: 'avatar-456',
        voiceId: 'voice-789',
        language: 'es',
        quality: 'high',
      });

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);

      expect(body.avatar_id).toBe('avatar-456');
      expect(body.voice_id).toBe('voice-789');
      expect(body.language).toBe('es');
      expect(body.quality).toBe('high');
    });
  });

  // ========================================================================
  // SEND MESSAGE TESTS
  // ========================================================================

  describe('sendMessageToAvatar', () => {
    it('should successfully send a message', async () => {
      const mockResponse = {
        data: {
          task_id: 'task-123',
          status: 'queued',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await service.sendMessageToAvatar({
        sessionId: 'session-456',
        text: 'Hello, this is a test message.',
      });

      expect(result.sessionId).toBe('session-456');
      expect(result.messageId).toBe('task-123');
      expect(result.status).toBe('queued');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.heygen.test/v1/streaming.task',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Hello, this is a test message'),
        })
      );
    });

    it('should handle message send errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => JSON.stringify({ message: 'Session not found' }),
      });

      await expect(
        service.sendMessageToAvatar({
          sessionId: 'invalid-session',
          text: 'Test message',
        })
      ).rejects.toThrow('Failed to send message to avatar');
    });

    it('should map HeyGen status correctly', async () => {
      const testCases = [
        { heygenStatus: 'pending', expectedStatus: 'queued' },
        { heygenStatus: 'running', expectedStatus: 'processing' },
        { heygenStatus: 'success', expectedStatus: 'completed' },
        { heygenStatus: 'error', expectedStatus: 'failed' },
      ];

      for (const testCase of testCases) {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            task_id: 'task-123',
            status: testCase.heygenStatus,
          }),
        });

        const result = await service.sendMessageToAvatar({
          sessionId: 'session-123',
          text: 'Test',
        });

        expect(result.status).toBe(testCase.expectedStatus);
      }
    });

    it('should include metadata in message', async () => {
      const mockResponse = {
        task_id: 'task-123',
        status: 'queued',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const metadata = { conversationId: 'conv-456', agentName: 'test-agent' };

      await service.sendMessageToAvatar({
        sessionId: 'session-123',
        text: 'Test message',
        metadata,
      });

      // Metadata is stored in result but not sent to HeyGen API
      // (it's for internal tracking)
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  // ========================================================================
  // END SESSION TESTS
  // ========================================================================

  describe('endInteractiveAvatarSession', () => {
    it('should successfully end a session', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const result = await service.endInteractiveAvatarSession('session-123');

      expect(result.success).toBe(true);
      expect(result.sessionId).toBe('session-123');
      expect(result.message).toBe('Session ended successfully');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.heygen.test/v1/streaming.stop',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('session-123'),
        })
      );
    });

    it('should handle end session errors gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal server error',
      });

      const result = await service.endInteractiveAvatarSession('session-123');

      expect(result.success).toBe(false);
      expect(result.sessionId).toBe('session-123');
      expect(result.message).toBe('Failed to end session gracefully');
    });

    it('should not throw on end session failure', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(
        service.endInteractiveAvatarSession('session-123')
      ).resolves.toMatchObject({
        success: false,
        sessionId: 'session-123',
      });
    });
  });

  // ========================================================================
  // ERROR HANDLING TESTS
  // ========================================================================

  describe('Error Handling', () => {
    it('should handle malformed JSON responses', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Not valid JSON',
      });

      await expect(
        service.startInteractiveAvatarSession({
          avatarId: 'avatar-123',
        })
      ).rejects.toThrow();
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network failure'));

      await expect(
        service.startInteractiveAvatarSession({
          avatarId: 'avatar-123',
        })
      ).rejects.toThrow();
    });

    it('should handle missing config', async () => {
      (heygenConfig.getConfig as jest.Mock).mockImplementationOnce(() => {
        throw new Error('HeyGen is not configured');
      });

      await expect(
        service.startInteractiveAvatarSession({
          avatarId: 'avatar-123',
        })
      ).rejects.toThrow('HeyGen is not configured');
    });
  });
});
