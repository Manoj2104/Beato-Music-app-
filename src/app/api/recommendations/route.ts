import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { mockTracks, mockArtists, mockUser } from '@/lib/mockData';

export const dynamic = 'force-dynamic';
import {
  getDailyMixes,
  getDiscoverWeekly,
  getReleaseRadar,
  getMoodRecommendations,
  getTopCharts,
  getGenreRecommendations,
  getSimilarArtists
} from '@/lib/recommendations';

const DAILY_MIX_THEMES = [
  { label: 'Chill & Dreamy Mix', gradient: 'linear-gradient(135deg, #0f172a, #1e293b)', accent: '#38bdf8' },
  { label: 'Energetic Vibes Mix', gradient: 'linear-gradient(135deg, #7c2d12, #9a3412)', accent: '#f97316' },
  { label: 'Mellow Focus Mix', gradient: 'linear-gradient(135deg, #064e3b, #0f766e)', accent: '#2dd4bf' },
  { label: 'Pop & Dance Mix', gradient: 'linear-gradient(135deg, #701a75, #86198f)', accent: '#f472b6' },
  { label: 'Throwback Classics Mix', gradient: 'linear-gradient(135deg, #7c2d12, #854d0e)', accent: '#eab308' },
  { label: 'Electronic Cosmic Mix', gradient: 'linear-gradient(135deg, #1e1b4b, #311042)', accent: '#a855f7' }
];

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const userId = searchParams.get('userId') ?? mockUser.id;
  const type = searchParams.get('type') ?? 'daily';
  const mood = searchParams.get('mood') ?? 'happy';
  const genre = searchParams.get('genre') ?? 'Pop';
  const country = searchParams.get('country') ?? undefined;

  // Retrieve active artists and tracks from database
  const activeArtistIds = new Set(
    db.getUsers()
      .filter((u) => u.role === 'ARTIST' && u.isActive === true)
      .map((u) => u.id)
  );

  const dbTracks = db.getTracks();
  const combinedTracks = [...dbTracks, ...mockTracks];
  const seenIds = new Set<string>();
  const uniqueTracks: typeof combinedTracks = [];
  for (const track of combinedTracks) {
    if (!seenIds.has(track.id)) {
      seenIds.add(track.id);
      uniqueTracks.push(track);
    }
  }
  const allActiveTracks = uniqueTracks.filter(
    (t) => activeArtistIds.has(t.artistId)
  );

  // Retrieve user data from DB if logged in
  const dbUser = db.getUserById(userId);

  // Simulate user listening history, combining DB history if available
  const listeningHistory = [
    { genre: 'Indie Electronic', timestamp: Date.now() - 86400000 },
    { genre: 'Pop', timestamp: Date.now() - 172800000 },
    { genre: 'R&B', timestamp: Date.now() - 259200000 },
    { genre: 'Hip-Hop', timestamp: Date.now() - 345600000 },
    { genre: 'Indie Electronic', timestamp: Date.now() - 432000000 },
    { genre: 'Dream Pop', timestamp: Date.now() - 518400000 },
    { genre: 'Ambient', timestamp: Date.now() - 604800000 },
  ];

  // Build genre scores from history
  const genreScores: Record<string, number> = {};
  listeningHistory.forEach((item) => {
    genreScores[item.genre] = (genreScores[item.genre] ?? 0) + 1;
  });

  // Liked track IDs
  const likedTrackIds = dbUser ? dbUser.likedSongs || [] : mockUser.likedSongs;

  // Followed artist IDs
  const followedArtists = dbUser ? dbUser.followedArtists || [] : mockUser.followedArtists;

  let tracks: typeof mockTracks = [];
  let meta: Record<string, unknown> = {};

  switch (type) {
    case 'daily': {
      const mixIndex = parseInt(searchParams.get('mix') ?? '0', 10);
      const safeIdx = Math.max(0, Math.min(mixIndex, 3));
      const mixes = getDailyMixes(likedTrackIds, genreScores, allActiveTracks);
      const activeMix = mixes[safeIdx] ?? mixes[0];
      tracks = activeMix?.tracks ?? [];
      meta = {
        mixIndex: safeIdx,
        label: activeMix?.title ?? `Daily Mix ${safeIdx + 1}`,
        description: activeMix?.description ?? 'Personalized mix for you',
        gradient: activeMix?.gradient ?? DAILY_MIX_THEMES[safeIdx]?.gradient,
        accent: DAILY_MIX_THEMES[safeIdx]?.accent,
        allMixLabels: mixes.map((t) => t.title),
      };
      break;
    }

    case 'discover': {
      tracks = getDiscoverWeekly(likedTrackIds, [], allActiveTracks);
      meta = { description: 'Your weekly mixtape of fresh music, updated every Monday.' };
      break;
    }

    case 'radar': {
      tracks = getReleaseRadar(followedArtists, allActiveTracks);
      meta = {
        followedArtists,
        description: 'New music from artists you follow.',
      };
      break;
    }

    case 'mood': {
      tracks = getMoodRecommendations(mood, allActiveTracks);
      meta = { mood, description: `Tracks matched to your ${mood} mood.` };
      break;
    }

    case 'charts': {
      tracks = getTopCharts(allActiveTracks);
      meta = { country: country ?? 'global', description: 'The hottest tracks right now.' };
      break;
    }

    case 'genre': {
      tracks = getGenreRecommendations(genre, allActiveTracks);
      meta = { genre, description: `Top ${genre} tracks for you.` };
      break;
    }

    case 'similar-artists': {
      const artistId = searchParams.get('artistId') ?? '';
      // Filter out deleted/inactive artists from similar artists suggestions
      const artists = getSimilarArtists(artistId, mockArtists).filter(
        (a) => activeArtistIds.has(a.id)
      );
      return NextResponse.json(
        { type, artists, meta: { artistId } },
        { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } }
      );
    }

    default:
      return NextResponse.json(
        { error: `Unknown recommendation type: ${type}. Valid types: daily, discover, radar, mood, charts, genre, similar-artists` },
        { status: 400 }
      );
  }

  return NextResponse.json(
    {
      type,
      userId,
      trackCount: tracks.length,
      tracks: tracks.slice(0, 50), // cap at 50 per page
      meta,
    },
    {
      headers: {
        'Cache-Control': 'private, s-maxage=300, stale-while-revalidate=600',
      },
    }
  );
}
