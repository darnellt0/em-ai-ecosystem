import { agentFactory } from '../../src/agents/agent-factory';

jest.mock('../../src/services/insights.service', () => {
  const generateDailyBrief = jest.fn();
  return {
    insightsService: {
      generateDailyBrief,
    },
  };
});

jest.mock('../../src/services/email.service', () => {
  const sendEmail = jest.fn();
  return {
    emailService: {
      sendEmail,
    },
  };
});

jest.mock('../../src/services/database.service', () => ({
  databaseService: {
    logTaskComplete: jest.fn().mockResolvedValue({ success: true }),
    createFollowUp: jest.fn().mockResolvedValue({ taskId: 'task_mock', success: true }),
    recordActivity: jest.fn().mockResolvedValue({ success: true, activityId: 1 }),
    saveScheduleFeedback: jest.fn().mockResolvedValue({ success: true }),
    logVoiceInteraction: jest.fn().mockResolvedValue({ success: true }),
    healthCheck: jest.fn().mockResolvedValue(true),
  },
}));

const { insightsService } = require('../../src/services/insights.service');
const { emailService } = require('../../src/services/email.service');

describe('AgentFactory - Daily Brief email', () => {
  const fixedDate = new Date('2025-05-15T08:00:00Z');

  beforeAll(() => {
    jest.useFakeTimers().setSystemTime(fixedDate);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.FOUNDER_DARNELL_EMAIL = 'darnell@example.com';
    process.env.FOUNDER_SHRIA_EMAIL = 'shria@example.com';

    insightsService.generateDailyBrief.mockResolvedValue({
      title: 'Daily Brief for 5/15/2025',
      summary: 'You are on track today.',
      sections: [
        {
          title: '🎯 Focus Performance',
          content: 'Focused for 120 minutes.',
          priority: 'high',
        },
        {
          title: '✅ Task Progress',
          content: 'Completed tasks.',
          priority: 'high',
          actionItems: ['Finish spec', 'Send recap'],
        },
        {
          title: '📅 Meeting Summary',
          content: 'One meeting today.',
          priority: 'low',
        },
        {
          title: '⚡ Energy Level',
          content: 'Energy medium.',
          priority: 'medium',
          actionItems: ['Take a walk'],
        },
      ],
    });

    emailService.sendEmail.mockResolvedValue({ success: true, messageId: 'msg_123' });
  });

  it('sends daily brief email with subject including date and HTML body', async () => {
    await agentFactory.getDailyBrief('founder@example.com');

    expect(emailService.sendEmail).toHaveBeenCalledTimes(1);
    const [recipients, subject, html] = emailService.sendEmail.mock.calls[0];

    expect(recipients).toEqual(
      expect.arrayContaining(['founder@example.com', 'darnell@example.com', 'shria@example.com'])
    );
    expect(subject).toContain('Your Daily Brief');
    expect(subject).toContain('May 15, 2025');
    expect(html).toContain("Today's Focus");
    expect(html).toContain('<html');
  });

  it('allows adding extra recipients without losing defaults', async () => {
    await agentFactory.getDailyBrief('founder@example.com', { recipients: ['custom@example.com'] });

    expect(emailService.sendEmail).toHaveBeenCalledTimes(1);
    const [recipients] = emailService.sendEmail.mock.calls[0];

    expect(recipients).toEqual(
      expect.arrayContaining([
        'founder@example.com',
        'darnell@example.com',
        'shria@example.com',
        'custom@example.com',
      ])
    );
  });
});
