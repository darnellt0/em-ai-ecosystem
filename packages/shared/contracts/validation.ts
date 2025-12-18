import { AgentOutput, ActionPack } from './index';

export function validateAgentOutput(obj: any): { valid: boolean; reasons?: string[] } {
  const reasons: string[] = [];
  if (!obj || typeof obj !== 'object') {
    reasons.push('Output not an object');
    return { valid: false, reasons };
  }
  if (!['OK', 'SKIPPED', 'FAILED'].includes(obj.status)) {
    reasons.push('Invalid status');
  }
  return { valid: reasons.length === 0, reasons };
}

export function validateActionPack(pack: any): { valid: boolean; reasons?: string[] } {
  const reasons: string[] = [];
  if (!pack || typeof pack !== 'object') {
    reasons.push('ActionPack not object');
  }
  return { valid: reasons.length === 0, reasons };
}
