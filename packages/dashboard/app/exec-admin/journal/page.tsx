'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Copy, RefreshCw } from 'lucide-react';
import { fetchJson } from '@/lib/apiClient';

type JournalArtifact = {
  intent: 'journal.daily_reflection' | 'journal.midday_check_in' | 'journal.day_close';
  date: string;
  user: 'darnell' | 'shria';
  prompts: string[];
  responses: { question: string; answer: string }[];
  insights: string[];
  nextSteps: string[];
  mood: string | null;
  values: string[] | null;
};

type RunRecord = {
  runId: string;
  status: string;
  createdAt: string;
  finishedAt?: string;
  artifact?: JournalArtifact;
};

const postJson = async <T,>(path: string, body: any) => {
  return fetchJson<T>(path, {
    method: 'POST',
    body: JSON.stringify(body),
  });
};

const intents: JournalArtifact['intent'][] = [
  'journal.daily_reflection',
  'journal.midday_check_in',
  'journal.day_close',
];

export default function JournalPage() {
  const [user, setUser] = useState<'darnell' | 'shria'>('darnell');
  const [date, setDate] = useState('');
  const [loadingIntent, setLoadingIntent] = useState<JournalArtifact['intent'] | null>(null);
  const [artifact, setArtifact] = useState<JournalArtifact | null>(null);
  const [runId, setRunId] = useState<string | null>(null);
  const [runs, setRuns] = useState<RunRecord[]>([]);
  const [runDetail, setRunDetail] = useState<RunRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const prettyArtifact = useMemo(() => (artifact ? JSON.stringify(artifact, null, 2) : ''), [artifact]);

  const loadRuns = async () => {
    try {
      setHistoryError(null);
      const data = await fetchJson<{ items: RunRecord[] }>(
        `/api/exec-admin/p0/journal/runs?limit=20`
      );
      setRuns(data.items || []);
    } catch (err) {
      setHistoryError((err as Error).message);
    }
  };

  useEffect(() => {
    loadRuns();
  }, [user]);

  const handleRun = async (intent: JournalArtifact['intent']) => {
    setLoadingIntent(intent);
    setError(null);
    const newRunId = crypto.randomUUID();
    try {
      const res = await postJson<{ runId: string; status: string; artifact: JournalArtifact }>(
        '/api/exec-admin/p0/journal/run',
        { user, intent, date: date || undefined, runId: newRunId }
      );
      setArtifact(res.artifact);
      setRunId(res.runId);
      setRunDetail({ runId: res.runId, status: res.status, createdAt: new Date().toISOString(), artifact: res.artifact });
      await loadRuns();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoadingIntent(null);
    }
  };

  const handleCopy = async () => {
    if (!artifact) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(artifact, null, 2));
    } catch {
      // ignore
    }
  };

  const handleViewRun = async (id: string) => {
    try {
      const data = await fetchJson<RunRecord>(`/api/exec-admin/p0/journal/runs/${id}`);
      setRunDetail(data);
      if (data?.artifact) {
        setArtifact(data.artifact);
        setRunId(data.runId);
      }
    } catch {
      setRunDetail({ runId: id, status: 'error', createdAt: '', artifact: undefined });
    }
  };

  return (
    <main className="space-y-8">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Exec Admin</p>
        <h1 className="text-3xl font-semibold text-white">P0 Journal</h1>
        <p className="text-sm text-slate-200">Run journaling intents and review stored artifacts.</p>
      </header>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/20 backdrop-blur">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-white">Run Journal Intent</h2>
            <p className="text-sm text-slate-300">Calls /api/exec-admin/p0/journal/run.</p>
          </div>
          <button
            onClick={loadRuns}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1 text-xs text-slate-100 hover:bg-white/10"
          >
            <RefreshCw className="h-4 w-4" /> Refresh Runs
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <label className="space-y-1 text-sm text-slate-200">
            User
            <select
              className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-white"
              value={user}
              onChange={(e) => setUser(e.target.value as 'darnell' | 'shria')}
            >
              <option value="darnell">darnell</option>
              <option value="shria">shria</option>
            </select>
          </label>
          <label className="space-y-1 text-sm text-slate-200">
            Date (optional)
            <input
              className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-white"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              placeholder="YYYY-MM-DD"
            />
          </label>
          <div className="flex flex-col gap-2">
            {intents.map((intent) => (
              <button
                key={intent}
                onClick={() => handleRun(intent)}
                disabled={loadingIntent !== null}
                className="inline-flex items-center justify-between rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-white/90 disabled:opacity-60"
              >
                <span>{intent.split('.').slice(-1)[0].replace('_', ' ')}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            ))}
          </div>
        </div>
        {error && <p className="mt-3 text-sm text-rose-300">Error: {error}</p>}
      </section>

      <section className="grid gap-6 md:grid-cols-[2fr,1fr]">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/20">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Latest Artifact</h2>
              <p className="text-sm text-slate-300">Run ID: {runId || '—'}</p>
            </div>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1 text-xs text-slate-100 hover:bg-white/10"
            >
              <Copy className="h-4 w-4" /> Copy JSON
            </button>
          </div>

          {artifact ? (
            <div className="mt-4 space-y-4 text-sm text-slate-200">
              <div className="rounded-xl border border-white/10 bg-slate-950/50 p-4">
                <p className="font-semibold">Intent</p>
                <p>{artifact.intent}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-950/50 p-4">
                <p className="font-semibold">Prompts</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {artifact.prompts.map((prompt) => (
                    <li key={prompt}>{prompt}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-950/50 p-4">
                <p className="font-semibold">Responses</p>
                <ul className="mt-2 space-y-2">
                  {artifact.responses.map((item) => (
                    <li key={item.question} className="rounded-lg border border-white/10 bg-white/5 p-2">
                      <p className="font-semibold">{item.question}</p>
                      <p className="text-slate-300">{item.answer || '—'}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-400">No journal artifact yet.</p>
          )}
        </div>

        <aside className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/20">
          <h2 className="text-lg font-semibold text-white">Run History</h2>
          {historyError && <p className="mt-2 text-xs text-rose-300">{historyError}</p>}
          <ul className="mt-4 space-y-3 text-sm">
            {runs.map((run) => (
              <li key={run.runId} className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
                <p className="font-semibold text-slate-100">{run.runId}</p>
                <p className="text-xs text-slate-400">{run.status}</p>
                <button
                  onClick={() => handleViewRun(run.runId)}
                  className="mt-2 inline-flex items-center gap-2 text-xs text-slate-100 hover:text-white"
                >
                  View <ArrowRight className="h-3 w-3" />
                </button>
              </li>
            ))}
          </ul>
        </aside>
      </section>

      {runDetail && (
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-slate-200">
          <h2 className="text-lg font-semibold text-white">Selected Run</h2>
          <pre className="mt-3 max-h-80 overflow-auto rounded-xl bg-slate-950/60 p-4 text-xs text-slate-100">
            {JSON.stringify(runDetail, null, 2)}
          </pre>
        </section>
      )}

      {artifact && (
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-slate-200">
          <h2 className="text-lg font-semibold text-white">Raw JSON</h2>
          <pre className="mt-3 max-h-80 overflow-auto rounded-xl bg-slate-950/60 p-4 text-xs text-slate-100">
            {prettyArtifact}
          </pre>
        </section>
      )}
    </main>
  );
}
