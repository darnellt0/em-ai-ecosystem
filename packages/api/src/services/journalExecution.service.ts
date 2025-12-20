import { runJournalAgent } from './journal.service';
import { buildJournalArtifact, getJournalPrompts, JournalArtifact, JournalIntent } from '../../../agents/journal';
import { finalizeP0ArtifactRun, startP0ArtifactRun } from './p0RunHistory.service';

const JOURNAL_KIND = 'p0.journal';

export async function executeJournalWithHistory(input: {
  user: 'darnell' | 'shria';
  intent: JournalIntent;
  date?: string;
  runId?: string;
}): Promise<{ runId: string; artifact: JournalArtifact; status: 'success' | 'fail'; warnings?: string[] }> {
  const run = startP0ArtifactRun({ kind: JOURNAL_KIND, runId: input.runId });
  const warnings: string[] = [];
  let artifact: JournalArtifact;
  let status: 'success' | 'fail' = 'success';
  const resolvedDate = input.date || new Date().toISOString().slice(0, 10);

  try {
    artifact = await runJournalAgent({
      user: input.user,
      intent: input.intent,
      date: resolvedDate,
    });
  } catch (err) {
    warnings.push('Journal generation failed; returning placeholder output.');
    artifact = buildJournalArtifact({
      intent: input.intent,
      user: input.user,
      date: resolvedDate,
      prompts: getJournalPrompts(input.intent),
    });
    status = 'fail';
  }

  const finalized = finalizeP0ArtifactRun(run.runId, { status, artifact, kind: JOURNAL_KIND });

  return {
    runId: finalized.runId,
    artifact,
    status: finalized.status,
    warnings: warnings.length ? warnings : undefined,
  };
}

export function formatJournalPromptsForVoice(artifact: JournalArtifact): string {
  if (!artifact?.prompts || artifact.prompts.length === 0) {
    return 'No prompts were generated.';
  }
  return artifact.prompts.map((prompt, idx) => `${idx + 1}. ${prompt}`).join('\n');
}
