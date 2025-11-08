/**
 * Shared types for Growth Agents
 */

export interface JournalEntry {
  timestamp: string;
  email: string;
  text: string;
  transcript?: string;
  sentiment?: number;
  topics?: string[];
  summary?: string;
}

export interface NicheTheme {
  name: string;
  description: string;
  keywords: string[];
  score: number;
}

export interface BeliefReframe {
  originalBelief: string;
  reframe: string;
  affirmation: string;
  microPractice: string;
}

export interface PauseBlock {
  eventId: string;
  startTime: Date;
  endTime: Date;
  title: string;
  reason: string;
}

export interface PurposeDeclaration {
  statement: string;
  ikigaiInputs: {
    skills: string[];
    passions: string[];
    values: string[];
    audience: string[];
    impact: string[];
  };
  cardUrl?: string;
}

export const EM_COLORS = {
  primary: '#36013f',
  secondary: '#176161',
  gold: '#e0cd67',
  neutral: '#c3b4b3',
  dark: '#37475e',
};
