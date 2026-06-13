import { Track, Artist } from '@/types';

// ─── Mood fingerprints ───────────────────────────────────────────────────────
const MOOD_GENRES: Record<string, string[]> = {
  happy:    ['Pop', 'Dance Pop', 'Dance', 'R&B', 'Reggae'],
  sad:      ['Indie', 'Indie Rock', 'Alternative', 'Dream Pop', 'Lo-Fi'],
  energetic:['Electronic', 'Hip-Hop', 'Dance', 'Metal', 'Rock'],
  chill:    ['Ambient', 'Lo-Fi', 'Jazz', 'Classical', 'Dream Pop'],
  romantic: ['R&B', 'Pop', 'Soul', 'Jazz', 'Classical'],
  focus:    ['Classical', 'Ambient', 'Lo-Fi', 'Synth Wave', 'Electronic'],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function popularityScore(track: Track): number {
  // Normalize plays (max ~10M) + recency bonus (current year = 1.0, each year older = 0.9x)
  const playScore = Math.log10(Math.max(1, track.plays)) / 7;
  const ageScore = Math.pow(0.9, Math.max(0, new Date().getFullYear() - track.year));
  return (playScore * 0.7 + ageScore * 0.3);
}

function noveltyScore(track: Track, listenedIds: Set<string>): number {
  return listenedIds.has(track.id) ? 0.1 : 1.0;
}

function genreAffinity(track: Track, genreScores: Record<string, number>): number {
  const maxScore = Math.max(1, ...Object.values(genreScores));
  return (genreScores[track.genre] ?? 0) / maxScore;
}

// ─── Collaborative Filtering (simulated) ─────────────────────────────────────
function collaborativeScore(track: Track, likedTracks: Track[]): number {
  // Find tracks with similar genre/artist to liked tracks
  let sc = 0;
  for (const liked of likedTracks) {
    if (liked.artistId === track.artistId) sc += 2;
    else if (liked.genre === track.genre) sc += 1;
  }
  return Math.min(1, sc / Math.max(1, likedTracks.length * 2));
}

// ─── Recommendation Engine ───────────────────────────────────────────────────

export function getDailyMix(
  likedTrackIds: string[],
  genreScores: Record<string, number>,
  allTracks: Track[],
  count = 25
): Track[] {
  const likedSet = new Set(likedTrackIds);
  const likedTracks = allTracks.filter(t => likedSet.has(t.id));
  const listenedIds = new Set(likedTrackIds);

  const scored = allTracks.map(track => {
    const s = (
      genreAffinity(track, genreScores) * 0.35 +
      collaborativeScore(track, likedTracks) * 0.30 +
      popularityScore(track) * 0.20 +
      noveltyScore(track, listenedIds) * 0.15
    );
    return { track, score: s + Math.random() * 0.05 }; // small random for variety
  });

  return scored.sort((a, b) => b.score - a.score).slice(0, count).map(x => x.track);
}

export function getDiscoverWeekly(
  likedTrackIds: string[],
  listenedIds: string[],
  allTracks: Track[],
  count = 30
): Track[] {
  const heard = new Set([...likedTrackIds, ...listenedIds]);
  const candidates = allTracks.filter(t => !heard.has(t.id));

  const likedTracks = allTracks.filter(t => likedTrackIds.includes(t.id));
  const scored = candidates.map(track => ({
    track,
    score: collaborativeScore(track, likedTracks) * 0.5 + popularityScore(track) * 0.3 + Math.random() * 0.2,
  }));

  return scored.sort((a, b) => b.score - a.score).slice(0, count).map(x => x.track);
}

export function getReleaseRadar(
  followedArtistIds: string[],
  allTracks: Track[],
  count = 20
): Track[] {
  const recentYear = new Date().getFullYear();
  const fromFollowed = allTracks.filter(t =>
    followedArtistIds.includes(t.artistId) && t.year >= recentYear - 1
  );
  const rest = allTracks.filter(t => t.year >= recentYear).slice(0, count - fromFollowed.length);
  return shuffle([...fromFollowed, ...rest]).slice(0, count);
}

export function getMoodRecommendations(
  mood: string,
  allTracks: Track[],
  count = 25
): Track[] {
  const targetGenres = MOOD_GENRES[mood.toLowerCase()] ?? [];
  if (targetGenres.length === 0) return shuffle(allTracks).slice(0, count);

  const scored = allTracks.map(t => {
    const genreRank = targetGenres.indexOf(t.genre);
    const sc = genreRank >= 0 ? (targetGenres.length - genreRank) / targetGenres.length : 0;
    return { t, sc: sc + popularityScore(t) * 0.3 + Math.random() * 0.1 };
  });

  return scored.sort((a, b) => b.sc - a.sc).slice(0, count).map(x => x.t);
}

export function getSimilarArtists(
  artistId: string,
  allArtists: Artist[],
  count = 6
): Artist[] {
  const artist = allArtists.find(a => a.id === artistId);
  if (!artist) return allArtists.slice(0, count);

  const scored = allArtists
    .filter(a => a.id !== artistId)
    .map(a => {
      const genreOverlap = a.genres.filter(g => artist.genres.includes(g)).length;
      return { a, sc: genreOverlap * 2 + (a.monthlyListeners / 10_000_000) * 0.5 + Math.random() * 0.5 };
    });

  return scored.sort((a, b) => b.sc - a.sc).slice(0, count).map(x => x.a);
}

export function getTopCharts(
  allTracks: Track[],
  limit = 50
): Track[] {
  return [...allTracks]
    .sort((a, b) => b.plays - a.plays)
    .slice(0, limit);
}

export function getGenreRecommendations(
  genre: string,
  allTracks: Track[],
  count = 20
): Track[] {
  const direct = allTracks.filter(t => t.genre === genre);
  const rest = allTracks.filter(t => t.genre !== genre).sort(() => Math.random() - 0.5);
  return [...direct, ...rest].slice(0, count);
}

export function getDailyMixes(
  likedTrackIds: string[],
  genreScores: Record<string, number>,
  allTracks: Track[]
): { title: string; description: string; tracks: Track[]; gradient: string; emoji: string }[] {
  const topGenres = Object.entries(genreScores).sort((a, b) => b[1] - a[1]).map(([g]) => g);
  const defaultMixes = [
    { title: 'Daily Mix 1', desc: 'Your top artists and more', genre: topGenres[0] || 'Pop', gradient: 'linear-gradient(135deg, #4c1d95, #7c3aed)', emoji: '🌃' },
    { title: 'Daily Mix 2', desc: 'Discover new favorites', genre: topGenres[1] || 'Electronic', gradient: 'linear-gradient(135deg, #831843, #34d399)', emoji: '🌸' },
    { title: 'Daily Mix 3', desc: 'Energetic picks for you', genre: topGenres[2] || 'Hip-Hop', gradient: 'linear-gradient(135deg, #78350f, #f59e0b)', emoji: '⚡' },
    { title: 'Daily Mix 4', desc: 'Chill & atmospheric', genre: topGenres[3] || 'Ambient', gradient: 'linear-gradient(135deg, #064e3b, #10b981)', emoji: '🌊' },
  ];

  return defaultMixes.map(mix => ({
    title: mix.title,
    description: mix.desc,
    emoji: mix.emoji,
    gradient: mix.gradient,
    tracks: getDailyMix(likedTrackIds, { [mix.genre]: 10, ...genreScores }, allTracks, 25),
  }));
}
