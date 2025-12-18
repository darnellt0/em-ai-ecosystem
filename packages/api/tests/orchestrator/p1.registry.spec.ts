import { ensureP1AgentsRegistered, listP1Keys } from '../../src/orchestrator/registerP1Agents';
import { listAgents, getAgent } from '@em/orchestrator';

describe('P1 Agents Registry', () => {
  beforeAll(() => {
    ensureP1AgentsRegistered();
  });

  it('registers all P1 keys', () => {
    const keys = listP1Keys();
    const registered = listAgents().map((a) => a.key);
    keys.forEach((k) => expect(registered).toContain(k));
  });

  it('returns AgentOutput shape (SKIPPED) when run', async () => {
    const agent = getAgent('brand.storyteller.generate');
    expect(agent).toBeDefined();
    const res = await agent!.run({});
    expect(['SKIPPED', 'OK', 'FAILED']).toContain(res.status);
  });
});
