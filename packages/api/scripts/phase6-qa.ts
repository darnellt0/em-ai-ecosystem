#!/usr/bin/env ts-node
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000';

type CheckResult = { ok: boolean; message: string };

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const fetchFn = (globalThis as any).fetch as typeof fetch | undefined;
  if (!fetchFn) {
    throw new Error('fetch is not available in this runtime');
  }

  const res = await fetchFn(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

async function checkHealth(): Promise<CheckResult> {
  try {
    const data = await fetchJson<{ status?: string; environment?: string }>(`${BASE_URL}/health`);
    return { ok: data.status === 'running', message: `status=${data.status}, env=${data.environment}` };
  } catch (err: any) {
    return { ok: false, message: err.message };
  }
}

async function checkOrchestratorHealth(): Promise<CheckResult> {
  try {
    const data = await fetchJson<{
      redis?: string;
      queue?: string;
      agentRegistry?: string[];
    }>(`${BASE_URL}/api/orchestrator/health`);
    const count = data.agentRegistry?.length ?? 0;
    return { ok: data.redis === 'OK' && data.queue === 'OK', message: `${count} agents, redis=${data.redis}, queue=${data.queue}` };
  } catch (err: any) {
    return { ok: false, message: err.message };
  }
}

async function checkOrchestratorLaunch(): Promise<CheckResult> {
  try {
    const data = await fetchJson<{ jobIds?: string[]; success?: boolean; message?: string }>(
      `${BASE_URL}/api/orchestrator/launch`,
      { method: 'POST' }
    );
    const jobCount = data.jobIds?.length ?? 0;
    return { ok: data.success === true, message: `launched ${jobCount} agents (${data.message ?? ''})` };
  } catch (err: any) {
    return { ok: false, message: err.message };
  }
}

async function checkOrchestratorMonitor(): Promise<CheckResult> {
  try {
    const data = await fetchJson<{ progress?: unknown[]; events?: unknown[] }>(`${BASE_URL}/api/orchestrator/monitor`);
    const p = data.progress?.length ?? 0;
    const e = data.events?.length ?? 0;
    return { ok: true, message: `progress=${p}, events=${e}` };
  } catch (err: any) {
    return { ok: false, message: err.message };
  }
}

async function checkExecAdminRun(): Promise<CheckResult> {
  try {
    const body = JSON.stringify({
      founderEmail: process.env.FOUNDER_SHRIA_EMAIL || 'shria@elevatedmovements.com',
      mode: 'full',
    });
    const data = await fetchJson<{ success?: boolean; launchedAgents?: string[]; jobIds?: string[] }>(
      `${BASE_URL}/em-ai/exec-admin/growth/run`,
      { method: 'POST', body }
    );
    const agents = data.launchedAgents?.length ?? 0;
    const jobs = data.jobIds?.length ?? 0;
    return { ok: data.success === true, message: `launchedAgents=${agents}, jobIds=${jobs}` };
  } catch (err: any) {
    return { ok: false, message: err.message };
  }
}

async function checkExecAdminStatus(): Promise<CheckResult> {
  try {
    const data = await fetchJson<{
      success?: boolean;
      agentRegistryCount?: number;
      recentProgress?: unknown[];
      recentEvents?: unknown[];
    }>(`${BASE_URL}/em-ai/exec-admin/growth/status`);
    return {
      ok: data.success === true,
      message: `agents=${data.agentRegistryCount ?? 0}, progress=${data.recentProgress?.length ?? 0}, events=${data.recentEvents?.length ?? 0}`,
    };
  } catch (err: any) {
    return { ok: false, message: err.message };
  }
}

async function runChecks() {
  const checks: Array<{ label: string; fn: () => Promise<CheckResult> }> = [
    { label: '/health', fn: checkHealth },
    { label: '/api/orchestrator/health', fn: checkOrchestratorHealth },
    { label: '/api/orchestrator/launch', fn: checkOrchestratorLaunch },
    { label: '/api/orchestrator/monitor', fn: checkOrchestratorMonitor },
    { label: '/em-ai/exec-admin/growth/run', fn: checkExecAdminRun },
    { label: '/em-ai/exec-admin/growth/status', fn: checkExecAdminStatus },
  ];

  let allOk = true;

  for (const check of checks) {
    const result = await check.fn();
    const prefix = result.ok ? '[✓]' : '[x]';
    console.log(`${prefix} ${check.label} → ${result.message}`);
    if (!result.ok) {
      allOk = false;
    }
  }

  if (!allOk) {
    process.exitCode = 1;
  }
}

runChecks().catch((err) => {
  console.error('[QA] Unexpected error:', err);
  process.exitCode = 1;
});
