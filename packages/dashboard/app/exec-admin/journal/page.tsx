'use client';

import { useEffect, useMemo, useState } from 'react';
import { Copy, RefreshCw } from 'lucide-react';
import { fetchJson } from '@/lib/apiClient';

type JournalArtifact = {
  intent: 'journal.daily_reflection' | 'journal.midday_check_in' | 'journal.day_close';
  date: string;
  user: 'darnell' | 'shria';
  prompts: string[];
  responses: Array<{ question: string; answer: string }>;
  insights: string[];
  nextSteps: string[];
  mood: string | null;
  values: string[] | null;
};

type RunResponse = {
  runId: string;
  kind: 'p0.journal';
  status: string;
  artifact: JournalArtifact;
  warnings?: string[];
};

type RunItem = {
  runId: string;
  kind: string;
  status: string;
  createdAt: string;
  finishedAt?: string;
};

const intents: Array<JournalArtifact['intent']> = [
  'journal.daily_reflection',
  'journal.midday_check_in',
  'journal.day_close',
];

const postJson = async <T,>(path: string, body: any) => {
  return fetchJson<T>(path, {
    method: 'POST',
    body: JSON.stringify(body),
  });
};

export default function JournalPage() {
  const [user, setUser] = useState<'darnell' | 'shria'>('darnell');
  const [date, setDate] = useState('');
  const [loadingIntent, setLoadingIntent] = useState<JournalArtifact['intent'] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RunResponse | null>(null);
  const [history, setHistory] = useState<RunItem[]>([]);
  const [selectedRun, setSelectedRun] = useState<RunResponse | null>(null);

  const runDisplay = useMemo(() => selectedRun || result, [selectedRun, result]);

  const loadHistory = async () => {
    const data = await fetchJson<{ items: RunItem[]; limit: number }>(
      '/api/exec-admin/p0/journal/runs?limit=20'
    );
    setHistory(data.items || []);
  };

  useEffect(() => {
    loadHistory().catch((err) => setError((err as Error).message));
  }, []);

  const handleRun = async (intent: JournalArtifact['intent']) => {
    setLoadingIntent(intent);
    setError(null);
    try {
      const runId = crypto.randomUUID();
      const data = await postJson<RunResponse>('/api/exec-admin/p0/journal/run', {
        user,
        intent,
        date: date || undefined,
        runId,
      });
      setResult(data);
      setSelectedRun(data);
      await loadHistory();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoadingIntent(null);
    }
  };

  const handleViewRun = async (runId: string) => {
    try {
      const data = await fetchJson<RunResponse>(`/api/exec-admin/p0/journal/runs/${runId}`);
      setSelectedRun(data);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleCopy = async () => {
    if (!runDisplay?.artifact) return;
    await navigator.clipboard.writeText(JSON.stringify(runDisplay.artifact, null, 2));
  };

  return (
    <main className="space-y-8">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Exec Admin</p>
        <h1 className="text-3xl font-semibold text-white">P0 Journal</h1>
        <p className="text-sm text-slate-200">Run journaling intents and inspect stored artifacts.</p>
      </header>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/20 backdrop-blur">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm text-slate-300">
            User
            <select
              className="ml-2 rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white"
              value={user}
              onChange={(e) => setUser(e.target.value as 'darnell' | 'shria')}
            >
              <option value="darnell">darnell</option>
              <option value="shria">shria</option>
            </select>
          </label>
          <label className="text-sm text-slate-300">
            Date (optional)
            <input
              className="ml-2 rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              placeholder="YYYY-MM-DD"
            />
          </label>
          <div className="flex flex-1 flex-wrap gap-2">
            {intents.map((intent) => (
              <button
                key={intent}
                onClick={() => handleRun(intent)}
                disabled={loadingIntent !== null}
                className="rounded-full border border-white/20 px-3 py-2 text-xs text-white hover:bg-white/10 disabled:opacity-60"
              >
                {loadingIntent === intent ? 'Running…' : intent.split('.').slice(-1)[0].replace('_', ' ')}
              </button>
            ))}
          </div>
          <button
            onClick={loadHistory}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-2 text-xs text-slate-100 hover:bg-white/10"
          >
            <RefreshCw className="h-4 w-4" /> Refresh Runs
          </button>
        </div>
        {error && <p className="mt-4 text-sm text-rose-300">Error: {error}</p>}
      </section>

      {runDisplay && (
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/20 backdrop-blur space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="text-sm text-slate-200">
              <p>Run: {runDisplay.runId}</p>
              <p>Status: {runDisplay.status}</p>
              <p>Intent: {runDisplay.artifact.intent}</p>
            </div>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-2 text-xs text-slate-100 hover:bg-white/10"
            >
              <Copy className="h-4 w-4" /> Copy JSON
            </button>
          </div>

          {runDisplay.warnings?.length ? (
            <div className="rounded-lg border border-amber-300/20 bg-amber-300/10 p-3 text-sm text-amber-200">
              {runDisplay.warnings.join(' ')}
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-white">Prompts</h3>
              <ul className="space-y-2 text-sm text-slate-200">
                {runDisplay.artifact.prompts.map((prompt, idx) => (
                  <li key={idx} className="rounded-lg border border-white/10 bg-white/5 p-3">
                    {prompt}
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-white">Responses</h3>
              <ul className="space-y-2 text-sm text-slate-200">
                {runDisplay.artifact.responses.map((item, idx) => (
                  <li key={idx} className="rounded-lg border border-white/10 bg-white/5 p-3">
                    <p className="font-semibold">{item.question}</p>
                    <p className="text-slate-400">{item.answer || '—'}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-white">Insights</h3>
              <ul className="space-y-2 text-sm text-slate-200">
                {(runDisplay.artifact.insights.length ? runDisplay.artifact.insights : ['No insights yet']).map(
                  (item, idx) => (
                    <li key={idx} className="rounded-lg border border-white/10 bg-white/5 p-3">
                      {item}
                    </li>
                  )
                )}
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-white">Next Steps</h3>
              <ul className="space-y-2 text-sm text-slate-200">
                {(runDisplay.artifact.nextSteps.length ? runDisplay.artifact.nextSteps : ['No next steps yet']).map(
                  (item, idx) => (
                    <li key={idx} className="rounded-lg border border-white/10 bg-white/5 p-3">
                      {item}
                    </li>
                  )
                )}
              </ul>
            </div>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/20 backdrop-blur space-y-4">
        <h2 className="text-xl font-semibold text-white">Run History</h2>
        <div className="space-y-2 text-sm text-slate-200">
          {history.map((item) => (
            <div
              key={item.runId}
              className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3"
            >
              <div>
                <p className="font-semibold">{item.runId}</p>
                <p className="text-slate-400">
                  {item.status} • {item.createdAt}
                </p>
              </div>
              <button
                onClick={() => handleViewRun(item.runId)}
                className="rounded-full border border-white/20 px-3 py-2 text-xs text-white hover:bg-white/10"
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
