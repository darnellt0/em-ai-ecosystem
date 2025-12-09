import { emotionalSessionService } from '../../src/emotional/emotional-session.service';
import * as growthAgentsService from '../../src/services/growthAgents.service';

describe('EmotionalSessionService', () => {
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

  it('runs session and maps feature to agents', async () => {
    const result = await emotionalSessionService.runSession({
      featureId: 'mood-sculptor',
      message: 'I feel overwhelmed',
    });

    expect(result.featureId).toBe('mood-sculptor');
    expect(result.routedAgents.length).toBeGreaterThan(0);
    expect(result.reply).toContain('Handled by');
  });

  it('throws on missing fields', async () => {
    await expect(
      emotionalSessionService.runSession({
        // @ts-expect-error intentional invalid input
        featureId: '',
        message: '',
      })
    ).rejects.toThrow('featureId and message are required.');
  });
});
