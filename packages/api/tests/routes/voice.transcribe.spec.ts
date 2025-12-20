/**
 * Jest tests for Voice Transcribe API routes.
 * Tests: JSON text input, multipart audio upload, STT provider handling
 */

import express, { Express } from 'express';
import request from 'supertest';
import transcribeRouter from '../../src/voice/transcribe.router';

// Mock the STT service
jest.mock('../../src/voice/stt.service', () => ({
  transcribeAudio: jest.fn().mockResolvedValue({
    success: true,
    text: 'This is a test transcription',
    provider: 'openai',
    duration: 123,
  }),
  isSTTAvailable: jest.fn().mockReturnValue(false), // Default: STT not available
  getSTTStatus: jest.fn().mockReturnValue({
    provider: 'none',
    available: false,
    openaiKeyConfigured: false,
  }),
  loadSTTConfig: jest.fn().mockReturnValue({
    provider: 'none',
    openaiApiKey: undefined,
  }),
}));

const app: Express = express();
app.use(express.json());
app.use('/api/voice', transcribeRouter);

describe('POST /api/voice/transcribe', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================================
  // JSON TEXT INPUT TESTS
  // ============================================================================

  describe('JSON text input (stub mode)', () => {
    it('should echo back text when provided as JSON', async () => {
      const response = await request(app)
        .post('/api/voice/transcribe')
        .set('Content-Type', 'application/json')
        .send({ text: 'hello world' });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        status: 'ok',
        text: 'hello world',
        provider: 'stub',
      });
    });

    it('should trim whitespace from text input', async () => {
      const response = await request(app)
        .post('/api/voice/transcribe')
        .set('Content-Type', 'application/json')
        .send({ text: '  hello world  ' });

      expect(response.status).toBe(200);
      expect(response.body.text).toBe('hello world');
    });

    it('should return 400 when text field is missing', async () => {
      const response = await request(app)
        .post('/api/voice/transcribe')
        .set('Content-Type', 'application/json')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        status: 'error',
        error: expect.stringContaining('text'),
      });
    });

    it('should return 400 when text field is not a string', async () => {
      const response = await request(app)
        .post('/api/voice/transcribe')
        .set('Content-Type', 'application/json')
        .send({ text: 123 });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        status: 'error',
        error: expect.stringContaining('text'),
      });
    });

    it('should return 400 when text is empty', async () => {
      const response = await request(app)
        .post('/api/voice/transcribe')
        .set('Content-Type', 'application/json')
        .send({ text: '' });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
    });
  });

  // ============================================================================
  // MULTIPART AUDIO UPLOAD TESTS
  // ============================================================================

  describe('Multipart audio upload', () => {
    it('should return 400 when STT is not configured and audio is uploaded', async () => {
      const { isSTTAvailable } = require('../../src/voice/stt.service');
      isSTTAvailable.mockReturnValue(false);

      // Create a fake audio file (empty buffer)
      const fakeAudio = Buffer.from('fake audio data');

      const response = await request(app)
        .post('/api/voice/transcribe')
        .attach('audio', fakeAudio, 'test.webm');

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        status: 'error',
        error: expect.stringContaining('not configured'),
        message: expect.stringContaining('STT_PROVIDER'),
      });
    });

    it('should transcribe audio when STT is configured', async () => {
      const { isSTTAvailable, transcribeAudio } = require('../../src/voice/stt.service');
      isSTTAvailable.mockReturnValue(true);
      transcribeAudio.mockResolvedValue({
        success: true,
        text: 'Block 45 minutes for focus',
        provider: 'openai',
        duration: 234,
      });

      // Create a fake audio file
      const fakeAudio = Buffer.from('fake audio data');

      const response = await request(app)
        .post('/api/voice/transcribe')
        .attach('audio', fakeAudio, 'recording.webm');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        status: 'ok',
        text: 'Block 45 minutes for focus',
        provider: 'openai',
      });

      // Verify transcribeAudio was called
      expect(transcribeAudio).toHaveBeenCalledWith(
        expect.any(Buffer),
        'recording.webm'
      );
    });

    it('should return 400 when no audio file is provided in multipart request', async () => {
      const response = await request(app)
        .post('/api/voice/transcribe')
        .set('Content-Type', 'multipart/form-data')
        .send();

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        status: 'error',
        error: expect.stringContaining('No audio file'),
      });
    });

    it('should return 500 when transcription fails', async () => {
      const { isSTTAvailable, transcribeAudio } = require('../../src/voice/stt.service');
      isSTTAvailable.mockReturnValue(true);
      transcribeAudio.mockResolvedValue({
        success: false,
        error: 'OpenAI API error',
        provider: 'openai',
      });

      const fakeAudio = Buffer.from('fake audio data');

      const response = await request(app)
        .post('/api/voice/transcribe')
        .attach('audio', fakeAudio, 'test.webm');

      expect(response.status).toBe(500);
      expect(response.body).toMatchObject({
        status: 'error',
        error: expect.stringContaining('OpenAI'),
      });
    });
  });

  // ============================================================================
  // CONTENT TYPE VALIDATION
  // ============================================================================

  describe('Content-Type validation', () => {
    it('should return 400 for unsupported content types', async () => {
      const response = await request(app)
        .post('/api/voice/transcribe')
        .set('Content-Type', 'text/plain')
        .send('hello world');

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        status: 'error',
        error: expect.stringContaining('Unsupported Content-Type'),
      });
    });
  });
});

// ============================================================================
// COMMAND ENDPOINT TESTS
// ============================================================================

describe('POST /api/voice/command', () => {
  it('should accept and acknowledge a command', async () => {
    const response = await request(app)
      .post('/api/voice/command')
      .set('Content-Type', 'application/json')
      .send({
        user: 'shria',
        text: 'block 45 minutes for focus',
      });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      status: 'ok',
      message: expect.any(String),
      text: 'block 45 minutes for focus',
      user: 'shria',
    });
  });

  it('should return 400 when text is missing', async () => {
    const response = await request(app)
      .post('/api/voice/command')
      .set('Content-Type', 'application/json')
      .send({ user: 'shria' });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      status: 'error',
      error: expect.stringContaining('text'),
    });
  });

  it('should default user to "unknown" when not provided', async () => {
    const response = await request(app)
      .post('/api/voice/command')
      .set('Content-Type', 'application/json')
      .send({ text: 'block time' });

    expect(response.status).toBe(200);
    expect(response.body.user).toBe('unknown');
  });
});

// ============================================================================
// STATUS ENDPOINT TESTS
// ============================================================================

describe('GET /api/voice/transcribe/status', () => {
  it('should return STT configuration status', async () => {
    const response = await request(app).get('/api/voice/transcribe/status');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      status: 'ok',
      provider: expect.any(String),
      available: expect.any(Boolean),
      openaiKeyConfigured: expect.any(Boolean),
    });
  });
});
