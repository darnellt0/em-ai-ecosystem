import { listPendingActions } from '../actions/action.store';
import { publishActionPackWebhook } from '../actions/actionpack.webhook';
import { registerToolHandler } from './tool.registry';

let registered = false;

export function ensureToolHandlersRegistered() {
  if (registered) return;

  // actions/list_pending -> returns planned/approved actions without side effects
  registerToolHandler('actions', 'list_pending', async () => {
    return { ok: true, output: { actions: listPendingActions() } };
  });

  // n8n/actionpack_webhook -> emits Action Pack webhook (best-effort)
  registerToolHandler('n8n', 'actionpack_webhook', async (req) => {
    await publishActionPackWebhook(req.input);
    return { ok: true, output: { delivered: true } };
  });

  registered = true;
}
