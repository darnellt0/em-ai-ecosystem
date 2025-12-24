/**
 * P0 Niche Discovery Flow
 *
 * Per MAB v1.0 Section 5.2:
 * "Helps clients discover and validate their niche."
 *
 * Features:
 * - Multi-stage discovery flow
 * - Theme generation
 * - Niche recommendations
 */

export interface NicheDiscoverInput {
  userId: string;
  stage?: 'start' | 'skills' | 'passions' | 'audience' | 'impact' | 'synthesize';
  responses?: Record<string, string[]>;
  currentResponse?: string[];
}

export interface NicheDiscoverOutput {
  userId: string;
  stage: string;
  nextStage: string | null;
  progress: number;  // 0-100
  prompt: string;
  previousResponses: Record<string, string[]>;
  themes?: Array<{
    name: string;
    description: string;
    keywords: string[];
    matchScore: number;
  }>;
  suggestedNiche?: {
    statement: string;
    audience: string;
    uniqueValue: string;
    keywords: string[];
  };
  isComplete: boolean;
}

const DISCOVERY_STAGES = ['start', 'skills', 'passions', 'audience', 'impact', 'synthesize'];

const STAGE_PROMPTS: Record<string, string> = {
  start: "Let's discover your niche. First, what are your top 3-5 professional skills or areas of expertise?",
  skills: "Great! Now, what topics or activities are you most passionate about? What energizes you?",
  passions: "Who do you most want to help? Describe your ideal audience or client.",
  audience: "What impact do you want to have? What transformation do you want to create for your audience?",
  impact: "Perfect! Let me synthesize your responses into niche themes...",
  synthesize: "Your niche discovery is complete! Review your suggested niche below.",
};

export async function runP0NicheDiscover(
  input: NicheDiscoverInput
): Promise<{ runId: string; data: NicheDiscoverOutput }> {
  const runId = `niche_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const currentStage = input.stage || 'start';

  console.log(`[P0 Niche Discover] Starting run ${runId} for ${input.userId}`);
  console.log(`[P0 Niche Discover] Stage: ${currentStage}`);

  // Build responses from previous stages
  const previousResponses = input.responses || {};

  // Add current response to the appropriate stage
  if (input.currentResponse && input.currentResponse.length > 0) {
    const responseStage = getPreviousStage(currentStage);
    if (responseStage) {
      previousResponses[responseStage] = input.currentResponse;
    }
  }

  // Calculate progress
  const stageIndex = DISCOVERY_STAGES.indexOf(currentStage);
  const progress = Math.round((stageIndex / (DISCOVERY_STAGES.length - 1)) * 100);

  // Determine next stage
  const nextStage = getNextStage(currentStage);
  const isComplete = currentStage === 'synthesize';

  // Get prompt for current stage
  const prompt = STAGE_PROMPTS[currentStage] || STAGE_PROMPTS.start;

  // Generate themes and suggested niche if at synthesize stage
  let themes: NicheDiscoverOutput['themes'];
  let suggestedNiche: NicheDiscoverOutput['suggestedNiche'];

  if (currentStage === 'synthesize' || currentStage === 'impact') {
    themes = generateThemes(previousResponses);

    if (themes.length > 0) {
      const topTheme = themes[0];
      suggestedNiche = {
        statement: `Help ${previousResponses.audience?.[0] || 'your audience'} achieve ${previousResponses.impact?.[0] || 'transformation'} through ${topTheme.name.toLowerCase()}`,
        audience: previousResponses.audience?.join(', ') || 'Your ideal clients',
        uniqueValue: topTheme.description,
        keywords: topTheme.keywords,
      };
    }
  }

  const output: NicheDiscoverOutput = {
    userId: input.userId,
    stage: currentStage,
    nextStage,
    progress,
    prompt,
    previousResponses,
    themes,
    suggestedNiche,
    isComplete,
  };

  console.log(`[P0 Niche Discover] Complete: ${runId}`, {
    stage: currentStage,
    progress,
    hasThemes: !!themes,
    isComplete,
  });

  return { runId, data: output };
}

function getNextStage(current: string): string | null {
  const index = DISCOVERY_STAGES.indexOf(current);
  if (index === -1 || index >= DISCOVERY_STAGES.length - 1) {
    return null;
  }
  return DISCOVERY_STAGES[index + 1];
}

function getPreviousStage(current: string): string | null {
  const index = DISCOVERY_STAGES.indexOf(current);
  if (index <= 0) {
    return null;
  }
  return DISCOVERY_STAGES[index - 1];
}

function generateThemes(responses: Record<string, string[]>): NicheDiscoverOutput['themes'] {
  const skills = responses.skills || [];
  const passions = responses.passions || [];
  const audience = responses.audience || [];
  const impact = responses.impact || [];

  // Simple theme generation based on responses
  const themes: NicheDiscoverOutput['themes'] = [];

  // Theme 1: Primary expertise + passion
  if (skills.length > 0 && passions.length > 0) {
    themes.push({
      name: `${skills[0]} for ${passions[0]}`,
      description: `Combining your expertise in ${skills[0].toLowerCase()} with your passion for ${passions[0].toLowerCase()}`,
      keywords: [...skills.slice(0, 2), ...passions.slice(0, 2)],
      matchScore: 0.85,
    });
  }

  // Theme 2: Audience-focused
  if (audience.length > 0 && impact.length > 0) {
    themes.push({
      name: `${impact[0]} for ${audience[0]}`,
      description: `Helping ${audience[0].toLowerCase()} achieve ${impact[0].toLowerCase()}`,
      keywords: [...audience.slice(0, 2), ...impact.slice(0, 2)],
      matchScore: 0.78,
    });
  }

  // Theme 3: Blended
  if (skills.length > 0 && audience.length > 0) {
    themes.push({
      name: `${skills[0]} Coach`,
      description: `Expert guidance in ${skills[0].toLowerCase()} for ${audience[0]?.toLowerCase() || 'aspiring professionals'}`,
      keywords: [skills[0], audience[0] || 'professionals', 'coaching', 'growth'],
      matchScore: 0.72,
    });
  }

  // Default theme if no responses
  if (themes.length === 0) {
    themes.push({
      name: 'Personal Development Coach',
      description: 'Guiding individuals toward growth and transformation',
      keywords: ['coaching', 'growth', 'transformation', 'development'],
      matchScore: 0.65,
    });
  }

  return themes;
}
