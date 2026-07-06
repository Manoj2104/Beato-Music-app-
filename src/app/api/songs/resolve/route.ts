import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

// Extend Vercel function timeout to 60s (default 10s is too short for ytdl-core)
export const maxDuration = 60;

const execFileAsync = promisify(execFile);

// Use platform-appropriate yt-dlp binary
const isWindows = process.platform === 'win32';
const YTDLP_FILENAME = isWindows ? 'yt-dlp.exe' : 'yt-dlp';
const YTDLP_PATH = path.join(process.cwd(), YTDLP_FILENAME);
const YTDLP_AVAILABLE = fs.existsSync(YTDLP_PATH);

// In-memory cache: key → { url, expires }
const streamUrlCache = new Map<string, { url: string; expires: number }>();

// ── Get stream URL via yt-dlp (local dev) ──────────────────────────────────
async function getStreamUrlViaYtdlp(videoId: string): Promise<string> {
  const cacheKey = `ytdlp-${videoId}`;
  const cached = streamUrlCache.get(cacheKey);
  if (cached && cached.expires > Date.now()) return cached.url;

  if (!YTDLP_AVAILABLE) throw new Error('yt-dlp binary not found');

  const { stdout } = await execFileAsync(YTDLP_PATH, [
    '--no-playlist', '--no-warnings',
    '-f', 'bestaudio[ext=m4a]/bestaudio[ext=webm]/bestaudio/best',
    '--get-url',
    `https://www.youtube.com/watch?v=${videoId}`,
  ], { timeout: 30_000, maxBuffer: 2 * 1024 * 1024 });

  const url = stdout.trim().split('\n')[0];
  if (!url || !url.startsWith('http')) throw new Error(`Invalid URL from yt-dlp: "${url}"`);

  streamUrlCache.set(cacheKey, { url, expires: Date.now() + 5 * 60 * 1000 });
  return url;
}

// ── Get stream URL via @distube/ytdl-core (Vercel fallback, pure JS) ───────
async function getStreamUrlViaYtdlCore(videoId: string): Promise<string> {
  const cacheKey = `ytdl-${videoId}`;
  const cached = streamUrlCache.get(cacheKey);
  if (cached && cached.expires > Date.now()) return cached.url;

  const ytdl = (await import('@distube/ytdl-core')).default;

  // Use Android VR client to bypass YouTube bot detection on server IPs
  const info = await ytdl.getInfo(`https://www.youtube.com/watch?v=${videoId}`, {
    requestOptions: {
      headers: {
        // Mimic Android YouTube app to bypass bot detection
        'User-Agent': 'com.google.android.youtube/17.36.4 (Linux; U; Android 12) gzip',
      },
    },
  });

  // Prefer AAC/m4a (works in all browsers); fallback to any audioonly format
  const format =
    ytdl.chooseFormat(info.formats, { quality: 'highestaudio', filter: (f) => !!(f.mimeType?.includes('audio/mp4')) }) ||
    ytdl.chooseFormat(info.formats, { quality: 'highestaudio', filter: 'audioonly' });

  if (!format?.url) throw new Error('No audio format found via ytdl-core');

  streamUrlCache.set(cacheKey, { url: format.url, expires: Date.now() + 5 * 60 * 1000 });
  return format.url;
}

// ── Proxy stream URL through our server (avoids CORS for range requests) ───
async function proxyStream(streamUrl: string, request: NextRequest): Promise<NextResponse> {
  const range = request.headers.get('range');
  const headers: HeadersInit = {
    'User-Agent': 'Mozilla/5.0 (compatible)',
    'Referer': 'https://www.youtube.com/',
    'Origin': 'https://www.youtube.com',
    'Accept': '*/*',
  };
  if (range) headers['Range'] = range;

  const upstream = await fetch(streamUrl, { headers });
  if (!upstream.ok && upstream.status !== 206) {
    throw new Error(`Upstream ${upstream.status}`);
  }

  const resHeaders: Record<string, string> = {
    'Content-Type': upstream.headers.get('Content-Type') || 'audio/mp4',
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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const youtubeId = searchParams.get('youtubeId');

  if (!youtubeId || !/^[a-zA-Z0-9_-]{11}$/.test(youtubeId)) {
    return new NextResponse('Invalid youtubeId', { status: 400 });
  }

  // ── 1. Serve local file if it exists (local dev fast path) ─────────────
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  try {
    const files = fs.readdirSync(uploadsDir);
    const localFile = files.find(f => f.startsWith(youtubeId) && (f.endsWith('.mp3') || f.endsWith('.m4a') || f.endsWith('.webm')));
    if (localFile) {
      const filePath = path.join(uploadsDir, localFile);
      const stat = fs.statSync(filePath);
      const ext = path.extname(localFile).slice(1);
      const contentType = ext === 'mp3' ? 'audio/mpeg' : ext === 'm4a' ? 'audio/mp4' : 'audio/webm';
      const range = request.headers.get('range');

      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
        const chunkSize = end - start + 1;
        const fileStream = fs.createReadStream(filePath, { start, end });
        return new NextResponse(fileStream as any, {
          status: 206,
          headers: {
            'Content-Range': `bytes ${start}-${end}/${stat.size}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': String(chunkSize),
            'Content-Type': contentType,
          },
        });
      }

      const fileStream = fs.createReadStream(filePath);
      return new NextResponse(fileStream as any, {
        headers: {
          'Content-Type': contentType,
          'Content-Length': String(stat.size),
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'public, max-age=86400',
        },
      });
    }
  } catch { /* no local file — fall through to YouTube */ }

  // ── 2. Resolve YouTube stream URL (yt-dlp → ytdl-core fallback) ─────────
  try {
    let streamUrl: string;

    if (YTDLP_AVAILABLE) {
      streamUrl = await getStreamUrlViaYtdlp(youtubeId);
    } else {
      console.info(`[resolve] Using ytdl-core for ${youtubeId}`);
      streamUrl = await getStreamUrlViaYtdlCore(youtubeId);
    }

    // Proxy through our server so browser can do range-requests / seeking
    return await proxyStream(streamUrl, request);

  } catch (err: any) {
    console.error(`[resolve] Failed for ${youtubeId}:`, err?.message);
    return new NextResponse(
      JSON.stringify({ error: 'Could not resolve audio stream.', detail: err?.message }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
