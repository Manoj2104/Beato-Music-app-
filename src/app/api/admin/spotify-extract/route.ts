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
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)',
    },
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    throw new Error(`Spotify track page fetch failed with status ${res.status}`);
  }

  const html = await res.text();

  // Extract metadata via Open Graph tags
  const title = html.match(/<meta property="og:title" content="([^"]+)"/)?.[1] || 'Unknown Track';
  const coverImage = html.match(/<meta property="og:image" content="([^"]+)"/)?.[1] || '';
  const description = html.match(/<meta property="og:description" content="([^"]+)"/)?.[1] || '';

  let artist = 'Unknown Artist';
  let album = 'Single';
  let releaseDate = new Date().getFullYear().toString();

  if (description) {
    const cleanDesc = description.replace(/^Listen to [^·]+ on Spotify\.\s*/i, '');
    const parts = cleanDesc.split(' · ').map(p => p.trim());

    if (parts.length >= 3) {
      if (parts[0].toLowerCase() === 'song') {
        artist = parts[1];
        if (parts.length === 4) {
          album = parts[2];
          releaseDate = parts[3];
        } else {
          releaseDate = parts[2];
        }
      }
    } else if (parts.length === 2) {
      artist = parts[0];
      releaseDate = parts[1];
    } else {
      artist = cleanDesc;
    }
  }

  return {
    id: trackId,
    title,
    artist,
    album,
    coverImage,
    duration: 240, // default fallback duration (4 minutes)
    explicit: false,
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

  // Scrape each track metadata sequentially to prevent rate limits
  const tracksToScrape = uniqueIds.slice(0, 30);
  const tracks: SpotifyTrackInfo[] = [];

  for (const trackId of tracksToScrape) {
    try {
      const track = await scrapeSpotifyTrack(trackId);
      tracks.push(track);
    } catch (err: any) {
      console.warn(`[spotify-extract] Failed to scrape track ${trackId}:`, err.message);
    }
  }

  return {
    playlistTitle,
    coverImage,
    tracks,
  };
}

// ─── YouTube Search via yt-dlp ────────────────────────────────────────────────

async function findYouTubeVideoId(searchQuery: string): Promise<string | null> {
  if (!fs.existsSync(YTDLP_PATH)) return null;
  try {
    const { stdout } = await execFileAsync(YTDLP_PATH, [
      '--dump-json', '--no-playlist', '--no-warnings', '--no-cache-dir',
      `ytsearch1:${searchQuery}`,
    ], { timeout: 30_000, maxBuffer: 5 * 1024 * 1024 });

    const firstLine = stdout.trim().split('\n')[0];
    if (!firstLine) return null;
    const info = JSON.parse(firstLine);
    return info.id || null;
  } catch {
    return null;
  }
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

      const searchQuery = `${trackInfo.artist} ${trackInfo.title} official audio`;
      console.log(`[spotify-extract] Searching YouTube: "${searchQuery}"`);
      const youtubeVideoId = await findYouTubeVideoId(searchQuery);

      return NextResponse.json({
        success: true,
        type: 'track',
        track: {
          spotifyId: trackInfo.id,
          spotifyUrl: trackInfo.spotifyUrl,
          youtubeVideoId: youtubeVideoId || null,
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

      const tracksToProcess = result.tracks.slice(0, 50);
      const enrichedTracks = await Promise.all(
        tracksToProcess.map(async (t) => {
          const searchQuery = `${t.artist} ${t.title} official audio`;
          const youtubeVideoId = await findYouTubeVideoId(searchQuery);
          return {
            spotifyId: t.id,
            spotifyUrl: t.spotifyUrl,
            youtubeVideoId: youtubeVideoId || null,
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
        })
      );

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
