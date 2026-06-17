import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { mockArtists } from '@/lib/mockData';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify artist exists and is active in database
    const dbUser = db.getUserById(id);
    if (!dbUser) {
      return NextResponse.json(
        { error: 'Artist not found or has been deleted.' },
        { status: 404 }
      );
    }
    if (dbUser.isActive === false) {
      return NextResponse.json(
        { error: 'Artist account has been suspended or deactivated.' },
        { status: 403 }
      );
    }

    // Retrieve all users from database
    const allUsers = db.getUsers();

    // 1. Calculate dynamic followers count from DB (users who followed this artist)
    const dbFollowersCount = allUsers.filter(
      (u) => u.followedArtists && u.followedArtists.includes(id)
    ).length;

    // 2. Query artist data (merging mock metadata if it's a seeded mock artist)
    let artistData: any = null;

    if (dbUser.role === 'ARTIST') {
      const mockArtist = mockArtists.find((a) => a.id === id);
      const artistProfile = db.getArtistProfile(id);
      
      // Find all approved tracks for this artist from the DB
      const dbTracks = db.getTracks().filter(
        (t) => t.artistId === id && t.status === 'approved'
      );

      // Compute total listeners based on play counts
      const playSum = dbTracks.reduce((sum, t) => sum + (t.plays || 0), 0);

      artistData = {
        id: dbUser.id,
        name: dbUser.name,
        image: artistProfile?.avatar || dbUser.avatar || mockArtist?.image || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
        coverImage: artistProfile?.bannerImage || dbUser.coverImage || mockArtist?.coverImage || 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=1400&h=400&fit=crop',
        bio: artistProfile?.bio || mockArtist?.bio || dbUser.bio || `${dbUser.name} is a verified artist on Beato.`,
        followers: dbFollowersCount || dbUser.followers || mockArtist?.followers || 0,
        monthlyListeners: (mockArtist?.monthlyListeners || 0) + playSum + 120, // default offset
        verified: mockArtist?.verified ?? true,
        genres: mockArtist?.genres || Array.from(new Set(dbTracks.map((t) => t.genre))) || ['Indie'],
        albums: mockArtist?.albums || [],
        topTracks: Array.from(new Set([...(mockArtist?.topTracks || []), ...dbTracks.map((t) => t.id)])),
        socialLinks: artistProfile?.socialLinks || mockArtist?.socialLinks || {},
      };
    }

    if (!artistData) {
      return NextResponse.json(
        { error: 'Artist details not found' },
        { status: 404 }
      );
    }

    // Retrieve approved tracks for this artist (mock + DB)
    const artistDbTracks = db.getTracks().filter(
      (t) => t.artistId === id && t.status === 'approved'
    );

    return NextResponse.json({
      success: true,
      artist: artistData,
      dbTracks: artistDbTracks,
    });
  } catch (error: any) {
    console.error('Error fetching artist details:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
