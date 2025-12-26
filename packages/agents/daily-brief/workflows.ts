import { AgentOutput } from '../../shared/contracts';
import { DailyBriefDependencies, DailyBriefPayload, DailyBriefResult, dailyBriefHealth, runDailyBriefService } from './service';

export interface DailyBriefWorkflowDeps extends DailyBriefDependencies {}

/**
 * Wire up MCP hybrid services if available
 * NOTE: This requires packages/api to be available at runtime
 * Will be no-op if MCP services not found
 */
function wireHybridServices(deps: DailyBriefWorkflowDeps): DailyBriefWorkflowDeps {
  try {
    // Dynamic import - only works when running from API context
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { HybridCalendarService } = require('../../../api/src/services/calendar.hybrid.service');
    const { HybridInboxService } = require('../../../api/src/services/inbox.hybrid.service');

    const hybridDeps: DailyBriefWorkflowDeps = {
      ...deps,
      calendar: {
        summarizeDay: async (user: string, date: string) => {
          const events = await HybridCalendarService.getTodayEvents(user);
          return {
            meetings: events.length,
            highlights: events.slice(0, 3).map((e: any) => e.summary || 'Untitled Event'),
          };
        },
        suggestFocusBlock: async (user: string, date: string) => {
          // TODO: Implement smart focus block suggestion based on calendar gaps
          const defaultBlock = {
            start: `${date}T09:00:00Z`,
            end: `${date}T10:30:00Z`,
            theme: 'Deep work: unblock the most valuable task',
          };
          return defaultBlock;
        },
      },
      inbox: {
        fetchHighlights: async (user: string, date: string) => {
          const emails = await HybridInboxService.getImportantUnread(user, 5);
          return emails.map((e: any) => ({
            from: e.from || 'Unknown',
            subject: e.subject || 'No Subject',
            whyImportant: e.isUnread ? 'Unread and marked important' : 'Important',
          }));
        },
      },
    };

    console.log('[DailyBrief] Using Hybrid MCP services');
    return hybridDeps;
  } catch (err) {
    // MCP services not available - use provided deps or defaults
    console.log('[DailyBrief] MCP services not available, using provided deps');
    return deps;
  }
}

export async function runDailyBriefWorkflow(payload: DailyBriefPayload, deps: DailyBriefWorkflowDeps = {}): Promise<AgentOutput<DailyBriefResult>> {
  const wiredDeps = wireHybridServices(deps);
  return runDailyBriefService(payload, wiredDeps);
}

export async function healthDailyBrief(deps: Pick<DailyBriefDependencies, 'version'> = {}) {
  return dailyBriefHealth(deps);
}
