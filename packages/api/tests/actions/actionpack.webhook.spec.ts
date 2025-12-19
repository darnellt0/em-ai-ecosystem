import { publishActionPackWebhook } from '../../src/actions/actionpack.webhook';

describe('ActionPack Webhook', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    (global as any).fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  const sampleEvent = {
    intent: 'p0.daily_focus',
    userId: 'test-user',
    qaStatus: 'PASS',
    actionPack: { status: 'ready' },
    timestamp: new Date().toISOString(),
  };

  it('does nothing when disabled', async () => {
    process.env.ENABLE_ACTIONPACK_WEBHOOK = 'false';
    await publishActionPackWebhook(sampleEvent);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('warns when enabled but missing URL', async () => {
    process.env.ENABLE_ACTIONPACK_WEBHOOK = 'true';
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    await publishActionPackWebhook(sampleEvent);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('posts when enabled with URL and secret', async () => {
    process.env.ENABLE_ACTIONPACK_WEBHOOK = 'true';
    process.env.ACTIONPACK_WEBHOOK_URL = 'http://example.com/webhook';
    process.env.ACTIONPACK_WEBHOOK_SECRET = 'secret';

    await publishActionPackWebhook(sampleEvent);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, opts] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe('http://example.com/webhook');
    expect((opts as any).headers['X-EM-Signature']).toBeDefined();
  });
});
