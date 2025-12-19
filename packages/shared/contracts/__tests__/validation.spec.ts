import { validateAgentOutput, validateActionPack } from '../validation';

describe('contract validation', () => {
  it('fails on invalid agent output', () => {
    const res = validateAgentOutput({ status: 'BAD' });
    expect(res.valid).toBe(false);
  });

  it('fails on invalid action pack', () => {
    const res = validateActionPack(null);
    expect(res.valid).toBe(false);
  });
});
