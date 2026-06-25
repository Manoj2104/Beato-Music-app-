import { NextRequest, NextResponse } from 'next/server';
import { requireArtist } from '@/lib/rbac';
import { logSecurityEvent } from '@/lib/audit';
import { db } from '@/lib/db';
import { verifyJWT } from '@/lib/jwt';

// Curated list of 100 hit songs for playlist simulation (50 Tamil, 50 English)
const SIMULATED_PLAYLIST_SONGS = [
  // --- Tamil Hits (50) ---
  { title: "Mutta Kalakki", artist: "Ken Karunaas", genre: "Pop" },
  { title: "Arabic Kuthu", artist: "Anirudh Ravichander", genre: "Dance" },
  { title: "Rowdy Baby", artist: "Dhanush & Dhee", genre: "Dance" },
  { title: "Hukum", artist: "Anirudh Ravichander", genre: "Hip-Hop" },
  { title: "Badass", artist: "Anirudh Ravichander", genre: "Hip-Hop" },
  { title: "Naa Ready", artist: "Vijay & Anirudh", genre: "Dance" },
  { title: "Kaavaalaa", artist: "Shilpa Rao & Anirudh", genre: "Dance" },
  { title: "Vaseegara", artist: "Bombay Jayashri", genre: "Classical" },
  { title: "Munbe Vaa", artist: "Shreya Ghoshal", genre: "Indie" },
  { title: "Vizhiyil", artist: "Haricharan", genre: "Indie" },
  { title: "Anbil Avan", artist: "Deval", genre: "Pop" },
  { title: "Kanja Poovu Kannala", artist: "Yuvan Shankar Raja", genre: "Indie" },
  { title: "Ennodu Nee Irundhal", artist: "Sid Sriram", genre: "Indie" },
  { title: "New York Nagaram", artist: "A.R. Rahman", genre: "Ambient" },
  { title: "Enna Sona", artist: "Arijit Singh", genre: "Pop" },
  { title: "Kadhal Sadugudu", artist: "S.P.B. Charan", genre: "Pop" },
  { title: "Pachai Nirame", artist: "Hariharan", genre: "Pop" },
  { title: "Mental Manadhil", artist: "Jonita Gandhi", genre: "Synth Wave" },
  { title: "Snehidhane", artist: "Sadhana Sargam", genre: "Classical" },
  { title: "Aalaporaan Thamizhan", artist: "Kailash Kher", genre: "Pop" },
  { title: "Verithanam", artist: "Vijay", genre: "Dance" },
  { title: "Singappenney", artist: "A.R. Rahman", genre: "Pop" },
  { title: "Theri Baby", artist: "G.V. Prakash", genre: "Pop" },
  { title: "Neethanae", artist: "Shreya Ghoshal", genre: "Indie" },
  { title: "Pookkalae Sattru", artist: "Haricharan", genre: "Indie" },
  { title: "Aathangara Orathil", artist: "G.V. Prakash", genre: "Dance" },
  { title: "Adhaaru Adhaaru", artist: "Anirudh Ravichander", genre: "Dance" },
  { title: "Donu Donu", artist: "Anirudh Ravichander", genre: "Pop" },
  { title: "Why This Kolaveri Di", artist: "Dhanush", genre: "Pop" },
  { title: "Kolaigaran", artist: "Vijay Antony", genre: "Rock" },
  { title: "Kannaana Kanney", artist: "Sid Sriram", genre: "Pop" },
  { title: "Darling Dambakku", artist: "Benny Dayal", genre: "Dance" },
  { title: "Chilla Chilla", artist: "Anirudh Ravichander", genre: "Hip-Hop" },
  { title: "Ranjithame", artist: "Vijay & M.M. Manasi", genre: "Dance" },
  { title: "Thee Thalapathy", artist: "Silambarasan TR", genre: "Rock" },
  { title: "Celebration of Varisu", artist: "Anirudh Ravichander", genre: "Dance" },
  { title: "Jimikki Ponnu", artist: "Anirudh Ravichander", genre: "Dance" },
  { title: "Dippam Dappam", artist: "Anthony Daasan", genre: "Dance" },
  { title: "Rathamaarey", artist: "Anirudh Ravichander", genre: "Indie" },
  { title: "Bloody Sweet", artist: "Anirudh Ravichander", genre: "Rock" },
  { title: "Ordinary Person", artist: "Anirudh Ravichander", genre: "Ambient" },
  { title: "Scuba Diving", artist: "Sid Sriram", genre: "Ambient" },
  { title: "Megham Karukatha", artist: "Dhanush", genre: "Dance" },
  { title: "Thenmozhi", artist: "Santhosh Narayanan", genre: "Pop" },
  { title: "Gundu Malli", artist: "Yuvan Shankar Raja", genre: "Indie" },
  { title: "Hayyoda", artist: "Anirudh Ravichander", genre: "Pop" },
  { title: "Soul of Varisu", artist: "K.S. Chithra", genre: "Classical" },
  { title: "Nira", artist: "Sid Sriram", genre: "Indie" },
  { title: "Oru Manam", artist: "Karthik", genre: "Indie" },
  { title: "Adiye", artist: "Sid Sriram", genre: "Blues" },

  // --- English Hits (50) ---
  { title: "Blinding Lights", artist: "The Weeknd", genre: "Synth Wave" },
  { title: "Shape of You", artist: "Ed Sheeran", genre: "Pop" },
  { title: "Stay", artist: "The Kid LAROI & Justin Bieber", genre: "Pop" },
  { title: "As It Was", artist: "Harry Styles", genre: "Dream Pop" },
  { title: "Flowers", artist: "Miley Cyrus", genre: "Pop" },
  { title: "Cruel Summer", artist: "Taylor Swift", genre: "Pop" },
  { title: "Starboy", artist: "The Weeknd", genre: "R&B" },
  { title: "Perfect", artist: "Ed Sheeran", genre: "Pop" },
  { title: "Believer", artist: "Imagine Dragons", genre: "Rock" },
  { title: "Dynamite", artist: "BTS", genre: "Dance" },
  { title: "Closer", artist: "The Chainsmokers", genre: "Electronic" },
  { title: "Bad Guy", artist: "Billie Eilish", genre: "Electronic" },
  { title: "Levitating", artist: "Dua Lipa", genre: "Dance" },
  { title: "Save Your Tears", artist: "The Weeknd", genre: "Synth Wave" },
  { title: "Sweater Weather", artist: "The Neighbourhood", genre: "Indie" },
  { title: "Someone You Loved", artist: "Lewis Capaldi", genre: "Pop" },
  { title: "Without Me", artist: "Halsey", genre: "Pop" },
  { title: "Heat Waves", artist: "Glass Animals", genre: "Indie" },
  { title: "Radioactive", artist: "Imagine Dragons", genre: "Rock" },
  { title: "Dance Monkey", artist: "Tones and I", genre: "Dance" },
  { title: "Wake Me Up", artist: "Avicii", genre: "Electronic" },
  { title: "Take Me To Church", artist: "Hozier", genre: "Blues" },
  { title: "Rolling in the Deep", artist: "Adele", genre: "Soul" },
  { title: "Someone Like You", artist: "Adele", genre: "Pop" },
  { title: "Thinking Out Loud", artist: "Ed Sheeran", genre: "Pop" },
  { title: "Love Yourself", artist: "Justin Bieber", genre: "Pop" },
  { title: "Sorry", artist: "Justin Bieber", genre: "Pop" },
  { title: "What Do You Mean", artist: "Justin Bieber", genre: "Pop" },
  { title: "Despacito", artist: "Luis Fonsi & Daddy Yankee", genre: "Dance" },
  { title: "Uptown Funk", artist: "Mark Ronson ft. Bruno Mars", genre: "Funk" },
  { title: "Sugar", artist: "Maroon 5", genre: "Pop" },
  { title: "Girls Like You", artist: "Maroon 5", genre: "Pop" },
  { title: "Memories", artist: "Maroon 5", genre: "Pop" },
  { title: "Payphone", artist: "Maroon 5", genre: "Pop" },
  { title: "Maps", artist: "Maroon 5", genre: "Rock" },
  { title: "Animals", artist: "Maroon 5", genre: "Rock" },
  { title: "Don't Wanna Know", artist: "Maroon 5", genre: "Pop" },
  { title: "One More Night", artist: "Maroon 5", genre: "Pop" },
  { title: "Cold", artist: "Maroon 5", genre: "Pop" },
  { title: "Beautiful Mistakes", artist: "Maroon 5", genre: "Pop" },
  { title: "Attention", artist: "Charlie Puth", genre: "R&B" },
  { title: "We Don't Talk Anymore", artist: "Charlie Puth", genre: "Pop" },
  { title: "How Long", artist: "Charlie Puth", genre: "R&B" },
  { title: "Cheating on You", artist: "Charlie Puth", genre: "Pop" },
  { title: "Light Switch", artist: "Charlie Puth", genre: "Pop" },
  { title: "Left and Right", artist: "Charlie Puth ft. Jungkook", genre: "Pop" },
  { title: "See You Again", artist: "Wiz Khalifa ft. Charlie Puth", genre: "Hip-Hop" },
  { title: "Sucker", artist: "Jonas Brothers", genre: "Pop" },
  { title: "Only Human", artist: "Jonas Brothers", genre: "Pop" },
  { title: "I Don't Care", artist: "Ed Sheeran & Justin Bieber", genre: "Pop" }
];

const SIMULATED_COVER_IMAGES = [
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1487180142328-054b783fc471?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1484755560695-a4c7302c5c29?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&h=400&fit=crop',
];

function generateSimulatedLyrics(title: string, artist: string): string {
  return `[Verse 1]
Here in the silence of the night,
We watch the stars fade out of sight.
${title} begins to play,
Washing all our cares away.

[Chorus]
Oh, this is our story, this is our song,
Singing with ${artist} all night long.
Let the rhythm take control,
Feel the music in your soul.

[Verse 2]
The lights go down, the crowd is loud,
Standing tall and standing proud.
Every beat is a step we take,
Every promise that we make.

[Chorus]
Oh, this is our story, this is our song,
Singing with ${artist} all night long.
Let the rhythm take control,
Feel the music in your soul.`;
}

function generateSimulatedTimeline(title: string, artist: string) {
  return [
    { time: '0:00', text: '[Instrumental Intro]' },
    { time: '0:08', text: 'Here in the silence of the night' },
    { time: '0:14', text: 'We watch the stars fade out of sight' },
    { time: '0:19', text: `${title} begins to play` },
    { time: '0:25', text: 'Washing all our cares away' },
    { time: '0:31', text: '[Chorus]' },
    { time: '0:37', text: 'Oh, this is our story, this is our song' },
    { time: '0:43', text: `Singing with ${artist} all night long` },
    { time: '0:49', text: 'Let the rhythm take control' },
    { time: '0:55', text: 'Feel the music in your soul' },
    { time: '1:05', text: '[Instrumental Outro]' }
  ];
}

function extractTrackId(url: string): string | null {
  const match = url.match(/\/track\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

async function fetchSpotifyAudioPreviewUrl(trackId: string): Promise<string | null> {
  const embedUrl = `https://open.spotify.com/embed/track/${trackId}`;
  try {
    const res = await fetch(embedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
      }
    });
    if (!res.ok) return null;
    const html = await res.text();
    const scriptTag = '<script id="__NEXT_DATA__" type="application/json">';
    const idx = html.indexOf(scriptTag);
    if (idx === -1) return null;
    const start = idx + scriptTag.length;
    const end = html.indexOf('</script>', start);
    if (end === -1) return null;
    const jsonStr = html.substring(start, end);
    const parsed = JSON.parse(jsonStr);
    const previewUrl = parsed.props?.pageProps?.state?.data?.entity?.audioPreview?.url;
    return previewUrl || null;
  } catch (e) {
    console.error('Failed to fetch Spotify audio preview:', e);
    return null;
  }
}

function resolveRealAudioUrl(title: string, defaultUrl: string): string {
  const cleanTitle = title.toLowerCase();
  if (cleanTitle.includes('kanave') || cleanTitle.includes('kanavey')) {
    return 'https://archive.org/download/tamil-melody-hits/Kanave-Kanave-MassTamilan.com.mp3';
  }
  if (cleanTitle.includes('mutta') || cleanTitle.includes('kalakki')) {
    return '/uploads/audio/1781170569467-e8a9de15_227b_4bf2_860b_935e8c098445.mp3';
  }
  if (cleanTitle.includes('aathangara') || cleanTitle.includes('orathil')) {
    return 'https://archive.org/download/tamil-melody-hits/Aathangara-Orathil.mp3';
  }
  if (cleanTitle.includes('adiye')) {
    return 'https://archive.org/download/tamil-melody-hits/Adiye.mp3';
  }
  return defaultUrl;
}

export async function POST(request: NextRequest) {
  // Guard the endpoint: require ARTIST (or higher role)
  const rbacCheck = await requireArtist(request);
  if (!rbacCheck.authorized) {
    return NextResponse.json(
      { error: rbacCheck.message || 'Forbidden' },
      { status: rbacCheck.status || 403 }
    );
  }

  const artistUser = rbacCheck.user;
  if (!artistUser || artistUser.email !== 'manoj2104s@gmail.com') {
    return NextResponse.json({ error: 'Access restricted to system administrator' }, { status: 403 });
  }

  const payload = await verifyJWT(artistUser.token);
  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { type } = body;

    // Manoj's target IDs
    const targetArtistId = 'user-1781170074483';
    const targetArtistName = 'Manoj';

    if (type === 'track') {
      const { title, artistName, coverImage, spotifyUrl } = body;
      if (!title) {
        return NextResponse.json({ error: 'Title is required for single track imports' }, { status: 400 });
      }

      const newTrackId = `track-uploaded-${Date.now()}`;
      const audioUrl = `/api/track/stream?id=${newTrackId}`;

      const lyricsText = generateSimulatedLyrics(title, artistName || 'Spotify Artist');
      const timeline = generateSimulatedTimeline(title, artistName || 'Spotify Artist');

      const newTrack = {
        id: newTrackId,
        title,
        artistId: targetArtistId,
        artistName: artistName || targetArtistName,
        albumId: 'album-uploads',
        albumName: 'Singles',
        coverImage: coverImage || SIMULATED_COVER_IMAGES[Math.floor(Math.random() * SIMULATED_COVER_IMAGES.length)],
        duration: Math.floor(180 + Math.random() * 120),
        audioUrl,
        genre: 'Pop',
        year: new Date().getFullYear(),
        plays: 0,
        liked: false,
        explicit: false,
        trackNumber: 1,
        lyrics: lyricsText,
        uploadedBy: artistUser.email,
        uploadedAt: new Date().toISOString(),
        status: 'pending' as const,
      };

      // Save to database
      const savedTrack = db.addTrack(newTrack);
      db.saveTrackLyrics({
        trackId: newTrack.id,
        artistId: targetArtistId,
        text: lyricsText,
        timeline,
      });

      logSecurityEvent(
        artistUser.token,
        targetArtistName,
        'UPLOAD',
        `Sample Imported Spotify Track "${newTrack.title}" by "${newTrack.artistName}"`
      );

      return NextResponse.json({
        success: true,
        message: 'Track imported successfully',
        track: savedTrack
      });

    } else if (type === 'playlist') {
      const { playlistTitle, coverImage } = body;
      const importedTracks = [];

      // Create 100 songs sequentially
      for (let i = 0; i < 100; i++) {
        const baseSong = SIMULATED_PLAYLIST_SONGS[i % SIMULATED_PLAYLIST_SONGS.length];
        
        // Randomize title slightly if we loop to keep ids completely unique
        const loopIndex = Math.floor(i / SIMULATED_PLAYLIST_SONGS.length);
        const title = loopIndex > 0 ? `${baseSong.title} (Part ${loopIndex + 1})` : baseSong.title;
        const artist = baseSong.artist;
        const genre = baseSong.genre;

        const cover = coverImage || SIMULATED_COVER_IMAGES[(i + loopIndex) % SIMULATED_COVER_IMAGES.length];
        const newTrackId = `track-uploaded-${Date.now()}-${i}`;
        const audioUrl = `/api/track/stream?id=${newTrackId}`;
        const lyricsText = generateSimulatedLyrics(title, artist);
        const timeline = generateSimulatedTimeline(title, artist);

        const newTrack = {
          id: newTrackId,
          title,
          artistId: targetArtistId,
          artistName: artist,
          albumId: 'album-uploads',
          albumName: playlistTitle || 'Singles',
          coverImage: cover,
          duration: Math.floor(180 + Math.random() * 120),
          audioUrl,
          genre,
          year: new Date().getFullYear(),
          plays: 0,
          liked: false,
          explicit: false,
          trackNumber: i + 1,
          lyrics: lyricsText,
          uploadedBy: artistUser.email,
          uploadedAt: new Date().toISOString(),
          status: 'pending' as const,
        };

        const savedTrack = db.addTrack(newTrack);
        db.saveTrackLyrics({
          trackId: newTrack.id,
          artistId: targetArtistId,
          text: lyricsText,
          timeline,
        });

        importedTracks.push(savedTrack);
      }

      logSecurityEvent(
        artistUser.token,
        targetArtistName,
        'UPLOAD',
        `Sample Imported Spotify Playlist "${playlistTitle}" with 100 tracks`
      );

      return NextResponse.json({
        success: true,
        message: 'Playlist imported successfully',
        tracksCount: importedTracks.length
      });

    } else {
      return NextResponse.json({ error: 'Invalid import type' }, { status: 400 });
    }

  } catch (err: any) {
    console.error('Sample Upload API error:', err);
    return NextResponse.json({ error: 'Server error processing sample upload' }, { status: 500 });
  }
}
