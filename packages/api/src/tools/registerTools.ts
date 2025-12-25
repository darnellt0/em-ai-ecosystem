import { listPendingActions } from '../actions/action.store';
import { publishActionPackWebhook } from '../actions/actionpack.webhook';
import { registerToolHandler } from './tool.registry';
import { handleCalendarSchedule, handleCalendarReschedule } from './calendar.tool';
import { handleEmailSendFollowup } from './email.tool';
import { createTaskHandler } from './tasks.tool';

let registered = false;

export function ensureToolHandlersRegistered() {
  if (registered) return;

  // actions/list_pending -> returns planned/approved actions without side effects
  registerToolHandler('actions', 'list_pending', async () => {
    return { ok: true, output: { actions: listPendingActions() } };
  });

  // P1 Integrations - Calendar
  registerToolHandler('calendar', 'schedule', handleCalendarSchedule);
  registerToolHandler('calendar', 'reschedule', handleCalendarReschedule);

  // P1 Integrations - Email
  registerToolHandler('email', 'send_followup', handleEmailSendFollowup);

  // Tasks (P1 tooling)
  registerToolHandler('tasks', 'create_task', createTaskHandler);

  // Action Pack webhook (best-effort; gated by ENABLE_ACTIONPACK_WEBHOOK)
  registerToolHandler('n8n', 'actionpack_webhook', async ({ input }) => {
    try {
      await publishActionPackWebhook({
        intent: input?.intent || 'unknown',
        userId: input?.userId || 'unknown',
        qaStatus: input?.qaStatus || 'UNKNOWN',
        actionPack: input?.actionPack || {},
        timestamp: input?.timestamp || new Date().toISOString(),
      });
      return { ok: true, output: { published: true } };
    } catch (error: any) {
      return { ok: false, error: { code: 'WEBHOOK_FAILED', message: error?.message || 'Failed to publish' } };
    }
  });

  registered = true;
}
