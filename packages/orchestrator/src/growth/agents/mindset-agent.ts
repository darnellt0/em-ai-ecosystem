/**
 * Mindset Agent - Mindset Shift Mentor
 * Phase: Grounded
 * Helps users reframe limiting beliefs and develop empowering mindsets
 */

import { OrchestratorRunContext, GrowthAgentResult } from '../types';

/**
 * Mindset entry structure
 */
export interface MindsetEntry {
  timestamp: string;
  belief: string;
  reframe: string;
  affirmation: string;
  microPractice: string;
  userId: string;
}

/**
 * Weekly mindset snapshot
 */
export interface MindsetSnapshot {
  userId: string;
  weekStartDate: string;
  weekEndDate: string;
  entriesCount: number;
  topThemes: string[];
  progressSummary: string;
  nextSteps: string[];
}

/**
 * Generate compassionate reframe for a limiting belief
 */
function generateReframe(belief: string): string {
  // Mock implementation - in production, use OpenAI
  // Pattern: Acknowledge → Reframe → Empower

  if (belief.toLowerCase().includes('not good enough') || belief.toLowerCase().includes('can\'t')) {
    return 'You are learning and growing. Every challenge is an opportunity to develop your capabilities. Your worth is not defined by a single outcome.';
  }

  if (belief.toLowerCase().includes('fail') || belief.toLowerCase().includes('failure')) {
    return 'Failure is feedback, not a reflection of your value. Each attempt teaches you something valuable and brings you closer to success.';
  }

  if (belief.toLowerCase().includes('too late') || belief.toLowerCase().includes('behind')) {
    return 'Your journey is unique and unfolds in its own perfect timing. Where you are now is exactly where you need to be to reach where you\'re going.';
  }

  // Default reframe
  return 'This belief served you in the past, but you can choose a new perspective that better serves your growth and well-being today.';
}

/**
 * Generate affirmation based on reframed belief
 */
function generateAffirmation(belief: string, reframe: string): string {
  // Mock implementation - in production, use OpenAI

  if (belief.toLowerCase().includes('not good enough')) {
    return 'I am worthy and capable. I embrace my unique gifts and continue to grow.';
  }

  if (belief.toLowerCase().includes('fail')) {
    return 'I learn from every experience. My resilience and wisdom grow with each challenge.';
  }

  if (belief.toLowerCase().includes('too late')) {
    return 'I trust in my perfect timing. I am exactly where I need to be on my journey.';
  }

  return 'I choose empowering beliefs that support my growth and well-being.';
}

/**
 * Generate micro-practice for embodying new mindset
 */
function generateMicroPractice(belief: string): string {
  // Mock implementation - in production, use OpenAI

  const practices = [
    'Take 3 deep breaths and repeat your affirmation while placing one hand on your heart.',
    'Write down 3 pieces of evidence that contradict this old belief.',
    'Share your reframe with someone you trust and ask for their support.',
    'Create a visual reminder (sticky note, phone wallpaper) of your new belief.',
    'Practice your affirmation in the mirror for 1 minute each morning this week.',
  ];

  // Return a random practice
  return practices[Math.floor(Math.random() * practices.length)];
}

/**
 * Process belief statements and create mindset entries
 */
async function processBelief(belief: string, ctx: OrchestratorRunContext): Promise<MindsetEntry> {
  const reframe = generateReframe(belief);
  const affirmation = generateAffirmation(belief, reframe);
  const microPractice = generateMicroPractice(belief);

  return {
    timestamp: new Date().toISOString(),
    belief,
    reframe,
    affirmation,
    microPractice,
    userId: ctx.userId,
  };
}

/**
 * Generate weekly mindset snapshot
 */
function generateWeeklySnapshot(entries: MindsetEntry[], ctx: OrchestratorRunContext): MindsetSnapshot {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);

  // Extract themes from beliefs
  const themes: string[] = [];
  entries.forEach((entry) => {
    if (entry.belief.toLowerCase().includes('enough') || entry.belief.toLowerCase().includes('worthy')) {
      themes.push('self-worth');
    }
    if (entry.belief.toLowerCase().includes('fail')) {
      themes.push('fear-of-failure');
    }
    if (entry.belief.toLowerCase().includes('time') || entry.belief.toLowerCase().includes('late')) {
      themes.push('timing-pressure');
    }
  });

  // Get unique themes
  const uniqueThemes = [...new Set(themes)];

  const progressSummary = `You've worked with ${entries.length} beliefs this week, focusing on ${uniqueThemes.join(', ')}. You're building awareness and choosing more empowering perspectives.`;

  const nextSteps = [
    'Continue your daily micro-practices',
    'Notice when old beliefs arise and consciously choose your new reframe',
    'Celebrate small wins in shifting your mindset',
  ];

  return {
    userId: ctx.userId,
    weekStartDate: weekStart.toISOString(),
    weekEndDate: now.toISOString(),
    entriesCount: entries.length,
    topThemes: uniqueThemes.slice(0, 3),
    progressSummary,
    nextSteps,
  };
}

/**
 * Run Mindset Agent
 */
export async function runMindsetAgent(ctx: OrchestratorRunContext): Promise<GrowthAgentResult> {
  const startedAt = new Date().toISOString();
  const errors: string[] = [];

  console.info(`[MindsetAgent] Starting Mindset Shift Mentor for ${ctx.userId}`);

  try {
    // Sample beliefs (in production, these come from user input)
    const sampleBeliefs = [
      "I'm not good enough to achieve my big goals.",
      "I'm afraid I'll fail and disappoint everyone.",
      "It's too late for me to make a significant change.",
    ];

    console.info(`[MindsetAgent] Processing ${sampleBeliefs.length} beliefs...`);

    // Process each belief
    const entries: MindsetEntry[] = [];
    for (const belief of sampleBeliefs) {
      const entry = await processBelief(belief, ctx);
      entries.push(entry);
      console.info(`[MindsetAgent] Processed belief: "${belief.substring(0, 50)}..."`);
    }

    // Generate weekly snapshot
    const snapshot = generateWeeklySnapshot(entries, ctx);

    console.info(`[MindsetAgent] Generated weekly snapshot with ${snapshot.topThemes.length} themes`);

    // TODO: Store entries in database or Google Sheets
    // For now, just include in artifacts

    const completedAt = new Date().toISOString();

    return {
      success: entries.length > 0,
      errors: errors.length > 0 ? errors : undefined,
      artifacts: {
        entriesCreated: entries.length,
        entries: entries.map((e) => ({
          belief: e.belief,
          reframe: e.reframe.substring(0, 100) + '...',
          affirmation: e.affirmation,
        })),
        snapshot: {
          topThemes: snapshot.topThemes,
          entriesCount: snapshot.entriesCount,
          progressSummary: snapshot.progressSummary,
        },
      },
      startedAt,
      completedAt,
      retries: 0,
    };
  } catch (error: any) {
    const completedAt = new Date().toISOString();
    console.error(`[MindsetAgent] Error: ${error.message}`);

    return {
      success: false,
      errors: [error.message],
      startedAt,
      completedAt,
      retries: 0,
    };
  }
}
