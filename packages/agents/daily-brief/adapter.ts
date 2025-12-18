import { AgentOutput } from '../../shared/contracts';
import logger from '../../core/src/utils/logger';
import { runDailyBriefWorkflow, DailyBriefPayload } from './service';

export async function runDailyBriefAdapter(payload: DailyBriefPayload | (DailyBriefPayload & { userId?: string })): Promise<AgentOutput<any>> {
  const user = (payload as any).user || (payload as any).userId;
  const normalized: DailyBriefPayload = { ...payload, user } as DailyBriefPayload;

  if (!normalized?.user) {
    return { status: 'FAILED', error: 'user is required' };
  }

  try {
    const result = await runDailyBriefWorkflow(normalized, { logger });
    return result;
  } catch (err: any) {
    logger.error('[DailyBriefAdapter] failed', { error: err?.message, runId: normalized.runId });
    return { status: 'FAILED', error: err?.message || 'daily brief failed' };
  }
}
