import { runDailyBriefAgent } from '../services/dailyBrief.service';

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

async function runJob(userId: string) {
  try {
    await runDailyBriefAgent({ userId });
    console.log(`[DailyBrief Cron] Sent brief for ${userId}`);
  } catch (error) {
    console.error(`[DailyBrief Cron] Failed for ${userId}`, error);
  }
}

function schedule(userId: string, hourPT: number, minutePT: number) {
  const scheduleNext = () => {
    const delay = computeNextRun(hourPT, minutePT);
    setTimeout(async () => {
      await runJob(userId);
      scheduleNext();
    }, delay);
  };
  scheduleNext();
}

export function scheduleDailyBriefCron() {
  if (process.env.ENABLE_DAILY_BRIEF_CRON !== 'true') {
    return;
  }
  // 6:00 AM PT - Darnell, 6:05 AM PT - Shria
  schedule('darnell', 6, 0);
  schedule('shria', 6, 5);
}
