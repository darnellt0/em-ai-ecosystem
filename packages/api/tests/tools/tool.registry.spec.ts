import { ensureToolHandlersRegistered } from '../../src/tools/registerTools';
import { runTool, listToolHandlers } from '../../src/tools/tool.registry';
import { resetActionsForTest, savePlannedAction } from '../../src/actions/action.store';

describe('Tool Registry', () => {
  beforeEach(() => {
    resetActionsForTest();
    ensureToolHandlersRegistered();
  });

  it('returns NOT_IMPLEMENTED for unknown tool', async () => {
    const res = await runTool({ tool: 'unknown', action: 'noop' });
    expect(res.ok).toBe(false);
    expect(res.error?.code).toBe('NOT_IMPLEMENTED');
  });

  it('handles actions/list_pending', async () => {
    // seed one planned action
    savePlannedAction({
      type: 'gmail.draft_email',
      requiresApproval: true,
      payload: { subject: 'hello' },
      risk: 'low',
      priority: 'low',
    });

    const res = await runTool({ tool: 'actions', action: 'list_pending' });
    expect(res.ok).toBe(true);
    expect(Array.isArray(res.output.actions)).toBe(true);
    expect(res.output.actions.length).toBe(1);
    expect(listToolHandlers().length).toBeGreaterThan(0);
  });
});
