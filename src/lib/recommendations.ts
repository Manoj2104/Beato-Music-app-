import { Track, Artist } from '@/types';

// Helper to generate a stable pseudo-random seed between 0 and 1 for a given string
export function getUserSeed(userId: string | undefined, salt = ''): number {
  if (!userId) return Math.random();
  const str = userId + salt;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash % 1000) / 1000;
}

// Mood fingerprints
export const MOOD_GENRES: Record<string, string[]> = {
  happy:    ['Pop', 'Dance Pop', 'Dance', 'R&B', 'Reggae'],
  sad:      ['Indie', 'Indie Rock', 'Alternative', 'Dream Pop', 'Lo-Fi', 'Sad'],
  energetic:['Electronic', 'Hip-Hop', 'Dance', 'Metal', 'Rock'],
  chill:    ['Ambient', 'Lo-Fi', 'Jazz', 'Classical', 'Dream Pop'],
  romantic: ['R&B', 'Pop', 'Soul', 'Jazz', 'Classical'],
  focus:    ['Classical', 'Ambient', 'Lo-Fi', 'Synth Wave', 'Electronic'],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function popularityScore(track: Track): number {
  const playScore = Math.log10(Math.max(1, track.plays)) / 7;
  const ageScore = Math.pow(0.9, Math.max(0, new Date().getFullYear() - track.year));
  return (playScore * 0.7 + ageScore * 0.3);
}

function noveltyScore(track: Track, listenedIds: Set<string>): number {
  return listenedIds.has(track.id) ? 0.1 : 1.0;
}

function genreAffinity(track: Track, genreScores: Record<string, number>, preferredLanguages: string[] = []): number {
  const maxScore = Math.max(1, ...Object.values(genreScores));
  let score = (genreScores[track.genre] ?? 0) / maxScore;

  // Language / preferred genres bonus
  if (preferredLanguages.length > 0) {
    const trackGenreLower = (track.genre || '').toLowerCase();
    const trackLangLower = ((track as any).language || '').toLowerCase();
    const hasLangMatch = preferredLanguages.some(lang => 
      trackGenreLower.includes(lang) || trackLangLower.includes(lang)
    );
    if (hasLangMatch) {
      score += 0.5; // substantial bonus
    }
  }
  return score;
}

function artistAffinity(track: Track, followedArtistIds: string[]): number {
  return followedArtistIds.includes(track.artistId) ? 1.0 : 0.0;
}

function moodAffinity(track: Track, detectedMood = 'happy'): number {
  const genres = MOOD_GENRES[detectedMood.toLowerCase()] ?? [];
  return genres.includes(track.genre) ? 1.0 : 0.0;
}

function collaborativeScore(track: Track, likedTracks: Track[]): number {
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
  count = 25,
  userId?: string,
  followedArtistIds: string[] = [],
  preferredLanguages: string[] = [],
  detectedMood = 'happy',
  vibeEnergy = 0.5,
  vibeDiscovery = 0.5,
  vibeSimilarity = 0.5,
  skipCounts: Record<string, number> = {}
): Track[] {
  const likedSet = new Set(likedTrackIds);
  const likedTracks = allTracks.filter(t => likedSet.has(t.id));
  const listenedIds = new Set(likedTrackIds);

  const scored = allTracks.map(track => {
    const genreScore = genreAffinity(track, genreScores, preferredLanguages);
    const artistScore = artistAffinity(track, followedArtistIds);
    const moodScore = moodAffinity(track, detectedMood);
    const collabScore = collaborativeScore(track, likedTracks);
    const popScore = popularityScore(track);
    const novelScore = noveltyScore(track, listenedIds);
    const seedScore = getUserSeed(userId, track.id);

    // Energy factor adjustment
    const isHighEnergyGenre = ['Electronic', 'Hip-Hop', 'Dance', 'Metal', 'Rock'].includes(track.genre);
    const energyVibeScore = isHighEnergyGenre ? vibeEnergy : (1.0 - vibeEnergy);

    const skipCount = skipCounts[track.id] || 0;
    const skipPenalty = skipCount >= 3 ? 1.0 : skipCount * 0.3;

    const score = (
      genreScore * 0.20 +
      artistScore * 0.15 +
      moodScore * 0.20 +
      collabScore * (vibeSimilarity * 0.25) +
      popScore * 0.10 +
      novelScore * (vibeDiscovery * 0.20) +
      energyVibeScore * (vibeEnergy * 0.15) +
      seedScore * 0.05
    ) - skipPenalty;

    return { track, score };
  });

  return scored
    .sort((a, b) => b.score - a.score || b.track.id.localeCompare(a.track.id))
    .slice(0, count)
    .map(x => x.track);
}

export function getDiscoverWeekly(
  likedTrackIds: string[],
  listenedIds: string[],
  allTracks: Track[],
  count = 30,
  userId?: string,
  followedArtistIds: string[] = [],
  preferredLanguages: string[] = [],
  detectedMood = 'happy',
  vibeEnergy = 0.5,
  vibeDiscovery = 0.5,
  vibeSimilarity = 0.5,
  skipCounts: Record<string, number> = {}
): Track[] {
  const heard = new Set([...likedTrackIds, ...listenedIds]);
  const candidates = allTracks.filter(t => !heard.has(t.id));

  const likedTracks = allTracks.filter(t => likedTrackIds.includes(t.id));
  const scored = (candidates.length > 0 ? candidates : allTracks).map(track => {
    const artistScore = artistAffinity(track, followedArtistIds);
    const genreScore = genreAffinity(track, {}, preferredLanguages);
    const moodScore = moodAffinity(track, detectedMood);
    const collabScore = collaborativeScore(track, likedTracks);
    const popScore = popularityScore(track);
    const seedScore = getUserSeed(userId, track.id);

    const isHighEnergyGenre = ['Electronic', 'Hip-Hop', 'Dance', 'Metal', 'Rock'].includes(track.genre);
    const energyVibeScore = isHighEnergyGenre ? vibeEnergy : (1.0 - vibeEnergy);

    const skipCount = skipCounts[track.id] || 0;
    const skipPenalty = skipCount >= 3 ? 1.0 : skipCount * 0.3;

    const score = (
      artistScore * 0.20 +
      genreScore * 0.15 +
      moodScore * 0.20 +
      collabScore * (vibeSimilarity * 0.25) +
      popScore * 0.10 +
      energyVibeScore * (vibeEnergy * 0.15) +
      seedScore * 0.10
    ) - skipPenalty;

    return { track, score };
  });

  return scored
    .sort((a, b) => b.score - a.score || b.track.id.localeCompare(a.track.id))
    .slice(0, count)
    .map(x => x.track);
}

export function getReleaseRadar(
  followedArtistIds: string[],
  allTracks: Track[],
  count = 20,
  userId?: string,
  preferredLanguages: string[] = [],
  detectedMood = 'happy',
  vibeEnergy = 0.5,
  skipCounts: Record<string, number> = {}
): Track[] {
  const recentYear = new Date().getFullYear();
  
  const scored = allTracks.map(track => {
    const isNew = track.year >= recentYear - 1 ? 1.0 : 0.0;
    const artistScore = artistAffinity(track, followedArtistIds);
    const genreScore = genreAffinity(track, {}, preferredLanguages);
    const moodScore = moodAffinity(track, detectedMood);
    const seedScore = getUserSeed(userId, track.id);

    const isHighEnergyGenre = ['Electronic', 'Hip-Hop', 'Dance', 'Metal', 'Rock'].includes(track.genre);
    const energyVibeScore = isHighEnergyGenre ? vibeEnergy : (1.0 - vibeEnergy);

    const skipCount = skipCounts[track.id] || 0;
    const skipPenalty = skipCount >= 3 ? 1.0 : skipCount * 0.3;

    const score = (
      isNew * 0.35 +
      artistScore * 0.25 +
      moodScore * 0.15 +
      genreScore * 0.15 +
      energyVibeScore * (vibeEnergy * 0.10) +
      seedScore * 0.05
    ) - skipPenalty;

    return { track, score };
  });

  return scored
    .sort((a, b) => b.score - a.score || b.track.id.localeCompare(a.track.id))
    .slice(0, count)
    .map(x => x.track);
}

export function getMoodRecommendations(
  mood: string,
  allTracks: Track[],
  count = 25,
  userId?: string,
  followedArtistIds: string[] = []
): Track[] {
  const targetGenres = MOOD_GENRES[mood.toLowerCase()] ?? [];
  
  const scored = allTracks.map(track => {
    const genreRank = targetGenres.indexOf(track.genre);
    const moodGenreScore = genreRank >= 0 ? (targetGenres.length - genreRank) / targetGenres.length : 0;
    const artistScore = artistAffinity(track, followedArtistIds);
    const seedScore = getUserSeed(userId, track.id);
    const popScore = popularityScore(track);

    const score = (
      moodGenreScore * 0.45 +
      artistScore * 0.20 +
      popScore * 0.15 +
      seedScore * 0.20
    );

    return { track, score };
  });

  return scored
    .sort((a, b) => b.score - a.score || b.track.id.localeCompare(a.track.id))
    .slice(0, count)
    .map(x => x.track);
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
      return { a, sc: genreOverlap * 2 + (a.monthlyListeners / 10_000_000) * 0.5 };
    });

  return scored.sort((a, b) => b.sc - a.sc || b.a.id.localeCompare(a.a.id)).slice(0, count).map(x => x.a);
}

export function getTopCharts(
  allTracks: Track[],
  limit = 50,
  userId?: string,
  detectedMood = 'happy',
  vibeEnergy = 0.5,
  skipCounts: Record<string, number> = {}
): Track[] {
  const scored = allTracks.map(track => {
    const seed = getUserSeed(userId, track.id);
    const moodScore = moodAffinity(track, detectedMood);
    const isHighEnergyGenre = ['Electronic', 'Hip-Hop', 'Dance', 'Metal', 'Rock'].includes(track.genre);
    const energyVibeScore = isHighEnergyGenre ? vibeEnergy : (1.0 - vibeEnergy);

    const skipCount = skipCounts[track.id] || 0;
    const skipPenalty = (skipCount >= 3 ? 1.0 : skipCount * 0.3) * track.plays * 2;

    // Combine absolute popularity with mood bonus + energy match + user-specific seed variation
    const score = (track.plays + moodScore * (track.plays * 0.15) + energyVibeScore * (track.plays * 0.10) + seed * (Math.max(100, track.plays) * 0.10)) - skipPenalty;
    return { track, score };
  });

  return scored
    .sort((a, b) => b.score - a.score || b.track.id.localeCompare(a.track.id))
    .slice(0, limit)
    .map(x => x.track);
}

export function getGenreRecommendations(
  genre: string,
  allTracks: Track[],
  count = 20,
  userId?: string
): Track[] {
  const targetGenreLower = genre.toLowerCase();
  
  const scored = allTracks.map(track => {
    const isGenreMatch = (track.genre || '').toLowerCase() === targetGenreLower ? 1.0 : 0.0;
    const seed = getUserSeed(userId, track.id);
    const popScore = popularityScore(track);

    const score = (
      isGenreMatch * 0.60 +
      popScore * 0.20 +
      seed * 0.20
    );

    return { track, score };
  });

  return scored
    .sort((a, b) => b.score - a.score || b.track.id.localeCompare(a.track.id))
    .slice(0, count)
    .map(x => x.track);
}

export function getDailyMixes(
  likedTrackIds: string[],
  genreScores: Record<string, number>,
  allTracks: Track[],
  userId?: string,
  followedArtistIds: string[] = [],
  preferredLanguages: string[] = [],
  detectedMood = 'happy',
  vibeEnergy = 0.5,
  vibeDiscovery = 0.5,
  vibeSimilarity = 0.5
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
    tracks: getDailyMix(likedTrackIds, { [mix.genre]: 10, ...genreScores }, allTracks, 25, userId, followedArtistIds, preferredLanguages, detectedMood, vibeEnergy, vibeDiscovery, vibeSimilarity),
  }));
}
