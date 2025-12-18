"use client";

import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

async function fetchJson(path: string, opts?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(opts?.headers || {}) },
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

export default function ContentPipelinePage() {
  const [userId, setUserId] = useState("darnell");
  const [topic, setTopic] = useState("Elevated Movements strengths story");
  const [includeP0, setIncludeP0] = useState(true);
  const [packs, setPacks] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadList = async () => {
    try {
      setError(null);
      const data = await fetchJson("/api/content/packs");
      setPacks(data.packs || []);
    } catch (e: any) {
      setError(e.message);
    }
  };

  useEffect(() => {
    loadList();
  }, []);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const body = { userId, topic, includeP0 };
      await fetchJson("/api/content/packs/generate", { method: "POST", body: JSON.stringify(body) });
      await loadList();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const viewPack = async (packId: string) => {
    try {
      const data = await fetchJson(`/api/content/packs/${packId}`);
      setSelected(data.pack);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const download = () => {
    if (!selected) return;
    const blob = new Blob([JSON.stringify(selected, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selected.packId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Content Pipeline (PLAN-only)</h1>
      {error && <div className="text-red-600">{error}</div>}

      <section className="space-y-3 border p-4 rounded-md">
        <h2 className="font-semibold">Generate Pack</h2>
        <div className="flex flex-col gap-2">
          <input className="border p-2" value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="userId" />
          <input className="border p-2" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="topic" />
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={includeP0} onChange={(e) => setIncludeP0(e.target.checked)} />
            Include P0 Daily Focus
          </label>
          <button className="bg-blue-600 text-white px-3 py-2 rounded" onClick={generate} disabled={loading}>
            {loading ? "Generating..." : "Generate Pack"}
          </button>
        </div>
      </section>

      <section className="space-y-3 border p-4 rounded-md">
        <h2 className="font-semibold">Existing Packs</h2>
        <button className="underline text-blue-600" onClick={loadList}>
          Refresh
        </button>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                <th className="text-left">PackId</th>
                <th className="text-left">Created</th>
                <th className="text-left">Topic</th>
                <th className="text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {packs.map((p) => (
                <tr key={p.packId} className="hover:bg-gray-100 cursor-pointer" onClick={() => viewPack(p.packId)}>
                  <td>{p.packId}</td>
                  <td>{p.createdAt}</td>
                  <td>{p.topic}</td>
                  <td>{p.status}</td>
                </tr>
              ))}
              {packs.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-gray-500">
                    No packs yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selected && (
        <section className="space-y-3 border p-4 rounded-md">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Pack Detail: {selected.packId}</h2>
            <button className="underline" onClick={download}>
              Download JSON
            </button>
          </div>
          <div className="text-sm">Topic: {selected.topic}</div>
          <div className="text-sm">Status: {selected.status}</div>
          <div className="text-sm">Planned Actions: {selected.plannedActionIds?.length || 0}</div>
          <div className="space-y-2">
            <h3 className="font-semibold">Assets</h3>
            {selected.assets?.map((a: any) => (
              <div key={a.id} className="border p-2 rounded">
                <div className="text-xs uppercase text-gray-500">{a.channel}</div>
                <div className="font-semibold">{a.title}</div>
                <pre className="whitespace-pre-wrap text-xs">{a.body}</pre>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
