import crypto from 'crypto';
import { ToolRequest, ToolResult } from './tool.types';

interface McpConfig {
  enabled: boolean;
  url?: string;
  timeoutMs: number;
  secret?: string;
}

function getMcpConfig(): McpConfig {
  return {
    enabled: process.env.ENABLE_MCP === 'true',
    url: process.env.MCP_SERVER_URL,
    timeoutMs: process.env.MCP_TIMEOUT_MS ? Number(process.env.MCP_TIMEOUT_MS) : 15000,
    secret: process.env.MCP_SHARED_SECRET,
  };
}

export async function runMcpTool(req: ToolRequest): Promise<ToolResult> {
  const cfg = getMcpConfig();
  if (!cfg.enabled) {
    return { ok: false, error: { code: 'MCP_DISABLED', message: 'MCP disabled by flag' } };
  }
  if (!cfg.url) {
    return { ok: false, error: { code: 'MCP_MISCONFIGURED', message: 'MCP_SERVER_URL missing' } };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), cfg.timeoutMs);
  const body = JSON.stringify(req);

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (cfg.secret) {
    const hmac = crypto.createHmac('sha256', cfg.secret).update(body).digest('hex');
    headers['X-EM-Signature'] = hmac;
  }

  try {
    const res = await fetch(cfg.url, {
      method: 'POST',
      headers,
      body,
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) {
      return { ok: false, error: { code: 'MCP_HTTP_ERROR', message: `HTTP ${res.status}` } };
    }
    const json = await res.json();
    return { ok: true, output: json };
  } catch (err: any) {
    clearTimeout(timeout);
    if (err?.name === 'AbortError') {
      return { ok: false, error: { code: 'MCP_TIMEOUT', message: 'MCP request timed out' } };
    }
    return { ok: false, error: { code: 'MCP_ERROR', message: err?.message || 'MCP request failed', details: err } };
  }
}
