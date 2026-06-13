import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const dbTracks = db.getTracks();
    
    // Find all active artists in the database (must exist and have isActive === true)
    const activeArtistIds = new Set(
      db.getUsers()
        .filter(u => u.role === 'ARTIST' && u.isActive === true)
        .map(u => u.id)
    );

    // Return database tracks only, filtered to active database artists.
    const combinedTracks = dbTracks;
    const seenIds = new Set<string>();
    const uniqueTracks: typeof combinedTracks = [];
    for (const track of combinedTracks) {
      if (!seenIds.has(track.id)) {
        seenIds.add(track.id);
        uniqueTracks.push(track);
      }
    }
    const activeTracks = uniqueTracks.filter(
      (t) => activeArtistIds.has(t.artistId)
    );
    
    return NextResponse.json({
      success: true,
      tracks: activeTracks,
      activeArtistIds: Array.from(activeArtistIds),
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: 'Failed to fetch tracks from database' },
      { status: 500 }
    );
  }
}
