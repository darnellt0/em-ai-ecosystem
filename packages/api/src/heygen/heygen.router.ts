/**
 * HeyGen Interactive Avatar Router
 * Endpoints for avatar session management and message sending
 *
 * Middleware stack: authBearer → rateLimitSimple → idempotency
 */

import { Router, Response, RequestHandler } from 'express';
import { authBearer, AuthenticatedRequest } from '../middleware/authBearer';
import { rateLimitSimple } from '../middleware/rateLimitSimple';
import { idempotency } from '../middleware/idempotency';
import { heygenConfig } from '../config/heygen.config';
import { heygenService } from '../services/heygen.service';
import {
  StartSessionSchema,
  SendMessageSchema,
  EndSessionSchema,
  parseHeygenRequest,
  StartSessionResponse,
  SendMessageResponse,
  EndSessionResponse,
  HeygenErrorResponse,
} from './heygen.types';

const router = Router();

// Apply middleware stack to all routes
const middleware = [authBearer, rateLimitSimple, idempotency];

// Helper to wrap async handlers
const asyncHandler = (
  fn: (req: AuthenticatedRequest, res: Response) => Promise<void>
): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(fn(req as AuthenticatedRequest, res)).catch(next);
  };
};

// ============================================================================
// MIDDLEWARE: Check HeyGen Configuration
// ============================================================================

const checkHeygenConfig: RequestHandler = (req, res, next) => {
  if (!heygenConfig.isReady()) {
    const errorResponse: HeygenErrorResponse = {
      status: 'error',
      message: 'HeyGen integration not configured. Please set HEYGEN_API_KEY in environment variables.',
      code: 'HEYGEN_NOT_CONFIGURED',
    };
    res.status(503).json(errorResponse);
    return;
  }
  next();
};

// ============================================================================
// ENDPOINT 1: POST /api/heygen/session
// Start a new interactive avatar session
// ============================================================================

/**
 * Start a new interactive avatar session
 * Request: StartSessionRequest
 * Response: StartSessionResponse
 */
router.post(
  '/session',
  ...middleware,
  checkHeygenConfig,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const parsed = parseHeygenRequest(StartSessionSchema, req.body);

    if (!parsed.success) {
      const error = parsed as { success: false; status: number; errors: string[] };
      const errorResponse: HeygenErrorResponse = {
        status: 'error',
        message: 'Invalid request: ' + error.errors.join('; '),
        code: 'VALIDATION_ERROR',
      };
      res.status(error.status).json(errorResponse);
      return;
    }

    try {
      const result = await heygenService.startInteractiveAvatarSession({
        avatarId: parsed.data.avatarId,
        voiceId: parsed.data.voiceId,
        userId: parsed.data.userId,
        language: parsed.data.language,
        quality: parsed.data.quality,
      });

      const response: StartSessionResponse = {
        sessionId: result.sessionId,
        streamUrl: result.streamUrl,
        widgetToken: result.widgetToken,
        sessionToken: result.sessionToken,
        expiresAt: result.expiresAt,
      };

      res.status(200).json(response);
    } catch (error) {
      const errorResponse: HeygenErrorResponse = {
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to start avatar session',
        code: 'SESSION_START_FAILED',
      };
      res.status(500).json(errorResponse);
    }
  })
);

// ============================================================================
// ENDPOINT 2: POST /api/heygen/message
// Send a message to an active avatar session
// ============================================================================

/**
 * Send a message to the avatar for TTS playback
 * Request: SendMessageRequest
 * Response: SendMessageResponse
 */
router.post(
  '/message',
  ...middleware,
  checkHeygenConfig,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const parsed = parseHeygenRequest(SendMessageSchema, req.body);

    if (!parsed.success) {
      const error = parsed as { success: false; status: number; errors: string[] };
      const errorResponse: HeygenErrorResponse = {
        status: 'error',
        message: 'Invalid request: ' + error.errors.join('; '),
        code: 'VALIDATION_ERROR',
      };
      res.status(error.status).json(errorResponse);
      return;
    }

    try {
      const result = await heygenService.sendMessageToAvatar({
        sessionId: parsed.data.sessionId,
        text: parsed.data.text,
        userId: parsed.data.userId,
        metadata: parsed.data.metadata,
      });

      const response: SendMessageResponse = {
        sessionId: result.sessionId,
        messageId: result.messageId,
        status: result.status,
        timestamp: result.timestamp,
      };

      res.status(200).json(response);
    } catch (error) {
      const errorResponse: HeygenErrorResponse = {
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to send message to avatar',
        code: 'MESSAGE_SEND_FAILED',
      };
      res.status(500).json(errorResponse);
    }
  })
);

// ============================================================================
// ENDPOINT 3: POST /api/heygen/session/end
// End an active avatar session
// ============================================================================

/**
 * End an active avatar session
 * Request: EndSessionRequest
 * Response: EndSessionResponse
 */
router.post(
  '/session/end',
  ...middleware,
  checkHeygenConfig,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const parsed = parseHeygenRequest(EndSessionSchema, req.body);

    if (!parsed.success) {
      const error = parsed as { success: false; status: number; errors: string[] };
      const errorResponse: HeygenErrorResponse = {
        status: 'error',
        message: 'Invalid request: ' + error.errors.join('; '),
        code: 'VALIDATION_ERROR',
      };
      res.status(error.status).json(errorResponse);
      return;
    }

    try {
      const result = await heygenService.endInteractiveAvatarSession(
        parsed.data.sessionId
      );

      const response: EndSessionResponse = {
        sessionId: result.sessionId,
        success: result.success,
        message: result.message,
      };

      res.status(200).json(response);
    } catch (error) {
      const errorResponse: HeygenErrorResponse = {
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to end avatar session',
        code: 'SESSION_END_FAILED',
      };
      res.status(500).json(errorResponse);
    }
  })
);

// ============================================================================
// ENDPOINT 4: GET /api/heygen/status
// Get HeyGen integration status
// ============================================================================

/**
 * Get HeyGen integration status
 */
router.get(
  '/status',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const status = heygenConfig.getStatus();
    res.status(200).json(status);
  })
);

export default router;
