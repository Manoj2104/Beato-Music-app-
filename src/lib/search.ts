import { Track, Artist, Album, Playlist } from '@/types';

// ─── Tokenizer ──────────────────────────────────────────────────────────────
const STOP_WORDS = new Set(['a','an','the','and','or','but','in','on','at','to','for','of','with','by','from','is','was','are','were','be','been','being','have','has','had','do','does','did']);

function tokenize(text: string): string[] {
  return text.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1 && !STOP_WORDS.has(t));
}

function score(queryTokens: string[], text: string): number {
  const textTokens = tokenize(text);
  const textStr = text.toLowerCase();
  const queryStr = queryTokens.join(' ');
  let sc = 0;

  // Exact phrase match (highest weight)
  if (textStr.includes(queryStr)) sc += 10;

  // Per-token matching
  for (const qt of queryTokens) {
    for (const tt of textTokens) {
      if (tt === qt) sc += 3;
      else if (tt.startsWith(qt)) sc += 2;
      else if (tt.includes(qt) && qt.length > 2) sc += 1;
    }
  }

  // Normalize by text length
  return sc / Math.max(1, Math.sqrt(textTokens.length));
}

// ─── Types ──────────────────────────────────────────────────────────────────
export interface SearchResult {
  tracks: Track[];
  artists: Artist[];
  albums: Album[];
  playlists: Playlist[];
  genres: string[];
  topResult: { type: 'track' | 'artist' | 'album' | 'playlist'; item: Track | Artist | Album | Playlist; score: number } | null;
  query: string;
}

export interface SearchSuggestion {
  text: string;
  type: 'track' | 'artist' | 'album' | 'genre';
  id: string;
  subtitle?: string;
}

// ─── Main Search Function ───────────────────────────────────────────────────
export function search(
  query: string,
  data: { tracks: Track[]; artists: Artist[]; albums: Album[]; playlists: Playlist[] }
): SearchResult {
  if (!query.trim()) return { tracks: [], artists: [], albums: [], playlists: [], genres: [], topResult: null, query };

  const tokens = tokenize(query);
  if (tokens.length === 0) return { tracks: [], artists: [], albums: [], playlists: [], genres: [], topResult: null, query };

  // Score tracks
  const scoredTracks = data.tracks.map(t => {
    const baseScore = score(tokens, `${t.title} ${t.artistName} ${t.albumName} ${t.genre}`);
    return {
      item: t,
      score: baseScore > 0 ? baseScore + (t.plays / 1_000_000) * 0.5 : 0,
    };
  }).filter(x => x.score > 0).sort((a, b) => b.score - a.score);

  // Score artists
  const scoredArtists = data.artists.map(a => {
    const baseScore = score(tokens, `${a.name} ${a.genres.join(' ')} ${a.bio}`);
    return {
      item: a,
      score: baseScore > 0 ? baseScore + (a.monthlyListeners / 10_000_000) * 0.5 : 0,
    };
  }).filter(x => x.score > 0).sort((a, b) => b.score - a.score);

  // Score albums
  const scoredAlbums = data.albums.map(a => ({
    item: a,
    score: score(tokens, `${a.title} ${a.artistName} ${a.genre}`),
  })).filter(x => x.score > 0).sort((a, b) => b.score - a.score);

  // Score playlists
  const scoredPlaylists = data.playlists.map(p => ({
    item: p,
    score: score(tokens, `${p.title} ${p.description || ''} ${p.ownerName || ''} ${(p.tags || []).join(' ')}`),
  })).filter(x => x.score > 0).sort((a, b) => b.score - a.score);

  // Genre matching
  const allGenres = ['Pop', 'Hip-Hop', 'Electronic', 'Rock', 'R&B', 'Indie', 'Jazz', 'Classical', 'Dance', 'Ambient', 'Synth Wave', 'Dream Pop', 'Lo-Fi', 'Metal', 'Country'];
  const genres = allGenres.filter(g => g.toLowerCase().includes(query.toLowerCase()));

  // Top result: highest score across all types
  const candidates: { type: 'track'|'artist'|'album'|'playlist'; item: any; score: number }[] = [
    ...scoredTracks.slice(0, 1).map(x => ({ type: 'track' as const, ...x })),
    ...scoredArtists.slice(0, 1).map(x => ({ type: 'artist' as const, ...x })),
    ...scoredAlbums.slice(0, 1).map(x => ({ type: 'album' as const, ...x })),
    ...scoredPlaylists.slice(0, 1).map(x => ({ type: 'playlist' as const, ...x })),
  ];
  const topResult = candidates.sort((a, b) => b.score - a.score)[0] ?? null;

  return {
    tracks: scoredTracks.slice(0, 10).map(x => x.item),
    artists: scoredArtists.slice(0, 6).map(x => x.item),
    albums: scoredAlbums.slice(0, 6).map(x => x.item),
    playlists: scoredPlaylists.slice(0, 6).map(x => x.item),
    genres: genres.slice(0, 4),
    topResult,
    query,
  };
}

// ─── Suggestions ────────────────────────────────────────────────────────────
export function getSuggestions(
  query: string,
  data: { tracks: Track[]; artists: Artist[]; albums: Album[] }
): SearchSuggestion[] {
  if (!query.trim() || query.length < 2) return [];
  const q = query.toLowerCase();
  const results: SearchSuggestion[] = [];

  // Artists first (highest priority)
  data.artists.filter(a => a.name.toLowerCase().includes(q)).slice(0, 3).forEach(a => {
    results.push({ text: a.name, type: 'artist', id: a.id, subtitle: `${(a.monthlyListeners / 1_000_000).toFixed(1)}M listeners` });
  });

  // Tracks
  data.tracks.filter(t => t.title.toLowerCase().includes(q)).slice(0, 3).forEach(t => {
    results.push({ text: t.title, type: 'track', id: t.id, subtitle: t.artistName });
  });

  // Albums
  data.albums.filter(a => a.title.toLowerCase().includes(q)).slice(0, 2).forEach(a => {
    results.push({ text: a.title, type: 'album', id: a.id, subtitle: `Album · ${a.artistName}` });
  });

  return results.slice(0, 8);
}

// ─── Highlight helper ───────────────────────────────────────────────────────
export function highlightMatch(text: string, query: string): { text: string; highlighted: boolean }[] {
  if (!query.trim()) return [{ text, highlighted: false }];
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return parts.map(p => ({ text: p, highlighted: regex.test(p) }));
}
