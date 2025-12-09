import { randomUUID } from 'crypto';

export interface TraceContext {
  traceId: string;
  source: string;
  meta?: Record<string, any>;
}

export function createTraceContext(source: string, meta?: Record<string, any>): TraceContext {
  return {
    traceId: randomUUID(),
    source,
    meta,
  };
}
