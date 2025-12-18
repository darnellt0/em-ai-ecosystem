'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, RefreshCw } from 'lucide-react';
import { API_BASE } from '@/lib/apiClient';

type P0RunResponse = {
  success?: boolean;
  runId?: string;
  intent?: string;
  data?: any;
  error?: string;
};

const fetchJson = async <T,>(path: string) => {
  const res = await fetch(`${API_BASE}${path}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
  return data as T;
};

const postJson = async <T,>(path: string, body: any) => {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
  return data as T;
};

export default function ExecAdminP0Page() {
  const [founderEmail, setFounderEmail] = useState('shria@elevatedmovements.com');
  const [runResult, setRunResult] = useState<P0RunResponse | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [runLoading, setRunLoading] = useState(false);
  const [runs, setRuns] = useState<any[]>([]);
  const [runsError, setRunsError] = useState<string | null>(null);
  const [summary, setSummary] = useState<any | null>(null);

  const loadRuns = async () => {
    try {
      setRunsError(null);
      const data = await fetchJson<{ runs: any[] }>(
        `/em-ai/exec-admin/p0/runs?founderEmail=${encodeURIComponent(founderEmail)}&limit=10`
      );
      setRuns(data.runs || []);
    } catch (err) {
      setRunsError((err as Error).message);
    }
  };

  useEffect(() => {
    loadRuns();
  }, []);

  const handleRun = async () => {
    setRunLoading(true);
    setRunError(null);
    try {
      const data = await postJson<P0RunResponse>('/api/exec-admin/p0/daily-focus', { userId: founderEmail, mode: 'founder' });
      setRunResult(data);
      await loadRuns();
    } catch (err) {
      setRunError((err as Error).message);
    } finally {
      setRunLoading(false);
    }
  };

  const handleRunDetail = async (runId: string) => {
    try {
      const data = await fetchJson<{ run: any }>(`/em-ai/exec-admin/p0/runs/${runId}`);
      const apSummary = data.run?.actionPackSummary || data.run?.status;
      setSummary({ run: data.run, actionPackSummary: apSummary });
    } catch (err) {
      setSummary({ error: (err as Error).message });
    }
  };

  return (
    <main className="space-y-8">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Exec Admin</p>
        <h1 className="text-3xl font-semibold text-slate-900">P0 Daily Focus</h1>
        <p className="text-sm text-slate-600">Run the canonical Daily Focus flow (intent p0.daily_focus).</p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Run Daily Focus</h2>
            <p className="text-sm text-slate-600">Safe by default (PLAN only).</p>
          </div>
          <button
            onClick={loadRuns}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" /> Refresh Runs
          </button>
        </div>
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm text-slate-700">Founder Email</label>
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={founderEmail}
              onChange={(e) => setFounderEmail(e.target.value)}
            />
          </div>
          <button
            onClick={handleRun}
            disabled={runLoading}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {runLoading ? 'Running…' : 'Run Daily Focus'}
            <ArrowRight className="h-4 w-4" />
          </button>
          {runError && <p className="text-sm text-amber-600">Error: {runError}</p>}
          {runResult && (
            <pre className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-[11px] text-slate-800">
{JSON.stringify(runResult, null, 2)}
            </pre>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
        <h2 className="text-xl font-semibold text-slate-900">Recent P0 Runs</h2>
        {runsError && <p className="text-sm text-amber-600">Error: {runsError}</p>}
        {runs.length === 0 ? (
          <p className="text-sm text-slate-600">No runs yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-2 py-2">Run ID</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-2 py-2">Started</th>
                  <th className="px-2 py-2">Finished</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((r) => (
                  <tr key={r.runId} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-2 py-2 break-all">
                      <button className="text-emerald-600 underline" onClick={() => handleRunDetail(r.runId)}>
                        {r.runId}
                      </button>
                    </td>
                    <td className="px-2 py-2">{r.status}</td>
                    <td className="px-2 py-2">{r.startedAt}</td>
                    <td className="px-2 py-2">{r.finishedAt || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
        <h2 className="text-xl font-semibold text-slate-900">Run Detail</h2>
        {summary ? (
          <pre className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-[11px] text-slate-800">
{JSON.stringify(summary, null, 2)}
          </pre>
        ) : (
          <p className="text-sm text-slate-600">Select a run to view details.</p>
        )}
      </section>
    </main>
  );
}
