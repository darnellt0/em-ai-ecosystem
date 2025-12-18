export interface AuditEntry {
  actionId: string;
  transition: string;
  message: string;
  timestamp: string;
  externalRef?: string;
}

const auditLog: AuditEntry[] = [];

export function recordAudit(entry: Omit<AuditEntry, 'timestamp'>) {
  auditLog.push({ ...entry, timestamp: new Date().toISOString() });
}

export function listAudit() {
  return auditLog.slice(-200);
}

export function resetAuditForTest() {
  auditLog.length = 0;
}
