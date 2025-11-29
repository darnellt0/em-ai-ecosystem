export default function AgentNotFound() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center space-y-4 text-center">
      <p className="text-sm uppercase tracking-[0.3em] text-white/50">Agent</p>
      <h1 className="text-4xl font-semibold text-white">We could not find that agent.</h1>
      <a href="/agents" className="text-emerald-200 underline-offset-4 hover:underline">
        Return to the gallery
      </a>
    </main>
  );
}
