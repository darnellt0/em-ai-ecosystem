export const CONTENT_SYNTHESIZER_INTENTS = [
  'content_synthesizer.draft_post',
  'content_synthesizer.draft_carousel_copy',
  'content_synthesizer.draft_newsletter_section',
  'content_synthesizer.draft_script',
] as const;

export type ContentSynthesizerIntent = (typeof CONTENT_SYNTHESIZER_INTENTS)[number];
