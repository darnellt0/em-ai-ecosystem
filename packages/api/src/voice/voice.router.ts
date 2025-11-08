/**
 * Voice API Main Router
 * Implements all voice command endpoints for the Elevated Movements AI ecosystem
 */

import { Router, Response, RequestHandler } from "express";
import { authBearer, AuthenticatedRequest } from "../middleware/authBearer";
import { rateLimitSimple } from "../middleware/rateLimitSimple";
import { idempotency } from "../middleware/idempotency";
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
} from "./voice.types";
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
} from "./voice.services";

const router = Router();

const middleware = [authBearer, rateLimitSimple, idempotency];

const asyncHandler = (
  fn: (req: AuthenticatedRequest, res: Response) => Promise<void>,
): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(fn(req as AuthenticatedRequest, res)).catch(next);
  };
};

router.post("/scheduler/block", ...middleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const parsed = parseVoiceRequest(FocusBlockSchema, req.body);
  if (!parsed.success) {
    res.status(parsed.status || 400).json({ status: "error", humanSummary: "Invalid request", errors: parsed.errors });
    return;
  }
  const result = await blockFocus(parsed.data!);
  res.status(result.status === "ok" ? 200 : 500).json(result);
}));

router.post("/scheduler/confirm", ...middleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const parsed = parseVoiceRequest(ConfirmMeetingSchema, req.body);
  if (!parsed.success) {
    res.status(parsed.status || 400).json({ status: "error", humanSummary: "Invalid request", errors: parsed.errors });
    return;
  }
  const result = await confirmMeeting(parsed.data!);
  res.status(result.status === "ok" ? 200 : 500).json(result);
}));

router.post("/scheduler/reschedule", ...middleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const parsed = parseVoiceRequest(RescheduleSchema, req.body);
  if (!parsed.success) {
    res.status(parsed.status || 400).json({ status: "error", humanSummary: "Invalid request", errors: parsed.errors });
    return;
  }
  const result = await rescheduleMeeting(parsed.data!);
  res.status(result.status === "ok" ? 200 : 500).json(result);
}));

router.post("/coach/pause", ...middleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const parsed = parseVoiceRequest(PauseSchema, req.body);
  if (!parsed.success) {
    res.status(parsed.status || 400).json({ status: "error", humanSummary: "Invalid request", errors: parsed.errors });
    return;
  }
  const result = await startPause(parsed.data!);
  res.status(result.status === "ok" ? 200 : 500).json(result);
}));

router.post("/support/log-complete", ...middleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const parsed = parseVoiceRequest(LogCompleteSchema, req.body);
  if (!parsed.success) {
    res.status(parsed.status || 400).json({ status: "error", humanSummary: "Invalid request", errors: parsed.errors });
    return;
  }
  const result = await logTaskComplete(parsed.data!);
  res.status(result.status === "ok" ? 200 : 500).json(result);
}));

router.post("/support/follow-up", ...middleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const parsed = parseVoiceRequest(FollowUpSchema, req.body);
  if (!parsed.success) {
    res.status(parsed.status || 400).json({ status: "error", humanSummary: "Invalid request", errors: parsed.errors });
    return;
  }
  const result = await createFollowUp(parsed.data!);
  res.status(result.status === "ok" ? 200 : 500).json(result);
}));

router.post("/analytics/daily-brief", ...middleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const parsed = parseVoiceRequest(DailyBriefSchema, req.body);
  if (!parsed.success) {
    res.status(parsed.status || 400).json({ status: "error", humanSummary: "Invalid request", errors: parsed.errors });
    return;
  }
  const result = await getDailyBrief(parsed.data!.founder);
  res.status(result.status === "ok" ? 200 : 500).json(result);
}));

router.post("/analytics/insights", ...middleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const parsed = parseVoiceRequest(InsightsSchema, req.body);
  if (!parsed.success) {
    res.status(parsed.status || 400).json({ status: "error", humanSummary: "Invalid request", errors: parsed.errors });
    return;
  }
  const result = await getInsights(parsed.data!.founder, parsed.data!.timeframe);
  res.status(result.status === "ok" ? 200 : 500).json(result);
}));

router.post("/business/grants", ...middleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const parsed = parseVoiceRequest(GrantOpportunitiesSchema, req.body);
  if (!parsed.success) {
    res.status(parsed.status || 400).json({ status: "error", humanSummary: "Invalid request", errors: parsed.errors });
    return;
  }
  const result = await getGrantOpportunities(parsed.data!.founder);
  res.status(result.status === "ok" ? 200 : 500).json(result);
}));

router.post("/business/relationships", ...middleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const parsed = parseVoiceRequest(TrackRelationshipSchema, req.body);
  if (!parsed.success) {
    res.status(parsed.status || 400).json({ status: "error", humanSummary: "Invalid request", errors: parsed.errors });
    return;
  }
  const { founder, contactId, action } = parsed.data!;
  const result = await trackRelationship(founder, contactId, action);
  res.status(result.status === "ok" ? 200 : 500).json(result);
}));

router.post("/business/budget", ...middleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const parsed = parseVoiceRequest(AllocateBudgetSchema, req.body);
  if (!parsed.success) {
    res.status(parsed.status || 400).json({ status: "error", humanSummary: "Invalid request", errors: parsed.errors });
    return;
  }
  const { founder, totalBudget, goals } = parsed.data!;
  const result = await allocateBudget(founder, totalBudget, goals);
  res.status(result.status === "ok" ? 200 : 500).json(result);
}));

router.post("/business/content", ...middleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const parsed = parseVoiceRequest(GenerateContentSchema, req.body);
  if (!parsed.success) {
    res.status(parsed.status || 400).json({ status: "error", humanSummary: "Invalid request", errors: parsed.errors });
    return;
  }
  const { founder, platform, topic } = parsed.data!;
  const result = await generateContent(founder, platform, topic);
  res.status(result.status === "ok" ? 200 : 500).json(result);
}));

router.post("/business/brand-story", ...middleware, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const parsed = parseVoiceRequest(GenerateBrandStorySchema, req.body);
  if (!parsed.success) {
    res.status(parsed.status || 400).json({ status: "error", humanSummary: "Invalid request", errors: parsed.errors });
    return;
  }
  const { founder, companyName, values } = parsed.data!;
  const result = await generateBrandStory(founder, companyName, values);
  res.status(result.status === "ok" ? 200 : 500).json(result);
}));

export default router;
