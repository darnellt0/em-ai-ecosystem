import { getAgents } from '@/lib/emAiAgents';
import { AgentCard } from '@/components/agent-card';

export const dynamic = 'force-dynamic';

export default async function AgentsPage() {
  const agents = await getAgents();

  return (
    <main className="space-y-10">
      <header className="space-y-3 text-center">
        <p className="text-sm uppercase tracking-[0.35em] text-emerald-200/80">EM AI Tools</p>
        <h1 className="text-4xl font-semibold text-white">Agent Gallery</h1>
        <p className="text-base text-white/70">
          Inspired by Goblin.tools—each tile is a focused agent you can open, configure, and run instantly.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {agents.map((agent) => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </section>
    </main>
  );
}
