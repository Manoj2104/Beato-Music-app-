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
    const { artistId, title, genre, duration, audioUrl, coverImage, explicit } = await request.json();

    if (!artistId || !title || !genre) {
      return NextResponse.json(
        { error: 'artistId, title, and genre are required fields.' },
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
    const trackId = `track-uploaded-${Date.now()}`;

    // Add a new track to the database (approved status)
    const newTrack = {
      id: trackId,
      title,
      artistId,
      artistName: artistUser.name,
      albumId: 'single',
      albumName: 'Single',
      coverImage: coverImage || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c6b?w=300&h=300&fit=crop',
      duration: parseInt(duration) || 180,
      audioUrl: audioUrl || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      genre,
      year: new Date().getFullYear(),
      plays: 0,
      liked: false,
      explicit: explicit === true,
      trackNumber: 1,
      waveform: Array.from({ length: 60 }, () => Math.floor(Math.random() * 80 + 20)),
      uploadedBy: adminUser?.token || 'admin',
      uploadedAt: new Date().toISOString().split('T')[0],
      status: 'approved' as const,
    };

    db.addTrack(newTrack);

    logSecurityEvent(
      adminUser?.token || 'unknown-token',
      `Admin (${adminUser?.role})`,
      'UPLOAD',
      `Manually uploaded track "${title}" (${trackId}) for artist "${artistUser.name}" (${artistId}).`
    );

    return NextResponse.json({
      success: true,
      message: `Track "${title}" added successfully for artist "${artistUser.name}".`,
      track: newTrack,
    });
  } catch (err: any) {
    console.error('Add track API error:', err);
    return NextResponse.json(
      { error: 'Server error manually uploading track.' },
      { status: 500 }
    );
  }
}
