'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Copy, RefreshCw } from 'lucide-react';
import { API_BASE, fetchJson } from '@/lib/apiClient';

type Brief = {
  date: string;
  topPriorities: { title: string; why: string; nextStep: string }[];
  focusBlock: { start: string; end: string; theme: string };
  calendarSummary: { meetings: number; highlights: string[] };
  inboxHighlights: { items: { from: string; subject: string; whyImportant: string }[] };
  risks: string[];
  suggestedActions: { type: string; title: string; details: string }[];
};

type RunRecord = {
  runId: string;
  status: string;
  startedAt: string;
  finishedAt?: string;
  artifact?: Brief;
};

const postJson = async <T,>(path: string, body: any) => {
  return fetchJson<T>(path, {
    method: 'POST',
    body: JSON.stringify(body),
  });
};

export default function DailyBriefPage() {
  const [user, setUser] = useState<'darnell' | 'shria'>('darnell');
  const [brief, setBrief] = useState<Brief | null>(null);
  const [runId, setRunId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [runs, setRuns] = useState<RunRecord[]>([]);
  const [runDetail, setRunDetail] = useState<RunRecord | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const prettyBrief = useMemo(() => (brief ? JSON.stringify(brief, null, 2) : ''), [brief]);

  const loadRuns = async () => {
    try {
      setHistoryError(null);
      const data = await fetchJson<{ runs: RunRecord[] }>(
        `/exec-admin/p0/daily-brief/runs?limit=20&founderEmail=${user}`
      );
      setRuns(data.runs || []);
    } catch (err) {
      setHistoryError((err as Error).message);
    }
  };

  useEffect(() => {
    loadRuns();
  }, [user]);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    const newRunId = crypto.randomUUID();
    try {
      const res = await postJson<{ success: boolean; runId: string; brief: Brief }>(
        '/exec-admin/p0/daily-brief',
        { user, runId: newRunId }
      );
      setBrief(res.brief);
      setRunId(res.runId);
      setRunDetail({ runId: res.runId, status: 'complete', startedAt: new Date().toISOString(), artifact: res.brief });
      await loadRuns();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!brief) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(brief, null, 2));
    } catch {
      // ignore
    }
  };

  const handleViewRun = async (id: string) => {
    try {
      const data = await fetchJson<{ run: RunRecord }>(`/exec-admin/p0/daily-brief/runs/${id}`);
      setRunDetail(data.run);
      if (data.run?.artifact) {
        setBrief(data.run.artifact);
        setRunId(data.run.runId);
      }
    } catch (err) {
      setRunDetail({ runId: id, status: 'error', startedAt: '', artifact: undefined });
    }
  };

  return (
    <main className="space-y-8">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Exec Admin</p>
        <h1 className="text-3xl font-semibold text-white">P0 Daily Brief</h1>
        <p className="text-sm text-slate-200">Generate the P0 Daily Brief via Exec Admin and inspect run history.</p>
      </header>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/20 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-white">Generate Daily Brief</h2>
            <p className="text-sm text-slate-300">Calls /exec-admin/p0/daily-brief with a client-generated runId.</p>
          </div>
          <button
            onClick={loadRuns}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1 text-xs text-slate-100 hover:bg-white/10"
          >
            <RefreshCw className="h-4 w-4" /> Refresh Runs
          </button>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm text-slate-200">User</label>
            <select
              className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white"
              value={user}
              onChange={(e) => setUser(e.target.value as 'darnell' | 'shria')}
            >
              <option value="darnell">Darnell</option>
              <option value="shria">Shria</option>
            </select>
          </div>
          <div className="md:col-span-2 flex items-end gap-3">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? 'Generating…' : 'Generate Daily Brief'}
              <ArrowRight className="h-4 w-4" />
            </button>
            {runId && <span className="text-xs text-slate-300">Run ID: {runId}</span>}
          </div>
        </div>
        {error && <p className="mt-3 text-sm text-amber-300">Error: {error}</p>}
      </section>

      {brief && (
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-inner shadow-black/30 backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-white">Brief Result</h2>
              <p className="text-sm text-slate-300">Top priorities, focus block, calendar + inbox highlights.</p>
            </div>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1 text-xs text-slate-100 hover:bg-white/10"
            >
              <Copy className="h-4 w-4" /> Copy JSON
            </button>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-white/80">Top Priorities</h3>
              <div className="space-y-2">
                {brief.topPriorities.map((p, idx) => (
                  <div key={idx} className="rounded-lg border border-white/10 bg-black/20 p-3">
                    <p className="text-sm font-semibold text-white">{p.title}</p>
                    <p className="text-xs text-slate-300">Why: {p.why}</p>
                    <p className="text-xs text-emerald-300">Next: {p.nextStep}</p>
                  </div>
                ))}
                {brief.topPriorities.length === 0 && <p className="text-xs text-slate-400">No priorities returned.</p>}
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-white/80">Suggested Actions</h3>
                {brief.suggestedActions.map((a, idx) => (
                  <div key={idx} className="rounded-lg border border-white/10 bg-black/20 p-3">
                    <p className="text-xs uppercase tracking-wide text-slate-400">{a.type}</p>
                    <p className="text-sm font-semibold text-white">{a.title}</p>
                    <p className="text-xs text-slate-300">{a.details}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                <h3 className="text-sm font-semibold text-white/80">Focus Block</h3>
                <p className="text-xs text-slate-200">
                  {brief.focusBlock.start} → {brief.focusBlock.end}
                </p>
                <p className="text-xs text-emerald-300">{brief.focusBlock.theme}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                <h3 className="text-sm font-semibold text-white/80">Calendar Summary</h3>
                <p className="text-xs text-slate-200">Meetings: {brief.calendarSummary.meetings}</p>
                <ul className="mt-1 space-y-1 text-xs text-slate-300">
                  {brief.calendarSummary.highlights.map((h, idx) => (
                    <li key={idx}>• {h}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                <h3 className="text-sm font-semibold text-white/80">Inbox Highlights</h3>
                {brief.inboxHighlights.items.length === 0 && <p className="text-xs text-slate-400">None</p>}
                {brief.inboxHighlights.items.map((i, idx) => (
                  <div key={idx} className="text-xs text-slate-200">
                    <p className="font-semibold text-white">{i.subject}</p>
                    <p>From: {i.from}</p>
                    <p className="text-emerald-300">Why: {i.whyImportant}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                <h3 className="text-sm font-semibold text-white/80">Risks</h3>
                <ul className="mt-1 space-y-1 text-xs text-amber-200">
                  {brief.risks.map((r, idx) => (
                    <li key={idx}>• {r}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          <pre className="mt-4 max-h-80 overflow-auto rounded-lg border border-white/10 bg-black/30 p-3 text-[11px] text-slate-200">
{prettyBrief}
          </pre>
        </section>
      )}

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-inner shadow-black/30 backdrop-blur">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Run History</h2>
          {historyError && <p className="text-sm text-amber-300">{historyError}</p>}
        </div>
        {runs.length === 0 ? (
          <p className="text-sm text-slate-300">No runs yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-left text-xs text-slate-200">
              <thead className="bg-white/5 text-slate-400">
                <tr>
                  <th className="px-2 py-2">Run ID</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-2 py-2">Started</th>
                  <th className="px-2 py-2">Finished</th>
                  <th className="px-2 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((r) => (
                  <tr key={r.runId} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-2 py-2 break-all text-emerald-200">{r.runId}</td>
                    <td className="px-2 py-2">{r.status}</td>
                    <td className="px-2 py-2">{r.startedAt}</td>
                    <td className="px-2 py-2">{r.finishedAt || '—'}</td>
                    <td className="px-2 py-2">
                      <button className="text-xs text-emerald-300 underline" onClick={() => handleViewRun(r.runId)}>
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4">
          <h3 className="text-sm font-semibold text-white/80">Selected Run</h3>
          {runDetail ? (
            <pre className="mt-2 max-h-72 overflow-auto rounded-lg border border-white/10 bg-black/30 p-3 text-[11px] text-slate-200">
{JSON.stringify(runDetail, null, 2)}
            </pre>
          ) : (
            <p className="text-sm text-slate-300">Select a run to view details.</p>
          )}
        </div>
      </section>
    </main>
  );
}
