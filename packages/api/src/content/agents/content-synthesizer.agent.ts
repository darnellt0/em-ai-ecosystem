import { ContentAgentPayload, ContentAgentResponse } from '../types';

type SynthIntent =
  | 'content_synthesizer.draft_post'
  | 'content_synthesizer.draft_carousel_copy'
  | 'content_synthesizer.draft_newsletter_section'
  | 'content_synthesizer.draft_script';

export class ContentSynthesizerAgent {
  readonly name = 'content_synthesizer';
  readonly priority = 'P0';
  readonly intents: SynthIntent[] = [
    'content_synthesizer.draft_post',
    'content_synthesizer.draft_carousel_copy',
    'content_synthesizer.draft_newsletter_section',
    'content_synthesizer.draft_script',
  ];

  async run(intent: SynthIntent, payload: ContentAgentPayload): Promise<ContentAgentResponse> {
    if (!this.intents.includes(intent)) {
      return { success: false, intent, output: null, warnings: ['Unsupported intent'] };
    }

    const topic = payload.topic || 'Elevated Movements weekly themes';
    const themes = payload.themes || ['leadership', 'rest', 'community'];
    const tone = payload.tone || 'warm, strengths-centered, clear';
    const base = `Topic: ${topic}. Themes: ${themes.join(', ')}. Tone: ${tone}.`;

    switch (intent) {
      case 'content_synthesizer.draft_post':
        return {
          success: true,
          intent,
          output: [
            `LinkedIn draft: ${base} Highlight a leadership insight and invite reflection.`,
            `IG caption draft: ${base} Short, emotive opener + CTA to save/share.`,
          ],
        };
      case 'content_synthesizer.draft_carousel_copy':
        return {
          success: true,
          intent,
          output: [
            { title: 'Slide 1', body: `Hook tied to ${topic}` },
            { title: 'Slide 2', body: `Key idea on ${themes[0]}` },
            { title: 'Slide 3', body: `Tactical step for ${themes[1]}` },
            { title: 'Slide 4', body: `CTA: practice + share` },
          ],
        };
      case 'content_synthesizer.draft_newsletter_section':
        return {
          success: true,
          intent,
          output: [`Newsletter intro: ${base} Offer one actionable prompt and a brief story.`],
        };
      case 'content_synthesizer.draft_script':
        return {
          success: true,
          intent,
          output: [`Short video script: ${base} 30-45s story, 1 tactic, 1 CTA.`],
        };
      default:
        return { success: false, intent, output: null, warnings: ['Unhandled intent'] };
    }
  }

  async health() {
    return { status: 'ok', name: this.name, timestamp: new Date().toISOString() };
  }
}
