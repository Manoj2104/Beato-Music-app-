import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/rbac';
import { db } from '@/lib/db';
import { logSecurityEvent } from '@/lib/audit';
import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import os from 'os';

const execFileAsync = promisify(execFile);

const YTDLP_PATH = path.join(process.cwd(), 'yt-dlp.exe');
const FFMPEG_DIR =
  'C:\\Users\\manoj\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-8.1.2-full_build\\bin';
const FFPROBE_PATH = path.join(FFMPEG_DIR, 'ffprobe.exe');

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
}

function sha256File(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('error', reject);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

async function getAudioDuration(filePath: string): Promise<number> {
  try {
    const { stdout } = await execFileAsync(FFPROBE_PATH, [
      '-v', 'quiet', '-print_format', 'json', '-show_format', filePath,
    ]);
    return parseFloat(JSON.parse(stdout)?.format?.duration || '0');
  } catch {
    return 0;
  }
}

function sseEvent(data: object): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

// ─── YouTube Search (Pure JS, no binary required, works on Vercel) ────────────
async function findYouTubeVideoId(searchQuery: string): Promise<string | null> {
  // Try local yt-dlp first if available
  if (fs.existsSync(YTDLP_PATH)) {
    try {
      const { stdout } = await execFileAsync(YTDLP_PATH, [
        '--dump-json', '--no-playlist', '--no-warnings',
        '--default-search', 'ytsearch',
        `ytsearch1:${searchQuery}`,
      ], { timeout: 30000, maxBuffer: 5 * 1024 * 1024 });

      const firstLine = stdout.trim().split('\n')[0];
      if (firstLine) {
        const info = JSON.parse(firstLine);
        if (info.id) return info.id;
      }
    } catch {
      // fallback to scraping
    }
  }

  // Pure JS fallback scraping (works in serverless / cloud environment)
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    const regex = /"videoId":"([^"]+)"/g;
    let match;
    const videoIds: string[] = [];
    while ((match = regex.exec(html)) !== null) {
      if (!videoIds.includes(match[1])) {
        videoIds.push(match[1]);
      }
      if (videoIds.length >= 5) break;
    }
    return videoIds[0] || null;
  } catch (err) {
    console.error('[youtube-search] Error:', err);
    return null;
  }
}

export async function POST(request: NextRequest) {
  const check = await requireAdmin(request);
  if (!check.authorized) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }
  const user = check.user;
  if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'super_admin')) {
    return new Response(JSON.stringify({ error: 'Super Admin only' }), { status: 403 });
  }

  const body = await request.json();
  const { artistId, track, tracks, genre } = body;

  if (!artistId) {
    return new Response(JSON.stringify({ error: 'artistId required' }), { status: 400 });
  }

  const artist = db.getUserById(artistId);
  if (!artist) {
    return new Response(JSON.stringify({ error: `Artist ${artistId} not found` }), { status: 404 });
  }

  // Support both single track and multi-track (playlist/album)
  const trackList: any[] = tracks || (track ? [track] : []);
  if (trackList.length === 0) {
    return new Response(JSON.stringify({ error: 'No tracks provided' }), { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        try { controller.enqueue(encoder.encode(sseEvent(data))); } catch {}
      };

      const total = trackList.length;
      const createdTracks: any[] = [];
      const errors: string[] = [];

      send({ type: 'start', total, message: `Starting Spotify extraction of ${total} track(s)...` });

      for (let i = 0; i < trackList.length; i++) {
        const item = trackList[i];
        const trackNum = i + 1;
        const title = item.songName || item.title || `Track ${trackNum}`;

        // ── Step 1: Resolve YouTube Video ID ──────────────────────────────────
        send({
          type: 'track_progress',
          trackIndex: i, total, title,
          step: 'searching',
          stepNum: 1, totalSteps: 5,
          percentage: Math.round(((i / total) + (1 / total) * 0.1) * 100),
          message: `[${trackNum}/${total}] 🔍 Finding on YouTube: ${title}`
        });

        let videoId = item.youtubeVideoId || null;

        if (!videoId) {
          // Auto-search YouTube using yt-dlp
          const searchQuery = item.youtubeSearchQuery || `${item.artist || ''} ${title} official audio`;
          videoId = await findYouTubeVideoId(searchQuery);
        }

        if (!videoId) {
          const errMsg = `Could not find "${title}" on YouTube — skipped.`;
          errors.push(`Track ${trackNum}: ${errMsg}`);
          send({
            type: 'track_error',
            trackIndex: i, total, title,
            percentage: Math.round(((i + 1) / total) * 100),
            error: errMsg,
            message: `[${trackNum}/${total}] ❌ ${errMsg}`
          });
          continue;
        }

        const useCloudStream = !fs.existsSync(YTDLP_PATH) || !fs.existsSync(FFPROBE_PATH);

        // ─── Cloud Stream Mode (no local yt-dlp binary) ──────────────────────
        if (useCloudStream) {
          try {
            send({
              type: 'track_progress',
              trackIndex: i, total, title,
              step: 'registering',
              stepNum: 5, totalSteps: 5,
              percentage: Math.round(((i / total) + (1 / total) * 0.95) * 100),
              message: `[${trackNum}/${total}] ☁️ Registering Stream: ${title}`
            });

            const audioUrl = `/api/songs/resolve?youtubeId=${videoId}`;
            const duration = parseInt(item.duration) || 210;
            const sha256 = crypto.createHash('sha256').update(videoId).digest('hex');
            const trackId = `track-sp-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

            const newTrack = {
              id: trackId,
              title,
              artistId,
              artistName: artist.name,
              albumId: 'single',
              albumName: item.album || 'Single',
              coverImage: item.coverImage || '',
              duration,
              audioUrl,
              genre: item.genre || genre || 'Pop',
              year: item.releaseDate ? parseInt(item.releaseDate.slice(0, 4)) : new Date().getFullYear(),
              plays: 0,
              liked: false,
              explicit: item.explicit === true,
              trackNumber: 1,
              waveform: Array.from({ length: 60 }, () => Math.floor(Math.random() * 80 + 20)),
              uploadedBy: user.token || 'super-admin',
              uploadedAt: new Date().toISOString().split('T')[0],
              status: 'approved' as const,
              youtubeVideoId: videoId,
              sha256Checksum: sha256,
              spotifyTrackId: item.spotifyId || '',
              originalSpotifyUrl: item.spotifyUrl || '',
            };

            db.addTrack(newTrack);
            createdTracks.push(newTrack);

            logSecurityEvent(
              user.token || 'unknown',
              `Super Admin (${user.role})`,
              'UPLOAD',
              `Registered cloud stream for Spotify track "${title}" (YouTube: ${videoId}) for artist "${artist.name}"`
            );

            send({
              type: 'track_done',
              trackIndex: i, total, title,
              percentage: Math.round(((i + 1) / total) * 100),
              message: `[${trackNum}/${total}] ✅ Done (Stream): ${title}`,
              sha256, duration, audioUrl
            });
          } catch (err: any) {
            const msg = err?.message || 'Unknown error';
            errors.push(`Track ${trackNum}: ${msg}`);
            send({
              type: 'track_error', trackIndex: i, total, title,
              percentage: Math.round(((i + 1) / total) * 100),
              error: msg,
              message: `[${trackNum}/${total}] ❌ Failed: ${title} — ${msg}`
            });
          }
          continue;
        }

        // ─── Full Download Mode ───────────────────────────────────────────────
        const tmpDir = path.join(os.tmpdir(), `beato-sp-${Date.now()}-${videoId}`);
        fs.mkdirSync(tmpDir, { recursive: true });

        try {
          const safeId = sanitizeFilename(videoId);
          const rawTemplate = path.join(tmpDir, `${safeId}.%(ext)s`);
          const mp3Path = path.join(tmpDir, `${safeId}.mp3`);

          // Clean pre-existing files
          for (const ext of ['mp3', 'webm', 'm4a', 'opus', 'ogg']) {
            const f = path.join(tmpDir, `${safeId}.${ext}`);
            if (fs.existsSync(f)) fs.unlinkSync(f);
          }

          // ── Step 2: Downloading ──
          send({
            type: 'track_progress',
            trackIndex: i, total, title,
            step: 'downloading',
            stepNum: 2, totalSteps: 5,
            percentage: Math.round(((i / total) + (1 / total) * 0.3) * 100),
            message: `[${trackNum}/${total}] 📥 Downloading: ${title}`
          });

          await execFileAsync(YTDLP_PATH, [
            '--no-playlist', '--no-warnings',
            '-f', 'bestaudio[ext=m4a]/bestaudio/best',
            '--extract-audio', '--audio-format', 'mp3', '--audio-quality', '0',
            '--postprocessor-args', 'ffmpeg:-ar 44100 -ac 2',
            '--ffmpeg-location', FFMPEG_DIR,
            '--no-cache-dir',
            '-o', rawTemplate,
            `https://www.youtube.com/watch?v=${videoId}`,
          ], { timeout: 5 * 60 * 1000, maxBuffer: 10 * 1024 * 1024 });

          // ── Step 3: Verifying ──
          send({
            type: 'track_progress',
            trackIndex: i, total, title,
            step: 'verifying',
            stepNum: 3, totalSteps: 5,
            percentage: Math.round(((i / total) + (1 / total) * 0.55) * 100),
            message: `[${trackNum}/${total}] 🔍 Verifying: ${title}`
          });

          if (!fs.existsSync(mp3Path) || fs.statSync(mp3Path).size === 0) {
            throw new Error('MP3 not created or empty after conversion');
          }

          const mp3Duration = await getAudioDuration(mp3Path);
          if (mp3Duration < 1) throw new Error(`MP3 too short (${mp3Duration.toFixed(1)}s)`);

          // ── Step 4: Checksum + Save ──
          send({
            type: 'track_progress',
            trackIndex: i, total, title,
            step: 'saving',
            stepNum: 4, totalSteps: 5,
            percentage: Math.round(((i / total) + (1 / total) * 0.75) * 100),
            message: `[${trackNum}/${total}] 💾 Saving: ${title}`
          });

          const sha256 = await sha256File(mp3Path);

          const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
          fs.mkdirSync(uploadsDir, { recursive: true });
          const safeTitle = sanitizeFilename(item.songName || title);
          const destFilename = `sp_${safeId}_${safeTitle}.mp3`;
          const destPath = path.join(uploadsDir, destFilename);
          fs.copyFileSync(mp3Path, destPath);
          const audioUrl = `/uploads/${destFilename}`;

          // ── Step 5: Registering ──
          send({
            type: 'track_progress',
            trackIndex: i, total, title,
            step: 'registering',
            stepNum: 5, totalSteps: 5,
            percentage: Math.round(((i / total) + (1 / total) * 0.95) * 100),
            message: `[${trackNum}/${total}] ✅ Registering: ${title}`
          });

          const trackId = `track-sp-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
          const newTrack = {
            id: trackId,
            title,
            artistId,
            artistName: artist.name,
            albumId: 'single',
            albumName: item.album || 'Single',
            coverImage: item.coverImage || '',
            duration: Math.round(mp3Duration),
            audioUrl,
            genre: item.genre || genre || 'Pop',
            year: item.releaseDate ? parseInt(item.releaseDate.slice(0, 4)) : new Date().getFullYear(),
            plays: 0,
            liked: false,
            explicit: item.explicit === true,
            trackNumber: 1,
            waveform: Array.from({ length: 60 }, () => Math.floor(Math.random() * 80 + 20)),
            uploadedBy: user.token || 'super-admin',
            uploadedAt: new Date().toISOString().split('T')[0],
            status: 'approved' as const,
            youtubeVideoId: videoId,
            sha256Checksum: sha256,
            spotifyTrackId: item.spotifyId || '',
            originalSpotifyUrl: item.spotifyUrl || '',
          };

          db.addTrack(newTrack);
          createdTracks.push(newTrack);

          logSecurityEvent(
            user.token || 'unknown',
            `Super Admin (${user.role})`,
            'UPLOAD',
            `Extracted Spotify track "${title}" via YouTube ${videoId} for artist "${artist.name}". SHA256: ${sha256}`
          );

          send({
            type: 'track_done',
            trackIndex: i, total, title: newTrack.title,
            percentage: Math.round(((i + 1) / total) * 100),
            message: `[${trackNum}/${total}] ✅ Done: ${newTrack.title}`,
            sha256, duration: Math.round(mp3Duration), audioUrl
          });

        } catch (err: any) {
          const msg = err?.message || 'Unknown error';
          errors.push(`Track ${trackNum} (${title}): ${msg}`);
          send({
            type: 'track_error',
            trackIndex: i, total, title,
            percentage: Math.round(((i + 1) / total) * 100),
            error: msg,
            message: `[${trackNum}/${total}] ❌ Failed: ${title} — ${msg}`
          });
        } finally {
          try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
        }
      }

      // Final event
      send({
        type: 'complete',
        total,
        uploaded: createdTracks.length,
        errors,
        message: `Successfully extracted ${createdTracks.length}/${total} Spotify track(s) for "${artist.name}".`,
        tracks: createdTracks.map(t => ({ ...t, waveform: undefined })),
      });

      controller.close();
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
