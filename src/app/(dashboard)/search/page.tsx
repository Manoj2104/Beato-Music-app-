'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Music, User, Disc, ListMusic, Mic2, Play, Pause, TrendingUp, Camera } from 'lucide-react';
import Link from 'next/link';
import { usePlayerStore } from '@/store/playerStore';
import { useAuthStore } from '@/store/authStore';
import { useMusicStore, trackGradient, GENRE_COLORS } from '@/store/musicStore';
import { mockArtists, mockAlbums, mockPlaylists, mockTracks } from '@/lib/mockData';
import { search, getSuggestions, SearchResult, SearchSuggestion, highlightMatch } from '@/lib/search';
import TrackCard from '@/components/music/TrackCard';
import TopBar from '@/components/layout/TopBar';
import { usePlaylistStore } from '@/store/playlistStore';

const G = '#1db954';

const BROWSE_GENRES = [
  { name: 'Pop', color: '#34d399', emoji: '🎤', image: 'https://images.unsplash.com/photo-1529518969858-8baa65152fc8?w=120&auto=format&fit=crop&q=80' },
  { name: 'Hip-Hop', color: '#f59e0b', emoji: '🎙️', image: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=120&auto=format&fit=crop&q=80' },
  { name: 'Electronic', color: '#06b6d4', emoji: '⚡', image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=120&auto=format&fit=crop&q=80' },
  { name: 'Rock', color: '#ef4444', emoji: '🎸', image: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=120&auto=format&fit=crop&q=80' },
  { name: 'R&B', color: '#10b981', emoji: '🎶', image: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=120&auto=format&fit=crop&q=80' },
  { name: 'Indie', color: '#14b8a6', emoji: '🌿', image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=120&auto=format&fit=crop&q=80' },
  { name: 'Jazz', color: '#d97706', emoji: '🎺', image: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=120&auto=format&fit=crop&q=80' },
  { name: 'Classical', color: '#7c3aed', emoji: '🎻', image: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=120&auto=format&fit=crop&q=80' },
  { name: 'Dance', color: '#34d399', emoji: '🕺', image: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=120&auto=format&fit=crop&q=80' },
  { name: 'Ambient', color: '#0ea5e9', emoji: '🌊', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=120&auto=format&fit=crop&q=80' },
  { name: 'Synth Wave', color: '#6366f1', emoji: '🌃', image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=120&auto=format&fit=crop&q=80' },
  { name: 'Lo-Fi', color: '#64748b', emoji: '📻', image: 'https://images.unsplash.com/photo-1513829096999-4978602297f7?w=120&auto=format&fit=crop&q=80' },
  { name: 'Metal', color: '#374151', emoji: '🤘', image: 'https://images.unsplash.com/photo-1524567244388-11d371737a2a?w=120&auto=format&fit=crop&q=80' },
  { name: 'Soul', color: '#f97316', emoji: '💫', image: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=120&auto=format&fit=crop&q=80' },
  { name: 'Latin', color: '#10b981', emoji: '💃', image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=120&auto=format&fit=crop&q=80' },
  { name: 'Country', color: '#92400e', emoji: '🤠', image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=120&auto=format&fit=crop&q=80' },
  { name: 'Gospel', color: '#fbbf24', emoji: '✝️', image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=120&auto=format&fit=crop&q=80' },
  { name: 'Reggae', color: '#16a34a', emoji: '🌴', image: 'https://images.unsplash.com/photo-1529518969858-8baa65152fc8?w=120&auto=format&fit=crop&q=80' },
  { name: 'Podcast', color: '#10b981', emoji: '🎧', image: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=120&auto=format&fit=crop&q=80' },
  { name: 'New Releases', color: '#10b981', emoji: '🆕', image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=120&auto=format&fit=crop&q=80' },
];

function ArtistCard({ artist, small }: { artist: any; small?: boolean }) {
  const sz = small ? 64 : 100;
  return (
    <Link href={`/artist/${artist.id}`} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{
        width: sz, height: sz, borderRadius: '50%',
        background: `hsl(${artist.id.charCodeAt(artist.id.length - 1) * 40 % 360}, 50%, 35%)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: small ? 24 : 36,
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      }}>
        🎤
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: '#fff', fontSize: small ? 12 : 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>{artist.name}</p>
        <p style={{ color: '#737373', fontSize: 11 }}>Artist</p>
      </div>
    </Link>
  );
}

function AlbumCard({ album }: { album: any }) {
  return (
    <Link href={`/album/${album.id}`} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: 8, cursor: 'pointer' }}>
      <div style={{ width: '100%', paddingBottom: '100%', position: 'relative', borderRadius: 10, overflow: 'hidden', background: trackGradient(album.id) }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>🎵</div>
      </div>
      <p style={{ color: '#fff', fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{album.title}</p>
      <p style={{ color: '#737373', fontSize: 11 }}>{album.year} · {album.artistName}</p>
    </Link>
  );
}

function PlaylistSearchCard({ playlist }: { playlist: any }) {
  const isLikedSongs = playlist.id === 'playlist-1';
  
  // Resolve first track's cover image as a fallback if no cover image is set
  let fallbackImg = null;
  if (!playlist.coverImage || playlist.coverImage === 'undefined') {
    const firstTrackId = playlist.tracks?.[0];
    if (firstTrackId) {
      const allTracks = useMusicStore.getState().getAllTracks();
      const firstTrack = allTracks.find((t: any) => t.id === firstTrackId);
      if (firstTrack && firstTrack.coverImage) {
        fallbackImg = firstTrack.coverImage;
      }
    }
  }

  const displayImg = playlist.coverImage && playlist.coverImage !== 'undefined' 
    ? playlist.coverImage 
    : fallbackImg;

  const gradCss = playlist.gradientCss || (isLikedSongs ? 'linear-gradient(135deg,#4338ca,#60a5fa)' : 'linear-gradient(135deg,#1e3a5f,#0ea5e9)');

  return (
    <Link href={`/playlist/${playlist.id}`} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: 8, cursor: 'pointer' }}>
      <div style={{ 
        width: '100%', 
        paddingBottom: '100%', 
        position: 'relative', 
        borderRadius: 10, 
        overflow: 'hidden', 
        background: displayImg ? 'none' : gradCss 
      }}>
        {displayImg ? (
          <img src={displayImg} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
            {isLikedSongs ? '❤️' : '🎶'}
          </div>
        )}
      </div>
      <p style={{ color: '#fff', fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>{playlist.title}</p>
      <p style={{ color: '#737373', fontSize: 11 }}>Playlist · {playlist.ownerName}</p>
    </Link>
  );
}

function TopResult({ topResult, onPlay }: { topResult: SearchResult['topResult']; onPlay: () => void }) {
  if (!topResult) return null;
  const item = topResult.item as any;

  return (
    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: 20, border: '1px solid rgba(255,255,255,0.08)' }}>
      <p style={{ color: '#737373', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>Top Result</p>
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end' }}>
        <Link href={topResult.type === 'artist' ? `/artist/${item.id}` : topResult.type === 'album' ? `/album/${item.id}` : '#'}
          onClick={e => { if (topResult.type === 'track') e.preventDefault(); }}
          style={{ display: 'block', textDecoration: 'none' }}>
          <div style={{
            width: 90, height: 90, borderRadius: topResult.type === 'artist' ? '50%' : 12,
            background: trackGradient(item.id), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36,
            flexShrink: 0, boxShadow: '0 8px 24px rgba(0,0,0,0.4)', cursor: topResult.type === 'track' ? 'default' : 'pointer'
          }}>
            {topResult.type === 'artist' ? '🎤' : '🎵'}
          </div>
        </Link>
        <div>
          {topResult.type === 'artist' || topResult.type === 'album' ? (
            <Link href={topResult.type === 'artist' ? `/artist/${item.id}` : `/album/${item.id}`} style={{ textDecoration: 'none' }}>
              <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 24, fontWeight: 900, color: '#fff', marginBottom: 4, cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
                {item.name || item.title}
              </p>
            </Link>
          ) : (
            <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 24, fontWeight: 900, color: '#fff', marginBottom: 4 }}>{item.name || item.title}</p>
          )}
          <p style={{ color: '#737373', fontSize: 13 }}>
            {topResult.type === 'track' ? (
              <span>
                Song ·{' '}
                <Link href={`/artist/${item.artistId}`} style={{ color: '#737373', textDecoration: 'none' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.textDecoration = 'underline'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#737373'; e.currentTarget.style.textDecoration = 'none'; }}>
                  {item.artistName}
                </Link>
              </span>
            ) :
             topResult.type === 'artist' ? (
              <span>
                Artist ·{' '}
                <Link href={`/artist/${item.id}`} style={{ color: '#737373', textDecoration: 'none' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.textDecoration = 'underline'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#737373'; e.currentTarget.style.textDecoration = 'none'; }}>
                  {(item.monthlyListeners / 1_000_000).toFixed(1)}M listeners
                </Link>
              </span>
             ) :
             topResult.type === 'album' ? (
              <span>
                Album ·{' '}
                <Link href={`/artist/${item.artistId}`} style={{ color: '#737373', textDecoration: 'none' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.textDecoration = 'underline'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#737373'; e.currentTarget.style.textDecoration = 'none'; }}>
                  {item.artistName}
                </Link>
              </span>
             ) : 'Playlist'}
          </p>
          <button onClick={onPlay} style={{ marginTop: 14, width: 44, height: 44, borderRadius: '50%', background: G, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(29, 185, 84,0.4)' }}>
            <Play size={18} fill="black" color="black" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Extract initial query from URL search params on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const q = params.get('q');
      if (q) {
        setQuery(q);
      }
    }
  }, []);
  const [results, setResults] = useState<SearchResult | null>(null);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'songs' | 'artists' | 'albums' | 'playlists'>('all');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const { playTrack, currentTrack, isPlaying, togglePlay } = usePlayerStore();
  const { getAllTracks, uploadedTracks, activeArtistIds } = useMusicStore();
  const { user, setMobileDrawerOpen } = useAuthStore();
  const { customPlaylists } = usePlaylistStore();
  const allTracks = getAllTracks();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Debounce search
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  // Run search
  useEffect(() => {
    if (!debouncedQuery.trim()) { setResults(null); setSuggestions([]); return; }
    
    const activeArtistIdsList = activeArtistIds || ['artist-1', 'artist-2', 'artist-3', 'artist-4', 'artist-5', 'artist-6'];
    const activeArtists = mockArtists.filter(a => activeArtistIdsList.includes(a.id));
    const activeAlbums = mockAlbums.filter(al => activeArtistIdsList.includes(al.artistId));

    const searchableCustomPlaylists = customPlaylists.filter(p => p.isPublic !== false || p.ownerId === user?.id);
    const allSearchPlaylists = [...searchableCustomPlaylists, ...mockPlaylists];
    const r = search(debouncedQuery, { tracks: allTracks, artists: activeArtists, albums: activeAlbums, playlists: allSearchPlaylists });
    setResults(r);
    const s = getSuggestions(debouncedQuery, { tracks: allTracks, artists: activeArtists, albums: activeAlbums });
    setSuggestions(s);
  }, [debouncedQuery, uploadedTracks, activeArtistIds]);

  const handleSuggestionClick = (s: SearchSuggestion) => {
    setQuery(s.text);
    setShowSuggestions(false);
  };

  const FILTERS = ['all', 'songs', 'artists', 'albums', 'playlists'] as const;

  return (
    <div style={{ minHeight: '100%', background: '#0a0a0a', padding: isMobile ? '16px 16px 32px' : '20px 24px' }}>
      {isMobile ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          {/* User Profile Avatar */}
          <div
            onClick={() => setMobileDrawerOpen(true)}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: '#1db954', // Green circle
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: 14,
              fontFamily: 'Outfit, sans-serif',
              cursor: 'pointer'
            }}
          >
            {user?.name ? user.name[0].toUpperCase() : 'M'}
          </div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 24, fontWeight: 900, color: '#fff' }}>Search</h1>
          <Camera size={22} color="#fff" style={{ cursor: 'pointer', marginLeft: 'auto' }} />
        </div>
      ) : (
        <TopBar />
      )}
      
      {/* Search bar */}
      <div style={{ position: 'relative', maxWidth: 680, margin: isMobile ? '0 auto 16px' : '0 auto 28px' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={18} color={isMobile ? '#525252' : (query ? '#fff' : '#737373')} style={{ position: 'absolute', left: 16, flexShrink: 0 }} />
          <input
            value={query}
            onChange={e => { setQuery(e.target.value); setShowSuggestions(true); }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder="What do you want to listen to?"
            autoFocus
            style={{
              width: '100%',
              background: isMobile ? '#fff' : 'rgba(255,255,255,0.1)',
              border: isMobile ? 'none' : `2px solid ${query ? G : 'transparent'}`,
              borderRadius: isMobile ? 8 : 30,
              padding: isMobile ? '12px 40px 12px 44px' : '14px 48px 14px 48px',
              color: isMobile ? '#000' : '#fff',
              fontSize: 14.5,
              outline: 'none',
              fontFamily: 'Inter, sans-serif',
              transition: 'border-color 0.2s',
            }}
          />
          {query && (
            <button onClick={() => { setQuery(''); setResults(null); setSuggestions([]); }}
              style={{ position: 'absolute', right: 16, background: 'none', border: 'none', cursor: 'pointer', color: isMobile ? '#000' : '#737373', display: 'flex', alignItems: 'center' }}>
              <X size={18} />
            </button>
          )}
        </div>

        {/* Suggestions dropdown */}
        <AnimatePresence>
          {showSuggestions && suggestions.length > 0 && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, zIndex: 100, overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.6)' }}>
              {suggestions.map(s => {
                const href = s.type === 'artist' ? `/artist/${s.id}` : s.type === 'album' ? `/album/${s.id}` : `/search?q=${encodeURIComponent(s.text)}`;
                return (
                  <Link key={`${s.type}-${s.id}`} href={href} style={{ textDecoration: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <div style={{ width: 32, height: 32, borderRadius: s.type === 'artist' ? '50%' : 6, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {s.type === 'artist' ? <User size={14} color="#a3a3a3" /> : s.type === 'album' ? <Disc size={14} color="#a3a3a3" /> : <Music size={14} color="#a3a3a3" />}
                      </div>
                      <div>
                        <p style={{ color: '#fff', fontSize: 14, fontWeight: 500 }}>{s.text}</p>
                        {s.subtitle && <p style={{ color: '#737373', fontSize: 11 }}>{s.subtitle}</p>}
                      </div>
                      <Search size={12} color="#525252" style={{ marginLeft: 'auto' }} />
                    </div>
                  </Link>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Filter tabs */}
      {results && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, overflowX: 'auto' }}>
          {FILTERS.map(f => (
            <button key={f} onClick={() => setActiveFilter(f)} style={{
              padding: '7px 16px', borderRadius: 100, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none', whiteSpace: 'nowrap',
              background: activeFilter === f ? '#fff' : 'rgba(255,255,255,0.1)',
              color: activeFilter === f ? '#000' : '#fff', transition: 'all 0.15s',
            }}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      {results ? (
        <AnimatePresence mode="wait">
          <motion.div key={results.query} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            {/* Top result + songs side by side */}
            {(activeFilter === 'all' || activeFilter === 'songs') && results.tracks.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1.6fr', gap: 20, marginBottom: 32 }}>
                {results.topResult && (
                  <TopResult topResult={results.topResult} onPlay={() => {
                    if (results.topResult?.type === 'track') {
                      const t = results.topResult.item as any;
                      const isActive = currentTrack?.id === t.id;
                      isActive ? togglePlay() : playTrack(t, results.tracks);
                    }
                  }} />
                )}
                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: '16px 4px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p style={{ color: '#737373', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10, paddingLeft: 14 }}>Songs</p>
                  {results.tracks.slice(0, 5).map((track, i) => (
                    <TrackCard key={track.id} track={track} index={i} queue={results.tracks} compact />
                  ))}
                </div>
              </div>
            )}

            {/* Artists */}
            {(activeFilter === 'all' || activeFilter === 'artists') && results.artists.length > 0 && (
              <section style={{ marginBottom: 32 }}>
                <h3 style={{ fontFamily: 'Outfit, sans-serif', color: '#fff', fontSize: 18, fontWeight: 800, marginBottom: 18 }}>Artists</h3>
                <div style={{ display: 'flex', gap: 24, overflowX: 'auto', paddingBottom: 8 }}>
                  {results.artists.map(a => <ArtistCard key={a.id} artist={a} />)}
                </div>
              </section>
            )}

            {/* Albums */}
            {(activeFilter === 'all' || activeFilter === 'albums') && results.albums.length > 0 && (
              <section style={{ marginBottom: 32 }}>
                <h3 style={{ fontFamily: 'Outfit, sans-serif', color: '#fff', fontSize: 18, fontWeight: 800, marginBottom: 18 }}>Albums</h3>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
                  {results.albums.map(a => <AlbumCard key={a.id} album={a} />)}
                </div>
              </section>
            )}

            {/* Playlists */}
            {(activeFilter === 'all' || activeFilter === 'playlists') && results.playlists.length > 0 && (
              <section style={{ marginBottom: 32 }}>
                <h3 style={{ fontFamily: 'Outfit, sans-serif', color: '#fff', fontSize: 18, fontWeight: 800, marginBottom: 18 }}>Playlists</h3>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
                  {results.playlists.map(p => <PlaylistSearchCard key={p.id} playlist={p} />)}
                </div>
              </section>
            )}

            {/* More songs */}
            {activeFilter === 'songs' && results.tracks.length > 5 && (
              <section>
                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
                  {results.tracks.slice(5).map((track, i) => (
                    <TrackCard key={track.id} track={track} index={i + 5} queue={results.tracks} />
                  ))}
                </div>
              </section>
            )}

            {/* No results */}
            {results.tracks.length === 0 && results.artists.length === 0 && results.albums.length === 0 && results.playlists.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <p style={{ fontSize: 48, marginBottom: 16 }}>🔍</p>
                <h3 style={{ fontFamily: 'Outfit, sans-serif', color: '#fff', fontSize: 22, fontWeight: 800, marginBottom: 8 }}>No results for "{query}"</h3>
                <p style={{ color: '#737373', fontSize: 14 }}>Try different keywords or check for typos</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      ) : (
        /* Browse genres */
        <div>
          {isMobile ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Start browsing */}
              <div>
                <h2 style={{ fontFamily: 'Outfit, sans-serif', color: '#fff', fontSize: 18, fontWeight: 800, marginBottom: 12 }}>Start browsing</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                  {[
                    { name: 'Music', color: '#eb1e32', image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120&auto=format&fit=crop&q=80' },
                    { name: 'Podcasts', color: '#006450', image: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=120&auto=format&fit=crop&q=80' },
                    { name: 'Live Events', color: '#8c19ff', image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=120&auto=format&fit=crop&q=80' },
                    { name: 'Home of I-Pop', color: '#283ea3', image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=120&auto=format&fit=crop&q=80' }
                  ].map(item => (
                    <motion.div key={item.name} whileTap={{ scale: 0.97 }} onClick={() => setQuery(item.name)}
                      style={{ padding: 12, borderRadius: 8, background: item.color, cursor: 'pointer', position: 'relative', overflow: 'hidden', height: 84 }}>
                      <p style={{ color: '#fff', fontWeight: 800, fontSize: 14, fontFamily: 'Outfit, sans-serif', margin: 0, position: 'relative', zIndex: 1 }}>{item.name}</p>
                      <div style={{ position: 'absolute', bottom: -5, right: -10, width: 52, height: 52, transform: 'rotate(25deg)', borderRadius: 4, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.4)', zIndex: 0 }}>
                        <img src={item.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Advertisement */}
              <div style={{
                background: '#121212',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 12,
                padding: '16px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                margin: '8px 0'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ padding: '2px 6px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 3, fontSize: 9, fontWeight: 700, color: '#a3a3a3', letterSpacing: '0.05em' }}>ADVERTISEMENT</div>
                    <span style={{ fontSize: 11, color: '#fff', fontWeight: 800 }}>ICICI LOMBARD</span>
                  </div>
                  <span style={{ fontSize: 14, color: '#737373', cursor: 'pointer' }}>⋮</span>
                </div>
                <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  <div style={{ width: 80, height: 80, borderRadius: 8, background: '#fff', display: 'flex', alignItems: 'center', justifyItems: 'center', overflow: 'hidden', flexShrink: 0 }}>
                    <img src="https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=120&auto=format&fit=crop&q=80" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ color: '#fff', fontSize: 13.5, fontWeight: 700, margin: '0 0 10px 0', lineHeight: '1.4' }}>30-minute roadside assistance promise</h4>
                    <button style={{ background: '#fff', color: '#000', border: 'none', borderRadius: 20, padding: '6px 16px', fontSize: 11, fontWeight: 800, cursor: 'pointer', float: 'right' }}>Buy now</button>
                  </div>
                </div>
              </div>

              {/* Discover something new */}
              <div>
                <h2 style={{ fontFamily: 'Outfit, sans-serif', color: '#fff', fontSize: 18, fontWeight: 800, marginBottom: 12 }}>Discover something new</h2>
                <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 6 }} className="no-scrollbar">
                  {[
                    { tag: '#tamil dance', image: 'https://images.unsplash.com/photo-1519834785169-98be25ec3f84?w=200&auto=format&fit=crop&q=80' },
                    { tag: '#tamil pop', image: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=200&auto=format&fit=crop&q=80' },
                    { tag: '#clean groove', image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200&auto=format&fit=crop&q=80' },
                    { tag: '#acoustic vibes', image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=200&auto=format&fit=crop&q=80' }
                  ].map(item => (
                    <motion.div key={item.tag} whileTap={{ scale: 0.97 }} onClick={() => setQuery(item.tag.replace('#', ''))}
                      style={{ width: 110, height: 165, borderRadius: 12, overflow: 'hidden', position: 'relative', flexShrink: 0, cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                      <img src={item.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 60%)' }} />
                      <span style={{ position: 'absolute', bottom: 10, left: 10, right: 10, color: '#fff', fontSize: 11, fontWeight: 700, fontFamily: 'Inter, sans-serif', textShadow: '0 1px 2px rgba(0,0,0,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.tag}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Browse all */}
              <div>
                <h2 style={{ fontFamily: 'Outfit, sans-serif', color: '#fff', fontSize: 18, fontWeight: 800, marginBottom: 12 }}>Browse all</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                  {BROWSE_GENRES.map(g => (
                    <motion.div key={g.name} whileTap={{ scale: 0.97 }}
                      onClick={() => setQuery(g.name)}
                      style={{
                        padding: 12, borderRadius: 8, background: g.color,
                        cursor: 'pointer', position: 'relative', overflow: 'hidden', height: 84,
                      }}>
                      <p style={{ color: '#fff', fontWeight: 800, fontSize: 14, fontFamily: 'Outfit, sans-serif', margin: 0, position: 'relative', zIndex: 1 }}>{g.name}</p>
                      {g.image ? (
                        <div style={{ position: 'absolute', bottom: -5, right: -10, width: 52, height: 52, transform: 'rotate(25deg)', borderRadius: 4, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.4)', zIndex: 0 }}>
                          <img src={g.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      ) : (
                        <div style={{ position: 'absolute', bottom: -8, right: -4, fontSize: 36, opacity: 0.6, transform: 'rotate(15deg)', zIndex: 0 }}>{g.emoji}</div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div>
              <h2 style={{ fontFamily: 'Outfit, sans-serif', color: '#fff', fontSize: 20, fontWeight: 800, marginBottom: 18 }}>Browse Genres</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
                {BROWSE_GENRES.map(g => (
                  <motion.div key={g.name} whileHover={{ scale: 1.03 }}
                    onClick={() => setQuery(g.name)}
                    style={{
                      padding: '20px 18px', borderRadius: 12, background: g.color,
                      cursor: 'pointer', position: 'relative', overflow: 'hidden', height: 100,
                      display: 'flex', alignItems: 'flex-end',
                    }}>
                    {g.image ? (
                      <div style={{ position: 'absolute', bottom: -10, right: -15, width: 64, height: 64, transform: 'rotate(24deg)', borderRadius: 4, overflow: 'hidden', boxShadow: '0 4px 10px rgba(0,0,0,0.4)', zIndex: 0 }}>
                        <img src={g.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ) : (
                      <div style={{ position: 'absolute', top: -8, right: -4, fontSize: 52, opacity: 0.6, filter: 'drop-shadow(2px 4px 8px rgba(0,0,0,0.4))', transform: 'rotate(15deg)' }}>{g.emoji}</div>
                    )}
                    <p style={{ color: '#fff', fontWeight: 800, fontSize: 16, fontFamily: 'Outfit, sans-serif', position: 'relative', zIndex: 1, textShadow: '0 2px 4px rgba(0,0,0,0.4)' }}>{g.name}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
