/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, RefreshCw } from 'lucide-react';
import { API_BASE } from '@/lib/apiClient';

type GrowthRunMode = 'full';

type GrowthRunResponse = {
  success?: boolean;
  mode?: string;
  launchedAgents?: string[];
  jobIds?: string[];
  timestamp?: string;
  error?: string;
};

type GrowthStatusResponse = {
  success?: boolean;
  environment?: string;
  agentRegistryCount?: number;
  agents?: string[];
  latestRun?: any;
  recentRuns?: any[];
  recentProgress?: Array<{
    agent?: string;
    phase?: string;
    percent?: string | number;
    note?: string;
    timestamp?: string;
  }>;
  recentEvents?: Array<{
    agent?: string;
    kind?: string;
    payload?: string;
    timestamp?: string;
  }>;
  timestamp?: string;
  error?: string;
};

const fetchJson = async <T,>(path: string, init?: RequestInit): Promise<T> => {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  if (!res.ok) {
    throw new Error(`Request failed (${res.status})`);
  }

  return res.json() as Promise<T>;
};

const postJson = async <T,>(path: string, body: any): Promise<T> => {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error((data as any)?.error || (data as any)?.message || `Request failed (${res.status})`);
  }
  return data as T;
};

export default function GrowthDashboardPage() {
  const [founderEmail, setFounderEmail] = useState('shria@elevatedmovements.com');
  const [mode] = useState<GrowthRunMode>('full');
  const [runLoading, setRunLoading] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [runResult, setRunResult] = useState<GrowthRunResponse | null>(null);

  const [statusLoading, setStatusLoading] = useState(true);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [status, setStatus] = useState<GrowthStatusResponse | null>(null);
  const [runs, setRuns] = useState<any[]>([]);
  const [runsError, setRunsError] = useState<string | null>(null);

  const [summaryRunId, setSummaryRunId] = useState('');
  const [summary, setSummary] = useState<any | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const [retryResult, setRetryResult] = useState<any | null>(null);
  const [retryError, setRetryError] = useState<string | null>(null);
  const [retryLoading, setRetryLoading] = useState(false);

  const [finalizeResult, setFinalizeResult] = useState<any | null>(null);
  const [finalizeError, setFinalizeError] = useState<string | null>(null);
  const [finalizeLoading, setFinalizeLoading] = useState(false);

  const pollIntervalMs = 10000;

  const loadStatus = async () => {
    try {
      setStatusError(null);
      const data = await fetchJson<GrowthStatusResponse>('/em-ai/exec-admin/growth/status', {
        cache: 'no-store',
      });
      setStatus(data);
    } catch (err) {
      setStatusError((err as Error).message);
    } finally {
      setStatusLoading(false);
    }
  };

  const loadRuns = async () => {
    try {
      setRunsError(null);
      const data = await fetchJson<{ runs: any[] }>('/em-ai/exec-admin/growth/runs');
      setRuns(data.runs || []);
    } catch (err) {
      setRunsError((err as Error).message);
    }
  };

  useEffect(() => {
    loadStatus();
    loadRuns();
    const id = setInterval(() => {
      loadStatus();
      loadRuns();
    }, pollIntervalMs);
    return () => clearInterval(id);
  }, []);

  const handleRun = async () => {
    setRunLoading(true);
    setRunError(null);
    try {
      const body = JSON.stringify({ founderEmail, mode });
      const data = await fetchJson<GrowthRunResponse>('/em-ai/exec-admin/growth/run', {
        method: 'POST',
        body,
      });
      setRunResult(data);
      await loadStatus();
    } catch (err) {
      setRunError((err as Error).message);
    } finally {
      setRunLoading(false);
    }
  };

  const effectiveRunId = () => summaryRunId || status?.latestRun?.runId || '';

  const loadSummary = async () => {
    const runId = effectiveRunId();
    if (!runId) {
      setSummaryError('No runId available. Trigger a run first.');
      return;
    }
    setSummaryLoading(true);
    setSummaryError(null);
    try {
      const data = await fetchJson<{ summary: any }>(`/em-ai/exec-admin/growth/runs/${runId}/summary`);
      setSummary(data.summary || null);
    } catch (err) {
      setSummaryError((err as Error).message);
    } finally {
      setSummaryLoading(false);
    }
  };

  const retryFailed = async () => {
    const runId = effectiveRunId();
    if (!runId) {
      setRetryError('No runId available. Trigger a run first.');
      return;
    }
    setRetryLoading(true);
    setRetryError(null);
    try {
      const data = await postJson<{ success?: boolean; retriedAgents?: string[]; message?: string; error?: string }>(
        `/em-ai/exec-admin/growth/runs/${runId}/retry`,
        {}
      );
      setRetryResult(data);
      await loadSummary();
    } catch (err) {
      setRetryError((err as Error).message);
    } finally {
      setRetryLoading(false);
    }
  };

  const finalizeRun = async () => {
    const runId = effectiveRunId();
    if (!runId) {
      setFinalizeError('No runId available. Trigger a run first.');
      return;
    }
    setFinalizeLoading(true);
    setFinalizeError(null);
    try {
      const data = await postJson<{ success?: boolean; run?: any; summary?: any }>(
        `/em-ai/exec-admin/growth/runs/${runId}/finalize`,
        {}
      );
      setFinalizeResult(data);
      if (data.summary) setSummary(data.summary);
      await loadRuns();
    } catch (err) {
      setFinalizeError((err as Error).message);
    } finally {
      setFinalizeLoading(false);
    }
  };

  const envBadge = useMemo(() => {
    const env = status?.environment || 'unknown';
    return (
      <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-white/90">
        Env: {env}
      </span>
    );
  }, [status?.environment]);

  return (
    <main className="space-y-8">
      {/* Header */}
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-200/80">Phase 6</p>
          <h1 className="text-3xl font-semibold text-white">Growth Agents Dashboard</h1>
          <p className="text-sm text-white/70">Executive Admin view for Phase 6 Growth Pack</p>
        </div>
        {envBadge}
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Controls */}
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/20">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Exec Admin Growth Controls</h2>
              <p className="text-sm text-white/70">Trigger the Growth Pack via Exec Admin</p>
            </div>
            <button
              onClick={loadStatus}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1 text-xs text-white hover:bg-white/10"
              aria-label="Refresh status"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>

          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-white/80" htmlFor="founderEmail">
                Founder Email
              </label>
              <input
                id="founderEmail"
                type="email"
                value={founderEmail}
                onChange={(e) => setFounderEmail(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white placeholder:text-white/50 focus:border-emerald-300 focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-white/80">Mode</label>
              <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white/90">full</div>
            </div>
            <button
              onClick={handleRun}
              disabled={runLoading}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-900 shadow hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {runLoading ? 'Running…' : 'Run Growth Pack'}
              <ArrowRight className="h-4 w-4" />
            </button>
            {runError && <p className="text-sm text-amber-200">Error: {runError}</p>}
            {runResult?.success && (
              <div className="rounded-lg border border-emerald-300/40 bg-emerald-50/10 p-3 text-sm text-emerald-100">
                <p className="font-semibold text-emerald-200">Growth pack launched successfully.</p>
                <p className="mt-1 text-emerald-100/90 text-xs">
                  Agents: {runResult.launchedAgents?.join(', ') || '—'}
                </p>
                <p className="text-emerald-100/90 text-xs">Job IDs: {runResult.jobIds?.join(', ') || '—'}</p>
              </div>
            )}
          </div>
        </section>

        {/* Status */}
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/20">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Growth Status</h2>
              <p className="text-sm text-white/70">Health, registry, and recent activity</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs text-white">
              {status?.success ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                  Healthy
                </>
              ) : (
                'Checking…'
              )}
            </span>
          </div>

          {statusLoading ? (
            <p className="mt-6 text-sm text-white/70">Loading status…</p>
          ) : statusError ? (
            <p className="mt-6 text-sm text-amber-200">Error: {statusError}</p>
          ) : (
            <div className="mt-6 space-y-4 text-sm text-white/80">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs">
                  Agents: {status?.agentRegistryCount ?? status?.agents?.length ?? '—'}
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs">
                  Timestamp: {status?.timestamp ?? '—'}
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-white">Agent Registry</h3>
                <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                  {(status?.agents ?? []).length === 0 ? (
                    <p className="text-xs text-white/60">No agents reported.</p>
                  ) : (
                    <div className="grid gap-2 md:grid-cols-2">
                      {status?.agents?.map((a) => (
                        <span key={a} className="rounded bg-white/10 px-2 py-1 text-xs">
                          {a}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-white">Recent Progress</h3>
                <div className="max-h-56 overflow-auto rounded-lg border border-white/10 bg-white/5">
                  {(status?.recentProgress ?? []).length === 0 ? (
                    <p className="p-3 text-xs text-white/60">No recent progress events.</p>
                  ) : (
                    <table className="w-full text-xs">
                      <thead className="bg-white/10 text-white/80">
                        <tr>
                          <th className="px-3 py-2 text-left">Agent</th>
                          <th className="px-3 py-2 text-left">Phase</th>
                          <th className="px-3 py-2 text-left">Percent</th>
                          <th className="px-3 py-2 text-left">Note</th>
                          <th className="px-3 py-2 text-left">Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(status?.recentProgress ?? []).map((p, idx) => (
                          <tr key={idx} className="border-t border-white/5">
                            <td className="px-3 py-2">{p.agent ?? '—'}</td>
                            <td className="px-3 py-2">{p.phase ?? '—'}</td>
                            <td className="px-3 py-2">{p.percent ?? '—'}</td>
                            <td className="px-3 py-2">{p.note ?? '—'}</td>
                            <td className="px-3 py-2">{p.timestamp ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-white">Recent Events</h3>
                <div className="max-h-40 overflow-auto rounded-lg border border-white/10 bg-white/5">
                  {(status?.recentEvents ?? []).length === 0 ? (
                    <p className="p-3 text-xs text-white/60">No recent events.</p>
                  ) : (
                    <table className="w-full text-xs">
                      <thead className="bg-white/10 text-white/80">
                        <tr>
                          <th className="px-3 py-2 text-left">Agent</th>
                          <th className="px-3 py-2 text-left">Kind</th>
                          <th className="px-3 py-2 text-left">Time</th>
                          <th className="px-3 py-2 text-left">Payload</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(status?.recentEvents ?? []).map((e, idx) => (
                          <tr key={idx} className="border-t border-white/5">
                            <td className="px-3 py-2">{e.agent ?? '—'}</td>
                            <td className="px-3 py-2">{e.kind ?? '—'}</td>
                            <td className="px-3 py-2">{e.timestamp ?? '—'}</td>
                            <td className="px-3 py-2 truncate">{e.payload ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Recent Runs */}
      <section className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/20">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Recent Runs</h2>
            <p className="text-sm text-white/70">Newest first</p>
          </div>
          <button
            onClick={loadRuns}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1 text-xs text-white hover:bg-white/10"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>
        {runsError && <p className="mt-2 text-sm text-amber-200">Error: {runsError}</p>}
        <div className="mt-4 space-y-2 text-sm text-white/80">
          {runs.length === 0 ? (
            <p className="text-white/70">No runs yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs text-white/80">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-2 py-2">Run ID</th>
                    <th className="px-2 py-2">Status</th>
                    <th className="px-2 py-2">Started</th>
                    <th className="px-2 py-2">Finished</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((r) => (
                    <tr key={r.runId} className="border-b border-white/5">
                      <td className="px-2 py-2 break-all">{r.runId}</td>
                      <td className="px-2 py-2">{r.status}</td>
                      <td className="px-2 py-2">{r.startedAt}</td>
                      <td className="px-2 py-2">{r.finishedAt || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/20 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-white">Run Summary & Retry</h2>
            <p className="text-sm text-white/70">Load summary for a run and retry failed agents (if enabled).</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadSummary}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1 text-xs text-white hover:bg-white/10"
            >
              <RefreshCw className="h-4 w-4" />
              {summaryLoading ? 'Loading…' : 'Load Summary'}
            </button>
            <button
              onClick={finalizeRun}
              disabled={finalizeLoading}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1 text-xs text-white hover:bg-white/10 disabled:opacity-60"
            >
              {finalizeLoading ? 'Finalizing…' : 'Finalize Now'}
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm text-white/80">Run ID</label>
            <input
              className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white placeholder:text-white/50 focus:border-emerald-300 focus:outline-none"
              value={summaryRunId}
              onChange={(e) => setSummaryRunId(e.target.value)}
              placeholder={status?.latestRun?.runId || 'latest runId'}
            />
            <p className="text-xs text-white/60">Latest runId: {status?.latestRun?.runId || 'n/a'}</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-white/80">Retry Failed Agents</label>
            <button
              onClick={retryFailed}
              disabled={retryLoading}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-900 shadow hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {retryLoading ? 'Retrying…' : 'Retry Failed Agents'}
              <ArrowRight className="h-4 w-4" />
            </button>
            {retryError && <p className="text-sm text-amber-200">{retryError}</p>}
            {retryResult && (
              <pre className="whitespace-pre-wrap break-words text-[11px] text-white/90">
{JSON.stringify(retryResult, null, 2)}
              </pre>
            )}
            {finalizeError && <p className="text-sm text-amber-200">{finalizeError}</p>}
            {finalizeResult && (
              <pre className="whitespace-pre-wrap break-words text-[11px] text-white/90">
{JSON.stringify(finalizeResult, null, 2)}
              </pre>
            )}
          </div>
        </div>

        {summaryError && <p className="text-sm text-amber-200">Error: {summaryError}</p>}
        {summary ? (
          <div className="grid gap-4 md:grid-cols-3 text-sm text-white/80">
            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              <p className="font-semibold text-white">Agents</p>
              <p>Total: {summary.agents?.total ?? 0}</p>
              <p>Completed: {(summary.agents?.completed || []).join(', ') || '—'}</p>
              <p>Failed: {(summary.agents?.failed || []).join(', ') || '—'}</p>
              <p>Running: {(summary.agents?.running || []).join(', ') || '—'}</p>
              <p>Queued: {(summary.agents?.queued || []).join(', ') || '—'}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              <p className="font-semibold text-white">Latest Progress</p>
              <ul className="space-y-1">
                {(summary.progress?.latest || []).map((p: any, idx: number) => (
                  <li key={idx}>
                    [{p.agent}] {p.percent ?? '?'}% {p.note || ''}
                  </li>
                ))}
                {(!summary.progress?.latest || summary.progress.latest.length === 0) && <li className="text-white/60">No progress yet.</li>}
              </ul>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              <p className="font-semibold text-white">Latest Events</p>
              <ul className="space-y-1">
                {(summary.events?.latest || []).map((e: any, idx: number) => (
                  <li key={idx}>
                    [{e.agent}] {e.kind || 'event'}
                  </li>
                ))}
                {(!summary.events?.latest || summary.events.latest.length === 0) && <li className="text-white/60">No events yet.</li>}
              </ul>
            </div>
          </div>
        ) : (
          <p className="text-white/60 text-sm">No summary loaded yet.</p>
        )}
      </section>
    </main>
  );
}
