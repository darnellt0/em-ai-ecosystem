import { ContentAgentPayload, ContentAgentResponse } from '../types';

type StoryIntent =
  | 'brand_storyteller.apply_brand_voice'
  | 'brand_storyteller.refine_for_linkedin'
  | 'brand_storyteller.refine_for_instagram'
  | 'brand_storyteller.refine_for_newsletter';

export class BrandStorytellerAgent {
  readonly name = 'brand_storyteller';
  readonly priority = 'P1';
  readonly intents: StoryIntent[] = [
    'brand_storyteller.apply_brand_voice',
    'brand_storyteller.refine_for_linkedin',
    'brand_storyteller.refine_for_instagram',
    'brand_storyteller.refine_for_newsletter',
  ];

  async run(intent: StoryIntent, payload: ContentAgentPayload & { text?: string | string[] }): Promise<ContentAgentResponse> {
    if (!this.intents.includes(intent)) {
      return { success: false, intent, output: null, warnings: ['Unsupported intent'] };
    }

    const input = payload.text || 'Draft copy';
    const branded = (text: string) =>
      `${text} — In EM voice: strengths-centered, women of color forward, inclusive, clear CTA.`;

    switch (intent) {
      case 'brand_storyteller.apply_brand_voice':
        return { success: true, intent, output: Array.isArray(input) ? input.map(branded) : branded(String(input)) };
      case 'brand_storyteller.refine_for_linkedin':
        return {
          success: true,
          intent,
          output: Array.isArray(input)
            ? input.map((t) => `${branded(t)} Format: hook, insight, takeaway, CTA.`)
            : `${branded(String(input))} Format: hook, insight, takeaway, CTA.`,
        };
      case 'brand_storyteller.refine_for_instagram':
        return {
          success: true,
          intent,
          output: Array.isArray(input)
            ? input.map((t) => `${branded(t)} Keep it skimmable, 2–3 short lines, CTA to save/share.`)
            : `${branded(String(input))} Keep it skimmable, 2–3 short lines, CTA to save/share.`,
        };
      case 'brand_storyteller.refine_for_newsletter':
        return {
          success: true,
          intent,
          output: Array.isArray(input)
            ? input.map((t) => `${branded(t)} Add greeting, section headers, and closing with next steps.`)
            : `${branded(String(input))} Add greeting, section headers, and closing with next steps.`,
        };
      default:
        return { success: false, intent, output: null, warnings: ['Unhandled intent'] };
    }
  }

  async health() {
    return { status: 'ok', name: this.name, timestamp: new Date().toISOString() };
  }
}
