import { finalizeRunIfTerminal } from '../services/growthRunFinalize.service';
import { getLatestGrowthRun } from '../services/growthRunHistory.service';

export function scheduleGrowthFinalizeCron(
  appLogger: Console | { log: (...args: any[]) => void; error: (...args: any[]) => void } = console
) {
  if (process.env.NODE_ENV === 'test') {
    appLogger.log('[GrowthFinalize] Skipped in test mode');
    return;
  }
  if (process.env.ENABLE_GROWTH_FINALIZER !== 'true') {
    appLogger.log('[GrowthFinalize] Disabled (set ENABLE_GROWTH_FINALIZER=true to enable)');
    return;
  }

  const intervalMs = Number(process.env.GROWTH_FINALIZER_INTERVAL_MS || 30000);
  const founders = (process.env.FOUNDER_EMAILS || process.env.FOUNDER_SHRIA_EMAIL || '').split(',').map((f) => f.trim()).filter(Boolean);

  const tick = async () => {
    for (const founder of founders) {
      try {
        const latest = await getLatestGrowthRun(founder);
        if (latest?.runId) {
          await finalizeRunIfTerminal(latest.runId);
        }
      } catch (err) {
        appLogger.error('[GrowthFinalize] tick failed', err);
      }
    }
  };

  const timer = setInterval(tick, intervalMs);
  timer.unref?.();
  appLogger.log(`[GrowthFinalize] Enabled (interval=${intervalMs}ms, founders=${founders.join(',') || 'n/a'})`);
}
