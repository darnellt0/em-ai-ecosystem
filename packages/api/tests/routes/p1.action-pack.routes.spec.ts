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

jest.mock('../../src/tools/tool.registry', () => ({
  registerToolHandler: jest.fn(),
  getToolHandler: jest.fn(),
  listToolHandlers: jest.fn(() => []),
  runTool: jest.fn(async () => ({ ok: true, output: {} })),
  runToolByName: jest.fn(async (toolName: string, input: any) => {
    if (toolName === 'tasks.create_task') {
      return { ok: true, output: { task: { title: input?.title } } };
    }
    if (toolName === 'calendar.create_event' || toolName === 'calendar.update_event') {
      return { ok: true, output: { eventId: 'evt-123' } };
    }
    if (toolName === 'capture.post_note') {
      return { ok: true, output: { noop: true } };
    }
    return { ok: true, output: {} };
  }),
}));

jest.mock('../../src/tools/tasks.tool', () => ({
  createTaskHandler: jest.fn((req: any) => ({
    ok: true,
    output: { taskId: 'task-1', task: { title: req?.input?.title } },
  })),
}));

import request from 'supertest';
import app from '../../src/index';
import { getP0Run, recordP0RunStart, updateP0Run } from '../../src/services/p0RunHistory.service';

describe('POST /api/exec-admin/p1/execute-action-pack', () => {
  it('executes action pack by runId and stores results on the same run', async () => {
    const userId = 'founder@example.com';
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
      founderEmail: userId,
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
      .send({ userId, runId: run.runId, actionPack: inlineActionPack, actions: ['calendar', 'tasks'] });

    if (res.status !== 200) {
      console.log('P1 route error:', res.body?.error);
    }

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
