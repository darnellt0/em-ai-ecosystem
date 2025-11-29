import { AgentConfig } from '@/types/emAiAgents';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    // Ensure Next treats this as dynamic since agent states can change quickly.
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Request failed (${res.status})`);
  }

  return res.json();
}

export async function getAgents(): Promise<AgentConfig[]> {
  const data = await fetchJson<{ agents: AgentConfig[] }>('/em-ai/agents');
  return data.agents;
}

export async function getAgent(agentId: string): Promise<AgentConfig> {
  const res = await fetch(`${API_BASE_URL}/em-ai/agents/${agentId}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (res.status === 404) {
    throw new Error('NOT_FOUND');
  }

  if (!res.ok) {
    throw new Error(`Failed to load agent (${res.status})`);
  }

  const data = (await res.json()) as { agent: AgentConfig };
  return data.agent;
}
