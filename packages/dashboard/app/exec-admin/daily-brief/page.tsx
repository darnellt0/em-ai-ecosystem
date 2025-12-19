/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { useEffect, useMemo, useState } from 'react';

type DailyBriefArtifact = {
  date: string;
  topPriorities: Array<{ title: string; why: string; nextStep: string }>;
  focusBlock: { start: string; end: string; theme: string };
  calendarSummary: { meetings: number; highlights: string[] };
  inboxHighlights: { items: Array<{ from: string; subject: string; whyImportant: string }> };
  risks: string[];
  suggestedActions: Array<{ type: 'task' | 'email_draft' | 'calendar_block'; title: string; details: string }>;
};

type RunResponse = {
  runId: string;
  kind: 'p0.daily_brief';
  status: string;
  artifact: DailyBriefArtifact;
  warnings?: string[];
};

type RunItem = {
  runId: string;
  kind: string;
  status: string;
  createdAt: string;
  finishedAt?: string;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';
const showApiWarning =
  process.env.NODE_ENV === 'development' && !process.env.NEXT_PUBLIC_API_BASE_URL;

const fetchJson = async <T,>(path: string, init?: RequestInit): Promise<T> => {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Request failed (${res.status})`);
  }

  return res.json() as Promise<T>;
};

export default function DailyBriefExecAdminPage() {
  const [user, setUser] = useState('darnell');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RunResponse | null>(null);
  const [history, setHistory] = useState<RunItem[]>([]);
  const [selectedRun, setSelectedRun] = useState<RunResponse | null>(null);

  const loadHistory = async () => {
    const data = await fetchJson<{ items: RunItem[]; limit: number }>(
      '/api/exec-admin/p0/daily-brief/runs?limit=20'
    );
    setHistory(data.items || []);
  };

  useEffect(() => {
    loadHistory().catch((err) => setError((err as Error).message));
  }, []);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const runId = crypto.randomUUID();
      const body = JSON.stringify({
        user,
        date: date || undefined,
        runId,
      });
      const data = await fetchJson<RunResponse>('/api/exec-admin/p0/daily-brief', {
        method: 'POST',
        body,
      });
      setResult(data);
      setSelectedRun(data);
      await loadHistory();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewRun = async (runId: string) => {
    try {
      const data = await fetchJson<RunResponse>(`/api/exec-admin/p0/daily-brief/runs/${runId}`);
      setSelectedRun(data);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleCopyJson = async () => {
    if (!selectedRun?.artifact) return;
    await navigator.clipboard.writeText(JSON.stringify(selectedRun.artifact, null, 2));
  };

  const runDisplay = useMemo(() => selectedRun || result, [selectedRun, result]);

  return (
    <main className="space-y-8">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.3em] text-sky-200/80">Exec Admin</p>
        <h1 className="text-3xl font-semibold text-white">Daily Brief</h1>
        <p className="text-sm text-white/70">Generate and review P0 Daily Brief runs</p>
      </header>

      {showApiWarning && (
        <section className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-200">
          NEXT_PUBLIC_API_BASE_URL is not set; requests will use the current origin.
        </section>
      )}

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/20 space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <label className="space-y-1 text-sm text-white/70">
            User
            <select
              className="w-full rounded-xl bg-slate-900/60 border border-white/10 px-3 py-2 text-white"
              value={user}
              onChange={(e) => setUser(e.target.value)}
            >
              <option value="darnell">darnell</option>
              <option value="shria">shria</option>
            </select>
          </label>
          <label className="space-y-1 text-sm text-white/70">
            Date (optional)
            <input
              className="w-full rounded-xl bg-slate-900/60 border border-white/10 px-3 py-2 text-white"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              placeholder="YYYY-MM-DD"
            />
          </label>
          <div className="flex items-end">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full rounded-xl bg-white text-slate-900 font-semibold px-4 py-2 hover:bg-white/90 disabled:opacity-60"
            >
              {loading ? 'Generating…' : 'Generate Daily Brief'}
            </button>
          </div>
        </div>
        {error && <p className="text-sm text-rose-300">Error: {error}</p>}
      </section>

      {runDisplay && (
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/20 space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-white/70">
              <p>Run: {runDisplay.runId}</p>
              <p>Status: {runDisplay.status}</p>
            </div>
            <button
              onClick={handleCopyJson}
              className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white hover:bg-white/20"
            >
              Copy JSON
            </button>
          </div>

          {runDisplay.warnings?.length ? (
            <div className="rounded-lg border border-amber-300/20 bg-amber-300/10 p-3 text-sm text-amber-200">
              {runDisplay.warnings.join(' ')}
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-white">Top Priorities</h3>
              <ul className="space-y-2 text-sm text-white/80">
                {runDisplay.artifact.topPriorities.map((item, idx) => (
                  <li key={idx} className="rounded-lg border border-white/10 bg-white/5 p-3">
                    <p className="font-semibold">{item.title}</p>
                    <p className="text-white/60">{item.why}</p>
                    <p className="text-white/60">Next: {item.nextStep}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-white">Focus Block</h3>
              <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-white/80">
                <p>{runDisplay.artifact.focusBlock.theme}</p>
                <p>
                  {runDisplay.artifact.focusBlock.start} → {runDisplay.artifact.focusBlock.end}
                </p>
              </div>

              <h3 className="text-lg font-semibold text-white mt-4">Calendar Summary</h3>
              <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-white/80">
                <p>Meetings: {runDisplay.artifact.calendarSummary.meetings}</p>
                <ul className="list-disc list-inside">
                  {runDisplay.artifact.calendarSummary.highlights.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-white">Inbox Highlights</h3>
              <ul className="space-y-2 text-sm text-white/80">
                {runDisplay.artifact.inboxHighlights.items.map((item, idx) => (
                  <li key={idx} className="rounded-lg border border-white/10 bg-white/5 p-3">
                    <p className="font-semibold">{item.subject}</p>
                    <p className="text-white/60">{item.from}</p>
                    <p className="text-white/60">{item.whyImportant}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-white">Suggested Actions</h3>
              <ul className="space-y-2 text-sm text-white/80">
                {runDisplay.artifact.suggestedActions.map((item, idx) => (
                  <li key={idx} className="rounded-lg border border-white/10 bg-white/5 p-3">
                    <p className="font-semibold">{item.title}</p>
                    <p className="text-white/60">{item.type}</p>
                    <p className="text-white/60">{item.details}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/20 space-y-4">
        <h2 className="text-xl font-semibold text-white">Run History</h2>
        <div className="space-y-2 text-sm text-white/80">
          {history.map((item) => (
            <div
              key={item.runId}
              className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3"
            >
              <div>
                <p className="font-semibold">{item.runId}</p>
                <p className="text-white/60">
                  {item.status} • {item.createdAt}
                </p>
              </div>
              <button
                onClick={() => handleViewRun(item.runId)}
                className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-xs text-white hover:bg-white/20"
              >
                View
              </button>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
