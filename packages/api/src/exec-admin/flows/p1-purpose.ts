/**
 * P1 Purpose Flow
 *
 * Per MAB v1.0 Section 6.3:
 * "Guides clients through ikigai discovery."
 *
 * Features:
 * - Ikigai framework mapping
 * - Purpose statement generation
 * - Values alignment
 * - Offline mode support
 */

import { PurposeAgent } from '../../services/growth-agents/purpose.agent';

export interface PurposeInput {
  userId: string;
  skills?: string[];
  passions?: string[];
  values?: string[];
  audience?: string;
  impact?: string;
}

export interface PurposeOutput {
  userId: string;
  ikigai: {
    skills: string[];
    passions: string[];
    values: string[];
    audience: string;
    impact: string;
  };
  purposeStatement: string;
  alignment: {
    skillsMatch: number;    // 0-100
    passionMatch: number;   // 0-100
    valuesMatch: number;    // 0-100
    overall: number;        // 0-100
  };
  recommendations: string[];
  spreadsheetUrl?: string;
  offline: boolean;
  generatedAt: string;
}

export async function runP1Purpose(
  input: PurposeInput
): Promise<{ runId: string; data: PurposeOutput }> {
  const runId = `purpose_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  console.log(`[P1 Purpose] Starting run ${runId} for ${input.userId}`);
  console.log(`[P1 Purpose] Skills: ${input.skills?.length || 0}, Passions: ${input.passions?.length || 0}`);

  let output: PurposeOutput;
  let offline = false;

  try {
    const purposeAgent = new PurposeAgent();

    // Build prompt from input
    let prompt = 'Help me discover my purpose using the ikigai framework.';
    if (input.skills && input.skills.length > 0) {
      prompt = `Skills: ${input.skills.join(', ')}.`;
      if (input.passions && input.passions.length > 0) {
        prompt += ` Passions: ${input.passions.join(', ')}.`;
      }
      if (input.values && input.values.length > 0) {
        prompt += ` Values: ${input.values.join(', ')}.`;
      }
      if (input.audience) {
        prompt += ` Audience: ${input.audience}.`;
      }
      if (input.impact) {
        prompt += ` Impact: ${input.impact}.`;
      }
    }

    const result = await purposeAgent.run(prompt);

    // Parse purpose data from agent output
    let ikigai: PurposeOutput['ikigai'] = {
      skills: input.skills || [],
      passions: input.passions || [],
      values: input.values || [],
      audience: input.audience || '',
      impact: input.impact || '',
    };
    let purposeStatement = '';
    let alignment: PurposeOutput['alignment'] = {
      skillsMatch: 0,
      passionMatch: 0,
      valuesMatch: 0,
      overall: 0,
    };
    let recommendations: string[] = [];

    // Try to extract structured data from result
    if (result && typeof result === 'object') {
      if (result.ikigai) {
        ikigai = { ...ikigai, ...result.ikigai };
      }
      if (result.purposeStatement) {
        purposeStatement = result.purposeStatement;
      }
      if (result.alignment) {
        alignment = result.alignment;
      }
      if (Array.isArray(result.recommendations)) {
        recommendations = result.recommendations;
      }
    }

    // Generate purpose statement if not provided
    if (!purposeStatement && ikigai.skills.length > 0) {
      purposeStatement = `Use ${ikigai.skills[0]} to help ${ikigai.audience || 'others'} achieve ${ikigai.impact || 'growth and transformation'}.`;
    }

    // Calculate alignment scores if not provided
    if (alignment.overall === 0) {
      alignment.skillsMatch = ikigai.skills.length > 0 ? 75 : 25;
      alignment.passionMatch = ikigai.passions.length > 0 ? 75 : 25;
      alignment.valuesMatch = ikigai.values.length > 0 ? 75 : 25;
      alignment.overall = Math.round((alignment.skillsMatch + alignment.passionMatch + alignment.valuesMatch) / 3);
    }

    // Generate recommendations if not provided
    if (recommendations.length === 0) {
      if (ikigai.skills.length === 0) {
        recommendations.push('Identify your top 3-5 skills');
      }
      if (ikigai.passions.length === 0) {
        recommendations.push('List what energizes and excites you');
      }
      if (!ikigai.audience) {
        recommendations.push('Define who you want to serve');
      }
      if (recommendations.length === 0) {
        recommendations.push('Refine your purpose statement based on feedback');
      }
    }

    output = {
      userId: input.userId,
      ikigai,
      purposeStatement: purposeStatement || 'Purpose statement to be developed',
      alignment,
      recommendations,
      spreadsheetUrl: typeof result === 'object' && result.spreadsheetUrl ? result.spreadsheetUrl : undefined,
      offline: false,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.warn('[P1 Purpose] Agent error, using offline mode:', error);
    offline = true;

    // Offline stub data
    output = {
      userId: input.userId,
      ikigai: {
        skills: input.skills || ['Strategy', 'Coaching', 'Technology'],
        passions: input.passions || ['Helping founders', 'Personal growth'],
        values: input.values || ['Authenticity', 'Impact', 'Excellence'],
        audience: input.audience || 'Tech founders',
        impact: input.impact || 'Reduce burnout and increase fulfillment',
      },
      purposeStatement: 'Help tech founders reduce burnout and achieve sustainable success through authentic leadership.',
      alignment: {
        skillsMatch: 80,
        passionMatch: 85,
        valuesMatch: 90,
        overall: 85,
      },
      recommendations: [
        'Validate your purpose with 3-5 target clients',
        'Create content that reflects your purpose',
        'Design offerings aligned with your ikigai',
      ],
      offline: true,
      generatedAt: new Date().toISOString(),
    };
  }

  console.log(`[P1 Purpose] Complete: ${runId}`, {
    purposeStatement: output.purposeStatement,
    alignment: output.alignment.overall,
    offline: output.offline,
  });

  return { runId, data: output };
}
