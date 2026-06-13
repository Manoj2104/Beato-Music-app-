import { NextRequest, NextResponse } from 'next/server';
import { mockTracks, mockArtists, mockAlbums, mockPlaylists } from '@/lib/mockData';
import { search } from '@/lib/search';

const ALL_DATA = {
  tracks: mockTracks,
  artists: mockArtists,
  albums: mockAlbums,
  playlists: mockPlaylists,
};

/**
 * GET /api/search?q=<query>&type=all|tracks|artists|albums|playlists
 *
 * Returns a SearchResult JSON with ranked results across all entity types.
 * The `type` parameter filters the returned sections (default: all).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const q = searchParams.get('q') ?? '';
  const type = searchParams.get('type') ?? 'all';

  if (!q.trim()) {
    return NextResponse.json(
      { error: 'Missing query parameter `q`' },
      { status: 400 }
    );
  }

  // Run the TF-IDF search engine
  const result = search(q, ALL_DATA);

  // Filter by type
  const filtered = (() => {
    switch (type) {
      case 'tracks':
        return { ...result, artists: [], albums: [], playlists: [], genres: [], topResult: null };
      case 'artists':
        return { ...result, tracks: [], albums: [], playlists: [], genres: [], topResult: null };
      case 'albums':
        return { ...result, tracks: [], artists: [], playlists: [], genres: [], topResult: null };
      case 'playlists':
        return { ...result, tracks: [], artists: [], albums: [], genres: [], topResult: null };
      default:
        return result;
    }
  })();

  // Add metadata
  const response = {
    ...filtered,
    type,
    totalResults:
      filtered.tracks.length +
      filtered.artists.length +
      filtered.albums.length +
      filtered.playlists.length,
    // Limit to reasonable page sizes
    tracks: filtered.tracks.slice(0, 50),
    artists: filtered.artists.slice(0, 20),
    albums: filtered.albums.slice(0, 20),
    playlists: filtered.playlists.slice(0, 20),
  };

  return NextResponse.json(response, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
    },
  });
}
