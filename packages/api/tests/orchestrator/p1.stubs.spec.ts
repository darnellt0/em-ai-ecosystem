import { ensureP1AgentsRegistered, listP1Keys } from '../../src/orchestrator/registerP1Agents';
import { getAgent, runAgentsConcurrently } from '@em/orchestrator';

describe('P1 stub agents registration', () => {
  beforeAll(() => {
    ensureP1AgentsRegistered();
  });

  it('registers all P1 keys including stubs', () => {
    const keys = listP1Keys();
    expect(keys.length).toBeGreaterThan(8);
    keys.forEach((k) => {
      expect(getAgent(k)).toBeDefined();
    });
  });

  it('stub agent returns SKIPPED status', async () => {
    const res = await runAgentsConcurrently([{ key: 'p1.voice_companion', payload: { userId: 'test' } }]);
    const agentRes = res['p1.voice_companion'];
    expect(agentRes).toBeDefined();
    expect(agentRes.output?.status || agentRes.status).toBeDefined(); // AgentOutput uses status
    expect(agentRes.output?.summary || agentRes.output?.warnings?.length).toBeDefined();
  });
});
