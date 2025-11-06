/**
 * Authentication Service
 * Handles user authentication, password hashing, and JWT token management
 */

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';

// Types
export interface User {
  id: string;
  name: string;
  email: string;
  created_at: string;
  last_login?: string;
  is_active: boolean;
}

export interface AuthResult {
  user: User;
  token: string;
  expires_at: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

// Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '7d';
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '10', 10);

// Password validation regex
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

class AuthService {
  private db: Pool;

  constructor(database?: Pool) {
    // Use provided database or create new connection
    this.db = database || new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }

  /**
   * Register a new user
   */
  async signup(name: string, email: string, password: string): Promise<AuthResult> {
    // Validate inputs
    if (!name || name.trim().length === 0) {
      throw new Error('Name is required');
    }

    if (!EMAIL_REGEX.test(email)) {
      throw new Error('Invalid email format');
    }

    if (!PASSWORD_REGEX.test(password)) {
      throw new Error(
        'Password must be at least 8 characters and contain uppercase, lowercase, and number'
      );
    }

    // Check if user already exists
    const existingUser = await this.db.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      throw new Error('Email already registered');
    }

    // Hash password
    const passwordHash = await this.hashPassword(password);

    // Create user
    const result = await this.db.query(
      `INSERT INTO users (name, email, password_hash, created_at, is_active)
       VALUES ($1, $2, $3, NOW(), true)
       RETURNING id, name, email, created_at, is_active`,
      [name.trim(), email.toLowerCase(), passwordHash]
    );

    const user = result.rows[0];

    // Generate token
    const token = this.generateToken(user.id, user.email);
    const expiresAt = this.getTokenExpiration();

    // Store session
    await this.createSession(user.id, token, expiresAt);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        created_at: user.created_at,
        is_active: user.is_active,
      },
      token,
      expires_at: expiresAt,
    };
  }

  /**
   * Authenticate user
   */
  async login(email: string, password: string): Promise<AuthResult> {
    // Validate inputs
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    // Find user
    const result = await this.db.query(
      `SELECT id, name, email, password_hash, is_active, created_at
       FROM users
       WHERE email = $1`,
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      throw new Error('Invalid credentials');
    }

    const user = result.rows[0];

    // Check if account is active
    if (!user.is_active) {
      throw new Error('Account is disabled');
    }

    // Verify password
    const isValidPassword = await this.verifyPassword(password, user.password_hash);

    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Update last login
    await this.db.query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [user.id]
    );

    // Generate token
    const token = this.generateToken(user.id, user.email);
    const expiresAt = this.getTokenExpiration();

    // Store session
    await this.createSession(user.id, token, expiresAt);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        created_at: user.created_at,
        is_active: user.is_active,
        last_login: new Date().toISOString(),
      },
      token,
      expires_at: expiresAt,
    };
  }

  /**
   * Logout user - invalidate token
   */
  async logout(token: string): Promise<void> {
    await this.db.query('DELETE FROM sessions WHERE token = $1', [token]);
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(oldToken: string): Promise<AuthResult> {
    // Validate old token
    const user = await this.validateToken(oldToken);

    if (!user) {
      throw new Error('Invalid or expired token');
    }

    // Delete old session
    await this.logout(oldToken);

    // Generate new token
    const newToken = this.generateToken(user.id, user.email);
    const expiresAt = this.getTokenExpiration();

    // Store new session
    await this.createSession(user.id, newToken, expiresAt);

    // Get fresh user data
    const result = await this.db.query(
      'SELECT id, name, email, created_at, is_active, last_login FROM users WHERE id = $1',
      [user.id]
    );

    const userData = result.rows[0];

    return {
      user: userData,
      token: newToken,
      expires_at: expiresAt,
    };
  }

  /**
   * Validate JWT token and return user
   */
  async validateToken(token: string): Promise<User | null> {
    try {
      // Verify JWT
      const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;

      // Check if session exists
      const sessionResult = await this.db.query(
        'SELECT user_id, expires_at FROM sessions WHERE token = $1',
        [token]
      );

      if (sessionResult.rows.length === 0) {
        return null;
      }

      const session = sessionResult.rows[0];

      // Check if session expired
      if (new Date(session.expires_at) < new Date()) {
        await this.logout(token);
        return null;
      }

      // Update last used timestamp
      await this.db.query(
        'UPDATE sessions SET last_used = NOW() WHERE token = $1',
        [token]
      );

      // Get user data
      const userResult = await this.db.query(
        'SELECT id, name, email, created_at, is_active, last_login FROM users WHERE id = $1',
        [decoded.userId]
      );

      if (userResult.rows.length === 0) {
        return null;
      }

      return userResult.rows[0];
    } catch (error) {
      console.error('Token validation error:', error);
      return null;
    }
  }

  /**
   * Hash password using bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_ROUNDS);
  }

  /**
   * Verify password against hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate JWT token
   */
  private generateToken(userId: string, email: string): string {
    const payload = {
      userId,
      email,
    };
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRATION,
    } as any);
  }

  /**
   * Get token expiration timestamp
   */
  private getTokenExpiration(): string {
    const expirationMs = this.parseJwtExpiration(JWT_EXPIRATION);
    return new Date(Date.now() + expirationMs).toISOString();
  }

  /**
   * Parse JWT expiration string to milliseconds
   */
  private parseJwtExpiration(exp: string): number {
    const match = exp.match(/^(\d+)([smhd])$/);
    if (!match) return 7 * 24 * 60 * 60 * 1000; // Default 7 days

    const value = parseInt(match[1], 10);
    const unit = match[2];

    const multipliers: { [key: string]: number } = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return value * (multipliers[unit] || multipliers.d);
  }

  /**
   * Create session in database
   */
  private async createSession(
    userId: string,
    token: string,
    expiresAt: string
  ): Promise<void> {
    await this.db.query(
      `INSERT INTO sessions (user_id, token, expires_at, created_at, last_used)
       VALUES ($1, $2, $3, NOW(), NOW())`,
      [userId, token, expiresAt]
    );
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<number> {
    const result = await this.db.query(
      'DELETE FROM sessions WHERE expires_at < NOW()'
    );
    return result.rowCount || 0;
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    await this.db.end();
  }
}

export default AuthService;
