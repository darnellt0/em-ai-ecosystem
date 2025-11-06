/**
 * Authentication Middleware
 * Protects routes by validating JWT tokens
 */

import { Request, Response, NextFunction } from 'express';
import AuthService from '../services/auth.service';

const authService = new AuthService();

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        name: string;
        email: string;
        created_at: string;
        is_active: boolean;
        last_login?: string;
      };
    }
  }
}

/**
 * Require authentication middleware
 * Validates JWT token and attaches user to request
 * Returns 401 if token is missing or invalid
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'No authorization header provided',
      });
      return;
    }

    if (!authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid authorization header format. Expected: Bearer <token>',
      });
      return;
    }

    const token = authHeader.substring(7);

    if (!token) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'No token provided',
      });
      return;
    }

    // Validate token
    const user = await authService.validateToken(token);

    if (!user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token',
      });
      return;
    }

    // Check if user is active
    if (!user.is_active) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Account is disabled',
      });
      return;
    }

    // Attach user to request
    req.user = user;

    // Continue to next middleware
    next();
  } catch (error: any) {
    console.error('[AUTH MIDDLEWARE] Error:', error.message);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication failed',
    });
  }
}

/**
 * Optional authentication middleware
 * Validates JWT token if present, but doesn't fail if missing
 * Attaches user to request if valid token provided
 */
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without user
      next();
      return;
    }

    const token = authHeader.substring(7);

    if (!token) {
      // Empty token, continue without user
      next();
      return;
    }

    // Validate token
    const user = await authService.validateToken(token);

    if (user && user.is_active) {
      // Valid token, attach user to request
      req.user = user;
    }

    // Continue regardless of token validity
    next();
  } catch (error: any) {
    console.error('[OPTIONAL AUTH MIDDLEWARE] Error:', error.message);
    // Don't fail, just continue without user
    next();
  }
}

/**
 * Extract user from request (for use after requireAuth middleware)
 */
export function getAuthUser(req: Request) {
  return req.user;
}

/**
 * Check if request is authenticated
 */
export function isAuthenticated(req: Request): boolean {
  return !!req.user;
}
