import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/rbac';
import { db } from '@/lib/db';
import { dbSupabase } from '@/lib/dbSupabase';
import { logSecurityEvent } from '@/lib/audit';
import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import os from 'os';
import dns from 'dns';
import https from 'https';

// Configure Google DNS to bypass local ISP blocking (e.g. Airtel blocking masstamilan)
dns.setServers(['8.8.8.8']);

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


// ─── Language detection from Spotify metadata ─────────────────────────────
const KNOWN_LANGUAGES = [
  'tamil', 'hindi', 'telugu', 'malayalam', 'kannada',
  'bengali', 'marathi', 'punjabi', 'gujarati', 'odia',
  'english', 'spanish', 'french', 'korean', 'japanese',
];

function detectLanguage(title: string, album: string = ''): string {
  const combined = `${title} ${album}`.toLowerCase();
  for (const lang of KNOWN_LANGUAGES) {
    if (combined.includes(lang)) return lang;
  }
  return '';
}

// ─── Build multiple search queries (language-aware) ────────────────────────
function buildSearchQueries(artist: string, title: string, album = '', duration?: number): string[] {
  const lang = detectLanguage(title, album);

  // Strip Spotify's "(From "Movie" Language)" suffix for a shorter clean title
  const cleanTitle = title
    .replace(/\s*\(from\s+"[^"]+"\s*\w*\)\s*$/i, '')
    .replace(/\s*-\s*[^-]+$/, '') // strip " - The Pain of Love" style suffixes only when lang is detected
    .trim();

  const queries: string[] = [];

  if (lang) {
    // Language-specific queries are HIGHEST priority
    queries.push(`${artist} ${cleanTitle || title} ${lang} official audio`);
    queries.push(`${cleanTitle || title} ${lang} ${artist}`);
    queries.push(`${artist} ${cleanTitle || title} ${lang}`);
  }

  // Generic fallbacks
  queries.push(`"${title}" "${artist}" audio`);
  if (cleanTitle && cleanTitle !== title) queries.push(`${artist} ${cleanTitle} official audio`);
  queries.push(`${artist} ${title}`);
  queries.push(`${title} ${artist} lyrics`);

  return queries;
}

// ─── Score how well a YouTube video matches the target song ────────────────
function scoreMatch(
  videoTitle: string,
  targetTitle: string,
  targetArtist: string,
  targetLang = '',
): number {
  const vt = videoTitle.toLowerCase();
  const tt = targetTitle.toLowerCase();
  const ta = targetArtist.toLowerCase();
  let score = 0;

  // Word overlap between Spotify title and YouTube title
  const words = tt.split(/\s+/).filter(w => w.length > 2);
  const matched = words.filter(w => vt.includes(w));
  score += (matched.length / Math.max(words.length, 1)) * 50;

  // Artist name match bonus
  const artistWords = ta.split(/\s+/).filter(w => w.length > 1);
  if (artistWords.some(w => vt.includes(w))) score += 20;

  // ── Language matching (most important for Indian/multilingual songs) ──
  if (targetLang) {
    if (vt.includes(targetLang)) {
      score += 35; // Big bonus for correct language
    } else {
      // Penalise if video is in a DIFFERENT known language
      const wrongLang = KNOWN_LANGUAGES.find(l => l !== targetLang && vt.includes(l));
      if (wrongLang) score -= 50; // Heavy penalty for wrong language
    }
  }

  // Penalise covers, remixes, reactions, karaoke
  if (/\b(cover|remix|karaoke|reaction|instrumental|tribute|parody)\b/i.test(vt)) score -= 30;

  // Bonus for official indicators
  if (/\b(official|audio|lyrics|hd|hq|full\s+song)\b/i.test(vt)) score += 10;

  return score;
}

// ─── YouTube Search ────────────────────────────────────────────────────────
async function findYouTubeVideoId(
  searchQuery: string,
  artist = '',
  title = '',
  album = '',
  expectedDurationSec = 0,
): Promise<string | null> {
  const lang = detectLanguage(title, album);

  // ── Strategy A: yt-dlp (local binary, most accurate) ──────────────────
  if (fs.existsSync(YTDLP_PATH)) {
    // Try language-aware queries first, then generic ones
    const queries = buildSearchQueries(artist, title, album, expectedDurationSec);
    // Always include the original query first
    const allQueries = [searchQuery, ...queries.filter(q => q !== searchQuery)];

    for (const q of allQueries) {
      try {
        const { stdout } = await execFileAsync(YTDLP_PATH, [
          '--dump-json', '--no-playlist', '--no-warnings', '--no-cache-dir',
          '--default-search', 'ytsearch',
          `ytsearch5:${q}`,  // Get top 5 results to pick the best one
        ], { timeout: 30000, maxBuffer: 8 * 1024 * 1024 });

        const lines = stdout.trim().split('\n').filter(Boolean);
        const results: { id: string; score: number; dur: number }[] = [];

        for (const line of lines) {
          try {
            const info = JSON.parse(line);
            if (!info.id) continue;

            const dur = info.duration || 0;
            // Duration check: if we know expected duration, skip videos way off (>45s diff)
            if (expectedDurationSec > 0 && Math.abs(dur - expectedDurationSec) > 45) continue;

            const score = scoreMatch(info.title || '', title || searchQuery, artist, lang);
            results.push({ id: info.id, score, dur });
          } catch { /* bad JSON line */ }
        }

        if (results.length > 0) {
          // Pick highest-scoring result
          results.sort((a, b) => b.score - a.score);
          const best = results[0];
          console.log(`[youtube-search] ✅ Best match: ${best.id} (score: ${best.score})`);
          return best.id;
        }
      } catch { /* try next query */ }
    }
  }

  // ── Strategy B: YouTube HTML scraping fallback ─────────────────────────
  const queriesToTry = buildSearchQueries(artist, title, album, expectedDurationSec);
  queriesToTry.unshift(searchQuery);

  for (const q of queriesToTry.slice(0, 3)) { // Try top 3 queries
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) continue;
      const html = await res.text();

      // Extract video IDs with their titles
      const videoIdRegex = /"videoId":"([^"]+)"/g;
      const titleRegex = /"title":{"runs":\[{"text":"([^"]+)"/g;

      const videoIds: string[] = [];
      let m: RegExpExecArray | null;
      while ((m = videoIdRegex.exec(html)) !== null) {
        if (!videoIds.includes(m[1])) videoIds.push(m[1]);
        if (videoIds.length >= 8) break;
      }

      if (videoIds.length === 0) continue;

      // Try to extract titles for scoring
      const titles: string[] = [];
      while ((m = titleRegex.exec(html)) !== null) {
        titles.push(m[1]);
        if (titles.length >= 8) break;
      }

      if (titles.length > 0 && (artist || title)) {
        // Score each video by title match
        const scored = videoIds.map((id, idx) => ({
          id,
          score: scoreMatch(titles[idx] || '', title || searchQuery, artist, lang),
        }));
        scored.sort((a, b) => b.score - a.score);
        // Only return if score is reasonable (not a garbage match)
        if (scored[0].score > -10) return scored[0].id;
      }

      // Fallback: return first result
      return videoIds[0] || null;
    } catch { /* try next query */ }
  }


  return null;
}

// ─── Masstamilan Scraper Integration ─────────────────────────────────────────

function editDistance(s1: string, s2: string): number {
  s1 = s1.toLowerCase();
  s2 = s2.toLowerCase();
  const costs = new Array();
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) costs[j] = j;
      else {
        if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}

function similarity(s1: string, s2: string): number {
  let longer = s1;
  let shorter = s2;
  if (s1.length < s2.length) {
    longer = s2;
    shorter = s1;
  }
  const longerLength = longer.length;
  if (longerLength === 0) return 1.0;
  return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength.toString());
}

function cleanStringForMatch(str: string): string {
  return str.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/nn+/g, 'n')
    .replace(/tt+/g, 't')
    .replace(/th/g, 't')
    .replace(/dh/g, 'd')
    .replace(/sh/g, 's')
    .replace(/ee/g, 'i')
    .replace(/oo/g, 'u')
    .replace(/y/g, 'i')
    .trim();
}

function scoreMatchMasstamilan(text: string, query: string): number {
  const cq = cleanStringForMatch(query);
  const ct = cleanStringForMatch(text);
  if (cq === ct) return 100;
  if (ct.includes(cq) || cq.includes(ct)) return 95;
  return similarity(cq, ct) * 100;
}

function fetchHtmlByDns(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    dns.resolve4(parsed.hostname, (err, addresses) => {
      if (err || !addresses || addresses.length === 0) {
        return reject(new Error(`DNS resolution failed for ${parsed.hostname}: ${err?.message}`));
      }
      const ip = addresses[0];
      const options = {
        hostname: ip,
        port: 443,
        path: parsed.pathname + parsed.search,
        method: 'GET',
        headers: {
          'Host': parsed.hostname,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        rejectUnauthorized: false
      };
      const req = https.request(options, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          let loc = res.headers.location || '';
          if (!loc.startsWith('http')) {
            loc = new URL(loc, url).href;
          }
          return resolve(fetchHtmlByDns(loc));
        }
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
      });
      req.on('error', reject);
      req.end();
    });
  });
}

function downloadFileByDns(url: string, destPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    dns.resolve4(parsed.hostname, (err, addresses) => {
      if (err || !addresses || addresses.length === 0) {
        return reject(new Error(`DNS resolution failed for ${parsed.hostname}: ${err?.message}`));
      }
      const ip = addresses[0];
      const options = {
        hostname: ip,
        port: 443,
        path: parsed.pathname + parsed.search,
        method: 'GET',
        headers: {
          'Host': parsed.hostname,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://www.masstamilan.dev/',
        },
        rejectUnauthorized: false
      };
      
      const req = https.request(options, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          let loc = res.headers.location || '';
          if (!loc.startsWith('http')) {
            loc = new URL(loc, url).href;
          }
          return resolve(downloadFileByDns(loc, destPath));
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`Status ${res.statusCode} downloading ${url}`));
        }
        const fileStream = fs.createWriteStream(destPath);
        res.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close();
          resolve(destPath);
        });
      });
      req.on('error', reject);
      req.end();
    });
  });
}

async function findAndDownloadFromMasstamilan(songTitle: string, artistName: string): Promise<string | null> {
  try {
    const searchUrl = `https://www.masstamilan.dev/search?keyword=${encodeURIComponent(songTitle)}`;
    const searchHtml = await fetchHtmlByDns(searchUrl);
    
    const albumLinks: { href: string; text: string }[] = [];
    const regex = /<a\s+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
    let match;
    while ((match = regex.exec(searchHtml)) !== null) {
      const href = match[1];
      const text = match[2].replace(/\s+/g, ' ').trim();
      if (href.startsWith('/') && href.includes('-songs') && !albumLinks.some(a => a.href === href)) {
        const cleanHref = href.split('?')[0];
        albumLinks.push({ href: cleanHref, text });
      }
    }
    
    if (albumLinks.length === 0) return null;
    
    for (const album of albumLinks.slice(0, 3)) {
      const albumUrl = `https://www.masstamilan.dev${album.href}`;
      const albumHtml = await fetchHtmlByDns(albumUrl);
      
      const songLinks: { href: string; text: string }[] = [];
      const songRegex = /<a\s+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
      let sMatch;
      while ((sMatch = songRegex.exec(albumHtml)) !== null) {
        const href = sMatch[1];
        const text = sMatch[2].replace(/\s+/g, ' ').trim();
        if (href.includes('-mp3-song')) {
          const cleanHref = href.split('?')[0];
          songLinks.push({ href: cleanHref, text });
        }
      }
      
      const scoredSongs = songLinks.map(s => {
        const score = scoreMatchMasstamilan(s.text, songTitle);
        return { ...s, score };
      });
      
      scoredSongs.sort((a, b) => b.score - a.score);
      const bestSong = scoredSongs[0];
      
      if (bestSong && bestSong.score > 60) {
        const songUrl = `https://www.masstamilan.dev${bestSong.href}`;
        const songHtml = await fetchHtmlByDns(songUrl);
        
        const dlRegex = /<a\s+class="dlink"\s+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
        let dlMatch;
        let url320 = null;
        let url128 = null;
        
        while ((dlMatch = dlRegex.exec(songHtml)) !== null) {
          const href = dlMatch[1];
          const text = dlMatch[2].toLowerCase();
          if (text.includes('zip')) continue; // Skip full album zip downloads
          
          if (text.includes('320kbps') && !url320) {
            url320 = `https://www.masstamilan.dev${href}`;
          } else if (text.includes('128kbps') && !url128) {
            url128 = `https://www.masstamilan.dev${href}`;
          }
          
          if (url320 && url128) break;
        }
        
        const targetDownloadUrl = url320 || url128;
        if (targetDownloadUrl) {
          const tempPath = path.join(os.tmpdir(), `masstamilan_dl_${Date.now()}.mp3`);
          await downloadFileByDns(targetDownloadUrl, tempPath);
          return tempPath;
        }
      }
    }
  } catch (err) {
    console.error('[masstamilan-extractor] Error:', err);
  }
  return null;
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

  let artist: any = null;
  if (artistId !== 'auto') {
    artist = db.getUserById(artistId);
    if (!artist) {
      return new Response(JSON.stringify({ error: `Artist ${artistId} not found` }), { status: 404 });
    }
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
        const expectedDuration = parseInt(item.duration) || 0;

        let currentArtistId = artistId;
        let currentArtistName = artist ? artist.name : '';
        let collaboratorIds: string[] = [];

        if (artistId === 'auto' || !artistId) {
          const rawArtistName = item.artist || 'Unknown Artist';
          const artistNames = rawArtistName.split(',').map((name: string) => name.trim()).filter(Boolean);
          const resolvedIds: string[] = [];

          for (const rawName of artistNames) {
            const cleanNameForEmail = rawName.toLowerCase().replace(/[^a-z0-9]/g, '');
            const generatedEmail = `${cleanNameForEmail}@beato.com`;

            const allUsers = db.getUsers();
            let foundUser = allUsers.find(u => 
              u.name.toLowerCase() === rawName.toLowerCase() ||
              u.email.toLowerCase() === generatedEmail.toLowerCase()
            );

            if (!foundUser) {
              const generatedId = `artist-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
              const newUser = {
                id: generatedId,
                name: rawName,
                email: generatedEmail,
                passwordHash: '$2a$10$T8Z.XG9Kq0m1v1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1.1',
                role: 'ARTIST' as const,
                isActive: true,
                bio: `${rawName} is an automatically created creator on Beato from Spotify imports.`,
                country: 'IN',
                avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
                followers: Math.floor(Math.random() * 1000) + 100,
                following: 0,
                likedSongs: [],
                savedAlbums: [],
                followedArtists: [],
                playlists: [],
              };
              const savedUser = db.saveUser(newUser);
              db.updateUserRole(savedUser.id, 'ARTIST');
              foundUser = savedUser;
              console.log(`[spotify-convert-stream] Automatically created collaborator artist: "${rawName}" (${generatedEmail}) with ID: ${savedUser.id}`);
            } else {
              if ((foundUser.role as any) !== 'ARTIST' && (foundUser.role as any) !== 'artist') {
                db.updateUserRole(foundUser.id, 'ARTIST');
                foundUser.role = 'ARTIST';
              }
              console.log(`[spotify-convert-stream] Found existing collaborator artist: "${rawName}" with ID: ${foundUser.id}`);
            }
            resolvedIds.push(foundUser.id);
          }

          currentArtistId = resolvedIds[0] || 'auto';
          currentArtistName = rawArtistName; // Keep the full original string (e.g. Sooraj Santhosh, Chinmayi...) so that it displays perfectly in listings
          collaboratorIds = resolvedIds;
        }

        // Try Masstamilan first (direct high quality download)
        let videoId = item.youtubeVideoId || null;
        let mp3Path: string | null = null;
        let isMasstamilan = false;

        try {
          send({
            type: 'track_progress',
            trackIndex: i, total, title,
            step: 'searching',
            stepNum: 1, totalSteps: 5,
            percentage: Math.round(((i / total) + (1 / total) * 0.05) * 100),
            message: `[${trackNum}/${total}] 🔍 Searching Masstamilan: ${title}`
          });
          const dlPath = await findAndDownloadFromMasstamilan(title, currentArtistName);
          if (dlPath) {
            mp3Path = dlPath;
            isMasstamilan = true;
            videoId = `masstamilan-${item.spotifyId || Date.now()}`;
            console.log(`[spotify-convert-stream] Masstamilan direct download success: ${mp3Path}`);
          }
        } catch (masstamilanErr: any) {
          console.error('[spotify-convert-stream] Masstamilan fetch failed, falling back to YouTube:', masstamilanErr?.message);
        }

        // If not found on Masstamilan, proceed to YouTube flow
        if (!mp3Path) {
          // ── Step 1: Resolve YouTube Video ID ──────────────────────────────────
          send({
            type: 'track_progress',
            trackIndex: i, total, title,
            step: 'searching',
            stepNum: 1, totalSteps: 5,
            percentage: Math.round(((i / total) + (1 / total) * 0.1) * 100),
            message: `[${trackNum}/${total}] 🔍 Finding on YouTube: ${title}`
          });

          if (!videoId) {
            const artistQuery = item.artist || '';
            const album = item.album || item.albumName || '';
            const detectedLang = detectLanguage(title, album);
            const searchQuery = item.youtubeSearchQuery || `${artistQuery} ${title}${detectedLang ? ' ' + detectedLang : ''} official audio`;
            console.log(`[spotify-convert-stream] 🔍 Searching: "${title}" by "${artistQuery}" lang=${detectedLang || 'unknown'} (${expectedDuration}s)`);
            videoId = await findYouTubeVideoId(searchQuery, artistQuery, title, album, expectedDuration);
            if (videoId) {
              console.log(`[spotify-convert-stream] ✅ Found video: https://youtu.be/${videoId}`);
            }
          }

          if (!videoId) {
            const errMsg = `Could not find "${title}" on YouTube or Masstamilan — skipped.`;
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
                artistId: currentArtistId,
                artistName: currentArtistName,
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
                `Registered cloud stream for Spotify track "${title}" (YouTube: ${videoId}) for artist "${currentArtistName}"`
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
        }

        // ─── Full Download Mode ───────────────────────────────────────────────
        const safeId = sanitizeFilename(videoId);
        const tmpDir = path.join(os.tmpdir(), `beato-sp-${Date.now()}-${safeId}`);
        fs.mkdirSync(tmpDir, { recursive: true });

        try {
          const rawTemplate = path.join(tmpDir, `${safeId}.%(ext)s`);
          const downloadMp3Path = path.join(tmpDir, `${safeId}.mp3`);

          if (!isMasstamilan) {
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

            mp3Path = downloadMp3Path;
          } else {
            if (!mp3Path) throw new Error('Masstamilan download path is missing');
            // Move downloaded Masstamilan MP3 to the tmpDir
            const newMp3Path = path.join(tmpDir, `${safeId}.mp3`);
            fs.renameSync(mp3Path, newMp3Path);
            mp3Path = newMp3Path;
          }

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

          let mp3Duration = await getAudioDuration(mp3Path);
          if (mp3Duration < 1) {
            mp3Duration = expectedDuration || 210;
          }

          if (expectedDuration > 0 && Math.abs(mp3Duration - expectedDuration) > 50 && !isMasstamilan) {
            throw new Error(`Duration mismatch: Downloaded ${Math.round(mp3Duration)}s, but Spotify expected ${expectedDuration}s`);
          }

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

          // Upload to Supabase Storage so Vercel (and localhost) can both stream it
          let audioUrl = `/uploads/${destFilename}`; // local fallback
          try {
            const fileBuffer = fs.readFileSync(destPath);
            const supabasePublicUrl = await dbSupabase.uploadAudio(fileBuffer, destFilename, 'audio/mpeg');
            audioUrl = supabasePublicUrl;
            console.log(`[spotify-convert-stream] Uploaded to Supabase Storage: ${audioUrl}`);
          } catch (storageErr: any) {
            console.error('[spotify-convert-stream] Supabase Storage upload failed, falling back to local URL:', storageErr?.message);
          }

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
            artistId: currentArtistId,
            artistName: currentArtistName,
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
            `Extracted Spotify track "${title}" via YouTube ${videoId} for artist "${currentArtistName}". SHA256: ${sha256}`
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
        message: `Successfully extracted ${createdTracks.length}/${total} Spotify track(s).`,
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
