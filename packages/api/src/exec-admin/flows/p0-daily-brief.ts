import { randomUUID } from 'crypto';
import { runAgentsConcurrently } from '../../../../orchestrator/src/dispatcher';
import { ensureP0AgentsRegistered } from '../../orchestrator/registerP0Agents';
import logger from '../../utils/logger';
import { DailyBriefPayload, DailyBriefResult } from '../../../agents/daily-brief/service';
import { recordP0RunStart, updateP0Run } from '../../services/p0RunHistory.service';

export interface P0DailyBriefRequest {
  user: DailyBriefPayload['user'];
  date?: string;
  runId?: string;
}

export interface P0DailyBriefResponse {
  runId: string;
  brief: DailyBriefResult;
}

export async function runP0DailyBriefExecAdmin(req: P0DailyBriefRequest): Promise<P0DailyBriefResponse> {
  if (!req?.user) {
    throw new Error('user is required');
  }

  const runId = req.runId || randomUUID();
  const date = req.date || new Date().toISOString().slice(0, 10);
  const founderEmail =
    req.user === 'shria' ? process.env.FOUNDER_SHRIA_EMAIL || 'shria' : process.env.FOUNDER_DARNELL_EMAIL || 'darnell';
  const runRecord = await recordP0RunStart({
    founderEmail,
    date,
    force: true,
    runId,
    kind: 'p0.daily_brief',
  });

  ensureP0AgentsRegistered();
  logger.info('[ExecAdmin] daily-brief request', { user: req.user, runId, date: req.date });

  const result = await runAgentsConcurrently([
    {
      key: 'daily_brief.generate',
      payload: { user: req.user, date: req.date, runId },
    },
  ]);

  const brief = result['daily_brief.generate'];
  if (!brief?.success) {
    await updateP0Run(runRecord.runId, {
      status: 'failed',
      finishedAt: new Date().toISOString(),
      error: brief?.error || 'daily brief failed',
      artifact: brief?.output,
      kind: 'p0.daily_brief',
    });
    throw new Error(brief?.error || 'daily brief failed');
  }

  await updateP0Run(runRecord.runId, {
    status: 'complete',
    finishedAt: new Date().toISOString(),
    artifact: brief.output,
    kind: 'p0.daily_brief',
  });

  return { runId, brief: brief.output as DailyBriefResult };
}
