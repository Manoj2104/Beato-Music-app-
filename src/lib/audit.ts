export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: 'LOGIN' | 'ROLE_CHANGE' | 'UPLOAD' | 'ADMIN_ACTION' | 'APPROVAL' | 'REJECTION' | 'SUSPENSION';
  details: string;
  timestamp: string;
  ipAddress?: string;
}

const MEMORY_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'audit-initial-1',
    userId: 'superadmin-user-1',
    userName: 'Root Administrator',
    action: 'LOGIN',
    details: 'User logged in from 192.168.1.10',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    ipAddress: '192.168.1.10'
  },
  {
    id: 'audit-initial-2',
    userId: 'admin-user-1',
    userName: 'Platform Moderator',
    action: 'APPROVAL',
    details: 'Approved track "Glass Ocean" (track-3)',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    ipAddress: '192.168.1.12'
  }
];

/**
 * Records a security or administrative action in the audit logs.
 */
export function logSecurityEvent(
  userId: string,
  userName: string,
  action: AuditLog['action'],
  details: string
): AuditLog {
  const log: AuditLog = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    userId,
    userName,
    action,
    details,
    timestamp: new Date().toISOString(),
    ipAddress: '127.0.0.1',
  };

  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('beato-audit-logs');
      const logs = stored ? JSON.parse(stored) : [];
      logs.unshift(log);
      localStorage.setItem('beato-audit-logs', JSON.stringify(logs.slice(0, 1000)));
    } catch (e) {
      console.error('Audit logging failed:', e);
    }
  }

  console.log(`[AUDIT LOG] [${log.action}] ${log.userName} (${log.userId}): ${log.details}`);
  MEMORY_AUDIT_LOGS.unshift(log);
  return log;
}

/**
 * Fetches all persistent and transient audit logs
 */
export function getAuditLogs(): AuditLog[] {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('beato-audit-logs');
      return stored ? JSON.parse(stored) : MEMORY_AUDIT_LOGS;
    } catch (e) {
      return MEMORY_AUDIT_LOGS;
    }
  }
  return MEMORY_AUDIT_LOGS;
}
