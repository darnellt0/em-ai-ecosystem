import { ContentSynthesizerAgent } from './agents/content-synthesizer.agent';
import { BrandStorytellerAgent } from './agents/brand-storyteller.agent';
import { CreativeDirectorAgent } from './agents/creative-director.agent';

export interface ContentAgentMetadata {
  id: string;
  name: string;
  description: string;
  priority: 'P0' | 'P1';
  intents: string[];
}

export interface ContentAgentEntry {
  metadata: ContentAgentMetadata;
  instantiate: () => any;
}

export const CONTENT_AGENT_REGISTRY: Record<string, ContentAgentEntry> = {
  'content_synthesizer': {
    metadata: {
      id: 'content_synthesizer',
      name: 'Content Synthesizer',
      description: 'Drafts weekly content across channels (posts, carousels, newsletter, scripts).',
      priority: 'P0',
      intents: [
        'content_synthesizer.draft_post',
        'content_synthesizer.draft_carousel_copy',
        'content_synthesizer.draft_newsletter_section',
        'content_synthesizer.draft_script',
      ],
    },
    instantiate: () => new ContentSynthesizerAgent(),
  },
  'brand_storyteller': {
    metadata: {
      id: 'brand_storyteller',
      name: 'Brand Storyteller',
      description: 'Applies EM brand voice and channel-specific refinement.',
      priority: 'P1',
      intents: [
        'brand_storyteller.apply_brand_voice',
        'brand_storyteller.refine_for_linkedin',
        'brand_storyteller.refine_for_instagram',
        'brand_storyteller.refine_for_newsletter',
      ],
    },
    instantiate: () => new BrandStorytellerAgent(),
  },
  'creative_director': {
    metadata: {
      id: 'creative_director',
      name: 'Creative Director',
      description: 'Provides visual direction, storyboards, and Canva prompts.',
      priority: 'P1',
      intents: [
        'creative_director.generate_canva_prompt',
        'creative_director.storyboard_carousel',
        'creative_director.visual_direction_for_video',
        'creative_director.visual_direction_for_newsletter',
      ],
    },
    instantiate: () => new CreativeDirectorAgent(),
  },
};

export function getContentAgent(id: string) {
  const entry = CONTENT_AGENT_REGISTRY[id];
  if (!entry) return null;
  return entry.instantiate();
}
