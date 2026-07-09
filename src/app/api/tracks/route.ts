import { NextRequest, NextResponse } from 'next/server';
import { dbSupabase } from '@/lib/dbSupabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Always fetch directly from Supabase — no DATABASE_MODE check needed.
    // This ensures Vercel and localhost both show the same live data.
    const [cloudTracks, cloudUsers] = await Promise.all([
      dbSupabase.getTracks(),
      dbSupabase.getUsers().catch(() => [] as any[]),
    ]);

    const activeArtistIds = new Set(
      cloudUsers
        .filter((u: any) => {
          const role = ((u.role || '') as string).toUpperCase();
          const isActive = u.is_active ?? u.isActive ?? true;
          return role === 'ARTIST' && isActive === true;
        })
        .map((u: any) => u.id)
    );

    // Map Supabase snake_case fields to camelCase Track shape
    const mapped = cloudTracks.map((t: any) => ({
      id: t.id,
      title: t.title,
      artistId: t.artist_id,
      artistName: t.artist_name,
      albumId: t.album_id,
      albumName: t.album_name,
      coverImage: t.cover_image,
      duration: t.duration,
      audioUrl: t.audio_url,
      genre: t.genre,
      year: t.year,
      plays: t.plays || 0,
      liked: t.liked || false,
      explicit: t.explicit || false,
      trackNumber: t.track_number || 1,
      lyrics: t.lyrics || '',
      uploadedBy: t.uploaded_by,
      uploadedAt: t.uploaded_at,
      status: t.status || 'approved',
      featured: t.featured || false,
      youtubeVideoId: t.youtube_video_id || '',
      spotifyTrackId: t.spotify_track_id || '',
    }));

    // Deduplicate by ID
    const seenIds = new Set<string>();
    const uniqueTracks: typeof mapped = [];
    for (const track of mapped) {
      if (!seenIds.has(track.id)) {
        seenIds.add(track.id);
        uniqueTracks.push(track);
      }
    }

    // Always show all approved tracks
    const activeTracks = uniqueTracks.filter((t: any) => t.status === 'approved');

    return NextResponse.json({
      success: true,
      tracks: activeTracks,
      activeArtistIds: Array.from(activeArtistIds),
    }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (e: any) {
    console.error('[api/tracks] Error:', e);
    return NextResponse.json(
      { error: 'Failed to fetch tracks from database', detail: e?.message },
      { status: 500 }
    );
  }
}
