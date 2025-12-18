import { randomUUID } from 'crypto';
import { runAgentsConcurrently } from '@em/orchestrator/dispatcher';
import { ensureP0AgentsRegistered } from '../../orchestrator/registerP0Agents';
import logger from '../../../core/src/utils/logger';
import { DailyBriefPayload, DailyBriefResult } from '../../../agents/daily-brief/service';

export interface P0DailyBriefRequest {
  user: DailyBriefPayload['user'];
  date?: string;
  runId?: string;
}

export async function runP0DailyBriefExecAdmin(req: P0DailyBriefRequest): Promise<DailyBriefResult> {
  if (!req?.user) {
    throw new Error('user is required');
  }

  const runId = req.runId || randomUUID();
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
    throw new Error(brief?.error || 'daily brief failed');
  }

  return brief.output as DailyBriefResult;
}
