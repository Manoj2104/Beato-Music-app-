import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execFileAsync = promisify(execFile);
const YTDLP_PATH = path.join(process.cwd(), 'yt-dlp.exe');

// In-memory cache: videoId → { url, expires }
const streamUrlCache = new Map<string, { url: string; expires: number }>();

async function getStreamUrl(videoId: string): Promise<string> {
  const cached = streamUrlCache.get(videoId);
  if (cached && cached.expires > Date.now()) return cached.url;

  const { stdout } = await execFileAsync(YTDLP_PATH, [
    '--no-playlist',
    '--no-warnings',
    '-f', 'bestaudio[ext=m4a]/bestaudio[ext=webm]/bestaudio/best',
    '--get-url',
    `https://www.youtube.com/watch?v=${videoId}`
  ], { timeout: 30_000, maxBuffer: 2 * 1024 * 1024 });

  const url = stdout.trim().split('\n')[0];
  if (!url || !url.startsWith('http')) throw new Error(`Invalid stream URL: "${url}"`);

  // Cache for 5 minutes (YouTube signed URLs are valid for ~6 hours but we refresh early)
  streamUrlCache.set(videoId, { url, expires: Date.now() + 5 * 60 * 1000 });
  return url;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const youtubeId = searchParams.get('youtubeId');

  if (!youtubeId || !/^[a-zA-Z0-9_-]{11}$/.test(youtubeId)) {
    return new NextResponse('Invalid youtubeId', { status: 400 });
  }

  // ── 1. Check if we already have the file saved locally in public/uploads ──
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  try {
    const files = fs.readdirSync(uploadsDir);
    const localFile = files.find(f => f.startsWith(youtubeId) && f.endsWith('.mp3'));
    if (localFile) {
      const filePath = path.join(uploadsDir, localFile);
      const stat = fs.statSync(filePath);
      const range = request.headers.get('range');

      if (range) {
        // Handle range requests for seeking
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
        const chunkSize = end - start + 1;
        const fileStream = fs.createReadStream(filePath, { start, end });
        // @ts-ignore – ReadableStream from Node fs is compatible
        return new NextResponse(fileStream as any, {
          status: 206,
          headers: {
            'Content-Range': `bytes ${start}-${end}/${stat.size}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': String(chunkSize),
            'Content-Type': 'audio/mpeg',
            'Cache-Control': 'public, max-age=86400',
          },
        });
      }

      const fileStream = fs.createReadStream(filePath);
      // @ts-ignore
      return new NextResponse(fileStream as any, {
        status: 200,
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Length': String(stat.size),
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'public, max-age=86400',
        },
      });
    }
  } catch {}

  // ── 2. Stream from YouTube via yt-dlp URL (proxied through server to avoid CORS) ──
  try {
    const streamUrl = await getStreamUrl(youtubeId);

    // Proxy the request: fetch from YouTube with proper headers, stream back to browser
    const range = request.headers.get('range');
    const upstreamHeaders: HeadersInit = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Referer': 'https://www.youtube.com/',
      'Origin': 'https://www.youtube.com',
      'Accept': '*/*',
    };
    if (range) upstreamHeaders['Range'] = range;

    const upstream = await fetch(streamUrl, { headers: upstreamHeaders });

    if (!upstream.ok && upstream.status !== 206) {
      throw new Error(`Upstream returned ${upstream.status}`);
    }

    // Build response headers
    const resHeaders: Record<string, string> = {
      'Content-Type': upstream.headers.get('Content-Type') || 'audio/webm',
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'no-store',
      // CORS — allow our own front-end to read it
      'Access-Control-Allow-Origin': '*',
    };
    const contentLength = upstream.headers.get('Content-Length');
    if (contentLength) resHeaders['Content-Length'] = contentLength;
    const contentRange = upstream.headers.get('Content-Range');
    if (contentRange) resHeaders['Content-Range'] = contentRange;

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: resHeaders,
    });
  } catch (err: any) {
    console.error(`[resolve] Failed for ${youtubeId}:`, err?.message);
    return new NextResponse(
      JSON.stringify({ error: 'Could not resolve audio stream.', detail: err?.message }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
