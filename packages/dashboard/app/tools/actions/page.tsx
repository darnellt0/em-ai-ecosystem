'use client';

import { useEffect, useState } from 'react';

import { API_BASE } from '@/lib/apiClient';

interface ActionItem {
  id: string;
  type: string;
  status: string;
  requiresApproval: boolean;
}

export default function ActionsToolPage() {
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchActions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/actions/pending`);
      const json = await res.json();
      setActions(json.actions || []);
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActions();
  }, []);

  const approve = async (id: string) => {
    setMessage(null);
    await fetch(`${API_BASE}/api/actions/${id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approvedBy: 'operator' }),
    });
    fetchActions();
  };

  const execute = async (id: string, mode: 'PLAN' | 'EXECUTE') => {
    setMessage(null);
    const res = await fetch(`${API_BASE}/api/actions/${id}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode }),
    });
    const json = await res.json();
    setMessage(`Receipt: ${json.receipt?.status || 'unknown'}`);
    fetchActions();
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Action Console</h1>
      <p className="text-sm text-slate-600">Approve and execute planned actions. EXECUTE is gated by feature flags.</p>
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold">Pending Actions</h2>
          <button className="px-3 py-1 text-sm bg-slate-800 text-white rounded" onClick={fetchActions} disabled={loading}>
            Refresh
          </button>
        </div>
        {loading && <p className="text-sm text-slate-500">Loading...</p>}
        {!loading && actions.length === 0 && <p className="text-sm text-slate-500">No pending actions.</p>}
        <ul className="divide-y divide-slate-200">
          {actions.map((a) => (
            <li key={a.id} className="py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{a.type}</p>
                  <p className="text-xs text-slate-500">ID: {a.id}</p>
                  <p className="text-xs text-slate-500">Status: {a.status}</p>
                  {a.requiresApproval && <p className="text-xs text-amber-600">Requires approval</p>}
                </div>
                <div className="space-x-2">
                  {a.requiresApproval && (
                    <button className="px-3 py-1 text-xs bg-amber-500 text-white rounded" onClick={() => approve(a.id)}>
                      Approve
                    </button>
                  )}
                  <button className="px-3 py-1 text-xs bg-slate-700 text-white rounded" onClick={() => execute(a.id, 'PLAN')}>
                    Execute (PLAN)
                  </button>
                  <button className="px-3 py-1 text-xs bg-slate-300 text-slate-800 rounded" disabled>
                    Execute (EXECUTE)
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      {message && <div className="text-sm text-slate-700"> {message} </div>}
    </div>
  );
}
