import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/rbac';
import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execFileAsync = promisify(execFile);
const YTDLP_PATH = path.join(process.cwd(), 'yt-dlp.exe');

// ─── Spotify URL Parser ───────────────────────────────────────────────────────

function parseSpotifyUrl(url: string): { type: 'track' | 'playlist' | 'album'; id: string } | null {
  let parsed: URL;
  try { parsed = new URL(url); } catch { return null; }

  if (!['open.spotify.com', 'spotify.com'].includes(parsed.hostname)) return null;

  const parts = parsed.pathname.split('/').filter(Boolean);
  if (parts.length < 2) return null;

  const type = parts[0] as 'track' | 'playlist' | 'album';
  const id = parts[1].split('?')[0];

  if (!['track', 'playlist', 'album'].includes(type)) return null;
  if (!/^[a-zA-Z0-9]{22}$/.test(id)) return null;

  return { type, id };
}

// ─── Language Detection ───────────────────────────────────────────────────────

const KNOWN_LANGUAGES = [
  'tamil', 'hindi', 'telugu', 'malayalam', 'kannada',
  'bengali', 'marathi', 'punjabi', 'gujarati', 'odia',
  'english', 'spanish', 'french', 'korean', 'japanese',
];

function detectLanguage(title: string, album = ''): string {
  const combined = `${title} ${album}`.toLowerCase();
  for (const lang of KNOWN_LANGUAGES) { if (combined.includes(lang)) return lang; }
  return '';
}

// ─── Spotify Metadata Crawler Scraper (No Token Required) ─────────────────────

interface SpotifyTrackInfo {
  id: string;
  title: string;
  artist: string;
  album: string;
  coverImage: string;
  duration: number; // seconds
  explicit: boolean;
  releaseDate: string;
  spotifyUrl: string;
}

async function scrapeSpotifyTrack(trackId: string): Promise<SpotifyTrackInfo> {
  const url = `https://open.spotify.com/track/${trackId}`;

  // Try multiple user agents — Spotify returns richer meta to some bots
  const userAgents = [
    'Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)',
    'Twitterbot/1.0',
    'facebookexternalhit/1.1',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  ];

  let html = '';
  for (const ua of userAgents) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': ua },
        signal: AbortSignal.timeout(10000),
      });
      if (res.ok) {
        html = await res.text();
        if (html.length > 5000) break; // Got a real page
      }
    } catch { /* try next UA */ }
  }

  if (!html) throw new Error('Failed to fetch Spotify track page with all user agents');

  // ── Strategy 1: JSON-LD structured data (most reliable) ───────────────────
  let title = '';
  let artist = '';
  let album = '';
  let duration = 0;
  let coverImage = '';
  let releaseDate = new Date().getFullYear().toString();
  let explicit = false;

  try {
    const jsonLdMatch = html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/);
    if (jsonLdMatch) {
      const jsonLd = JSON.parse(jsonLdMatch[1]);
      // Spotify uses MusicRecording schema
      if (jsonLd['@type'] === 'MusicRecording' || jsonLd.name) {
        title = jsonLd.name || '';
        // Artist from byArtist
        if (jsonLd.byArtist) {
          const byArtist = Array.isArray(jsonLd.byArtist) ? jsonLd.byArtist : [jsonLd.byArtist];
          artist = byArtist.map((a: any) => a.name || '').filter(Boolean).join(', ');
        }
        // Album from inAlbum
        if (jsonLd.inAlbum) album = jsonLd.inAlbum.name || '';
        // Duration from ISO 8601 duration string like "PT3M45S"
        if (jsonLd.duration) {
          const dur = jsonLd.duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
          if (dur) {
            duration = (parseInt(dur[1] || '0') * 3600) +
                       (parseInt(dur[2] || '0') * 60) +
                       parseInt(dur[3] || '0');
          }
        }
        if (jsonLd.image) coverImage = Array.isArray(jsonLd.image) ? jsonLd.image[0] : jsonLd.image;
      }
    }
  } catch { /* JSON-LD parse failed */ }

  // ── Strategy 2: OG meta tags ──────────────────────────────────────────────
  if (!title) {
    title = html.match(/<meta property="og:title" content="([^"]+)"/)?.[1] || '';
  }
  if (!coverImage) {
    coverImage = html.match(/<meta property="og:image" content="([^"]+)"/)?.[1] || '';
  }

  // ── Strategy 3: Parse og:description for artist/album ────────────────────
  if (!artist) {
    const description = html.match(/<meta property="og:description" content="([^"]+)"/)?.[1] || '';
    console.log(`[spotify-extract] OG description: "${description}"`);

    if (description) {
      // Format 1: "Song · Artist · Album · Year"
      // Format 2: "Listen to Song on Spotify. Song · Artist · Year"
      const cleanDesc = description
        .replace(/^Listen to [^·]+ on Spotify\.\s*/i, '')
        .replace(/^Listen to .+?\. /i, '');
      const parts = cleanDesc.split(' · ').map(p => p.trim()).filter(Boolean);
      console.log(`[spotify-extract] Description parts:`, parts);

      if (parts[0]?.toLowerCase() === 'song') {
        // "Song · Artist · [Album ·] Year"
        artist = parts[1] || '';
        if (parts.length >= 4) {
          album = parts[2] || '';
          releaseDate = parts[3] || releaseDate;
        } else if (parts.length === 3) {
          releaseDate = parts[2] || releaseDate;
        }
      } else if (parts.length >= 2) {
        // Sometimes: "Artist · Year" directly
        artist = parts[0] || '';
        releaseDate = parts[parts.length - 1] || releaseDate;
      } else {
        artist = cleanDesc;
      }
    }
  }

  // ── Strategy 4: Extract from page's __NEXT_DATA__ / React state ──────────
  if (!artist || artist === 'Unknown Artist') {
    try {
      // Spotify often embeds full track data in a script tag
      const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([^<]+)<\/script>/);
      if (nextDataMatch) {
        const nextData = JSON.parse(nextDataMatch[1]);
        const trackData = nextData?.props?.pageProps?.state?.data?.entity ||
                          nextData?.props?.pageProps?.data?.entity;
        if (trackData) {
          if (!title && trackData.name) title = trackData.name;
          if (trackData.artists?.items?.length) {
            artist = trackData.artists.items.map((a: any) => a.profile?.name || a.name || '').filter(Boolean).join(', ');
          }
          if (!album && trackData.albumOfTrack?.name) album = trackData.albumOfTrack.name;
          if (!duration && trackData.duration?.totalMilliseconds) {
            duration = Math.round(trackData.duration.totalMilliseconds / 1000);
          }
        }
      }
    } catch { /* Next.js data parse failed */ }
  }

  // ── Strategy 5: Twitter meta tags as final fallback ───────────────────────
  if (!title) {
    title = html.match(/<meta name="twitter:title" content="([^"]+)"/)?.[1] ||
            html.match(/<title>([^<]+)<\/title>/)?.[1]?.replace(' | Spotify', '') ||
            'Unknown Track';
  }
  if (!artist) {
    const twitterDesc = html.match(/<meta name="twitter:description" content="([^"]+)"/)?.[1] || '';
    const parts = twitterDesc.split(' · ');
    if (parts.length >= 2) artist = parts[1]?.trim() || 'Unknown Artist';
    else artist = 'Unknown Artist';
  }

  // ── Detect language from title/album for accurate YouTube search ──────────
  const detectedLang = detectLanguage(title, album);
  console.log(`[spotify-extract] Scraped: title="${title}" artist="${artist}" album="${album}" duration=${duration}s lang=${detectedLang || 'unknown'}`);

  return {
    id: trackId,
    title: title || 'Unknown Track',
    artist: artist || 'Unknown Artist',
    album: album || 'Single',
    coverImage,
    duration: duration || 210, // Use 210s (3.5min) as fallback if parse fails
    explicit,
    releaseDate,
    spotifyUrl: url,
  };
}

async function scrapeSpotifyPlaylistOrAlbum(type: 'playlist' | 'album', id: string): Promise<{
  playlistTitle: string;
  coverImage: string;
  tracks: SpotifyTrackInfo[];
}> {
  const url = `https://open.spotify.com/${type}/${id}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)',
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    throw new Error(`Spotify ${type} page fetch failed with status ${res.status}`);
  }

  const html = await res.text();

  const playlistTitle = html.match(/<meta property="og:title" content="([^"]+)"/)?.[1] || `Spotify ${type}`;
  const coverImage = html.match(/<meta property="og:image" content="([^"]+)"/)?.[1] || '';

  // Extract track IDs from the page
  const matches = html.match(/\/track\/([a-zA-Z0-9]{22})/g) || [];
  const uniqueIds = Array.from(new Set(matches.map(m => m.split('/')[2])));

  if (!uniqueIds.length) {
    throw new Error(`No tracks found in this ${type}`);
  }

  // Scrape tracks in parallel batches to be extremely fast while avoiding rate limits
  const tracksToScrape = uniqueIds.slice(0, 100);
  const tracks: SpotifyTrackInfo[] = [];

  const concurrency = 10;
  for (let i = 0; i < tracksToScrape.length; i += concurrency) {
    const chunk = tracksToScrape.slice(i, i + concurrency);
    const chunkRes = await Promise.allSettled(chunk.map(id => scrapeSpotifyTrack(id)));
    for (const r of chunkRes) {
      if (r.status === 'fulfilled' && r.value) {
        tracks.push(r.value);
      }
    }
  }

  return {
    playlistTitle,
    coverImage,
    tracks,
  };
}

// ─── YouTube Search — Smart multi-strategy with language awareness ────────────
// (KNOWN_LANGUAGES and detectLanguage are declared above near the top of this file)

function buildSearchQueries(artist: string, title: string, album = ''): string[] {
  const lang = detectLanguage(title, album);
  const cleanTitle = title.replace(/\s*\(from\s+"[^"]+"\s*\w*\)\s*$/i, '').trim();
  const queries: string[] = [];
  if (lang) {
    queries.push(`${artist} ${cleanTitle || title} ${lang} official audio`);
    queries.push(`${cleanTitle || title} ${lang} ${artist}`);
    queries.push(`${artist} ${cleanTitle || title} ${lang}`);
  }
  queries.push(`"${title}" "${artist}" audio`);
  if (cleanTitle && cleanTitle !== title) queries.push(`${artist} ${cleanTitle} official audio`);
  queries.push(`${artist} ${title}`);
  queries.push(`${title} ${artist} lyrics`);
  return queries;
}

function scoreMatch(videoTitle: string, targetTitle: string, targetArtist: string, targetLang = ''): number {
  const vt = videoTitle.toLowerCase();
  const tt = targetTitle.toLowerCase();
  const ta = targetArtist.toLowerCase();
  let score = 0;
  const words = tt.split(/\s+/).filter(w => w.length > 2);
  score += (words.filter(w => vt.includes(w)).length / Math.max(words.length, 1)) * 50;
  const artistWords = ta.split(/\s+/).filter(w => w.length > 1);
  if (artistWords.some(w => vt.includes(w))) score += 20;
  if (targetLang) {
    if (vt.includes(targetLang)) score += 35;
    else {
      const wrongLang = KNOWN_LANGUAGES.find(l => l !== targetLang && vt.includes(l));
      if (wrongLang) score -= 50;
    }
  }
  if (/\b(cover|remix|karaoke|reaction|instrumental|tribute|parody)\b/i.test(vt)) score -= 30;
  if (/\b(official|audio|lyrics|hd|hq|full\s+song)\b/i.test(vt)) score += 10;
  return score;
}

async function findYouTubeVideoId(
  searchQuery: string,
  artist = '',
  title = '',
  album = '',
  expectedDurationSec = 0,
): Promise<string | null> {
  const lang = detectLanguage(title, album);
  // ── yt-dlp local binary (most accurate) ───────────────────────────────
  if (fs.existsSync(YTDLP_PATH)) {
    const allQueries = [searchQuery, ...buildSearchQueries(artist, title, album).filter(q => q !== searchQuery)];
    for (const q of allQueries) {
      try {
        const { stdout } = await execFileAsync(YTDLP_PATH, [
          '--dump-json', '--no-playlist', '--no-warnings', '--no-cache-dir',
          `ytsearch5:${q}`,
        ], { timeout: 30_000, maxBuffer: 8 * 1024 * 1024 });
        const lines = stdout.trim().split('\n').filter(Boolean);
        const results: { id: string; score: number }[] = [];
        for (const line of lines) {
          try {
            const info = JSON.parse(line);
            if (!info.id) continue;
            const dur = info.duration || 0;
            if (expectedDurationSec > 0 && Math.abs(dur - expectedDurationSec) > 45) continue;
            results.push({ id: info.id, score: scoreMatch(info.title || '', title || searchQuery, artist, lang) });
          } catch { /* bad JSON */ }
        }
        if (results.length > 0) {
          results.sort((a, b) => b.score - a.score);
          return results[0].id;
        }
      } catch { /* try next query */ }
    }
  }

  // ── HTML scraping fallback ────────────────────────────────────────────
  const queriesToTry = [searchQuery, ...buildSearchQueries(artist, title, album)].slice(0, 3);
  for (const q of queriesToTry) {
    try {
      const res = await fetch(
        `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
          },
          signal: AbortSignal.timeout(10000),
        },
      );
      if (!res.ok) continue;
      const html = await res.text();
      const videoIdRegex = /"videoId":"([^"]+)"/g;
      const titleRegex = /"title":{"runs":\[{"text":"([^"]+)"/g;
      const videoIds: string[] = [];
      let m: RegExpExecArray | null;
      while ((m = videoIdRegex.exec(html)) !== null) {
        if (!videoIds.includes(m[1])) videoIds.push(m[1]);
        if (videoIds.length >= 8) break;
      }
      if (videoIds.length === 0) continue;
      const titles: string[] = [];
      while ((m = titleRegex.exec(html)) !== null) {
        titles.push(m[1]);
        if (titles.length >= 8) break;
      }
      if (titles.length > 0 && (artist || title)) {
        const scored = videoIds.map((id, idx) => ({ id, score: scoreMatch(titles[idx] || '', title || searchQuery, artist, lang) }));
        scored.sort((a, b) => b.score - a.score);
        if (scored[0].score > -10) return scored[0].id;
      }
      return videoIds[0] || null;
    } catch { /* try next query */ }
  }
  return null;
}

// ─── MAIN ROUTE ────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const check = await requireAdmin(request);
  if (!check.authorized) {
    return NextResponse.json({ error: check.message || 'Forbidden' }, { status: check.status || 403 });
  }
  const user = check.user;
  if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'super_admin')) {
    return NextResponse.json({ error: 'Forbidden — Super Admin access only' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Spotify URL is required.' }, { status: 400 });
    }

    const parsed = parseSpotifyUrl(url);
    if (!parsed) {
      return NextResponse.json({
        error: 'Invalid Spotify URL. Please provide a valid link like https://open.spotify.com/track/...',
      }, { status: 400 });
    }

    // ── SINGLE TRACK ─────────────────────────────────────────────────────────
    if (parsed.type === 'track') {
      let trackInfo: SpotifyTrackInfo;
      try {
        trackInfo = await scrapeSpotifyTrack(parsed.id);
      } catch (err: any) {
        // Return 422 instead of 502 to prevent Vercel from returning its default HTML error page
        return NextResponse.json({ error: `Failed to fetch track: ${err.message}` }, { status: 422 });
      }

      const lang = detectLanguage(trackInfo.title, trackInfo.album);
      const searchQuery = `${trackInfo.artist} ${lang ? trackInfo.title.replace(/\s*\(from.*\)/i, '').trim() + ' ' + lang : trackInfo.title} official audio`;
      console.log(`[spotify-extract] 🔍 Metadata extracted: "${trackInfo.title}" by "${trackInfo.artist}" (YouTube ID will resolve during download)`);

      return NextResponse.json({
        success: true,
        type: 'track',
        track: {
          spotifyId: trackInfo.id,
          spotifyUrl: trackInfo.spotifyUrl,
          youtubeVideoId: null,
          title: trackInfo.title,
          songName: trackInfo.title,
          artist: trackInfo.artist,
          album: trackInfo.album,
          coverImage: trackInfo.coverImage,
          duration: trackInfo.duration,
          explicit: trackInfo.explicit,
          releaseDate: trackInfo.releaseDate,
          estimatedSizeMB: trackInfo.duration ? ((320 * trackInfo.duration) / 8 / 1024 / 1024).toFixed(1) : '?',
          audioCodec: 'MP3 320kbps 44.1kHz Stereo',
          youtubeSearchQuery: searchQuery,
        },
      });
    }

    // ── PLAYLIST or ALBUM ────────────────────────────────────────────────────
    if (parsed.type === 'playlist' || parsed.type === 'album') {
      let result: { playlistTitle: string; coverImage: string; tracks: SpotifyTrackInfo[] };
      try {
        result = await scrapeSpotifyPlaylistOrAlbum(parsed.type, parsed.id);
      } catch (err: any) {
        // Return 422 instead of 502 to prevent Vercel from returning its default HTML error page
        return NextResponse.json({
          error: `Failed to fetch ${parsed.type}: ${err.message}`,
        }, { status: 422 });
      }

      const tracksToProcess = result.tracks.slice(0, 100);
      const enrichedTracks = tracksToProcess.map((t) => {
        const searchQuery = `${t.artist} ${t.title} official audio`;
        return {
          spotifyId: t.id,
          spotifyUrl: t.spotifyUrl,
          youtubeVideoId: null,
          title: t.title,
          songName: t.title,
          artist: t.artist,
          album: t.album,
          coverImage: t.coverImage || result.coverImage,
          duration: t.duration,
          explicit: t.explicit,
          releaseDate: t.releaseDate,
          youtubeSearchQuery: searchQuery,
        };
      });

      return NextResponse.json({
        success: true,
        type: parsed.type,
        playlistTitle: result.playlistTitle,
        coverImage: result.coverImage,
        tracks: enrichedTracks,
      });
    }

    return NextResponse.json({ error: 'Unsupported Spotify URL type.' }, { status: 400 });
  } catch (err: any) {
    console.error('[spotify-extract] Server error:', err);
    return NextResponse.json({ error: `Server error: ${err?.message || 'Unknown error'}` }, { status: 500 });
  }
}
