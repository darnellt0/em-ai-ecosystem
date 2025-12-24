import { runActionPack } from '../../../agents/action-pack/service';
import { startP0ArtifactRun, finalizeP0ArtifactRun } from './p0RunHistory.service';
import { runP0QaGate, QaGateResult } from './p0QaGate.service';

const ACTION_PACK_KIND = 'p0.action_pack';

export interface ActionPackRunInput {
  userId: 'darnell' | 'shria';
  date?: string;
  focusTheme?: string;
  priorities?: string[];
  runId?: string;
}

export interface ActionPackRunResult {
  runId: string;
  kind: string;
  status: 'success' | 'blocked' | 'fail';
  output: unknown;
  qa: QaGateResult;
  warnings?: string[];
}

export async function executeActionPackWithHistory(input: ActionPackRunInput): Promise<ActionPackRunResult> {
  const run = startP0ArtifactRun({ kind: ACTION_PACK_KIND, runId: input.runId });
  const date = input.date || new Date().toISOString().slice(0, 10);
  const warnings: string[] = [];

  let output: any;
  let status: ActionPackRunResult['status'] = 'success';

  try {
    output = await runActionPack({
      user: input.userId,
      date,
      focusTheme: input.focusTheme,
      priorities: input.priorities,
    });
  } catch (err: any) {
    warnings.push('action_pack_generation_failed');
    status = 'fail';
    output = {
      actions: [],
      followUps: [],
      calendarIntentsDraft: [],
      metadata: {
        userId: input.userId,
        generatedAt: new Date().toISOString(),
        focusTheme: input.focusTheme,
        blocked: true,
        blockReason: err?.message || 'action_pack_failed',
      },
    };
  }

  const qa = runP0QaGate('actionPack', output);
  if (!qa.qa_pass) {
    status = status === 'fail' ? status : 'blocked';
    output.metadata = {
      ...(output.metadata || {}),
      blocked: true,
      blockReason: qa.issues.map((issue) => issue.message).join('; '),
      qa,
    };
  }

  finalizeP0ArtifactRun(run.runId, {
    status: status === 'success' ? 'success' : 'fail',
    artifact: {
      input: {
        userId: input.userId,
        date,
        focusTheme: input.focusTheme,
        priorities: input.priorities,
      },
      output,
      qa,
      warnings: warnings.length ? warnings : undefined,
    },
    kind: ACTION_PACK_KIND,
  });

  return {
    runId: run.runId,
    kind: ACTION_PACK_KIND,
    status,
    output,
    qa,
    ...(warnings.length ? { warnings } : {}),
  };
}
