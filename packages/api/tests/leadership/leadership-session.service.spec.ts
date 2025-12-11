import { leadershipSessionService } from '../../src/leadership/leadership-session.service';
import * as growthAgentsService from '../../src/services/growthAgents.service';

describe('LeadershipSessionService', () => {
  beforeAll(() => {
    jest.spyOn(growthAgentsService, 'resolveGrowthAgent').mockImplementation((key: string) => {
      return async () => ({
        summary: `Handled by ${key}`,
        insights: [],
        recommendations: [],
        metadata: {},
      });
    });
  });

  it('runs session and maps leadership feature to agents', async () => {
    const result = await leadershipSessionService.runSession({
      featureId: 'mood-sculptor',
      message: 'Leading a big initiative and need rest rhythm',
    });

    expect(result.featureId).toBe('mood-sculptor');
    expect(result.routedAgents.length).toBeGreaterThan(0);
    expect(result.reply).toContain('Handled by');
  });

  it('throws on missing fields', async () => {
    await expect(
      leadershipSessionService.runSession({
        // @ts-expect-error invalid
        featureId: '',
        message: '',
      })
    ).rejects.toThrow('featureId and message are required.');
  });
});
