import { listPendingActions } from '../actions/action.store';
import { registerToolHandler } from './tool.registry';
import { handleCalendarSchedule, handleCalendarReschedule } from './calendar.tool';
import { handleEmailSendFollowup } from './email.tool';

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

  registered = true;
}
