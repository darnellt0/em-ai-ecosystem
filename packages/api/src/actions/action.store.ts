import { PlannedAction, ActionReceipt, ActionStatus } from '../../../shared/contracts';
import crypto from 'crypto';

const actions = new Map<string, PlannedAction>();

export function generateActionId() {
  return crypto.randomUUID();
}

export function resetActionsForTest() {
  actions.clear();
}

export function savePlannedAction(partial: Omit<PlannedAction, 'id' | 'status'> & { id?: string; status?: ActionStatus }): PlannedAction {
  const id = partial.id || generateActionId();
  const action: PlannedAction = {
    id,
    status: partial.status || 'PLANNED',
    requiresApproval: partial.requiresApproval,
    type: partial.type,
    payload: partial.payload || {},
    risk: partial.risk || 'medium',
    priority: partial.priority || 'medium',
    idempotencyKey: partial.idempotencyKey,
    notes: partial.notes,
  };
  actions.set(id, action);
  return action;
}

export function listPendingActions(): PlannedAction[] {
  return Array.from(actions.values()).filter((a) => a.status === 'PLANNED' || a.status === 'APPROVED');
}

export function getAction(id: string): PlannedAction | undefined {
  return actions.get(id);
}

export function approveAction(id: string, approvedBy: string, notes?: string): PlannedAction | undefined {
  const action = actions.get(id);
  if (!action) return undefined;
  action.status = 'APPROVED';
  action.notes = notes || `Approved by ${approvedBy}`;
  actions.set(id, action);
  return action;
}

export function recordReceipt(id: string, receipt: ActionReceipt) {
  const action = actions.get(id);
  if (!action) return;
  action.receipt = receipt;
  action.status = receipt.status;
  actions.set(id, action);
}

export function findByIdempotency(key?: string): PlannedAction | undefined {
  if (!key) return undefined;
  return Array.from(actions.values()).find((a) => a.idempotencyKey === key);
}
