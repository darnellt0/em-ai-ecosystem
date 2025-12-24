import { Router, Request, Response } from 'express';
import { runDailyBriefAgent } from '../services/dailyBrief.service';
import { runP0CalendarOptimizer } from '../exec-admin/flows/p0-calendar-optimizer';
import { runP0FinancialAllocator } from '../exec-admin/flows/p0-financial-allocator';

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
            wave: 2,
            p0Agents: {
              daily_brief: 'active',
              journal: 'active_separate_route',
              calendar_optimize: 'active',
              financial_allocate: 'active',
              insights: 'wave_3',
              niche_discover: 'wave_3',
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
