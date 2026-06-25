import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { exec, execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

// Helper to search YouTube for a song and return video ID
async function searchYoutube(query: string): Promise<string | null> {
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      }
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
    console.error('YouTube search error:', err);
    return null;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const trackId = searchParams.get('id');
  
  if (!trackId) {
    return NextResponse.json({ error: 'Track ID is required' }, { status: 400 });
  }

  // Find track
  const tracks = db.getTracks();
  const track = tracks.find(t => t.id === trackId);
  if (!track) {
    return NextResponse.json({ error: 'Track not found' }, { status: 404 });
  }

  // If the audio URL is already a resolved direct URL that doesn't need proxying
  if (track.audioUrl && !track.audioUrl.startsWith('/api/track/stream')) {
    return NextResponse.redirect(new URL(track.audioUrl, request.url));
  }

  // Search YouTube
  const query = `${track.title} ${track.artistName}`;
  console.log(`Stream route: Searching YouTube for: "${query}"`);
  const videoId = await searchYoutube(query);
  if (!videoId) {
    console.error(`Stream route: Video not found on YouTube for: "${query}"`);
    return NextResponse.json({ error: 'Song not found on streaming service' }, { status: 404 });
  }

  const ytDlpPath = path.join(process.cwd(), 'yt-dlp.exe');
  
  try {
    // 1. Get the direct streaming URL
    const cmd = `"${ytDlpPath}" -g -f "bestaudio[ext=m4a]/bestaudio" "https://www.youtube.com/watch?v=${videoId}"`;
    const streamUrl = execSync(cmd, { encoding: 'utf8' }).trim();
    
    if (!streamUrl) {
      throw new Error('Empty stream URL returned from yt-dlp');
    }

    console.log(`Stream route: Successfully resolved stream URL for "${track.title}"`);

    // 2. Start downloading the track in the background so it caches locally
    const filename = `spotify_imported_${trackId}.m4a`;
    const publicDir = path.join(process.cwd(), 'public');
    const audioUploadDir = path.join(publicDir, 'uploads', 'audio');
    if (!fs.existsSync(audioUploadDir)) {
      fs.mkdirSync(audioUploadDir, { recursive: true });
    }
    const filepath = path.join(audioUploadDir, filename);

    // Run the download in the background asynchronously
    const downloadCmd = `"${ytDlpPath}" -f "bestaudio[ext=m4a]/bestaudio" -o "${filepath}" "https://www.youtube.com/watch?v=${videoId}"`;
    
    exec(downloadCmd, (err) => {
      if (err) {
        console.error(`Background download failed for ${track.title}:`, err);
      } else {
        console.log(`Successfully cached track "${track.title}" locally!`);
        // Update database to point to the local file
        const localAudioUrl = `/uploads/audio/${filename}`;
        db.updateTrackAudioUrl(trackId, localAudioUrl);
      }
    });

    // 3. Redirect the browser immediately to the direct stream URL
    return NextResponse.redirect(streamUrl);

  } catch (err: any) {
    console.error('Streaming route error:', err.message);
    // Graceful fallback to default/SoundHelix if everything fails
    const helixIndex = Math.floor(Math.random() * 16) + 1;
    const fallbackUrl = `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${helixIndex}.mp3`;
    return NextResponse.redirect(fallbackUrl);
  }
}
