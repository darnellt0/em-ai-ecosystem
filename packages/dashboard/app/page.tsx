import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="space-y-10">
      <section className="section-shell">
        <p className="text-sm uppercase tracking-[0.3em] text-white/60">Elevated Movements</p>
        <h1 className="mt-4 text-4xl font-semibold leading-tight text-white">
          EM AI Agent Gallery
        </h1>
        <p className="mt-4 text-lg text-white/70">
          Explore focused agents that mirror the Goblin.tools experience—each ready with guided inputs and
          orchestrated responses.
        </p>
        <Link
          href="/agents"
          className="mt-6 inline-flex items-center rounded-full bg-emerald-400/80 px-6 py-3 text-base font-semibold text-black shadow-card transition hover:bg-emerald-300"
        >
          Browse Agents
        </Link>
      </section>
    </main>
  );
}
