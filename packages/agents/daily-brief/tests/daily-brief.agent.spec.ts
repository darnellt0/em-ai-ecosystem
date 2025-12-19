import { generateDailyBrief } from '../service';
import { runDailyBriefWorkflow } from '../workflows';

describe('Daily Brief Agent (P0)', () => {
  const date = '2025-01-15';

  it('returns strict schema with populated values when integrations respond', async () => {
    const output = await runDailyBriefWorkflow(
      { user: 'darnell', date },
      {
        priorities: {
          fetchTopPriorities: jest.fn().mockResolvedValue([
            { title: 'Ship onboarding', why: 'Unblocks revenue', nextStep: 'Publish FAQ' },
          ]),
        },
        calendar: {
          summarizeDay: jest.fn().mockResolvedValue({ meetings: 3, highlights: ['Investor sync', 'Team standup'] }),
          suggestFocusBlock: jest.fn().mockResolvedValue({ start: `${date}T09:00:00Z`, end: `${date}T10:00:00Z`, theme: 'Ship onboarding FAQ' }),
        },
        inbox: {
          fetchHighlights: jest.fn().mockResolvedValue([{ from: 'investor@example.com', subject: 'Follow-up', whyImportant: 'Keeps deal warm' }]),
        },
        actions: {
          suggestActions: jest.fn().mockResolvedValue([
            { type: 'email_draft', title: 'Investor follow-up', details: 'Send concise update' },
          ]),
        },
      }
    );

    expect(output.status).toBe('OK');
    expect(output.output).toMatchObject({
      date,
      topPriorities: [
        { title: 'Ship onboarding', why: 'Unblocks revenue', nextStep: 'Publish FAQ' },
      ],
      focusBlock: { start: `${date}T09:00:00Z`, end: `${date}T10:00:00Z`, theme: 'Ship onboarding FAQ' },
      calendarSummary: { meetings: 3, highlights: ['Investor sync', 'Team standup'] },
      inboxHighlights: { items: [{ from: 'investor@example.com', subject: 'Follow-up', whyImportant: 'Keeps deal warm' }] },
      risks: expect.any(Array),
      suggestedActions: [{ type: 'email_draft', title: 'Investor follow-up', details: 'Send concise update' }],
    });
  });

  it('handles missing integrations gracefully with empty arrays', async () => {
    const { output, warnings } = await generateDailyBrief({ user: 'shria', date });
    expect(warnings).toEqual(expect.arrayContaining(['priorities.integration_missing', 'calendar.integration_missing', 'inbox.integration_missing', 'actions.integration_missing']));
    expect(output.calendarSummary.meetings).toBe(0);
    expect(output.calendarSummary.highlights).toEqual([]);
    expect(output.inboxHighlights.items).toEqual([]);
    expect(output.topPriorities).toEqual([]);
    expect(output.suggestedActions.length).toBeGreaterThan(0); // fallback actions still present
  });

  it('logs the runId when provided', async () => {
    const info = jest.fn();
    const warn = jest.fn();
    const runId = 'run-abc123';
    await runDailyBriefWorkflow(
      { user: 'darnell', date, runId },
      {
        logger: { info, warn },
      }
    );

    expect(info).toHaveBeenCalledWith('[DailyBrief] start', expect.objectContaining({ runId }));
    expect(info).toHaveBeenCalledWith(expect.stringContaining('[DailyBrief] complete'), expect.objectContaining({ runId }));
  });
});
