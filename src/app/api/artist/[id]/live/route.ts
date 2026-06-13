import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { mockArtists, mockTracks } from '@/lib/mockData';

// Reference the global server-side active sessions registry
if (!(global as any).activeSessions) {
  (global as any).activeSessions = new Map<string, Map<string, number>>();
}
const activeSessions = (global as any).activeSessions as Map<string, Map<string, number>>;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check database status
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

    const allUsers = db.getUsers();
    const allDbTracks = db.getTracks();

    // ── 1. Followers: users who have this artist in followedArtists ────────────
    const followers = allUsers.filter(u =>
      u.followedArtists?.includes(id)
    ).length;

    // ── 2. Artist's approved track IDs ────────────────────────────────────────
    const artistDbTrackIds = new Set(
      allDbTracks
        .filter(t => t.artistId === id && t.status === 'approved')
        .map(t => t.id)
    );
    // Also include mock tracks for mock artists
    const artistMockTrackIds = new Set(
      mockTracks
        .filter(t => t.artistId === id)
        .map(t => t.id)
    );
    const allArtistTrackIds = new Set([...artistDbTrackIds, ...artistMockTrackIds]);

    // ── 3. Monthly listeners: unique users who have liked/saved this artist's tracks ──
    // Since we don't have a play-history table, we use:
    //   a) users who liked any of this artist's songs
    //   b) users who followed this artist
    //   c) extrapolate from track play counts (most realistic)
    const usersWhoLiked = new Set(
      allUsers
        .filter(u => u.likedSongs?.some(s => allArtistTrackIds.has(s)))
        .map(u => u.id)
    );
    const usersWhoFollow = new Set(
      allUsers
        .filter(u => u.followedArtists?.includes(id))
        .map(u => u.id)
    );
    const engagedUsers = new Set([...usersWhoLiked, ...usersWhoFollow]);

    // Total track plays across all artist's tracks
    const totalPlays = allDbTracks
      .filter(t => t.artistId === id)
      .reduce((sum, t) => sum + (t.plays || 0), 0);

    // Monthly listeners = engaged users + play-based estimate
    // A play of ~30 streams = roughly 1 unique listener per month (Spotify model)
    const playBasedListeners = Math.round(totalPlays / 30);

    // Get base from mock artist data if available
    const mockArtist = mockArtists.find(a => a.id === id);
    const mockMonthlyListeners = mockArtist?.monthlyListeners || 0;

    // For mock artists: use their existing monthlyListeners + real engaged users
    // For DB artists: sum of engaged users + play-based estimate
    let monthlyListeners: number;
    if (mockArtist) {
      // Add real engaged users on top of their base
      monthlyListeners = mockMonthlyListeners + engagedUsers.size;
    } else {
      // Pure DB artist: real data only
      monthlyListeners = Math.max(engagedUsers.size, playBasedListeners);
      // Add a realistic base offset so it's never 0 for new artists
      if (monthlyListeners < 100) {
        const dbArtist = db.getUserById(id);
        monthlyListeners = monthlyListeners + (dbArtist?.followers || 0) + totalPlays;
      }
    }

    // ── 4. Live "listening now" (actual active sessions in last 10 seconds) ────
    const artistMap = activeSessions.get(id);
    let listeningNow = 0;
    if (artistMap) {
      const cutoff = Date.now() - 10000;
      for (const [sessId, lastSeen] of artistMap.entries()) {
        if (lastSeen > cutoff) {
          listeningNow++;
        } else {
          artistMap.delete(sessId);
        }
      }
    }

    // ── 5. Track count ─────────────────────────────────────────────────────────
    const trackCount = allDbTracks.filter(t => t.artistId === id && t.status === 'approved').length
      + (mockArtist ? mockTracks.filter(t => t.artistId === id).length : 0);

    // ── 6. Total plays ─────────────────────────────────────────────────────────
    const allPlays = totalPlays + (mockArtist
      ? mockTracks.filter(t => t.artistId === id).reduce((s, t) => s + t.plays, 0)
      : 0);

    return NextResponse.json({
      success: true,
      stats: {
        followers,
        monthlyListeners,
        listeningNow,
        trackCount,
        totalPlays: allPlays,
        // Breakdown for transparency
        _debug: {
          usersWhoLiked: usersWhoLiked.size,
          usersWhoFollow: usersWhoFollow.size,
          playBasedListeners,
          mockBase: mockMonthlyListeners,
        },
      },
      updatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Live stats error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
