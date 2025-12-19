import { runP0DailyBriefExecAdmin } from '../exec-admin/flows/p0-daily-brief';
import logger from '../utils/logger';

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
  if (!cron) return { hour: 7, minute: 5 };
  const parts = cron.trim().split(/\s+/);
  if (parts.length < 2) return { hour: 7, minute: 5 };
  const minute = Number(parts[0]);
  const hour = Number(parts[1]);
  if (Number.isNaN(minute) || Number.isNaN(hour)) return { hour: 7, minute: 5 };
  return { hour, minute };
}

async function runJob(user: string) {
  const targetUser: 'darnell' | 'shria' = user === 'shria' ? 'shria' : 'darnell';
  try {
    const result = await runP0DailyBriefExecAdmin({ user: targetUser });
    logger.info('[DailyBrief Cron] Sent brief', { user: targetUser, runId: result.runId });
  } catch (error: any) {
    logger.error('[DailyBrief Cron] Failed', { user: targetUser, error: error?.message });
  }
}

function schedule(user: string, hourPT: number, minutePT: number, debugDelayMs?: number | null) {
  const scheduleNext = () => {
    const delay = debugDelayMs !== null && debugDelayMs !== undefined ? debugDelayMs : computeNextRun(hourPT, minutePT);
    setTimeout(async () => {
      await runJob(user);
      scheduleNext();
    }, delay);
  };
  scheduleNext();
}

export function scheduleDailyBriefCron() {
  if (process.env.ENABLE_DAILY_BRIEF_CRON !== 'true') {
    logger.info('[DailyBrief Cron] Disabled (set ENABLE_DAILY_BRIEF_CRON=true to enable)');
    return;
  }

  const debugDelayMs = process.env.DAILY_BRIEF_DEBUG_DELAY_MS ? Number(process.env.DAILY_BRIEF_DEBUG_DELAY_MS) : null;
  const { hour, minute } = parseCronToHourMinute(process.env.DAILY_BRIEF_CRON);
  const usersEnv = process.env.DAILY_BRIEF_USERS || process.env.DAILY_BRIEF_USER || 'darnell';
  const users = usersEnv.split(',').map((u) => u.trim()).filter(Boolean);

  users.forEach((user, idx) => {
    const offsetMinutes = users.length > 1 ? idx * 5 : 0;
    logger.info('[DailyBrief Cron] Scheduled', { user, hour, minute: minute + offsetMinutes });
    schedule(user, hour, minute + offsetMinutes, debugDelayMs);
  });
}
