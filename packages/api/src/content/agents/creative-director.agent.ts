import { ContentAgentPayload, ContentAgentResponse, CarouselPlan } from '../types';

type CreativeIntent =
  | 'creative_director.generate_canva_prompt'
  | 'creative_director.storyboard_carousel'
  | 'creative_director.visual_direction_for_video'
  | 'creative_director.visual_direction_for_newsletter';

export class CreativeDirectorAgent {
  readonly name = 'creative_director';
  readonly priority = 'P1';
  readonly intents: CreativeIntent[] = [
    'creative_director.generate_canva_prompt',
    'creative_director.storyboard_carousel',
    'creative_director.visual_direction_for_video',
    'creative_director.visual_direction_for_newsletter',
  ];

  async run(intent: CreativeIntent, payload: ContentAgentPayload): Promise<ContentAgentResponse> {
    if (!this.intents.includes(intent)) {
      return { success: false, intent, output: null, warnings: ['Unsupported intent'] };
    }

    const topic = payload.topic || 'Elevated Movements weekly focus';
    const platform = payload.platform || 'carousel';

    switch (intent) {
      case 'creative_director.generate_canva_prompt':
        return {
          success: true,
          intent,
          output: `Create an ${platform} design in Canva: modern, high-contrast, warm skin tones, bold headlines on ${topic}, ample whitespace, EM brand accents.`,
        };
      case 'creative_director.storyboard_carousel':
        const slides: CarouselPlan['slides'] = [
          { title: 'Hook', body: `Lead with a question about ${topic}` },
          { title: 'Why It Matters', body: 'Short rationale + human moment' },
          { title: 'Framework', body: '3-step outline, single idea per slide' },
          { title: 'Action', body: 'Micro-CTA: try today' },
          { title: 'CTA', body: 'Save/share/join newsletter' },
        ];
        return {
          success: true,
          intent,
          output: { slides, canvaPrompt: `Carousel on ${topic} with clear typographic hierarchy and bold imagery.` },
        };
      case 'creative_director.visual_direction_for_video':
        return {
          success: true,
          intent,
          output: `Video direction: 30–45s, A-roll: direct-to-camera, B-roll: founder working/resting, captions on screen, CTA to comment with their focus for the week. Topic: ${topic}.`,
        };
      case 'creative_director.visual_direction_for_newsletter':
        return {
          success: true,
          intent,
          output: `Newsletter visuals: hero banner with abstract gradients, section dividers with subtle icons, pull-quote on ${topic}, button CTA with high contrast.`,
        };
      default:
        return { success: false, intent, output: null, warnings: ['Unhandled intent'] };
    }
  }

  async health() {
    return { status: 'ok', name: this.name, timestamp: new Date().toISOString() };
  }
}
