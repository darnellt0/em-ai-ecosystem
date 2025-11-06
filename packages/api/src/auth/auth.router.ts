/**
 * Authentication Router
 * Handles user registration, login, logout, and token refresh
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import AuthService from '../services/auth.service';

const router = Router();
const authService = new AuthService();

// Rate limiting state (simple in-memory implementation)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

// Validation schemas
const signupSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  email: z.string().email('Invalid email format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[a-z]/, 'Password must contain a lowercase letter')
    .regex(/\d/, 'Password must contain a number'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * Rate limiting middleware
 * 5 requests per minute per IP for auth endpoints
 */
function rateLimiter(req: Request, res: Response, next: Function) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 5;

  // Clean up expired entries
  for (const [key, value] of rateLimitMap.entries()) {
    if (value.resetAt < now) {
      rateLimitMap.delete(key);
    }
  }

  // Check rate limit
  const rateLimit = rateLimitMap.get(ip);

  if (!rateLimit || rateLimit.resetAt < now) {
    // New window
    rateLimitMap.set(ip, {
      count: 1,
      resetAt: now + windowMs,
    });
    return next();
  }

  if (rateLimit.count >= maxRequests) {
    return res.status(429).json({
      error: 'Too Many Requests',
      message: 'Too many authentication attempts. Please try again later.',
      retryAfter: Math.ceil((rateLimit.resetAt - now) / 1000),
    });
  }

  // Increment count
  rateLimit.count++;
  next();
}

/**
 * POST /api/auth/signup
 * Register a new user
 */
router.post('/signup', rateLimiter, async (req: Request, res: Response) => {
  try {
    // Validate input
    const validationResult = signupSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation Error',
        message: validationResult.error.errors[0].message,
        details: validationResult.error.errors,
      });
    }

    const { name, email, password } = validationResult.data;

    // Create user
    const result = await authService.signup(name, email, password);

    // Log successful signup
    console.log(`[AUTH] New user registered: ${email}`);

    return res.status(201).json(result);
  } catch (error: any) {
    console.error('[AUTH] Signup error:', error.message);

    // Handle specific errors
    if (error.message.includes('already registered')) {
      return res.status(409).json({
        error: 'Conflict',
        message: error.message,
      });
    }

    if (
      error.message.includes('Password must') ||
      error.message.includes('Invalid email')
    ) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.message,
      });
    }

    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create user account',
    });
  }
});

/**
 * POST /api/auth/login
 * Authenticate user and return token
 */
router.post('/login', rateLimiter, async (req: Request, res: Response) => {
  try {
    // Validate input
    const validationResult = loginSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation Error',
        message: validationResult.error.errors[0].message,
        details: validationResult.error.errors,
      });
    }

    const { email, password } = validationResult.data;

    // Authenticate
    const result = await authService.login(email, password);

    // Log successful login
    console.log(`[AUTH] User logged in: ${email}`);

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('[AUTH] Login error:', error.message);

    // Always return same error for security (don't reveal if user exists)
    if (
      error.message.includes('Invalid credentials') ||
      error.message.includes('disabled')
    ) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password',
      });
    }

    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to authenticate',
    });
  }
});

/**
 * POST /api/auth/logout
 * Invalidate current token
 */
router.post('/logout', async (req: Request, res: Response) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No token provided',
      });
    }

    const token = authHeader.substring(7);

    // Invalidate token
    await authService.logout(token);

    console.log('[AUTH] User logged out');

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error: any) {
    console.error('[AUTH] Logout error:', error.message);

    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to logout',
    });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh authentication token
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No token provided',
      });
    }

    const token = authHeader.substring(7);

    // Refresh token
    const result = await authService.refreshToken(token);

    console.log('[AUTH] Token refreshed for user:', result.user.email);

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('[AUTH] Token refresh error:', error.message);

    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired token',
    });
  }
});

/**
 * GET /api/auth/me
 * Get current user information
 */
router.get('/me', async (req: Request, res: Response) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No token provided',
      });
    }

    const token = authHeader.substring(7);

    // Validate token and get user
    const user = await authService.validateToken(token);

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token',
      });
    }

    return res.status(200).json({ user });
  } catch (error: any) {
    console.error('[AUTH] Get user error:', error.message);

    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get user information',
    });
  }
});

export default router;
