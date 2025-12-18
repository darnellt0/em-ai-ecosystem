import { ContentSynthesizerAgent } from '../../src/content/agents/content-synthesizer.agent';

describe('ContentSynthesizerAgent', () => {
  const agent = new ContentSynthesizerAgent();

  it('drafts posts', async () => {
    const res = await agent.run('content_synthesizer.draft_post', { topic: 'rest', themes: ['rest'], tone: 'warm' });
    expect(res.success).toBe(true);
    expect(Array.isArray(res.output)).toBe(true);
    expect(res.output.length).toBeGreaterThan(0);
  });

  it('handles unsupported intent', async () => {
    const res = await agent.run('content_synthesizer.draft_script' as any, {});
    expect(res.intent).toBe('content_synthesizer.draft_script');
  });
});
