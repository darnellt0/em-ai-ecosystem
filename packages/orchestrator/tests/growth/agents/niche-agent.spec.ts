/**
 * Niche Agent Tests
 */

import { runNicheAgent } from '../../../src/growth/agents/niche-agent';
import { OrchestratorRunContext } from '../../../src/growth/types';

describe('NicheAgent', () => {
  it('should discover niche themes successfully', async () => {
    const ctx: OrchestratorRunContext = {
      userId: 'test-user',
      email: 'test@example.com',
    };

    const result = await runNicheAgent(ctx);

    expect(result.success).toBe(true);
    expect(result.artifacts).toBeDefined();
    expect(result.artifacts?.themesDiscovered).toBeGreaterThan(0);
  });

  it('should identify a top theme with confidence', async () => {
    const ctx: OrchestratorRunContext = {
      userId: 'test-user',
    };

    const result = await runNicheAgent(ctx);

    expect(result.success).toBe(true);
    expect(result.artifacts?.topTheme).toBeDefined();
    expect(typeof result.artifacts?.topTheme).toBe('string');
    expect(result.artifacts?.topThemeConfidence).toBeDefined();
    expect(result.artifacts?.topThemeConfidence).toBeGreaterThan(0);
    expect(result.artifacts?.topThemeConfidence).toBeLessThanOrEqual(1);
  });

  it('should generate multiple niche themes', async () => {
    const ctx: OrchestratorRunContext = {
      userId: 'test-user',
    };

    const result = await runNicheAgent(ctx);

    expect(result.success).toBe(true);
    const themes = result.artifacts?.themes as any[];
    expect(themes.length).toBeGreaterThanOrEqual(2);
    expect(themes[0].name).toBeDefined();
    expect(themes[0].confidence).toBeDefined();
  });

  it('should generate a niche clarity report', async () => {
    const ctx: OrchestratorRunContext = {
      userId: 'test-user',
    };

    const result = await runNicheAgent(ctx);

    expect(result.success).toBe(true);
    expect(result.artifacts?.reportLength).toBeGreaterThan(0);
  });

  it('should provide recommendations', async () => {
    const ctx: OrchestratorRunContext = {
      userId: 'test-user',
    };

    const result = await runNicheAgent(ctx);

    expect(result.success).toBe(true);
    expect(result.artifacts?.recommendations).toBeGreaterThan(0);
  });
});
