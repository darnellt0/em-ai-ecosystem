import { executeAction, approveAction } from '../../src/actions/action.executor';
import { savePlannedAction, resetActionsForTest } from '../../src/actions/action.store';
import { resetAuditForTest, listAudit } from '../../src/actions/action.audit';

describe('Action Executor Safety', () => {
  beforeEach(() => {
    resetActionsForTest();
    resetAuditForTest();
    delete process.env.ENABLE_ACTION_EXECUTION;
    delete process.env.ENABLE_CALENDAR_WRITES;
    delete process.env.ENABLE_GMAIL_DRAFTS;
    delete process.env.ENABLE_GMAIL_SEND;
    delete process.env.ENABLE_SHEETS_WRITES;
  });

  it('PLAN mode produces PLANNED and no side effects', async () => {
    const action = savePlannedAction({ type: 'gmail.draft_email', requiresApproval: true, payload: {} });
    const receipt = await executeAction(action, { mode: 'PLAN' });
    expect(receipt.status).toBe('PLANNED');
    expect(listAudit().some((a) => a.actionId === action.id && a.transition === 'PLANNED')).toBe(true);
  });

  it('EXECUTE without approval => BLOCKED', async () => {
    const action = savePlannedAction({ type: 'gmail.draft_email', requiresApproval: true, payload: {} });
    const receipt = await executeAction(action, { mode: 'EXECUTE' });
    expect(receipt.status).toBe('BLOCKED');
  });

  it('EXECUTE with approval but ENABLE_ACTION_EXECUTION=false => BLOCKED', async () => {
    const action = savePlannedAction({ type: 'gmail.draft_email', requiresApproval: true, payload: {} });
    approveAction(action.id, 'tester');
    const receipt = await executeAction(action, { mode: 'EXECUTE' });
    expect(receipt.status).toBe('BLOCKED');
  });

  it('EXECUTE with approval + execution enabled but connector flag missing => BLOCKED', async () => {
    process.env.ENABLE_ACTION_EXECUTION = 'true';
    const action = savePlannedAction({ type: 'calendar.create_event', requiresApproval: true, payload: {} });
    approveAction(action.id, 'tester');
    const receipt = await executeAction(action, { mode: 'EXECUTE' });
    expect(receipt.status).toBe('BLOCKED');
    expect(receipt.message).toMatch(/disabled/i);
  });

  it('Idempotency returns same receipt', async () => {
    process.env.ENABLE_ACTION_EXECUTION = 'true';
    process.env.ENABLE_CALENDAR_WRITES = 'true';
    const action = savePlannedAction({
      type: 'calendar.create_event',
      requiresApproval: true,
      payload: {},
      idempotencyKey: 'same-key',
    });
    approveAction(action.id, 'tester');
    const first = await executeAction(action, { mode: 'EXECUTE' });
    const second = await executeAction(action, { mode: 'EXECUTE' });
    expect(second.status).toBe(first.status);
    expect(second.externalRef).toBe(first.externalRef);
  });

  it('Audit log records transitions', async () => {
    const action = savePlannedAction({ type: 'task.create', requiresApproval: false, payload: {} });
    await executeAction(action, { mode: 'PLAN' });
    const audit = listAudit();
    expect(audit.length).toBeGreaterThan(0);
    expect(audit[0].transition).toBeDefined();
  });
});
