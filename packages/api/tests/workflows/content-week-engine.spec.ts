import { generateWeeklyContentPack } from '../../src/workflows/contentWeekEngine';

describe('contentWeekEngine', () => {
  it('generates a weekly content pack', async () => {
    const pack = await generateWeeklyContentPack({
      scope: 'elevated_movements',
      channels: ['linkedin', 'instagram', 'newsletter'],
      focus: 'rest_and_leadership',
      tone: 'standard_week',
    });

    expect(pack.themes.length).toBeGreaterThan(0);
    expect(pack.linkedinPosts.length).toBeGreaterThan(0);
    expect(pack.carousel.slides.length).toBeGreaterThan(0);
    expect(pack.meta.sourceAgents).toContain('content_synthesizer');
  });

  it('gracefully handles missing channels (defaults applied)', async () => {
    const pack = await generateWeeklyContentPack({
      scope: 'elevated_movements',
      channels: [],
    } as any);
    expect(pack.meta.channels.length).toBeGreaterThan(0);
  });
});
