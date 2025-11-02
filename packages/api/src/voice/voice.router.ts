/**
 * Voice API Router for ElevenLabs integration.
 * 6 endpoints with Zod validation, bearer auth, rate limiting, and idempotency.
 *
 * Middleware stack: authBearer → rateLimitSimple → idempotency
 */

import { Router, Response, RequestHandler } from 'express';
import { authBearer, AuthenticatedRequest } from '../middleware/authBearer';
import { rateLimitSimple } from '../middleware/rateLimitSimple';
import { idempotency } from '../middleware/idempotency';
import {
  FocusBlockSchema,
  ConfirmMeetingSchema,
  RescheduleSchema,
  PauseSchema,
  LogCompleteSchema,
  FollowUpSchema,
  DailyBriefSchema,
  InsightsSchema,
  GrantOpportunitiesSchema,
  TrackRelationshipSchema,
  AllocateBudgetSchema,
  GenerateContentSchema,
  GenerateBrandStorySchema,
  parseVoiceRequest,
} from './voice.types';
import {
  blockFocus,
  confirmMeeting,
  rescheduleMeeting,
  startPause,
  logTaskComplete,
  createFollowUp,
  getDailyBrief,
  getInsights,
  getGrantOpportunities,
  trackRelationship,
  allocateBudget,
  generateContent,
  generateBrandStory,
} from './voice.services';
import { HybridRouterService } from '../services/hybrid-router.service';

const router = Router();

// Apply middleware stack to all routes
const middleware = [authBearer, rateLimitSimple, idempotency];

// Helper to wrap async handlers
const asyncHandler = (fn: (req: AuthenticatedRequest, res: Response) => Promise<void>): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(fn(req as AuthenticatedRequest, res)).catch(next);
  };
};

// ============================================================================
// ENDPOINT 1: POST /api/voice/scheduler/block
// ============================================================================

/**
 * Block focus time.
 * Request: FocusBlockInput
 * Response: VoiceResponse
 */
router.post(
  '/scheduler/block',
  ...middleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const parsed = parseVoiceRequest(FocusBlockSchema, req.body);
    if (!parsed.success) {
      res.status(parsed.status).json({
        status: 'error',
        humanSummary: 'Invalid request: ' + parsed.errors.join('; '),
        nextBestAction: 'Check payload and retry.',
      });
      return;
    }

    const result = await blockFocus({
      minutes: parsed.data.minutes,
      reason: parsed.data.reason,
      bufferMinutes: parsed.data.bufferMinutes || 10,
      startAtISO: parsed.data.startAtISO,
      founder: parsed.data.founder || 'shria',
    });
    res.status(result.status === 'ok' ? 200 : 400).json(result);
  })
);

// ============================================================================
// ENDPOINT 2: POST /api/voice/scheduler/confirm
// ============================================================================

/**
 * Confirm and add a meeting to calendar.
 * Request: ConfirmMeetingInput
 * Response: VoiceResponse
 */
router.post(
  '/scheduler/confirm',
  ...middleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const parsed = parseVoiceRequest(ConfirmMeetingSchema, req.body);
    if (!parsed.success) {
      res.status(parsed.status).json({
        status: 'error',
        humanSummary: 'Invalid request: ' + parsed.errors.join('; '),
        nextBestAction: 'Check payload and retry.',
      });
      return;
    }

    const result = await confirmMeeting({
      startAtISO: parsed.data.startAtISO,
      title: parsed.data.title,
      durationMinutes: parsed.data.durationMinutes,
      founder: parsed.data.founder || 'shria',
      location: parsed.data.location,
    });
    res.status(result.status === 'ok' ? 200 : 400).json(result);
  })
);

// ============================================================================
// ENDPOINT 3: POST /api/voice/scheduler/reschedule
// ============================================================================

/**
 * Reschedule an existing calendar event.
 * Request: RescheduleInput
 * Response: VoiceResponse
 */
router.post(
  '/scheduler/reschedule',
  ...middleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const parsed = parseVoiceRequest(RescheduleSchema, req.body);
    if (!parsed.success) {
      res.status(parsed.status).json({
        status: 'error',
        humanSummary: 'Invalid request: ' + parsed.errors.join('; '),
        nextBestAction: 'Check payload and retry.',
      });
      return;
    }

    const result = await rescheduleMeeting({
      founder: parsed.data.founder || 'shria',
      eventId: parsed.data.eventId,
      newStartAtISO: parsed.data.newStartAtISO,
      newDurationMinutes: parsed.data.newDurationMinutes,
    });
    res.status(result.status === 'ok' ? 200 : 400).json(result);
  })
);

// ============================================================================
// ENDPOINT 4: POST /api/voice/coach/pause
// ============================================================================

/**
 * Start a guided pause or meditation.
 * Request: PauseInput
 * Response: VoiceResponse
 */
router.post(
  '/coach/pause',
  ...middleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const parsed = parseVoiceRequest(PauseSchema, req.body);
    if (!parsed.success) {
      res.status(parsed.status).json({
        status: 'error',
        humanSummary: 'Invalid request: ' + parsed.errors.join('; '),
        nextBestAction: 'Check payload and retry.',
      });
      return;
    }

    const result = await startPause({
      founder: parsed.data.founder || 'shria',
      style: parsed.data.style || 'grounding',
      seconds: parsed.data.seconds || 60,
    });
    res.status(result.status === 'ok' ? 200 : 400).json(result);
  })
);

// ============================================================================
// ENDPOINT 5: POST /api/voice/support/log-complete
// ============================================================================

/**
 * Log a task as complete.
 * Request: LogCompleteInput
 * Response: VoiceResponse
 */
router.post(
  '/support/log-complete',
  ...middleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const parsed = parseVoiceRequest(LogCompleteSchema, req.body);
    if (!parsed.success) {
      res.status(parsed.status).json({
        status: 'error',
        humanSummary: 'Invalid request: ' + parsed.errors.join('; '),
        nextBestAction: 'Check payload and retry.',
      });
      return;
    }

    const result = await logTaskComplete({
      founder: parsed.data.founder || 'shria',
      taskId: parsed.data.taskId,
      note: parsed.data.note,
    });
    res.status(result.status === 'ok' ? 200 : 400).json(result);
  })
);

// ============================================================================
// ENDPOINT 6: POST /api/voice/support/follow-up
// ============================================================================

/**
 * Create a follow-up task or reminder.
 * Request: FollowUpInput
 * Response: VoiceResponse
 */
router.post(
  '/support/follow-up',
  ...middleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const parsed = parseVoiceRequest(FollowUpSchema, req.body);
    if (!parsed.success) {
      res.status(parsed.status).json({
        status: 'error',
        humanSummary: 'Invalid request: ' + parsed.errors.join('; '),
        nextBestAction: 'Check payload and retry.',
      });
      return;
    }

    const result = await createFollowUp({
      founder: parsed.data.founder || 'shria',
      subject: parsed.data.subject,
      dueISO: parsed.data.dueISO,
      context: parsed.data.context,
    });
    res.status(result.status === 'ok' ? 200 : 400).json(result);
  })
);

// ============================================================================
// PHASE 2C ENDPOINTS: ANALYTICS & BUSINESS INTELLIGENCE
// ============================================================================

// ============================================================================
// ENDPOINT 7: POST /api/voice/analytics/daily-brief
// ============================================================================

/**
 * Get daily executive brief.
 * Request: DailyBriefInput
 * Response: VoiceResponse
 */
router.post(
  '/analytics/daily-brief',
  ...middleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const parsed = parseVoiceRequest(DailyBriefSchema, req.body);
    if (!parsed.success) {
      res.status(parsed.status).json({
        status: 'error',
        humanSummary: 'Invalid request: ' + parsed.errors.join('; '),
        nextBestAction: 'Check payload and retry.',
      });
      return;
    }

    const result = await getDailyBrief(parsed.data.founder || 'shria');
    res.status(result.status === 'ok' ? 200 : 400).json(result);
  })
);

// ============================================================================
// ENDPOINT 8: POST /api/voice/analytics/insights
// ============================================================================

/**
 * Get productivity insights and analysis.
 * Request: InsightsInput
 * Response: VoiceResponse
 */
router.post(
  '/analytics/insights',
  ...middleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const parsed = parseVoiceRequest(InsightsSchema, req.body);
    if (!parsed.success) {
      res.status(parsed.status).json({
        status: 'error',
        humanSummary: 'Invalid request: ' + parsed.errors.join('; '),
        nextBestAction: 'Check payload and retry.',
      });
      return;
    }

    const result = await getInsights(
      parsed.data.founder || 'shria',
      parsed.data.timeframe || 'daily'
    );
    res.status(result.status === 'ok' ? 200 : 400).json(result);
  })
);

// ============================================================================
// ENDPOINT 9: POST /api/voice/business/grants
// ============================================================================

/**
 * Discover grant opportunities.
 * Request: GrantOpportunitiesInput
 * Response: VoiceResponse
 */
router.post(
  '/business/grants',
  ...middleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const parsed = parseVoiceRequest(GrantOpportunitiesSchema, req.body);
    if (!parsed.success) {
      res.status(parsed.status).json({
        status: 'error',
        humanSummary: 'Invalid request: ' + parsed.errors.join('; '),
        nextBestAction: 'Check payload and retry.',
      });
      return;
    }

    const result = await getGrantOpportunities(parsed.data.founder || 'shria');
    res.status(result.status === 'ok' ? 200 : 400).json(result);
  })
);

// ============================================================================
// ENDPOINT 10: POST /api/voice/business/relationships
// ============================================================================

/**
 * Track relationship interactions.
 * Request: TrackRelationshipInput
 * Response: VoiceResponse
 */
router.post(
  '/business/relationships',
  ...middleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const parsed = parseVoiceRequest(TrackRelationshipSchema, req.body);
    if (!parsed.success) {
      res.status(parsed.status).json({
        status: 'error',
        humanSummary: 'Invalid request: ' + parsed.errors.join('; '),
        nextBestAction: 'Check payload and retry.',
      });
      return;
    }

    const result = await trackRelationship(
      parsed.data.founder || 'shria',
      parsed.data.contactId,
      parsed.data.action
    );
    res.status(result.status === 'ok' ? 200 : 400).json(result);
  })
);

// ============================================================================
// ENDPOINT 11: POST /api/voice/business/budget
// ============================================================================

/**
 * Allocate budget across categories.
 * Request: AllocateBudgetInput
 * Response: VoiceResponse
 */
router.post(
  '/business/budget',
  ...middleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const parsed = parseVoiceRequest(AllocateBudgetSchema, req.body);
    if (!parsed.success) {
      res.status(parsed.status).json({
        status: 'error',
        humanSummary: 'Invalid request: ' + parsed.errors.join('; '),
        nextBestAction: 'Check payload and retry.',
      });
      return;
    }

    const result = await allocateBudget(
      parsed.data.founder || 'shria',
      parsed.data.totalBudget,
      parsed.data.goals
    );
    res.status(result.status === 'ok' ? 200 : 400).json(result);
  })
);

// ============================================================================
// ENDPOINT 12: POST /api/voice/business/content
// ============================================================================

/**
 * Generate content for multiple platforms.
 * Request: GenerateContentInput
 * Response: VoiceResponse
 */
router.post(
  '/business/content',
  ...middleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const parsed = parseVoiceRequest(GenerateContentSchema, req.body);
    if (!parsed.success) {
      res.status(parsed.status).json({
        status: 'error',
        humanSummary: 'Invalid request: ' + parsed.errors.join('; '),
        nextBestAction: 'Check payload and retry.',
      });
      return;
    }

    const result = await generateContent(
      parsed.data.founder || 'shria',
      parsed.data.platform,
      parsed.data.topic
    );
    res.status(result.status === 'ok' ? 200 : 400).json(result);
  })
);

// ============================================================================
// ENDPOINT 13: POST /api/voice/business/brand-story
// ============================================================================

/**
 * Generate brand narrative and story.
 * Request: GenerateBrandStoryInput
 * Response: VoiceResponse
 */
router.post(
  '/business/brand-story',
  ...middleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const parsed = parseVoiceRequest(GenerateBrandStorySchema, req.body);
    if (!parsed.success) {
      res.status(parsed.status).json({
        status: 'error',
        humanSummary: 'Invalid request: ' + parsed.errors.join('; '),
        nextBestAction: 'Check payload and retry.',
      });
      return;
    }

    const result = await generateBrandStory(
      parsed.data.founder || 'shria',
      parsed.data.companyName,
      parsed.data.values
    );
    res.status(result.status === 'ok' ? 200 : 400).json(result);
  })
);

// ============================================================================
// HYBRID ENDPOINT: POST /api/voice/hybrid
// ============================================================================

/**
 * Hybrid smart router - tries deterministic agents first, falls back to OpenAI
 * for complex reasoning tasks. Best of both worlds:
 * - Fast responses for simple requests (100ms)
 * - Intelligent reasoning for complex requests (via GPT-4)
 * - Cost-effective (only use OpenAI when needed)
 *
 * Request: { transcript: string, founder: 'darnell' | 'shria' }
 * Response: { route: 'deterministic' | 'openai', complexity, humanSummary, nextBestAction, latency, cost }
 */
router.post(
  '/hybrid',
  ...middleware,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const transcript = req.body?.transcript;
    const founder = req.body?.founder || 'shria';

    if (!transcript || typeof transcript !== 'string' || transcript.trim().length === 0) {
      res.status(400).json({
        status: 'error',
        humanSummary: 'Invalid request: transcript is required',
        nextBestAction: 'Provide a non-empty transcript'
      });
      return;
    }

    try {
      const hybridRouter = HybridRouterService.getInstance();
      const result = await hybridRouter.route({
        transcript: transcript.trim(),
        founder: founder as 'darnell' | 'shria'
      });

      res.status(200).json({
        status: 'ok',
        ...result
      });
    } catch (error) {
      console.error('Hybrid router error:', error);
      res.status(500).json({
        status: 'error',
        humanSummary: 'Error processing request',
        nextBestAction: 'Try again or use a simpler command'
      });
    }
  })
);

export default router;
