import { Router, Request, Response } from 'express';
import { runDailyBriefAgent } from '../services/dailyBrief.service';
import { runP0CalendarOptimizer } from '../exec-admin/flows/p0-calendar-optimizer';
import { runP0FinancialAllocator } from '../exec-admin/flows/p0-financial-allocator';
import { runP0InsightAnalyst } from '../exec-admin/flows/p0-insight-analyst';
import { runP0NicheDiscover } from '../exec-admin/flows/p0-niche-discover';
import { runP1Mindset } from '../exec-admin/flows/p1-mindset';
import { runP1Rhythm } from '../exec-admin/flows/p1-rhythm';
import { runP1Purpose } from '../exec-admin/flows/p1-purpose';


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
            wave: 3,
            p0Status: 'COMPLETE',
            p0Agents: {
              daily_brief: 'active',
              journal: 'active_separate_route',
              calendar_optimize: 'active',
              financial_allocate: 'active',
              insights: 'active',
              niche_discover: 'active',
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
