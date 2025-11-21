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
    confidence: number;
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
 * Run Niche Agent
 */
export declare function runNicheAgent(ctx: OrchestratorRunContext): Promise<GrowthAgentResult>;
//# sourceMappingURL=niche-agent.d.ts.map