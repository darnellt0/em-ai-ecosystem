/**
 * User Service - Phase 3 (Agent 9)
 * Multi-user support, RBAC, and team management
 */

import { Pool } from 'pg';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'guest';
  organizationId?: string;
  preferences?: Record<string, any>;
  isActive: boolean;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: 'free' | 'premium' | 'enterprise';
  settings?: Record<string, any>;
}

export interface TeamMember {
  userId: string;
  organizationId: string;
  role: 'owner' | 'admin' | 'member';
  permissions: string[];
}

export class UserService {
  private pool: Pool;
  private logger = console;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const result = await this.pool.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        id: row.id,
        email: row.email,
        name: row.name,
        role: row.role,
        organizationId: row.organization_id,
        preferences: row.preferences,
        isActive: row.is_active,
      };
    } catch (error) {
      this.logger.error('[User Service] Get user error:', error);
      return null;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User | null> {
    try {
      const result = await this.pool.query(
        'SELECT * FROM users WHERE id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        id: row.id,
        email: row.email,
        name: row.name,
        role: row.role,
        organizationId: row.organization_id,
        preferences: row.preferences,
        isActive: row.is_active,
      };
    } catch (error) {
      this.logger.error('[User Service] Get user by ID error:', error);
      return null;
    }
  }

  /**
   * Get organization by ID
   */
  async getOrganization(organizationId: string): Promise<Organization | null> {
    try {
      const result = await this.pool.query(
        'SELECT * FROM organizations WHERE id = $1',
        [organizationId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        plan: row.plan,
        settings: row.settings,
      };
    } catch (error) {
      this.logger.error('[User Service] Get organization error:', error);
      return null;
    }
  }

  /**
   * Get team members for an organization
   */
  async getTeamMembers(organizationId: string): Promise<TeamMember[]> {
    try {
      const result = await this.pool.query(
        `SELECT tm.user_id, tm.organization_id, tm.role, tm.permissions
         FROM team_members tm
         WHERE tm.organization_id = $1`,
        [organizationId]
      );

      return result.rows.map((row) => ({
        userId: row.user_id,
        organizationId: row.organization_id,
        role: row.role,
        permissions: row.permissions,
      }));
    } catch (error) {
      this.logger.error('[User Service] Get team members error:', error);
      return [];
    }
  }

  /**
   * Check if user has permission
   */
  async hasPermission(
    userId: string,
    permission: string
  ): Promise<boolean> {
    try {
      const result = await this.pool.query(
        `SELECT tm.permissions, u.role
         FROM team_members tm
         JOIN users u ON u.id = tm.user_id
         WHERE tm.user_id = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        return false;
      }

      const row = result.rows[0];

      // Owners and admins have all permissions
      if (row.role === 'admin' || row.role === 'owner') {
        return true;
      }

      // Check if permission is in the user's permission array
      const permissions = row.permissions || [];
      return permissions.includes(permission) || permissions.includes('all');
    } catch (error) {
      this.logger.error('[User Service] Check permission error:', error);
      return false;
    }
  }

  /**
   * Create new user
   */
  async createUser(
    email: string,
    name: string,
    organizationId?: string
  ): Promise<User> {
    try {
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const result = await this.pool.query(
        `INSERT INTO users (id, email, name, organization_id, role)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [userId, email, name, organizationId, 'user']
      );

      const row = result.rows[0];
      return {
        id: row.id,
        email: row.email,
        name: row.name,
        role: row.role,
        organizationId: row.organization_id,
        isActive: row.is_active,
      };
    } catch (error) {
      this.logger.error('[User Service] Create user error:', error);
      throw error;
    }
  }

  /**
   * Create new organization
   */
  async createOrganization(name: string, slug: string): Promise<Organization> {
    try {
      const orgId = `org_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const result = await this.pool.query(
        `INSERT INTO organizations (id, name, slug, plan)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [orgId, name, slug, 'free']
      );

      const row = result.rows[0];
      return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        plan: row.plan,
        settings: row.settings,
      };
    } catch (error) {
      this.logger.error('[User Service] Create organization error:', error);
      throw error;
    }
  }

  /**
   * Add user to organization
   */
  async addTeamMember(
    organizationId: string,
    userId: string,
    role: 'owner' | 'admin' | 'member' = 'member'
  ): Promise<boolean> {
    try {
      await this.pool.query(
        `INSERT INTO team_members (organization_id, user_id, role)
         VALUES ($1, $2, $3)
         ON CONFLICT (organization_id, user_id) DO UPDATE SET role = $3`,
        [organizationId, userId, role]
      );

      return true;
    } catch (error) {
      this.logger.error('[User Service] Add team member error:', error);
      return false;
    }
  }
}

// Export singleton instance
export const userService = new UserService();
