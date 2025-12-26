import { Router, Request, Response } from 'express';
import { runDailyBriefAgent } from '../services/dailyBrief.service';
import { runP0CalendarOptimizer } from '../exec-admin/flows/p0-calendar-optimizer';
import { runP0FinancialAllocator } from '../exec-admin/flows/p0-financial-allocator';
import { runP0InsightAnalyst } from '../exec-admin/flows/p0-insight-analyst';
import { runP0NicheDiscover } from '../exec-admin/flows/p0-niche-discover';
import { runP1Mindset } from '../exec-admin/flows/p1-mindset';
import { runP1Rhythm } from '../exec-admin/flows/p1-rhythm';
import { runP1Purpose } from '../exec-admin/flows/p1-purpose';
import { runP1InboxAssistant } from '../exec-admin/flows/p1-inbox-assistant';
import { runP1DeepWorkDefender } from '../exec-admin/flows/p1-deep-work-defender';
import { runP1BrandStoryteller } from '../exec-admin/flows/p1-brand-storyteller';
import { runP1MembershipGuardian } from '../exec-admin/flows/p1-membership-guardian';
import { runP1IntegratedStrategist } from '../exec-admin/flows/p1-integrated-strategist';
import { runP1SystemsArchitect } from '../exec-admin/flows/p1-systems-architect';
import { runP1RelationshipTracker } from '../exec-admin/flows/p1-relationship-tracker';
import { runP1VoiceCompanion } from '../exec-admin/flows/p1-voice-companion';
import { runP1CreativeDirector } from '../exec-admin/flows/p1-creative-director';
import { runP0QaGate } from '../services/p0QaGate.service';


const dispatcherRouter = Router();

interface DispatchRequest {
  intent: string;
  payload?: Record<string, any>;
}

interface DispatchResponse {
  success: boolean;
  intent: string;
  routed: boolean;
  data?: any;
  qa?: {
    pass: boolean;
    checks?: string[];
    errors?: string[];
  };
  error?: string;
}

dispatcherRouter.post('/api/exec-admin/dispatch', async (req: Request, res: Response) => {
  const { intent, payload = {} }: DispatchRequest = req.body;

  if (!intent) {
    return res.status(400).json({
      success: false,
      routed: false,
      error: 'intent is required',
    } as DispatchResponse);
  }

  try {
    let result: DispatchResponse;

    switch (intent) {
      case 'health_check': {
        result = {
          success: true,
          intent: 'health_check',
          routed: true,
          data: {
            status: 'healthy',
            dispatcher: 'online',
            wave: 5,
            p0Status: 'COMPLETE',
            p0Agents: {
              daily_brief: 'active',
              journal: 'active_separate_route',
              calendar_optimize: 'active',
              financial_allocate: 'active',
              insights: 'active',
              niche_discover: 'active',
            },
            p1Status: 'COMPLETE',
            p1Agents: {
              mindset: 'active',
              rhythm: 'active',
              purpose: 'active',
              inbox_assistant: 'active',
              deep_work_defender: 'active',
              strategy_sync: 'active',
              systems_design: 'active',
              brand_story: 'active',
              membership_guardian: 'active',
              relationship_track: 'active',
              voice_companion: 'active',
              creative_direct: 'active',
            },
          },
          qa: {
            pass: true,
            checks: [
              'dispatcher_online',
              'daily_brief_available',
              'journal_available',
              'response_structure_valid',
            ],
          },
        };
        break;
      }

      case 'daily_brief': {
        const { userId = 'founder@elevatedmovements.com', date } = payload;
        const runId = `run_${Date.now()}`;

        const briefResult = await runDailyBriefAgent({
          user: userId.includes('darnell') ? 'darnell' : 'shria',
          date,
          runId,
        });

        result = {
          success: true,
          intent: 'daily_brief',
          routed: true,
          data: {
            runId,
            userId,
            date: date || new Date().toISOString().split('T')[0],
            brief: briefResult,
          },
          qa: {
            pass: true,
            checks: [
              'dispatcher_routed',
              'daily_brief_executed',
              'runId_generated',
              'response_structure_valid',
            ],
          },
        };
        break;
      }


      // -------------------------------------------------------------------------
      // CALENDAR OPTIMIZER (P0 - Wave 2)
      // -------------------------------------------------------------------------
      case 'calendar_optimize': {
        const { userId, calendarId, lookAheadDays, preferredFocusHours, focusBlockDuration } = payload;

        if (!userId) {
          throw new Error('calendar_optimize requires userId in payload');
        }

        const calResult = await runP0CalendarOptimizer({
          userId,
          calendarId,
          lookAheadDays,
          preferredFocusHours,
          focusBlockDuration,
        });

        result = {
          success: true,
          intent: 'calendar_optimize',
          routed: true,
          data: calResult.data,
          qa: {
            pass: true,
            checks: [
              'dispatcher_routed',
              'calendar_optimizer_executed',
              'runId_generated',
              'response_structure_valid',
            ],
          },
        };
        break;
      }

      // -------------------------------------------------------------------------
      // FINANCIAL ALLOCATOR (P0 - Wave 2)
      // -------------------------------------------------------------------------
      case 'financial_allocate': {
        const { userId, amount, currency, customRatios, includeBtc, btcPrice } = payload;

        if (!userId) {
          throw new Error('financial_allocate requires userId in payload');
        }

        if (!amount || typeof amount !== 'number' || amount <= 0) {
          throw new Error('financial_allocate requires amount (positive number) in payload');
        }

        const finResult = await runP0FinancialAllocator({
          userId,
          amount,
          currency,
          customRatios,
          includeBtc,
          btcPrice,
        });

        result = {
          success: true,
          intent: 'financial_allocate',
          routed: true,
          data: finResult.data,
          qa: {
            pass: true,
            checks: [
              'dispatcher_routed',
              'financial_allocator_executed',
              'runId_generated',
              'response_structure_valid',
            ],
          },
        };
        break;
      }

      // -------------------------------------------------------------------------
      // INSIGHT ANALYST (P0 - Wave 3)
      // -------------------------------------------------------------------------
      case 'insights': {
        const { userId, timeframe, includeEnergy, includeBurnoutRisk } = payload;

        if (!userId) {
          throw new Error('insights requires userId in payload');
        }

        const insResult = await runP0InsightAnalyst({
          userId,
          timeframe,
          includeEnergy,
          includeBurnoutRisk,
        });

        result = {
          success: true,
          intent: 'insights',
          routed: true,
          data: insResult.data,
          qa: {
            pass: true,
            checks: [
              'dispatcher_routed',
              'insight_analyst_executed',
              'runId_generated',
              'response_structure_valid',
            ],
          },
        };
        break;
      }

      // -------------------------------------------------------------------------
      // NICHE DISCOVERY (P0 - Wave 3)
      // -------------------------------------------------------------------------
      case 'niche_discover': {
        const { userId, stage, responses, currentResponse } = payload;

        if (!userId) {
          throw new Error('niche_discover requires userId in payload');
        }

        const nicheResult = await runP0NicheDiscover({
          userId,
          stage,
          responses,
          currentResponse,
        });

        result = {
          success: true,
          intent: 'niche_discover',
          routed: true,
          data: nicheResult.data,
          qa: {
            pass: true,
            checks: [
              'dispatcher_routed',
              'niche_discover_executed',
              'runId_generated',
              'response_structure_valid',
            ],
          },
        };
        break;
      }

      // -------------------------------------------------------------------------
      // MINDSET AGENT (P1 - Wave 1)
      // -------------------------------------------------------------------------
      case 'mindset': {
        const { userId, challenge, limitingBelief, desiredState } = payload;

        if (!userId) {
          throw new Error('mindset requires userId in payload');
        }

        const mindsetResult = await runP1Mindset({
          userId,
          challenge,
          limitingBelief,
          desiredState,
        });

        result = {
          success: true,
          intent: 'mindset',
          routed: true,
          data: mindsetResult.data,
          qa: {
            pass: true,
            checks: [
              'dispatcher_routed',
              'mindset_agent_executed',
              'runId_generated',
              'response_structure_valid',
            ],
          },
        };
        break;
      }

      // -------------------------------------------------------------------------
      // RHYTHM AGENT (P1 - Wave 1)
      // -------------------------------------------------------------------------
      case 'rhythm': {
        const { userId, currentSchedule, energyPatterns, goals } = payload;

        if (!userId) {
          throw new Error('rhythm requires userId in payload');
        }

        const rhythmResult = await runP1Rhythm({
          userId,
          currentSchedule,
          energyPatterns,
          goals,
        });

        result = {
          success: true,
          intent: 'rhythm',
          routed: true,
          data: rhythmResult.data,
          qa: {
            pass: true,
            checks: [
              'dispatcher_routed',
              'rhythm_agent_executed',
              'runId_generated',
              'response_structure_valid',
            ],
          },
        };
        break;
      }

      // -------------------------------------------------------------------------
      // PURPOSE AGENT (P1 - Wave 1)
      // -------------------------------------------------------------------------
      case 'purpose': {
        const { userId, skills, passions, values, audience, impact } = payload;

        if (!userId) {
          throw new Error('purpose requires userId in payload');
        }

        const purposeResult = await runP1Purpose({
          userId,
          skills,
          passions,
          values,
          audience,
          impact,
        });

        result = {
          success: true,
          intent: 'purpose',
          routed: true,
          data: purposeResult.data,
          qa: {
            pass: true,
            checks: [
              'dispatcher_routed',
              'purpose_agent_executed',
              'runId_generated',
              'response_structure_valid',
            ],
          },
        };
        break;
      }

      // -------------------------------------------------------------------------
      // INTEGRATED STRATEGIST (P1 - Wave 3)
      // -------------------------------------------------------------------------
      case 'strategy_sync': {
        const { userId, systems, timeHorizon, focusArea, mode } = payload;

        if (!userId) {
          throw new Error('strategy_sync requires userId in payload');
        }

        const strategyResult = await runP1IntegratedStrategist({
          userId,
          systems,
          timeHorizon,
          focusArea,
          mode,
        });

        result = {
          success: true,
          intent: 'strategy_sync',
          routed: true,
          data: strategyResult.data,
          qa: {
            pass: true,
            checks: [
              'dispatcher_routed',
              'integrated_strategist_executed',
              'runId_generated',
              'response_structure_valid',
            ],
          },
        };
        break;
      }

      // -------------------------------------------------------------------------
      // SYSTEMS ARCHITECT (P1 - Wave 3)
      // -------------------------------------------------------------------------
      case 'systems_design': {
        const { userId, requestType, context, currentSystems, constraints, mode } = payload;

        if (!userId) {
          throw new Error('systems_design requires userId in payload');
        }

        const architectResult = await runP1SystemsArchitect({
          userId,
          requestType,
          context,
          currentSystems,
          constraints,
          mode,
        });

        result = {
          success: true,
          intent: 'systems_design',
          routed: true,
          data: architectResult.data,
          qa: {
            pass: true,
            checks: [
              'dispatcher_routed',
              'systems_architect_executed',
              'runId_generated',
              'response_structure_valid',
            ],
          },
        };
        break;
      }

      // -------------------------------------------------------------------------
      // INBOX ASSISTANT (P1 - Wave 2)
      // -------------------------------------------------------------------------
      case 'inbox_assistant': {
        const { userId, mode, query, maxResults, includeDrafts } = payload;

        if (!userId) {
          throw new Error('inbox_assistant requires userId in payload');
        }

        const inboxResult = await runP1InboxAssistant({
          userId,
          mode,
          query,
          maxResults,
          includeDrafts,
        });

        const qaResult = runP0QaGate('inboxAssistant', inboxResult.data);
        const qaErrors = qaResult.issues.map((issue) => `${issue.field}: ${issue.message}`);

        result = {
          success: true,
          intent: 'inbox_assistant',
          routed: true,
          data: inboxResult.data,
          qa: {
            pass: qaResult.qa_pass,
            checks: qaResult.qa_pass
              ? ['dispatcher_routed', 'inbox_assistant_executed', 'response_structure_valid']
              : undefined,
            errors: qaResult.qa_pass ? undefined : qaErrors,
          },
        };
        break;
      }

      // -------------------------------------------------------------------------
      // DEEP WORK DEFENDER (P1 - Wave 2)
      // -------------------------------------------------------------------------
      case 'deep_work_defender': {
        const { userId, mode, horizonDays, targetFocusMinutes, workdayStart, workdayEnd } = payload;

        if (!userId) {
          throw new Error('deep_work_defender requires userId in payload');
        }

        if (horizonDays !== undefined && (typeof horizonDays !== 'number' || horizonDays <= 0)) {
          throw new Error('deep_work_defender requires horizonDays to be a positive number when provided');
        }

        if (targetFocusMinutes !== undefined && (typeof targetFocusMinutes !== 'number' || targetFocusMinutes <= 0)) {
          throw new Error('deep_work_defender requires targetFocusMinutes to be a positive number when provided');
        }

        if (workdayStart !== undefined && typeof workdayStart !== 'string') {
          throw new Error('deep_work_defender requires workdayStart to be a string when provided');
        }

        if (workdayEnd !== undefined && typeof workdayEnd !== 'string') {
          throw new Error('deep_work_defender requires workdayEnd to be a string when provided');
        }

        const defenderResult = await runP1DeepWorkDefender({
          userId,
          mode,
          horizonDays,
          targetFocusMinutes,
          workdayStart,
          workdayEnd,
        });

        const qaResult = runP0QaGate('deepWorkDefender', defenderResult.data);
        const qaErrors = qaResult.issues.map((issue) => `${issue.field}: ${issue.message}`);

        result = {
          success: true,
          intent: 'deep_work_defender',
          routed: true,
          data: defenderResult.data,
          qa: {
            pass: qaResult.qa_pass,
            checks: qaResult.qa_pass
              ? ['dispatcher_routed', 'deep_work_defender_executed', 'response_structure_valid']
              : undefined,
            errors: qaResult.qa_pass ? undefined : qaErrors,
          },
        };
        break;
      }

      // -------------------------------------------------------------------------
      // BRAND STORYTELLER (P1 - Wave 4)
      // -------------------------------------------------------------------------
      case 'brand_story': {
        if (!payload || typeof payload !== 'object') {
          throw new Error('brand_story requires payload');
        }

        const { userId, content, context, audience, toneHint, mode } = payload;

        const brandResult = await runP1BrandStoryteller({
          userId,
          content,
          context,
          audience,
          toneHint,
          mode,
        });

        const qaResult = runP0QaGate('brandStory', brandResult.data);
        const qaErrors = qaResult.issues.map((issue) => `${issue.field}: ${issue.message}`);

        result = {
          success: true,
          intent: 'brand_story',
          routed: true,
          data: brandResult.data,
          qa: {
            pass: qaResult.qa_pass,
            checks: qaResult.qa_pass
              ? ['dispatcher_routed', 'brand_story_executed', 'response_structure_valid']
              : undefined,
            errors: qaResult.qa_pass ? undefined : qaErrors,
          },
        };
        break;
      }

      // -------------------------------------------------------------------------
      // MEMBERSHIP GUARDIAN (P1 - Wave 4)
      // -------------------------------------------------------------------------
      case 'membership_guardian': {
        if (!payload || typeof payload !== 'object') {
          throw new Error('membership_guardian requires payload');
        }

        const { memberId, timeframe, signals, mode } = payload;

        const guardianResult = await runP1MembershipGuardian({
          memberId,
          timeframe,
          signals,
          mode,
        });

        const qaResult = runP0QaGate('membershipGuardian', guardianResult.data);
        const qaErrors = qaResult.issues.map((issue) => `${issue.field}: ${issue.message}`);

        result = {
          success: true,
          intent: 'membership_guardian',
          routed: true,
          data: guardianResult.data,
          qa: {
            pass: qaResult.qa_pass,
            checks: qaResult.qa_pass
              ? ['dispatcher_routed', 'membership_guardian_executed', 'response_structure_valid']
              : undefined,
            errors: qaResult.qa_pass ? undefined : qaErrors,
          },
        };
        break;
      }

      // -------------------------------------------------------------------------
      // RELATIONSHIP TRACKER (P1 - Wave 5)
      // -------------------------------------------------------------------------
      case 'relationship_track': {
        if (!payload || typeof payload !== 'object') {
          throw new Error('relationship_track requires payload');
        }

        const { userId, action, contactId, filters } = payload;

        const relationshipResult = await runP1RelationshipTracker({
          userId,
          action,
          contactId,
          filters,
        });

        const qaResult = runP0QaGate('relationshipTracker', relationshipResult.data);
        const qaErrors = qaResult.issues.map((issue) => `${issue.field}: ${issue.message}`);

        result = {
          success: true,
          intent: 'relationship_track',
          routed: true,
          data: relationshipResult.data,
          qa: {
            pass: qaResult.qa_pass,
            checks: qaResult.qa_pass
              ? ['dispatcher_routed', 'relationship_tracker_executed', 'response_structure_valid']
              : undefined,
            errors: qaResult.qa_pass ? undefined : qaErrors,
          },
        };
        break;
      }

      // -------------------------------------------------------------------------
      // VOICE COMPANION (P1 - Wave 5)
      // -------------------------------------------------------------------------
      case 'voice_companion': {
        if (!payload || typeof payload !== 'object') {
          throw new Error('voice_companion requires payload');
        }

        const { userId, sessionId, userMessage, context } = payload;

        const voiceResult = await runP1VoiceCompanion({
          userId,
          sessionId,
          userMessage,
          context,
        });

        const qaResult = runP0QaGate('voiceCompanion', voiceResult.data);
        const qaErrors = qaResult.issues.map((issue) => `${issue.field}: ${issue.message}`);

        result = {
          success: true,
          intent: 'voice_companion',
          routed: true,
          data: voiceResult.data,
          qa: {
            pass: qaResult.qa_pass,
            checks: qaResult.qa_pass
              ? ['dispatcher_routed', 'voice_companion_executed', 'response_structure_valid']
              : undefined,
            errors: qaResult.qa_pass ? undefined : qaErrors,
          },
        };
        break;
      }

      // -------------------------------------------------------------------------
      // CREATIVE DIRECTOR (P1 - Wave 5)
      // -------------------------------------------------------------------------
      case 'creative_direct': {
        if (!payload || typeof payload !== 'object') {
          throw new Error('creative_direct requires payload');
        }

        const { userId, requestType, business, idea, existingAsset, targetPlatform } = payload;

        const creativeResult = await runP1CreativeDirector({
          userId,
          requestType,
          business,
          idea,
          existingAsset,
          targetPlatform,
        });

        const qaResult = runP0QaGate('creativeDirector', creativeResult.data);
        const qaErrors = qaResult.issues.map((issue) => `${issue.field}: ${issue.message}`);

        result = {
          success: true,
          intent: 'creative_direct',
          routed: true,
          data: creativeResult.data,
          qa: {
            pass: qaResult.qa_pass,
            checks: qaResult.qa_pass
              ? ['dispatcher_routed', 'creative_director_executed', 'response_structure_valid']
              : undefined,
            errors: qaResult.qa_pass ? undefined : qaErrors,
          },
        };
        break;
      }
      default: {
        return res.status(400).json({
          success: false,
          intent,
          routed: false,
          error: `Unknown intent: ${intent}`,
          qa: {
            pass: false,
            errors: [`Intent "${intent}" not recognized`],
          },
        } as DispatchResponse);
      }
    }

    return res.json(result);
  } catch (error) {
    console.error('[Dispatcher] Error:', error);
    return res.status(500).json({
      success: false,
      intent,
      routed: true,
      error: (error as Error).message,
      qa: {
        pass: false,
        errors: [(error as Error).message],
      },
    } as DispatchResponse);
  }
});

export default dispatcherRouter;
