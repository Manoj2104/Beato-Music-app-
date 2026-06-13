import { NextRequest, NextResponse } from 'next/server';
import { mockTracks, mockArtists, mockAlbums, mockPlaylists } from '@/lib/mockData';
import { getSuggestions } from '@/lib/search';

const ALL_DATA = {
  tracks: mockTracks,
  artists: mockArtists,
  albums: mockAlbums,
  playlists: mockPlaylists,
};

/**
 * GET /api/search/suggestions?q=<partial-query>&limit=8
 *
 * Returns up to `limit` instant autocomplete suggestions for the given query fragment.
 * Intended for use with 100–200ms debounce on the client side.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const q = searchParams.get('q') ?? '';
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '8', 10), 20);

  if (!q.trim()) {
    return NextResponse.json({ suggestions: [] });
  }

  const suggestions = getSuggestions(q, ALL_DATA).slice(0, limit);

  return NextResponse.json(
    { query: q, suggestions },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    }
  );
}
