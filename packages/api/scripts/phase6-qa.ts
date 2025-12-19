#!/usr/bin/env ts-node
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Usage:
//   cd packages/api && npm run phase6:qa
//   set API_BASE_URL if your API is not on http://localhost:4000
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000';
const DEFAULT_FOUNDER = process.env.FOUNDER_SHRIA_EMAIL || 'shria@elevatedmovements.com';

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
      founderEmail: DEFAULT_FOUNDER,
      mode: 'full',
    });
    const data = await fetchJson<{ success?: boolean; launchedAgents?: string[]; jobIds?: string[]; runId?: string }>(
      `${BASE_URL}/em-ai/exec-admin/growth/run`,
      { method: 'POST', body }
    );
    const agents = data.launchedAgents?.length ?? 0;
    const jobs = data.jobIds?.length ?? 0;
    return { ok: data.success === true, message: `runId=${data.runId ?? 'n/a'} launchedAgents=${agents}, jobIds=${jobs}` };
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
      latestRun?: { runId?: string; status?: string };
      recentRuns?: Array<{ runId?: string }>;
    }>(`${BASE_URL}/em-ai/exec-admin/growth/status`);
    return {
      ok: data.success === true,
      message: `agents=${data.agentRegistryCount ?? 0}, progress=${data.recentProgress?.length ?? 0}, events=${data.recentEvents?.length ?? 0}, latestRun=${data.latestRun?.runId ?? 'n/a'}`,
    };
  } catch (err: any) {
    return { ok: false, message: err.message };
  }
}

async function checkRunHistoryList(): Promise<{ ok: boolean; message: string; runId?: string }> {
  try {
    const data = await fetchJson<{ success?: boolean; runs?: Array<{ runId: string; founderEmail: string }> }>(
      `${BASE_URL}/em-ai/exec-admin/growth/runs?founderEmail=${encodeURIComponent(DEFAULT_FOUNDER)}&limit=10`
    );
    const first = data.runs?.[0];
    if (!data.success || !first) {
      return { ok: false, message: 'no runs returned' };
    }
    return { ok: true, message: `runs=${data.runs?.length ?? 0}, first=${first.runId}`, runId: first.runId };
  } catch (err: any) {
    return { ok: false, message: err.message };
  }
}

async function checkRunHistoryDetail(runId: string): Promise<CheckResult> {
  try {
    const data = await fetchJson<{ success?: boolean; run?: { runId?: string; status?: string } }>(
      `${BASE_URL}/em-ai/exec-admin/growth/runs/${runId}`
    );
    return { ok: data.success === true && data.run?.runId === runId, message: `runId=${data.run?.runId}, status=${data.run?.status}` };
  } catch (err: any) {
    return { ok: false, message: err.message };
  }
}

async function checkRunHistoryRefresh(runId: string): Promise<CheckResult> {
  try {
    const data = await fetchJson<{ success?: boolean; run?: { lastProgressAt?: string; summary?: unknown } }>(
      `${BASE_URL}/em-ai/exec-admin/growth/runs/${runId}/refresh`,
      { method: 'POST' }
    );
    return { ok: data.success === true, message: `refreshed=${data.success} lastProgressAt=${data.run?.lastProgressAt ?? 'n/a'}` };
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
  let lastRunId: string | undefined;

  for (const check of checks) {
    const result = await check.fn();
    const prefix = result.ok ? '[✓]' : '[x]';
    console.log(`${prefix} ${check.label} → ${result.message}`);
    if (!result.ok) {
      allOk = false;
    }
    if (check.label === '/em-ai/exec-admin/growth/run' && result.ok) {
      const runIdMatch = result.message.match(/runId=([^\\s]+)/);
      lastRunId = runIdMatch?.[1];
    }
  }

  const historyList = await checkRunHistoryList();
  console.log(`${historyList.ok ? '[✓]' : '[x]'} /em-ai/exec-admin/growth/runs → ${historyList.message}`);
  if (!historyList.ok) {
    allOk = false;
  }
  const summaryRunId = historyList.runId || lastRunId;

  if (summaryRunId) {
    const detail = await checkRunHistoryDetail(summaryRunId);
    console.log(`${detail.ok ? '[✓]' : '[x]'} /em-ai/exec-admin/growth/runs/:runId → ${detail.message}`);
    if (!detail.ok) {
      allOk = false;
    }

    const refresh = await checkRunHistoryRefresh(summaryRunId);
    console.log(`${refresh.ok ? '[✓]' : '[x]'} /em-ai/exec-admin/growth/runs/:runId/refresh → ${refresh.message}`);
    if (!refresh.ok) {
      allOk = false;
    }

    // summary endpoint
    try {
      const summary = await fetchJson<{ success?: boolean; summary?: any }>(
        `${BASE_URL}/em-ai/exec-admin/growth/runs/${summaryRunId}/summary`
      );
      const ok = summary.success === true && !!summary.summary?.runId;
      console.log(`${ok ? '[✓]' : '[x]'} /em-ai/exec-admin/growth/runs/:runId/summary → summary returned`);
      if (!ok) allOk = false;
    } catch (err: any) {
      console.log(`[x] /em-ai/exec-admin/growth/runs/:runId/summary → ${err.message}`);
      allOk = false;
    }

    if (process.env.ENABLE_GROWTH_RETRY === 'true') {
      try {
        const retry = await fetchJson<{ success?: boolean; retriedAgents?: string[]; message?: string }>(
          `${BASE_URL}/em-ai/exec-admin/growth/runs/${summaryRunId}/retry`,
          { method: 'POST', body: JSON.stringify({}) }
        );
        const ok = retry.success === true;
        console.log(`${ok ? '[✓]' : '[x]'} /em-ai/exec-admin/growth/runs/:runId/retry → ${retry.message || 'ok'}`);
        if (!ok) allOk = false;
      } catch (err: any) {
        console.log(`[x] /em-ai/exec-admin/growth/runs/:runId/retry → ${err.message}`);
        allOk = false;
      }
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
