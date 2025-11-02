import { FounderId } from './founders';

export type AgentMode = 'suggest' | 'draft' | 'execute';

export interface AgentConfig {
  name: string;
  enabled: boolean;
  schedule?: string;
  permissions: string[];
  mode: AgentMode;
  fallbackBehavior: 'skip' | 'alert' | 'retry';
}

export interface SystemHealth {
  timestamp: Date;
  agents: Record<string, AgentStatus>;
  services: Record<string, ServiceStatus>;
  costs: CostSummary;
  errors: ErrorLog[];
}

export interface AgentStatus {
  name: string;
  status: 'running' | 'idle' | 'error' | 'disabled';
  lastRun?: Date;
  nextRun?: Date;
  successRate: number;
  avgExecutionTime: number;
}

export interface ServiceStatus {
  name: string;
  available: boolean;
  latency?: number;
  lastCheck: Date;
  errorCount: number;
}

export interface CostSummary {
  period: 'day' | 'week' | 'month';
  total: number;
  byService: Record<string, number>;
  budget: number;
  remaining: number;
}

export interface ErrorLog {
  timestamp: Date;
  agent: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  stack?: string;
  resolved: boolean;
  affectsFounder?: FounderId | 'both';
}

export interface FeedbackEntry {
  timestamp: Date;
  founderId: FounderId;
  agent: string;
  itemType: 'brief' | 'email-draft' | 'suggestion' | 'insight';
  itemId: string;
  action: 'accepted' | 'edited' | 'rejected';
  changes?: string;
  rating?: number;
  notes?: string;
}

export interface ContentPiece {
  id: string;
  type: 'social' | 'blog' | 'email' | 'video-script' | 'audio';
  title: string;
  content: string;
  tone: string;
  platform?: string;
  status: 'draft' | 'review' | 'approved' | 'published';
  metadata: Record<string, any>;
}
