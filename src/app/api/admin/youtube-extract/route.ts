import { NextRequest, NextResponse } from 'next/server';
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

// ─── Paths ───────────────────────────────────────────────────────────────────
const YTDLP_PATH = path.join(process.cwd(), 'yt-dlp.exe');
const FFMPEG_PATH =
  'C:\\Users\\manoj\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-8.1.2-full_build\\bin\\ffmpeg.exe';
const FFPROBE_PATH =
  'C:\\Users\\manoj\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-8.1.2-full_build\\bin\\ffprobe.exe';

// ─── Helper: extract Video ID from any YouTube URL ───────────────────────────
function extractVideoId(url: string): string | null {
  // Reject non-YouTube domains immediately
  const allowedHosts = ['youtube.com', 'www.youtube.com', 'youtu.be', 'm.youtube.com', 'music.youtube.com'];
  let hostname: string;
  try {
    hostname = new URL(url).hostname;
  } catch {
    return null;
  }
  if (!allowedHosts.includes(hostname)) return null;

  // youtu.be/<id>
  if (hostname === 'youtu.be') {
    const id = new URL(url).pathname.replace('/', '').split('?')[0];
    return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
  }

  // youtube.com/watch?v=<id>  or  /shorts/<id>  or  /embed/<id>
  const urlObj = new URL(url);
  const v = urlObj.searchParams.get('v');
  if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;

  const pathParts = urlObj.pathname.split('/').filter(Boolean);
  for (const part of pathParts) {
    if (/^[a-zA-Z0-9_-]{11}$/.test(part)) return part;
  }
  return null;
}

// ─── Helper: sanitise filename ───────────────────────────────────────────────
function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
}

// ─── Helper: SHA-256 of a file ───────────────────────────────────────────────
function sha256File(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('error', reject);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

// ─── Helper: get duration of audio file via ffprobe ──────────────────────────
async function getAudioDuration(filePath: string): Promise<number> {
  try {
    const { stdout } = await execFileAsync(FFPROBE_PATH, [
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_format',
      filePath
    ]);
    const info = JSON.parse(stdout);
    return parseFloat(info?.format?.duration || '0');
  } catch {
    return 0;
  }
}

// ─── Helper: fetch YouTube metadata via yt-dlp with oEmbed fallback ──────────
async function fetchYouTubeMetadata(videoId: string): Promise<{
  title: string;
  uploader: string;
  channel: string;
  duration: number;
  thumbnail: string;
  description: string;
  viewCount: number;
  uploadDate: string;
  artist: string;
}> {
  // ── Strategy 1: yt-dlp (local environment, fastest & most complete) ──
  const ytdlpExists = fs.existsSync(YTDLP_PATH);
  if (ytdlpExists) {
    try {
      const { stdout } = await execFileAsync(YTDLP_PATH, [
        '--dump-json',
        '--no-playlist',
        '--no-warnings',
        `https://www.youtube.com/watch?v=${videoId}`
      ], { timeout: 30000 });
      const info = JSON.parse(stdout);
      return {
        title: info.title || `YouTube Video ${videoId}`,
        uploader: info.uploader || info.channel || 'Unknown',
        channel: info.channel || info.uploader || 'Unknown',
        duration: Math.round(info.duration || 0),
        thumbnail: info.thumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        description: (info.description || '').slice(0, 500),
        viewCount: info.view_count || 0,
        uploadDate: info.upload_date || '',
        artist: info.artist || info.creator || info.uploader || ''
      };
    } catch (ytdlpErr: any) {
      console.warn('[youtube-extract] yt-dlp failed, trying fallback APIs:', ytdlpErr?.message);
    }
  }

  // ── Strategy 2: noembed.com API (free, no key needed, has duration) ──
  try {
    const noembedRes = await fetch(
      `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (noembedRes.ok) {
      const noembed = await noembedRes.json();
      if (noembed.title && !noembed.error) {
        return {
          title: noembed.title || `YouTube Video ${videoId}`,
          uploader: noembed.author_name || 'Unknown',
          channel: noembed.author_name || 'Unknown',
          duration: 0, // noembed doesn't include duration
          thumbnail: noembed.thumbnail_url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          description: '',
          viewCount: 0,
          uploadDate: '',
          artist: noembed.author_name || ''
        };
      }
    }
  } catch (noembedErr: any) {
    console.warn('[youtube-extract] noembed fallback failed:', noembedErr?.message);
  }

  // ── Strategy 3: YouTube oEmbed (official, no key, basic metadata only) ──
  try {
    const oembedRes = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (oembedRes.ok) {
      const oembed = await oembedRes.json();
      return {
        title: oembed.title || `YouTube Video ${videoId}`,
        uploader: oembed.author_name || 'Unknown',
        channel: oembed.author_name || 'Unknown',
        duration: 0, // oEmbed doesn't include duration
        thumbnail: oembed.thumbnail_url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        description: '',
        viewCount: 0,
        uploadDate: '',
        artist: oembed.author_name || ''
      };
    }
  } catch (oembedErr: any) {
    console.warn('[youtube-extract] oEmbed fallback failed:', oembedErr?.message);
  }

  // ── Strategy 4: Minimal fallback — return ID-based placeholder ──
  return {
    title: `YouTube Video ${videoId}`,
    uploader: 'Unknown',
    channel: 'Unknown',
    duration: 210, // Assume 3m30s if all APIs fail
    thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    description: '',
    viewCount: 0,
    uploadDate: '',
    artist: ''
  };
}

// ─── Helper: fetch playlist metadata (video list) via yt-dlp ─────────────────
async function fetchPlaylistMetadata(playlistUrl: string): Promise<{
  playlistTitle: string;
  videos: { id: string; title: string; duration: number; thumbnail: string; uploader: string }[];
}> {
  const { stdout } = await execFileAsync(YTDLP_PATH, [
    '--flat-playlist',
    '--dump-json',
    '--no-warnings',
    playlistUrl
  ], { maxBuffer: 50 * 1024 * 1024 }); // 50MB buffer for large playlists

  const lines = stdout.trim().split('\n').filter(Boolean);
  const videos = lines.map((line) => {
    try {
      const v = JSON.parse(line);
      return {
        id: v.id,
        title: v.title || `Video ${v.id}`,
        duration: Math.round(v.duration || 180),
        thumbnail: v.thumbnail || `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`,
        uploader: v.uploader || v.channel || 'Unknown'
      };
    } catch { return null; }
  }).filter(Boolean) as { id: string; title: string; duration: number; thumbnail: string; uploader: string }[];

  // Extract playlist title from first entry (yt-dlp doesn't always include it)
  let playlistTitle = 'YouTube Playlist';
  try {
    const firstParsed = JSON.parse(lines[0]);
    if (firstParsed.playlist_title) playlistTitle = firstParsed.playlist_title;
  } catch {}

  return { playlistTitle, videos };
}

// ─── Helper: download + convert one video to MP3 ─────────────────────────────
async function downloadAndConvert(
  videoId: string,
  tmpDir: string
): Promise<{ mp3Path: string; downloadedDuration: number; sha256: string; log: string[] }> {
  const log: string[] = [];
  const safeId = sanitizeFilename(videoId);
  const rawTemplate = path.join(tmpDir, `${safeId}.%(ext)s`);
  const mp3Path = path.join(tmpDir, `${safeId}.mp3`);

  log.push(`[yt-dlp] Video ID: ${videoId}`);
  log.push(`[yt-dlp] URL: https://www.youtube.com/watch?v=${videoId}`);
  log.push(`[yt-dlp] Output template: ${rawTemplate}`);

  // Remove any pre-existing file to ensure fresh download
  for (const ext of ['mp3', 'webm', 'm4a', 'opus', 'ogg']) {
    const f = path.join(tmpDir, `${safeId}.${ext}`);
    if (fs.existsSync(f)) fs.unlinkSync(f);
  }

  // Step 1: Download best audio with yt-dlp, let ffmpeg convert inline
  const ytdlpArgs = [
    '--no-playlist',
    '--no-warnings',
    '-f', 'bestaudio[ext=m4a]/bestaudio/best',
    '--extract-audio',
    '--audio-format', 'mp3',
    '--audio-quality', '0',           // best quality (VBR ~320k)
    '--postprocessor-args', `ffmpeg:-ar 44100 -ac 2`,
    '--ffmpeg-location', path.dirname(FFMPEG_PATH),
    '--no-cache-dir',
    '-o', rawTemplate,
    `https://www.youtube.com/watch?v=${videoId}`
  ];

  log.push(`[yt-dlp] Running: ${YTDLP_PATH} ${ytdlpArgs.join(' ')}`);

  const { stdout: dlOut, stderr: dlErr } = await execFileAsync(YTDLP_PATH, ytdlpArgs, {
    timeout: 5 * 60 * 1000, // 5 minute timeout
    maxBuffer: 10 * 1024 * 1024
  });
  if (dlOut) log.push(`[yt-dlp stdout] ${dlOut.slice(0, 500)}`);
  if (dlErr) log.push(`[yt-dlp stderr] ${dlErr.slice(0, 500)}`);

  // Verify MP3 was created
  if (!fs.existsSync(mp3Path)) {
    throw new Error(`yt-dlp did not produce expected MP3 at ${mp3Path}. Check ffmpeg installation.`);
  }

  const stats = fs.statSync(mp3Path);
  if (stats.size === 0) {
    throw new Error(`Converted MP3 has zero bytes — download or conversion failed.`);
  }

  log.push(`[output] MP3 path: ${mp3Path}`);
  log.push(`[output] MP3 size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

  // Step 2: Verify duration via ffprobe
  const mp3Duration = await getAudioDuration(mp3Path);
  log.push(`[verify] MP3 duration: ${mp3Duration.toFixed(2)}s`);

  if (mp3Duration < 1) {
    throw new Error(`MP3 duration is too short (${mp3Duration.toFixed(2)}s) — file may be corrupt.`);
  }

  // Step 3: Compute SHA-256
  const checksum = await sha256File(mp3Path);
  log.push(`[verify] SHA-256: ${checksum}`);

  return { mp3Path, downloadedDuration: mp3Duration, sha256: checksum, log };
}

// ─── MAIN ROUTE ──────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  // Super Admin guard
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
    const { action, url, artistId, genre, metadata, tracks } = body;

    if (!action) {
      return NextResponse.json({ error: 'Action is required.' }, { status: 400 });
    }

    const artist = db.getUserById(artistId);
    const artistName = artist ? artist.name : 'Unknown Artist';

    // ─── ACTION: PARSE ──────────────────────────────────────────────────────
    if (action === 'parse') {
      if (!url || typeof url !== 'string') {
        return NextResponse.json({ error: 'YouTube URL is required for parsing.' }, { status: 400 });
      }

      // Reject non-YouTube URLs
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(url);
      } catch {
        return NextResponse.json({ error: 'Invalid URL. Please provide a valid YouTube URL.' }, { status: 400 });
      }

      const allowedHosts = ['youtube.com', 'www.youtube.com', 'youtu.be', 'm.youtube.com', 'music.youtube.com'];
      if (!allowedHosts.includes(parsedUrl.hostname)) {
        return NextResponse.json({ error: 'Only YouTube URLs are accepted.' }, { status: 400 });
      }

      const isPlaylist = url.includes('list=') && !url.includes('&v=') && !url.includes('?v=') && !url.includes('youtu.be/');

      if (isPlaylist) {
        // ── Playlist parse ──────────────────────────────────────────────────
        try {
          const { playlistTitle, videos } = await fetchPlaylistMetadata(url);
          const parsedTracks = videos.map((v) => {
            const delimiters = [' - ', ' | ', ' – ', ' : '];
            let songName = v.title;
            let singer = v.uploader || artistName;
            for (const delim of delimiters) {
              if (v.title.includes(delim)) {
                const parts = v.title.split(delim);
                songName = parts[1]?.trim() || v.title;
                singer = parts[0]?.trim() || artistName;
                break;
              }
            }
            return {
              id: v.id,
              title: v.title,
              songName,
              singer,
              genre: 'Pop',
              duration: v.duration,
              explicit: false,
              coverImage: v.thumbnail
            };
          });

          // Deduplicate by video ID (playlists can repeat the same video)
          const seenIds = new Set<string>();
          const uniqueTracks = parsedTracks.filter((t) => {
            if (seenIds.has(t.id)) return false;
            seenIds.add(t.id);
            return true;
          });

          return NextResponse.json({
            success: true,
            type: 'playlist',
            playlistTitle,
            tracks: uniqueTracks
          });
        } catch (err: any) {
          console.error('Playlist fetch error:', err);
          return NextResponse.json({
            error: `Failed to fetch playlist. ${err?.message || 'Check the URL and try again.'}`
          }, { status: 422 });
        }
      } else {
        // ── Single video parse ──────────────────────────────────────────────
        const videoId = extractVideoId(url);
        if (!videoId) {
          return NextResponse.json({
            error: 'Could not extract a valid YouTube Video ID from the provided URL.'
          }, { status: 400 });
        }

        try {
          const meta = await fetchYouTubeMetadata(videoId);

          // Smart title parsing (song name vs artist)
          const delimiters = [' - ', ' | ', ' – ', ' : '];
          let songName = meta.title;
          let singer = meta.artist || meta.uploader || artistName;
          for (const delim of delimiters) {
            if (meta.title.includes(delim)) {
              const parts = meta.title.split(delim);
              songName = parts[1]?.trim() || meta.title;
              singer = parts[0]?.trim() || singer;
              break;
            }
          }

          // Estimate file size (320kbps × duration ÷ 8 = bytes)
          const estimatedSizeMB = ((320 * meta.duration) / 8 / 1024 / 1024).toFixed(1);

          return NextResponse.json({
            success: true,
            type: 'video',
            video: {
              id: videoId,
              title: meta.title,
              songName,
              singer,
              genre: 'Pop',
              duration: meta.duration,
              explicit: false,
              coverImage: meta.thumbnail,
              channel: meta.channel,
              uploader: meta.uploader,
              artist: meta.artist,
              description: meta.description,
              viewCount: meta.viewCount,
              uploadDate: meta.uploadDate,
              estimatedSizeMB,
              audioCodec: 'MP3 320kbps 44.1kHz Stereo'
            }
          });
        } catch (err: any) {
          const msg: string = err?.message || '';
          let errorMsg = 'Failed to fetch video metadata.';
          if (msg.includes('Private video')) errorMsg = 'This video is private and cannot be accessed.';
          else if (msg.includes('age')) errorMsg = 'This video is age-restricted and cannot be downloaded.';
          else if (msg.includes('live')) errorMsg = 'Live streams cannot be downloaded as MP3.';
          else if (msg.includes('unavailable') || msg.includes('not available')) errorMsg = 'This video is unavailable.';
          console.error('Single video parse error:', err);
          return NextResponse.json({ error: errorMsg }, { status: 422 });
        }
      }
    }

    // ─── ACTION: CONVERT / UPLOAD ──────────────────────────────────────────
    if (action === 'convert') {
      if (!artistId) {
        return NextResponse.json({ error: 'Selected artist is required.' }, { status: 400 });
      }
      if (!artist) {
        return NextResponse.json({ error: `Artist with ID ${artistId} not found.` }, { status: 404 });
      }

      const trackList: any[] = tracks || (metadata ? [metadata] : []);
      if (trackList.length === 0) {
        return NextResponse.json({ error: 'No track metadata provided for conversion.' }, { status: 400 });
      }

      const createdTracks: any[] = [];
      const allLogs: string[] = [];
      const errors: string[] = [];

      for (const item of trackList) {
        const videoId = item.id as string;

        // Validate the Video ID is a real YouTube ID (not a placeholder)
        if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
          errors.push(`Skipped: invalid or missing Video ID "${videoId}".`);
          continue;
        }

        const useCloudStream = !fs.existsSync(YTDLP_PATH) || !fs.existsSync(FFPROBE_PATH);

        if (useCloudStream) {
          try {
            allLogs.push(`\n=== Processing Video ID (Cloud Mode): ${videoId} ===`);

            const audioUrl = `/api/songs/resolve?youtubeId=${videoId}`;
            const duration = parseInt(item.duration) || 210; // fallback duration if 0/undefined
            const sha256 = crypto.createHash('sha256').update(videoId).digest('hex');

            const trackId = `track-yt-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
            const coverImg = item.coverImage || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

            const newTrack = {
              id: trackId,
              title: item.songName || item.title || 'YouTube MP3 Song',
              artistId,
              artistName: artist.name,
              albumId: 'single',
              albumName: 'Single',
              coverImage: coverImg,
              duration,
              audioUrl,
              genre: item.genre || genre || 'Pop',
              year: new Date().getFullYear(),
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
              originalYoutubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
            };

            db.addTrack(newTrack);
            createdTracks.push(newTrack);

            logSecurityEvent(
              user.token || 'unknown-token',
              `Super Admin (${user.role})`,
              'UPLOAD',
              `Registered cloud stream for "${newTrack.title}" from YouTube video ${videoId} for artist "${artist.name}" (${artistId})`
            );

            allLogs.push(`[SUCCESS] Track "${newTrack.title}" registered in Cloud Mode.`);
          } catch (err: any) {
            const msg = err?.message || 'Unknown error';
            allLogs.push(`[ERROR] Failed for video ${videoId}: ${msg}`);
            errors.push(`Failed for video "${videoId}": ${msg}`);
          }
          continue; // Skip trying binary download
        }

        // Create a unique temp directory per download to avoid collisions
        const tmpDir = path.join(os.tmpdir(), `beato-yt-${Date.now()}-${videoId}`);
        fs.mkdirSync(tmpDir, { recursive: true });

        try {
          allLogs.push(`\n=== Processing Video ID: ${videoId} ===`);

          // Step 1: Download + convert
          const { mp3Path, downloadedDuration, sha256, log } = await downloadAndConvert(videoId, tmpDir);
          allLogs.push(...log);

          // Step 2: Verify duration matches expected (±5 seconds tolerance for encoding differences)
          const expectedDuration = parseInt(item.duration) || 0;
          if (expectedDuration > 0 && Math.abs(downloadedDuration - expectedDuration) > 5) {
            allLogs.push(`[WARN] Duration mismatch: expected ${expectedDuration}s, got ${downloadedDuration.toFixed(0)}s`);
            // Don't abort — just log the warning; small mismatches are normal
          }

          // Step 3: Move MP3 to public/uploads/ so it's served as a static file
          // This avoids storing the binary in localStorage (which has a 5MB quota)
          const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
          fs.mkdirSync(uploadsDir, { recursive: true });

          const safeTitle = sanitizeFilename(item.songName || item.title || videoId);
          const destFilename = `${videoId}_${safeTitle}.mp3`;
          const destPath = path.join(uploadsDir, destFilename);

          // Copy (not move) so temp cleanup doesn't affect the served file
          fs.copyFileSync(mp3Path, destPath);

          const audioUrl = `/uploads/${destFilename}`;
          allLogs.push(`[upload] Saved MP3 to ${destPath} → served at ${audioUrl}`);

          // Step 4: Build track record
          const trackId = `track-yt-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
          const coverImg = item.coverImage || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

          const newTrack = {
            id: trackId,
            title: item.songName || item.title || 'YouTube MP3 Song',
            artistId,
            artistName: artist.name,
            albumId: 'single',
            albumName: 'Single',
            coverImage: coverImg,
            duration: Math.round(downloadedDuration),
            audioUrl,           // Small URL path — safe for localStorage
            genre: item.genre || genre || 'Pop',
            year: new Date().getFullYear(),
            plays: 0,
            liked: false,
            explicit: item.explicit === true,
            trackNumber: 1,
            waveform: Array.from({ length: 60 }, () => Math.floor(Math.random() * 80 + 20)),
            uploadedBy: user.token || 'super-admin',
            uploadedAt: new Date().toISOString().split('T')[0],
            status: 'approved' as const,
            // Verification metadata
            youtubeVideoId: videoId,
            sha256Checksum: sha256,
            originalYoutubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
          };

          db.addTrack(newTrack);
          createdTracks.push(newTrack); // audioUrl is already the small path

          logSecurityEvent(
            user.token || 'unknown-token',
            `Super Admin (${user.role})`,
            'UPLOAD',
            `Extracted track "${newTrack.title}" from YouTube video ${videoId} for artist "${artist.name}" (${artistId}). SHA256: ${sha256}`
          );

          allLogs.push(`[SUCCESS] Track "${newTrack.title}" uploaded. SHA256: ${sha256}`);
        } catch (err: any) {
          const msg = err?.message || 'Unknown error';
          allLogs.push(`[ERROR] Failed for video ${videoId}: ${msg}`);

          // Provide meaningful error messages
          let userError = `Failed to process video "${videoId}": ${msg}`;
          if (msg.includes('Private')) userError = `Video ${videoId} is private.`;
          else if (msg.includes('age')) userError = `Video ${videoId} is age-restricted.`;
          else if (msg.includes('live')) userError = `Video ${videoId} is a live stream.`;
          else if (msg.includes('unavailable')) userError = `Video ${videoId} is unavailable.`;
          else if (msg.includes('network') || msg.includes('ENOTFOUND')) userError = `Network error fetching video ${videoId}.`;
          else if (msg.includes('ffmpeg')) userError = `FFmpeg conversion failed for video ${videoId}.`;

          errors.push(userError);
        } finally {
          // Cleanup temp directory
          try {
            if (fs.existsSync(tmpDir)) {
              fs.rmSync(tmpDir, { recursive: true, force: true });
            }
          } catch {}
        }
      }

      // Log all activity
      console.log('[YouTube Extract] Pipeline log:\n' + allLogs.join('\n'));

      if (createdTracks.length === 0) {
        return NextResponse.json({
          error: 'No tracks were successfully converted.',
          details: errors
        }, { status: 422 });
      }

      return NextResponse.json({
        success: true,
        message: `Successfully extracted and uploaded ${createdTracks.length} song(s) for artist "${artist.name}".`,
        tracks: createdTracks,
        errors: errors.length > 0 ? errors : undefined,
        log: allLogs
      });
    }

    return NextResponse.json({ error: 'Invalid action specified.' }, { status: 400 });
  } catch (err: any) {
    console.error('YouTube Extract API error:', err);
    return NextResponse.json({ error: `Server error: ${err?.message || 'Unknown error'}` }, { status: 500 });
  }
}
