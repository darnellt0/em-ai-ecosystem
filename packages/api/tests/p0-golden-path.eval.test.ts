import { runP0DailyFocusExecAdmin } from '../src/exec-admin/flows/p0-daily-focus';
import { getP0Run } from '../src/services/p0RunHistory.service';

const mockPublishActionPackWebhook = jest.fn().mockResolvedValue(undefined);

jest.mock('../../agents/daily-brief/adapter', () => ({
  runDailyBriefAdapter: jest.fn().mockResolvedValue({
    status: 'OK',
    output: {
      date: '2025-01-01',
      summary: 'Top focus for today',
      topPriorities: ['Priority A'],
      focusBlock: { start: '09:00', end: '10:30', theme: 'Deep work' },
      calendarSummary: { meetings: 2, highlights: ['Standup'] },
      inboxHighlights: { items: [] },
      risks: [],
      suggestedActions: [],
    },
  }),
}));

jest.mock('../../agents/insights/adapter', () => ({
  runInsightAdapter: jest.fn().mockResolvedValue({
    status: 'OK',
    output: { insights: [{ title: 'Signal', detail: 'Momentum is strong' }] },
  }),
}));

jest.mock('../../agents/journal/adapter', () => ({
  runJournalPromptAdapter: jest.fn().mockResolvedValue({
    status: 'OK',
    output: { prompts: ['What matters most today?'] },
  }),
}));

jest.mock('../../agents/calendar/adapter', () => ({
  runCalendarOptimizeAdapter: jest.fn().mockResolvedValue({
    status: 'OK',
    output: { focusBlocks: ['10:00-11:30 Deep work'] },
  }),
}));

jest.mock('../../agents/content-synthesizer/adapter', () => ({
  runContentActionPackAdapter: jest.fn().mockResolvedValue({
    status: 'OK',
    output: {
      linkedinDraft: 'LinkedIn draft text',
      emailDraft: 'Email draft text',
      journalExpansion: 'Journal expansion',
      reflectionExercise: 'Reflection exercise',
      focusNarrative: 'Focus narrative',
    },
  }),
}));

jest.mock('../src/actions/actionpack.webhook', () => ({
  publishActionPackWebhook: jest.fn(function () {
    return mockPublishActionPackWebhook.apply(this, arguments);
  }),
}));

describe('P0 Golden Path evals', () => {
  beforeEach(() => {
    process.env.ENABLE_ACTIONPACK_WEBHOOK = 'false';
    mockPublishActionPackWebhook.mockClear();
  });

  it('runs P0 Daily Focus end-to-end with required outputs', async () => {
    const result = await runP0DailyFocusExecAdmin({ userId: 'founder@example.com', mode: 'founder' });

    expect(result.success).toBe(true);
    expect(result.intent).toBe('p0.daily_focus');
    expect(result.data.qaStatus).toBeDefined();
    expect(result.data.actionPack.status).toBeDefined();
    expect(result.data.actionPack.linkedinDraft).toBe('LinkedIn draft text');
    expect(result.data.actionPack.emailDraft).toBe('Email draft text');
    expect(result.data.insights?.length).toBeGreaterThan(0);
    expect(result.data.actions?.length).toBeGreaterThan(0);

    const stored = await getP0Run(result.runId);
    expect(stored?.status).toBe('complete');
    expect(stored?.inputSnapshot).toMatchObject({ userId: 'founder@example.com', mode: 'founder' });
    expect(stored?.outputSnapshot?.focus).toBeDefined();
    expect(stored?.evalStatus?.status).toBeDefined();
    expect(mockPublishActionPackWebhook).toHaveBeenCalledTimes(1);
  });
});
