import { runDailyBrief } from '../src/index';
import { DailyBriefDependencies } from '../src/index';

describe('Daily Brief Agent', () => {
  const fixedDate = new Date('2025-05-15T08:00:00Z');

  beforeAll(() => {
    jest.useFakeTimers().setSystemTime(fixedDate);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  const makeDeps = (opts: { withVoice?: boolean } = {}): DailyBriefDependencies => {
    const calendar = {
      listEvents: jest.fn().mockResolvedValue([
        { start: '2025-05-15T10:00:00Z', end: '2025-05-15T11:00:00Z', summary: 'Meeting' },
      ]),
    };

    const summarizer = {
      generateDailyBrief: jest.fn().mockResolvedValue({
        priorities: ['Finish spec', 'Send recap'],
        agenda: ['Team sync 10am'],
        tasks: ['Draft PRD'],
        inboxHighlights: ['Investor email received'],
        suggestedFocusWindows: [{ start: '9:00', end: '11:00', reason: 'Deep work' }],
        text: 'Priorities: Finish spec; Send recap.',
        html: '<h1>Daily Brief</h1>',
      }),
    };

    const email = {
      sendEmail: jest.fn().mockResolvedValue({ success: true, messageId: 'msg-1' }),
    };

    const voice = opts.withVoice
      ? {
          synthesize: jest.fn().mockResolvedValue('out/daily-brief-user-2025-05-15.mp3'),
        }
      : undefined;

    const activityLog = {
      logAgentRun: jest.fn().mockResolvedValue({ success: true }),
    };

    const deps: DailyBriefDependencies = {
      calendar,
      summarizer,
      email,
      voice,
      recipientsResolver: () => ['user@example.com'],
      activityLog,
      timeZone: 'America/Los_Angeles',
    };
    return deps;
  };

  it('generates brief and sends email', async () => {
    const deps = makeDeps();
    const result = await runDailyBrief({ userId: 'user' }, deps);

    expect(deps.calendar.listEvents).toHaveBeenCalled();
    expect(deps.summarizer.generateDailyBrief).toHaveBeenCalled();
    const [recipients, subject, html] = (deps.email.sendEmail as jest.Mock).mock.calls[0];
    expect(recipients).toEqual(expect.arrayContaining(['user@example.com']));
    expect(subject).toContain('Your Daily Brief');
    expect(html).toContain('Daily Brief');
    expect(result.priorities).toContain('Finish spec');
    expect(result.rendered.text).toContain('Priorities');
  });

  it('generates audio when voice + API key are present', async () => {
    process.env.ELEVENLABS_API_KEY = 'test-key';
    const deps = makeDeps({ withVoice: true });
    const result = await runDailyBrief({ userId: 'user' }, deps);

    expect(deps.voice!.synthesize).toHaveBeenCalled();
    expect(result.rendered.audioPath).toContain('.mp3');
  });

  it('logs activity on success and error', async () => {
    const deps = makeDeps();
    await runDailyBrief({ userId: 'user' }, deps);
    expect(deps.activityLog?.logAgentRun).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'success', agentName: 'DailyBrief' })
    );

    const depsError = makeDeps();
    (depsError.email.sendEmail as jest.Mock).mockRejectedValue(new Error('fail'));
    await expect(runDailyBrief({ userId: 'user' }, depsError)).rejects.toThrow('fail');
    expect(depsError.activityLog?.logAgentRun).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'error' })
    );
  });
});
