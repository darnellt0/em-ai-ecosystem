import { agentFactory } from '../../src/agents/agent-factory';

jest.mock('../../src/services/calendar.service', () => {
  const listUpcomingEvents = jest.fn();
  const checkEventConflicts = jest.fn();
  const insertEvent = jest.fn();
  const findAvailableSlots = jest.fn();
  const getEvent = jest.fn();
  const updateEvent = jest.fn();

  return {
    calendarService: {
      listUpcomingEvents,
      checkEventConflicts,
      insertEvent,
      findAvailableSlots,
      getEvent,
      updateEvent,
    },
  };
});

jest.mock('../../src/services/activity-log.service', () => {
  const logAgentRun = jest.fn().mockResolvedValue({ success: true });
  return {
    activityLogService: {
      logAgentRun,
    },
  };
});

const { calendarService } = require('../../src/services/calendar.service');
const { activityLogService } = require('../../src/services/activity-log.service');

describe('AgentFactory - Calendar Optimizer', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    calendarService.listUpcomingEvents.mockResolvedValue([]);
    calendarService.checkEventConflicts.mockResolvedValue({
      hasConflict: false,
      conflictingEvents: [],
      summary: 'No conflicts',
      eventsScanned: 0,
      options: {},
    });
    calendarService.findAvailableSlots.mockResolvedValue([]);
    calendarService.insertEvent.mockResolvedValue({
      success: true,
      eventId: 'evt_123',
      htmlLink: 'https://calendar.google.com/event',
      event: {
        id: 'evt_123',
        summary: 'Deep Focus: Test',
        description: null,
        start: new Date().toISOString(),
        end: new Date().toISOString(),
        timeZone: 'UTC',
        isAllDay: false,
        status: 'confirmed',
        htmlLink: 'https://calendar.google.com/event',
        attendees: [],
        location: null,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
      },
    });
  });

  it('creates a focus block when no conflicts', async () => {
    await agentFactory.blockFocusTime('primary', 60, 'Test');

    expect(calendarService.checkEventConflicts).toHaveBeenCalledTimes(1);
    expect(calendarService.insertEvent).toHaveBeenCalledTimes(1);
    expect(activityLogService.logAgentRun).toHaveBeenCalledWith(
      expect.objectContaining({
        agentName: 'CalendarOptimizer',
        status: 'success',
      })
    );
  });

  it('skips insert when conflicts and no slots available', async () => {
    calendarService.checkEventConflicts.mockResolvedValue({
      hasConflict: true,
      conflictingEvents: [{ summary: 'Existing event' }],
      summary: 'conflict',
      eventsScanned: 1,
      options: {},
    });
    calendarService.findAvailableSlots.mockResolvedValue([]);

    const result = await agentFactory.blockFocusTime('primary', 60, 'Test');

    expect(calendarService.insertEvent).not.toHaveBeenCalled();
    expect(result.success).toBe(false);
    expect(activityLogService.logAgentRun).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'error',
        metadata: expect.objectContaining({ focusBlocksCreated: 0 }),
      })
    );
  });
});
