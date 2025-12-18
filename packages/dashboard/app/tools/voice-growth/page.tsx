/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { useState } from 'react';
import { ArrowRight, RefreshCw } from 'lucide-react';

import { API_BASE } from '@/lib/apiClient';

async function postJson<T>(path: string, body: any): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || `Request failed (${res.status})`);
  }
  return data as T;
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { method: 'GET' });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || `Request failed (${res.status})`);
  }
  return data as T;
}

type GrowthIntentResponse = {
  success?: boolean;
  intent?: string;
  message?: string;
  data?: any;
  error?: string;
  timestamp?: string;
};

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
  agentRegistryCount?: number;
  agents?: string[];
  recentProgress?: any[];
  recentEvents?: any[];
  environment?: string;
  timestamp?: string;
  error?: string;
};

type GrowthRunRecord = {
  runId: string;
  status: string;
  startedAt: string;
  finishedAt?: string;
  mode?: string;
  founderEmail?: string;
};

export default function VoiceGrowthDevConsole() {
  const [founderEmail, setFounderEmail] = useState('shria@elevatedmovements.com');
  const [mode, setMode] = useState<'full' | 'light'>('full');

  const [intentLoading, setIntentLoading] = useState(false);
  const [intentError, setIntentError] = useState<string | null>(null);
  const [intentResponse, setIntentResponse] = useState<GrowthIntentResponse | null>(null);

  const [runLoading, setRunLoading] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [runResponse, setRunResponse] = useState<GrowthRunResponse | null>(null);

  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [statusResponse, setStatusResponse] = useState<GrowthStatusResponse | null>(null);
  const [runs, setRuns] = useState<GrowthRunRecord[]>([]);
  const [runsError, setRunsError] = useState<string | null>(null);
  const [runsLoading, setRunsLoading] = useState(false);
  const [selectedRun, setSelectedRun] = useState<any | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [summary, setSummary] = useState<any | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [retryResult, setRetryResult] = useState<any | null>(null);
  const [retryError, setRetryError] = useState<string | null>(null);
  const [retryLoading, setRetryLoading] = useState(false);

  const handleIntent = async () => {
    setIntentLoading(true);
    setIntentError(null);
    try {
      const data = await postJson<GrowthIntentResponse>('/api/voice/intent', {
        intent: 'growth_check_in',
        metadata: { founderEmail, mode },
      });
      setIntentResponse(data);
    } catch (err: any) {
      setIntentError(err.message || 'Error sending intent');
    } finally {
      setIntentLoading(false);
    }
  };

  const handleRun = async () => {
    setRunLoading(true);
    setRunError(null);
    try {
      const data = await postJson<GrowthRunResponse>('/em-ai/exec-admin/growth/run', {
        founderEmail,
        mode,
      });
      setRunResponse(data);
    } catch (err: any) {
      setRunError(err.message || 'Error running growth pack');
    } finally {
      setRunLoading(false);
    }
  };

  const handleStatus = async () => {
    setStatusLoading(true);
    setStatusError(null);
    try {
      const data = await getJson<GrowthStatusResponse>('/em-ai/exec-admin/growth/status');
      setStatusResponse(data);
    } catch (err: any) {
      setStatusError(err.message || 'Error fetching status');
    } finally {
      setStatusLoading(false);
    }
  };

  const handleRuns = async () => {
    try {
      setRunsLoading(true);
      setRunsError(null);
      const data = await getJson<{ runs: GrowthRunRecord[] }>(
        `/em-ai/exec-admin/growth/runs?founderEmail=${encodeURIComponent(founderEmail)}&limit=10`
      );
      setRuns(data.runs || []);
    } catch (err: any) {
      setRunsError(err.message || 'Error fetching runs');
    } finally {
      setRunsLoading(false);
    }
  };

  const handleRunDetail = async (runId: string) => {
    setDetailLoading(true);
    setDetailError(null);
    try {
      const data = await getJson<{ run: any }>(`/em-ai/exec-admin/growth/runs/${runId}`);
      setSelectedRun(data.run || null);
      setSummary(null);
      setRetryResult(null);
    } catch (err: any) {
      setDetailError(err.message || 'Error fetching run detail');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleRefreshRun = async () => {
    if (!selectedRun?.runId) return;
    setDetailLoading(true);
    try {
      await postJson(`/em-ai/exec-admin/growth/runs/${selectedRun.runId}/refresh`, {});
      await handleRunDetail(selectedRun.runId);
    } catch (err: any) {
      setDetailError(err.message || 'Error refreshing run');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSummary = async () => {
    if (!selectedRun?.runId) {
      setSummaryError('No run selected');
      return;
    }
    setSummaryError(null);
    try {
      const data = await getJson<{ summary: any }>(`/em-ai/exec-admin/growth/runs/${selectedRun.runId}/summary`);
      setSummary(data.summary || null);
    } catch (err: any) {
      setSummaryError(err.message || 'Error loading summary');
    }
  };

  const handleRetry = async () => {
    if (!selectedRun?.runId) {
      setRetryError('No run selected');
      return;
    }
    setRetryLoading(true);
    setRetryError(null);
    try {
      const data = await postJson(`/em-ai/exec-admin/growth/runs/${selectedRun.runId}/retry`, {});
      setRetryResult(data);
    } catch (err: any) {
      setRetryError(err.message || 'Error retrying');
    } finally {
      setRetryLoading(false);
    }
  };

  const badge = (ok?: boolean) =>
    ok ? (
      <span className="rounded-full bg-emerald-200/80 px-3 py-1 text-xs font-semibold text-emerald-900">
        success
      </span>
    ) : (
      <span className="rounded-full bg-amber-200/80 px-3 py-1 text-xs font-semibold text-amber-900">error</span>
    );

  return (
    <main className="space-y-8">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.3em] text-emerald-200/80">Developer Tools</p>
        <h1 className="text-3xl font-semibold text-white">Voice &amp; Growth Dev Console</h1>
        <p className="text-sm text-white/70">
          Manually trigger the growth voice intent and Exec Admin growth endpoints. Uses API base:{' '}
          {API_BASE || '(relative)'}.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/20 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Growth Check-In (Voice Intent)</h2>
              <p className="text-sm text-white/70">Calls /api/voice/intent with intent=growth_check_in</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm text-white/80">Founder Email</label>
              <input
                className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white placeholder:text-white/50 focus:border-emerald-300 focus:outline-none"
                value={founderEmail}
                onChange={(e) => setFounderEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-white/80">Mode</label>
              <select
                className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white focus:border-emerald-300 focus:outline-none"
                value={mode}
                onChange={(e) => setMode(e.target.value as 'full' | 'light')}
              >
                <option value="full">full</option>
                <option value="light">light</option>
              </select>
            </div>
            <button
              onClick={handleIntent}
              disabled={intentLoading}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-900 shadow hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {intentLoading ? 'Sending…' : 'Send Voice Growth Check-In'}
              <ArrowRight className="h-4 w-4" />
            </button>
            {intentError && <p className="text-sm text-amber-200">Error: {intentError}</p>}
            {intentResponse && (
              <div className="space-y-2 rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-white/90">
                <div className="flex items-center gap-2">
                  {badge(intentResponse.success)}
                  <span className="text-white/70">intent: {intentResponse.intent}</span>
                </div>
                <pre className="whitespace-pre-wrap break-words text-[11px] text-white/90">
{JSON.stringify(intentResponse, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/20 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Exec Admin Growth Pack</h2>
              <p className="text-sm text-white/70">Calls /em-ai/exec-admin/growth/run and /status</p>
            </div>
            <button
              onClick={handleStatus}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1 text-xs text-white hover:bg-white/10"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Status
            </button>
          </div>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm text-white/80">Founder Email</label>
              <input
                className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white placeholder:text-white/50 focus:border-emerald-300 focus:outline-none"
                value={founderEmail}
                onChange={(e) => setFounderEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-white/80">Mode</label>
              <select
                className="w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white focus:border-emerald-300 focus:outline-none"
                value={mode}
                onChange={(e) => setMode(e.target.value as 'full' | 'light')}
              >
                <option value="full">full</option>
                <option value="light">light</option>
              </select>
            </div>
            <button
              onClick={handleRun}
              disabled={runLoading}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-900 shadow hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {runLoading ? 'Running…' : 'Run Exec Admin Growth Pack'}
              <ArrowRight className="h-4 w-4" />
            </button>
            {runError && <p className="text-sm text-amber-200">Error: {runError}</p>}
            {runResponse && (
              <div className="space-y-2 rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-white/90">
                <div className="flex items-center gap-2">
                  {badge(runResponse.success)}
                  <span className="text-white/70">mode: {runResponse.mode}</span>
                </div>
                <pre className="whitespace-pre-wrap break-words text-[11px] text-white/90">
{JSON.stringify(runResponse, null, 2)}
                </pre>
              </div>
            )}
            <div className="space-y-2 rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-white/90">
              <div className="flex items-center gap-2">
                {badge(statusResponse?.success)}
                <span className="text-white/70">status</span>
              </div>
              {statusLoading && <p className="text-sm text-white/70">Loading status…</p>}
              {statusError && <p className="text-sm text-amber-200">Error: {statusError}</p>}
              {statusResponse && (
                <pre className="whitespace-pre-wrap break-words text-[11px] text-white/90">
{JSON.stringify(statusResponse, null, 2)}
                </pre>
              )}
            </div>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/20 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Run History</h2>
            <p className="text-sm text-white/70">Recent runs for founder: {founderEmail}</p>
          </div>
          <button
            onClick={handleRuns}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1 text-xs text-white hover:bg-white/10"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Runs
          </button>
        </div>

        {runsLoading && <p className="text-sm text-white/70">Loading runs…</p>}
        {runsError && <p className="text-sm text-amber-200">Error: {runsError}</p>}

        <div className="overflow-auto">
          <table className="min-w-full text-sm text-white/80">
            <thead>
              <tr className="border-b border-white/10 text-left text-white/60">
                <th className="py-2 pr-4">Started</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Mode</th>
                <th className="py-2 pr-4">Run ID</th>
              </tr>
            </thead>
            <tbody>
              {(runs || []).map((run) => (
                <tr key={run.runId} className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-2 pr-4">{run.startedAt}</td>
                  <td className="py-2 pr-4">{run.status}</td>
                  <td className="py-2 pr-4">{run.mode ?? 'n/a'}</td>
                  <td className="py-2 pr-4">
                    <button
                      className="text-emerald-300 underline"
                      onClick={() => handleRunDetail(run.runId)}
                    >
                      {run.runId}
                    </button>
                  </td>
                </tr>
              ))}
              {runs.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-3 text-white/60">
                    No runs yet. Run a pack, then refresh.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="space-y-2 rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-white/90">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-white/70">Run detail</span>
              {detailLoading && <span className="text-white/60">Loading…</span>}
            </div>
            {selectedRun?.runId && (
              <button
                onClick={handleRefreshRun}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1 text-[11px] text-white hover:bg-white/10"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
            )}
          </div>
          {detailError && <p className="text-sm text-amber-200">Error: {detailError}</p>}
          {selectedRun ? (
            <pre className="whitespace-pre-wrap break-words text-[11px] text-white/90">
{JSON.stringify(selectedRun, null, 2)}
            </pre>
          ) : (
            <p className="text-white/60 text-sm">Select a run to view details.</p>
          )}

          {selectedRun?.runId && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSummary}
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1 text-[11px] text-white hover:bg-white/10"
                >
                  Load Summary
                </button>
                <button
                  onClick={handleRetry}
                  disabled={retryLoading}
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-400 px-3 py-1 text-[11px] font-semibold text-slate-900 shadow hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {retryLoading ? 'Retrying…' : 'Retry Failed'}
                </button>
              </div>
              {summaryError && <p className="text-amber-200 text-xs">Summary error: {summaryError}</p>}
              {summary && (
                <pre className="whitespace-pre-wrap break-words text-[11px] text-white/90">
{JSON.stringify(summary, null, 2)}
                </pre>
              )}
              {retryError && <p className="text-amber-200 text-xs">Retry error: {retryError}</p>}
              {retryResult && (
                <pre className="whitespace-pre-wrap break-words text-[11px] text-white/90">
{JSON.stringify(retryResult, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
