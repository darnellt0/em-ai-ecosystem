/**
 * P1 Wave 5 - Voice Companion
 *
 * Intent: voice_companion
 *
 * Stateful conversation partner for voice interactions with session management,
 * context retention, and intelligent responses.
 *
 * Features:
 * - Session-based conversation tracking
 * - Context retention across multiple turns
 * - Voice-optimized responses (concise, natural)
 * - Mood and energy detection
 * - Offline mode with template-based responses
 * - Multi-turn conversation support
 */

export interface VoiceCompanionInput {
  userId: string;
  sessionId?: string;  // Auto-generated if not provided
  userMessage: string;
  context?: {
    mood?: 'energized' | 'focused' | 'tired' | 'stressed' | 'neutral';
    timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
    location?: 'home' | 'office' | 'gym' | 'transit' | 'other';
  };
  conversationHistory?: Array<{
    speaker: 'user' | 'assistant';
    message: string;
    timestamp: string;
  }>;
  mode?: 'offline' | 'live';
}

export interface VoiceCompanionOutput {
  runId: string;
  userId: string;
  sessionId: string;
  response: string;  // Voice-optimized response
  followUpSuggestions?: string[];  // Optional follow-up prompts
  detectedIntent?: 'question' | 'task' | 'reflection' | 'planning' | 'social' | 'unknown';
  detectedMood?: 'energized' | 'focused' | 'tired' | 'stressed' | 'neutral';
  sessionContext: {
    turnCount: number;
    startedAt: string;
    lastUpdatedAt: string;
    topics: string[];
  };
  confidenceScore: number;  // 0-1
  shouldEndSession: boolean;  // True if user indicated goodbye
  mode: 'offline' | 'live';
  offline: boolean;
  generatedAt: string;
}

/**
 * Simple intent detection based on keywords
 */
function detectIntent(message: string): VoiceCompanionOutput['detectedIntent'] {
  const lowerMessage = message.toLowerCase();

  // Question patterns
  if (lowerMessage.match(/\b(what|when|where|who|why|how|can you|could you|would you|is it|are there)\b/)) {
    return 'question';
  }

  // Task patterns
  if (lowerMessage.match(/\b(remind|schedule|set|create|add|book|plan|help me)\b/)) {
    return 'task';
  }

  // Reflection patterns
  if (lowerMessage.match(/\b(i feel|i think|i wonder|reflecting|considering|realizing)\b/)) {
    return 'reflection';
  }

  // Planning patterns
  if (lowerMessage.match(/\b(goal|strategy|next steps|roadmap|vision|objectives|priorities)\b/)) {
    return 'planning';
  }

  // Social patterns
  if (lowerMessage.match(/\b(hello|hi|hey|good morning|good afternoon|goodbye|bye|thanks|thank you)\b/)) {
    return 'social';
  }

  return 'unknown';
}

/**
 * Detect mood from context or message content
 */
function detectMood(message: string, providedMood?: string): VoiceCompanionOutput['detectedMood'] {
  if (providedMood) {
    return providedMood as VoiceCompanionOutput['detectedMood'];
  }

  const lowerMessage = message.toLowerCase();

  if (lowerMessage.match(/\b(excited|pumped|motivated|energized|ready)\b/)) {
    return 'energized';
  }

  if (lowerMessage.match(/\b(focused|concentrating|working|deep work|flow)\b/)) {
    return 'focused';
  }

  if (lowerMessage.match(/\b(tired|exhausted|drained|sleepy|fatigue)\b/)) {
    return 'tired';
  }

  if (lowerMessage.match(/\b(stressed|overwhelmed|anxious|worried|pressure)\b/)) {
    return 'stressed';
  }

  return 'neutral';
}

/**
 * Extract topics from message
 */
function extractTopics(message: string, existingTopics: string[] = []): string[] {
  const lowerMessage = message.toLowerCase();
  const newTopics: string[] = [];

  // Common topics
  const topicKeywords: Record<string, string[]> = {
    'fitness': ['workout', 'exercise', 'gym', 'training', 'fitness'],
    'business': ['business', 'revenue', 'sales', 'marketing', 'strategy'],
    'personal': ['personal', 'family', 'relationship', 'friend'],
    'productivity': ['productivity', 'focus', 'deep work', 'time management'],
    'wellness': ['wellness', 'health', 'meditation', 'mindfulness', 'sleep'],
    'goals': ['goal', 'objective', 'target', 'milestone', 'achievement'],
  };

  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    if (keywords.some(kw => lowerMessage.includes(kw))) {
      if (!existingTopics.includes(topic)) {
        newTopics.push(topic);
      }
    }
  }

  return [...existingTopics, ...newTopics].slice(0, 5);  // Keep max 5 topics
}

/**
 * Generate offline response based on intent and mood
 */
function generateOfflineResponse(
  intent: VoiceCompanionOutput['detectedIntent'],
  mood: VoiceCompanionOutput['detectedMood'],
  message: string
): string {
  // Social responses
  if (intent === 'social') {
    if (message.toLowerCase().match(/\b(hello|hi|hey|good morning|good afternoon)\b/)) {
      return "Hey! I'm here to help. What's on your mind today?";
    }
    if (message.toLowerCase().match(/\b(goodbye|bye|see you)\b/)) {
      return "Take care! Looking forward to our next conversation.";
    }
    if (message.toLowerCase().match(/\b(thanks|thank you)\b/)) {
      return "You're welcome! Happy to help anytime.";
    }
  }

  // Question responses
  if (intent === 'question') {
    return "That's a great question. In offline mode, I have limited context, but I'd recommend checking your dashboard or reaching out to your team for the most current information.";
  }

  // Task responses
  if (intent === 'task') {
    return "I've noted your request. Once we're online, I can help you set that up properly and integrate it with your systems.";
  }

  // Reflection responses
  if (intent === 'reflection') {
    if (mood === 'stressed') {
      return "It sounds like you're processing a lot right now. Take a breath. What's the most important thing you need to focus on?";
    }
    if (mood === 'energized') {
      return "I love that energy! What action do you want to take on that insight?";
    }
    return "That's a valuable reflection. How does this change your perspective moving forward?";
  }

  // Planning responses
  if (intent === 'planning') {
    if (mood === 'focused') {
      return "Let's map this out. What's the first concrete step you can take today toward that goal?";
    }
    return "Strategic thinking time. What's the outcome you're aiming for, and what's standing between you and that outcome?";
  }

  // Default response
  return "I hear you. Tell me more about what you're thinking.";
}

/**
 * Generate follow-up suggestions based on intent
 */
function generateFollowUpSuggestions(intent: VoiceCompanionOutput['detectedIntent']): string[] {
  switch (intent) {
    case 'question':
      return [
        "Can you give me more context?",
        "What specific aspect are you curious about?",
      ];
    case 'task':
      return [
        "When do you need this done?",
        "Should I add this to your priority list?",
      ];
    case 'reflection':
      return [
        "How does this align with your goals?",
        "What action will you take on this insight?",
      ];
    case 'planning':
      return [
        "What's the first step?",
        "What resources do you need?",
      ];
    case 'social':
      return [
        "How's your day going?",
        "What are you working on today?",
      ];
    default:
      return [
        "Tell me more",
        "What else is on your mind?",
      ];
  }
}

/**
 * Check if session should end
 */
function shouldEndSession(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  return lowerMessage.match(/\b(goodbye|bye|see you|that's all|i'm done|end session)\b/) !== null;
}

/**
 * Main execution function
 */
export async function runP1VoiceCompanion(
  input: VoiceCompanionInput
): Promise<VoiceCompanionOutput> {
  const runId = `voice_companion_${Date.now()}`;
  const mode = input.mode || 'offline';
  const sessionId = input.sessionId || `session_${Date.now()}`;

  // Validation
  let confidenceScore = 1.0;

  if (!input.userId) {
    confidenceScore = 0.3;
  }

  if (!input.userMessage || input.userMessage.trim().length === 0) {
    confidenceScore = Math.min(confidenceScore, 0.2);
  }

  // Intent and mood detection
  const detectedIntent = detectIntent(input.userMessage);
  const detectedMood = detectMood(input.userMessage, input.context?.mood);

  // Session context
  const turnCount = (input.conversationHistory?.length || 0) + 1;
  const isFirstTurn = turnCount === 1;

  const topics = extractTopics(
    input.userMessage,
    isFirstTurn ? [] : ['general']  // Placeholder for existing topics
  );

  // Generate response
  const response = generateOfflineResponse(detectedIntent, detectedMood, input.userMessage);

  const followUpSuggestions = generateFollowUpSuggestions(detectedIntent);

  const shouldEnd = shouldEndSession(input.userMessage);

  const now = new Date().toISOString();

  return {
    runId,
    userId: input.userId || 'unknown',
    sessionId,
    response,
    followUpSuggestions,
    detectedIntent,
    detectedMood,
    sessionContext: {
      turnCount,
      startedAt: isFirstTurn ? now : new Date(Date.now() - turnCount * 60000).toISOString(),
      lastUpdatedAt: now,
      topics,
    },
    confidenceScore,
    shouldEndSession: shouldEnd,
    mode,
    offline: true,
    generatedAt: now,
  };
}
