import Link from 'next/link';
import type { AgentConfig } from '@/types/emAiAgents';

interface AgentCardProps {
  agent: AgentConfig;
}

export function AgentCard({ agent }: AgentCardProps) {
  return (
    <Link
      href={`/agents/${agent.id}`}
      className="group flex flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-card transition hover:-translate-y-1 hover:border-emerald-300/40"
    >
      <div>
        <div className="flex items-center justify-between text-sm uppercase tracking-[0.2em] text-white/60">
          <span>{agent.category}</span>
          <span>{agent.icon ?? '✨'}</span>
        </div>
        <h3 className="mt-4 text-2xl font-semibold text-white">{agent.name}</h3>
        <p className="mt-2 text-sm text-white/70">{agent.tagline}</p>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {(agent.tags ?? ['Ready']).map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-white/15 px-3 py-1 text-xs uppercase tracking-wide text-white/75 group-hover:border-emerald-300/50"
          >
            {tag}
          </span>
        ))}
      </div>
    </Link>
  );
}
