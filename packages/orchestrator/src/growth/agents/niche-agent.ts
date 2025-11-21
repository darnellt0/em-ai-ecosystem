/**
 * Niche Agent - Niche Navigator
 * Phase: Grounded
 * Helps users discover and clarify their unique niche
 */

import { OrchestratorRunContext, GrowthAgentResult } from '../types';

/**
 * Niche theme discovered from Q&A
 */
export interface NicheTheme {
  name: string;
  description: string;
  keywords: string[];
  confidence: number; // 0-1
}

/**
 * Niche clarity report
 */
export interface NicheClarityReport {
  userId: string;
  timestamp: string;
  themes: NicheTheme[];
  topTheme: NicheTheme;
  reportHtml: string;
  recommendations: string[];
}

/**
 * Mock Q&A data (in production, collect from user)
 */
interface NicheQA {
  skills: string[];
  passions: string[];
  values: string[];
  audience: string;
  impact: string;
}

/**
 * Get sample Q&A data
 */
function getSampleQA(ctx: OrchestratorRunContext): NicheQA {
  return {
    skills: ['leadership', 'coaching', 'strategic planning'],
    passions: ['empowering others', 'building communities', 'personal growth'],
    values: ['authenticity', 'impact', 'service'],
    audience: 'entrepreneurs and founders',
    impact: 'help people align with their purpose and build sustainable movements',
  };
}

/**
 * Analyze Q&A to discover niche themes (mock implementation)
 * In production, use OpenAI embeddings and clustering
 */
function discoverThemes(qa: NicheQA): NicheTheme[] {
  // Mock: create themes based on input
  const themes: NicheTheme[] = [
    {
      name: 'Purpose-Driven Leadership Coaching',
      description:
        'Helping purpose-driven entrepreneurs and founders align their leadership with authentic values and create lasting impact.',
      keywords: ['leadership', 'purpose', 'authenticity', 'coaching', 'founders'],
      confidence: 0.87,
    },
    {
      name: 'Community-Centered Movement Building',
      description:
        'Building sustainable communities that empower individuals to grow and create meaningful change together.',
      keywords: ['community', 'empowerment', 'movements', 'sustainability', 'growth'],
      confidence: 0.79,
    },
    {
      name: 'Strategic Impact Facilitation',
      description:
        'Facilitating strategic planning processes that align business goals with social impact and personal values.',
      keywords: ['strategic', 'impact', 'planning', 'service', 'alignment'],
      confidence: 0.72,
    },
  ];

  return themes;
}

/**
 * Generate niche clarity report HTML
 */
function generateReportHtml(report: NicheClarityReport): string {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Niche Clarity Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); }
    h1 { color: #36013f; font-size: 32px; margin-bottom: 10px; }
    h2 { color: #176161; font-size: 24px; margin-top: 30px; }
    .theme { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .theme h3 { color: #36013f; margin-top: 0; }
    .confidence { display: inline-block; background: #e0cd67; color: #36013f; padding: 4px 12px; border-radius: 12px; font-size: 14px; font-weight: 600; }
    .keywords { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
    .keyword { background: #f0f0f0; padding: 4px 10px; border-radius: 4px; font-size: 13px; }
    .top-theme { border: 3px solid #e0cd67; }
    .recommendations { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .recommendations ul { margin: 10px 0; padding-left: 20px; }
    .timestamp { color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <h1>🎯 Niche Clarity Report</h1>
  <p class="timestamp">Generated: ${new Date(report.timestamp).toLocaleString()}</p>

  <h2>Your Niche Themes</h2>
  <p>Based on your skills, passions, values, and desired impact, we've identified ${report.themes.length} potential niche themes:</p>

  ${report.themes
    .map(
      (theme, index) => `
    <div class="theme ${index === 0 ? 'top-theme' : ''}">
      <h3>${index === 0 ? '⭐ ' : ''}${theme.name}</h3>
      <span class="confidence">Confidence: ${Math.round(theme.confidence * 100)}%</span>
      <p>${theme.description}</p>
      <div class="keywords">
        ${theme.keywords.map((kw) => `<span class="keyword">${kw}</span>`).join('')}
      </div>
    </div>
  `
    )
    .join('')}

  <div class="recommendations">
    <h2>💡 Recommendations</h2>
    <ul>
      ${report.recommendations.map((rec) => `<li>${rec}</li>`).join('')}
    </ul>
  </div>
</body>
</html>
  `.trim();

  return html;
}

/**
 * Run Niche Agent
 */
export async function runNicheAgent(ctx: OrchestratorRunContext): Promise<GrowthAgentResult> {
  const startedAt = new Date().toISOString();
  const errors: string[] = [];

  console.info(`[NicheAgent] Starting Niche Navigator for ${ctx.userId}`);

  try {
    // Get Q&A data (in production, this comes from user input)
    const qa = getSampleQA(ctx);

    console.info('[NicheAgent] Analyzing niche themes...');

    // Discover themes
    const themes = discoverThemes(qa);

    if (themes.length === 0) {
      errors.push('No niche themes discovered');
    }

    // Generate recommendations
    const recommendations = [
      `Focus on your top theme: "${themes[0].name}" which shows the highest confidence.`,
      'Test your niche by creating content for your target audience over the next 30 days.',
      'Interview 5-10 people in your target audience to validate your niche assumptions.',
      'Develop a signature offer or framework that embodies your unique niche.',
    ];

    // Create report
    const report: NicheClarityReport = {
      userId: ctx.userId,
      timestamp: new Date().toISOString(),
      themes,
      topTheme: themes[0],
      reportHtml: '',
      recommendations,
    };

    // Generate HTML report
    report.reportHtml = generateReportHtml(report);

    console.info(`[NicheAgent] Discovered ${themes.length} niche themes`);

    const completedAt = new Date().toISOString();

    return {
      success: themes.length > 0,
      errors: errors.length > 0 ? errors : undefined,
      artifacts: {
        themesDiscovered: themes.length,
        topTheme: themes[0].name,
        topThemeConfidence: themes[0].confidence,
        themes: themes.map((t) => ({ name: t.name, confidence: t.confidence })),
        reportLength: report.reportHtml.length,
        recommendations: recommendations.length,
      },
      startedAt,
      completedAt,
      retries: 0,
    };
  } catch (error: any) {
    const completedAt = new Date().toISOString();
    console.error(`[NicheAgent] Error: ${error.message}`);

    return {
      success: false,
      errors: [error.message],
      startedAt,
      completedAt,
      retries: 0,
    };
  }
}
