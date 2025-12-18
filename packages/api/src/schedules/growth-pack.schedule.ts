import { launchGrowthPack } from '../services/emAi.service';

const PT_OFFSET = () => {
  const now = new Date();
  const ptFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const parts = ptFormatter.formatToParts(now);
  const toNum = (type: string) => Number(parts.find((p) => p.type === type)?.value || 0);
  const pt = Date.UTC(
    toNum('year'),
    toNum('month') - 1,
    toNum('day'),
    toNum('hour'),
    toNum('minute'),
    toNum('second')
  );
  return pt - now.getTime();
};

function computeNextRun(ptHour: number, ptMinute: number): number {
  const now = new Date();
  const target = new Date(now);
  target.setUTCMinutes(target.getUTCMinutes() + PT_OFFSET() / 60000);
  target.setHours(ptHour, ptMinute, 0, 0);
  const targetUtc = new Date(target.getTime() - PT_OFFSET());
  if (targetUtc <= now) {
    targetUtc.setDate(targetUtc.getDate() + 1);
  }
  return targetUtc.getTime() - now.getTime();
}

function parseCronToHourMinute(cron?: string): { hour: number; minute: number } {
  // Accepts "m h * * *"
  if (!cron) return { hour: 7, minute: 0 };
  const parts = cron.trim().split(/\s+/);
  if (parts.length < 2) return { hour: 7, minute: 0 };
  const minute = Number(parts[0]);
  const hour = Number(parts[1]);
  if (Number.isNaN(minute) || Number.isNaN(hour)) return { hour: 7, minute: 0 };
  return { hour, minute };
}

export function scheduleGrowthPackCron(
  appLogger: Console | { log: (...args: any[]) => void; error: (...args: any[]) => void } = console
) {
  if (process.env.ENABLE_GROWTH_SCHEDULE !== 'true') {
    appLogger.log('[GrowthSchedule] Disabled (set ENABLE_GROWTH_SCHEDULE=true to enable)');
    return;
  }

  const debugDelayMs = process.env.GROWTH_SCHEDULE_DEBUG_DELAY_MS
    ? Number(process.env.GROWTH_SCHEDULE_DEBUG_DELAY_MS)
    : null;

  const { hour, minute } = parseCronToHourMinute(process.env.GROWTH_SCHEDULE_CRON);
  const founderEmail = process.env.FOUNDER_SHRIA_EMAIL || 'shria@elevatedmovements.com';
  const mode: 'full' = 'full';

  const scheduleNext = () => {
    const delay = debugDelayMs !== null && !Number.isNaN(debugDelayMs) ? debugDelayMs : computeNextRun(hour, minute);
    setTimeout(async () => {
      try {
        appLogger.log(`[GrowthSchedule] Triggering Exec Admin Growth Pack for ${founderEmail} (mode=${mode})`);
        const result = await launchGrowthPack({ founderEmail, mode });
        appLogger.log(
          `[GrowthSchedule] Growth Pack result: success=${result.success} runId=${(result as any)?.runId || 'n/a'} launchedAgents=${result.launchedAgents?.length || 0}`
        );
      } catch (err) {
        appLogger.error('[GrowthSchedule] Failed to launch Growth Pack', err);
      } finally {
        scheduleNext();
      }
    }, delay);
  };

  appLogger.log(
    `[GrowthSchedule] Enabled (cron=${process.env.GROWTH_SCHEDULE_CRON || '0 7 * * *'}, founder=${founderEmail})`
  );
  scheduleNext();
}
