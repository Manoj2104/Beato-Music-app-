import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/rbac';
import { logSecurityEvent } from '@/lib/audit';
import { dbSupabase } from '@/lib/dbSupabase';
import { db } from '@/lib/db';

export async function DELETE(request: NextRequest) {
  // Allow all authenticated users to delete their own uploads
  const rbacCheck = await requireUser(request);
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

    // Verify ownership if not an admin
    if (adminUser.role !== 'ADMIN' && adminUser.role !== 'SUPER_ADMIN') {
      const allTracks = await db.getTracksFromSupabase();
      const track = allTracks.find(t => t.id === songId);
      if (track && track.artistId !== adminUser.userId && track.uploadedBy !== adminUser.name) {
        return NextResponse.json({ error: 'Unauthorized to delete this item' }, { status: 403 });
      }
    }

    logSecurityEvent(
      adminUser.token,
      `User (${adminUser.role})`,
      'DELETION',
      `Track "${title || songId}" (${songId}) permanently deleted`
    );

    // ── Delete from Supabase (primary source of truth) ──────────────────────
    if (process.env.DATABASE_MODE === 'supabase') {
      try {
        await dbSupabase.deleteTrack(songId);
        console.log(`[delete-song] ✅ Deleted from Supabase: ${songId}`);
      } catch (err: any) {
        // If not found in Supabase, that's OK — still clean up local JSON
        if (!err.message?.includes('not found') && !err.code?.includes('PGRST116')) {
          console.error(`[delete-song] Supabase delete error for ${songId}:`, err.message);
        }
      }
      // Also remove from local JSON cache (best effort)
      db.deleteTrack(songId);
      // In supabase mode, always return success if we got this far
      return NextResponse.json({
        success: true,
        message: `Track ${songId} was permanently deleted.`,
      });
    }

    // ── Local JSON mode ──────────────────────────────────────────────────────
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
    console.error('[delete-song] Error:', err);
    return NextResponse.json(
      { error: 'Invalid JSON body or server error' },
      { status: 500 }
    );
  }
}
