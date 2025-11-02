/**
 * Bearer token authentication middleware for ElevenLabs Voice API.
 * Verifies Authorization: Bearer <VOICE_API_TOKEN> header.
 */

import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  voiceAuthed: boolean;
}

/**
 * Middleware to verify bearer token from Authorization header.
 * Returns 401 if token missing or mismatched.
 * Returns 500 if VOICE_API_TOKEN env var not configured.
 */
export function authBearer(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const expectedToken = process.env.VOICE_API_TOKEN;

  if (!expectedToken) {
    res.status(500).json({
      status: 'error',
      humanSummary: 'Server misconfiguration: VOICE_API_TOKEN not set.',
      nextBestAction: 'Contact administrator.',
    });
    return;
  }

  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || token !== expectedToken) {
    res.status(401).json({
      status: 'error',
      humanSummary: 'Unauthorized: invalid or missing bearer token.',
      nextBestAction: 'Verify token and retry.',
    });
    return;
  }

  req.voiceAuthed = true;
  next();
}
