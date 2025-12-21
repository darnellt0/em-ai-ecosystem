import { listPendingActions } from '../actions/action.store';
import { publishActionPackWebhook } from '../actions/actionpack.webhook';
import { registerToolHandler } from './tool.registry';
import { handleCalendarSchedule, handleCalendarReschedule } from './calendar.tool';
import { handleEmailSendFollowup } from './email.tool';
import { postCaptureNoteHandler } from './capture.tool';
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
  // Aliases for P1.1 action pack executor
  registerToolHandler('calendar', 'create_event', handleCalendarSchedule);
  registerToolHandler('calendar', 'update_event', handleCalendarReschedule);

  // P1 Integrations - Email
  registerToolHandler('email', 'send_followup', handleEmailSendFollowup);

  // P1 Integrations - Tasks
  registerToolHandler('tasks', 'create_task', createTaskHandler);

  // P1 Integrations - Capture
  registerToolHandler('capture', 'post_note', postCaptureNoteHandler);

  // n8n/actionpack_webhook -> emits Action Pack webhook (best-effort)
  registerToolHandler('n8n', 'actionpack_webhook', async (req) => {
    await publishActionPackWebhook(req.input);
    return { ok: true, output: { delivered: true } };
  });

  registered = true;
}
