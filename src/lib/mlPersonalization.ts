// ─── ML Personalization Engine ────────────────────────────────────────────────
// Simulated machine-learning mood and personalization system using real
// mock data to compute mood profiles, emotion scores, and section recommendations.

export type MoodType = 'happy' | 'sad' | 'romantic' | 'energetic' | 'focused' | 'relaxed' | 'motivated' | 'workout' | 'travel' | 'sleep';

export interface MoodProfile {
  dominant: MoodType;
  scores: Record<MoodType, number>;  // 0–100
  shift: string; // e.g. "towards romantic"
  confidence: number; // 0–100
}

export interface EmotionDataPoint {
  subject: MoodType;
  score: number;
  fullMark: 100;
}

export interface TimelineDataPoint {
  day: string;
  happy: number;
  sad: number;
  energetic: number;
  relaxed: number;
  romantic: number;
  focused: number;
}

export interface InsightCard {
  id: string;
  icon: string;
  title: string;
  body: string;
  color: string;
  trend: 'up' | 'down' | 'stable';
  trendValue: string;
}

export interface PersonalityScore {
  overall: number;
  label: string;
  traits: { name: string; value: number; color: string }[];
}

// ─── Genre → Mood Weight Map ────────────────────────────────────────────────
const GENRE_MOOD_WEIGHTS: Record<string, Partial<Record<MoodType, number>>> = {
  'Pop': { happy: 80, energetic: 60, romantic: 50 },
  'R&B': { romantic: 85, relaxed: 70, happy: 50 },
  'Hip-Hop': { energetic: 75, motivated: 80, happy: 55 },
  'Electronic': { energetic: 90, focused: 70, motivated: 65 },
  'Indie Electronic': { relaxed: 70, focused: 65, sad: 45 },
  'Dream Pop': { romantic: 75, relaxed: 80, sad: 50 },
  'Synth Wave': { focused: 75, energetic: 65, motivated: 60 },
  'Indie Rock': { happy: 65, motivated: 60, energetic: 70 },
  'Alternative': { sad: 60, focused: 70, relaxed: 55 },
  'Post-Rock': { focused: 85, relaxed: 70, sad: 65 },
  'Jazz': { relaxed: 90, focused: 80, travel: 60 },
  'Blues': { sad: 80, relaxed: 75, romantic: 55 },
  'Classical': { focused: 95, relaxed: 85, sleep: 60 },
  'Lo-Fi': { relaxed: 90, focused: 85, sleep: 70 },
  'Ambient': { sleep: 90, relaxed: 85, focused: 70 },
  'Metal': { energetic: 95, motivated: 90, workout: 85 },
  'Punk': { energetic: 85, motivated: 75 },
  'Country': { happy: 70, romantic: 65, travel: 60 },
  'Folk': { sad: 65, relaxed: 75, romantic: 55 },
  'Soul': { romantic: 80, sad: 60, happy: 65 },
  'Dance Pop': { happy: 90, energetic: 85, workout: 70 },
  'Future Bass': { energetic: 80, motivated: 75, workout: 65 },
  'EDM': { energetic: 95, workout: 90, motivated: 85 },
  'Acoustic': { relaxed: 80, romantic: 70, sad: 55 },
};

// ─── Analyze Mood from User Data ─────────────────────────────────────────────
export function analyzeMood(
  genreScores: Record<string, number>,
  likedSongs: string[],
  recentlyPlayedCount: number,
): MoodProfile {
  const rawScores: Record<MoodType, number> = {
    happy: 0, sad: 0, romantic: 0, energetic: 0, focused: 0,
    relaxed: 0, motivated: 0, workout: 0, travel: 0, sleep: 0,
  };

  let totalWeight = 0;

  // Weight genres by user score
  Object.entries(genreScores).forEach(([genre, score]) => {
    const weights = GENRE_MOOD_WEIGHTS[genre];
    if (!weights) return;
    const weight = score / 100;
    totalWeight += weight;
    (Object.keys(weights) as MoodType[]).forEach(mood => {
      rawScores[mood] += (weights[mood] || 0) * weight;
    });
  });

  // Normalize to 0–100
  if (totalWeight > 0) {
    (Object.keys(rawScores) as MoodType[]).forEach(mood => {
      rawScores[mood] = Math.min(100, Math.round(rawScores[mood] / totalWeight));
    });
  }

  // Add a small variation based on liked songs count
  const likedBoost = Math.min(15, likedSongs.length * 1.5);
  rawScores.happy = Math.min(100, rawScores.happy + likedBoost);

  // Recent activity boost to energetic
  const recentBoost = Math.min(10, recentlyPlayedCount);
  rawScores.energetic = Math.min(100, rawScores.energetic + recentBoost);

  // Find dominant
  const dominant = (Object.keys(rawScores) as MoodType[]).reduce((a, b) =>
    rawScores[a] > rawScores[b] ? a : b
  );

  const confidence = Math.round(
    (rawScores[dominant] - (Object.values(rawScores).sort((a, b) => b - a)[1] || 0)) / 100 * 100 + 50
  );

  const shiftOptions = ['stable', 'towards romantic', 'towards energetic', 'towards relaxed', 'towards focused'];
  const shift = shiftOptions[Math.floor(Date.now() / 10000000) % shiftOptions.length];

  return { dominant, scores: rawScores, shift, confidence: Math.min(100, confidence) };
}

// ─── Generate Mood Timeline ─────────────────────────────────────────────────
export function getMoodTimeline(genreScores: Record<string, number>): TimelineDataPoint[] {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const baseProfile = analyzeMood(genreScores, [], 5);

  return days.map((day, i) => {
    const variation = (idx: number) => Math.min(100, Math.max(0, (baseProfile.scores[idx as unknown as MoodType] || 50) + Math.sin(i + idx) * 15));
    return {
      day,
      happy: Math.round(variation(0) + Math.sin(i * 0.8) * 12),
      sad: Math.round(baseProfile.scores.sad * 0.7 + Math.cos(i * 1.2) * 10),
      energetic: Math.round(baseProfile.scores.energetic * 0.9 + Math.sin(i * 1.5) * 15),
      relaxed: Math.round(baseProfile.scores.relaxed * 0.85 + Math.cos(i * 0.9) * 10),
      romantic: Math.round(baseProfile.scores.romantic * 0.8 + Math.sin(i * 0.6) * 8),
      focused: Math.round(baseProfile.scores.focused * 0.9 + Math.cos(i * 1.1) * 12),
    };
  });
}

// ─── Generate Emotion Radar ──────────────────────────────────────────────────
export function getEmotionRadar(profile: MoodProfile): EmotionDataPoint[] {
  const moods: MoodType[] = ['happy', 'sad', 'romantic', 'energetic', 'relaxed', 'focused'];
  return moods.map(mood => ({
    subject: mood,
    score: profile.scores[mood],
    fullMark: 100,
  }));
}

// ─── Music Personality Score ─────────────────────────────────────────────────
export function getPersonalityScore(profile: MoodProfile, likedCount: number): PersonalityScore {
  const scores = profile.scores;
  const overall = Math.round(
    (scores.happy * 0.2 + scores.energetic * 0.2 + scores.romantic * 0.15 +
      scores.focused * 0.15 + scores.relaxed * 0.15 + scores.motivated * 0.15)
  );

  let label = 'Explorer';
  if (scores.energetic > 70) label = 'Beat Chaser';
  else if (scores.romantic > 70) label = 'Soulful Dreamer';
  else if (scores.focused > 70) label = 'Deep Listener';
  else if (scores.relaxed > 70) label = 'Chill Wanderer';
  else if (scores.happy > 70) label = 'Sunshine Vibes';
  else if (scores.motivated > 70) label = 'Unstoppable Force';

  const traits = [
    { name: 'Adventurous', value: scores.energetic, color: '#84cc16' },
    { name: 'Romantic', value: scores.romantic, color: '#34d399' },
    { name: 'Focused', value: scores.focused, color: '#10b981' },
    { name: 'Joyful', value: scores.happy, color: '#22c55e' },
    { name: 'Mindful', value: scores.relaxed, color: '#059669' },
    { name: 'Driven', value: scores.motivated, color: '#b08850' },
  ];

  return { overall, label, traits };
}

// ─── AI Insight Cards ────────────────────────────────────────────────────────
export function getInsightCards(profile: MoodProfile, likedCount: number, recentCount: number): InsightCard[] {
  const cards: InsightCard[] = [];
  const { scores, dominant, shift } = profile;

  // Dominant mood card
  cards.push({
    id: 'dominant',
    icon: getMoodEmoji(dominant),
    title: `Your Current Vibe: ${capitalize(dominant)}`,
    body: `Based on your listening patterns, you are currently in a ${dominant} mood. Your taste reflects ${getGenreHint(dominant)} music preferences.`,
    color: getMoodColor(dominant),
    trend: 'stable',
    trendValue: `${profile.confidence}% confidence`,
  });

  // Shift card
  if (shift !== 'stable') {
    cards.push({
      id: 'shift',
      icon: '📈',
      title: 'Listening Shift Detected',
      body: `Your music preferences are shifting ${shift}. This week shows a notable change in your genre patterns.`,
      color: '#10b981',
      trend: 'up',
      trendValue: '+12% shift',
    });
  }

  // High energy card
  if (scores.energetic > 60) {
    cards.push({
      id: 'energy',
      icon: '⚡',
      title: 'High Energy Mode',
      body: `Your energy level is high at ${scores.energetic}/100. You\'ve been listening to upbeat, high-BPM tracks frequently.`,
      color: '#84cc16',
      trend: 'up',
      trendValue: `${scores.energetic}/100`,
    });
  }

  // Liked songs engagement
  if (likedCount > 0) {
    cards.push({
      id: 'liked',
      icon: '❤️',
      title: `${likedCount} Songs You Love`,
      body: `Your liked songs collection drives ${Math.round(likedCount * 2.3)}% of your personalized recommendations. Keep liking to improve accuracy.`,
      color: '#34d399',
      trend: 'up',
      trendValue: `${likedCount} tracks`,
    });
  }

  // Discovery card
  cards.push({
    id: 'discovery',
    icon: '🔭',
    title: 'Discovery Potential',
    body: `Our AI has identified ${Math.round(30 + Math.random() * 40)} new tracks matching your taste profile that you haven't heard yet.`,
    color: '#10b981',
    trend: 'up',
    trendValue: 'New tracks available',
  });

  // Recent activity
  if (recentCount > 3) {
    cards.push({
      id: 'recent',
      icon: '🎵',
      title: 'Active Listener',
      body: `You've played ${recentCount} tracks recently. Engagement has increased by 35% compared to last week.`,
      color: '#b08850',
      trend: 'up',
      trendValue: '+35% engagement',
    });
  }

  return cards.slice(0, 5);
}

// ─── Section Recommendations Based on Mood ───────────────────────────────────
export function getPersonalizedSections(profile: MoodProfile): string[] {
  const { dominant, scores } = profile;
  const sections: string[] = ['quick_access', 'made_for_you'];

  // Primary mood-based sections
  if (dominant === 'energetic' || dominant === 'workout' || dominant === 'motivated') {
    sections.push('trending_now', 'new_music', 'genre_edm');
  } else if (dominant === 'romantic' || dominant === 'sad') {
    sections.push('mood_romantic', 'recently_played', 'your_taste');
  } else if (dominant === 'focused' || dominant === 'sleep') {
    sections.push('mood_focus', 'daily_mixes', 'genre_ambient');
  } else if (dominant === 'relaxed' || dominant === 'travel') {
    sections.push('mood_chill', 'daily_mixes', 'genre_lofi');
  } else {
    sections.push('trending_now', 'new_music', 'recently_played');
  }

  // Add secondary based on high scores
  if (scores.happy > 65) sections.push('liked_songs');
  if (scores.energetic > 65) sections.push('trending_now');
  if (scores.focused > 65) sections.push('daily_mixes');

  return [...new Set(sections)]; // deduplicate
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getMoodEmoji(mood: MoodType): string {
  const map: Record<MoodType, string> = {
    happy: '😊', sad: '😢', romantic: '💕', energetic: '⚡',
    focused: '🎯', relaxed: '🌊', motivated: '🔥', workout: '💪', travel: '✈️', sleep: '😴',
  };
  return map[mood] || '🎵';
}

function getMoodColor(mood: MoodType): string {
  const map: Record<MoodType, string> = {
    happy: '#a3e635', sad: '#0f766e', romantic: '#34d399', energetic: '#b08850',
    focused: '#10b981', relaxed: '#22c55e', motivated: '#84cc16', workout: '#b08850', travel: '#14b8a6', sleep: '#047857',
  };
  return map[mood] || '#b08850';
}

function getGenreHint(mood: MoodType): string {
  const map: Record<MoodType, string> = {
    happy: 'upbeat pop and dance', sad: 'emotional and introspective',
    romantic: 'R&B and soft ballad', energetic: 'EDM and high-BPM',
    focused: 'ambient and lo-fi', relaxed: 'chill and acoustic',
    motivated: 'hip-hop and rock', workout: 'gym and energetic',
    travel: 'world and indie', sleep: 'classical and ambient',
  };
  return map[mood] || 'diverse';
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ─── AI Prompt to Layout Generator ───────────────────────────────────────────
export function promptToPresetId(prompt: string): string {
  const lower = prompt.toLowerCase();

  // Keyword mapping
  if (lower.includes('edm') || lower.includes('festival') || lower.includes('rave')) return 'gaming_edm';
  if (lower.includes('spotify')) return 'spotify_classic';
  if (lower.includes('apple')) return 'apple_music';
  if (lower.includes('youtube')) return 'youtube_music';
  if (lower.includes('netflix')) return 'netflix_drama';
  if (lower.includes('glass') || lower.includes('blur') || lower.includes('frosted')) return 'glassmorphism';
  if (lower.includes('cyber') || lower.includes('neon') || lower.includes('dystopian')) return 'cyberpunk';
  if (lower.includes('luxury') || lower.includes('gold') || lower.includes('premium') || lower.includes('vip')) return 'luxury_black_gold';
  if (lower.includes('gaming') || lower.includes('game') || lower.includes('rgb')) return 'gaming_edm';
  if (lower.includes('minimal') || lower.includes('clean') || lower.includes('simple')) return 'minimal_clean';
  if (lower.includes('magazine') || lower.includes('editorial')) return 'magazine_editorial';
  if (lower.includes('pinterest') || lower.includes('mosaic')) return 'pinterest_mosaic';
  if (lower.includes('tiktok') || lower.includes('viral')) return 'tiktok_feed';
  if (lower.includes('instagram') || lower.includes('story') || lower.includes('stories')) return 'instagram_aesthetic';
  if (lower.includes('retro') || lower.includes('80s') || lower.includes('synthwave')) return 'retro_80s';
  if (lower.includes('ai') || lower.includes('futuristic') || lower.includes('holograph')) return 'futuristic_ai';
  if (lower.includes('kpop') || lower.includes('k-pop') || lower.includes('idol')) return 'kpop_idol';
  if (lower.includes('lofi') || lower.includes('lo-fi') || lower.includes('study') || lower.includes('chill')) return 'lofi_chill';
  if (lower.includes('hiphop') || lower.includes('hip-hop') || lower.includes('trap') || lower.includes('street')) return 'hiphop_street';
  if (lower.includes('jazz') || lower.includes('blues') || lower.includes('soul')) return 'jazz_blues';
  if (lower.includes('workout') || lower.includes('gym') || lower.includes('fitness')) return 'workout_pump';
  if (lower.includes('tamil') || lower.includes('indian') || lower.includes('bollywood') || lower.includes('carnatic')) return 'indian_classical';
  if (lower.includes('romantic') || lower.includes('love') || lower.includes('emotional')) return 'jazz_blues';
  if (lower.includes('saas') || lower.includes('dashboard') || lower.includes('professional')) return 'modern_saas';
  if (lower.includes('event') || lower.includes('concert') || lower.includes('ticket')) return 'event_promo';
  if (lower.includes('artist') || lower.includes('launch') || lower.includes('promo')) return 'artist_promo';
  if (lower.includes('bento') || lower.includes('tile')) return 'bento_grid';
  if (lower.includes('hero') || lower.includes('banner') || lower.includes('immersive')) return 'hero_banner';
  if (lower.includes('masonry') || lower.includes('discover') || lower.includes('explore')) return 'masonry_discovery';
  if (lower.includes('gen-z') || lower.includes('genz') || lower.includes('young')) return 'neon_nights';
  if (lower.includes('night') || lower.includes('dark') || lower.includes('midnight')) return 'neon_nights';

  // Default
  return 'spotify_classic';
}
