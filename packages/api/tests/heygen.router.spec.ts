/**
 * Jest tests for HeyGen Router
 * Tests: auth, validation, config checking, and happy paths
 */

import express, { Express } from 'express';
import request from 'supertest';
import heygenRouter from '../src/heygen/heygen.router';
import { clearAllRateLimits } from '../src/middleware/rateLimitSimple';
import { clearAllIdempotency } from '../src/middleware/idempotency';
import { heygenConfig } from '../src/config/heygen.config';
import { heygenService } from '../src/services/heygen.service';

// Mock dependencies
jest.mock('../src/config/heygen.config');
jest.mock('../src/services/heygen.service');

const app: Express = express();
app.use(express.json());
app.use('/api/heygen', heygenRouter);

const VOICE_API_TOKEN = 'test-token-12345';

describe('HeyGen Router', () => {
  beforeEach(() => {
    process.env.VOICE_API_TOKEN = VOICE_API_TOKEN;
    clearAllRateLimits();
    clearAllIdempotency();
    jest.clearAllMocks();

    // Default: HeyGen is configured
    (heygenConfig.isReady as jest.Mock).mockReturnValue(true);
    (heygenConfig.getStatus as jest.Mock).mockReturnValue({
      configured: true,
      baseUrl: 'https://api.heygen.test',
    });
  });

  afterEach(() => {
    delete process.env.VOICE_API_TOKEN;
  });

  // ========================================================================
  // AUTH TESTS
  // ========================================================================

  describe('Bearer Token Authentication', () => {
    it('should return 401 if Authorization header is missing', async () => {
      const res = await request(app)
        .post('/api/heygen/session')
        .send({ avatarId: 'avatar-123' });

      expect(res.status).toBe(401);
      expect(res.body.status).toBe('error');
    });

    it('should return 401 if token is invalid', async () => {
      const res = await request(app)
        .post('/api/heygen/session')
        .set('Authorization', 'Bearer invalid-token')
        .send({ avatarId: 'avatar-123' });

      expect(res.status).toBe(401);
      expect(res.body.status).toBe('error');
    });

    it('should accept valid bearer token', async () => {
      (heygenService.startInteractiveAvatarSession as jest.Mock).mockResolvedValueOnce({
        sessionId: 'session-123',
        streamUrl: 'https://stream.test',
      });

      const res = await request(app)
        .post('/api/heygen/session')
        .set('Authorization', `Bearer ${VOICE_API_TOKEN}`)
        .send({ avatarId: 'avatar-123' });

      expect(res.status).toBe(200);
    });
  });

  // ========================================================================
  // CONFIGURATION CHECK TESTS
  // ========================================================================

  describe('HeyGen Configuration Check', () => {
    it('should return 503 if HeyGen is not configured', async () => {
      (heygenConfig.isReady as jest.Mock).mockReturnValue(false);

      const res = await request(app)
        .post('/api/heygen/session')
        .set('Authorization', `Bearer ${VOICE_API_TOKEN}`)
        .send({ avatarId: 'avatar-123' });

      expect(res.status).toBe(503);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('not configured');
      expect(res.body.code).toBe('HEYGEN_NOT_CONFIGURED');
    });

    it('should allow requests when HeyGen is configured', async () => {
      (heygenConfig.isReady as jest.Mock).mockReturnValue(true);
      (heygenService.startInteractiveAvatarSession as jest.Mock).mockResolvedValueOnce({
        sessionId: 'session-123',
      });

      const res = await request(app)
        .post('/api/heygen/session')
        .set('Authorization', `Bearer ${VOICE_API_TOKEN}`)
        .send({ avatarId: 'avatar-123' });

      expect(res.status).toBe(200);
    });
  });

  // ========================================================================
  // VALIDATION TESTS
  // ========================================================================

  describe('Input Validation', () => {
    const validToken = `Bearer ${VOICE_API_TOKEN}`;

    it('should return 400 for missing avatarId in /session', async () => {
      const res = await request(app)
        .post('/api/heygen/session')
        .set('Authorization', validToken)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('avatarId');
    });

    it('should return 400 for empty avatarId', async () => {
      const res = await request(app)
        .post('/api/heygen/session')
        .set('Authorization', validToken)
        .send({ avatarId: '' });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for missing sessionId in /message', async () => {
      const res = await request(app)
        .post('/api/heygen/message')
        .set('Authorization', validToken)
        .send({ text: 'Hello' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('sessionId');
    });

    it('should return 400 for missing text in /message', async () => {
      const res = await request(app)
        .post('/api/heygen/message')
        .set('Authorization', validToken)
        .send({ sessionId: 'session-123' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('text');
    });

    it('should return 400 for text exceeding max length', async () => {
      const longText = 'a'.repeat(5001);

      const res = await request(app)
        .post('/api/heygen/message')
        .set('Authorization', validToken)
        .send({ sessionId: 'session-123', text: longText });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('too long');
    });

    it('should accept valid quality values', async () => {
      (heygenService.startInteractiveAvatarSession as jest.Mock).mockResolvedValueOnce({
        sessionId: 'session-123',
      });

      const res = await request(app)
        .post('/api/heygen/session')
        .set('Authorization', validToken)
        .send({ avatarId: 'avatar-123', quality: 'high' });

      expect(res.status).toBe(200);
    });

    it('should reject invalid quality values', async () => {
      const res = await request(app)
        .post('/api/heygen/session')
        .set('Authorization', validToken)
        .send({ avatarId: 'avatar-123', quality: 'ultra' });

      expect(res.status).toBe(400);
    });
  });

  // ========================================================================
  // ENDPOINT: POST /api/heygen/session
  // ========================================================================

  describe('POST /api/heygen/session', () => {
    const validToken = `Bearer ${VOICE_API_TOKEN}`;

    it('should successfully start a session', async () => {
      const mockServiceResponse = {
        sessionId: 'session-abc123',
        streamUrl: 'https://stream.heygen.test/session-abc123',
        widgetToken: 'widget-token-xyz',
        expiresAt: '2025-12-31T23:59:59Z',
      };

      (heygenService.startInteractiveAvatarSession as jest.Mock).mockResolvedValueOnce(
        mockServiceResponse
      );

      const res = await request(app)
        .post('/api/heygen/session')
        .set('Authorization', validToken)
        .send({
          avatarId: 'avatar-456',
          voiceId: 'voice-789',
          language: 'en',
        });

      expect(res.status).toBe(200);
      expect(res.body.sessionId).toBe('session-abc123');
      expect(res.body.streamUrl).toBe('https://stream.heygen.test/session-abc123');
      expect(res.body.widgetToken).toBe('widget-token-xyz');
      expect(res.body.expiresAt).toBe('2025-12-31T23:59:59Z');

      expect(heygenService.startInteractiveAvatarSession).toHaveBeenCalledWith({
        avatarId: 'avatar-456',
        voiceId: 'voice-789',
        userId: undefined,
        language: 'en',
        quality: undefined,
      });
    });

    it('should handle service errors', async () => {
      (heygenService.startInteractiveAvatarSession as jest.Mock).mockRejectedValueOnce(
        new Error('HeyGen API error')
      );

      const res = await request(app)
        .post('/api/heygen/session')
        .set('Authorization', validToken)
        .send({ avatarId: 'avatar-123' });

      expect(res.status).toBe(500);
      expect(res.body.status).toBe('error');
      expect(res.body.code).toBe('SESSION_START_FAILED');
    });
  });

  // ========================================================================
  // ENDPOINT: POST /api/heygen/message
  // ========================================================================

  describe('POST /api/heygen/message', () => {
    const validToken = `Bearer ${VOICE_API_TOKEN}`;

    it('should successfully send a message', async () => {
      const mockServiceResponse = {
        sessionId: 'session-123',
        messageId: 'msg-456',
        status: 'queued' as const,
        timestamp: '2025-11-22T12:00:00Z',
      };

      (heygenService.sendMessageToAvatar as jest.Mock).mockResolvedValueOnce(
        mockServiceResponse
      );

      const res = await request(app)
        .post('/api/heygen/message')
        .set('Authorization', validToken)
        .send({
          sessionId: 'session-123',
          text: 'Hello from EM-AI!',
          userId: 'user-789',
        });

      expect(res.status).toBe(200);
      expect(res.body.sessionId).toBe('session-123');
      expect(res.body.messageId).toBe('msg-456');
      expect(res.body.status).toBe('queued');
      expect(res.body.timestamp).toBe('2025-11-22T12:00:00Z');

      expect(heygenService.sendMessageToAvatar).toHaveBeenCalledWith({
        sessionId: 'session-123',
        text: 'Hello from EM-AI!',
        userId: 'user-789',
        metadata: undefined,
      });
    });

    it('should include metadata when provided', async () => {
      const mockServiceResponse = {
        sessionId: 'session-123',
        messageId: 'msg-456',
        status: 'queued' as const,
        timestamp: '2025-11-22T12:00:00Z',
      };

      (heygenService.sendMessageToAvatar as jest.Mock).mockResolvedValueOnce(
        mockServiceResponse
      );

      const metadata = { conversationId: 'conv-123', agentName: 'test-agent' };

      const res = await request(app)
        .post('/api/heygen/message')
        .set('Authorization', validToken)
        .send({
          sessionId: 'session-123',
          text: 'Test message',
          metadata,
        });

      expect(res.status).toBe(200);
      expect(heygenService.sendMessageToAvatar).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata,
        })
      );
    });

    it('should handle service errors', async () => {
      (heygenService.sendMessageToAvatar as jest.Mock).mockRejectedValueOnce(
        new Error('Session not found')
      );

      const res = await request(app)
        .post('/api/heygen/message')
        .set('Authorization', validToken)
        .send({
          sessionId: 'invalid-session',
          text: 'Test message',
        });

      expect(res.status).toBe(500);
      expect(res.body.status).toBe('error');
      expect(res.body.code).toBe('MESSAGE_SEND_FAILED');
    });
  });

  // ========================================================================
  // ENDPOINT: POST /api/heygen/session/end
  // ========================================================================

  describe('POST /api/heygen/session/end', () => {
    const validToken = `Bearer ${VOICE_API_TOKEN}`;

    it('should successfully end a session', async () => {
      const mockServiceResponse = {
        sessionId: 'session-123',
        success: true,
        message: 'Session ended successfully',
      };

      (heygenService.endInteractiveAvatarSession as jest.Mock).mockResolvedValueOnce(
        mockServiceResponse
      );

      const res = await request(app)
        .post('/api/heygen/session/end')
        .set('Authorization', validToken)
        .send({ sessionId: 'session-123' });

      expect(res.status).toBe(200);
      expect(res.body.sessionId).toBe('session-123');
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Session ended successfully');

      expect(heygenService.endInteractiveAvatarSession).toHaveBeenCalledWith('session-123');
    });

    it('should return 400 for missing sessionId', async () => {
      const res = await request(app)
        .post('/api/heygen/session/end')
        .set('Authorization', validToken)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('sessionId');
    });

    it('should handle service errors', async () => {
      (heygenService.endInteractiveAvatarSession as jest.Mock).mockRejectedValueOnce(
        new Error('Failed to end session')
      );

      const res = await request(app)
        .post('/api/heygen/session/end')
        .set('Authorization', validToken)
        .send({ sessionId: 'session-123' });

      expect(res.status).toBe(500);
      expect(res.body.code).toBe('SESSION_END_FAILED');
    });
  });

  // ========================================================================
  // ENDPOINT: GET /api/heygen/status
  // ========================================================================

  describe('GET /api/heygen/status', () => {
    it('should return HeyGen status', async () => {
      (heygenConfig.getStatus as jest.Mock).mockReturnValue({
        configured: true,
        baseUrl: 'https://api.heygen.test',
      });

      const res = await request(app).get('/api/heygen/status');

      expect(res.status).toBe(200);
      expect(res.body.configured).toBe(true);
      expect(res.body.baseUrl).toBe('https://api.heygen.test');
    });

    it('should show warning when not configured', async () => {
      (heygenConfig.getStatus as jest.Mock).mockReturnValue({
        configured: false,
        warning: 'HeyGen not configured. Add HEYGEN_API_KEY to .env',
      });

      const res = await request(app).get('/api/heygen/status');

      expect(res.status).toBe(200);
      expect(res.body.configured).toBe(false);
      expect(res.body.warning).toBeDefined();
    });
  });
});
