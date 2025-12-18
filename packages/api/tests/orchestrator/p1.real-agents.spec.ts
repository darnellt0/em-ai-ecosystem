import { ensureP1AgentsRegistered, listP1Keys } from '../../src/orchestrator/registerP1Agents';
import { getAgent } from '@em/orchestrator';

describe('P1 real agents registered', () => {
  beforeAll(() => {
    ensureP1AgentsRegistered();
  });

  it('all selected P1 keys are registered', () => {
    const keys = listP1Keys();
    keys.forEach((k) => expect(getAgent(k)).toBeDefined());
  });

  it('agents return AgentOutput with summary', async () => {
    const agent = getAgent('brand.storyteller.generate');
    expect(agent).toBeDefined();
    const res = await agent!.run({ userId: 'test' });
    expect(res.status).toBeDefined();
    expect(res.output?.summary).toBeDefined();
  });
});
