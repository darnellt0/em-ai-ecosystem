import { API_BASE, fetchJson } from '@/lib/apiClient';
import { AgentConfig } from '@/types/emAiAgents';

export async function getAgents(): Promise<AgentConfig[]> {
  const data = await fetchJson<{ agents: AgentConfig[] }>('/em-ai/agents');
  return data.agents;
}

export async function getAgent(agentId: string): Promise<AgentConfig> {
  const res = await fetch(`${API_BASE}/em-ai/agents/${agentId}`, {
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
