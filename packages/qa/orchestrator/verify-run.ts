export interface VerifyRunPayload {
  flow: string;
  agentsRan: string[];
  registryUsed: boolean;
  runtimeStubUsed?: boolean;
  statusHints?: Record<string, boolean>;
  errors?: string[];
  debugFail?: boolean;
}

export interface VerifyRunResult {
  status: 'PASS' | 'DEGRADED' | 'FAIL';
  reasons?: string[];
}

export async function verifyRun(payload: VerifyRunPayload): Promise<VerifyRunResult> {
  const reasons: string[] = [];
  if (!payload.agentsRan || payload.agentsRan.length === 0) {
    reasons.push('No agents ran');
  }
  if (!payload.registryUsed) {
    reasons.push('Registry not used');
  }
  if (payload.runtimeStubUsed) {
    reasons.push('Stub runtime used');
  }
  if (payload.errors && payload.errors.length > 0) {
    reasons.push(...payload.errors);
  }
  if (payload.debugFail) {
    reasons.push('Debug fail requested');
  }

  const allMissing = payload.statusHints && Object.values(payload.statusHints).every((v) => !v);
  if (allMissing) {
    reasons.push('All outputs missing');
  }

  if (payload.debugFail || payload.runtimeStubUsed || !payload.registryUsed) {
    return { status: 'FAIL', reasons };
  }
  if (reasons.length > 0) {
    return { status: 'DEGRADED', reasons };
  }
  return { status: 'PASS' };
}
