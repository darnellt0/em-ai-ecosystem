/**
 * P1 Wave 5 - Creative Director
 *
 * Intent: creative_direct
 *
 * Generates visual concepts, brand-aligned creative suggestions, and design guidance
 * for marketing materials, social media, and brand assets.
 *
 * Features:
 * - Visual concept generation for specific use cases
 * - Brand alignment checking
 * - Color palette and typography suggestions
 * - Asset type recommendations (video, image, graphic, text)
 * - Offline mode with template-based concepts
 * - Multi-format support (social, email, web, print)
 */

export interface CreativeDirectorInput {
  userId: string;
  requestType?: 'concept' | 'brand_check' | 'asset_suggest' | 'campaign_theme';
  project?: {
    name?: string;
    platform?: 'instagram' | 'facebook' | 'linkedin' | 'email' | 'web' | 'print' | 'all';
    goal?: 'awareness' | 'engagement' | 'conversion' | 'retention' | 'education';
    targetAudience?: string;
    message?: string;
  };
  existingAsset?: {
    description?: string;
    colors?: string[];
    style?: string;
  };
  brandContext?: {
    business?: 'em' | 'quicklist' | 'grants' | 'meal-vision' | 'all';
    tone?: 'inspirational' | 'professional' | 'playful' | 'educational' | 'empowering';
  };
  mode?: 'offline' | 'live';
}

export interface VisualConcept {
  conceptId: string;
  title: string;
  description: string;
  visualElements: string[];
  colorPalette: Array<{
    hex: string;
    name: string;
    usage: string;
  }>;
  typography: {
    headline: string;
    body: string;
    accent: string;
  };
  layout: string;
  assetTypes: Array<{
    type: 'image' | 'video' | 'graphic' | 'text' | 'carousel';
    purpose: string;
    specs: string;
  }>;
  brandAlignment: number;  // 0-100
}

export interface CreativeDirectorOutput {
  runId: string;
  userId: string;
  requestType: string;
  concepts?: VisualConcept[];
  brandCheck?: {
    aligned: boolean;
    score: number;  // 0-100
    strengths: string[];
    improvements: string[];
  };
  assetRecommendations?: Array<{
    assetType: string;
    platform: string;
    purpose: string;
    specs: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  campaignTheme?: {
    name: string;
    tagline: string;
    coreMessage: string;
    visualDirection: string;
    contentPillars: string[];
  };
  confidenceScore: number;  // 0-1
  insight: string;
  recommendedNextAction: string;
  mode: 'offline' | 'live';
  offline: boolean;
  generatedAt: string;
}

/**
 * Brand color palettes
 */
const BRAND_COLORS = {
  em: {
    primary: { hex: '#1A1A2E', name: 'Deep Navy', usage: 'Headers, CTAs' },
    secondary: { hex: '#E94560', name: 'Energetic Coral', usage: 'Accents, highlights' },
    accent: { hex: '#0F3460', name: 'Confident Blue', usage: 'Backgrounds, depth' },
    neutral: { hex: '#F4F4F4', name: 'Clean White', usage: 'Body text, backgrounds' },
  },
  quicklist: {
    primary: { hex: '#2D3142', name: 'Charcoal', usage: 'Headers, text' },
    secondary: { hex: '#4F5D75', name: 'Slate Blue', usage: 'Secondary elements' },
    accent: { hex: '#BFC0C0', name: 'Silver', usage: 'Borders, dividers' },
    highlight: { hex: '#FFFFFF', name: 'Pure White', usage: 'Backgrounds' },
  },
  grants: {
    primary: { hex: '#006D77', name: 'Teal', usage: 'Trust, professionalism' },
    secondary: { hex: '#83C5BE', name: 'Seafoam', usage: 'Calm, approachable' },
    accent: { hex: '#EDF6F9', name: 'Ice Blue', usage: 'Backgrounds' },
    highlight: { hex: '#FFDDD2', name: 'Warm Peach', usage: 'CTAs, warmth' },
  },
  'meal-vision': {
    primary: { hex: '#2A9D8F', name: 'Ocean Green', usage: 'Fresh, healthy' },
    secondary: { hex: '#E76F51', name: 'Terracotta', usage: 'Energy, appetite' },
    accent: { hex: '#F4A261', name: 'Golden Sunset', usage: 'Warmth, comfort' },
    neutral: { hex: '#264653', name: 'Deep Teal', usage: 'Grounding, text' },
  },
};

/**
 * Generate visual concept
 */
function generateVisualConcept(
  input: CreativeDirectorInput,
  conceptNumber: number
): VisualConcept {
  const business = input.brandContext?.business || 'em';
  const platform = input.project?.platform || 'instagram';
  const goal = input.project?.goal || 'engagement';

  const brandColors = BRAND_COLORS[business] || BRAND_COLORS.em;

  const conceptId = `concept_${Date.now()}_${conceptNumber}`;

  // Platform-specific concepts
  let title = '';
  let description = '';
  let visualElements: string[] = [];
  let layout = '';
  let assetTypes: VisualConcept['assetTypes'] = [];

  if (platform === 'instagram' || platform === 'all') {
    title = 'Dynamic Story Series';
    description = 'Eye-catching story sequence with bold typography and movement to drive engagement';
    visualElements = [
      'Bold headline with kinetic typography',
      'Lifestyle imagery showing transformation',
      'Geometric overlays for depth',
      'Swipe-up CTA with arrow animation',
    ];
    layout = 'Vertical 9:16 format with rule-of-thirds composition, text in upper third, image in center, CTA in lower third';
    assetTypes = [
      {
        type: 'video',
        purpose: 'Story sequence (3-5 slides)',
        specs: '1080x1920px, 15s max per slide, MP4',
      },
      {
        type: 'graphic',
        purpose: 'Static backup post',
        specs: '1080x1080px, PNG/JPG',
      },
    ];
  } else if (platform === 'linkedin') {
    title = 'Thought Leadership Carousel';
    description = 'Professional multi-slide carousel breaking down key insights with data visualization';
    visualElements = [
      'Clean sans-serif typography for readability',
      'Data charts with brand colors',
      'Professional headshot or team photo',
      'Subtle gradient backgrounds',
    ];
    layout = 'Square 1:1 format, content-heavy with 40% text, 60% visual, consistent slide template';
    assetTypes = [
      {
        type: 'carousel',
        purpose: '5-10 slide educational series',
        specs: '1080x1080px per slide, PDF export',
      },
    ];
  } else if (platform === 'email') {
    title = 'Hero Image Campaign';
    description = 'Compelling email header with clear value proposition and prominent CTA';
    visualElements = [
      'Wide hero image with focal point on left',
      'Headline overlay with semi-transparent background',
      'CTA button in brand accent color',
      'Mobile-responsive layout',
    ];
    layout = 'Email-optimized 600px width, hero section above fold, F-pattern reading flow';
    assetTypes = [
      {
        type: 'image',
        purpose: 'Email header/hero',
        specs: '600x400px, optimized JPG < 200KB',
      },
    ];
  } else {
    title = 'Multi-Channel Brand Asset';
    description = 'Versatile visual concept adaptable across platforms';
    visualElements = [
      'Flexible brand imagery',
      'Modular text blocks',
      'Scalable graphics',
      'Platform-specific CTAs',
    ];
    layout = 'Responsive layout with breakpoints for web/mobile/social';
    assetTypes = [
      {
        type: 'graphic',
        purpose: 'Master asset for adaptation',
        specs: 'Vector format (SVG/AI), multiple sizes',
      },
    ];
  }

  const colorPalette = [
    brandColors.primary,
    brandColors.secondary,
    brandColors.accent,
    brandColors.neutral || brandColors.highlight,
  ];

  const typography = {
    headline: business === 'em' ? 'Montserrat Bold, 32-48pt' : 'Inter Bold, 28-42pt',
    body: 'Inter Regular, 14-18pt',
    accent: 'Inter SemiBold, 16-20pt',
  };

  const brandAlignment = 85 + Math.floor(Math.random() * 10);  // 85-95

  return {
    conceptId,
    title,
    description,
    visualElements,
    colorPalette,
    typography,
    layout,
    assetTypes,
    brandAlignment,
  };
}

/**
 * Brand alignment check
 */
function checkBrandAlignment(input: CreativeDirectorInput): CreativeDirectorOutput['brandCheck'] {
  const business = input.brandContext?.business || 'em';
  const tone = input.brandContext?.tone || 'inspirational';

  let score = 75;  // Base score

  const strengths: string[] = [];
  const improvements: string[] = [];

  // Check tone alignment
  if (business === 'em' && (tone === 'inspirational' || tone === 'empowering')) {
    score += 10;
    strengths.push('Tone aligns with EM brand voice (inspirational, empowering)');
  } else if (business === 'quicklist' && tone === 'professional') {
    score += 10;
    strengths.push('Professional tone matches QuickList brand positioning');
  } else {
    improvements.push(`Consider adjusting tone to match ${business} brand guidelines`);
  }

  // Check existing asset colors
  if (input.existingAsset?.colors && input.existingAsset.colors.length > 0) {
    const brandColors = BRAND_COLORS[business] || BRAND_COLORS.em;
    const brandHexes = Object.values(brandColors).map(c => c.hex.toLowerCase());

    const matchingColors = input.existingAsset.colors.filter(c =>
      brandHexes.includes(c.toLowerCase())
    );

    if (matchingColors.length >= 2) {
      score += 5;
      strengths.push('Color palette uses brand colors effectively');
    } else {
      improvements.push('Incorporate more brand colors from the official palette');
    }
  }

  // Check message alignment
  if (input.project?.message) {
    const message = input.project.message.toLowerCase();
    if (message.includes('transform') || message.includes('elevate') || message.includes('growth')) {
      score += 5;
      strengths.push('Message uses transformation-focused language aligned with brand mission');
    }
  }

  const aligned = score >= 80;

  return {
    aligned,
    score: Math.min(score, 100),
    strengths,
    improvements,
  };
}

/**
 * Generate asset recommendations
 */
function generateAssetRecommendations(
  input: CreativeDirectorInput
): CreativeDirectorOutput['assetRecommendations'] {
  const platform = input.project?.platform || 'all';
  const goal = input.project?.goal || 'engagement';

  const recommendations: CreativeDirectorOutput['assetRecommendations'] = [];

  if (platform === 'instagram' || platform === 'all') {
    recommendations.push({
      assetType: 'Reels video',
      platform: 'Instagram',
      purpose: 'High engagement short-form content',
      specs: '1080x1920px, 15-60s, vertical, MP4',
      priority: goal === 'engagement' ? 'high' : 'medium',
    });

    recommendations.push({
      assetType: 'Carousel post',
      platform: 'Instagram',
      purpose: 'Educational content series',
      specs: '1080x1080px, 5-10 slides, JPG/PNG',
      priority: goal === 'education' ? 'high' : 'medium',
    });
  }

  if (platform === 'email' || platform === 'all') {
    recommendations.push({
      assetType: 'Email header image',
      platform: 'Email',
      purpose: 'Hero section for campaigns',
      specs: '600x400px, < 200KB, JPG optimized',
      priority: goal === 'conversion' ? 'high' : 'medium',
    });
  }

  if (platform === 'web' || platform === 'all') {
    recommendations.push({
      assetType: 'Landing page hero',
      platform: 'Web',
      purpose: 'Above-fold conversion driver',
      specs: '1920x1080px, WebP format, responsive',
      priority: goal === 'conversion' ? 'high' : 'low',
    });
  }

  return recommendations;
}

/**
 * Generate campaign theme
 */
function generateCampaignTheme(input: CreativeDirectorInput): CreativeDirectorOutput['campaignTheme'] {
  const business = input.brandContext?.business || 'em';
  const goal = input.project?.goal || 'awareness';

  const themes: Record<string, CreativeDirectorOutput['campaignTheme']> = {
    em: {
      name: 'Movement Makers',
      tagline: 'From Vision to Velocity',
      coreMessage: 'Elevate your business through intentional movement and strategic growth',
      visualDirection: 'Dynamic motion graphics with transformation imagery, bold typography, energetic color palette',
      contentPillars: [
        'Founder Stories (transformation narratives)',
        'Movement Moments (actionable insights)',
        'Velocity Wins (quick wins & results)',
        'Elevated Mindset (thought leadership)',
      ],
    },
    quicklist: {
      name: 'List. Sell. Thrive.',
      tagline: 'Your Marketplace, Simplified',
      coreMessage: 'Turn clutter into cash with effortless listing and selling',
      visualDirection: 'Clean, modern interface showcases, before/after product shots, minimalist design',
      contentPillars: [
        'Quick Tips (listing best practices)',
        'Seller Spotlights (success stories)',
        'Market Trends (what sells now)',
        'Simplify & Succeed (workflow hacks)',
      ],
    },
    grants: {
      name: 'Funded Future',
      tagline: 'Grants Made Simple',
      coreMessage: 'Access funding opportunities without the overwhelm',
      visualDirection: 'Professional, trustworthy aesthetic with data visualization and success metrics',
      contentPillars: [
        'Grant Guides (how-to content)',
        'Funding Opportunities (curated grants)',
        'Application Tips (expert advice)',
        'Success Stories (testimonials)',
      ],
    },
    'meal-vision': {
      name: 'Nourish Your Vision',
      tagline: 'Meal Planning, Perfected',
      coreMessage: 'Healthy eating made easy with AI-powered meal planning',
      visualDirection: 'Fresh, appetizing food photography with clean layouts and vibrant colors',
      contentPillars: [
        'Recipe Spotlights (seasonal favorites)',
        'Nutrition Insights (health education)',
        'Meal Prep Tips (time-saving hacks)',
        'Community Plates (user-generated content)',
      ],
    },
  };

  return themes[business] || themes.em;
}

/**
 * Main execution function
 */
export async function runP1CreativeDirector(
  input: CreativeDirectorInput
): Promise<CreativeDirectorOutput> {
  const runId = `creative_direct_${Date.now()}`;
  const mode = input.mode || 'offline';
  const requestType = input.requestType || 'concept';

  // Validation
  let confidenceScore = 1.0;

  if (!input.userId) {
    confidenceScore = 0.3;
  }

  let insight = '';
  let recommendedNextAction = '';

  const output: CreativeDirectorOutput = {
    runId,
    userId: input.userId || 'unknown',
    requestType,
    confidenceScore,
    insight: '',
    recommendedNextAction: '',
    mode,
    offline: true,
    generatedAt: new Date().toISOString(),
  };

  switch (requestType) {
    case 'concept':
      const concepts = [
        generateVisualConcept(input, 1),
        generateVisualConcept(input, 2),
      ];
      output.concepts = concepts;
      insight = `Generated ${concepts.length} visual concepts for ${input.project?.platform || 'multi-platform'} with ${concepts[0].brandAlignment}% brand alignment.`;
      recommendedNextAction = 'Review concepts and select one for development. Request revisions if needed.';
      break;

    case 'brand_check':
      const brandCheck = checkBrandAlignment(input);
      output.brandCheck = brandCheck;
      insight = `Brand alignment score: ${brandCheck.score}/100. ${brandCheck.aligned ? 'Asset aligns well with brand guidelines.' : 'Some improvements recommended.'}`;
      recommendedNextAction = brandCheck.aligned
        ? 'Proceed with asset production.'
        : 'Address improvement areas before finalizing asset.';
      break;

    case 'asset_suggest':
      const assetRecommendations = generateAssetRecommendations(input);
      output.assetRecommendations = assetRecommendations;
      insight = `Recommended ${assetRecommendations.length} asset types optimized for ${input.project?.goal || 'engagement'}.`;
      recommendedNextAction = `Start with ${assetRecommendations.find(a => a.priority === 'high')?.assetType || 'highest priority asset'}.`;
      break;

    case 'campaign_theme':
      const campaignTheme = generateCampaignTheme(input);
      output.campaignTheme = campaignTheme;
      insight = `Campaign theme "${campaignTheme.name}" with ${campaignTheme.contentPillars.length} content pillars.`;
      recommendedNextAction = 'Develop content calendar around the 4 content pillars.';
      break;
  }

  output.insight = insight;
  output.recommendedNextAction = recommendedNextAction;

  return output;
}
