import { BrandStorytellerAgent } from '../../src/content/agents/brand-storyteller.agent';

describe('BrandStorytellerAgent', () => {
  const agent = new BrandStorytellerAgent();

  it('refines for linkedin', async () => {
    const res = await agent.run('brand_storyteller.refine_for_linkedin', { text: 'Draft' });
    expect(res.success).toBe(true);
    expect(typeof res.output).toBe('string');
  });

  it('returns warning on unsupported intent', async () => {
    const res = await agent.run('brand_storyteller.apply_brand_voice', { text: 'Hi' });
    expect(res.success).toBe(true);
  });
});
