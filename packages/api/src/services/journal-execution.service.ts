/**
 * Canonical Journal Execution Service
 *
 * This service provides the single source of truth for executing journal agents
 * with proper run history recording via p0RunHistory.service.
 *
 * Used by:
 * - POST /api/exec-admin/p0/journal/run (exec-admin router)
 * - POST /api/voice/turn (voice turn router via hybrid router)
 */

import { JournalArtifact, JournalIntent, buildJournalArtifact, getJournalPrompts } from '../../../agents/journal';
import { runJournalAgent } from './journal.service';
import { startP0ArtifactRun, finalizeP0ArtifactRun } from './p0RunHistory.service';

const JOURNAL_KIND = 'p0.journal';

export interface JournalExecutionInput {
  user: 'darnell' | 'shria';
  intent: JournalIntent;
  date?: string;
  runId?: string; // Optional: if provided, will be used instead of generating new UUID
}

export interface JournalExecutionResult {
  runId: string; // UUID from p0RunHistory
  kind: string;
  status: 'success' | 'fail';
  artifact: JournalArtifact;
  warnings?: string[];
}

/**
 * Execute a journal agent and record in run history
 * This is the canonical implementation used by all journal execution paths
 */
export async function executeJournalWithHistory(
  input: JournalExecutionInput
): Promise<JournalExecutionResult> {
  const kind = JOURNAL_KIND;

  // Start run and get UUID runId
  const run = startP0ArtifactRun({ kind, runId: input.runId });

  const warnings: string[] = [];
  let artifact: JournalArtifact;
  let status: 'success' | 'fail' = 'success';
  const resolvedDate = input.date || new Date().toISOString().slice(0, 10);

  try {
    // Execute journal agent
    artifact = await runJournalAgent({
      user: input.user,
      intent: input.intent,
      date: input.date,
    });
  } catch (err) {
    // Fallback to placeholder on failure
    warnings.push('Journal generation failed; returning placeholder output.');
    artifact = buildJournalArtifact({
      intent: input.intent,
      user: input.user,
      date: resolvedDate,
      prompts: getJournalPrompts(input.intent),
    });
    status = 'fail';
  }

  // Finalize run and persist to history
  const finalized = finalizeP0ArtifactRun(run.runId, { status, artifact, kind });

  return {
    runId: finalized.runId,
    kind,
    status: finalized.status,
    artifact,
    ...(warnings.length ? { warnings } : {}),
  };
}

/**
 * Format journal prompts for display in voice responses
 */
export function formatJournalPromptsForVoice(artifact: JournalArtifact): string {
  const promptList = artifact.prompts.map((p, i) => `${i + 1}. ${p}`).join('\n');
  return `Here are your ${artifact.intent.replace('journal.', '').replace('_', ' ')} prompts:\n\n${promptList}`;
}
