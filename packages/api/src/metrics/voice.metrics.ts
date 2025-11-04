import type { Request, Response, NextFunction } from 'express';

type HttpLabel = `${string}|${string}|${number}`;

const httpCounters = new Map<HttpLabel, number>();
const wsCounters = new Map<string, number>();
const latencySamples: number[] = [];
const MAX_SAMPLES = 500;

const sanitizeEndpoint = (endpoint: string): string => endpoint.replace(/\d+/g, ':id');

const addLatencySample = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return;
  }
  latencySamples.push(seconds);
  if (latencySamples.length > MAX_SAMPLES) {
    latencySamples.shift();
  }
};

export const recordVoiceHttpRequest = (
  endpoint: string,
  method: string,
  status: number,
  durationSeconds: number
): void => {
  const safeEndpoint = sanitizeEndpoint(endpoint);
  const key: HttpLabel = `${method.toUpperCase()}|${safeEndpoint}|${status}`;
  httpCounters.set(key, (httpCounters.get(key) || 0) + 1);
  addLatencySample(durationSeconds);
};

export const recordVoiceWsMessage = (event: string): void => {
  wsCounters.set(event, (wsCounters.get(event) || 0) + 1);
};

export const observeVoiceLatencyMs = (latencyMs: number): void => {
  addLatencySample(latencyMs / 1000);
};

export const createVoiceMetricsMiddleware = () => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const start = process.hrtime.bigint();
    res.on('finish', () => {
      const end = process.hrtime.bigint();
      const durationSeconds = Number(end - start) / 1_000_000_000;
      const base = req.baseUrl || '';
      const routePath = (req.route && req.route.path) || req.path || '';
      const endpoint = `${base}${routePath}` || req.originalUrl || 'unknown';
      recordVoiceHttpRequest(endpoint, req.method, res.statusCode, durationSeconds);
    });
    next();
  };
};

const sumValues = (map: Map<any, number>): number => {
  let total = 0;
  for (const value of map.values()) {
    total += value;
  }
  return total;
};

const percentile = (percent: number): number => {
  if (latencySamples.length === 0) {
    return 0;
  }
  const sorted = [...latencySamples].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.floor((percent / 100) * (sorted.length - 1))));
  return sorted[index];
};

export const getVoiceMetricsSnapshot = () => {
  return {
    httpRequests: {
      total: sumValues(httpCounters),
    },
    wsMessages: {
      total: sumValues(wsCounters),
    },
    latencyP95: percentile(95),
    latencyP50: percentile(50),
    samples: latencySamples.length,
  };
};

const escapeLabel = (value: string): string => value.replace(/"/g, '\\"');

export const getPrometheusMetrics = async (): Promise<string> => {
  const lines: string[] = [];
  lines.push('# HELP voice_http_requests_total Total number of voice HTTP requests');
  lines.push('# TYPE voice_http_requests_total counter');
  for (const [key, value] of httpCounters.entries()) {
    const [method, endpoint, status] = key.split('|');
    lines.push(
      `voice_http_requests_total{endpoint="${escapeLabel(endpoint)}",method="${escapeLabel(method)}",status="${status}"} ${value}`
    );
  }

  lines.push('# HELP voice_ws_messages_total Total number of voice websocket events');
  lines.push('# TYPE voice_ws_messages_total counter');
  for (const [event, value] of wsCounters.entries()) {
    lines.push(`voice_ws_messages_total{event="${escapeLabel(event)}"} ${value}`);
  }

  lines.push('# HELP voice_latency_seconds Voice operation latency samples in seconds');
  lines.push('# TYPE voice_latency_seconds summary');
  const count = latencySamples.length;
  const sum = latencySamples.reduce((acc, cur) => acc + cur, 0);
  lines.push(`voice_latency_seconds_count ${count}`);
  lines.push(`voice_latency_seconds_sum ${sum}`);
  lines.push(`voice_latency_seconds{quantile="0.5"} ${percentile(50)}`);
  lines.push(`voice_latency_seconds{quantile="0.95"} ${percentile(95)}`);

  return lines.join('\n');
};

export const getPrometheusContentType = (): string => 'text/plain; version=0.0.4';

export const resetVoiceMetrics = (): void => {
  httpCounters.clear();
  wsCounters.clear();
  latencySamples.length = 0;
};
