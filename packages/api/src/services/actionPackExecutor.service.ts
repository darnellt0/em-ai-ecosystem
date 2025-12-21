import { recordP0RunStart, updateP0Run, getP0Run } from './p0RunHistory.service';
import { ensureToolHandlersRegistered } from '../tools/registerTools';
import { runToolByName } from '../tools/tool.registry';

export interface ActionPackExecutorInput {
  userId: string;
  runId?: string;
  actionPack?: any;
  actions?: string[];
  force?: boolean;
}

export interface ActionExecutionResult {
  tool: string;
  action: string;
  success: boolean;
  data?: any;
  error?: string;
}

interface ActionStatusRecord {
  status: 'success' | 'failed' | 'partial';
  executedAt: string;
  resultsCount: number;
  lastResult?: any;
  skippedAt?: string;
}

function normalizeActions(actions?: string[]): string[] {
  if (!actions || !actions.length) return ['calendar', 'tasks', 'capture'];
  return actions.map((a) => a.toLowerCase());
}

function validateActionPack(pack: any): string[] {
  if (!pack || typeof pack !== 'object') return ['actionPack must be an object'];
  const hasTasks = Array.isArray(pack.tasks) && pack.tasks.length > 0;
  const hasSchedule = Array.isArray(pack.scheduleBlocks) && pack.scheduleBlocks.length > 0;
  const hasPriorities = Array.isArray(pack.priorities) && pack.priorities.length > 0;
  if (!hasTasks && !hasSchedule && !hasPriorities) {
    return ['actionPack must include tasks, scheduleBlocks, or priorities'];
  }
  return [];
}

function resolveActionPackFromRun(runRecord: any) {
  const candidates = [
    runRecord?.outputSnapshot?.actionPack,
    runRecord?.outputSnapshot?.action_pack,
    runRecord?.outputSnapshot?.data?.actionPack,
    runRecord?.outputSnapshot?.data?.action_pack,
    runRecord?.actionPack,
    runRecord?.data?.actionPack,
    runRecord?.artifact?.actionPack,
  ];
  return candidates.find((item) => item && typeof item === 'object') || null;
}

export async function executeActionPack(input: ActionPackExecutorInput) {
  if (!input.userId) {
    return { success: false, error: 'userId is required', statusCode: 400 };
  }

  ensureToolHandlersRegistered();

  let resolvedRunId = input.runId;
  let runRecord: any = null;
  let actionPack = input.actionPack;
  if (resolvedRunId) {
    runRecord = await getP0Run(resolvedRunId);
    if (!runRecord) {
      return { success: false, error: `runId ${resolvedRunId} not found`, statusCode: 404 };
    }
    const fromRun = resolveActionPackFromRun(runRecord);
    actionPack = fromRun;
    if (!actionPack) {
      return { success: false, error: `actionPack not found for runId ${resolvedRunId}`, statusCode: 400 };
    }
  }

  if (!actionPack) {
    return { success: false, error: 'actionPack is required when run history does not include one', statusCode: 400 };
  }

  const validationErrors = validateActionPack(actionPack);
  if (validationErrors.length) {
    return { success: false, error: validationErrors.join('; '), statusCode: 400 };
  }

  const actions = normalizeActions(input.actions);
  const results: ActionExecutionResult[] = [];
  const prevResults: ActionExecutionResult[] = runRecord?.p1ExecutionResults?.results || [];
  const prevActionStatus: Record<string, ActionStatusRecord> = runRecord?.p1ExecutionResults?.actions || {};
  const actionStatus: Record<string, ActionStatusRecord> = { ...prevActionStatus };

  const shouldSkip = (key: string) => {
    return !input.force && prevActionStatus[key]?.status === 'success';
  };

  if (actions.includes('calendar')) {
    if (shouldSkip('calendar')) {
      results.push({
        tool: 'calendar',
        action: 'skip',
        success: true,
        data: { skipped: true, reason: 'already executed', runId: resolvedRunId },
      });
    } else if (Array.isArray(actionPack.scheduleBlocks)) {
      for (const block of actionPack.scheduleBlocks) {
        const title = block?.title || block?.theme || 'Focus Block';
        const start = block?.start || block?.startTime;
        const end = block?.end || block?.endTime;
        const payload = {
          title,
          start,
          end,
          description: block?.description,
          attendees: block?.attendees,
          timezone: block?.timezone || block?.timeZone,
          location: block?.location,
          calendarId: block?.calendarId,
          eventId: block?.eventId,
        };
        const toolName = payload.eventId ? 'calendar.update_event' : 'calendar.create_event';
        const res = await runToolByName(toolName, payload);
        results.push({
          tool: 'calendar',
          action: toolName.split('.')[1],
          success: res.ok,
          data: res.output,
          error: res.error?.message,
        });
      }
    }
  }

  if (actions.includes('tasks')) {
    if (shouldSkip('tasks')) {
      results.push({
        tool: 'tasks',
        action: 'skip',
        success: true,
        data: { skipped: true, reason: 'already executed', runId: resolvedRunId },
      });
    } else if (Array.isArray(actionPack.tasks)) {
      for (const task of actionPack.tasks) {
        const payload = {
          title: task?.title || task?.detail || 'Task',
          notes: task?.detail,
          priority: task?.priority,
          dueDate: task?.dueDate,
          userId: input.userId,
        };
        const res = await runToolByName('tasks.create_task', payload);
        results.push({
          tool: 'tasks',
          action: 'create_task',
          success: res.ok,
          data: res.output,
          error: res.error?.message,
        });
      }
    }
  }

  if (actions.includes('capture')) {
    if (shouldSkip('capture')) {
      results.push({
        tool: 'capture',
        action: 'skip',
        success: true,
        data: { skipped: true, reason: 'already executed', runId: resolvedRunId },
      });
    } else {
      const summary =
        actionPack.summary ||
        actionPack.focusNarrative ||
        actionPack.status ||
        'P1 Action Pack executed';
      const res = await runToolByName('capture.post_note', {
        summary: `[P1] ${summary}`,
        userId: input.userId,
      });
      results.push({
        tool: 'capture',
        action: 'post_note',
        success: res.ok,
        data: res.output,
        error: res.error?.message,
      });
    }
  }

  const overallSuccess = results.every((r) => r.success);
  const now = new Date().toISOString();

  let createdNewRun = false;
  if (!resolvedRunId || !runRecord) {
    const date = now.slice(0, 10);
    const record = await recordP0RunStart({
      founderEmail: input.userId,
      date,
      force: true,
      kind: 'p1.action_pack_execution',
      runId: resolvedRunId,
    });
    resolvedRunId = record.runId;
    createdNewRun = true;
  }

  const updateActionStatus = (key: string, actionResults: ActionExecutionResult[]) => {
    if (!actionResults.length) return;
    const success = actionResults.every((r) => r.success);
    const partial = actionResults.some((r) => r.success) && !success;
    actionStatus[key] = {
      status: success ? 'success' : partial ? 'partial' : 'failed',
      executedAt: now,
      resultsCount: actionResults.length,
      lastResult: actionResults[actionResults.length - 1],
      skippedAt: actionResults.every((r) => r.data?.skipped) ? now : actionStatus[key]?.skippedAt,
    };
  };

  updateActionStatus('calendar', results.filter((r) => r.tool === 'calendar'));
  updateActionStatus('tasks', results.filter((r) => r.tool === 'tasks'));
  updateActionStatus('capture', results.filter((r) => r.tool === 'capture'));

  await updateP0Run(resolvedRunId, {
    finishedAt: now,
    p1ExecutionResults: {
      success: overallSuccess,
      results: [...prevResults, ...results],
      executedAt: now,
      actions: actionStatus,
    },
    ...(createdNewRun ? { kind: 'p1.action_pack_execution' } : {}),
  });

  return { success: overallSuccess, runId: resolvedRunId, results };
}
