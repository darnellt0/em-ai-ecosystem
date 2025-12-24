import { runDailyFocus } from '../../../agents/daily-focus/service';
import { DailyFocusPriority } from '../../../agents/daily-focus/adapter';
import { startP0ArtifactRun, finalizeP0ArtifactRun } from './p0RunHistory.service';
import { runP0QaGate, QaGateResult } from './p0QaGate.service';

const DAILY_FOCUS_KIND = 'p0.daily_focus';

export interface DailyFocusRunInput {
  userId: 'darnell' | 'shria';
  mode?: 'founder' | 'operator' | 'client_preview';
  date?: string;
  focusTheme?: string;
  priorities?: DailyFocusPriority[];
  runId?: string;
}

export interface DailyFocusRunResult {
  runId: string;
  kind: string;
  status: 'success' | 'blocked' | 'fail';
  output: unknown;
  qa: QaGateResult;
  warnings?: string[];
}

export async function executeDailyFocusWithHistory(input: DailyFocusRunInput): Promise<DailyFocusRunResult> {
  const run = startP0ArtifactRun({ kind: DAILY_FOCUS_KIND, runId: input.runId });
  const date = input.date || new Date().toISOString().slice(0, 10);
  const warnings: string[] = [];

  let output: any;
  let status: DailyFocusRunResult['status'] = 'success';

  try {
    output = await runDailyFocus({
      user: input.userId,
      date,
      mode: input.mode,
      focusTheme: input.focusTheme,
      priorities: input.priorities,
    });
  } catch (err: any) {
    warnings.push('daily_focus_generation_failed');
    status = 'fail';
    output = {
      focusTheme: input.focusTheme || 'Daily Focus unavailable',
      priorities: input.priorities || [],
      emailDraft: {
        subject: 'Daily Focus Draft (blocked)',
        body: 'Draft-only: Daily Focus generation failed.',
        status: 'draft',
      },
      metadata: {
        userId: input.userId,
        mode: input.mode || 'founder',
        generatedAt: new Date().toISOString(),
        blocked: true,
        blockReason: err?.message || 'daily_focus_failed',
      },
    };
  }

  const qa = runP0QaGate('dailyFocus', output);
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
        mode: input.mode || 'founder',
        date,
        focusTheme: input.focusTheme,
      },
      output,
      qa,
      warnings: warnings.length ? warnings : undefined,
    },
    kind: DAILY_FOCUS_KIND,
  });

  return {
    runId: run.runId,
    kind: DAILY_FOCUS_KIND,
    status,
    output,
    qa,
    ...(warnings.length ? { warnings } : {}),
  };
}
