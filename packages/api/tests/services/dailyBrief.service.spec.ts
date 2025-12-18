import { runDailyBriefAgent, fetchGrowthSnapshotForFounder } from '../../src/services/dailyBrief.service';

jest.mock('../../src/services/calendar.service', () => ({
  calendarService: { listUpcomingEvents: jest.fn().mockResolvedValue([]) },
}));

jest.mock('../../src/services/email.service', () => ({
  emailService: { sendEmail: jest.fn().mockResolvedValue({ success: true }) },
}));

jest.mock('../../src/services/insights.service', () => ({
  insightsService: {
    generateDailyBrief: jest.fn().mockResolvedValue({
      title: 'Test Brief',
      summary: 'Summary',
      sections: [
        { title: 'Priority A', priority: 'high', actionItems: [] },
        { title: 'Task A', priority: 'low', actionItems: ['Do A'] },
      ],
    }),
  },
}));

jest.mock('../../src/services/emAi.service', () => ({
  getGrowthStatus: jest.fn(),
}));

const { getGrowthStatus } = require('../../src/services/emAi.service');

describe('Daily Brief service with Growth snapshot', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    (getGrowthStatus as jest.Mock).mockReset();
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  it('does not fetch growth when flag is false', async () => {
    process.env.INCLUDE_GROWTH_IN_DAILY_BRIEF = 'false';
    (getGrowthStatus as jest.Mock).mockResolvedValue({});

    const result = await runDailyBriefAgent({ userId: 'darnell' });
    expect(getGrowthStatus).not.toHaveBeenCalled();
    expect(result.rendered.html).not.toContain('Growth Pack Snapshot');
  });

  it('renders summary growth snapshot when enabled (summary)', async () => {
    process.env.INCLUDE_GROWTH_IN_DAILY_BRIEF = 'true';
    process.env.GROWTH_DAILY_BRIEF_MODE = 'summary';
    (getGrowthStatus as jest.Mock).mockResolvedValue({
      agents: ['journal', 'growth.journal'],
      timestamp: new Date().toISOString(),
      recentProgress: [
        { agent: 'journal', phase: 'Rooted', percent: '20', note: 'setup', timestamp: '2024-01-01T00:00:00Z' },
        { agent: 'niche', phase: 'Grounded', percent: '60', note: 'analysis', timestamp: '2024-01-02T00:00:00Z' },
        { agent: 'purpose', phase: 'Radiant', percent: '80', note: 'draft', timestamp: '2024-01-03T00:00:00Z' },
        { agent: 'mindset', phase: 'Rooted', percent: '90', note: 'wrap', timestamp: '2024-01-04T00:00:00Z' },
      ],
    });

    const result = await runDailyBriefAgent({ userId: 'darnell' });
    expect(getGrowthStatus).toHaveBeenCalled();
    expect(result.rendered.html).toContain('Growth Pack Snapshot');
    // summary mode should cap highlights (<=3)
    const highlightCount = (result.rendered.html.match(/<li>/g) || []).length;
    expect(highlightCount).toBeLessThanOrEqual(3);
  });

  it('renders full growth snapshot when mode=full', async () => {
    process.env.INCLUDE_GROWTH_IN_DAILY_BRIEF = 'true';
    process.env.GROWTH_DAILY_BRIEF_MODE = 'full';
    (getGrowthStatus as jest.Mock).mockResolvedValue({
      agents: ['journal', 'growth.journal'],
      timestamp: new Date().toISOString(),
      recentProgress: Array.from({ length: 5 }).map((_, i) => ({
        agent: `agent-${i}`,
        phase: 'Rooted',
        percent: `${i * 10}`,
        note: `note-${i}`,
        timestamp: `2024-01-0${i + 1}T00:00:00Z`,
      })),
    });

    const result = await runDailyBriefAgent({ userId: 'darnell' });
    const highlightCount = (result.rendered.html.match(/<li>/g) || []).length;
    expect(highlightCount).toBeGreaterThan(3);
  });

  it('fails gracefully when growth helper throws', async () => {
    process.env.INCLUDE_GROWTH_IN_DAILY_BRIEF = 'true';
    (getGrowthStatus as jest.Mock).mockImplementation(() => {
      throw new Error('boom');
    });
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const result = await runDailyBriefAgent({ userId: 'darnell' });

    expect(result.rendered.html).toBeDefined();
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
