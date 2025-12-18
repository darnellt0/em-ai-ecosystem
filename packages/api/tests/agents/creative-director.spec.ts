import { CreativeDirectorAgent } from '../../src/content/agents/creative-director.agent';

describe('CreativeDirectorAgent', () => {
  const agent = new CreativeDirectorAgent();

  it('generates canva prompt', async () => {
    const res = await agent.run('creative_director.generate_canva_prompt', { topic: 'leadership' });
    expect(res.success).toBe(true);
    expect(typeof res.output).toBe('string');
  });

  it('storyboards carousel', async () => {
    const res = await agent.run('creative_director.storyboard_carousel', { topic: 'rest' });
    expect(res.success).toBe(true);
    expect(Array.isArray(res.output.slides)).toBe(true);
  });
});
