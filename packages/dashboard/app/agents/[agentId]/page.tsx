import { notFound } from 'next/navigation';
import { getAgent } from '@/lib/emAiAgents';
import { AgentRunner } from '@/components/agent-runner';

interface AgentPageProps {
  params: {
    agentId: string;
  };
}

export const dynamic = 'force-dynamic';

export default async function AgentPage({ params }: AgentPageProps) {
  let agent;

  try {
    agent = await getAgent(params.agentId);
  } catch (error) {
    if (error instanceof Error && error.message === 'NOT_FOUND') {
      notFound();
    }
    throw error;
  }

  return (
    <main className="space-y-10">
      <a href="/agents" className="text-sm text-white/60 underline-offset-4 hover:text-white hover:underline">
        ← Back to gallery
      </a>

      <header className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center gap-3 text-sm uppercase tracking-[0.3em] text-white/60">
          <span>{agent.icon ?? '✨'}</span>
          <span>{agent.category}</span>
        </div>
        <div>
          <h1 className="text-4xl font-semibold text-white">{agent.name}</h1>
          <p className="text-lg text-emerald-100/90">{agent.tagline}</p>
        </div>
        <p className="text-sm text-white/70">{agent.description}</p>
      </header>

      <AgentRunner agent={agent} />
    </main>
  );
}
