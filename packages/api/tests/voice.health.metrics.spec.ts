import request from 'supertest';
import type { Express } from 'express';

declare const process: NodeJS.Process;

describe('Voice health and metrics endpoints', () => {
  beforeEach(async () => {
    jest.resetModules();
    const metrics = await import('../src/metrics/voice.metrics');
    metrics.resetVoiceMetrics();
    delete process.env.VOICE_ENABLED;
    delete process.env.VOICE_API_TOKEN;
    delete process.env.VOICE_WS_TOKEN;
  });

  it('reports websocket readiness and toggle state', async () => {
    process.env.VOICE_ENABLED = 'true';
    const { buildApp } = await import('../src/index');
    const { app } = buildApp();

    const res = await request(app as Express).get('/health/voice');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('enabled', true);
    expect(res.body).toHaveProperty('ws');
    expect(res.body).toHaveProperty('clients');
  });

  it('allows disabling voice endpoints with VOICE_ENABLED flag', async () => {
    process.env.VOICE_ENABLED = 'false';
    const { buildApp } = await import('../src/index');
    const { app } = buildApp();

    const res = await request(app as Express).post('/api/voice/scheduler/block');

    expect(res.status).toBe(503);
    expect(res.body.status).toBe('disabled');
  });

  it('returns aggregated voice metrics and respects prom format', async () => {
    process.env.VOICE_ENABLED = 'true';
    const { buildApp } = await import('../src/index');
    const { app } = buildApp();

    const metrics = await import('../src/metrics/voice.metrics');
    metrics.recordVoiceHttpRequest('/api/voice/test', 'POST', 200, 0.2);
    metrics.observeVoiceLatencyMs(120);
    metrics.recordVoiceWsMessage('welcome_sent');

    const jsonRes = await request(app as Express).get('/api/metrics');
    expect(jsonRes.status).toBe(200);
    expect(jsonRes.body.voice.enabled).toBe(true);
    expect(jsonRes.body.voice.httpRequests.total).toBeGreaterThanOrEqual(1);
    expect(jsonRes.body.voice.wsMessages.total).toBeGreaterThanOrEqual(1);

    const promRes = await request(app as Express).get('/api/metrics?format=prom');
    expect(promRes.status).toBe(200);
    expect(promRes.text).toContain('voice_http_requests_total');
  });
});
