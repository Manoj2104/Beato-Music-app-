'use client';

import { use, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useMotionValue } from 'framer-motion';
import {
  Play, Pause, Shuffle, Heart, MoreHorizontal, MoreVertical, Clock, Share2, Plus, Download,
  Check, X, Pencil, Pin, Trash2, Globe, Lock, Users, BookOpen, Zap, ChevronDown,
  ListMusic, Sparkles, Radio, ArrowUp, BarChart2, Copy, ExternalLink, Search,
  Music2, PlayCircle, TrendingUp, Star, Layers, Bell, ChevronLeft, ChevronRight, Home, Library, ArrowLeft, Laptop2,
  PlusCircle
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import TopBar from '@/components/layout/TopBar';
import TrackCard from '@/components/music/TrackCard';
import { getPlaylistById, getTracksByIds, formatDuration, mockTracks, mockPlaylists } from '@/lib/mockData';
import { usePlayerStore } from '@/store/playerStore';
import { useAuthStore } from '@/store/authStore';
import { usePlaylistStore } from '@/store/playlistStore';
import { useDownloadStore } from '@/store/downloadStore';
import { useMusicStore, trackGradient } from '@/store/musicStore';

const G = '#b08850';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const EDIT_GRADIENTS = [
  { id: 'ocean',   css: 'linear-gradient(135deg,#1e3a5f,#0ea5e9)' },
  { id: 'sunset',  css: 'linear-gradient(135deg,#7c1d0a,#f97316)' },
  { id: 'aurora',  css: 'linear-gradient(135deg,#4c1d95,#34d399)' },
  { id: 'forest',  css: 'linear-gradient(135deg,#064e3b,#b08850)' },
  { id: 'galaxy',  css: 'linear-gradient(135deg,#1e1b4b,#6366f1)' },
  { id: 'gold',    css: 'linear-gradient(135deg,#78350f,#fbbf24)' },
  { id: 'rose',    css: 'linear-gradient(135deg,#881337,#fb7185)' },
  { id: 'steel',   css: 'linear-gradient(135deg,#1f2937,#6b7280)' },
];

function fmtTime(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function numFmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

const normalizeId = (idString: string) => {
  if (!idString) return '';
  try {
    return decodeURIComponent(idString).replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  } catch (e) {
    return idString.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  }
};

const getAIRecommendations = (
  playlistTracks: any[],
  allTracks: any[],
  user: any,
  genreScores: Record<string, number>
) => {
  const playlistGenres = playlistTracks.map(t => t.genre);
  const playlistArtists = playlistTracks.map(t => t.artistId);
  const userTopGenres = user?.stats?.topGenres || [];

  return [...allTracks]
    .map(track => {
      let score = 0;

      // Genre match: +15 points per match in playlist
      if (playlistGenres.includes(track.genre)) {
        const count = playlistGenres.filter(g => g === track.genre).length;
        score += count * 15;
      }

      // Artist match: +25 points per match in playlist
      if (playlistArtists.includes(track.artistId)) {
        const count = playlistArtists.filter(a => a === track.artistId).length;
        score += count * 25;
      }

      // User preference scores: +8 points per score unit
      const genrePref = genreScores[track.genre] || 0;
      score += genrePref * 8;

      // User top genres: +10 points
      if (userTopGenres.includes(track.genre)) {
        score += 10;
      }

      // Popularity (plays) bonus
      score += Math.min(10, (track.plays || 0) / 1000000);

      return { track, score };
    })
    .sort((a, b) => b.score - a.score)
    .map(item => item.track);
};

// ─── Suggested Track ─────────────────────────────────────────────────────────
function SuggestedTrack({ track, onAdd, isAdded }: { track: any; onAdd: () => void; isAdded: boolean }) {
  const [hov, setHov] = useState(false);
  const { playTrack } = usePlayerStore();
  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
        borderRadius: 12, transition: 'background 0.15s',
        background: hov ? 'rgba(255,255,255,0.05)' : 'transparent', cursor: 'pointer',
      }}
    >
      <div onClick={() => playTrack(track, [track])} style={{ width: 44, height: 44, borderRadius: 8, background: trackGradient(track.id), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18 }}>🎵</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ color: '#fff', fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.title}</p>
        <p style={{ color: '#737373', fontSize: 12 }}>{track.artistName}</p>
      </div>
      {isAdded ? (
        <div style={{ color: '#b08850', padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Check size={14} strokeWidth={3.5} />
        </div>
      ) : (
        <motion.button
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          onClick={onAdd}
          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 20, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
        >
          <Plus size={11} strokeWidth={3} /> Add
        </motion.button>
      )}
    </div>
  );
}

// ─── Desktop Recommended Card ────────────────────────────────────────────────
function DesktopRecommendedCard({ track, onAdd, isAdded, onPlay }: { track: any; onAdd: () => void; isAdded: boolean; onPlay: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={onPlay}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '12px 16px',
        borderRadius: 14,
        background: hov ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.04)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        position: 'relative'
      }}
    >
      <div style={{
        width: 52,
        height: 52,
        borderRadius: 8,
        background: trackGradient(track.id),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        position: 'relative',
        overflow: 'hidden'
      }}>
        {track.coverImage ? (
          <img src={track.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ fontSize: 20 }}>🎵</span>
        )}
        {hov && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Play size={18} fill="#fff" color="#fff" />
          </div>
        )}
      </div>
      
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          color: hov ? '#b08850' : '#fff',
          fontWeight: 600,
          fontSize: 14,
          margin: '0 0 4px 0',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          transition: 'color 0.2s'
        }}>{track.title}</p>
        <p style={{
          color: '#a3a3a3',
          fontSize: 12,
          margin: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>{track.artistName}</p>
      </div>

      <div onClick={(e) => e.stopPropagation()}>
        {isAdded ? (
          <div style={{
            color: '#b08850',
            padding: '6px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Check size={18} strokeWidth={3} />
          </div>
        ) : (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onAdd}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.14)',
              color: '#fff',
              cursor: 'pointer',
              padding: 0
            }}
          >
            <Plus size={16} />
          </motion.button>
        )}
      </div>
    </div>
  );
}

// ─── Desktop Trending Card ───────────────────────────────────────────────────
function DesktopTrendingCard({ track, onAdd, isAdded, onPlay }: { track: any; onAdd: () => void; isAdded: boolean; onPlay: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={onPlay}
      style={{
        width: 140,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        cursor: 'pointer',
        position: 'relative',
        padding: 12,
        borderRadius: 12,
        background: hov ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.04)',
        transition: 'all 0.2s ease'
      }}
    >
      <div style={{
        width: 140,
        height: 140,
        borderRadius: 8,
        overflow: 'hidden',
        position: 'relative',
        background: trackGradient(track.id),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {track.coverImage ? (
          <img src={track.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ fontSize: 28 }}>🎵</span>
        )}

        <div style={{
          position: 'absolute',
          top: 6,
          left: 6,
          background: 'rgba(0,0,0,0.75)',
          padding: '2px 6px',
          borderRadius: 4,
          fontSize: 9,
          fontWeight: 800,
          color: '#b08850',
          border: '1px solid rgba(176, 136, 80,0.3)',
          zIndex: 5
        }}>
          🔥 {numFmt(track.plays || 0)}
        </div>

        {hov && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3
          }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: '#b08850',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(176, 136, 80,0.4)'
            }}>
              <Play size={18} fill="black" color="black" style={{ marginLeft: 2 }} />
            </div>
          </div>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            if (isAdded) return;
            onAdd();
          }}
          style={{
            position: 'absolute',
            bottom: 8,
            right: 8,
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: isAdded ? '#b08850' : 'rgba(0,0,0,0.85)',
            border: isAdded ? 'none' : '1px solid rgba(255,255,255,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isAdded ? '#000' : '#fff',
            cursor: 'pointer',
            boxShadow: '0 4px 8px rgba(0,0,0,0.4)',
            zIndex: 10,
            opacity: hov || isAdded ? 1 : 0,
            transform: hov || isAdded ? 'scale(1)' : 'scale(0.8)',
            transition: 'all 0.2s ease'
          }}
        >
          {isAdded ? <Check size={14} strokeWidth={3} /> : <Plus size={14} />}
        </button>
      </div>

      <div style={{ minWidth: 0 }}>
        <p style={{
          color: hov ? '#b08850' : '#fff',
          fontWeight: 600,
          fontSize: 13,
          margin: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          transition: 'color 0.2s'
        }}>{track.title}</p>
        <p style={{
          color: '#a3a3a3',
          fontSize: 11,
          margin: '2px 0 0 0',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>{track.artistName}</p>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function PlaylistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [currentTime, setCurrentTime] = useState('11:41');
  const [scrollTop, setScrollTop] = useState(0);
  // Mobile scroll animations based on scrollTop state
  const headerBgOpacity = Math.min(1, Math.max(0, scrollTop / 180));
  const headerBorder = scrollTop > 180 ? '1px solid var(--color-ss-border, rgba(43, 34, 26, 0.08))' : '1px solid rgba(255,255,255,0)';
  const coverScale = Math.max(0.5, 1 - (scrollTop / 250) * 0.5);
  const coverOpacity = Math.min(1, Math.max(0, 1 - scrollTop / 200));
  const coverTranslateY = Math.min(40, (scrollTop / 250) * 40);

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      const h = d.getHours().toString().padStart(2, '0');
      const m = d.getMinutes().toString().padStart(2, '0');
      setCurrentTime(`${h}:${m}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const { customPlaylists, addTrackToPlaylist, removeTrackFromPlaylist, addPlaylist, setCustomPlaylists } = usePlaylistStore();
  const { downloadTrack, removeDownloadedTrack, downloadedTrackIds, downloadingIds } = useDownloadStore();

  const [pickerTrack, setPickerTrack] = useState<any | null>(null);
  const [showPlaylistPicker, setShowPlaylistPicker] = useState(false);
  const [pickerSearchQuery, setPickerSearchQuery] = useState('');

  const handleDownloadClick = async (e: React.MouseEvent, track: any) => {
    e.stopPropagation();
    const downloaded = downloadedTrackIds.includes(track.id);
    const downloading = downloadingIds.includes(track.id);
    if (downloaded) {
      if (confirm(`Remove "${track.title}" from downloads?`)) {
        await removeDownloadedTrack(track.id);
      }
    } else if (!downloading) {
      await downloadTrack(track);
    }
  };

  const handleAddToLikedSongs = (e: React.MouseEvent, track: any) => {
    e.stopPropagation();
    const isLiked = user?.likedSongs.includes(track.id) ?? false;
    toggleLikeSong(track.id);
    
    toast(
      (t) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 4, overflow: 'hidden', flexShrink: 0,
              background: `hsl(${(track.id.charCodeAt(0) * 37) % 360}, 50%, 25%)`
            }}>
              {track.coverImage && <img src={track.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>
              {isLiked ? 'Removed from Liked Songs' : 'Added to Liked Songs'}
            </span>
          </div>
          {!isLiked && (
            <button
              onClick={(ev) => { ev.stopPropagation(); toast.dismiss(t.id); setPickerTrack(track); setShowPlaylistPicker(true); }}
              style={{ background: 'none', border: 'none', color: '#b08850', fontSize: 13, fontWeight: 700, cursor: 'pointer', flexShrink: 0, padding: '2px 0' }}
            >
              Change
            </button>
          )}
        </div>
      ),
      {
        id: 'liked-toast',
        duration: 2500,
        style: {
          background: '#282828',
          color: '#fff',
          borderRadius: '8px',
          border: '1px solid rgba(255,255,255,0.08)',
          padding: '10px 14px',
          maxWidth: 340,
          fontSize: 13,
        },
      }
    );
  };
  const fetchTracks = useMusicStore(state => state.fetchTracks);
  const getForYouTracks = useMusicStore(state => state.getForYouTracks);
  const forYouTracks = getForYouTracks();

  const getAllTracks = useMusicStore(state => state.getAllTracks);
  // Subscribe to changes in dependencies of getAllTracks to force re-render when they change
  useMusicStore(state => state.allTracks);
  useMusicStore(state => state.uploadedTracks);
  useMusicStore(state => state.activeArtistIds);
  const allTracks = getAllTracks();
  const genreScores = useMusicStore(state => state.genreScores);

  const [recommendedSongs, setRecommendedSongs] = useState<any[]>([]);
  const [showAllSongsDrawer, setShowAllSongsDrawer] = useState(false);
  const [drawerSearch, setDrawerSearch] = useState('');
  const [drawerGenre, setDrawerGenre] = useState('');
  const [drawerCategory, setDrawerCategory] = useState('');

  // Fetch trending songs for Issue 2
  const getTrendingTracks = useMusicStore(state => state.getTrendingTracks);
  const trendingTracks = getTrendingTracks().slice(0, 10);

  useEffect(() => {
    setHydrated(true);
    fetchTracks();
  }, [fetchTracks]);

  const mockPlaylist = mockPlaylists.find((p: any) => normalizeId(p.id) === normalizeId(id));
  const customPlaylist = customPlaylists.find((p: any) => normalizeId(p.id) === normalizeId(id));
  const playlist = mockPlaylist || customPlaylist || null;

  const { currentTrack, isPlaying, playTrack, togglePlay, toggleShuffle, shuffle } = usePlayerStore();
  const { user, toggleLikeSong, toggleSavePlaylist } = useAuthStore();
  const isSaved = playlist 
    ? (user?.playlists || []).some((pid: string) => normalizeId(pid) === normalizeId(playlist.id))
    : false;
  const isOwner = playlist && user ? playlist.ownerId === user.id : false;

  const [searchQuery, setSearchQuery] = useState('');
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showSuggested, setShowSuggested] = useState(false);
  const [activeSort, setActiveSort] = useState('custom');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);
  const [miniHeader, setMiniHeader] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState(playlist?.title || '');
  const [editCover, setEditCover] = useState(playlist?.coverImage || '');
  const [editGrad, setEditGrad] = useState((playlist as any)?.gradientCss || EDIT_GRADIENTS[0].css);

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playlist || !editTitle.trim()) return;
    if (!isOwner) {
      toast.error('You do not have permission to edit this playlist');
      return;
    }
    const normPlaylistId = normalizeId(playlist.id);
    const updated = customPlaylists.map((p: any) => {
      if (normalizeId(p.id) === normPlaylistId) {
        return {
          ...p,
          title: editTitle.trim(),
          coverImage: editCover.trim(),
          gradientCss: editGrad,
        };
      }
      return p;
    });
    setCustomPlaylists(updated);
    setShowEditModal(false);
    toast.success('Playlist updated! ✨', { style: { background: '#1a1a1a', color: '#fff' } });
  };

  const scrollRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const { scrollLeft, clientWidth } = carouselRef.current;
      const scrollAmount = clientWidth * 0.75;
      carouselRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    const el = document.querySelector('.app-main');
    if (!el) return;
    const handler = () => {
      const scrolled = el.scrollTop > 340;
      setMiniHeader(scrolled);
      setScrollTop(el.scrollTop);
    };
    el.addEventListener('scroll', handler);
    return () => el.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMoreMenu(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const isCustomPlaylist = playlist ? normalizeId(playlist.id).includes('custom') : false;
  const customTracks = (playlist?.tracks?.map((id: string) => allTracks.find(t => t.id === id)).filter(Boolean) as any[]) || [];
  const rawTracks = playlist 
    ? (customTracks.length > 0
      ? customTracks
      : isCustomPlaylist
        ? []                        // custom playlists start empty — don't fill with random tracks
        : mockTracks.slice(0, 8))   // seeded playlists fall back to sample tracks
    : [];

  // Initialize and compute AI recommendations
  useEffect(() => {
    if (playlist && allTracks.length > 0) {
      const recs = getAIRecommendations(rawTracks, allTracks, user, genreScores)
        .filter(t => !rawTracks.some(r => r?.id === t.id))
        .slice(0, 6);
      setRecommendedSongs(recs);
    }
  }, [playlist?.id, allTracks.length]);

  if (!hydrated) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: `3px solid rgba(255,255,255,0.1)`, borderTopColor: G, animation: 'spin 0.7s linear infinite' }} />
      </div>
    );
  }

  if (!playlist) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 16 }}>
        <div style={{ width: 72, height: 72, borderRadius: 18, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ListMusic size={30} color="#525252" />
        </div>
        <p style={{ color: '#737373', fontSize: 16, fontWeight: 600 }}>Playlist not found</p>
        <Link href="/home" style={{ color: G, fontSize: 13, textDecoration: 'none', fontWeight: 700 }}>← Back to Home</Link>
      </div>
    );
  }

  const displayCoverImage = playlist.coverImage || (rawTracks.length > 0 ? rawTracks[0]?.coverImage : '');

  const filteredTracks = rawTracks.filter(t =>
    !searchQuery ||
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.artistName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const realMockTracks = mockTracks.filter(t => !t.id.startsWith('track-manoj-'));
  const allSuggestedBase = [
    ...forYouTracks,
    ...realMockTracks.filter(mt => !forYouTracks.some(ft => ft.id === mt.id))
  ];
  const suggestedTracks = recommendedSongs.length > 0
    ? recommendedSongs
    : allSuggestedBase.filter(t => !rawTracks.some(r => r.id === t.id)).slice(0, 6);
  const isCurrentPlaylist = rawTracks.some(t => t.id === currentTrack?.id);
  const totalDuration = rawTracks.reduce((s, t) => s + t.duration, 0);
  const isLikedSongs = playlist.id === 'playlist-1';
  const uniqueArtists = [...new Set(rawTracks.map(t => t.artistName))];

  const filteredDrawerTracks = allTracks.filter(track => {
    // Search filter
    if (drawerSearch.trim()) {
      const q = drawerSearch.toLowerCase();
      const matchTitle = track.title.toLowerCase().includes(q);
      const matchArtist = track.artistName.toLowerCase().includes(q);
      if (!matchTitle && !matchArtist) return false;
    }

    // Genre filter
    if (drawerGenre) {
      if (track.genre !== drawerGenre) return false;
    }

    // Category filter
    if (drawerCategory) {
      if (drawerCategory === 'Recommended') {
        const recIds = recommendedSongs.map(r => r.id);
        if (!recIds.includes(track.id)) return false;
      } else if (drawerCategory === 'Trending') {
        const trendIds = trendingTracks.map(t => t.id);
        if (!trendIds.includes(track.id)) return false;
      } else if (drawerCategory === 'Popular') {
        if ((track.plays || 0) < 5000000) return false;
      } else if (drawerCategory === 'Recently Added') {
        if (track.year < 2024) return false;
      }
    }

    return true;
  });

  // Hero gradient
  const customGrad = (playlist as any).gradientCss;
  const heroGrad = isLikedSongs
    ? 'linear-gradient(160deg, #3b1f8c 0%, #6d28d9 35%, #be185d 80%, #0c0c0c 100%)'
    : customGrad
      ? `linear-gradient(160deg, ${customGrad.replace('linear-gradient(135deg,', '').replace(')', '')
          .split(',').map((c: string, i: number) => i === 0 ? c + ' 0%' : c + ' 50%').join(', ')}, #0c0c0c 100%)`
      : `linear-gradient(160deg, #1a3a28 0%, #1e4d35 35%, #111 100%)`;

  const handlePlay = () => {
    if (isCurrentPlaylist) togglePlay();
    else if (rawTracks.length > 0) playTrack(rawTracks[0], rawTracks);
  };

  const handleShuffle = () => {
    const shuffled = [...rawTracks].sort(() => Math.random() - 0.5);
    if (shuffled.length > 0) { toggleShuffle(); playTrack(shuffled[0], shuffled); }
  };

  const SORT_OPTS = [
    { v: 'custom',  l: 'Custom Order' },
    { v: 'az',      l: 'Title (A → Z)' },
    { v: 'artist',  l: 'Artist' },
    { v: 'album',   l: 'Album' },
    { v: 'recent',  l: 'Date Added' },
    { v: 'duration',l: 'Duration' },
  ];

  const themeColor = playlist.id === 'playlist-1' ? '#3b1f8c' : playlist.id === 'playlist-2' ? '#115332' : '#143e26';

  return (
    <div className="playlist-themed-container" style={{ minHeight: '100%', background: 'var(--color-ss-bg, #fbf9f5)', position: 'relative' }}>
      <style>{`
        /* Dynamic styles to override global elements for this page only */
        @media (max-width: 768px) {
          .app-main {
            padding-bottom: 120px !important;
            border-radius: 0px !important;
            background: var(--color-ss-bg, #fbf9f5) !important;
          }
          .playlist-desktop-container {
            display: none !important;
          }
          .playlist-mobile-container {
            display: block !important;
          }
        }
        @media (min-width: 769px) {
          .playlist-desktop-container {
            display: block !important;
          }
          .playlist-mobile-container {
            display: none !important;
          }
          .all-songs-drawer-overlay {
            justify-content: center !important;
            align-items: center !important;
          }
          .all-songs-drawer-content {
            width: 620px !important;
            max-width: 90% !important;
            height: 75vh !important;
            border-radius: 20px !important;
            border: 1px solid var(--color-ss-border, rgba(43, 34, 26, 0.08)) !important;
            box-shadow: 0 24px 64px rgba(43, 34, 26, 0.1) !important;
          }
          .carousel-nav-btn:hover {
            background: var(--color-ss-hover) !important;
            border-color: var(--color-ss-border) !important;
            transform: scale(1.05);
          }
        }
        
        .playlist-mobile-container {
          background-color: var(--color-ss-bg, #fbf9f5);
          font-family: 'Spotify Circular', 'Circular', -apple-system, BlinkMacSystemFont, sans-serif;
          min-height: 100vh;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        /* ─── Light/Beige Theme CSS Overrides ─── */
        
        .playlist-desktop-container h2,
        .playlist-desktop-container h3,
        .playlist-desktop-container h4 {
          color: var(--color-ss-text-primary, #221a15) !important;
        }

        /* Override general texts to be espresso */
        .playlist-desktop-container p:not(.hero-text):not(.text-white-force),
        .playlist-desktop-container span:not(.hero-text):not(.text-white-force) {
          color: var(--color-ss-text-primary, #221a15) !important;
        }

        /* Override muted texts */
        .playlist-desktop-container .text-ss-text-muted,
        .playlist-desktop-container span[style*="color: rgb(115, 115, 115)"],
        .playlist-desktop-container p[style*="color: rgb(115, 115, 115)"],
        .playlist-desktop-container span[style*="color: #737373"],
        .playlist-desktop-container p[style*="color: #737373"],
        .playlist-desktop-container div[style*="color: rgb(82, 82, 82)"],
        .playlist-desktop-container div[style*="color: #525252"],
        .playlist-desktop-container span[style*="color: #525252"] {
          color: var(--color-ss-text-muted, #87786c) !important;
        }

        /* Controls bar buttons */
        .playlist-desktop-container button:not(.play-btn-force):not(.text-white-force) {
          color: var(--color-ss-text-primary, #221a15) !important;
          border-color: rgba(43, 34, 26, 0.2) !important;
        }
        
        /* Lists and card hovers */
        .playlist-desktop-container div[style*="background: rgba(255, 255, 255, 0.05)"],
        .playlist-desktop-container div[style*="background: rgba(255,255,255,0.05)"],
        .playlist-desktop-container div[style*="background: rgba(255, 255, 255, 0.08)"],
        .playlist-desktop-container div[style*="background: rgba(255,255,255,0.08)"] {
          background: var(--color-ss-surface, #f4eede) !important;
          border-color: var(--color-ss-border, rgba(43, 34, 26, 0.08)) !important;
        }

        /* Borders */
        .playlist-desktop-container div[style*="border-bottom: 1px solid rgba(255,255,255,0.07)"] {
          border-bottom: 1px solid var(--color-ss-border, rgba(43, 34, 26, 0.08)) !important;
        }
        .playlist-desktop-container div[style*="border-top: 1px solid rgba(255,255,255,0.07)"] {
          border-top: 1px solid var(--color-ss-border, rgba(43, 34, 26, 0.08)) !important;
        }
        .playlist-desktop-container div[style*="border-bottom: 1px solid rgba(255,255,255,0.05)"] {
          border-bottom: 1px solid var(--color-ss-border, rgba(43, 34, 26, 0.08)) !important;
        }

        /* Context menus / dropdowns */
        .playlist-themed-container div[style*="background: rgb(30, 30, 30)"],
        .playlist-themed-container div[style*="background: #1e1e1e"] {
          background: var(--color-ss-elevated, #ffffff) !important;
          border: 1px solid var(--color-ss-border, rgba(43, 34, 26, 0.08)) !important;
          box-shadow: 0 10px 30px rgba(43, 34, 26, 0.1) !important;
        }
        .playlist-themed-container div[style*="background: rgb(30, 30, 30)"] button,
        .playlist-themed-container div[style*="background: #1e1e1e"] button,
        .playlist-themed-container div[style*="background: rgb(30, 30, 30)"] span,
        .playlist-themed-container div[style*="background: #1e1e1e"] span,
        .playlist-themed-container div[style*="background: rgb(30, 30, 30)"] p,
        .playlist-themed-container div[style*="background: #1e1e1e"] p {
          color: var(--color-ss-text-primary, #221a15) !important;
        }
        .playlist-themed-container div[style*="background: rgb(30, 30, 30)"] button:hover,
        .playlist-themed-container div[style*="background: #1e1e1e"] button:hover {
          background: var(--color-ss-surface, #f4eede) !important;
        }

        /* Modals & drawers */
        .playlist-themed-container .all-songs-drawer-content,
        .playlist-themed-container div[style*="background: rgb(18, 18, 18)"],
        .playlist-themed-container div[style*="background: #121212"] {
          background: var(--color-ss-elevated, #ffffff) !important;
          border-color: var(--color-ss-border, rgba(43, 34, 26, 0.08)) !important;
        }
        .playlist-themed-container .all-songs-drawer-content h3,
        .playlist-themed-container .all-songs-drawer-content p,
        .playlist-themed-container .all-songs-drawer-content span,
        .playlist-themed-container .all-songs-drawer-content input,
        .playlist-themed-container div[style*="background: rgb(18, 18, 18)"] span,
        .playlist-themed-container div[style*="background: #121212"] span,
        .playlist-themed-container div[style*="background: rgb(18, 18, 18)"] p,
        .playlist-themed-container div[style*="background: #121212"] p,
        .playlist-themed-container div[style*="background: rgb(18, 18, 18)"] h3,
        .playlist-themed-container div[style*="background: #121212"] h3 {
          color: var(--color-ss-text-primary, #221a15) !important;
        }
        .playlist-themed-container .all-songs-drawer-content input,
        .playlist-themed-container div[style*="background: rgb(18, 18, 18)"] input,
        .playlist-themed-container div[style*="background: #121212"] input {
          background: var(--color-ss-surface, #f4eede) !important;
          color: var(--color-ss-text-primary, #221a15) !important;
          border: 1px solid var(--color-ss-border, rgba(43, 34, 26, 0.08)) !important;
        }

        /* Mobile Container styles */
        .playlist-mobile-container p,
        .playlist-mobile-container span,
        .playlist-mobile-container h1,
        .playlist-mobile-container h2,
        .playlist-mobile-container h3,
        .playlist-mobile-container h4 {
          color: var(--color-ss-text-primary, #221a15) !important;
        }
        .playlist-mobile-container button:not(.play-btn-force):not(.text-white-force) {
          color: var(--color-ss-text-primary, #221a15) !important;
          border-color: rgba(43, 34, 26, 0.2) !important;
        }
        .playlist-mobile-container input {
          background: var(--color-ss-elevated, #ffffff) !important;
          color: var(--color-ss-text-primary, #221a15) !important;
        }
      `}</style>

      {/* ── DESKTOP PLAYLIST VIEW ── */}
      <div className="playlist-desktop-container" style={{ minHeight: '100%', background: 'var(--color-ss-bg, #fbf9f5)', position: 'relative' }}>
        {/* ── Sticky mini-header ─────────────────────────────────────────── */}
        <AnimatePresence>
          {miniHeader && (
            <motion.div
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              style={{
                position: 'sticky', top: 0, zIndex: 50,
                background: isLikedSongs
                  ? 'rgba(55,28,130,0.95)'
                  : 'rgba(20,50,32,0.95)',
                backdropFilter: 'blur(20px)',
                borderBottom: '1px solid rgba(255,255,255,0.07)',
                paddingLeft: 16,
                paddingRight: 16,
                paddingBottom: 10,
                paddingTop: 'calc(var(--sat, 0px) + 10px)',
                display: 'flex', alignItems: 'center', gap: 14,
              }}
            >
              {/* Back button on sticky mini-header */}
              <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', padding: 0, marginRight: 4 }}>
                <ChevronLeft size={24} />
              </button>

              <button onClick={handlePlay}
                style={{ width: 36, height: 36, borderRadius: '50%', background: G, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 12px ${G}50`, flexShrink: 0 }}>
                {isCurrentPlaylist && isPlaying ? <Pause size={15} fill="black" color="black" /> : <Play size={15} fill="black" color="black" />}
              </button>
              <p style={{ fontFamily: 'var(--font-outfit), sans-serif', color: '#fff', fontSize: 17, fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{playlist.title}</p>
              <span style={{ color: '#737373', fontSize: 12 }}>{rawTracks.length} songs</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Hero ───────────────────────────────────────────────────────── */}
        <div ref={heroRef} className="playlist-hero-container" style={{ position: 'relative', overflow: 'hidden', height: 380, width: '100%', background: '#1e1610' }}>
          
          {/* Cover Photo Banner (Using playlist cover or custom gradient) */}
          <div style={{
            position: 'absolute',
            inset: 0,
            zIndex: 0
          }}>
            {displayCoverImage ? (
              <img 
                src={displayCoverImage} 
                alt={playlist.title} 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover',
                  opacity: 0.65
                }} 
              />
            ) : customGrad ? (
              <div style={{ width: '100%', height: '100%', background: customGrad, opacity: 0.75 }} />
            ) : (
              <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #2b221a, #b08850)', opacity: 0.75 }} />
            )}
            
            {/* Linear Gradient Overlay for deep contrast */}
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to bottom, rgba(43,34,26,0.15) 0%, rgba(43,34,26,0.85) 100%)'
            }} />
          </div>

          {/* TopBar container overlayed at the top */}
          <div style={{ position: 'relative', zIndex: 10 }}>
            <TopBar transparent />
          </div>

          {/* Playlist Details Overlay (Aligned bottom-left, styled like Nandhini Profile Page) */}
          <div className="playlist-hero-details" style={{
            position: 'absolute',
            bottom: '24px',
            left: '32px',
            right: '32px',
            zIndex: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 6
          }}>
            
            {/* Type/Verified Badge Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                background: '#b08850',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#000',
                flexShrink: 0
              }}>
                <Check size={10} strokeWidth={4} color="black" />
              </div>
              <span style={{ 
                fontSize: 12, 
                fontWeight: 700, 
                color: '#fff',
                fontFamily: 'var(--font-inter), sans-serif',
                textTransform: 'uppercase',
                letterSpacing: '0.08em'
              }}>
                {playlist.isCollaborative ? '👥 Collaborative ' : ''}
                {isLikedSongs ? '❤️ Verified Personal Playlist' : 'Verified Public Playlist'}
              </span>
            </div>

            {/* Playlist Title & Edit Details Button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <h1 style={{ 
                fontFamily: 'var(--font-outfit), sans-serif', 
                fontSize: 52, 
                fontWeight: 900, 
                letterSpacing: '-0.02em', 
                margin: 0,
                color: '#fff',
                lineHeight: 1.1,
                textShadow: '0 2px 12px rgba(0,0,0,0.8)'
              }}>
                {playlist.title}
              </h1>
              {isCustomPlaylist && isOwner && (
                <button
                  onClick={() => {
                    setEditTitle(playlist.title);
                    setEditCover(playlist.coverImage || '');
                    setEditGrad((playlist as any).gradientCss || '');
                    setShowEditModal(true);
                  }}
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 700,
                    padding: '6px 16px',
                    borderRadius: 20,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontFamily: 'var(--font-inter), sans-serif',
                    backdropFilter: 'blur(10px)',
                    alignSelf: 'center'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.18)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                  }}
                >
                  Edit Details
                </button>
              )}
            </div>

            {/* Playlist Description */}
            {playlist.description && (
              <p style={{
                fontSize: 14,
                color: '#d1d5db',
                margin: '4px 0 2px 0',
                maxWidth: '600px',
                lineHeight: 1.4,
                textShadow: '0 1px 4px rgba(0,0,0,0.6)'
              }}>
                {playlist.description}
              </p>
            )}

            {/* Owner & Stats Row */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 8, 
              fontSize: 13, 
              color: '#d1d5db', 
              fontWeight: 600,
              textShadow: '0 1px 4px rgba(0,0,0,0.6)',
              marginTop: 4
            }}>
              {playlist.ownerId === 'user-1' && user?.avatar ? (
                <img src={user.avatar} alt="" style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'linear-gradient(135deg, #2563eb, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#fff' }}>
                  {(playlist.ownerName || 'Y').charAt(0).toUpperCase()}
                </div>
              )}
              <span>{playlist.ownerName || 'You'}</span>
              <span>•</span>
              <span>{playlist.followers > 0 ? `${playlist.followers.toLocaleString()} saves` : '0 saves'}</span>
              <span>•</span>
              <span>{fmtTime(totalDuration)}</span>
            </div>
          </div>
        </div>

        {/* ── Controls Bar ───────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          style={{ 
            background: 'linear-gradient(180deg, rgba(10,10,10,0) 0%, #0a0a0a 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '32px 32px 24px 32px',
          }}
        >
          {/* Left section: Play, Shuffle, Save, Download, More */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            {/* Play Button */}
            <motion.button
              whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
              onClick={handlePlay}
              style={{ 
                width: 56, 
                height: 56, 
                borderRadius: '50%', 
                background: G, 
                border: 'none', 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                boxShadow: `0 6px 24px ${G}50`,
                marginRight: 4,
                flexShrink: 0
              }}
            >
              {isCurrentPlaylist && isPlaying
                ? <Pause size={24} fill="black" color="black" />
                : <Play size={24} fill="black" color="black" style={{ marginLeft: 2 }} />}
            </motion.button>

            {/* Shuffle */}
            <motion.button 
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={handleShuffle}
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.15)',
                color: shuffle ? '#b08850' : '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                flexShrink: 0
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
              }}
            >
              <Shuffle size={14} color={shuffle ? '#b08850' : '#fff'} />
            </motion.button>

            {/* Save / Follow (+) or Add to your playlist capsule button if not owner */}
            {!isOwner ? (
              <motion.button 
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => {
                  toggleSavePlaylist(playlist.id);
                  toast(isSaved ? 'Removed from your playlists' : 'Added to your playlists', {
                    icon: isSaved ? '🗑️' : '✨',
                    style: { background: '#1a1a1a', color: '#fff', border: `1px solid ${isSaved ? '#f87171' : G}30` }
                  });
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 20px',
                  borderRadius: 20,
                  background: isSaved ? G : 'rgba(255,255,255,0.08)',
                  border: isSaved ? 'none' : '1px solid rgba(255,255,255,0.2)',
                  color: isSaved ? '#000' : '#fff',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-inter), sans-serif',
                  transition: 'all 0.2s',
                  backdropFilter: 'blur(10px)',
                  flexShrink: 0
                }}
              >
                {isSaved ? <Check size={14} color="black" strokeWidth={3} /> : <Plus size={14} />}
                <span>{isSaved ? 'In your playlists' : 'Add to your playlist'}</span>
              </motion.button>
            ) : (
              <motion.button 
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => {
                  toggleSavePlaylist(playlist.id);
                  toast(isSaved ? 'Removed from library' : 'Added to your library', {
                    icon: isSaved ? '🗑️' : '✨',
                    style: { background: '#1a1a1a', color: '#fff', border: `1px solid ${isSaved ? '#f87171' : G}30` }
                  });
                }}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: isSaved ? G : 'transparent',
                  border: isSaved ? 'none' : '1px solid rgba(255,255,255,0.15)',
                  color: isSaved ? '#000' : '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  flexShrink: 0
                }}
                onMouseEnter={e => {
                  if (!isSaved) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isSaved) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                  }
                }}
              >
                {isSaved ? <Check size={14} color="#000" strokeWidth={3.5} /> : <Plus size={14} />}
              </motion.button>
            )}

            {/* Download (↓) */}
            <motion.button 
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => toast('Download requires Premium 👑', { icon: '⬇️', style: { background: '#1a1a1a', color: '#fff' } })}
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                flexShrink: 0
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
              }}
            >
              <Download size={14} />
            </motion.button>

            {/* More options menu (vertical three dots) */}
            <div ref={menuRef} style={{ position: 'relative', flexShrink: 0 }}>
              <motion.button 
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                }}
              >
                <MoreVertical size={16} />
              </motion.button>
              <AnimatePresence>
                {showMoreMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.92, y: -6 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.92, y: -6 }}
                    style={{ position: 'absolute', left: 0, top: 44, zIndex: 200, background: '#1e1e1e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, overflow: 'hidden', minWidth: 220, boxShadow: '0 20px 60px rgba(0,0,0,0.7)' }}
                  >
                    {[
                      { l: 'Add to Queue',         i: Layers,      fn: () => toast('Added to queue!', { icon: '🎶' }) },
                      { l: 'Go to Radio',           i: Radio,       fn: () => toast('Opening radio...', { icon: '📻' }) },
                      { l: 'Copy Playlist Link',    i: Copy,        fn: () => toast.success('Copied!', { icon: '🔗' }) },
                      { l: 'Open in New Tab',       i: ExternalLink,fn: () => toast('Opening...') },
                      { l: 'Report Playlist',       i: Bell,        fn: () => toast('Reported', { icon: '⚠️' }), muted: true },
                    ].map(item => (
                      <button key={item.l} onClick={() => { setShowMoreMenu(false); item.fn(); }}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', background: 'none', border: 'none', color: (item as any).muted ? '#525252' : '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer', textAlign: 'left', transition: 'background 0.1s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <item.i size={14} color={(item as any).muted ? '#525252' : 'inherit'} /> {item.l}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right section: Glassmorphic Stats Strip */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {[
              { label: `${rawTracks.length} Songs`, icon: Music2,     color: G },
              { label: fmtTime(totalDuration),      icon: Clock,      color: '#0ea5e9' },
              { label: `${uniqueArtists.length} Artists`, icon: Star, color: '#f59e0b' },
              ...(playlist.followers > 0 ? [{ label: `${numFmt(playlist.followers)} Saves`, icon: Heart, color: '#34d399' }] : []),
            ].map(({ label, icon: Icon, color }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 14px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <Icon size={13} color={color} />
                <span style={{ color: '#d1d5db', fontSize: 12, fontWeight: 600 }}>{label}</span>
              </div>
            ))}
          </div>
        </motion.div>
 
        {/* ── Search + Sort Toolbar ─────────────────────────────────────── */}
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            padding: '12px 32px 20px 32px' 
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
            {/* Search */}
            <div style={{ position: 'relative', width: 280 }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#a3a3a3', pointerEvents: 'none' }} />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search in playlist…"
                style={{ width: '100%', paddingLeft: 36, paddingRight: searchQuery ? 32 : 12, paddingTop: 9, paddingBottom: 9, background: 'rgba(255,255,255,0.06)', border: searchQuery ? `1px solid ${G}50` : '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#fff', fontSize: 13, outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box' }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#a3a3a3', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><X size={14} /></button>
              )}
            </div>

            {/* Sort */}
            <div style={{ position: 'relative' }}>
              <button onClick={() => setShowSortMenu(!showSortMenu)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#d1d5db', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#d1d5db'; }}
              >
                <BarChart2 size={13} style={{ transform: 'rotate(90deg)' }} />
                {SORT_OPTS.find(s => s.v === activeSort)?.l}
                <ChevronDown size={12} style={{ transform: showSortMenu ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>
              <AnimatePresence>
                {showSortMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.96 }}
                    style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 300, background: '#1e1e1e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, overflow: 'hidden', minWidth: 180, boxShadow: '0 16px 48px rgba(0,0,0,0.6)' }}
                  >
                    <div style={{ padding: '6px 4px' }}>
                      {SORT_OPTS.map(opt => (
                        <button key={opt.v} onClick={() => { setActiveSort(opt.v); setShowSortMenu(false); }}
                          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 14px', background: 'none', border: 'none', color: activeSort === opt.v ? '#fff' : '#a3a3a3', fontSize: 13, fontWeight: 500, cursor: 'pointer', borderRadius: 8, transition: 'background 0.1s' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          {opt.l}
                          {activeSort === opt.v && <Check size={13} color={G} />}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Track count */}
          <span style={{ color: '#737373', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap' }}>
            {filteredTracks.length} {filteredTracks.length !== rawTracks.length ? `of ${rawTracks.length} ` : ''}tracks
          </span>
        </div>

        {/* ── Track Table ─────────────────────────────────────────────────── */}
        <div style={{ padding: '0 32px' }}>
          {/* Table header */}
          <div className="track-list-header" style={{ display: 'grid', gridTemplateColumns: '28px 46px 1fr 1fr 80px', gap: 12, padding: '8px 14px 10px', color: '#525252', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid rgba(255,255,255,0.07)', marginBottom: 4 }}>
            <span style={{ textAlign: 'center' }}>#</span>
            <span />
            <span>Title</span>
            <span>Album</span>
            <span style={{ textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
              <Clock size={12} />
            </span>
          </div>

          {/* Tracks */}
          <AnimatePresence>
            {filteredTracks.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '48px 24px', color: '#525252' }}>
                <Search size={28} style={{ margin: '0 auto 10px' }} />
                <p style={{ fontSize: 15, fontWeight: 600, color: '#737373' }}>No tracks match "{searchQuery}"</p>
              </motion.div>
            ) : (
              <div>
                {filteredTracks.map((track, i) => (
                  <motion.div key={track.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}>
                    <TrackCard track={track} index={i} queue={filteredTracks} />
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* ── DESKTOP MUSIC DISCOVERY SECTIONS ── */}
        {isOwner && (
          <div style={{ padding: '0 32px', marginTop: 48 }}>
          
          {/* 1. RECOMMENDED SONGS (2-column Grid) */}
          <div style={{ marginBottom: 48 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <h2 style={{
                  fontFamily: 'var(--font-outfit), sans-serif',
                  color: '#fff',
                  fontSize: 22,
                  fontWeight: 800,
                  margin: '0 0 4px 0'
                }}>Recommended Songs</h2>
                <p style={{
                  color: '#a3a3a3',
                  fontSize: 13,
                  fontWeight: 500,
                  margin: 0
                }}>
                  {rawTracks.length > 0 ? 'Based on the tracks in this playlist' : 'AI-curated recommendations for you'}
                </p>
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: 16
            }}>
              {suggestedTracks.map(track => {
                const isAdded = playlist.tracks.includes(track.id);
                return (
                  <DesktopRecommendedCard
                    key={track.id}
                    track={track}
                    isAdded={isAdded}
                    onPlay={() => playTrack(track, suggestedTracks)}
                    onAdd={() => {
                      addTrackToPlaylist(playlist.id, track.id);
                      toast.success("Song added to playlist", {
                        style: { background: '#1a1a1a', color: '#fff' }
                      });
                    }}
                  />
                );
              })}
            </div>
          </div>

          {/* 2. TRENDING SONGS (Carousel with Left/Right Buttons) */}
          <div style={{ marginBottom: 48 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <h2 style={{
                  fontFamily: 'var(--font-outfit), sans-serif',
                  color: '#fff',
                  fontSize: 22,
                  fontWeight: 800,
                  margin: '0 0 4px 0'
                }}>Trending Songs</h2>
                <p style={{
                  color: '#a3a3a3',
                  fontSize: 13,
                  fontWeight: 500,
                  margin: 0
                }}>
                  Most played tracks on Beato right now
                </p>
              </div>
              
              {/* Carousel Nav Buttons */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => scrollCarousel('left')}
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '50%',
                    width: 32,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  className="carousel-nav-btn"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => scrollCarousel('right')}
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '50%',
                    width: 32,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  className="carousel-nav-btn"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            <div
              ref={carouselRef}
              style={{
                display: 'flex',
                gap: 18,
                overflowX: 'auto',
                paddingBottom: 16,
                scrollbarWidth: 'none',
                scrollBehavior: 'smooth'
              }}
              className="no-scrollbar"
            >
              {trendingTracks.map(track => {
                const isAdded = playlist.tracks.includes(track.id);
                return (
                  <DesktopTrendingCard
                    key={track.id}
                    track={track}
                    isAdded={isAdded}
                    onPlay={() => playTrack(track, trendingTracks)}
                    onAdd={() => {
                      addTrackToPlaylist(playlist.id, track.id);
                      toast.success("Song added to playlist", {
                        style: { background: '#1a1a1a', color: '#fff' }
                      });
                    }}
                  />
                );
              })}
            </div>
          </div>

          {/* 3. VIEW ALL SONGS BUTTON */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAllSongsDrawer(true)}
              style={{
                background: '#ffffff',
                color: '#000000',
                border: 'none',
                borderRadius: 28,
                padding: '14px 40px',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 8px 20px rgba(255,255,255,0.15)',
                fontFamily: 'var(--font-outfit), sans-serif',
                transition: 'all 0.2s'
              }}
            >
              <Sparkles size={16} /> View All Songs
            </motion.button>
          </div>

        </div>
        )}

        {/* Bottom spacing */}
        <div style={{ height: 120 }} />
      </div>

      {/* ── MOBILE PLAYLIST VIEW ── */}
      <div className="playlist-mobile-container" style={{
        display: 'none',
        background: `linear-gradient(180deg, ${themeColor} 0%, var(--color-ss-bg, #fbf9f5) 50%, var(--color-ss-bg, #fbf9f5) 100%)`,
        paddingTop: 'calc(var(--sat, 0px) + 72px)',
        paddingBottom: 128,
        minHeight: '100vh',
        boxSizing: 'border-box'
      }}>

        {/* 2. TOP SECTION (Back arrow, search, sort) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingLeft: 16,
          paddingRight: 16,
          paddingTop: 'calc(var(--sat, 0px) + 16px)',
          paddingBottom: 12,
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          backgroundColor: `rgba(251, 249, 245, ${headerBgOpacity})`,
          borderBottom: headerBorder,
        }}>
          <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
            <ArrowLeft size={24} />
          </button>

          <div style={{ flex: 1, margin: '0 12px', position: 'relative' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(255, 255, 255, 0.12)',
              borderRadius: 24,
              padding: '6px 14px',
              gap: 8,
              height: 36,
              boxSizing: 'border-box'
            }}>
              <Search size={16} color="#b3b3b3" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Find in playlist"
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: '500',
                  width: '100%'
                }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', color: '#b3b3b3', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              style={{
                background: 'rgba(255, 255, 255, 0.12)',
                border: 'none',
                borderRadius: 24,
                color: '#fff',
                fontSize: 13,
                fontWeight: '600',
                cursor: 'pointer',
                padding: '6px 16px',
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxSizing: 'border-box',
                whiteSpace: 'nowrap'
              }}
            >
              Sort
            </button>
            <AnimatePresence>
              {showSortMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.96 }}
                  style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 300, background: '#1e1e1e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, overflow: 'hidden', minWidth: 160, boxShadow: '0 16px 48px rgba(0,0,0,0.6)' }}
                >
                  <div style={{ padding: '6px 4px' }}>
                    {SORT_OPTS.map(opt => (
                      <button key={opt.v} onClick={() => { setActiveSort(opt.v); setShowSortMenu(false); }}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 14px', background: 'none', border: 'none', color: activeSort === opt.v ? '#fff' : '#a3a3a3', fontSize: 13, fontWeight: 500, cursor: 'pointer', borderRadius: 8 }}
                      >
                        {opt.l}
                        {activeSort === opt.v && <Check size={13} color={G} />}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* 3. PLAYLIST HERO */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '24px 16px 16px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div 
            onClick={() => {
              if (isCustomPlaylist && isOwner) {
                setEditTitle(playlist.title);
                setEditCover(playlist.coverImage || '');
                setEditGrad((playlist as any).gradientCss || '');
                setShowEditModal(true);
              }
            }}
            style={{
              width: 240,
              height: 240,
              boxShadow: '0 12px 36px rgba(0,0,0,0.5)',
              transform: `scale(${coverScale}) translateY(${coverTranslateY}px)`,
              opacity: coverOpacity,
              flexShrink: 0,
              borderRadius: 8,
              overflow: 'hidden',
              background: 'rgba(255,255,255,0.05)',
              transition: 'transform 0.05s ease-out, opacity 0.05s ease-out',
              position: 'relative',
              cursor: isCustomPlaylist && isOwner ? 'pointer' : 'default'
            }}
          >
            {isLikedSongs ? (
              <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #4338ca 0%, #7c3aed 50%, #10b981 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Heart size={80} color="white" fill="white" />
              </div>
            ) : displayCoverImage ? (
              <img src={displayCoverImage} alt={playlist.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : customGrad ? (
              <div style={{ width: '100%', height: '100%', background: customGrad, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Music2 size={64} color="rgba(255,255,255,0.85)" />
              </div>
            ) : (
              <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1a3a28, #1e4d35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Music2 size={64} color="rgba(255,255,255,0.5)" />
              </div>
            )}
            {isCustomPlaylist && isOwner && (
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0,0,0,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Pencil size={32} color="#ffffff" style={{ opacity: 0.8 }} />
              </div>
            )}
          </div>
        </div>

        {/* 4. PLAYLIST INFO */}
        <div style={{ padding: '0 16px 12px', color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '12px 0 2px' }}>
            <h1 style={{
              fontSize: 28,
              fontWeight: '800',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
              margin: 0
            }}>{playlist.title}</h1>
            {isCustomPlaylist && isOwner && (
              <button
                onClick={() => {
                  setEditTitle(playlist.title);
                  setEditCover(playlist.coverImage || '');
                  setEditGrad((playlist as any).gradientCss || '');
                  setShowEditModal(true);
                }}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.4)',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 600,
                  padding: '4px 12px',
                  borderRadius: 16,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                Change
              </button>
            )}
          </div>
          
          {playlist.description && (
            <p style={{
              fontSize: 13.5,
              color: '#b3b3b3',
              margin: '0 0 6px',
              lineHeight: 1.4,
              fontWeight: 400
            }}>{playlist.description}</p>
          )}

          {/* Owner details */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            {playlist.ownerId === 'user-1' && user?.avatar ? (
              <img src={user.avatar} alt="" style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg, #2563eb, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>
                {(playlist.ownerName || 'Y').charAt(0).toUpperCase()}
              </div>
            )}
            <span style={{ fontSize: 13, fontWeight: '700' }}>{playlist.ownerName || 'You'}</span>
          </div>

          <div style={{ fontSize: 13, color: '#b3b3b3', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Globe size={13} color="#b3b3b3" />
            <span>
              {playlist.followers > 0 ? `${playlist.followers.toLocaleString()} saves` : '0 saves'}
              <span style={{ margin: '0 6px' }}>•</span>
              {fmtTime(totalDuration)}
            </span>
          </div>
        </div>

        {/* 5. ACTION ROW */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.05)'
        }}>
          {/* Left Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            {/* Thumbnail */}
            <div style={{ width: 32, height: 32, borderRadius: 4, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
              {displayCoverImage ? (
                <img src={displayCoverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #b08850, #10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>🎵</div>
              )}
            </div>

            {/* Check/Saved Icon */}
            <button
              onClick={() => {
                toggleSavePlaylist(playlist.id);
                toast(isSaved ? 'Removed from library' : 'Added to your library', {
                  icon: isSaved ? '🗑️' : '✨',
                  style: { background: '#1a1a1a', color: '#fff' }
                });
              }}
              style={{
                background: isSaved ? G : 'transparent',
                border: isSaved ? `1px solid ${G}` : '1.5px solid #a3a3a3',
                borderRadius: '50%',
                width: 28,
                height: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isSaved ? '#000' : '#a3a3a3',
                cursor: 'pointer',
                padding: 0
              }}
            >
              {isSaved ? <Check size={14} color="#000" strokeWidth={3} /> : <Plus size={14} color="#a3a3a3" />}
            </button>

            {/* Download Icon */}
            <button
              onClick={() => toast('Download requires Premium 👑', { icon: '⬇️', style: { background: '#1a1a1a', color: '#fff' } })}
              style={{
                background: 'transparent',
                border: '1.5px solid #a3a3a3',
                borderRadius: '50%',
                width: 28,
                height: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#a3a3a3',
                cursor: 'pointer',
                padding: 0
              }}
            >
              <Download size={14} color="#a3a3a3" />
            </button>

            {/* More options (three-dots) */}
            <button
              onClick={() => toast('Playlist Options', { style: { background: '#1a1a1a', color: '#fff' } })}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#a3a3a3',
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <MoreVertical size={22} color="#a3a3a3" />
            </button>
          </div>

          {/* Right Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Shuffle */}
            <button
              onClick={handleShuffle}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              <Shuffle size={22} color={shuffle ? G : '#a3a3a3'} />
            </button>

            {/* Play Button */}
            <button
              onClick={handlePlay}
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: G,
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 4px 12px ${G}40`,
                cursor: 'pointer',
                padding: 0
              }}
            >
              {isCurrentPlaylist && isPlaying ? (
                <Pause size={22} fill="black" color="black" />
              ) : (
                <Play size={22} fill="black" color="black" style={{ marginLeft: 2 }} />
              )}
            </button>
          </div>
        </div>

        {/* 5.5 CAPSULE ACTIONS ROW */}
        <div style={{
          display: 'flex',
          gap: 8,
          padding: '0 16px 16px',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
        }}>
          {/* Add to your playlist capsule button if not owner */}
          {!isOwner && (
            <button
              onClick={() => {
                toggleSavePlaylist(playlist.id);
                toast(isSaved ? 'Removed from your playlists' : 'Added to your playlists', {
                  icon: isSaved ? '🗑️' : '✨',
                  style: { background: '#1a1a1a', color: '#fff' }
                });
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: isSaved ? G : 'rgba(255,255,255,0.08)',
                border: 'none',
                borderRadius: 16,
                padding: '6px 16px',
                color: isSaved ? '#000' : '#fff',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {isSaved ? <Check size={14} /> : <Plus size={14} />}
              {isSaved ? 'In your playlists' : 'Add to your playlist'}
            </button>
          )}

          {/* Add button */}
          {isOwner && (
            <button
              onClick={() => {
                const inputEl = document.querySelector('.playlist-mobile-container input') as HTMLInputElement;
                if (inputEl) inputEl.focus();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(255,255,255,0.08)',
                border: 'none',
                borderRadius: 16,
                padding: '6px 16px',
                color: '#fff',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              <Plus size={14} /> Add
            </button>
          )}

          {/* Edit button */}
          {isOwner && (
            <button
              onClick={() => {
                setEditTitle(playlist.title);
                setEditCover(playlist.coverImage || '');
                setEditGrad((playlist as any).gradientCss || '');
                setShowEditModal(true);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(255,255,255,0.08)',
                border: 'none',
                borderRadius: 16,
                padding: '6px 16px',
                color: '#fff',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              <ListMusic size={14} /> Edit
            </button>
          )}

          {/* Sort button */}
          <button
            onClick={() => setShowSortMenu(!showSortMenu)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(255,255,255,0.08)',
              border: 'none',
              borderRadius: 16,
              padding: '6px 16px',
              color: '#fff',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            <BarChart2 size={12} style={{ transform: 'rotate(90deg)' }} /> Sort
          </button>

          {/* Name & details button */}
          {isOwner && (
            <button
              onClick={() => {
                setEditTitle(playlist.title);
                setEditCover(playlist.coverImage || '');
                setEditGrad((playlist as any).gradientCss || '');
                setShowEditModal(true);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(255,255,255,0.08)',
                border: 'none',
                borderRadius: 16,
                padding: '6px 16px',
                color: '#fff',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              <Pencil size={12} /> Name & details
            </button>
          )}
        </div>

        {/* 6. TRACK LIST */}
        <div style={{ padding: '8px 0' }}>
          {isCustomPlaylist && isOwner && (
            <div style={{ display: 'flex', justifyContent: 'center', margin: rawTracks.length === 0 ? '24px 0 32px' : '12px 0 24px' }}>
              <button 
                onClick={() => {
                  const inputEl = document.querySelector('.playlist-mobile-container input') as HTMLInputElement;
                  if (inputEl) inputEl.focus();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.4)',
                  borderRadius: 24,
                  padding: '8px 24px',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <Plus size={16} /> Add to this playlist
              </button>
            </div>
          )}

          {rawTracks.length > 0 && filteredTracks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 16px', color: '#737373' }}>
              <Search size={28} style={{ margin: '0 auto 10px' }} />
              <p style={{ fontSize: 15, fontWeight: 600 }}>No tracks match "{searchQuery}"</p>
            </div>
          ) : (
            filteredTracks.map((track, i) => {
              const isCurrent = currentTrack?.id === track.id;
              const isTrackPlaying = isCurrent && isPlaying;
              return (
                <div
                  key={track.id}
                  onClick={() => playTrack(track, filteredTracks)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '10px 16px',
                    gap: 14,
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                    WebkitTapHighlightColor: 'transparent'
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  {/* Track Cover Art */}
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: 6,
                    overflow: 'hidden',
                    background: trackGradient(track.id),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {track.coverImage ? (
                      <img src={track.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <Music2 size={24} color="rgba(255,255,255,0.5)" />
                    )}
                  </div>

                  {/* Track Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      color: isCurrent ? G : '#fff',
                      fontWeight: 600,
                      fontSize: 15,
                      margin: '0 0 3px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {track.title}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                      {track.explicit && (
                        <span style={{
                          fontSize: 9,
                          fontWeight: 700,
                          background: '#a3a3a3',
                          color: '#121212',
                          borderRadius: 2,
                          padding: '1px 3px',
                          lineHeight: 1,
                          display: 'inline-block',
                          flexShrink: 0
                        }}>E</span>
                      )}
                      <span style={{
                        color: '#b3b3b3',
                        fontSize: 13,
                        fontWeight: 400,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>{track.artistName}</span>
                    </div>
                  </div>

                  {/* Add to Playlist & Download Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                    {/* Add to playlist / Liked Songs */}
                    <button
                      onClick={(e) => handleAddToLikedSongs(e, track)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 4,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: user?.likedSongs.includes(track.id) ? '#b08850' : 'rgba(255,255,255,0.6)',
                      }}
                    >
                      {user?.likedSongs.includes(track.id) ? (
                        <div style={{
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          background: '#b08850',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          <Check size={12} color="#000" strokeWidth={4} />
                        </div>
                      ) : (
                        <PlusCircle size={20} />
                      )}
                    </button>

                    {/* Download */}
                    <button
                      onClick={(e) => handleDownloadClick(e, track)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 4,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {downloadingIds.includes(track.id) ? (
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ display: 'flex' }}>
                          <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#b08850' }} />
                        </motion.div>
                      ) : downloadedTrackIds.includes(track.id) ? (
                        <Download size={20} color="#b08850" />
                      ) : (
                        <Download size={20} color="rgba(255,255,255,0.6)" />
                      )}
                    </button>
                  </div>

                  {/* Options Menu Icon */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toast(`Options for ${track.title}`, { style: { background: '#1a1a1a', color: '#fff' } });
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#b3b3b3',
                      cursor: 'pointer',
                      padding: 4
                    }}
                  >
                    <MoreVertical size={20} color="#b3b3b3" />
                  </button>
                </div>
              );
            })
          )}

          {/* 6.5 RECOMMENDED SONGS (Always visible at the bottom of the mobile page) */}
          {isOwner && (
            <>
              <div style={{ marginTop: 32, padding: '0 16px' }}>
            <h3 style={{
              color: '#fff',
              fontSize: 18,
              fontWeight: '800',
              marginBottom: 4,
              fontFamily: 'var(--font-inter), sans-serif'
            }}>Recommended Songs</h3>
            
            <p style={{
              color: '#b3b3b3',
              fontSize: 12,
              fontWeight: 500,
              marginBottom: 16,
              fontFamily: 'var(--font-inter), sans-serif'
            }}>
              {rawTracks.length > 0 ? 'Based on the songs in this playlist' : 'Recommended by AI'}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {suggestedTracks.map(track => {
                const isAdded = playlist.tracks.includes(track.id);
                return (
                  <div 
                    key={track.id}
                    onClick={() => playTrack(track, suggestedTracks)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      padding: '4px 0',
                      cursor: 'pointer'
                    }}
                  >
                    {/* Track Cover */}
                    <div style={{
                      width: 48,
                      height: 48,
                      borderRadius: 6,
                      overflow: 'hidden',
                      background: trackGradient(track.id),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {track.coverImage ? (
                        <img src={track.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <Music2 size={24} color="rgba(255,255,255,0.5)" />
                      )}
                    </div>

                    {/* Track Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        color: '#fff',
                        fontWeight: 600,
                        fontSize: 14,
                        margin: '0 0 3px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>{track.title}</p>
                      <p style={{
                        color: '#b3b3b3',
                        fontSize: 12,
                        fontWeight: 500,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        margin: 0
                      }}>{track.artistName}</p>
                    </div>

                    {/* Add / Check Icon */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isAdded) return;
                        addTrackToPlaylist(playlist.id, track.id);
                        toast.success("Song added to playlist", {
                          style: { background: '#1a1a1a', color: '#fff' }
                        });
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: isAdded ? '#b08850' : '#b3b3b3',
                        cursor: 'pointer',
                        padding: 8,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%'
                      }}
                    >
                      {isAdded ? (
                        <Check size={20} strokeWidth={3} />
                      ) : (
                        <Plus size={20} style={{ border: '1.5px solid currentColor', borderRadius: '50%', padding: 2 }} />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 6.6 TRENDING SONGS (Issue 2 Carousel) */}
          <div style={{ marginTop: 32, padding: '0 16px' }}>
            <h3 style={{
              color: '#fff',
              fontSize: 18,
              fontWeight: '800',
              marginBottom: 4,
              fontFamily: 'var(--font-inter), sans-serif'
            }}>Trending Songs</h3>
            
            <p style={{
              color: '#b3b3b3',
              fontSize: 12,
              fontWeight: 500,
              marginBottom: 16,
              fontFamily: 'var(--font-inter), sans-serif'
            }}>
              Most played songs right now
            </p>

            <div style={{
              display: 'flex',
              gap: 16,
              overflowX: 'auto',
              paddingBottom: 12,
              scrollbarWidth: 'none',
              WebkitOverflowScrolling: 'touch'
            }} className="no-scrollbar">
              {trendingTracks.map(track => {
                const isAdded = playlist.tracks.includes(track.id);
                return (
                  <div
                    key={track.id}
                    onClick={() => playTrack(track, trendingTracks)}
                    style={{
                      width: 120,
                      flexShrink: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                      cursor: 'pointer',
                      position: 'relative'
                    }}
                  >
                    {/* Cover Image */}
                    <div style={{ width: 120, height: 120, borderRadius: 8, overflow: 'hidden', position: 'relative', background: trackGradient(track.id) }}>
                      {track.coverImage ? (
                        <img src={track.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🎵</div>
                      )}
                      
                      {/* Trending Badge */}
                      <div style={{
                        position: 'absolute',
                        top: 6,
                        left: 6,
                        background: 'rgba(0,0,0,0.7)',
                        padding: '2px 6px',
                        borderRadius: 4,
                        fontSize: 9,
                        fontWeight: 800,
                        color: '#b08850',
                        border: '1px solid rgba(176, 136, 80,0.3)'
                      }}>
                        🔥 {numFmt(track.plays || 0)}
                      </div>

                      {/* Add Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isAdded) return;
                          addTrackToPlaylist(playlist.id, track.id);
                          toast.success("Song added to playlist", {
                            style: { background: '#1a1a1a', color: '#fff' }
                          });
                        }}
                        style={{
                          position: 'absolute',
                          bottom: 8,
                          right: 8,
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          background: isAdded ? '#b08850' : 'rgba(0,0,0,0.8)',
                          border: isAdded ? 'none' : '1px solid rgba(255,255,255,0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: isAdded ? '#000' : '#fff',
                          cursor: 'pointer',
                          boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                          zIndex: 10
                        }}
                      >
                        {isAdded ? <Check size={14} strokeWidth={3} /> : <Plus size={14} />}
                      </button>
                    </div>

                    {/* Metadata */}
                    <div style={{ minWidth: 0 }}>
                      <p style={{ color: '#fff', fontWeight: 600, fontSize: 13, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.title}</p>
                      <p style={{ color: '#b3b3b3', fontSize: 11, margin: '2px 0 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.artistName}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 6.7 VIEW ALL SONGS BUTTON (Issue 3) */}
          <div style={{ padding: '24px 16px 16px' }}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowAllSongsDrawer(true)}
              style={{
                width: '100%',
                background: '#ffffff',
                color: '#000000',
                border: 'none',
                borderRadius: 24,
                padding: '14px 24px',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(255,255,255,0.1)',
                fontFamily: 'var(--font-inter), sans-serif'
              }}
            >
              View All Songs
            </motion.button>
          </div>
        </>
      )}
    </div>


      </div>

      {/* ─── Edit Playlist Details Modal (Spotify-style) ─────────────── */}
      <AnimatePresence>
        {showEditModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}
            onClick={e => { if (e.target === e.currentTarget) setShowEditModal(false); }}
          >
            <motion.div initial={{ opacity: 0, scale: 0.92, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92, y: 24 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              style={{ width: '100%', maxWidth: 400, background: '#1e1e1e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.6)', padding: 20 }}
            >
              <h3 style={{ color: '#fff', fontSize: 18, fontWeight: 800, marginBottom: 16, textAlign: 'center', fontFamily: 'var(--font-inter), sans-serif' }}>Edit Playlist Details</h3>
              
              <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', color: '#a3a3a3', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 6, fontFamily: 'var(--font-inter), sans-serif' }}>Playlist Name</label>
                  <input type="text" required value={editTitle} onChange={e => setEditTitle(e.target.value)}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', color: '#a3a3a3', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 6, fontFamily: 'var(--font-inter), sans-serif' }}>Cover Image URL (optional)</label>
                  <input type="text" value={editCover} onChange={e => setEditCover(e.target.value)} placeholder="https://example.com/cover.jpg"
                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', color: '#a3a3a3', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 10, fontFamily: 'var(--font-inter), sans-serif' }}>Or Choose a Gradient</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 6 }}>
                    {EDIT_GRADIENTS.map(g => (
                      <div key={g.id} onClick={() => { setEditGrad(g.css); setEditCover(''); }}
                        style={{ aspectRatio: '1', borderRadius: 8, background: g.css, cursor: 'pointer', border: editGrad === g.css && !editCover ? `2px solid ${G}` : '2px solid transparent', transform: editGrad === g.css && !editCover ? 'scale(1.1)' : 'scale(1)', transition: 'all 0.15s' }}
                      />
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 12 }}>
                  <button type="button" onClick={() => setShowEditModal(false)}
                    style={{ padding: '8px 18px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#a3a3a3', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-inter), sans-serif' }}
                  >
                    Cancel
                  </button>
                  <button type="submit" disabled={!editTitle.trim()}
                    style={{ padding: '8px 22px', borderRadius: 20, border: 'none', background: G, color: '#000', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'var(--font-inter), sans-serif' }}
                  >
                    Save
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── ALL SONGS SEARCH/FILTER DRAWER (Issue 3) ── */}
      <AnimatePresence>
        {showAllSongsDrawer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="all-songs-drawer-overlay"
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.85)',
              backdropFilter: 'blur(15px)',
              zIndex: 1000,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end'
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowAllSongsDrawer(false);
            }}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="all-songs-drawer-content"
              style={{
                height: '85vh',
                background: '#121212',
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                borderTop: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}
            >
              {/* Header */}
              <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 800, margin: 0, fontFamily: 'var(--font-inter), sans-serif' }}>Add to Playlist</h3>
                  <p style={{ color: '#b3b3b3', fontSize: 12, margin: '2px 0 0 0', fontFamily: 'var(--font-inter), sans-serif' }}>Search and filter all available songs</p>
                </div>
                <button
                  onClick={() => setShowAllSongsDrawer(false)}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: 'none',
                    borderRadius: '50%',
                    width: 32,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    cursor: 'pointer'
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Search input in drawer */}
              <div style={{ padding: '16px 20px 8px' }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Search size={16} color="#737373" style={{ position: 'absolute', left: 14 }} />
                  <input
                    value={drawerSearch}
                    onChange={(e) => setDrawerSearch(e.target.value)}
                    placeholder="Search all songs..."
                    style={{
                      width: '100%',
                      background: 'rgba(255,255,255,0.06)',
                      border: 'none',
                      borderRadius: 12,
                      padding: '10px 16px 10px 38px',
                      color: '#fff',
                      fontSize: 14,
                      outline: 'none',
                      boxSizing: 'border-box',
                      fontFamily: 'var(--font-inter), sans-serif'
                    }}
                  />
                  {drawerSearch && (
                    <button
                      onClick={() => setDrawerSearch('')}
                      style={{ position: 'absolute', right: 12, background: 'none', border: 'none', color: '#737373', cursor: 'pointer' }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Filter Chips container (horizontal scroll) */}
              <div style={{
                padding: '0 20px 12px',
                display: 'flex',
                gap: 8,
                overflowX: 'auto',
                scrollbarWidth: 'none',
                WebkitOverflowScrolling: 'touch',
                flexShrink: 0
              }} className="no-scrollbar">
                {/* Categories */}
                {['Recommended', 'Trending', 'Popular', 'Recently Added'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => {
                      setDrawerCategory(cat === drawerCategory ? '' : cat);
                      setDrawerGenre('');
                    }}
                    style={{
                      background: drawerCategory === cat ? '#b08850' : 'rgba(255,255,255,0.06)',
                      color: drawerCategory === cat ? '#000' : '#fff',
                      border: 'none',
                      borderRadius: 16,
                      padding: '6px 14px',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s',
                      fontFamily: 'var(--font-inter), sans-serif'
                    }}
                  >
                    {cat}
                  </button>
                ))}
                
                <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.1)', alignSelf: 'center', flexShrink: 0 }} />

                {/* Genres */}
                {['Pop', 'Hip-Hop', 'Electronic', 'R&B', 'Indie', 'Rock', 'Ambient'].map(gen => (
                  <button
                    key={gen}
                    onClick={() => {
                      setDrawerGenre(gen === drawerGenre ? '' : gen);
                      setDrawerCategory('');
                    }}
                    style={{
                      background: drawerGenre === gen ? '#b08850' : 'rgba(255,255,255,0.06)',
                      color: drawerGenre === gen ? '#000' : '#fff',
                      border: 'none',
                      borderRadius: 16,
                      padding: '6px 14px',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s',
                      fontFamily: 'var(--font-inter), sans-serif'
                    }}
                  >
                    {gen}
                  </button>
                ))}
              </div>

              {/* Scrollable track list */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 32px' }}>
                {filteredDrawerTracks.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '64px 20px', color: '#737373' }}>
                    <Search size={32} style={{ margin: '0 auto 12px' }} />
                    <p style={{ fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-inter), sans-serif' }}>No matching songs found</p>
                  </div>
                ) : (
                  filteredDrawerTracks.map(track => {
                    const isAdded = playlist.tracks.includes(track.id);
                    return (
                      <div
                        key={track.id}
                        onClick={() => playTrack(track, filteredDrawerTracks)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '10px 12px',
                          gap: 12,
                          cursor: 'pointer',
                          borderRadius: 8,
                          transition: 'background 0.15s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <div style={{ width: 44, height: 44, borderRadius: 6, overflow: 'hidden', background: trackGradient(track.id), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {track.coverImage ? (
                            <img src={track.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <Music2 size={20} color="rgba(255,255,255,0.5)" />
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ color: '#fff', fontSize: 14, fontWeight: 600, margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-inter), sans-serif' }}>{track.title}</p>
                          <p style={{ color: '#b3b3b3', fontSize: 12, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-inter), sans-serif' }}>{track.artistName} • {track.genre}</p>
                        </div>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isAdded) return;
                            addTrackToPlaylist(playlist.id, track.id);
                            toast.success("Song added to playlist", {
                              style: { background: '#1a1a1a', color: '#fff' }
                            });
                          }}
                          style={{
                            background: isAdded ? 'transparent' : 'rgba(255,255,255,0.05)',
                            border: isAdded ? 'none' : '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '50%',
                            width: 32,
                            height: 32,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: isAdded ? '#b08850' : '#fff',
                            cursor: 'pointer'
                          }}
                        >
                          {isAdded ? <Check size={16} strokeWidth={3} /> : <Plus size={16} />}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Playlist Picker Bottom Sheet ── */}
      <AnimatePresence>
        {showPlaylistPicker && pickerTrack && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setShowPlaylistPicker(false); setPickerSearchQuery(''); }}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
              zIndex: 20005, display: 'flex', alignItems: 'flex-end',
            }}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 250 }}
              onClick={e => e.stopPropagation()}
              style={{
                width: '100%', background: '#121212',
                borderRadius: '24px 24px 0 0', padding: '8px 0 32px',
                display: 'flex', flexDirection: 'column', gap: 0,
                boxShadow: '0 -10px 40px rgba(0,0,0,0.8)',
                maxHeight: '80vh', overflow: 'hidden',
              }}
            >
              {/* Drag Handle Indicator */}
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.2)', margin: '8px auto 16px', flexShrink: 0 }} />

              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px 16px', flexShrink: 0 }}>
                <span style={{ fontSize: 18, fontWeight: 800, color: '#fff', fontFamily: 'Outfit, sans-serif' }}>Saved in</span>
                <button
                  onClick={() => {
                    const title = prompt("Enter playlist title:");
                    if (!title) return;
                    const newId = `playlist-custom-${Date.now()}`;
                    const newPlaylist = {
                      id: newId,
                      title,
                      description: 'A custom playlist created by you.',
                      coverImage: '',
                      ownerId: user?.id || 'guest',
                      ownerName: user?.name || 'You',
                      tracks: [pickerTrack.id],
                      totalTracks: 1,
                      duration: 0,
                      isPublic: true,
                      isCollaborative: false,
                      followers: 0,
                      createdAt: new Date().toISOString().split('T')[0],
                      updatedAt: new Date().toISOString().split('T')[0],
                    };
                    addPlaylist(newPlaylist);
                    toast.success(`Created playlist "${title}" and added song`, { id: 'playlist-create' });
                  }}
                  style={{ background: 'none', border: 'none', color: '#b08850', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
                >
                  New playlist
                </button>
              </div>

              {/* Liked Songs Row (Current saved state indicator) */}
              <div style={{ padding: '0 24px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
                <button
                  onClick={() => {
                    toggleLikeSong(pickerTrack.id);
                    const isLiked = user?.likedSongs.includes(pickerTrack.id) ?? false;
                    toast.success(isLiked ? 'Removed from Liked Songs' : 'Added to Liked Songs', { id: 'liked-toggle-toast' });
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14, width: '100%',
                    background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                    padding: '12px 16px', borderRadius: 8, transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <div style={{
                    width: 44, height: 44, borderRadius: 6, flexShrink: 0,
                    background: 'linear-gradient(135deg, #4338ca, #60a5fa)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Heart size={20} fill="#fff" color="#fff" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: '#fff', fontSize: 14, fontWeight: 600, margin: 0 }}>Liked Songs</p>
                  </div>
                  {user?.likedSongs.includes(pickerTrack.id) ? (
                    <div style={{
                      width: 22, height: 22, borderRadius: '50%', background: '#b08850',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  ) : (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="16" />
                      <line x1="8" y1="12" x2="16" y2="12" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Search Bar */}
              <div style={{ display: 'flex', gap: 10, padding: '16px 24px', flexShrink: 0 }}>
                <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <svg style={{ position: 'absolute', left: 12, color: 'rgba(255,255,255,0.4)' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  <input
                    type="text"
                    placeholder="Find playlist"
                    value={pickerSearchQuery}
                    onChange={(e) => setPickerSearchQuery(e.target.value)}
                    style={{
                      width: '100%', background: '#282828', border: 'none',
                      borderRadius: '8px', padding: '10px 12px 10px 38px',
                      color: '#fff', fontSize: '14px', outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Scrollable Playlists list */}
              <div style={{ overflowY: 'auto', flex: 1, padding: '0 12px' }}>
                {customPlaylists.filter(pl => pl.title.toLowerCase().includes(pickerSearchQuery.toLowerCase())).length === 0 ? (
                  <div style={{ padding: '32px 24px', textAlign: 'center', color: '#737373', fontSize: 14 }}>
                    No playlists found.
                  </div>
                ) : (
                  customPlaylists
                    .filter(pl => pl.title.toLowerCase().includes(pickerSearchQuery.toLowerCase()))
                    .map(pl => {
                      const alreadyAdded = pl.tracks.includes(pickerTrack.id);
                      return (
                        <button
                          key={pl.id}
                          onClick={() => {
                            if (alreadyAdded) {
                              removeTrackFromPlaylist(pl.id, pickerTrack.id);
                              toast.success(`Removed from "${pl.title}"`, { id: 'playlist-toggle' });
                            } else {
                              addTrackToPlaylist(pl.id, pickerTrack.id);
                              toast.success(`Added to "${pl.title}"`, { id: 'playlist-toggle' });
                            }
                          }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 14,
                            width: '100%', padding: '10px 12px', borderRadius: 8,
                            background: 'none', border: 'none', cursor: 'pointer',
                            textAlign: 'left', transition: 'background 0.15s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'none'}
                        >
                          <div style={{
                            width: 44, height: 44, borderRadius: 6, flexShrink: 0,
                            background: pl.gradientCss || 'linear-gradient(135deg,#1e3a5f,#0ea5e9)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                          }}>
                            {pl.coverImage ? (
                              <img src={pl.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
                            )}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ color: alreadyAdded ? '#b08850' : '#fff', fontSize: 14, fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pl.title}</p>
                            <p style={{ color: '#737373', fontSize: 12, margin: '2px 0 0', }}>{pl.tracks.length === 0 ? 'Empty' : `${pl.tracks.length} song${pl.tracks.length === 1 ? '' : 's'}`}</p>
                          </div>
                          {alreadyAdded ? (
                            <div style={{
                              width: 22, height: 22, borderRadius: '50%', background: '#b08850',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            </div>
                          ) : (
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2">
                              <circle cx="12" cy="12" r="10" />
                              <line x1="12" y1="8" x2="12" y2="16" />
                              <line x1="8" y1="12" x2="16" y2="12" />
                            </svg>
                          )}
                        </button>
                      );
                    })
                )}

                {/* New playlist item at the bottom of the list */}
                <button
                  onClick={() => {
                    const title = prompt("Enter playlist title:");
                    if (!title) return;
                    const newId = `playlist-custom-${Date.now()}`;
                    const newPlaylist = {
                      id: newId,
                      title,
                      description: 'A custom playlist created by you.',
                      coverImage: '',
                      ownerId: user?.id || 'guest',
                      ownerName: user?.name || 'You',
                      tracks: [pickerTrack.id],
                      totalTracks: 1,
                      duration: 0,
                      isPublic: true,
                      isCollaborative: false,
                      followers: 0,
                      createdAt: new Date().toISOString().split('T')[0],
                      updatedAt: new Date().toISOString().split('T')[0],
                    };
                    addPlaylist(newPlaylist);
                    toast.success(`Created playlist "${title}" and added song`, { id: 'playlist-create' });
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    width: '100%', padding: '10px 12px', borderRadius: 8,
                    background: 'none', border: 'none', cursor: 'pointer',
                    textAlign: 'left', transition: 'background 0.15s',
                    marginTop: 4,
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <div style={{
                    width: 44, height: 44, borderRadius: 6, flexShrink: 0,
                    background: '#282828', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2.5">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: '#fff', fontSize: 14, fontWeight: 600, margin: 0 }}>New playlist</p>
                  </div>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}