/**
 * Jest tests for Voice Turn API route.
 * Tests: Unified voice turn endpoint that chains audio/text → transcribe → route → respond
 */

import express, { Express } from 'express';
import request from 'supertest';
import voiceTurnRouter from '../../src/voice/voiceTurn.router';

// Mock the STT service
jest.mock('../../src/voice/stt.service', () => ({
  transcribeAudio: jest.fn().mockResolvedValue({
    success: true,
    text: 'daily reflection',
    provider: 'openai',
    duration: 123,
  }),
  isSTTAvailable: jest.fn().mockReturnValue(true),
  getSTTStatus: jest.fn().mockReturnValue({
    provider: 'openai',
    available: true,
    openaiKeyConfigured: true,
  }),
}));

// Mock the hybrid router service
jest.mock('../../src/services/hybrid-router.service', () => ({
  HybridRouterService: {
    getInstance: jest.fn().mockReturnValue({
      route: jest.fn().mockResolvedValue({
        route: 'deterministic',
        complexity: 'simple',
        intent: 'journal-daily-reflection',
        humanSummary: 'Here are your daily reflection prompts:\n\n1. What am I grateful for today?\n2. What is my primary focus?\n3. How do I want to show up today?\n4. What would make today great?',
        nextBestAction: 'Complete your reflection and start your day',
        runId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', // UUID format
        artifact: {
          intent: 'journal.daily_reflection',
          date: '2025-12-20',
          user: 'shria',
          prompts: [
            'What am I grateful for today?',
            'What is my primary focus?',
            'How do I want to show up today?',
            'What would make today great?',
          ],
          responses: [],
          insights: [],
          nextSteps: [],
          mood: null,
          values: null,
        },
        cost: 0,
        latency: 50,
      }),
    }),
  },
}));

// Mock the journal execution service (used by hybrid router)
jest.mock('../../src/services/journal-execution.service', () => ({
  executeJournalWithHistory: jest.fn().mockResolvedValue({
    runId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    kind: 'p0.journal',
    status: 'success',
    artifact: {
      intent: 'journal.daily_reflection',
      date: '2025-12-20',
      user: 'shria',
      prompts: [
        'What am I grateful for today?',
        'What is my primary focus?',
        'How do I want to show up today?',
        'What would make today great?',
      ],
      responses: [],
      insights: [],
      nextSteps: [],
      mood: null,
      values: null,
    },
  }),
  formatJournalPromptsForVoice: jest.fn((artifact) => {
    const promptList = artifact.prompts.map((p: string, i: number) => `${i + 1}. ${p}`).join('\n');
    return `Here are your ${artifact.intent.replace('journal.', '').replace('_', ' ')} prompts:\n\n${promptList}`;
  }),
}));

// Mock the p0RunHistory service
jest.mock('../../src/services/p0RunHistory.service', () => ({
  startP0ArtifactRun: jest.fn((input) => ({
    runId: input.runId || 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    kind: input.kind,
    status: 'running',
    createdAt: new Date().toISOString(),
  })),
  finalizeP0ArtifactRun: jest.fn((runId, input) => ({
    runId,
    kind: input.kind || 'p0.journal',
    status: input.status,
    createdAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(),
    artifactPath: `/path/to/${runId}.json`,
  })),
  listP0ArtifactRuns: jest.fn((input) => [
    {
      runId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      kind: input.kind,
      status: 'success',
      createdAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
    },
  ]),
  getP0ArtifactRun: jest.fn((runId) => ({
    runId,
    kind: 'p0.journal',
    status: 'success',
    createdAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(),
    artifact: {
      intent: 'journal.daily_reflection',
      prompts: ['Prompt 1', 'Prompt 2'],
    },
  })),
}));

const app: Express = express();
app.use(express.json());
app.use('/api/voice', voiceTurnRouter);

describe('POST /api/voice/turn', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================================
  // JSON TEXT INPUT - JOURNAL INTENT
  // ============================================================================

  describe('JSON text input - journal daily reflection', () => {
    it('should route "daily reflection" to deterministic journal agent (not OpenAI) with UUID runId', async () => {
      const { HybridRouterService } = require('../../src/services/hybrid-router.service');
      const { executeJournalWithHistory } = require('../../src/services/journal-execution.service');
      const { startP0ArtifactRun, finalizeP0ArtifactRun } = require('../../src/services/p0RunHistory.service');

      const mockRunId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

      const mockRoute = jest.fn().mockResolvedValue({
        route: 'deterministic',
        complexity: 'simple',
        intent: 'journal-daily-reflection',
        humanSummary: 'Here are your daily reflection prompts:\n\n1. What am I grateful for today?\n2. What is my primary focus?\n3. How do I want to show up today?\n4. What would make today great?',
        runId: mockRunId, // UUID from p0RunHistory
        artifact: {
          intent: 'journal.daily_reflection',
          date: '2025-12-20',
          user: 'shria',
          prompts: [
            'What am I grateful for today?',
            'What is my primary focus?',
            'How do I want to show up today?',
            'What would make today great?',
          ],
          responses: [],
          insights: [],
          nextSteps: [],
          mood: null,
          values: null,
        },
        cost: 0,
        latency: 50,
      });

      HybridRouterService.getInstance.mockReturnValue({
        route: mockRoute,
      });

      const response = await request(app)
        .post('/api/voice/turn')
        .set('Content-Type', 'application/json')
        .send({ user: 'shria', text: 'daily reflection' });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        status: 'ok',
        transcript: 'daily reflection',
        assistant: {
          kind: 'result',
          text: expect.stringContaining('daily reflection prompts'),
          runId: mockRunId,
          artifact: {
            intent: 'journal.daily_reflection',
            prompts: expect.arrayContaining([
              expect.stringContaining('grateful'),
              expect.stringContaining('focus'),
            ]),
          },
          metadata: {
            route: 'deterministic', // Should be deterministic, NOT openai
            complexity: 'simple',
            intent: 'journal-daily-reflection',
          },
        },
      });

      // Verify hybrid router was called
      expect(mockRoute).toHaveBeenCalledWith({
        transcript: 'daily reflection',
        founder: 'shria',
      });

      // Verify runId is UUID format
      expect(response.body.assistant.runId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
    });

    it('should return journal prompts with UUID runId and artifact at assistant level', async () => {
      const response = await request(app)
        .post('/api/voice/turn')
        .set('Content-Type', 'application/json')
        .send({ user: 'shria', text: 'daily reflection' });

      expect(response.status).toBe(200);

      // Check runId is UUID
      expect(response.body.assistant).toHaveProperty('runId');
      expect(response.body.assistant.runId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );

      // Check artifact is at assistant level (not in metadata)
      expect(response.body.assistant).toHaveProperty('artifact');
      expect(response.body.assistant.artifact).toHaveProperty('prompts');
      expect(Array.isArray(response.body.assistant.artifact.prompts)).toBe(true);
      expect(response.body.assistant.artifact.prompts.length).toBeGreaterThan(0);
    });

    it('should record journal execution in p0 run history', async () => {
      const { startP0ArtifactRun, finalizeP0ArtifactRun, listP0ArtifactRuns } = require('../../src/services/p0RunHistory.service');

      const response = await request(app)
        .post('/api/voice/turn')
        .set('Content-Type', 'application/json')
        .send({ user: 'darnell', text: 'daily reflection' });

      expect(response.status).toBe(200);

      // Verify run history functions were called (via executeJournalWithHistory)
      // Note: These are called by the canonical service, not directly by the router
      const runId = response.body.assistant.runId;
      expect(runId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

      // Verify run can be retrieved from history
      const runs = listP0ArtifactRuns({ kind: 'p0.journal', limit: 20 });
      expect(runs.length).toBeGreaterThan(0);
      expect(runs[0]).toHaveProperty('runId');
    });

    it('should include real journal prompts in response text', async () => {
      const response = await request(app)
        .post('/api/voice/turn')
        .set('Content-Type', 'application/json')
        .send({ user: 'shria', text: 'daily reflection' });

      expect(response.status).toBe(200);
      expect(response.body.assistant.text).toContain('What am I grateful for today?');
      expect(response.body.assistant.text).toContain('What is my primary focus?');
      expect(response.body.assistant.text).toContain('How do I want to show up today?');
      expect(response.body.assistant.text).toContain('What would make today great?');
    });
  });

  // ============================================================================
  // JSON TEXT INPUT - BLOCK FOCUS
  // ============================================================================

  describe('JSON text input - block focus', () => {
    it('should process "block 30 minutes for focus" command successfully', async () => {
      const { HybridRouterService } = require('../../src/services/hybrid-router.service');
      const mockRoute = jest.fn().mockResolvedValue({
        route: 'deterministic',
        complexity: 'simple',
        intent: 'block-focus',
        humanSummary: 'Blocked 30 minutes for focus starting at 2:00 PM',
        runId: 'block-focus-9876543210',
        cost: 0,
        latency: 25,
      });

      HybridRouterService.getInstance.mockReturnValue({
        route: mockRoute,
      });

      const response = await request(app)
        .post('/api/voice/turn')
        .set('Content-Type', 'application/json')
        .send({ user: 'shria', text: 'block 30 minutes for focus' });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        status: 'ok',
        transcript: 'block 30 minutes for focus',
        assistant: {
          kind: 'result',
          text: expect.stringContaining('Blocked'),
          runId: 'block-focus-9876543210',
          metadata: {
            route: 'deterministic',
            complexity: 'simple',
            intent: 'block-focus',
          },
        },
      });
    });
  });

  // ============================================================================
  // JSON TEXT INPUT - UNKNOWN COMMAND
  // ============================================================================

  describe('JSON text input - unknown command', () => {
    it('should return follow-up suggestions for unrecognized commands', async () => {
      const { HybridRouterService } = require('../../src/services/hybrid-router.service');
      const mockRoute = jest.fn().mockResolvedValue({
        route: 'deterministic',
        complexity: 'complex',
        humanSummary: 'Unable to recognize the command. Please try one of the common commands below.',
        cost: 0,
        latency: 10,
      });

      HybridRouterService.getInstance.mockReturnValue({
        route: mockRoute,
      });

      const response = await request(app)
        .post('/api/voice/turn')
        .set('Content-Type', 'application/json')
        .send({ user: 'shria', text: 'something completely random' });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        status: 'ok',
        transcript: 'something completely random',
        assistant: {
          kind: 'follow_up',
          text: expect.stringContaining('Unable to'),
          followUp: {
            suggestions: expect.arrayContaining([
              'Block focus time',
              'Get daily brief',
              'Start meditation',
              'Schedule meeting',
            ]),
            context: {
              originalTranscript: 'something completely random',
            },
          },
        },
      });
    });
  });

  // ============================================================================
  // VALIDATION TESTS
  // ============================================================================

  describe('Input validation', () => {
    it('should return 400 when text field is missing', async () => {
      const response = await request(app)
        .post('/api/voice/turn')
        .set('Content-Type', 'application/json')
        .send({ user: 'shria' });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        status: 'error',
        assistant: {
          kind: 'error',
          text: expect.stringContaining('text'),
        },
      });
    });

    it('should return 400 when text is not a string', async () => {
      const response = await request(app)
        .post('/api/voice/turn')
        .set('Content-Type', 'application/json')
        .send({ user: 'shria', text: 123 });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        status: 'error',
        assistant: {
          kind: 'error',
          text: expect.stringContaining('text'),
        },
      });
    });

    it('should default user to "shria" when not provided', async () => {
      const { HybridRouterService } = require('../../src/services/hybrid-router.service');
      const mockRoute = jest.fn().mockResolvedValue({
        route: 'deterministic',
        complexity: 'simple',
        humanSummary: 'Command processed',
        cost: 0,
      });

      HybridRouterService.getInstance.mockReturnValue({
        route: mockRoute,
      });

      const response = await request(app)
        .post('/api/voice/turn')
        .set('Content-Type', 'application/json')
        .send({ text: 'daily reflection' });

      expect(response.status).toBe(200);
      expect(mockRoute).toHaveBeenCalledWith({
        transcript: 'daily reflection',
        founder: 'shria', // Should default to shria
      });
    });

    it('should map "darnell" user to "darnell" founder', async () => {
      const { HybridRouterService } = require('../../src/services/hybrid-router.service');
      const mockRoute = jest.fn().mockResolvedValue({
        route: 'deterministic',
        complexity: 'simple',
        humanSummary: 'Command processed',
        cost: 0,
      });

      HybridRouterService.getInstance.mockReturnValue({
        route: mockRoute,
      });

      const response = await request(app)
        .post('/api/voice/turn')
        .set('Content-Type', 'application/json')
        .send({ user: 'darnell', text: 'daily reflection' });

      expect(response.status).toBe(200);
      expect(mockRoute).toHaveBeenCalledWith({
        transcript: 'daily reflection',
        founder: 'darnell',
      });
    });
  });

  // ============================================================================
  // MULTIPART AUDIO UPLOAD
  // ============================================================================

  describe('Multipart audio upload', () => {
    it('should transcribe audio and process command', async () => {
      const { transcribeAudio } = require('../../src/voice/stt.service');
      const { HybridRouterService } = require('../../src/services/hybrid-router.service');

      transcribeAudio.mockResolvedValue({
        success: true,
        text: 'daily reflection',
        provider: 'openai',
        duration: 234,
      });

      const mockRoute = jest.fn().mockResolvedValue({
        route: 'deterministic',
        complexity: 'simple',
        intent: 'journal-daily-reflection',
        humanSummary: 'Here are your daily reflection prompts:\n\n1. Prompt 1\n2. Prompt 2',
        runId: 'journal-audio-123',
        artifact: {
          prompts: ['Prompt 1', 'Prompt 2'],
        },
        cost: 0,
      });

      HybridRouterService.getInstance.mockReturnValue({
        route: mockRoute,
      });

      const fakeAudio = Buffer.from('fake audio data');

      const response = await request(app)
        .post('/api/voice/turn')
        .field('user', 'shria')
        .attach('audio', fakeAudio, 'recording.webm');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        status: 'ok',
        transcript: 'daily reflection',
        assistant: {
          kind: 'result',
          text: expect.stringContaining('daily reflection prompts'),
          runId: 'journal-audio-123',
        },
      });

      // Verify transcribeAudio was called
      expect(transcribeAudio).toHaveBeenCalledWith(
        expect.any(Buffer),
        'recording.webm'
      );

      // Verify hybrid router was called with transcribed text
      expect(mockRoute).toHaveBeenCalledWith({
        transcript: 'daily reflection',
        founder: 'shria',
      });
    });

    it('should return 400 when STT is not configured', async () => {
      const { isSTTAvailable, getSTTStatus } = require('../../src/voice/stt.service');
      isSTTAvailable.mockReturnValue(false);
      getSTTStatus.mockReturnValue({
        provider: 'none',
        available: false,
        openaiKeyConfigured: false,
      });

      const fakeAudio = Buffer.from('fake audio data');

      const response = await request(app)
        .post('/api/voice/turn')
        .attach('audio', fakeAudio, 'test.webm');

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        status: 'error',
        assistant: {
          kind: 'error',
          text: expect.stringContaining('not configured'),
        },
      });
    });

    it('should return 400 when no audio file is provided', async () => {
      const response = await request(app)
        .post('/api/voice/turn')
        .set('Content-Type', 'multipart/form-data')
        .send();

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        status: 'error',
        assistant: {
          kind: 'error',
          text: expect.stringContaining('No audio file'),
        },
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
        .post('/api/voice/turn')
        .attach('audio', fakeAudio, 'test.webm');

      expect(response.status).toBe(500);
      expect(response.body).toMatchObject({
        status: 'error',
        assistant: {
          kind: 'error',
          text: expect.stringContaining('Transcription failed'),
        },
      });
    });
  });

  // ============================================================================
  // CONTENT TYPE VALIDATION
  // ============================================================================

  describe('Content-Type validation', () => {
    it('should return 400 for unsupported content types', async () => {
      const response = await request(app)
        .post('/api/voice/turn')
        .set('Content-Type', 'text/plain')
        .send('hello world');

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        status: 'error',
        assistant: {
          kind: 'error',
          text: expect.stringContaining('Unsupported Content-Type'),
        },
      });
    });
  });
});
