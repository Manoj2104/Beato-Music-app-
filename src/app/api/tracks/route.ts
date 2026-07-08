import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dbSupabase } from '@/lib/dbSupabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Fetch tracks and users directly from Supabase (single source of truth)
    // so both localhost:3000 and Vercel always show identical live data.
    const [dbTracks, cloudUsers] = await Promise.all([
      db.getTracksFromSupabase(),
      process.env.DATABASE_MODE === 'supabase'
        ? dbSupabase.getUsers().catch(() => db.getUsers())
        : Promise.resolve(db.getUsers()),
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

    // Deduplicate by ID
    const seenIds = new Set<string>();
    const uniqueTracks: typeof dbTracks = [];
    for (const track of dbTracks) {
      if (!seenIds.has(track.id)) {
        seenIds.add(track.id);
        uniqueTracks.push(track);
      }
    }

    // Show tracks whose artist is active in Supabase.
    // Fallback: if no artists found, show all approved tracks.
    const activeTracks = activeArtistIds.size > 0
      ? uniqueTracks.filter(t => activeArtistIds.has(t.artistId))
      : uniqueTracks.filter(t => t.status === 'approved');

    return NextResponse.json({
      success: true,
      tracks: activeTracks,
      activeArtistIds: Array.from(activeArtistIds),
    }, {
      // No caching — changes (add/delete) must be reflected immediately
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (e: any) {
    console.error('[api/tracks] Error:', e);
    return NextResponse.json(
      { error: 'Failed to fetch tracks from database' },
      { status: 500 }
    );
  }
}
