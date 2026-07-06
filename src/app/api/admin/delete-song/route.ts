import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/rbac';
import { logSecurityEvent } from '@/lib/audit';
import { db } from '@/lib/db';

export async function DELETE(request: NextRequest) {
  // Guard the endpoint: require ADMIN role
  const rbacCheck = await requireAdmin(request);
  if (!rbacCheck.authorized) {
    return NextResponse.json(
      { error: rbacCheck.message || 'Forbidden' },
      { status: rbacCheck.status || 403 }
    );
  }

  try {
    const { songId, title } = await request.json();

    if (!songId) {
      return NextResponse.json(
        { error: 'Invalid payload: songId is required.' },
        { status: 400 }
      );
    }

    const adminUser = rbacCheck.user;
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Log the security event
    logSecurityEvent(
      adminUser.token,
      `Admin (${adminUser.role})`,
      'DELETION',
      `Track "${title || songId}" (${songId}) permanently deleted by admin`
    );

    // Delete from the database
    const deleted = db.deleteTrack(songId);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Track not found or could not be deleted.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Track ${songId} was permanently deleted.`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Invalid JSON body or server error' },
      { status: 500 }
    );
  }
}
