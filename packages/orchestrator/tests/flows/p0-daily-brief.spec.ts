import { registerAgent } from '../../src/registry/agent-registry';
import { runAgentsConcurrently } from '../../src/dispatcher';
import { runDailyBriefWorkflow } from '../../../agents/daily-brief/workflows';

describe('P0 Daily Brief orchestrator path', () => {
  it('propagates runId into logs and returns valid brief shape', async () => {
    const info = jest.fn();
    const runId = 'run-orch-123';

    registerAgent({
      key: 'daily_brief.generate',
      run: (payload: any) => runDailyBriefWorkflow(payload, { logger: { info } }),
    });

    const results = await runAgentsConcurrently([
      { key: 'daily_brief.generate', payload: { user: 'darnell', runId } },
    ]);

    const brief = results['daily_brief.generate'];
    expect(brief.success).toBe(true);
    expect(brief.output).toMatchObject({
      date: expect.any(String),
      topPriorities: expect.any(Array),
      focusBlock: expect.objectContaining({ start: expect.any(String), end: expect.any(String), theme: expect.any(String) }),
      calendarSummary: expect.objectContaining({ meetings: expect.any(Number), highlights: expect.any(Array) }),
      inboxHighlights: expect.objectContaining({ items: expect.any(Array) }),
      risks: expect.any(Array),
      suggestedActions: expect.any(Array),
    });

    expect(info).toHaveBeenCalledWith('[DailyBrief] start', expect.objectContaining({ runId }));
  });
});
