import { PlannedAction, ActionReceipt } from '../../../shared/contracts';
import {
  recordReceipt,
  approveAction as storeApproveAction,
  findByIdempotency,
} from './action.store';
import { recordAudit } from './action.audit';

interface ExecutionContext {
  mode: 'PLAN' | 'EXECUTE';
  approvedBy?: string;
  featureFlags?: Record<string, boolean>;
}

function getDefaultFlags() {
  return {
    ENABLE_ACTION_EXECUTION: process.env.ENABLE_ACTION_EXECUTION === 'true',
    ENABLE_CALENDAR_WRITES: process.env.ENABLE_CALENDAR_WRITES === 'true',
    ENABLE_GMAIL_DRAFTS: process.env.ENABLE_GMAIL_DRAFTS === 'true',
    ENABLE_GMAIL_SEND: process.env.ENABLE_GMAIL_SEND === 'true',
    ENABLE_SHEETS_WRITES: process.env.ENABLE_SHEETS_WRITES === 'true',
  };
}

export async function executeAction(action: PlannedAction, ctx: ExecutionContext): Promise<ActionReceipt> {
  const flags = { ...getDefaultFlags(), ...(ctx.featureFlags || {}) };

  const idempotent = findByIdempotency(action.idempotencyKey);
  if (idempotent && idempotent.receipt) {
    return idempotent.receipt;
  }

  if (ctx.mode === 'PLAN') {
    const receipt: ActionReceipt = { status: 'PLANNED', message: 'Plan mode - no side effects' };
    recordReceipt(action.id, receipt);
    recordAudit({ actionId: action.id, transition: 'PLANNED', message: receipt.message });
    return receipt;
  }

  if (action.requiresApproval && action.status !== 'APPROVED') {
    const receipt: ActionReceipt = { status: 'BLOCKED', message: 'Approval required' };
    recordReceipt(action.id, receipt);
    recordAudit({ actionId: action.id, transition: 'BLOCKED', message: receipt.message });
    return receipt;
  }

  if (!flags.ENABLE_ACTION_EXECUTION) {
    const receipt: ActionReceipt = { status: 'BLOCKED', message: 'Execution disabled by flag' };
    recordReceipt(action.id, receipt);
    recordAudit({ actionId: action.id, transition: 'BLOCKED', message: receipt.message });
    return receipt;
  }

  try {
    const receipt = await routeExecution(action, flags);
    recordReceipt(action.id, receipt);
    recordAudit({ actionId: action.id, transition: receipt.status, message: receipt.message, externalRef: receipt.externalRef });
    return receipt;
  } catch (err: any) {
    const receipt: ActionReceipt = { status: 'FAILED', message: err.message };
    recordReceipt(action.id, receipt);
    recordAudit({ actionId: action.id, transition: 'FAILED', message: receipt.message });
    return receipt;
  }
}

async function routeExecution(action: PlannedAction, flags: Record<string, boolean>): Promise<ActionReceipt> {
  switch (action.type) {
    case 'calendar.propose_block':
      return { status: 'PLANNED', message: 'Proposal only (no writes)' };
    case 'calendar.create_event':
      if (!flags.ENABLE_CALENDAR_WRITES) return { status: 'BLOCKED', message: 'Calendar writes disabled' };
      return { status: 'EXECUTED', message: 'Calendar event created (mock)', externalRef: 'cal-evt-123' };
    case 'gmail.draft_email':
      if (!flags.ENABLE_GMAIL_DRAFTS) return { status: 'BLOCKED', message: 'Gmail drafts disabled' };
      return { status: 'EXECUTED', message: 'Email drafted (mock)', externalRef: 'gmail-draft-123' };
    case 'gmail.send_email':
      if (!flags.ENABLE_GMAIL_SEND) return { status: 'BLOCKED', message: 'Gmail send disabled' };
      return { status: 'EXECUTED', message: 'Email sent (mock)', externalRef: 'gmail-send-123' };
    case 'sheets.append_row':
    case 'sheets.update_row':
      if (!flags.ENABLE_SHEETS_WRITES) return { status: 'BLOCKED', message: 'Sheets writes disabled' };
      return { status: 'EXECUTED', message: 'Sheets operation completed (mock)', externalRef: 'sheets-123' };
    case 'task.create':
      return { status: 'EXECUTED', message: 'Task created (mock)', externalRef: 'task-123' };
    default:
      return { status: 'BLOCKED', message: 'Unknown action type' };
  }
}

export function approveAction(id: string, approvedBy: string, notes?: string) {
  const action = storeApproveAction(id, approvedBy, notes);
  if (action) {
    recordAudit({ actionId: id, transition: 'APPROVED', message: notes || `Approved by ${approvedBy}` });
  }
  return action;
}
