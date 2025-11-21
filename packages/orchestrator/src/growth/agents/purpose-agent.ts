/**
 * Purpose Agent - Purpose Pathfinder
 * Phase: Radiant
 * Helps users discover and articulate their core purpose through Ikigai framework
 */

import { OrchestratorRunContext, GrowthAgentResult } from '../types';

/**
 * Ikigai framework components
 */
export interface IkigaiComponents {
  whatYouLove: string[];
  whatTheWorldNeeds: string[];
  whatYouCanBePaidFor: string[];
  whatYouAreGoodAt: string[];
}

/**
 * Purpose declaration
 */
export interface PurposeDeclaration {
  statement: string;
  confidence: number; // 0-1
  timestamp: string;
  userId: string;
}

/**
 * Purpose card (visual representation)
 */
export interface PurposeCard {
  declaration: string;
  brandColors: {
    plum: string;
    teal: string;
    gold: string;
    rose: string;
    slate: string;
  };
  createdAt: string;
  userId: string;
  cardHtml: string;
}

/**
 * Daily affirmation
 */
export interface DailyAffirmation {
  day: number; // 1-7
  message: string;
  deliveryTime: string; // HH:mm
}

/**
 * EM Brand Colors
 */
const EM_BRAND_COLORS = {
  plum: '#36013f',
  teal: '#176161',
  gold: '#e0cd67',
  rose: '#c3b4b3',
  slate: '#37475e',
};

/**
 * Generate purpose declaration from Ikigai components (mock)
 */
function generatePurposeDeclaration(ikigai: IkigaiComponents, ctx: OrchestratorRunContext): PurposeDeclaration {
  // Mock implementation - in production, use OpenAI to synthesize

  // Simple template-based generation
  const love = ikigai.whatYouLove[0] || 'helping others';
  const need = ikigai.whatTheWorldNeeds[0] || 'guidance';
  const skill = ikigai.whatYouAreGoodAt[0] || 'leadership';

  const statement = `To empower others through ${love}, providing ${need} with ${skill} that creates lasting transformation.`;

  return {
    statement,
    confidence: 0.85,
    timestamp: new Date().toISOString(),
    userId: ctx.userId,
  };
}

/**
 * Generate purpose card HTML
 */
function generatePurposeCardHtml(card: PurposeCard): string {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Purpose Card</title>
  <style>
    body {
      margin: 0;
      padding: 20px;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, ${card.brandColors.plum} 0%, ${card.brandColors.slate} 100%);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .card {
      background: white;
      border-radius: 20px;
      padding: 40px;
      max-width: 600px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      position: relative;
      overflow: hidden;
    }
    .card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 6px;
      background: linear-gradient(90deg,
        ${card.brandColors.teal} 0%,
        ${card.brandColors.gold} 50%,
        ${card.brandColors.rose} 100%
      );
    }
    h1 {
      color: ${card.brandColors.plum};
      font-size: 24px;
      margin: 0 0 20px 0;
      text-align: center;
    }
    .purpose {
      font-size: 28px;
      line-height: 1.5;
      color: ${card.brandColors.slate};
      text-align: center;
      font-weight: 300;
      margin: 30px 0;
      font-style: italic;
    }
    .colors {
      display: flex;
      justify-content: center;
      gap: 15px;
      margin: 30px 0 20px 0;
    }
    .color-swatch {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }
    .footer {
      text-align: center;
      color: #999;
      font-size: 12px;
      margin-top: 30px;
    }
    .logo {
      font-size: 48px;
      text-align: center;
      margin-bottom: 10px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">✨</div>
    <h1>Your Purpose Declaration</h1>
    <div class="purpose">"${card.declaration}"</div>
    <div class="colors">
      <div class="color-swatch" style="background: ${card.brandColors.plum};" title="Plum"></div>
      <div class="color-swatch" style="background: ${card.brandColors.teal};" title="Teal"></div>
      <div class="color-swatch" style="background: ${card.brandColors.gold};" title="Gold"></div>
      <div class="color-swatch" style="background: ${card.brandColors.rose};" title="Rose"></div>
      <div class="color-swatch" style="background: ${card.brandColors.slate};" title="Slate"></div>
    </div>
    <div class="footer">
      Elevated Movements • ${new Date(card.createdAt).toLocaleDateString()}
    </div>
  </div>
</body>
</html>
  `.trim();

  return html;
}

/**
 * Generate 7 daily affirmations based on purpose
 */
function generateDailyAffirmations(declaration: PurposeDeclaration): DailyAffirmation[] {
  // Mock implementation - in production, use OpenAI to personalize

  const baseAffirmations = [
    'My purpose guides every decision I make today.',
    'I am aligned with my highest calling and deepest values.',
    'I create meaningful impact through my unique gifts.',
    'My purpose flows through all that I do.',
    'I trust the unfolding of my purpose-driven journey.',
    'I embody my purpose with authenticity and grace.',
    'My life is a powerful expression of my purpose.',
  ];

  return baseAffirmations.map((msg, index) => ({
    day: index + 1,
    message: msg,
    deliveryTime: '08:00', // 8am default
  }));
}

/**
 * Queue affirmations for delivery (mock - would use Twilio/email in production)
 */
async function queueAffirmations(
  affirmations: DailyAffirmation[],
  ctx: OrchestratorRunContext
): Promise<{ queued: boolean; channel: string }> {
  const twilioConfigured = !!process.env.TWILIO_ACCOUNT_SID;
  const emailConfigured = !!process.env.SMTP_HOST;

  if (!twilioConfigured && !emailConfigured) {
    console.warn('[PurposeAgent] No delivery channels configured for affirmations');
    return { queued: false, channel: 'none' };
  }

  // Mock queuing
  console.info(`[PurposeAgent] Would queue ${affirmations.length} affirmations for ${ctx.email || ctx.userId}`);

  return {
    queued: true,
    channel: emailConfigured ? 'email' : twilioConfigured ? 'sms' : 'none',
  };
}

/**
 * Run Purpose Agent
 */
export async function runPurposeAgent(ctx: OrchestratorRunContext): Promise<GrowthAgentResult> {
  const startedAt = new Date().toISOString();
  const errors: string[] = [];

  console.info(`[PurposeAgent] Starting Purpose Pathfinder for ${ctx.userId}`);

  try {
    // Sample Ikigai data (in production, collect through Q&A)
    const ikigai: IkigaiComponents = {
      whatYouLove: ['empowering others', 'creative expression', 'deep connection'],
      whatTheWorldNeeds: ['authentic leadership', 'community healing', 'purpose-driven guidance'],
      whatYouCanBePaidFor: ['coaching', 'facilitation', 'content creation'],
      whatYouAreGoodAt: ['listening deeply', 'holding space', 'strategic thinking'],
    };

    console.info('[PurposeAgent] Processing Ikigai framework...');

    // Generate purpose declaration
    const declaration = generatePurposeDeclaration(ikigai, ctx);

    console.info(`[PurposeAgent] Purpose declaration: "${declaration.statement}"`);

    // Create purpose card
    const card: PurposeCard = {
      declaration: declaration.statement,
      brandColors: EM_BRAND_COLORS,
      createdAt: new Date().toISOString(),
      userId: ctx.userId,
      cardHtml: '',
    };

    card.cardHtml = generatePurposeCardHtml(card);

    console.info('[PurposeAgent] Purpose card created');

    // Generate daily affirmations
    const affirmations = generateDailyAffirmations(declaration);

    console.info(`[PurposeAgent] Generated ${affirmations.length} daily affirmations`);

    // Queue affirmations
    const queueResult = await queueAffirmations(affirmations, ctx);

    if (!queueResult.queued) {
      errors.push('No delivery channels configured for affirmations');
    }

    const completedAt = new Date().toISOString();

    return {
      success: true,
      errors: errors.length > 0 ? errors : undefined,
      artifacts: {
        purposeDeclaration: declaration.statement,
        declarationConfidence: declaration.confidence,
        purposeCardGenerated: true,
        cardHtmlLength: card.cardHtml.length,
        brandColors: card.brandColors,
        affirmationsGenerated: affirmations.length,
        affirmationsQueued: queueResult.queued,
        deliveryChannel: queueResult.channel,
        affirmations: affirmations.map((a) => ({ day: a.day, message: a.message })),
      },
      startedAt,
      completedAt,
      retries: 0,
    };
  } catch (error: any) {
    const completedAt = new Date().toISOString();
    console.error(`[PurposeAgent] Error: ${error.message}`);

    return {
      success: false,
      errors: [error.message],
      startedAt,
      completedAt,
      retries: 0,
    };
  }
}
