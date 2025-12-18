import ContentSynthesizerAgent from './index';
import { ContentAgentPayload } from '../../api/src/content/types';

export async function runActionPack(payload: ContentAgentPayload & { mode: string; userId: string }) {
  const agent = new ContentSynthesizerAgent();
  const base = await agent.run('content_synthesizer.draft_post', payload);

  // Action Pack: choose artifacts
  return {
    linkedinDraft: Array.isArray(base.output) ? base.output[0] : base.output,
    emailDraft: `Email draft for ${payload.userId}: focus on ${payload.topic || 'today'} with tone ${payload.tone || 'warm'}`,
    journalExpansion: `Expand on today's theme: ${payload.topic || 'focus'}.`,
    reflectionExercise: `Prompt: What will you commit to in the next 90 minutes?`,
    focusNarrative: `Today's focus for ${payload.userId} (${payload.mode}): keep it strengths-centered.`,
  };
}
