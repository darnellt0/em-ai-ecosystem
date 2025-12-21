jest.mock('../../src/services/calendar.service', () => ({
  calendarService: {
    insertEvent: jest.fn().mockResolvedValue({
      success: true,
      eventId: 'evt-123',
      htmlLink: 'https://calendar.google.com/event?eid=evt-123',
      event: { id: 'evt-123' },
    }),
    updateEvent: jest.fn().mockResolvedValue({
      success: true,
      eventId: 'evt-123',
      htmlLink: 'https://calendar.google.com/event?eid=evt-123',
      event: { id: 'evt-123' },
    }),
  },
}));

import request from 'supertest';
import app from '../../src/index';
import { getP0Run, recordP0RunStart, updateP0Run } from '../../src/services/p0RunHistory.service';

describe('POST /api/exec-admin/p1/execute-action-pack', () => {
  it('executes action pack by runId and stores results on the same run', async () => {
    const storedActionPack = {
      summary: 'Daily focus summary',
      tasks: [{ title: 'Stored Task', detail: 'Email the client', priority: 'high' }],
      scheduleBlocks: [
        {
          title: 'Focus Block',
          start: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          end: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        },
      ],
    };

    const run = await recordP0RunStart({
      founderEmail: 'darnell',
      date: new Date().toISOString().slice(0, 10),
      force: true,
      kind: 'p0.daily_focus',
    });
    await updateP0Run(run.runId, {
      outputSnapshot: { actionPack: storedActionPack },
      status: 'complete',
    });

    const inlineActionPack = {
      summary: 'Inline summary',
      tasks: [{ title: 'Inline Task' }],
    };

    const res = await request(app)
      .post('/api/exec-admin/p1/execute-action-pack')
      .send({ userId: 'darnell', runId: run.runId, actionPack: inlineActionPack, actions: ['calendar', 'tasks'] });

    console.log('Response status:', res.status);
    console.log('Response body:', JSON.stringify(res.body, null, 2));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.runId).toBe(run.runId);
    expect(Array.isArray(res.body.executionResults)).toBe(true);

    const taskResult = res.body.executionResults?.find((r: any) => r.tool === 'tasks');
    expect(taskResult?.data?.task?.title).toBe('Stored Task');

    const updated = await getP0Run(run.runId);
    expect(updated?.p1ExecutionResults).toBeDefined();
  });
});
