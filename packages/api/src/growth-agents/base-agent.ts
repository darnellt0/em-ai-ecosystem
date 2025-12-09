/**
 * BaseAgent - Foundation for Phase 6 Growth Agents
 * Provides progress tracking, event emission, retry logic, and structured logging
 */

import Redis from 'ioredis';

export interface AgentConfig {
  name: string;
  phase: 'Rooted' | 'Grounded' | 'Radiant';
  priority: number;
}

export interface AgentProgress {
  percent: number;
  note: string;
  timestamp: string;
}

export interface AgentEvent {
  kind: string;
  payload: Record<string, unknown>;
  timestamp: string;
}

export interface AgentResult {
  success: boolean;
  outputs: Record<string, unknown>;
  artifacts: string[];
  errors?: string[];
}

/**
 * BaseAgent - Abstract base class for all growth agents
 */
export abstract class BaseAgent {
  protected name: string;
  protected phase: string;
  protected redis: Redis;
  protected logger: {
    info: (...args: unknown[]) => void;
    warn: (...args: unknown[]) => void;
    error: (...args: unknown[]) => void;
  };

  constructor(config: AgentConfig) {
    this.name = config.name;
    this.phase = config.phase;
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    this.logger = this.createLogger();
  }

  /**
   * Create structured JSON logger
   */
  private createLogger() {
    const log = (level: string, ...args: unknown[]) => {
      const message = args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
      console.log(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level,
          agent: this.name,
          phase: this.phase,
          message,
        })
      );
    };

    return {
      info: (...args: unknown[]) => log('info', ...args),
      warn: (...args: unknown[]) => log('warn', ...args),
      error: (...args: unknown[]) => log('error', ...args),
    };
  }

  /**
   * Report progress to Redis stream
   */
  protected async reportProgress(percent: number, note: string): Promise<void> {
    const progress: AgentProgress = {
      percent,
      note,
      timestamp: new Date().toISOString(),
    };

    try {
      await this.redis.xadd(
        'agent:progress',
        '*',
        'agent',
        this.name,
        'phase',
        this.phase,
        'percent',
        String(percent),
        'note',
        note,
        'timestamp',
        progress.timestamp
      );
      this.logger.info(`Progress: ${percent}% - ${note}`);
    } catch (error) {
      this.logger.error('Failed to report progress:', error);
    }
  }

  /**
   * Emit event to Redis stream
   */
  protected async emitEvent(kind: string, payload: Record<string, unknown>): Promise<void> {
    const event: AgentEvent = {
      kind,
      payload,
      timestamp: new Date().toISOString(),
    };

    try {
      await this.redis.xadd(
        'agent:events',
        '*',
        'agent',
        this.name,
        'kind',
        kind,
        'payload',
        JSON.stringify(payload),
        'timestamp',
        event.timestamp
      );
      this.logger.info(`Event: ${kind}`, payload);
    } catch (error) {
      this.logger.error('Failed to emit event:', error);
    }
  }

  /**
   * Set agent readiness flag
   */
  protected async setReady(ready: boolean): Promise<void> {
    try {
      await this.redis.set(`agent:ready:${this.name}`, ready ? 'true' : 'false', 'EX', 3600); // 1 hour TTL
      this.logger.info(`Readiness set to: ${ready}`);
    } catch (error) {
      this.logger.error('Failed to set readiness:', error);
    }
  }

  /**
   * Retry decorator with exponential backoff
   */
  protected async retry<T>(
    fn: () => Promise<T>,
    maxAttempts: number = 5,
    baseDelayMs: number = 1000
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(`Attempt ${attempt}/${maxAttempts} failed:`, error);

        if (attempt < maxAttempts) {
          const delay = baseDelayMs * Math.pow(2, attempt - 1) + Math.random() * 1000; // Jitter
          this.logger.info(`Retrying in ${Math.round(delay)}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(`Max retry attempts (${maxAttempts}) exceeded: ${lastError?.message}`);
  }

  /**
   * Lifecycle hooks
   */
  async setup(): Promise<void> {
    this.logger.info('Setup started');
    await this.reportProgress(0, 'Initializing');
  }

  async teardown(): Promise<void> {
    this.logger.info('Teardown started');
    await this.redis.quit();
  }

  /**
   * Main execution method - must be implemented by subclasses
   */
  abstract run(): Promise<AgentResult>;

  /**
   * Validation method - must be implemented by subclasses
   */
  abstract validate(): Promise<boolean>;

  /**
   * Full execution flow with lifecycle
   */
  async execute(): Promise<AgentResult> {
    try {
      await this.setup();
      const result = await this.run();
      const isValid = await this.validate();

      if (isValid && result.success) {
        await this.setReady(true);
        await this.reportProgress(100, 'Completed successfully');
      } else {
        await this.setReady(false);
        await this.reportProgress(100, 'Completed with validation errors');
      }

      await this.teardown();
      return result;
    } catch (error) {
      this.logger.error('Execution failed:', error);
      await this.setReady(false);
      await this.reportProgress(100, `Failed: ${(error as Error).message}`);
      await this.teardown();

      return {
        success: false,
        outputs: {},
        artifacts: [],
        errors: [(error as Error).message],
      };
    }
  }
}
