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
    const dbTracks = db.getTracks();
    const users = db.getUsers();

    // Map tracks to ContentItems
    const items = dbTracks.map(t => {
      return {
        id: t.id,
        title: t.title,
        artist: t.artistName || 'Unknown Artist',
        type: 'Track',
        genre: t.genre || 'Pop',
        duration: typeof t.duration === 'number' 
          ? `${Math.floor(t.duration / 60)}:${String(t.duration % 60).padStart(2, '0')}`
          : t.duration || '3:30',
        plays: t.plays || 0,
        status: t.status === 'approved' ? 'Approved' : t.status === 'rejected' ? 'Rejected' : 'Pending',
        uploaded: t.uploadedAt || '2026-05-01',
        featured: t.featured || false,
        color: t.coverImage || 'linear-gradient(135deg, #1db954, #191414)',
        explicit: t.explicit || false,
        isDbTrack: true,
        audioUrl: t.audioUrl || '',
        lyrics: t.lyrics || '',
        year: t.year || 2026,
        uploadedBy: t.uploadedBy || '',
      };
    });

    // Extract albums dynamically from actual tracks
    const albumNames = new Set(dbTracks.map(t => t.albumName).filter(Boolean));
    const albums = Array.from(albumNames).map((albumName, index) => {
      const albumTracks = dbTracks.filter(t => t.albumName === albumName);
      const totalPlays = albumTracks.reduce((sum, t) => sum + (t.plays || 0), 0);
      const firstTrack = albumTracks[0];
      return {
        id: `album-${index}`,
        title: albumName,
        artist: firstTrack?.artistName || 'Unknown Artist',
        type: 'Album',
        genre: firstTrack?.genre || 'Pop',
        duration: `${albumTracks.length} tracks`,
        plays: totalPlays,
        status: 'Approved',
        uploaded: firstTrack?.uploadedAt || '2026-05-01',
        featured: false,
        color: firstTrack?.coverImage || 'linear-gradient(135deg, #10b981, #191414)',
        explicit: albumTracks.some(t => t.explicit),
        isDbTrack: false,
      };
    });

    // Calculate real playlists from database likes
    const playlists: any[] = [];
    const allLikedSongs = users.reduce((acc, u) => {
      if (u.likedSongs) u.likedSongs.forEach(s => acc.add(s));
      return acc;
    }, new Set<string>());
    
    if (allLikedSongs.size > 0) {
      playlists.push({
        id: 'playlist-liked',
        title: 'Liked Songs (Global)',
        artist: 'System',
        type: 'Playlist',
        genre: 'Various',
        duration: `${allLikedSongs.size} tracks`,
        plays: allLikedSongs.size,
        status: 'Approved',
        uploaded: new Date().toISOString().split('T')[0],
        featured: true,
        color: 'linear-gradient(135deg, #4338ca, #7c3aed)',
        explicit: false,
        isDbTrack: false
      });
    }

    return NextResponse.json({
      success: true,
      items: [...items, ...albums, ...playlists],
    });
  } catch (err: any) {
    console.error('Content Library GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 });
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
    const { action, id, title, genre, explicit, status, featured, plays, lyrics, year, artist } = body;

    if (!id || !action) {
      return NextResponse.json({ error: 'ID and action are required' }, { status: 400 });
    }

    const dbTracks = db.getTracks();
    let targetTrack = dbTracks.find(t => t.id === id);

    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const userId = rbacCheck.user?.userId || 'admin-user-1';
    const userName = rbacCheck.user?.name || 'Platform Moderator';

    if (action === 'edit') {
      if (!targetTrack) {
        return NextResponse.json({ error: 'Track not found' }, { status: 404 });
      }

      if (title !== undefined) targetTrack.title = title;
      if (genre !== undefined) targetTrack.genre = genre;
      if (explicit !== undefined) targetTrack.explicit = explicit;
      if (plays !== undefined) targetTrack.plays = Number(plays);
      if (lyrics !== undefined) targetTrack.lyrics = lyrics;
      if (year !== undefined) targetTrack.year = Number(year);
      if (artist !== undefined) {
        targetTrack.artistName = artist;
        targetTrack.uploadedBy = artist;
      }

      // Overwrite by delete and re-add:
      db.deleteTrack(id);
      db.addTrack(targetTrack);

      db.addGeneralAuditLog({
        id: `audit-${Date.now()}`,
        userId,
        userName,
        action: 'track_edited',
        target: targetTrack.title,
        ipAddress: ip,
        location: 'Internal',
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        result: 'success',
        category: 'Admin Actions',
        severity: 'low',
      });

      return NextResponse.json({
        success: true,
        message: `Track "${targetTrack.title}" metadata updated successfully.`,
        track: targetTrack,
      });
    }

    if (action === 'approve') {
      db.updateTrackStatus(id, 'approved');

      const targetTitle = targetTrack ? targetTrack.title : id;
      db.addGeneralAuditLog({
        id: `audit-${Date.now()}`,
        userId,
        userName,
        action: 'track_approved',
        target: targetTitle,
        ipAddress: ip,
        location: 'Internal',
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        result: 'success',
        category: 'Admin Actions',
        severity: 'low',
      });

      return NextResponse.json({
        success: true,
        message: 'Content approved successfully.',
      });
    }

    if (action === 'reject') {
      db.updateTrackStatus(id, 'rejected');

      const targetTitle = targetTrack ? targetTrack.title : id;
      db.addGeneralAuditLog({
        id: `audit-${Date.now()}`,
        userId,
        userName,
        action: 'track_rejected',
        target: targetTitle,
        ipAddress: ip,
        location: 'Internal',
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        result: 'success',
        category: 'Admin Actions',
        severity: 'low',
      });

      return NextResponse.json({
        success: true,
        message: 'Content rejected successfully.',
      });
    }

    if (action === 'feature') {
      if (!targetTrack) return NextResponse.json({ error: 'Track not found' }, { status: 404 });
      targetTrack.featured = featured !== undefined ? featured : !targetTrack.featured;
      db.deleteTrack(id);
      db.addTrack(targetTrack);

      db.addGeneralAuditLog({
        id: `audit-${Date.now()}`,
        userId,
        userName,
        action: 'track_featured',
        target: `${targetTrack.title} (${targetTrack.featured ? 'Featured' : 'Unfeatured'})`,
        ipAddress: ip,
        location: 'Internal',
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        result: 'success',
        category: 'Admin Actions',
        severity: 'low',
      });

      return NextResponse.json({
        success: true,
        message: `Featured status updated.`,
        featured: targetTrack.featured,
      });
    }

    if (action === 'delete') {
      const targetTitle = targetTrack ? targetTrack.title : id;
      db.deleteTrack(id);

      db.addGeneralAuditLog({
        id: `audit-${Date.now()}`,
        userId,
        userName,
        action: 'track_deleted',
        target: targetTitle,
        ipAddress: ip,
        location: 'Internal',
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        result: 'success',
        category: 'Admin Actions',
        severity: 'low',
      });

      return NextResponse.json({
        success: true,
        message: 'Content deleted successfully.',
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    console.error('Content Library POST error:', err);
    return NextResponse.json({ error: 'Failed to manage content' }, { status: 500 });
  }
}
