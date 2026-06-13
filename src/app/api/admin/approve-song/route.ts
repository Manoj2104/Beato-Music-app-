import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/rbac';
import { logSecurityEvent } from '@/lib/audit';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  // Guard the endpoint: require ADMIN role
  const rbacCheck = await requireAdmin(request);
  if (!rbacCheck.authorized) {
    return NextResponse.json(
      { error: rbacCheck.message || 'Forbidden' },
      { status: rbacCheck.status || 403 }
    );
  }

  try {
    const { songId, title, action } = await request.json();

    if (!songId || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid payload: songId, title, and action ("approve"|"reject") are required.' },
        { status: 400 }
      );
    }

    // Log the security event
    const adminUser = rbacCheck.user;
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const auditAction = action === 'approve' ? 'APPROVAL' : 'REJECTION';
    logSecurityEvent(
      adminUser.token, // Use token or role as identifier
      `Admin (${adminUser.role})`,
      auditAction,
      `Track "${title}" (${songId}) status set to ${action}d`
    );

    // Save status to server-side JSON database
    db.updateTrackStatus(songId, action === 'approve' ? 'approved' : 'rejected');

    return NextResponse.json({
      success: true,
      message: `Track ${songId} was successfully ${action}d.`,
      auditAction,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Invalid JSON body or server error' },
      { status: 500 }
    );
  }
}
