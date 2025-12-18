export interface ContentAgentResponse<T = any> {
  success: boolean;
  intent: string;
  output: T;
  warnings?: string[];
}

export interface ContentAgentPayload {
  topic?: string;
  themes?: string[];
  audience?: string;
  tone?: string;
  platform?: string;
  context?: Record<string, any>;
  prompt?: string;
  sections?: Array<{ title: string; body: string }>;
  scriptIdea?: string;
}

export interface WeeklyContentRequest {
  scope: string;
  channels: string[];
  tone?: string;
  focus?: string;
}

export interface CarouselPlan {
  slides: Array<{ title: string; body: string; cta?: string }>;
  canvaPrompt: string;
}

export interface WeeklyContentPack {
  weekSummary: string;
  themes: string[];
  linkedinPosts: string[];
  instagramPosts: string[];
  newsletterSections: string[];
  videoScripts: string[];
  carousel: CarouselPlan;
  visualGuidance: {
    general: string;
    video: string;
    newsletter: string;
  };
  meta: {
    generatedAt: string;
    sourceAgents: string[];
    scope: string;
    channels: string[];
    tone?: string;
    focus?: string;
  };
}
