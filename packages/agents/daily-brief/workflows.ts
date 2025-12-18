import { AgentOutput } from '../../shared/contracts';
import { DailyBriefDependencies, DailyBriefPayload, DailyBriefResult, dailyBriefHealth, runDailyBriefService } from './service';

export interface DailyBriefWorkflowDeps extends DailyBriefDependencies {}

export async function runDailyBriefWorkflow(payload: DailyBriefPayload, deps: DailyBriefWorkflowDeps = {}): Promise<AgentOutput<DailyBriefResult>> {
  return runDailyBriefService(payload, deps);
}

export async function healthDailyBrief(deps: Pick<DailyBriefDependencies, 'version'> = {}) {
  return dailyBriefHealth(deps);
}
