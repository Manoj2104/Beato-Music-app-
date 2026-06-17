import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/rbac';
import { db, AuditLogEntity } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const rbacCheck = await requireAdmin(request);
  if (!rbacCheck.authorized) {
    return NextResponse.json(
      { error: rbacCheck.message || 'Forbidden' },
      { status: rbacCheck.status || 403 }
    );
  }

  try {
    const logs = db.getGeneralAuditLogs();
    return NextResponse.json({
      success: true,
      logs,
    });
  } catch (err: any) {
    console.error('Audit GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const rbacCheck = await requireAdmin(request);
  if (!rbacCheck.authorized) {
    return NextResponse.json(
      { error: rbacCheck.message || 'Forbidden' },
      { status: rbacCheck.status || 403 }
    );
  }

  try {
    const body = await request.json();
    const { action, target, result, category, severity, ipAddress, location } = body;

    if (!action || !target) {
      return NextResponse.json({ error: 'Action and target are required' }, { status: 400 });
    }

    const userName = rbacCheck.user?.name || 'Platform Moderator';
    const userId = rbacCheck.user?.userId || 'admin-user-1';

    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const newLog: AuditLogEntity = {
      id: `audit-${Date.now()}`,
      userId,
      userName,
      action,
      target,
      ipAddress: ipAddress || '127.0.0.1',
      location: location || 'Internal',
      timestamp,
      result: result || 'success',
      category: category || 'Admin Actions',
      severity: severity || 'low',
    };

    db.addGeneralAuditLog(newLog);
    return NextResponse.json({
      success: true,
      log: newLog,
    });
  } catch (err: any) {
    console.error('Audit POST error:', err);
    return NextResponse.json({ error: 'Failed to write audit log' }, { status: 500 });
  }
}
