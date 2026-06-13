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
    const { artistId, action } = await request.json();

    if (!artistId || !action || !['deactivate', 'activate', 'remove'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid payload: artistId and valid action are required.' },
        { status: 400 }
      );
    }

    const artistUser = db.getUserById(artistId);
    if (!artistUser) {
      return NextResponse.json(
        { error: `Artist with ID ${artistId} not found in database.` },
        { status: 404 }
      );
    }

    const adminUser = rbacCheck.user;

    if (action === 'deactivate') {
      // 1. Deactivate the artist
      db.updateUser(artistId, { isActive: false });

      // 2. Delete all tracks uploaded by this artist
      const allTracks = db.getTracks();
      const artistTracks = allTracks.filter(t => t.artistId === artistId);
      artistTracks.forEach(t => {
        db.deleteTrack(t.id);
      });

      // 3. Log security event
      logSecurityEvent(
        adminUser?.token || 'unknown-token',
        `Admin (${adminUser?.role})`,
        'SUSPENSION',
        `Artist "${artistUser.name}" (${artistId}) deactivated. Deleted ${artistTracks.length} uploaded tracks.`
      );

      return NextResponse.json({
        success: true,
        message: `Artist deactivated and all ${artistTracks.length} songs deleted.`,
      });
    }

    if (action === 'activate') {
      // 1. Activate the artist
      db.updateUser(artistId, { isActive: true });

      // 2. Log security event
      logSecurityEvent(
        adminUser?.token || 'unknown-token',
        `Admin (${adminUser?.role})`,
        'ROLE_CHANGE',
        `Artist "${artistUser.name}" (${artistId}) reactivated.`
      );

      return NextResponse.json({
        success: true,
        message: `Artist reactivated.`,
      });
    }

    if (action === 'remove') {
      // 1. Delete all tracks uploaded by this artist first
      const allTracks = db.getTracks();
      const artistTracks = allTracks.filter(t => t.artistId === artistId);
      artistTracks.forEach(t => {
        db.deleteTrack(t.id);
      });

      // 2. Delete the artist user record completely
      db.deleteUser(artistId);

      // 3. Log security event
      logSecurityEvent(
        adminUser?.token || 'unknown-token',
        `Admin (${adminUser?.role})`,
        'ROLE_CHANGE',
        `Artist "${artistUser.name}" (${artistId}) deleted from the platform. Deleted ${artistTracks.length} uploaded tracks.`
      );

      return NextResponse.json({
        success: true,
        message: `Artist completely removed and all ${artistTracks.length} songs deleted.`,
      });
    }

    return NextResponse.json({ error: 'Unsupported action.' }, { status: 400 });
  } catch (err: any) {
    console.error('artist-action api error:', err);
    return NextResponse.json(
      { error: 'Server error processing artist action.' },
      { status: 500 }
    );
  }
}
