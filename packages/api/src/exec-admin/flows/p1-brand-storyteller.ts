export type BrandStoryContext = 'email' | 'post' | 'prompt' | 'summary' | 'system_message';
export type BrandStoryAudience = 'clients' | 'partners' | 'community' | 'internal';

export interface BrandStorytellerInput {
  userId?: string;
  content?: string;
  context?: BrandStoryContext;
  audience?: BrandStoryAudience;
  toneHint?: string;
  mode?: 'offline' | 'live';
}

export interface BrandStorytellerOutput {
  runId: string;
  userId: string;
  context: BrandStoryContext;
  audience: BrandStoryAudience;
  alignedContent: string;
  voiceNotes: string[];
  confidenceScore: number;
  recommendedNextAction: string;
  insight?: string;
  reflectionPrompt?: string;
  mode: 'offline' | 'live';
  offline: boolean;
  generatedAt: string;
}

const VALID_CONTEXTS: BrandStoryContext[] = ['email', 'post', 'prompt', 'summary', 'system_message'];
const VALID_AUDIENCES: BrandStoryAudience[] = ['clients', 'partners', 'community', 'internal'];

export async function runP1BrandStoryteller(
  input: BrandStorytellerInput
): Promise<{ runId: string; data: BrandStorytellerOutput }> {
  const runId = `brand_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const userId = normalizeString(input?.userId, 'unknown');
  const context = normalizeContext(input?.context);
  const audience = normalizeAudience(input?.audience);
  const toneHint = normalizeString(input?.toneHint);
  const content = normalizeString(input?.content);

  const missingContext = !isValidContext(input?.context);
  const missingAudience = !isValidAudience(input?.audience);
  const missingContent = !content;
  const missingUser = userId === 'unknown';

  let confidenceScore = 0.75;
  if (missingContext && missingAudience) {
    confidenceScore = 0.45;
  } else if (missingContext || missingAudience) {
    confidenceScore = 0.55;
  }

  if (missingContent) {
    confidenceScore = 0.3;
  }

  if (missingUser) {
    confidenceScore = Math.min(confidenceScore, 0.4);
  }

  const alignedContent = missingContent
    ? 'Share the source message you want aligned, and I will tune it to the EM voice.'
    : buildAlignedContent({
        content,
        context,
        audience,
        toneHint,
      });

  const voiceNotes = missingContent
    ? ['Missing source content; provided a placeholder request.']
    : buildVoiceNotes({
        context,
        audience,
        toneHint,
        missingContext,
        missingAudience,
      });

  const recommendedNextAction = buildNextAction({
    missingContent,
    missingContext,
    missingAudience,
    missingUser,
  });

  const insight = missingContent
    ? 'Without source copy, the output is a placeholder.'
    : missingContext || missingAudience
      ? 'Context or audience was inferred; alignment may be off.'
      : 'Clarity and directness were reinforced to match the EM voice.';

  const reflectionPrompt = missingContent
    ? 'What do you want the reader to feel or do after this message?'
    : undefined;

  const output: BrandStorytellerOutput = {
    runId,
    userId,
    context,
    audience,
    alignedContent,
    voiceNotes,
    confidenceScore,
    recommendedNextAction,
    insight,
    reflectionPrompt,
    mode: 'offline',
    offline: true,
    generatedAt: new Date().toISOString(),
  };

  console.log('[P1 Brand Storyteller] Complete', { runId, offline: true });

  return { runId, data: output };
}

function isValidContext(value?: string): value is BrandStoryContext {
  return !!value && VALID_CONTEXTS.includes(value as BrandStoryContext);
}

function isValidAudience(value?: string): value is BrandStoryAudience {
  return !!value && VALID_AUDIENCES.includes(value as BrandStoryAudience);
}

function normalizeContext(value?: string): BrandStoryContext {
  return isValidContext(value) ? value : 'post';
}

function normalizeAudience(value?: string): BrandStoryAudience {
  return isValidAudience(value) ? value : 'community';
}

function normalizeString(value?: string, fallback?: string): string {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }
  return fallback || '';
}

function buildAlignedContent(input: {
  content: string;
  context: BrandStoryContext;
  audience: BrandStoryAudience;
  toneHint?: string;
}): string {
  const base = input.content.replace(/\s+/g, ' ').trim();
  const lead = input.context === 'email' ? 'Quick update:' : 'Quick clarity:';
  const close = input.context === 'email'
    ? 'Let me know if you want the next step.'
    : 'Reply if you want the next step.';
  const toneNote = input.toneHint ? ` Tone: ${input.toneHint}.` : '';
  return `${lead} ${base}${base.endsWith('.') ? '' : '.'} ${close}${toneNote}`;
}

function buildVoiceNotes(input: {
  context: BrandStoryContext;
  audience: BrandStoryAudience;
  toneHint?: string;
  missingContext: boolean;
  missingAudience: boolean;
}): string[] {
  const notes: string[] = [];
  notes.push('Simplified phrasing to prioritize clarity and action.');
  notes.push(`Aligned tone for ${input.audience} in a ${input.context} context.`);

  if (input.toneHint) {
    notes.push(`Honored tone hint: ${input.toneHint}.`);
  }
  if (input.missingContext || input.missingAudience) {
    notes.push('Context or audience inferred; confirm for tighter alignment.');
  }

  return notes;
}

function buildNextAction(input: {
  missingContent: boolean;
  missingContext: boolean;
  missingAudience: boolean;
  missingUser: boolean;
}): string {
  if (input.missingContent) {
    return 'Paste the source content and confirm the intended audience.';
  }
  if (input.missingContext || input.missingAudience) {
    return 'Confirm the target audience and context so I can refine the voice.';
  }
  if (input.missingUser) {
    return 'Share the correct userId so I can log this update.';
  }
  return 'Approve this draft or share any tone tweaks.';
}
