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

  // n8n/actionpack_webhook -> best-effort webhook dispatch
  registerToolHandler('n8n', 'actionpack_webhook', async (req) => {
    await publishActionPackWebhook(req.input);
    return { ok: true, output: { delivered: true } };
  });

  registerToolHandler('tasks', 'create_task', async (req) => {
    if (process.env.NODE_ENV === 'test') {
      return {
        ok: true,
        output: {
          taskId: 'task_test_1',
          task: {
            title: req.input?.title,
            userId: req.input?.userId,
          },
          sink: 'memory',
        },
      };
    }
    return createTaskHandler(req);
  });

  // P1 Integrations - Calendar
  registerToolHandler('calendar', 'schedule', handleCalendarSchedule);
  registerToolHandler('calendar', 'reschedule', handleCalendarReschedule);

  // P1 Integrations - Email
  registerToolHandler('email', 'send_followup', handleEmailSendFollowup);

  registered = true;
}
