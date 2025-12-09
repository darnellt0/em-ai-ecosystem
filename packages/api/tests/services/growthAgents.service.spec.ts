jest.mock('../../src/growth-agents/journal-agent', () => {
  return {
    JournalAgent: class {
      async setup() {}
      async run() {
        return { success: true, outputs: { summary: 'journal ok', insights: [{ title: 'j1' }] }, artifacts: [] };
      }
      async teardown() {}
    },
  };
});

jest.mock('../../src/growth-agents/niche-agent', () => {
  return {
    NicheAgent: class {
      async setup() {}
      async run() {
        throw new Error('fail');
      }
      async teardown() {}
    },
  };
});

jest.mock('../../src/growth-agents/mindset-agent', () => {
  return {
    MindsetAgent: class {
      async setup() {}
      async run() {
        return { success: true, outputs: { summary: 'mindset ok', insights: [{ title: 'm1' }] }, artifacts: [] };
      }
      async teardown() {}
    },
  };
});

jest.mock('../../src/growth-agents/rhythm-agent', () => {
  return {
    RhythmAgent: class {
      async setup() {}
      async run() {
        return { success: true, outputs: { summary: 'rhythm ok', insights: [{ title: 'r1' }] }, artifacts: [] };
      }
      async teardown() {}
    },
  };
});

jest.mock('../../src/growth-agents/purpose-agent', () => {
  return {
    PurposeAgent: class {
      async setup() {}
      async run() {
        return { success: true, outputs: { summary: 'purpose ok', insights: [{ title: 'p1' }] }, artifacts: [] };
      }
      async teardown() {}
    },
  };
});

import {
  runJournalAgent,
  runNicheAgent,
  runMindsetAgent,
  runRhythmAgent,
  runPurposeAgent,
} from '../../src/services/growthAgents.service';

jest.mock('../../src/services/activity-log.service', () => {
  const logAgentRun = jest.fn().mockResolvedValue({ success: true });
  return {
    activityLogService: { logAgentRun },
  };
});

const { activityLogService } = require('../../src/services/activity-log.service');

describe('Growth Agents Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const founderEmail = 'founder@example.com';

  it('logs success for journal agent', async () => {
    const result = await runJournalAgent({ founderEmail });
    expect(result.summary).toBeDefined();
    expect(activityLogService.logAgentRun).toHaveBeenCalledWith(
      expect.objectContaining({ agentName: 'JournalGrowth', status: 'success' })
    );
  });

  it('logs error when agent throws', async () => {
    await expect(runNicheAgent({ founderEmail })).rejects.toThrow('fail');
    expect(activityLogService.logAgentRun).toHaveBeenCalledWith(
      expect.objectContaining({ agentName: 'NicheGrowth', status: 'error' })
    );
  });

  it('returns structured output across agents', async () => {
    const runners = [runMindsetAgent, runRhythmAgent, runPurposeAgent];
    for (const runner of runners) {
      const out = await runner({ founderEmail });
      expect(out.summary).toBeTruthy();
      expect(out.insights.length).toBeGreaterThan(0);
    }
  });
});
