import { PlannedAction, ActionReceipt } from '../../../shared/contracts';
import {
  recordReceipt,
  approveAction as storeApproveAction,
  findByIdempotency,
} from './action.store';
import { recordAudit } from './action.audit';
import { runTool } from '../tools/tool.registry';
import { ensureToolHandlersRegistered } from '../tools/registerTools';

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
  ensureToolHandlersRegistered();

  switch (action.type) {
    case 'calendar.propose_block':
      return { status: 'PLANNED', message: 'Proposal only (no writes)' };

    case 'calendar.create_event': {
      if (!flags.ENABLE_CALENDAR_WRITES) return { status: 'BLOCKED', message: 'Calendar writes disabled' };

      const result = await runTool({
        tool: 'calendar',
        action: 'schedule',
        input: action.payload,
      });

      if (result.ok && result.output?.success) {
        console.log('[ActionExecutor] Calendar event created', { eventId: result.output.data?.eventId });
        return {
          status: 'EXECUTED',
          message: `Calendar event created: ${result.output.data?.event?.summary}`,
          externalRef: result.output.data?.eventId,
        };
      }

      console.error('[ActionExecutor] Calendar schedule failed', { error: result.error });
      return { status: 'FAILED', message: result.error?.message || 'Calendar schedule failed' };
    }

    case 'gmail.draft_email':
      if (!flags.ENABLE_GMAIL_DRAFTS) return { status: 'BLOCKED', message: 'Gmail drafts disabled' };
      return { status: 'EXECUTED', message: 'Email drafted (mock)', externalRef: 'gmail-draft-123' };

    case 'gmail.send_email': {
      if (!flags.ENABLE_GMAIL_SEND) return { status: 'BLOCKED', message: 'Gmail send disabled' };

      const result = await runTool({
        tool: 'email',
        action: 'send_followup',
        input: action.payload,
      });

      if (result.ok && result.output?.success) {
        console.log('[ActionExecutor] Email sent', { messageId: result.output.data?.messageId });
        return {
          status: 'EXECUTED',
          message: `Email sent to ${action.payload.to}`,
          externalRef: result.output.data?.messageId,
        };
      }

      console.error('[ActionExecutor] Email send failed', { error: result.error });
      return { status: 'FAILED', message: result.error?.message || 'Email send failed' };
    }

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
