import { buildGrowthRunSummary } from './growthRunSummary.service';
import { getGrowthRun, updateGrowthRun } from './growthRunHistory.service';
import { orchestrator } from '../growth-agents/orchestrator';

export async function finalizeRunIfTerminal(runId: string) {
  const run = await getGrowthRun(runId);
  if (!run) return null;

  // best-effort monitor fetch
  let monitor: { progress?: any[]; events?: any[] } | undefined;
  try {
    const monitorData = await orchestrator.getMonitorData(50);
    monitor = { progress: monitorData.progress, events: monitorData.events };
  } catch {
    // ignore monitor failures
  }

  const summary = buildGrowthRunSummary(run, monitor);
  const { completed, failed, running, queued } = summary.agents;

  let status: 'running' | 'complete' | 'failed' = 'running';
  if (completed.length === summary.agents.launched.length) {
    status = 'complete';
  } else if (failed.length > 0 && running.length === 0 && queued.length === 0) {
    status = 'failed';
  }

  const updated = await updateGrowthRun(runId, {
    status,
    finishedAt: status !== 'running' ? new Date().toISOString() : run.finishedAt,
    lastProgressAt: new Date().toISOString(),
    summary: {
      topProgress: summary.progress.latest,
      topEvents: summary.events.latest,
      completedAgents: summary.agents.completed,
      failedAgents: summary.agents.failed,
    },
  });

  return { run: updated, summary };
}
