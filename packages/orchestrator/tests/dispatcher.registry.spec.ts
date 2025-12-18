import { registerAgent, getAgent, listAgents } from '../src/registry/agent-registry';
import { runAgentsConcurrently } from '../src/dispatcher';
import { AgentOutput } from '../../shared/contracts';

describe('registry-backed dispatcher', () => {
  beforeAll(() => {
    registerAgent({
      key: 'test.agent',
      run: async () => ({ status: 'OK', output: { hello: 'world' } } as AgentOutput<any>),
    });
  });

  it('runs registered agent', async () => {
    const res = await runAgentsConcurrently([{ key: 'test.agent' }]);
    expect(res['test.agent'].success).toBe(true);
    expect(res['test.agent'].usedStub).toBe(false);
  });

  it('skips missing agent', async () => {
    const res = await runAgentsConcurrently([{ key: 'missing.agent' }]);
    expect(res['missing.agent'].status).toBe('SKIPPED');
    expect(res['missing.agent'].usedStub).toBe(true);
  });
});
