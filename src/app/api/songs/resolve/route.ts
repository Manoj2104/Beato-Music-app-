import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import ytdl from '@distube/ytdl-core';

// Extend Vercel function timeout to 60s
export const maxDuration = 60;

const execFileAsync = promisify(execFile);

// Platform-appropriate yt-dlp binary (local dev only)
const isWindows = process.platform === 'win32';
const YTDLP_PATH = path.join(process.cwd(), isWindows ? 'yt-dlp.exe' : 'yt-dlp');
const YTDLP_AVAILABLE = fs.existsSync(YTDLP_PATH);

// In-memory cache
const streamUrlCache = new Map<string, { url: string; contentType: string; expires: number }>();

// ── 0. ytdl-core (fastest pure JS cloud resolver for Vercel) ───────────────────
async function resolveViaYtdlCore(videoId: string) {
  const cacheKey = `ytdlcore-${videoId}`;
  const cached = streamUrlCache.get(cacheKey);
  if (cached && cached.expires > Date.now()) return cached;

  const info = await ytdl.getInfo(videoId);
  const format = ytdl.chooseFormat(info.formats, { filter: 'audioonly', quality: 'highestaudio' });
  if (!format || !format.url) throw new Error('No audio format found from ytdl-core');

  const ext = (format.container || 'm4a') as string;
  const acodec = (format.audioCodec || '').toLowerCase();
  let contentType = 'audio/mp4';
  if (ext === 'webm' || acodec === 'opus') {
    contentType = 'audio/webm; codecs="opus"';
  } else if (ext === 'mp3') {
    contentType = 'audio/mpeg';
  }

  const result = {
    url: format.url,
    contentType,
    expires: Date.now() + 5 * 60 * 1000,
  };
  streamUrlCache.set(cacheKey, result);
  return result;
}

// ── 1. Local yt-dlp (fastest, for local dev) ─────────────────────────────────
async function resolveViaYtdlp(videoId: string) {
  if (!YTDLP_AVAILABLE) throw new Error('yt-dlp not found');
  const cacheKey = `ytdlp-${videoId}`;
  const cached = streamUrlCache.get(cacheKey);
  if (cached && cached.expires > Date.now()) return cached;

  // Use --dump-json to get the full manifest and pick the best audio stream URL ourselves.
  // This avoids the --get-url + --print mix which produced ambiguous/split output.
  const { stdout } = await execFileAsync(YTDLP_PATH, [
    '--no-playlist', '--no-warnings', '--no-cache-dir',
    '--dump-json',
    '-f', 'bestaudio[ext=m4a]/bestaudio[ext=webm]/bestaudio',
    `https://www.youtube.com/watch?v=${videoId}`,
  ], { timeout: 30_000, maxBuffer: 5 * 1024 * 1024 });

  const info = JSON.parse(stdout.trim());

  // The selected format URL is in info.url (yt-dlp places the chosen format's URL here)
  const url = info.url;
  if (!url || !url.startsWith('http')) throw new Error(`yt-dlp returned no stream URL for ${videoId}`);

  // Determine content type from the selected format's ext/acodec
  const ext = info.ext || 'm4a';
  const acodec = (info.acodec || '').toLowerCase();
  let contentType: string;
  if (ext === 'm4a' || ext === 'mp4' || acodec.startsWith('mp4a')) {
    contentType = 'audio/mp4';
  } else if (ext === 'webm' || acodec === 'opus') {
    contentType = 'audio/webm; codecs="opus"';
  } else if (ext === 'mp3') {
    contentType = 'audio/mpeg';
  } else {
    contentType = 'audio/mp4'; // safe fallback
  }

  const result = { url, contentType, expires: Date.now() + 5 * 60 * 1000 };
  streamUrlCache.set(cacheKey, result);
  return result;
}


// ── 2. Piped API (works on Vercel — public YouTube proxy, no binary needed) ──
// Piped proxies YouTube content through their own servers, so stream URLs
// work from ANY IP (browser can fetch directly — no Vercel proxy needed).
const PIPED_INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://piped-api.garudalinux.org',
  'https://api.piped.projectsegfau.lt',
  'https://piped.video/api',
];

async function resolveViaPiped(videoId: string) {
  const cacheKey = `piped-${videoId}`;
  const cached = streamUrlCache.get(cacheKey);
  if (cached && cached.expires > Date.now()) return cached;

  for (const instance of PIPED_INSTANCES) {
    try {
      const res = await fetch(`${instance}/streams/${videoId}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SoundSphere/1.0)' },
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) continue;

      const data = await res.json();
      const audioStreams: any[] = data.audioStreams || [];
      if (!audioStreams.length) continue;

      // Pick highest-quality audio stream; prefer m4a/AAC for browser support
      const sorted = audioStreams.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
      const m4a = sorted.find(s => s.mimeType?.includes('audio/mp4') || s.format === 'M4A');
      const best = m4a || sorted[0];
      if (!best?.url) continue;

      const result = {
        url: best.url,
        contentType: best.mimeType || 'audio/mp4',
        expires: Date.now() + 5 * 60 * 1000,
      };
      streamUrlCache.set(cacheKey, result);
      return result;
    } catch {
      // Try next Piped instance
    }
  }
  throw new Error('All Piped instances failed');
}

// ── Proxy helper (for yt-dlp URLs which are IP-bound to our server) ──────────
async function proxyStream(
  streamUrl: string,
  contentType: string,
  request: NextRequest,
): Promise<NextResponse> {
  const range = request.headers.get('range');
  const headers: HeadersInit = {
    'User-Agent': 'Mozilla/5.0 (compatible)',
    'Referer': 'https://www.youtube.com/',
    'Accept': '*/*',
  };
  if (range) headers['Range'] = range;

  const upstream = await fetch(streamUrl, { headers });
  if (!upstream.ok && upstream.status !== 206) {
    throw new Error(`Upstream ${upstream.status}`);
  }

  const resHeaders: Record<string, string> = {
    'Content-Type': upstream.headers.get('Content-Type') || contentType,
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
  };
  const cl = upstream.headers.get('Content-Length');
  if (cl) resHeaders['Content-Length'] = cl;
  const cr = upstream.headers.get('Content-Range');
  if (cr) resHeaders['Content-Range'] = cr;

  return new NextResponse(upstream.body, { status: upstream.status, headers: resHeaders });
}

// ── Main handler ──────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const youtubeId = searchParams.get('youtubeId');

  if (!youtubeId || !/^[a-zA-Z0-9_-]{11}$/.test(youtubeId)) {
    return new NextResponse('Invalid youtubeId', { status: 400 });
  }

  // ── Step 1: Serve from local disk if available (local dev fast path) ────────
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  try {
    const files = fs.readdirSync(uploadsDir);
    const localFile = files.find(
      f => f.startsWith(youtubeId) && /\.(mp3|m4a|webm)$/.test(f),
    );
    if (localFile) {
      const filePath = path.join(uploadsDir, localFile);
      const stat = fs.statSync(filePath);
      const ext = path.extname(localFile).slice(1);
      const ct = ext === 'mp3' ? 'audio/mpeg' : ext === 'm4a' ? 'audio/mp4' : 'audio/webm';
      const range = request.headers.get('range');

      if (range) {
        const [startStr, endStr] = range.replace(/bytes=/, '').split('-');
        const start = parseInt(startStr, 10);
        const end = endStr ? parseInt(endStr, 10) : stat.size - 1;
        const chunk = end - start + 1;
        return new NextResponse(fs.createReadStream(filePath, { start, end }) as any, {
          status: 206,
          headers: {
            'Content-Range': `bytes ${start}-${end}/${stat.size}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': String(chunk),
            'Content-Type': ct,
          },
        });
      }

      return new NextResponse(fs.createReadStream(filePath) as any, {
        headers: {
          'Content-Type': ct,
          'Content-Length': String(stat.size),
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'public, max-age=86400',
        },
      });
    }
  } catch { /* no local file */ }

  // ── Step 2a: Cloud (Vercel) → use ytdl-core (pure JS, same-origin stream proxy) 
  try {
    const { url, contentType } = await resolveViaYtdlCore(youtubeId);
    console.info(`[resolve] ytdl-core resolved URL for ${youtubeId} → proxying stream`);
    return await proxyStream(url, contentType, request);
  } catch (err: any) {
    console.warn(`[resolve] ytdl-core failed: ${err?.message}`);
  }

  // ── Step 2b: Local dev → use yt-dlp (proxy result since URL is IP-bound) ───
  if (YTDLP_AVAILABLE) {
    try {
      const { url, contentType } = await resolveViaYtdlp(youtubeId);
      return await proxyStream(url, contentType, request);
    } catch (err: any) {
      console.warn(`[resolve] yt-dlp failed: ${err?.message}`);
    }
  }

  // ── Step 2c: Fallback to Piped API ──────────────────────────────────────────
  try {
    const { url, contentType } = await resolveViaPiped(youtubeId);
    console.info(`[resolve] Piped URL obtained for ${youtubeId} → proxying stream`);
    return await proxyStream(url, contentType, request);
  } catch (err: any) {
    console.error(`[resolve] All methods failed for ${youtubeId}:`, err?.message);
    return new NextResponse(
      JSON.stringify({ error: 'Could not resolve audio stream.', detail: err?.message }),
      { status: 502, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
