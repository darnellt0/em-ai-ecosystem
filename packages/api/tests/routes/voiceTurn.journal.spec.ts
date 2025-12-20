import express, { Express } from 'express';
import request from 'supertest';
import fs from 'fs';
import os from 'os';
import path from 'path';

jest.mock('../../src/services/journal.service', () => ({
  runJournalAgent: jest.fn().mockResolvedValue({
    intent: 'journal.daily_reflection',
    date: '2025-01-01',
    user: 'darnell',
    prompts: ['Prompt one', 'Prompt two'],
    responses: [{ question: 'Prompt one', answer: 'Answer' }],
    insights: ['Insight'],
    nextSteps: ['Next'],
    mood: 'focused',
    values: ['growth'],
  }),
}));

describe('POST /api/voice/turn journal run history', () => {
  let app: Express;
  let runsDir = '';

  beforeAll(async () => {
    runsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'p0-journal-turn-'));
    process.env.P0_RUN_DATA_DIR = runsDir;
    process.env.REDIS_URL = '';

    jest.resetModules();
    const { default: voiceCommandRouter } = await import('../../src/routes/voiceCommand.router');
    const { default: emAiExecAdminRouter } = await import('../../src/routes/emAiExecAdmin.router');

    app = express();
    app.use(express.json());
    app.use('/api/voice', voiceCommandRouter);
    app.use('/', emAiExecAdminRouter);
  });

  afterAll(() => {
    if (runsDir && fs.existsSync(runsDir)) {
      fs.rmSync(runsDir, { recursive: true, force: true });
    }
  });

  it('creates a canonical run history entry', async () => {
    const res = await request(app)
      .post('/api/voice/turn')
      .send({ user: 'darnell', text: 'daily reflection' });

    expect(res.status).toBe(200);
    expect(res.body.assistant.runId).toMatch(/[0-9a-f-]{36}/);
    expect(res.body.assistant.artifact.prompts.length).toBeGreaterThan(0);

    const runs = await request(app).get('/api/exec-admin/p0/journal/runs');
    expect(runs.status).toBe(200);
    const items = runs.body.items || [];
    const hasRun = items.some((item: { runId: string }) => item.runId === res.body.assistant.runId);
    expect(hasRun).toBe(true);
  });
});
