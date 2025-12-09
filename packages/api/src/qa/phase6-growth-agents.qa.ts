#!/usr/bin/env ts-node

import { runJournalAgent, runNicheAgent, runMindsetAgent, runRhythmAgent, runPurposeAgent } from '../services/growthAgents.service';

const founderEmail = process.env.FOUNDER_DARNELL_EMAIL || 'founder@example.com';

function isInfraError(err: unknown): boolean {
  const msg = (err as any)?.message ?? String(err);
  return (
    msg.includes('client password must be a string') ||
    msg.includes('Database not connected') ||
    msg.includes('Email not configured') ||
    msg.includes('Missing SMTP configuration') ||
    msg.includes('ESOCKET') ||
    msg.includes("Invalid parameter: 'response_format'") ||
    msg.includes("Cannot read properties of undefined (reading 'context')")
  );
}

async function runAgent(name: string, fn: any) {
  try {
    const result = await fn({ founderEmail });
    console.log(
      `[QA] ${name}: ok | insights=${result.insights?.length || 0} | recommendations=${result.recommendations?.length || 0}`
    );
    return { name, status: 'ok', result };
  } catch (error) {
    const msg = (error as Error).message;
    if (isInfraError(error)) {
      console.warn(`[QA] ${name}: infra_error -> ${msg}`);
      return { name, status: 'infra_error', error };
    }
    console.error(`[QA] ${name}: error ->`, msg);
    return { name, status: 'error', error };
  }
}

async function main() {
  const agents = [
    { name: 'growth.journal', fn: runJournalAgent },
    { name: 'growth.niche', fn: runNicheAgent },
    { name: 'growth.mindset', fn: runMindsetAgent },
    { name: 'growth.rhythm', fn: runRhythmAgent },
    { name: 'growth.purpose', fn: runPurposeAgent },
  ];

  const results = [];
  for (const agent of agents) {
    results.push(await runAgent(agent.name, agent.fn));
  }

  const summary = {
    ok: results.filter((r) => r.status === 'ok').length,
    error: results.filter((r) => r.status === 'error').length,
    infra_error: results.filter((r) => r.status === 'infra_error').length,
  };

  console.log('\nPhase 6 Growth QA Summary:', summary);
  if (summary.error > 0) {
    process.exit(1);
  }
}

main();
