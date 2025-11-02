import fs from 'fs';
import path from 'path';
import logger from './logger';

interface CostEntry {
  timestamp: string;
  service: string;
  agent?: string;
  costUSD: number;
  metadata?: Record<string, any>;
}

class CostTracker {
  private logPath: string;
  
  constructor() {
    const logsDir = path.join(process.cwd(), 'logs');
    this.logPath = path.join(logsDir, 'costs.jsonl');
    
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
  }
  
  logCall(service: string, costUSD: number, metadata?: Record<string, any>) {
    const entry: CostEntry = {
      timestamp: new Date().toISOString(),
      service,
      costUSD,
      metadata
    };
    
    fs.appendFileSync(this.logPath, JSON.stringify(entry) + '\n');
    const cost = costUSD.toFixed(4);
    logger.debug(`Cost logged: $service $cost`);
  }
  
  async getSummary(period: 'day' | 'week' | 'month' = 'day'): Promise<{
    total: number;
    byService: Record<string, number>;
  }> {
    const now = new Date();
    const cutoff = new Date();
    
    switch (period) {
      case 'day':
        cutoff.setDate(cutoff.getDate() - 1);
        break;
      case 'week':
        cutoff.setDate(cutoff.getDate() - 7);
        break;
      case 'month':
        cutoff.setMonth(cutoff.getMonth() - 1);
        break;
    }
    
    if (!fs.existsSync(this.logPath)) {
      return { total: 0, byService: {} };
    }
    
    const lines = fs.readFileSync(this.logPath, 'utf-8').split('\n').filter(Boolean);
    const entries: CostEntry[] = lines.map(line => JSON.parse(line));
    
    const filtered = entries.filter(e => new Date(e.timestamp) >= cutoff);
    
    const total = filtered.reduce((sum, e) => sum + e.costUSD, 0);
    const byService: Record<string, number> = {};
    
    filtered.forEach(e => {
      byService[e.service] = (byService[e.service] || 0) + e.costUSD;
    });
    
    return { total, byService };
  }
  
  estimateOpenAITokens(tokens: number, model: string = 'gpt-4o-mini'): number {
    const pricing: Record<string, { input: number; output: number }> = {
      'gpt-4o-mini': { input: 0.15 / 1_000_000, output: 0.60 / 1_000_000 },
      'gpt-4o': { input: 2.50 / 1_000_000, output: 10.00 / 1_000_000 }
    };
    
    const rates = pricing[model] || pricing['gpt-4o-mini'];
    return (tokens / 2 * rates.input) + (tokens / 2 * rates.output);
  }
}

export const costTracker = new CostTracker();
export default costTracker;
