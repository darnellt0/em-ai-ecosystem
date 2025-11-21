/**
 * Journal Agent - Daily Alignment Journal
 * Phase: Rooted
 * Helps users reflect and align through journaling
 */

import { OrchestratorRunContext, GrowthAgentResult } from '../types';

/**
 * Journal entry data structure
 */
export interface JournalEntry {
  timestamp: string;
  email: string;
  text: string;
  transcript?: string;
  sentiment: number; // 0-1
  topics: string[];
  summary: string;
}

/**
 * Journal Agent Configuration
 */
export interface JournalAgentConfig {
  googleSheetsEnabled: boolean;
  spreadsheetId?: string;
  sheetName?: string;
  openaiApiKey?: string;
}

/**
 * Mock sentiment analysis (replace with real OpenAI when available)
 */
function analyzeSentiment(text: string): number {
  // Simple mock: longer text = more positive sentiment
  // In production, use OpenAI API
  const wordCount = text.split(/\s+/).length;
  return Math.min(0.9, Math.max(0.1, wordCount / 100));
}

/**
 * Mock topic extraction (replace with real OpenAI when available)
 */
function extractTopics(text: string): string[] {
  // Simple mock: extract common words
  // In production, use OpenAI API for semantic topic extraction
  const words = text.toLowerCase().split(/\s+/);
  const topics: string[] = [];

  if (words.some((w) => w.includes('goal') || w.includes('achieve'))) topics.push('goals');
  if (words.some((w) => w.includes('feel') || w.includes('emotion'))) topics.push('emotions');
  if (words.some((w) => w.includes('work') || w.includes('task'))) topics.push('productivity');

  return topics.slice(0, 3);
}

/**
 * Mock text summarization (replace with real OpenAI when available)
 */
function summarizeText(text: string): string {
  // Simple mock: take first sentence
  // In production, use OpenAI API
  const sentences = text.split(/[.!?]+/);
  return sentences[0] ? sentences[0].trim() + '.' : 'No summary available.';
}

/**
 * Create journal entries from reflections
 */
async function createJournalEntries(
  ctx: OrchestratorRunContext,
  reflections: string[]
): Promise<JournalEntry[]> {
  const entries: JournalEntry[] = [];

  for (const reflection of reflections) {
    const entry: JournalEntry = {
      timestamp: new Date().toISOString(),
      email: ctx.email || ctx.userId,
      text: reflection,
      sentiment: analyzeSentiment(reflection),
      topics: extractTopics(reflection),
      summary: summarizeText(reflection),
    };

    entries.push(entry);
  }

  return entries;
}

/**
 * Write entries to Google Sheets (mock for now)
 */
async function writeToGoogleSheets(
  entries: JournalEntry[],
  config: JournalAgentConfig
): Promise<boolean> {
  if (!config.googleSheetsEnabled) {
    console.warn('[JournalAgent] Google Sheets integration not enabled');
    return false;
  }

  if (!config.spreadsheetId) {
    console.warn('[JournalAgent] No spreadsheet ID configured');
    return false;
  }

  // TODO: Implement actual Google Sheets API integration
  // For now, just log the entries
  console.info(`[JournalAgent] Would write ${entries.length} entries to Google Sheets`);
  console.info(`[JournalAgent] Spreadsheet ID: ${config.spreadsheetId}`);
  console.info(`[JournalAgent] Sheet Name: ${config.sheetName || 'EM_Journal'}`);

  return true;
}

/**
 * Run Journal Agent
 */
export async function runJournalAgent(ctx: OrchestratorRunContext): Promise<GrowthAgentResult> {
  const startedAt = new Date().toISOString();
  const errors: string[] = [];

  console.info(`[JournalAgent] Starting Daily Alignment Journal for ${ctx.userId}`);

  try {
    // Configuration
    const config: JournalAgentConfig = {
      googleSheetsEnabled: !!process.env.GOOGLE_APPLICATION_CREDENTIALS,
      spreadsheetId: process.env.EM_JOURNAL_SPREADSHEET_ID,
      sheetName: 'EM_Journal',
      openaiApiKey: process.env.OPENAI_API_KEY,
    };

    // Generate sample reflections (in production, these would come from user input)
    const sampleReflections = [
      'Today I made progress on my personal growth goals and feel aligned with my purpose.',
      'I struggled with work-life balance but learned valuable lessons about setting boundaries.',
      'Feeling grateful for the support of my community and excited about upcoming opportunities.',
    ];

    // Create journal entries
    const entries = await createJournalEntries(ctx, sampleReflections);

    console.info(`[JournalAgent] Created ${entries.length} journal entries`);

    // Attempt to write to Google Sheets
    let sheetsWritten = false;
    if (config.googleSheetsEnabled) {
      try {
        sheetsWritten = await writeToGoogleSheets(entries, config);
      } catch (error: any) {
        errors.push(`Google Sheets write failed: ${error.message}`);
        console.warn(`[JournalAgent] ${errors[errors.length - 1]}`);
      }
    } else {
      errors.push('Google Sheets integration not configured');
    }

    const completedAt = new Date().toISOString();

    // Return result
    return {
      success: entries.length > 0,
      errors: errors.length > 0 ? errors : undefined,
      artifacts: {
        entriesCreated: entries.length,
        sheetsWritten,
        entries: entries.map((e) => ({
          timestamp: e.timestamp,
          sentiment: e.sentiment,
          topics: e.topics,
          summary: e.summary,
        })),
        config: {
          googleSheetsEnabled: config.googleSheetsEnabled,
          spreadsheetId: config.spreadsheetId,
          sheetName: config.sheetName,
        },
      },
      startedAt,
      completedAt,
      retries: 0,
    };
  } catch (error: any) {
    const completedAt = new Date().toISOString();
    console.error(`[JournalAgent] Error: ${error.message}`);

    return {
      success: false,
      errors: [error.message],
      startedAt,
      completedAt,
      retries: 0,
    };
  }
}
