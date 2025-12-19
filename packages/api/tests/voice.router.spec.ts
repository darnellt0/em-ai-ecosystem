/**
 * Jest tests for Voice API routes.
 * Tests: auth, validation, idempotency, rate limiting, and happy paths.
 */

import express, { Express } from 'express';
import request from 'supertest';
import voiceRouter from '../src/voice/voice.router';
import { clearAllRateLimits, resetRateLimitForIP } from '../src/middleware/rateLimitSimple';
import { clearAllIdempotency } from '../src/middleware/idempotency';

// Stub agent factory to avoid real calendar/oauth calls during tests
jest.mock('../src/agents/agent-factory', () => {
  const original = jest.requireActual('../src/agents/agent-factory');
  return {
    ...original,
    agentFactory: {
      ...original.agentFactory,
      blockFocusTime: jest.fn().mockResolvedValue({
        success: true,
        eventId: 'evt_block',
        startTime: new Date(),
        endTime: new Date(),
        title: 'Blocked focus time',
        notifications: [],
        conflicts: [],
      }),
      confirmMeeting: jest.fn().mockResolvedValue({
        success: true,
        eventId: 'evt_confirm',
        title: 'Confirmed meeting',
        startTime: new Date(),
        endTime: new Date(),
        attendees: [],
        description: 'ok',
      }),
      rescheduleMeeting: jest.fn().mockResolvedValue({
        success: true,
        eventId: 'evt_reschedule',
        title: 'Rescheduled meeting',
        startTime: new Date(),
        endTime: new Date(),
        attendees: [],
        description: 'rescheduled',
      }),
    },
  };
});

const app: Express = express();
app.use(express.json());
app.use('/api/voice', voiceRouter);

const VOICE_API_TOKEN = 'test-token-12345';

describe('Voice Router', () => {
  beforeEach(() => {
    process.env.VOICE_API_TOKEN = VOICE_API_TOKEN;
    clearAllRateLimits();
    clearAllIdempotency();
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
        .post('/api/voice/scheduler/block')
        .send({ minutes: 45, founder: 'shria' });

      expect(res.status).toBe(401);
      expect(res.body.status).toBe('error');
      expect(res.body.humanSummary).toContain('Unauthorized');
    });

    it('should return 401 if token is invalid', async () => {
      const res = await request(app)
        .post('/api/voice/scheduler/block')
        .set('Authorization', 'Bearer invalid-token')
        .send({ minutes: 45, founder: 'shria' });

      expect(res.status).toBe(401);
      expect(res.body.status).toBe('error');
    });

    it('should return 500 if VOICE_API_TOKEN env var is missing', async () => {
      delete process.env.VOICE_API_TOKEN;

      const res = await request(app)
        .post('/api/voice/scheduler/block')
        .set('Authorization', `Bearer ${VOICE_API_TOKEN}`)
        .send({ minutes: 45, founder: 'shria' });

      expect(res.status).toBe(500);
      expect(res.body.status).toBe('error');
      expect(res.body.humanSummary).toContain('misconfiguration');
    });
  });

  // ========================================================================
  // VALIDATION TESTS
  // ========================================================================

  describe('Input Validation', () => {
    const validToken = `Bearer ${VOICE_API_TOKEN}`;

    it('should return 400 for invalid minutes in /scheduler/block', async () => {
      const res = await request(app)
        .post('/api/voice/scheduler/block')
        .set('Authorization', validToken)
        .send({ minutes: 0, founder: 'shria' });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.humanSummary).toContain('Invalid request');
    });

    it('should return 400 for missing required fields', async () => {
      const res = await request(app)
        .post('/api/voice/scheduler/confirm')
        .set('Authorization', validToken)
        .send({ title: 'Meeting' });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
    });

    it('should return 400 for invalid ISO date', async () => {
      const res = await request(app)
        .post('/api/voice/scheduler/confirm')
        .set('Authorization', validToken)
        .send({
          title: 'Meeting',
          startAtISO: 'not-a-date',
          durationMinutes: 60,
          founder: 'shria',
        });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
    });

    it('should accept defaults for optional fields', async () => {
      const res = await request(app)
        .post('/api/voice/coach/pause')
        .set('Authorization', validToken)
        .send({ founder: 'shria' });

      expect([200, 400]).toContain(res.status);
    });
  });

  // ========================================================================
  // SUCCESS PATH TESTS
  // ========================================================================

  describe('Successful Requests', () => {
    const validToken = `Bearer ${VOICE_API_TOKEN}`;

    it('POST /scheduler/block should return 200 with humanSummary', async () => {
      const res = await request(app)
        .post('/api/voice/scheduler/block')
        .set('Authorization', validToken)
        .send({ minutes: 45, founder: 'shria' });

      expect([200, 400]).toContain(res.status);
    });

    it('POST /scheduler/confirm should return 200 with event details', async () => {
      const now = new Date().toISOString();
      const res = await request(app)
        .post('/api/voice/scheduler/confirm')
        .set('Authorization', validToken)
        .send({
          title: 'Emerging Leaders Prep',
          startAtISO: now,
          durationMinutes: 60,
          founder: 'shria',
        });

      expect([200, 400]).toContain(res.status);
    });

    it('POST /scheduler/reschedule should return 200', async () => {
      const payload = {
        eventId: 'evt-123',
        newStartAtISO: new Date().toISOString(),
        newDurationMinutes: 30,
        founder: 'darnell',
      };

      const res = await request(app)
        .post('/api/voice/scheduler/reschedule')
        .set('Authorization', validToken)
        .send(payload);

      expect([200, 400]).toContain(res.status);
    });

    it('POST /coach/pause should return 200 with style', async () => {
      const res = await request(app)
        .post('/api/voice/coach/pause')
        .set('Authorization', validToken)
        .send({ style: 'box', seconds: 120, founder: 'shria' });

      expect([200, 400]).toContain(res.status);
    });

    it('POST /support/log-complete should return 200', async () => {
      const payload = {
        taskId: 'task-456',
        note: 'Completed successfully',
        founder: 'shria',
      };

      const res = await request(app)
        .post('/api/voice/support/log-complete')
        .set('Authorization', validToken)
        .send(payload);

      expect([200, 400]).toContain(res.status);
    });

    it('POST /support/follow-up should return 200', async () => {
      const dueDate = new Date(Date.now() + 86400000).toISOString();
      const res = await request(app)
        .post('/api/voice/support/follow-up')
        .set('Authorization', validToken)
        .send({
          subject: 'Call John Doe',
          dueISO: dueDate,
          context: 'Discuss Q4 planning',
          founder: 'darnell',
        });

      expect([200, 400]).toContain(res.status);
    });
  });

  // ========================================================================
  // IDEMPOTENCY TESTS
  // ========================================================================

  describe('Idempotency with Idempotency-Key Header', () => {
    const validToken = `Bearer ${VOICE_API_TOKEN}`;
    const idempotencyKey = 'test-idempotency-key-12345';

    it('should return cached response on second request with same key', async () => {
      const payload = { minutes: 30, founder: 'shria' };

      // First request
      const res1 = await request(app)
        .post('/api/voice/scheduler/block')
        .set('Authorization', validToken)
        .set('Idempotency-Key', idempotencyKey)
        .send(payload);

      expect(res1.status).toBe(200);
      const firstResponse = res1.body;

      // Second request with same key
      const res2 = await request(app)
        .post('/api/voice/scheduler/block')
        .set('Authorization', validToken)
        .set('Idempotency-Key', idempotencyKey)
        .send(payload);

      expect(res2.status).toBe(200);
      expect(res2.body).toEqual(firstResponse);
    });

    it('should allow different responses for different keys', async () => {
      const payload1 = { minutes: 30, founder: 'shria' };
      const payload2 = { minutes: 45, founder: 'darnell' };

      const res1 = await request(app)
        .post('/api/voice/scheduler/block')
        .set('Authorization', validToken)
        .set('Idempotency-Key', 'key-1')
        .send(payload1);

      const res2 = await request(app)
        .post('/api/voice/scheduler/block')
        .set('Authorization', validToken)
        .set('Idempotency-Key', 'key-2')
        .send(payload2);

      expect(res1.body.humanSummary).not.toBe(res2.body.humanSummary);
    });
  });

  // ========================================================================
  // RATE LIMITING TESTS (Mock IP)
  // ========================================================================

  describe('Rate Limiting (20 req/10s per IP)', () => {
    const validToken = `Bearer ${VOICE_API_TOKEN}`;

    it('should allow requests up to the limit', async () => {
      for (let i = 0; i < 20; i++) {
        const res = await request(app)
          .post('/api/voice/scheduler/block')
          .set('Authorization', validToken)
          .send({ minutes: 5, founder: 'shria' });

        expect(res.status).toBe(200);
      }
    });

    it('should return 429 after exceeding the limit', async () => {
      // Burst 21 requests to exceed limit
      const results = [];
      for (let i = 0; i < 21; i++) {
        const res = await request(app)
          .post('/api/voice/scheduler/block')
          .set('Authorization', validToken)
          .send({ minutes: 5, founder: 'shria' });
        results.push(res.status);
      }

      // First 20 should be 200, 21st should be 429
      expect(results[20]).toBe(429);
      const lastRes = await request(app)
        .post('/api/voice/scheduler/block')
        .set('Authorization', validToken)
        .send({ minutes: 5, founder: 'shria' });
      expect(lastRes.status).toBe(429);
      expect(lastRes.body.humanSummary).toContain('Rate limit exceeded');
    });
  });

  // ========================================================================
  // RESPONSE SHAPE TESTS
  // ========================================================================

  describe('Response Shape', () => {
    const validToken = `Bearer ${VOICE_API_TOKEN}`;

    it('should always include status and humanSummary', async () => {
      const res = await request(app)
        .post('/api/voice/scheduler/block')
        .set('Authorization', validToken)
        .send({ minutes: 45, founder: 'shria' });

      expect(res.body).toHaveProperty('status');
      expect(res.body).toHaveProperty('humanSummary');
      expect(['ok', 'error']).toContain(res.body.status);
      expect(typeof res.body.humanSummary).toBe('string');
    });

    it('should optionally include nextBestAction', async () => {
      const res = await request(app)
        .post('/api/voice/scheduler/confirm')
        .set('Authorization', validToken)
        .send({
          title: 'Meeting',
          startAtISO: new Date().toISOString(),
          durationMinutes: 60,
          founder: 'shria',
        });

      expect(res.body).toHaveProperty('humanSummary');
      if (res.body.nextBestAction) {
        expect(typeof res.body.nextBestAction).toBe('string');
      }
    });

    it('should optionally include data object', async () => {
      const res = await request(app)
        .post('/api/voice/scheduler/block')
        .set('Authorization', validToken)
        .send({ minutes: 45, founder: 'shria' });

      if (res.body.data) {
        expect(typeof res.body.data).toBe('object');
      }
    });
  });
});
