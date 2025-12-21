import { ensureToolHandlersRegistered } from '../../src/tools/registerTools';
import { runToolByName } from '../../src/tools/tool.registry';

describe('P1 tools', () => {
  beforeEach(() => {
    ensureToolHandlersRegistered();
  });

  it('dispatches tasks.create_task', async () => {
    const res = await runToolByName('tasks.create_task', { title: 'Test task', userId: 'darnell' });
    expect(res.ok).toBe(true);
    expect(res.output.taskId).toBeDefined();
  });
});
