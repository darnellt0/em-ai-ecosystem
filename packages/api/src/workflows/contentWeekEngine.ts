import { ContentSynthesizerAgent } from '../content/agents/content-synthesizer.agent';
import { BrandStorytellerAgent } from '../content/agents/brand-storyteller.agent';
import { CreativeDirectorAgent } from '../content/agents/creative-director.agent';
import { WeeklyContentPack, WeeklyContentRequest } from '../content/types';

const defaultChannels = ['linkedin', 'instagram', 'newsletter'];

async function extractThemes(request: WeeklyContentRequest): Promise<string[]> {
  // Placeholder: in future, call Insight Analyst / Journal / Niche / Purpose / Rhythm agents
  const focus = request.focus || 'leadership';
  return [
    `${focus} and rest rhythms`,
    'community-centered leadership',
    'strengths-first storytelling',
  ];
}

export async function generateWeeklyContentPack(request: WeeklyContentRequest): Promise<WeeklyContentPack> {
  const scope = request.scope || 'elevated_movements';
  const channels = request.channels?.length ? request.channels : defaultChannels;
  const tone = request.tone || 'standard_week';
  const focus = request.focus || 'default';

  const themes = await extractThemes(request);

  const synthesizer = new ContentSynthesizerAgent();
  const storyteller = new BrandStorytellerAgent();
  const creativeDirector = new CreativeDirectorAgent();

  // Draft base content concurrently
  const [posts, carousel, newsletter, script] = await Promise.all([
    synthesizer.run('content_synthesizer.draft_post', { themes, tone, topic: focus }),
    synthesizer.run('content_synthesizer.draft_carousel_copy', { themes, tone, topic: focus }),
    synthesizer.run('content_synthesizer.draft_newsletter_section', { themes, tone, topic: focus }),
    synthesizer.run('content_synthesizer.draft_script', { themes, tone, topic: focus }),
  ]);

  const linkedinDrafts = Array.isArray(posts.output) ? posts.output : [posts.output];
  const instagramDrafts = Array.isArray(posts.output) ? posts.output : [posts.output];

  // Refine per channel
  const [linkedinRefined, instagramRefined, newsletterRefined] = await Promise.all([
    storyteller.run('brand_storyteller.refine_for_linkedin', { text: linkedinDrafts }),
    storyteller.run('brand_storyteller.refine_for_instagram', { text: instagramDrafts }),
    storyteller.run('brand_storyteller.refine_for_newsletter', { text: newsletter.output }),
  ]);

  // Creative direction
  const [carouselPlan, videoDirection, newsletterVisual] = await Promise.all([
    creativeDirector.run('creative_director.storyboard_carousel', {
      topic: focus,
      platform: 'carousel',
      themes,
    }),
    creativeDirector.run('creative_director.visual_direction_for_video', {
      topic: focus,
      platform: 'video',
    }),
    creativeDirector.run('creative_director.visual_direction_for_newsletter', {
      topic: focus,
      platform: 'newsletter',
    }),
  ]);

  const canvaPrompt = await creativeDirector.run('creative_director.generate_canva_prompt', {
    topic: focus,
    platform: 'carousel',
  });

  const pack: WeeklyContentPack = {
    weekSummary: `Weekly content pack for ${scope} focusing on ${focus} with tone ${tone}.`,
    themes,
    linkedinPosts: Array.isArray(linkedinRefined.output) ? linkedinRefined.output : [linkedinRefined.output],
    instagramPosts: Array.isArray(instagramRefined.output) ? instagramRefined.output : [instagramRefined.output],
    newsletterSections: Array.isArray(newsletterRefined.output)
      ? newsletterRefined.output
      : [newsletterRefined.output],
    videoScripts: Array.isArray(script.output) ? script.output : [script.output],
    carousel: {
      slides: carouselPlan.output?.slides || [],
      canvaPrompt: typeof canvaPrompt.output === 'string' ? canvaPrompt.output : canvaPrompt.output?.canvaPrompt || '',
    },
    visualGuidance: {
      general: 'Use warm, strengths-centered EM brand voice and inclusive imagery.',
      video: typeof videoDirection.output === 'string' ? videoDirection.output : '',
      newsletter: typeof newsletterVisual.output === 'string' ? newsletterVisual.output : '',
    },
    meta: {
      generatedAt: new Date().toISOString(),
      sourceAgents: ['content_synthesizer', 'brand_storyteller', 'creative_director'],
      scope,
      channels,
      tone,
      focus,
    },
  };

  return pack;
}
