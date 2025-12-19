import { AgentOutput } from '../../shared/contracts';
import { calendarService } from '../../api/src/services/calendar.service';

interface CalendarAdapterPayload {
  userId?: string;
  founderEmail?: string;
  horizon?: string;
  __skip?: boolean;
  __forceFail?: boolean;
}

/**
 * PLAN-only adapter: proposes focus blocks without writing to calendar.
 * EXECUTE is intentionally blocked until Phase 3 executors are enabled.
 */
export async function runCalendarOptimizeAdapter(payload: CalendarAdapterPayload): Promise<AgentOutput<any>> {
  if (payload.__skip) return { status: 'SKIPPED', warnings: ['Skipped by debug flag'] };
  if (payload.__forceFail) return { status: 'FAILED', error: 'Forced failure (debug)' };
  const calendarId = payload.founderEmail || payload.userId;
  if (!calendarId) return { status: 'FAILED', error: 'founderEmail or userId required' };

  try {
    const now = new Date();
    const end = new Date(now.getTime() + 4 * 60 * 60 * 1000);
    const durationMinutes = 90;
    const availableSlots = await calendarService.findAvailableSlots(calendarId, now, end, durationMinutes, { bufferMinutes: 10 });
    const proposals = availableSlots.slice(0, 3).map((slot) => ({
      start: slot.start,
      end: slot.end,
      reason: 'Deep focus proposal',
    }));

    return {
      status: 'OK',
      output: {
        focusBlocks: proposals,
        mode: 'PLAN',
        note: 'No calendar writes performed. EXECUTE blocked until Phase 3 executor is enabled.',
      },
      warnings: proposals.length === 0 ? ['No available slots found'] : undefined,
    };
  } catch (err: any) {
    return { status: 'FAILED', error: err.message };
  }
}
