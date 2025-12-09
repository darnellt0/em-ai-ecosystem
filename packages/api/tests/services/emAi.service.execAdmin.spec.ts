jest.mock('../../src/services/executiveAdmin.service', () => ({
  callEmExecutiveAdmin: jest.fn().mockResolvedValue({
    outputText: 'Exec Admin mock output',
    raw: { mock: true },
  }),
}));

import { callEmAgent } from '../../src/services/emAi.service';

describe('callEmAgent -> ExecAdmin', () => {
  it('routes through callEmExecutiveAdmin', async () => {
    const { callEmExecutiveAdmin } = require('../../src/services/executiveAdmin.service');

    const result = await callEmAgent({
      agentId: 'journal',
      orchestratorKey: 'growth.journal',
      mode: 'single',
      input: { prompt: 'test' },
    });

    expect(callEmExecutiveAdmin).toHaveBeenCalledTimes(1);
    expect(callEmExecutiveAdmin).toHaveBeenCalledWith(
      expect.objectContaining({
        agentKey: 'growth.journal',
        payload: { prompt: 'test' },
      })
    );
    expect(result.outputText).toBe('Exec Admin mock output');
  });
});
