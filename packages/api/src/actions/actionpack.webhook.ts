import crypto from 'crypto';

interface ActionPackEvent {
  intent: string;
  userId: string;
  qaStatus: string;
  actionPack: any;
  timestamp: string;
}

function getWebhookConfig() {
  return {
    enabled: process.env.ENABLE_ACTIONPACK_WEBHOOK === 'true',
    url: process.env.ACTIONPACK_WEBHOOK_URL,
    secret: process.env.ACTIONPACK_WEBHOOK_SECRET,
    timeoutMs: process.env.ACTIONPACK_WEBHOOK_TIMEOUT_MS ? Number(process.env.ACTIONPACK_WEBHOOK_TIMEOUT_MS) : 8000,
  };
}

export async function publishActionPackWebhook(event: ActionPackEvent) {
  const cfg = getWebhookConfig();
  if (!cfg.enabled) return;
  if (!cfg.url) {
    console.warn('[ActionPackWebhook] ENABLED but ACTIONPACK_WEBHOOK_URL missing');
    return;
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), cfg.timeoutMs);
  const body = JSON.stringify(event);
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (cfg.secret) {
    const signature = crypto.createHmac('sha256', cfg.secret).update(body).digest('hex');
    headers['X-EM-Signature'] = signature;
  }

  try {
    await fetch(cfg.url, {
      method: 'POST',
      headers,
      body,
      signal: controller.signal,
    });
  } catch (err) {
    console.warn('[ActionPackWebhook] post failed', err);
  } finally {
    clearTimeout(timeout);
  }
}
