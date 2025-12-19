process.env.PORT = '0';

import fs from 'fs';
import os from 'os';
import path from 'path';
import request from 'supertest';

const runsDir = path.join(os.tmpdir(), 'p0-journal-run-tests');
process.env.P0_RUN_DATA_DIR = runsDir;

jest.mock('../../src/voice-realtime/ws.server', () => ({
  initVoiceRealtimeWSS: () => {},
}));

import app from '../../src';

describe('P0 Journal Exec Admin routes', () => {
  beforeAll(() => {
    if (fs.existsSync(runsDir)) {
      fs.rmSync(runsDir, { recursive: true, force: true });
    }
  });

  afterAll(() => {
    if (fs.existsSync(runsDir)) {
      fs.rmSync(runsDir, { recursive: true, force: true });
    }
  });

  it('creates a journal run and stores artifact', async () => {
    const res = await request(app)
      .post('/api/exec-admin/p0/journal/run')
      .send({ user: 'darnell', intent: 'journal.daily_reflection', runId: 'journal-run-1' });

    expect(res.status).toBe(200);
    expect(res.body.runId).toBe('journal-run-1');
    expect(res.body.kind).toBe('p0.journal');
    expect(res.body.artifact?.intent).toBe('journal.daily_reflection');
    expect(res.body.artifact?.prompts?.length).toBe(4);
  });

  it('lists recent runs', async () => {
    const res = await request(app).get('/api/exec-admin/p0/journal/runs?limit=20');

    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThan(0);
    expect(res.body.items[0].runId).toBe('journal-run-1');
  });

  it('reads a run artifact', async () => {
    const res = await request(app).get('/api/exec-admin/p0/journal/runs/journal-run-1');

    expect(res.status).toBe(200);
    expect(res.body.runId).toBe('journal-run-1');
    expect(res.body.artifact?.intent).toBe('journal.daily_reflection');
  });

  it('rejects invalid user', async () => {
    const res = await request(app)
      .post('/api/exec-admin/p0/journal/run')
      .send({ user: 'not-a-user', intent: 'journal.daily_reflection' });

    expect(res.status).toBe(400);
  });

  it('rejects invalid intent', async () => {
    const res = await request(app)
      .post('/api/exec-admin/p0/journal/run')
      .send({ user: 'darnell', intent: 'journal.invalid' });

    expect(res.status).toBe(400);
  });
});
