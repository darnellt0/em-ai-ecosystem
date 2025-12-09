/**
 * PostgreSQL Database Service - Phase 2B Integration
 * Handles all database operations for tasks and activities
 */

import { Pool, QueryResult, PoolClient } from 'pg';

interface TaskRecord {
  id: string;
  founder_email: string;
  title: string;
  description?: string;
  status: 'completed' | 'pending' | 'updated';
  created_at: Date;
  updated_at: Date;
  due_date?: Date;
  completed_at?: Date;
  completion_note?: string;
  next_task_id?: string;
}

interface ActivityRecord {
  id: number;
  founder_email: string;
  activity_type: string;
  duration_minutes: number;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

export class DatabaseService {
  private pool: Pool;
  private logger = console;
  private isConnected = false;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.pool.on('error', (err) => {
      this.logger.error('[Database Service] Unexpected error on idle client:', err);
    });

    this.testConnection();
  }

  /**
   * Test database connection
   */
  private async testConnection(): Promise<void> {
    try {
      const client = await this.pool.connect();
      const result = await client.query('SELECT 1');
      client.release();
      this.isConnected = true;
      this.logger.info('[Database Service] Connected to PostgreSQL successfully');
    } catch (error) {
      this.isConnected = false;
      this.logger.error('[Database Service] Connection test failed:', error);
    }
  }

  /**
   * Log task completion
   */
  async logTaskComplete(
    taskId: string,
    completionNote: string
  ): Promise<{ success: boolean; nextTask?: { title: string; dueDate: Date } }> {
    if (!this.isConnected) {
      this.logger.warn('[Database Service] Database not connected. Using mock response.');
      return {
        success: true,
        nextTask: {
          title: 'Next priority task',
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      };
    }

    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Update task as complete
      const updateResult = await client.query(
        `UPDATE tasks
         SET status = $1, completed_at = $2, completion_note = $3, updated_at = $4
         WHERE id = $5
         RETURNING id, founder_email`,
        ['completed', new Date(), completionNote, new Date(), taskId]
      );

      if (updateResult.rows.length === 0) {
        throw new Error(`Task ${taskId} not found`);
      }

      const founderEmail = updateResult.rows[0].founder_email;

      // Log to history
      await client.query(
        `INSERT INTO task_history (task_id, action, change_details)
         VALUES ($1, $2, $3)`,
        [taskId, 'completed', JSON.stringify({ note: completionNote, timestamp: new Date().toISOString() })]
      );

      // Get next task
      const nextTaskResult = await client.query(
        `SELECT id, title, due_date
         FROM tasks
         WHERE founder_email = $1 AND status = 'pending' AND id != $2
         ORDER BY due_date ASC NULLS LAST, created_at ASC
         LIMIT 1`,
        [founderEmail, taskId]
      );

      await client.query('COMMIT');

      const nextTask = nextTaskResult.rows[0];
      return {
        success: true,
        nextTask: nextTask
          ? {
            title: nextTask.title,
            dueDate: nextTask.due_date ? new Date(nextTask.due_date) : new Date(),
          }
          : undefined,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error('[Database Service] logTaskComplete error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Create follow-up task
   */
  async createFollowUp(
    founderEmail: string,
    subject: string,
    dueDate?: Date,
    context?: string
  ): Promise<{ taskId: string; success: boolean }> {
    if (!this.isConnected) {
      this.logger.warn('[Database Service] Database not connected. Using mock response.');
      return {
        taskId: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        success: true,
      };
    }

    const client = await this.pool.connect();

    try {
      const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date();

      // Insert task
      const result = await client.query(
        `INSERT INTO tasks (id, founder_email, title, description, status, due_date, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
        [taskId, founderEmail, subject, context, 'pending', dueDate, now, now]
      );

      // Log to history
      await client.query(
        `INSERT INTO task_history (task_id, action, change_details)
         VALUES ($1, $2, $3)`,
        [taskId, 'created', JSON.stringify({ context, dueDate: dueDate?.toISOString() })]
      );

      this.logger.info(`[Database Service] Follow-up task created: ${taskId}`);

      return { taskId, success: true };
    } catch (error) {
      this.logger.error('[Database Service] createFollowUp error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Record activity
   */
  async recordActivity(
    founderEmail: string,
    activity: string,
    durationMinutes: number,
    metadata?: Record<string, unknown>
  ): Promise<{ success: boolean; activityId: number }> {
    if (!this.isConnected) {
      this.logger.warn('[Database Service] Database not connected. Using mock response.');
      return {
        success: true,
        activityId: Math.floor(Math.random() * 1000000),
      };
    }

    const client = await this.pool.connect();

    try {
      const result = await client.query(
        `INSERT INTO activities (founder_email, activity_type, duration_minutes, metadata, timestamp)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [founderEmail, activity, durationMinutes, JSON.stringify(metadata || {}), new Date()]
      );

      const activityId = result.rows[0].id;

      this.logger.info(
        `[Database Service] Activity recorded: ${activity} for ${founderEmail} (ID: ${activityId})`
      );

      return {
        success: true,
        activityId,
      };
    } catch (error) {
      this.logger.error('[Database Service] recordActivity error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get task by ID
   */
  async getTask(taskId: string): Promise<TaskRecord | null> {
    if (!this.isConnected) {
      return null;
    }

    try {
      const result = await this.pool.query(
        `SELECT * FROM tasks WHERE id = $1`,
        [taskId]
      );

      return result.rows[0] || null;
    } catch (error) {
      this.logger.error('[Database Service] getTask error:', error);
      return null;
    }
  }

  /**
   * Get all pending tasks for a founder
   */
  async getPendingTasks(founderEmail: string): Promise<TaskRecord[]> {
    if (!this.isConnected) {
      return [];
    }

    try {
      const result = await this.pool.query(
        `SELECT * FROM tasks
         WHERE founder_email = $1 AND status = 'pending'
         ORDER BY due_date ASC NULLS LAST, created_at ASC`,
        [founderEmail]
      );

      return result.rows;
    } catch (error) {
      this.logger.error('[Database Service] getPendingTasks error:', error);
      return [];
    }
  }

  /**
   * Get activity statistics for a time range
   */
  async getActivityStats(
    founderEmail: string,
    startTime: Date,
    endTime: Date
  ): Promise<{ totalMinutes: number; byType: Record<string, number> }> {
    if (!this.isConnected) {
      return { totalMinutes: 0, byType: {} };
    }

    try {
      const result = await this.pool.query(
        `SELECT activity_type, SUM(duration_minutes) as total_minutes
         FROM activities
         WHERE founder_email = $1 AND timestamp BETWEEN $2 AND $3
         GROUP BY activity_type`,
        [founderEmail, startTime, endTime]
      );

      let totalMinutes = 0;
      const byType: Record<string, number> = {};

      for (const row of result.rows) {
        const minutes = parseInt(row.total_minutes, 10);
        totalMinutes += minutes;
        byType[row.activity_type] = minutes;
      }

      return { totalMinutes, byType };
    } catch (error) {
      this.logger.error('[Database Service] getActivityStats error:', error);
      return { totalMinutes: 0, byType: {} };
    }
  }

  /**
   * Check if tables exist and create them if needed
   */
  async ensureTablesExist(): Promise<void> {
    if (!this.isConnected) {
      this.logger.warn('[Database Service] Cannot ensure tables - database not connected');
      return;
    }

    const client = await this.pool.connect();

    try {
      // Create tasks table
      await client.query(`
        CREATE TABLE IF NOT EXISTS tasks (
          id VARCHAR(50) PRIMARY KEY,
          founder_email VARCHAR(255) NOT NULL,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          status VARCHAR(50) DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          due_date TIMESTAMP,
          completed_at TIMESTAMP,
          completion_note TEXT,
          next_task_id VARCHAR(50)
        )
      `);

      // Create task history table
      await client.query(`
        CREATE TABLE IF NOT EXISTS task_history (
          id SERIAL PRIMARY KEY,
          task_id VARCHAR(50) NOT NULL,
          action VARCHAR(50) NOT NULL,
          change_details JSONB,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create activities table
      await client.query(`
        CREATE TABLE IF NOT EXISTS activities (
          id SERIAL PRIMARY KEY,
          founder_email VARCHAR(255) NOT NULL,
          activity_type VARCHAR(50) NOT NULL,
          duration_minutes INT,
          metadata JSONB,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create indexes
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_tasks_founder_email ON tasks(founder_email)
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date)
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_task_history_task_id ON task_history(task_id)
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_activities_founder ON activities(founder_email)
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(activity_type)
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_activities_timestamp ON activities(timestamp)
      `);

      this.logger.info('[Database Service] Tables ensured to exist');
    } catch (error) {
      this.logger.error('[Database Service] ensureTablesExist error:', error);
    } finally {
      client.release();
    }
  }

  /**
   * Close the pool
   */
  async closePool(): Promise<void> {
    try {
      await this.pool.end();
      this.isConnected = false;
      this.logger.info('[Database Service] Pool closed');
    } catch (error) {
      this.logger.error('[Database Service] Error closing pool:', error);
    }
  }

  /**
   * Get service status
   */
  getStatus(): {
    connected: boolean;
    warning?: string;
  } {
    return {
      connected: this.isConnected,
      warning: !this.isConnected
        ? 'Database service not connected. Check DATABASE_URL environment variable.'
        : undefined,
    };
  }

  /**
   * Expose pool for shared services (read-only)
   */
  getPool(): Pool | null {
    return this.isConnected ? this.pool : null;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();
      return true;
    } catch (error) {
      this.logger.error('[Database Service] Health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const databaseService = new DatabaseService();
