import { Pool, PoolClient } from 'pg';
import { databaseService } from './database.service';

export interface AgentRunLogInput {
  agentName: string;
  founderEmail: string;
  status: 'success' | 'error';
  metadata?: any;
  timestamp?: Date;
}

export class ActivityLogService {
  private logger = console;

  /**
   * Log an agent run to the activity_log table (creates table if missing).
   */
  async logAgentRun(input: AgentRunLogInput): Promise<{ success: boolean }> {
    const pool = databaseService.getPool();
    if (!pool) {
      this.logger.warn('[ActivityLog] Database not connected; skipping log.', input.agentName);
      return { success: false };
    }

    const client = await pool.connect();

    try {
      await this.ensureTable(client);
      await client.query(
        `INSERT INTO activity_log (agent_name, founder_email, status, metadata, created_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          input.agentName,
          input.founderEmail,
          input.status,
          JSON.stringify(input.metadata || {}),
          input.timestamp || new Date(),
        ]
      );
      return { success: true };
    } catch (error) {
      this.logger.error('[ActivityLog] Failed to log agent run:', error);
      return { success: false };
    } finally {
      client.release();
    }
  }

  private async ensureTable(client: PoolClient): Promise<void> {
    await client.query(`
      CREATE TABLE IF NOT EXISTS activity_log (
        id SERIAL PRIMARY KEY,
        agent_name TEXT NOT NULL,
        founder_email TEXT NOT NULL,
        status TEXT NOT NULL,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
  }
}

export const activityLogService = new ActivityLogService();
