import logger from './logger';

export async function withFallback<T>(
  primary: () => Promise<T>,
  fallback: () => Promise<T>,
  serviceName: string = 'unknown'
): Promise<T> {
  try {
    return await primary();
  } catch (error) {
    logger.warn(`Primary service ${serviceName} failed, using fallback`, { error });
    return await fallback();
  }
}

export class CircuitBreaker {
  private failures = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private resetTimeout?: NodeJS.Timeout;
  private readonly threshold = 3;
  private readonly resetTime = 60000;
  
  async execute<T>(fn: () => Promise<T>, fallback: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      logger.warn('Circuit breaker is open, using fallback');
      return fallback();
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      if (this.state === 'open') {
        logger.warn('Circuit breaker opened, using fallback');
        return fallback();
      }
      throw error;
    }
  }
  
  private onSuccess() {
    this.failures = 0;
    this.state = 'closed';
    if (this.resetTimeout) {
      clearTimeout(this.resetTimeout);
      this.resetTimeout = undefined;
    }
  }
  
  private onFailure() {
    this.failures++;
    logger.warn(`Circuit breaker failure count: ${this.failures}/3`);
    
    if (this.failures >= this.threshold) {
      this.state = 'open';
      logger.error('Circuit breaker opened due to repeated failures');
      
      this.resetTimeout = setTimeout(() => {
        this.state = 'half-open';
        this.failures = 0;
        logger.info('Circuit breaker entering half-open state');
      }, this.resetTime);
    }
  }
}
