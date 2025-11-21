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
    sentiment: number;
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
 * Run Journal Agent
 */
export declare function runJournalAgent(ctx: OrchestratorRunContext): Promise<GrowthAgentResult>;
//# sourceMappingURL=journal-agent.d.ts.map