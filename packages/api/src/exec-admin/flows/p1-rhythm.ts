/**
 * P1 Rhythm Flow
 *
 * Per MAB v1.0 Section 6.2:
 * "Optimizes daily rhythms and energy cycles."
 *
 * Features:
 * - Energy mapping
 * - Peak time identification
 * - Rhythm recommendations
 * - Offline mode support
 */

import { RhythmAgent } from '../../services/growth-agents/rhythm.agent';

export interface RhythmInput {
  userId: string;
  currentSchedule?: string;
  energyPatterns?: string;
  goals?: string;
}

export interface RhythmOutput {
  userId: string;
  energyMap: {
    peak: string[];
    low: string[];
    moderate: string[];
  };
  recommendations: Array<{
    timeBlock: string;
    activity: string;
    reason: string;
  }>;
  idealSchedule?: {
    morning: string;
    afternoon: string;
    evening: string;
  };
  spreadsheetUrl?: string;
  offline: boolean;
  generatedAt: string;
}

export async function runP1Rhythm(
  input: RhythmInput
): Promise<{ runId: string; data: RhythmOutput }> {
  const runId = `rhythm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  console.log(`[P1 Rhythm] Starting run ${runId} for ${input.userId}`);
  console.log(`[P1 Rhythm] Current schedule: ${input.currentSchedule || 'none'}`);

  let output: RhythmOutput;
  let offline = false;

  try {
    const rhythmAgent = new RhythmAgent();

    // Build prompt from input
    let prompt = 'Help me optimize my daily rhythm.';
    if (input.currentSchedule) {
      prompt = `Current schedule: ${input.currentSchedule}.`;
      if (input.energyPatterns) {
        prompt += ` Energy patterns: ${input.energyPatterns}.`;
      }
      if (input.goals) {
        prompt += ` Goals: ${input.goals}.`;
      }
    }

    const result = await rhythmAgent.run(prompt);

    // Parse rhythm data from agent output
    let energyMap: RhythmOutput['energyMap'] = {
      peak: [],
      low: [],
      moderate: [],
    };
    let recommendations: RhythmOutput['recommendations'] = [];
    let idealSchedule: RhythmOutput['idealSchedule'] | undefined;

    // Try to extract structured data from result
    if (result && typeof result === 'object') {
      if (result.energyMap) {
        energyMap = result.energyMap;
      }
      if (Array.isArray(result.recommendations)) {
        recommendations = result.recommendations;
      }
      if (result.idealSchedule) {
        idealSchedule = result.idealSchedule;
      }
    }

    // If no recommendations found, create defaults
    if (recommendations.length === 0) {
      recommendations.push(
        {
          timeBlock: '8am-10am',
          activity: 'Deep focus work',
          reason: 'High morning energy for cognitive tasks',
        },
        {
          timeBlock: '2pm-3pm',
          activity: 'Light tasks or break',
          reason: 'Post-lunch energy dip',
        }
      );
    }

    output = {
      userId: input.userId,
      energyMap,
      recommendations,
      idealSchedule,
      spreadsheetUrl: typeof result === 'object' && result.spreadsheetUrl ? result.spreadsheetUrl : undefined,
      offline: false,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.warn('[P1 Rhythm] Agent error, using offline mode:', error);
    offline = true;

    // Offline stub data
    output = {
      userId: input.userId,
      energyMap: {
        peak: ['8am-11am', '4pm-6pm'],
        low: ['2pm-3pm'],
        moderate: ['11am-2pm', '6pm-8pm'],
      },
      recommendations: [
        {
          timeBlock: '8am-10am',
          activity: 'Deep work (coding, writing, strategy)',
          reason: 'Peak cognitive energy',
        },
        {
          timeBlock: '2pm-3pm',
          activity: 'Admin tasks, emails, light meetings',
          reason: 'Energy dip - lower cognitive demand',
        },
        {
          timeBlock: '4pm-6pm',
          activity: 'Creative work, brainstorming',
          reason: 'Second energy peak',
        },
      ],
      idealSchedule: {
        morning: 'Focus blocks for high-value work',
        afternoon: 'Meetings and collaborative work',
        evening: 'Planning and reflection',
      },
      offline: true,
      generatedAt: new Date().toISOString(),
    };
  }

  console.log(`[P1 Rhythm] Complete: ${runId}`, {
    recommendations: output.recommendations.length,
    offline: output.offline,
  });

  return { runId, data: output };
}
