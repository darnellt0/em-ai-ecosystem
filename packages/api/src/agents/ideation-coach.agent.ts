/**
 * Ideation Coach Agent
 *
 * Helps clients and potential clients brainstorm, refine, and flesh out ideas through
 * conversational guidance. Uses structured coaching techniques to help discover the
 * great idea beneath the surface.
 *
 * Features:
 * - Conversational brainstorming with natural back-and-forth dialogue
 * - Structured guidance using coaching frameworks (GROW, 5 Whys, etc.)
 * - Personalized support that adapts to client's input
 * - Safe, judgment-free exploration space
 * - Session memory to track the ideation journey
 * - Probing questions to deepen thinking
 * - Action items and next steps
 */

import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'test-key',
});

export interface IdeationSession {
  sessionId: string;
  clientName: string;
  clientEmail?: string;
  conversationHistory: ConversationTurn[];
  currentTopic?: string;
  keyInsights: string[];
  actionItems: string[];
  startedAt: Date;
  lastActivityAt: Date;
  stage: 'discovery' | 'exploration' | 'refinement' | 'action';
}

export interface ConversationTurn {
  role: 'client' | 'coach';
  content: string;
  timestamp: Date;
  questionType?: 'open' | 'probing' | 'clarifying' | 'visioning' | 'action';
}

export interface IdeationCoachResponse {
  status: 'ok' | 'error';
  sessionId: string;
  coachResponse: string;
  questionType?: string;
  stage: string;
  keyInsights: string[];
  suggestedActions?: string[];
  conversationSummary?: string;
  nextBestAction: string;
}

// In-memory session store (replace with Redis/DB in production)
const sessions = new Map<string, IdeationSession>();

/**
 * Coaching framework prompts and question banks
 */
const COACHING_FRAMEWORKS = {
  discovery: [
    "What's the core problem or opportunity you're exploring?",
    "Who would benefit most from this idea?",
    "What inspired this idea in the first place?",
    "What would success look like for this idea?",
  ],
  exploration: [
    "What assumptions are you making about this idea?",
    "What would this look like if it were 10x bigger?",
    "What's stopping this idea from existing already?",
    "What would need to be true for this to work?",
    "How does this connect to your broader mission?",
  ],
  refinement: [
    "What's the simplest version of this idea?",
    "What makes this uniquely valuable?",
    "What evidence supports this direction?",
    "What feedback have you received so far?",
    "What would you need to validate this idea?",
  ],
  action: [
    "What's the very first step you could take?",
    "What resources do you already have?",
    "Who could help you move this forward?",
    "What could you test in the next 48 hours?",
    "What's holding you back from starting?",
  ],
};

const SYSTEM_PROMPT = `You are an expert ideation coach for Elevated Movements, specializing in helping clients brainstorm, refine, and flesh out ideas through conversational guidance.

Your role is to:
1. Ask thoughtful, probing questions that help clients think deeper
2. Listen actively and reflect back what you hear to ensure understanding
3. Use coaching frameworks (GROW model, 5 Whys, design thinking) to structure conversations
4. Help clients discover insights they already have but haven't articulated
5. Create a safe, judgment-free space for exploration
6. Guide clients from vague concepts to actionable ideas
7. Identify key insights and suggest concrete next steps

Your coaching style:
- Warm, encouraging, and supportive
- Curious and genuinely interested
- Non-judgmental and open-minded
- Strategic and focused on outcomes
- Empowering clients to find their own answers
- Grounded in the Elevated Movements values: rest, community, growth

Conversation stages:
1. Discovery: Understand the initial idea and context
2. Exploration: Dig deeper, challenge assumptions, expand possibilities
3. Refinement: Clarify, focus, and strengthen the idea
4. Action: Define concrete next steps and commitments

Always end responses with:
- A reflection or insight
- A thought-provoking question
- Encouragement to continue exploring`;

/**
 * Start a new ideation coaching session
 */
export async function startIdeationSession(
  clientName: string,
  initialIdea: string,
  clientEmail?: string
): Promise<IdeationCoachResponse> {
  const sessionId = `ideation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const session: IdeationSession = {
    sessionId,
    clientName,
    clientEmail,
    conversationHistory: [
      {
        role: 'client',
        content: initialIdea,
        timestamp: new Date(),
      },
    ],
    keyInsights: [],
    actionItems: [],
    startedAt: new Date(),
    lastActivityAt: new Date(),
    stage: 'discovery',
  };

  sessions.set(sessionId, session);

  // Generate initial coach response
  const coachResponse = await generateCoachResponse(session, initialIdea);

  // Update session with coach response
  session.conversationHistory.push({
    role: 'coach',
    content: coachResponse.coachResponse,
    timestamp: new Date(),
    questionType: 'open',
  });
  session.lastActivityAt = new Date();

  return {
    ...coachResponse,
    sessionId,
  };
}

/**
 * Continue an existing ideation coaching session
 */
export async function continueIdeationSession(
  sessionId: string,
  clientResponse: string
): Promise<IdeationCoachResponse> {
  const session = sessions.get(sessionId);

  if (!session) {
    return {
      status: 'error',
      sessionId,
      coachResponse: "I couldn't find that session. Let's start fresh - what idea would you like to explore?",
      stage: 'discovery',
      keyInsights: [],
      nextBestAction: 'Start a new session',
    };
  }

  // Add client response to history
  session.conversationHistory.push({
    role: 'client',
    content: clientResponse,
    timestamp: new Date(),
  });

  // Generate coach response
  const coachResponse = await generateCoachResponse(session, clientResponse);

  // Update session
  session.conversationHistory.push({
    role: 'coach',
    content: coachResponse.coachResponse,
    timestamp: new Date(),
    questionType: coachResponse.questionType as any,
  });
  session.keyInsights = coachResponse.keyInsights;
  session.lastActivityAt = new Date();
  session.stage = coachResponse.stage as any;

  return coachResponse;
}

/**
 * Generate coach response using OpenAI
 */
async function generateCoachResponse(
  session: IdeationSession,
  clientMessage: string
): Promise<IdeationCoachResponse> {
  try {
    // Build conversation history for OpenAI
    const messages: any[] = [
      { role: 'system', content: SYSTEM_PROMPT },
    ];

    // Add conversation history (last 10 turns to stay within context limits)
    const recentHistory = session.conversationHistory.slice(-10);
    for (const turn of recentHistory) {
      messages.push({
        role: turn.role === 'coach' ? 'assistant' : 'user',
        content: turn.content,
      });
    }

    // Add stage-specific guidance
    const stageGuidance = getStageGuidance(session.stage, session.conversationHistory.length);
    messages.push({
      role: 'system',
      content: stageGuidance,
    });

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages,
      temperature: 0.8, // Higher temperature for more creative responses
      max_tokens: 500,
    });

    const coachResponse = completion.choices[0]?.message?.content ||
      "I'm here to help you explore this idea. Tell me more about what you're thinking.";

    // Extract insights and determine next stage
    const insights = extractInsights(session.conversationHistory, coachResponse);
    const nextStage = determineNextStage(session.stage, session.conversationHistory.length, coachResponse);
    const questionType = classifyQuestionType(coachResponse);

    return {
      status: 'ok',
      sessionId: session.sessionId,
      coachResponse,
      questionType,
      stage: nextStage,
      keyInsights: insights,
      nextBestAction: getNextBestAction(nextStage),
    };
  } catch (error) {
    console.error('Ideation coach error:', error);

    // Fallback to rule-based coaching
    return generateFallbackResponse(session, clientMessage);
  }
}

/**
 * Get stage-specific guidance for the AI coach
 */
function getStageGuidance(stage: string, turnCount: number): string {
  const guidance = {
    discovery: `Current stage: DISCOVERY (turns: ${turnCount})
Focus on understanding the client's initial idea, context, and motivation. Ask open-ended questions about what inspired them, who it's for, and what problem it solves. Listen deeply and reflect back what you hear.`,

    exploration: `Current stage: EXPLORATION (turns: ${turnCount})
Help the client expand their thinking. Challenge assumptions, explore "what if" scenarios, and help them see connections they haven't considered. Ask probing questions that deepen their understanding.`,

    refinement: `Current stage: REFINEMENT (turns: ${turnCount})
Help the client focus and strengthen their idea. Ask clarifying questions about uniqueness, value proposition, and feasibility. Help them articulate the core essence of their idea clearly.`,

    action: `Current stage: ACTION (turns: ${turnCount})
Guide the client toward concrete next steps. Help them identify the smallest viable first step, resources they need, and potential obstacles. Create accountability through specific commitments.`,
  };

  return guidance[stage as keyof typeof guidance] || guidance.discovery;
}

/**
 * Determine the next conversation stage based on progress
 */
function determineNextStage(
  currentStage: string,
  turnCount: number,
  coachResponse: string
): string {
  // Stage progression logic
  if (currentStage === 'discovery' && turnCount >= 6) return 'exploration';
  if (currentStage === 'exploration' && turnCount >= 12) return 'refinement';
  if (currentStage === 'refinement' && turnCount >= 18) return 'action';

  // Check if coach is naturally transitioning to action
  const actionKeywords = ['next step', 'first step', 'action', 'start', 'begin', 'test'];
  if (actionKeywords.some(keyword => coachResponse.toLowerCase().includes(keyword))) {
    if (currentStage === 'refinement') return 'action';
  }

  return currentStage;
}

/**
 * Classify the type of question being asked
 */
function classifyQuestionType(response: string): string {
  const lower = response.toLowerCase();

  if (lower.includes('what if') || lower.includes('imagine')) return 'visioning';
  if (lower.includes('why') || lower.includes('what makes')) return 'probing';
  if (lower.includes('can you tell me more') || lower.includes('help me understand')) return 'clarifying';
  if (lower.includes('next step') || lower.includes('how could you')) return 'action';

  return 'open';
}

/**
 * Extract key insights from the conversation
 */
function extractInsights(history: ConversationTurn[], latestResponse: string): string[] {
  const insights: string[] = [];

  // Look for insight markers in client responses
  const clientTurns = history.filter(t => t.role === 'client');
  const recentClient = clientTurns.slice(-3);

  for (const turn of recentClient) {
    const content = turn.content.toLowerCase();

    // Detect realization moments
    if (content.includes('i realize') || content.includes('i see') ||
        content.includes('that makes me think') || content.includes('actually')) {
      insights.push(turn.content.substring(0, 150));
    }
  }

  return insights.slice(0, 5); // Keep top 5 insights
}

/**
 * Get next best action based on stage
 */
function getNextBestAction(stage: string): string {
  const actions = {
    discovery: 'Continue sharing your thoughts and context',
    exploration: 'Explore different angles and possibilities',
    refinement: 'Focus on clarifying and strengthening your idea',
    action: 'Identify your first concrete step',
  };

  return actions[stage as keyof typeof actions] || 'Continue the conversation';
}

/**
 * Generate a fallback response when OpenAI is unavailable
 */
function generateFallbackResponse(
  session: IdeationSession,
  clientMessage: string
): IdeationCoachResponse {
  const stage = session.stage;
  const questions = COACHING_FRAMEWORKS[stage];
  const randomQuestion = questions[Math.floor(Math.random() * questions.length)];

  const response = `I appreciate you sharing that. ${randomQuestion}`;

  return {
    status: 'ok',
    sessionId: session.sessionId,
    coachResponse: response,
    questionType: 'open',
    stage,
    keyInsights: session.keyInsights,
    nextBestAction: getNextBestAction(stage),
  };
}

/**
 * Get session summary and action items
 */
export function getSessionSummary(sessionId: string): {
  status: 'ok' | 'error';
  sessionId: string;
  summary: string;
  keyInsights: string[];
  actionItems: string[];
  conversationLength: number;
  duration: string;
} {
  const session = sessions.get(sessionId);

  if (!session) {
    return {
      status: 'error',
      sessionId,
      summary: 'Session not found',
      keyInsights: [],
      actionItems: [],
      conversationLength: 0,
      duration: '0 minutes',
    };
  }

  const duration = Math.round((session.lastActivityAt.getTime() - session.startedAt.getTime()) / 60000);

  // Generate summary from conversation
  const clientTurns = session.conversationHistory.filter(t => t.role === 'client');
  const mainIdea = clientTurns[0]?.content || 'Unknown idea';
  const recentThoughts = clientTurns.slice(-3).map(t => t.content).join(' ');

  const summary = `Session with ${session.clientName} exploring: ${mainIdea.substring(0, 200)}...

Latest thinking: ${recentThoughts.substring(0, 300)}...`;

  return {
    status: 'ok',
    sessionId,
    summary,
    keyInsights: session.keyInsights,
    actionItems: session.actionItems,
    conversationLength: session.conversationHistory.length,
    duration: `${duration} minutes`,
  };
}

/**
 * End a session and provide final summary
 */
export async function endSession(sessionId: string): Promise<{
  status: 'ok' | 'error';
  sessionId: string;
  finalMessage: string;
  summary: string;
  keyInsights: string[];
  suggestedNextSteps: string[];
}> {
  const session = sessions.get(sessionId);

  if (!session) {
    return {
      status: 'error',
      sessionId,
      finalMessage: 'Session not found',
      summary: '',
      keyInsights: [],
      suggestedNextSteps: [],
    };
  }

  const summaryData = getSessionSummary(sessionId);

  const finalMessage = `Thank you for this ideation session, ${session.clientName}!

It's been wonderful exploring your idea with you. Remember, the best ideas evolve through action and iteration. You've made great progress today - keep that momentum going!

Feel free to come back anytime to continue refining or to explore new ideas. I'm here to support your journey.`;

  const suggestedNextSteps = [
    'Write down your top 3 insights from this conversation',
    'Identify one small action you can take in the next 48 hours',
    'Share your idea with someone you trust and get feedback',
    'Schedule time to continue developing this idea',
    'Return for another session when you have new questions',
  ];

  // Keep session in memory for 24 hours, then clean up
  setTimeout(() => {
    sessions.delete(sessionId);
  }, 24 * 60 * 60 * 1000);

  return {
    status: 'ok',
    sessionId,
    finalMessage,
    summary: summaryData.summary,
    keyInsights: summaryData.keyInsights,
    suggestedNextSteps,
  };
}

/**
 * Get all active sessions (for admin/monitoring)
 */
export function getActiveSessions(): {
  sessionId: string;
  clientName: string;
  stage: string;
  turnCount: number;
  lastActivity: Date;
}[] {
  return Array.from(sessions.values()).map(session => ({
    sessionId: session.sessionId,
    clientName: session.clientName,
    stage: session.stage,
    turnCount: session.conversationHistory.length,
    lastActivity: session.lastActivityAt,
  }));
}
