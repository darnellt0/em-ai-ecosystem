import express, { Express } from 'express';
import request from 'supertest';
import transcribeRouter from '../../src/voice/transcribe.router';
import voiceCommandRouter from '../../src/routes/voiceCommand.router';

jest.mock('../../src/services/journal.service', () => ({
  runJournalAgent: jest.fn().mockResolvedValue({
    intent: 'journal.daily_reflection',
    date: '2025-01-01',
    user: 'darnell',
    prompts: ['Prompt'],
    responses: [{ question: 'Prompt', answer: 'Answer' }],
    insights: ['Insight'],
    nextSteps: ['Next'],
    mood: 'focused',
    values: ['growth'],
  }),
}));

jest.mock('../../src/services/p0RunHistory.service', () => ({
  startP0ArtifactRun: jest.fn().mockReturnValue({
    runId: 'test-run-id-123',
    kind: 'p0.journal',
    status: 'running',
    createdAt: new Date().toISOString(),
  }),
  finalizeP0ArtifactRun: jest.fn().mockReturnValue({
    runId: 'test-run-id-123',
    kind: 'p0.journal',
    status: 'success',
    createdAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(),
  }),
  listP0ArtifactRuns: jest.fn().mockReturnValue([]),
}));

const app: Express = express();
app.use(express.json());
app.use('/api/voice', transcribeRouter);
app.use('/api/voice', voiceCommandRouter);

describe('Voice transcribe to command flow', () => {
  beforeAll(() => {
    process.env.REDIS_URL = '';
  });

  it('transcribes JSON text then runs a turn', async () => {
    const transcribe = await request(app)
      .post('/api/voice/transcribe')
      .send({ text: 'Daily reflection' });

    expect(transcribe.status).toBe(200);
    expect(transcribe.body.text).toBe('Daily reflection');

    const command = await request(app)
      .post('/api/voice/turn')
      .send({ user: 'darnell', text: transcribe.body.text });

    expect(command.status).toBe(200);
    expect(command.body.assistant.kind).toBe('journal.daily_reflection');
    expect(command.body.assistant.runId).toBe('test-run-id-123');
  });
});
