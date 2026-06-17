import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/rbac';
import { db } from '@/lib/db';
import { logSecurityEvent } from '@/lib/audit';

export async function POST(request: NextRequest) {
  const rbacCheck = await requireAdmin(request);
  if (!rbacCheck.authorized) {
    return NextResponse.json(
      { error: rbacCheck.message || 'Forbidden' },
      { status: rbacCheck.status || 403 }
    );
  }

  try {
    const { userId, artistName, appId, action = 'approve' } = await request.json();

    if (!appId) {
      return NextResponse.json(
        { error: 'Invalid payload: appId is required.' },
        { status: 400 }
      );
    }

    if (action === 'approve') {
      if (!userId) {
        return NextResponse.json(
          { error: 'Invalid payload: userId is required for approval.' },
          { status: 400 }
        );
      }
      // 1. Update user role to 'ARTIST' in the database
      const success = db.updateUserRole(userId, 'ARTIST');
      if (!success) {
        return NextResponse.json(
          { error: `User with ID ${userId} not found in database.` },
          { status: 404 }
        );
      }

      // 2. Update application status to APPROVED
      db.updateArtistApplicationStatus(appId, 'APPROVED');

      // 3. Log security audit event
      const adminUser = rbacCheck.user;
      logSecurityEvent(
        adminUser?.token || 'unknown-token',
        `Admin (${adminUser?.role})`,
        'APPROVAL',
        `Artist application for "${artistName || userId}" approved. User role set to ARTIST.`
      );

      return NextResponse.json({
        success: true,
        message: `User ${userId} upgraded to ARTIST role.`,
      });
    } else if (action === 'reject') {
      // 1. Update application status to REJECTED
      db.updateArtistApplicationStatus(appId, 'REJECTED');

      // 2. Log security audit event
      const adminUser = rbacCheck.user;
      logSecurityEvent(
        adminUser?.token || 'unknown-token',
        `Admin (${adminUser?.role})`,
        'REJECTION',
        `Artist application for "${artistName || userId || appId}" rejected.`
      );

      return NextResponse.json({
        success: true,
        message: `Application rejected.`,
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid action.' },
        { status: 400 }
      );
    }
  } catch (err) {
    console.error('approve-artist api error:', err);
    return NextResponse.json(
      { error: 'Server error updating user role.' },
      { status: 500 }
    );
  }
}
