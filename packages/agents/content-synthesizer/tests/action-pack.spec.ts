import { runActionPack } from '../workflows';

describe('ContentSynthesizer Action Pack', () => {
  it('generates artifacts', async () => {
    const res = await runActionPack({ userId: 'darnell', mode: 'founder', topic: 'focus', themes: ['focus'] });
    expect(res.linkedinDraft).toBeDefined();
    expect(res.emailDraft).toContain('darnell');
  });
});
