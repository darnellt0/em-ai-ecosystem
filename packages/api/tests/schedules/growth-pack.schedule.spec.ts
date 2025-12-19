import { scheduleGrowthPackCron } from '../../src/schedules/growth-pack.schedule';

const launchGrowthPackMock = jest.fn();

jest.mock('../../src/services/emAi.service', () => ({
  launchGrowthPack: (...args: any[]) => launchGrowthPackMock(...args),
}));

describe('growth-pack.schedule', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    process.env = originalEnv;
  });

  it('does not schedule when disabled', () => {
    process.env.ENABLE_GROWTH_SCHEDULE = 'false';
    const logger = { log: jest.fn(), error: jest.fn() };

    scheduleGrowthPackCron(logger);

    expect(logger.log).toHaveBeenCalledWith(
      '[GrowthSchedule] Disabled (set ENABLE_GROWTH_SCHEDULE=true to enable)'
    );
    expect(launchGrowthPackMock).not.toHaveBeenCalled();
  });

  it('schedules and triggers growth pack with debug delay', async () => {
    process.env.ENABLE_GROWTH_SCHEDULE = 'true';
    process.env.GROWTH_SCHEDULE_DEBUG_DELAY_MS = '10';
    process.env.FOUNDER_SHRIA_EMAIL = 'test@example.com';
    const logger = { log: jest.fn(), error: jest.fn() };

    launchGrowthPackMock.mockResolvedValue({
      success: true,
      mode: 'full',
      launchedAgents: Array.from({ length: 10 }, (_, i) => `agent-${i}`),
      jobIds: Array.from({ length: 10 }, (_, i) => `job-${i}`),
      timestamp: new Date().toISOString(),
    });

    scheduleGrowthPackCron(logger);

    // First timeout is scheduled
    jest.advanceTimersByTime(15);

    expect(launchGrowthPackMock).toHaveBeenCalledWith({
      founderEmail: 'test@example.com',
      mode: 'full',
    });
  });
});
