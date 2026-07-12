import { NextResponse } from 'next/server';

// Server-side in-memory cache to make repeated lookups instant
const lyricsCache = new Map<string, any>();

const userAgent = 'BeatoMusicApp/1.0 (contact: support@beato.music)';

async function fetchFromLrclib(url: string): Promise<any | null> {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': userAgent } });
    if (!res.ok) return null;
    const data = await res.json();
    // Must have actual lyrics content
    if (data && (data.syncedLyrics || data.plainLyrics)) return data;
    return null;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title') || '';
  const artist = searchParams.get('artist') || '';

  if (!title) {
    return NextResponse.json({ error: 'Title parameter is required' }, { status: 400 });
  }

  const cacheKey = `${title.trim().toLowerCase()}||${artist.trim().toLowerCase()}`;

  // 1. Check memory cache first
  if (lyricsCache.has(cacheKey)) {
    console.log(`[Lyrics API] Cache HIT for: "${title}" by "${artist}"`);
    const cachedData = lyricsCache.get(cacheKey);
    if (cachedData.notFound) {
      return NextResponse.json({ error: 'Lyrics not found' }, { status: 404 });
    }
    return NextResponse.json(cachedData);
  }

  console.log(`[Lyrics API] Cache MISS. Fetching for: "${title}" by "${artist}"`);

  try {
    // Strategy 1: Exact match with title + artist
    const exactUrl = `https://lrclib.net/api/get?title=${encodeURIComponent(title)}&artist_name=${encodeURIComponent(artist)}`;
    // Strategy 2: Search by title only (broader match, works for Tamil songs with non-exact artist names)
    const searchByTitleUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(title)}`;
    // Strategy 3: Search by title + artist together
    const searchCombinedUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(title + ' ' + artist)}`;

    // Run all strategies concurrently
    const [exactResult, searchTitleResults, searchCombinedResults] = await Promise.all([
      fetchFromLrclib(exactUrl),
      (async () => {
        try {
          const res = await fetch(searchByTitleUrl, { headers: { 'User-Agent': userAgent } });
          if (!res.ok) return null;
          return await res.json();
        } catch { return null; }
      })(),
      (async () => {
        try {
          const res = await fetch(searchCombinedUrl, { headers: { 'User-Agent': userAgent } });
          if (!res.ok) return null;
          return await res.json();
        } catch { return null; }
      })(),
    ]);

    // 2. Use exact match if it has lyrics
    if (exactResult) {
      console.log(`[Lyrics API] Exact match found for: "${title}"`);
      lyricsCache.set(cacheKey, exactResult);
      return NextResponse.json(exactResult);
    }

    // 3. Pick best result from search (prefer synced lyrics, match title)
    const pickBest = (results: any[]): any | null => {
      if (!Array.isArray(results) || results.length === 0) return null;
      const withLyrics = results.filter(r => r.syncedLyrics || r.plainLyrics);
      if (withLyrics.length === 0) return null;
      // Prefer synced lyrics
      const withSynced = withLyrics.filter(r => r.syncedLyrics);
      // Title similarity scoring
      const titleLower = title.toLowerCase();
      const score = (item: any) => {
        const trackName = (item.trackName || '').toLowerCase();
        const artistName = (item.artistName || '').toLowerCase();
        let s = 0;
        if (trackName === titleLower) s += 10;
        else if (trackName.includes(titleLower) || titleLower.includes(trackName)) s += 5;
        if (artistName.includes(artist.toLowerCase())) s += 3;
        if (item.syncedLyrics) s += 2;
        return s;
      };
      const pool = withSynced.length > 0 ? withSynced : withLyrics;
      return pool.sort((a, b) => score(b) - score(a))[0] || null;
    };

    // Try title search first (broader)
    const titleBest = pickBest(searchTitleResults);
    if (titleBest) {
      console.log(`[Lyrics API] Title search match: "${title}" → "${titleBest.trackName}" by "${titleBest.artistName}"`);
      lyricsCache.set(cacheKey, titleBest);
      return NextResponse.json(titleBest);
    }

    // Try combined search
    const combinedBest = pickBest(searchCombinedResults);
    if (combinedBest) {
      console.log(`[Lyrics API] Combined search match: "${title}" → "${combinedBest.trackName}"`);
      lyricsCache.set(cacheKey, combinedBest);
      return NextResponse.json(combinedBest);
    }

    // Cache negative results to avoid hammering LRCLIB
    console.log(`[Lyrics API] No lyrics found for: "${title}" by "${artist}"`);
    lyricsCache.set(cacheKey, { notFound: true });
    return NextResponse.json({ error: 'Lyrics not found' }, { status: 404 });

  } catch (err: any) {
    console.error('[Lyrics API] Fetch error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
