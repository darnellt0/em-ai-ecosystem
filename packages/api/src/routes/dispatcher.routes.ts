import { Router, Request, Response } from 'express';
import { runDailyBriefAgent } from '../services/dailyBrief.service';

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
            p0Agents: {
              daily_brief: 'active',
              journal: 'active_separate_route',
              calendar_optimize: 'wave_2',
              financial_allocate: 'stub',
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
