'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import {
  Search, Plus, Grid, List, Filter, X, Heart, Play, Pause, Music2, Sparkles,
  Clock, TrendingUp, ChevronDown, Check, Shuffle, MoreHorizontal, Star, Lock,
  Download, Trash2, User, Disc, FolderPlus, Share2, Pin, PinOff, Edit3,
  BarChart2, Headphones, Radio, Zap, Globe, Eye, EyeOff, Copy, ExternalLink,
  ArrowUpDown, SlidersHorizontal, Layers, BookOpen, Flame, Award, Activity,
  Import, Upload, Tag, Bookmark, ChevronRight, ChevronLeft, RefreshCw, Bell, Settings,
  PlayCircle, Users
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import TopBar from '@/components/layout/TopBar';
import TrackCard from '@/components/music/TrackCard';
import { mockPlaylists, mockAlbums, mockArtists, mockTracks, formatDuration } from '@/lib/mockData';
import { useMusicStore, trackGradient, GENRE_COLORS } from '@/store/musicStore';
import { useAuthStore } from '@/store/authStore';
import { usePlayerStore } from '@/store/playerStore';
import { usePlaylistStore } from '@/store/playlistStore';

const G = '#b08850';

// ─── Gradient Presets ──────────────────────────────────────────────────────────
const GRADIENTS = [
  { id: 'ocean',   label: 'Ocean',    css: 'linear-gradient(135deg,#1e3a5f,#0ea5e9)' },
  { id: 'sunset',  label: 'Sunset',   css: 'linear-gradient(135deg,#7c1d0a,#f97316)' },
  { id: 'aurora',  label: 'Aurora',   css: 'linear-gradient(135deg,#064e3b,#34d399)' },
  { id: 'forest',  label: 'Forest',   css: 'linear-gradient(135deg,#064e3b,#10b981)' },
  { id: 'galaxy',  label: 'Galaxy',   css: 'linear-gradient(135deg,#1e1b4b,#6366f1)' },
  { id: 'gold',    label: 'Gold',     css: 'linear-gradient(135deg,#78350f,#fbbf24)' },
  { id: 'rose',    label: 'Rose',     css: 'linear-gradient(135deg,#881337,#fb7185)' },
  { id: 'steel',   label: 'Steel',    css: 'linear-gradient(135deg,#1f2937,#6b7280)' },
];

// ─── Smart Collections ─────────────────────────────────────────────────────────
const SMART_COLLECTIONS = [
  { id: 'recently', label: 'Recently Added', icon: Clock,    color: '#0ea5e9', desc: 'Your latest saves' },
  { id: 'topplay',  label: 'Top Played',     icon: TrendingUp, color: '#f59e0b', desc: 'Your most-played' },
  { id: 'discover', label: 'AI Discover',    icon: Sparkles, color: '#34d399', desc: 'Recommended for you' },
  { id: 'moods',    label: 'Mood Mixes',     icon: Radio,    color: '#10b981', desc: 'Curated by mood' },
];

// ─── Sort Options ─────────────────────────────────────────────────────────────
const SORT_OPTS = [
  { v: 'recents', l: 'Recently Added' },
  { v: 'az',      l: 'A → Z' },
  { v: 'za',      l: 'Z → A' },
  { v: 'plays',   l: 'Most Played' },
  { v: 'length',  l: 'Duration' },
];

// ─── Tabs ─────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'Playlists',  label: 'Playlists',   icon: Music2     },
  { id: 'Rooms',      label: 'Jam Rooms',   icon: Users      },
  { id: 'Liked',      label: 'Liked Songs', icon: Heart      },
  { id: 'Artists',    label: 'Artists',     icon: User       },
  { id: 'Albums',     label: 'Albums',      icon: Disc       },
  { id: 'Downloads',  label: 'Downloads',   icon: Download   },
];

// ─── Interfaces ───────────────────────────────────────────────────────────────
interface CustomPlaylist {
  id: string; title: string; description: string; coverImage: string;
  ownerId: string; ownerName: string; tracks: string[]; totalTracks: number;
  duration: number; isPublic: boolean; isCollaborative: boolean; followers: number;
  createdAt: string; updatedAt: string; gradient?: string; gradientCss?: string;
  tags: string[]; pinned?: boolean;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ icon: Icon, value, label, sub, color, trend }: {
  icon: any; value: string; label: string; sub?: string; color: string; trend?: string;
}) {
  return (
    <motion.div whileHover={{ y: -3, scale: 1.01 }} style={{
      padding: '18px 20px', borderRadius: 16,
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.07)',
      backdropFilter: 'blur(12px)',
      display: 'flex', flexDirection: 'column', gap: 10,
      cursor: 'default', transition: 'box-shadow 0.2s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}18`, border: `1px solid ${color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={16} color={color} />
        </div>
        {trend && (
          <span style={{ fontSize: 10, fontWeight: 700, color: trend.startsWith('+') ? G : '#f87171', background: trend.startsWith('+') ? `${G}15` : '#f8717115', padding: '2px 7px', borderRadius: 20 }}>
            {trend}
          </span>
        )}
      </div>
      <div>
        <p style={{ fontFamily: 'Outfit, sans-serif', color: '#fff', fontSize: 22, fontWeight: 900, lineHeight: 1.1 }}>{value}</p>
        <p style={{ color: '#737373', fontSize: 12, marginTop: 3, fontWeight: 500 }}>{label}</p>
        {sub && <p style={{ color: '#525252', fontSize: 11, marginTop: 1 }}>{sub}</p>}
      </div>
    </motion.div>
  );
}

function SmartCollectionCard({ item, onClick }: { item: typeof SMART_COLLECTIONS[0]; onClick: () => void }) {
  const [hov, setHov] = useState(false);
  const Icon = item.icon;
  return (
    <motion.div
      whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }}
      onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        padding: '16px 18px', borderRadius: 14, cursor: 'pointer',
        background: hov ? `${item.color}12` : 'rgba(255,255,255,0.03)',
        border: `1px solid ${hov ? item.color + '35' : 'rgba(255,255,255,0.07)'}`,
        transition: 'all 0.2s', display: 'flex', flexDirection: 'column', gap: 12,
      }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: `${item.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={18} color={item.color} />
      </div>
      <div>
        <p style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>{item.label}</p>
        <p style={{ color: '#737373', fontSize: 11, marginTop: 2 }}>{item.desc}</p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: hov ? item.color : '#525252', fontSize: 11, fontWeight: 600, transition: 'color 0.2s' }}>
        Open <ChevronRight size={12} />
      </div>
    </motion.div>
  );
}

function LibraryPlaylistCard({ playlist, pinned, onPin, onDelete, isCustom }: {
  playlist: any; pinned?: boolean; onPin?: () => void; onDelete?: (e: React.MouseEvent) => void; isCustom?: boolean;
}) {
  const [hov, setHov] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayerStore();
  const { user } = useAuthStore();
  const tracks = mockTracks.filter(t => (playlist.tracks || []).includes(t.id));
  const isActive = tracks.some(t => t.id === currentTrack?.id);
  const isLiked = playlist.id === 'playlist-1';
  const gradCss = playlist.gradientCss || (isLiked ? 'linear-gradient(135deg,#064e3b,#10b981)' : 'linear-gradient(135deg,#1e3a5f,#0ea5e9)');

  // Resolve cover image from first track if playlist.coverImage is empty
  const firstTrackId = playlist.tracks?.[0];
  const firstTrack = mockTracks.find(t => t.id === firstTrackId);
  const resolvedCover = playlist.coverImage || firstTrack?.coverImage || '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6 }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => { setHov(false); setMenuOpen(false); }}
      style={{ borderRadius: 16, background: hov ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)', border: `1px solid ${isActive ? G + '40' : hov ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)'}`, overflow: 'hidden', cursor: 'pointer', transition: 'all 0.25s', position: 'relative', boxShadow: hov ? '0 12px 40px rgba(0,0,0,0.4)' : 'none' }}
    >
      {/* Pinned indicator */}
      {pinned && (
        <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 10, background: `${G}25`, border: `1px solid ${G}40`, borderRadius: 6, padding: '2px 7px', fontSize: 9, fontWeight: 800, color: G, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Pinned
        </div>
      )}

      {/* Cover */}
      <Link href={`/playlist/${playlist.id}`} style={{ textDecoration: 'none' }}>
        <div style={{ position: 'relative', aspectRatio: '1', background: gradCss, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {resolvedCover && !isLiked ? (
            <img src={resolvedCover} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : isLiked ? (
            <Heart size={42} color="rgba(255,255,255,0.85)" fill="rgba(255,255,255,0.85)" />
          ) : (
            <Music2 size={42} color="rgba(255,255,255,0.4)" />
          )}
          {/* Overlay on hover */}
          <motion.div
            animate={{ opacity: hov ? 1 : 0 }}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.42)', display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', padding: 10 }}
          >
            <motion.button
              onClick={e => { e.preventDefault(); e.stopPropagation(); isActive ? togglePlay() : tracks.length > 0 && playTrack(tracks[0], tracks); }}
              whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.92 }}
              animate={{ scale: hov ? 1 : 0.7, opacity: hov ? 1 : 0 }}
              style={{ width: 44, height: 44, borderRadius: '50%', background: G, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(176, 136, 80,0.5)' }}
            >
              {isActive && isPlaying ? <Pause size={18} fill="black" color="black" /> : <Play size={18} fill="black" color="black" />}
            </motion.button>
          </motion.div>

          {/* Beato badge */}
          {playlist.ownerId === 'beato' && (
            <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', borderRadius: 20, padding: '3px 8px' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: G }} />
              <span style={{ fontSize: 9, color: '#fff', fontWeight: 700 }}>Beato</span>
            </div>
          )}
        </div>
      </Link>

      {/* Info */}
      <div style={{ padding: '12px 14px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: isActive ? G : '#fff', fontWeight: 700, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3 }}>{playlist.title}</p>
            <p style={{ color: '#737373', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{(playlist.tracks || []).length} songs • {playlist.ownerName || 'You'}</p>
          </div>
          {/* More menu */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <button
              onClick={e => { e.preventDefault(); e.stopPropagation(); setMenuOpen(!menuOpen); }}
              style={{ width: 26, height: 26, borderRadius: '50%', background: menuOpen ? 'rgba(255,255,255,0.12)' : 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: hov || menuOpen ? '#fff' : 'transparent', transition: 'all 0.15s', opacity: hov || menuOpen ? 1 : 0 }}
            >
              <MoreHorizontal size={14} />
            </button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: -4 }}
                  style={{ position: 'absolute', right: 0, top: 30, zIndex: 100, background: '#1e1e1e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, overflow: 'hidden', minWidth: 180, boxShadow: '0 16px 48px rgba(0,0,0,0.6)' }}
                >
                  {[
                    { label: 'Play Now', icon: Play, action: () => tracks.length > 0 && playTrack(tracks[0], tracks) },
                    { label: 'Add to Queue', icon: Layers, action: () => toast('Added to queue!', { icon: '🎶' }) },
                    { label: pinned ? 'Unpin' : 'Pin to Top', icon: pinned ? PinOff : Pin, action: onPin },
                    { label: 'Share Playlist', icon: Share2, action: () => toast.success('Link copied!', { icon: '🔗' }) },
                    { label: 'Copy Link', icon: Copy, action: () => toast.success('Link copied!') },
                    ...(isCustom ? [{ 
                      label: playlist.ownerId === user?.id ? 'Delete' : 'Remove from library', 
                      icon: Trash2, 
                      action: onDelete ? (e?: any) => onDelete(e ?? new MouseEvent('click')) : undefined, 
                      danger: true 
                    }] : []),
                  ].map((item) => (
                    <button
                      key={item.label}
                      onClick={e => { e.stopPropagation(); setMenuOpen(false); if (item.action) (item as any).action(e); }}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', background: 'none', border: 'none', color: (item as any).danger ? '#f87171' : '#fff', fontSize: 12, fontWeight: 500, cursor: 'pointer', textAlign: 'left', transition: 'background 0.1s' }}
                      onMouseEnter={e => e.currentTarget.style.background = (item as any).danger ? 'rgba(248,113,113,0.1)' : 'rgba(255,255,255,0.06)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <item.icon size={13} /> {item.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function RoomCard({ room }: { room: any }) {
  const router = useRouter();
  const [hov, setHov] = useState(false);
  return (
    <motion.div
      whileHover={{ y: -6 }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={() => router.push(`/room/${room.id}`)}
      style={{
        borderRadius: 16,
        padding: 16,
        background: hov ? 'rgba(176, 136, 80, 0.08)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${hov ? 'rgba(176, 136, 80, 0.3)' : 'rgba(255,255,255,0.06)'}`,
        cursor: 'pointer',
        transition: 'all 0.25s',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        position: 'relative'
      }}
    >
      <div style={{
        width: '100%',
        aspectRatio: '1.6 / 1',
        borderRadius: 10,
        background: 'linear-gradient(135deg, #1f2937, #111827)',
        border: '1px solid rgba(176,136,80,0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Pulsing indicator when active */}
        {room.isPlaying && (
          <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', borderRadius: 20, background: 'rgba(16,185,129,0.18)', border: '1px solid rgba(16,185,129,0.25)' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', animation: 'pulse 1.5s infinite' }} />
            <span style={{ fontSize: 9, color: '#10b981', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Playing</span>
          </div>
        )}
        <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 20, background: 'rgba(255,255,255,0.05)' }}>
          <Users size={10} color="#b08850" />
          <span style={{ fontSize: 9, color: '#fff', fontWeight: 700 }}>{room.participants?.length || 0}</span>
        </div>
        <Headphones size={36} color="#b08850" style={{ opacity: 0.8 }} />
      </div>
      <div>
        <h4 style={{ color: '#fff', fontSize: 14, fontWeight: 700, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{room.name}</h4>
        <p style={{ color: '#737373', fontSize: 11, margin: '4px 0 0 0' }}>Hosted by {room.hostName}</p>
        <p style={{ color: '#525252', fontSize: 11, margin: '8px 0 0 0', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', minHeight: 30 }}>{room.description || 'No description provided.'}</p>
      </div>
      <button style={{ width: '100%', padding: '8px', borderRadius: 8, background: '#b08850', border: 'none', color: '#000', fontWeight: 800, fontSize: 11, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>
        Join Session ➔
      </button>
    </motion.div>
  );
}

function ArtistRow({ artist, index }: { artist: any; index: number }) {
  const [hov, setHov] = useState(false);
  const { playTrack } = usePlayerStore();
  const tracks = mockTracks.filter(t => t.artistId === artist.id);
  return (
    <Link href={`/artist/${artist.id}`} style={{ textDecoration: 'none' }}>
      <div
        onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
        style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 16px', borderRadius: 12, transition: 'background 0.15s', background: hov ? 'rgba(255,255,255,0.05)' : 'transparent', cursor: 'pointer' }}
      >
        <span style={{ color: '#525252', fontSize: 12, fontWeight: 600, width: 24, textAlign: 'center', flexShrink: 0 }}>{index + 1}</span>
        <div style={{ width: 50, height: 50, borderRadius: '50%', overflow: 'hidden', background: `hsl(${(artist.id.charCodeAt(artist.id.length - 1) * 40) % 360},50%,30%)`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}>
          {artist.image ? <img src={artist.image} alt={artist.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={20} color="rgba(255,255,255,0.5)" />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <p style={{ color: '#fff', fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{artist.name}</p>
            {artist.verified && <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Check size={8} color="#fff" strokeWidth={3} /></div>}
          </div>
          <p style={{ color: '#737373', fontSize: 12 }}>Artist · {artist.genres?.slice(0, 2).join(', ')}</p>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <p style={{ color: '#a3a3a3', fontSize: 12, fontWeight: 600 }}>{(artist.monthlyListeners / 1_000_000).toFixed(1)}M</p>
          <p style={{ color: '#525252', fontSize: 11 }}>listeners</p>
        </div>
        <motion.button
          onClick={e => { e.preventDefault(); e.stopPropagation(); tracks.length > 0 && playTrack(tracks[0], tracks); }}
          animate={{ opacity: hov ? 1 : 0, scale: hov ? 1 : 0.8 }}
          style={{ width: 36, height: 36, borderRadius: '50%', background: G, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(176, 136, 80,0.4)', flexShrink: 0 }}
        >
          <Play size={14} fill="black" color="black" />
        </motion.button>
      </div>
    </Link>
  );
}

function AlbumRow({ album, index }: { album: any; index: number }) {
  const [hov, setHov] = useState(false);
  const { playTrack } = usePlayerStore();
  const tracks = mockTracks.filter(t => t.albumId === album.id || album.tracks?.includes(t.id));
  return (
    <Link href={`/album/${album.id}`} style={{ textDecoration: 'none' }}>
      <div
        onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
        style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 16px', borderRadius: 12, transition: 'background 0.15s', background: hov ? 'rgba(255,255,255,0.05)' : 'transparent', cursor: 'pointer' }}
      >
        <span style={{ color: '#525252', fontSize: 12, fontWeight: 600, width: 24, textAlign: 'center', flexShrink: 0 }}>{index + 1}</span>
        <div style={{ width: 50, height: 50, borderRadius: 8, overflow: 'hidden', background: trackGradient(album.id), flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}>
          {album.coverImage && <img src={album.coverImage} alt={album.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: '#fff', fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3 }}>{album.title}</p>
          <p style={{ color: '#737373', fontSize: 12 }}>Album · {album.artistName} · {album.year}</p>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <p style={{ color: '#a3a3a3', fontSize: 12, fontWeight: 600 }}>{tracks.length} tracks</p>
        </div>
        <motion.button
          onClick={e => { e.preventDefault(); e.stopPropagation(); tracks.length > 0 && playTrack(tracks[0], tracks); }}
          animate={{ opacity: hov ? 1 : 0, scale: hov ? 1 : 0.8 }}
          style={{ width: 36, height: 36, borderRadius: '50%', background: G, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(176, 136, 80,0.4)', flexShrink: 0 }}
        >
          <Play size={14} fill="black" color="black" />
        </motion.button>
      </div>
    </Link>
  );
}

function ArtistGridCard({ artist }: { artist: any }) {
  const [hov, setHov] = useState(false);
  return (
    <Link href={`/artist/${artist.id}`} style={{ textDecoration: 'none' }}>
      <motion.div whileHover={{ y: -6 }}
        onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
        style={{ borderRadius: 16, padding: 16, background: hov ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)', border: `1px solid ${hov ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)'}`, cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', overflow: 'hidden', background: `hsl(${(artist.id.charCodeAt(artist.id.length - 1) * 40) % 360},50%,30%)`, margin: '0 auto 12px', position: 'relative', boxShadow: hov ? '0 8px 24px rgba(0,0,0,0.5)' : '0 4px 12px rgba(0,0,0,0.3)' }}>
          {artist.image ? <img src={artist.image} alt={artist.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={32} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />}
        </div>
        <p style={{ color: '#fff', fontWeight: 700, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3 }}>{artist.name}</p>
        <p style={{ color: '#737373', fontSize: 11 }}>Artist</p>
        {artist.verified && <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3, marginTop: 4, background: 'rgba(14,165,233,0.15)', borderRadius: 20, padding: '2px 8px' }}><Check size={8} color="#0ea5e9" strokeWidth={3} /><span style={{ color: '#0ea5e9', fontSize: 9, fontWeight: 700 }}>Verified</span></div>}
      </motion.div>
    </Link>
  );
}

function AlbumGridCard({ album }: { album: any }) {
  const [hov, setHov] = useState(false);
  const { playTrack } = usePlayerStore();
  const tracks = mockTracks.filter(t => t.albumId === album.id || album.tracks?.includes(t.id));
  return (
    <Link href={`/album/${album.id}`} style={{ textDecoration: 'none' }}>
      <motion.div whileHover={{ y: -6 }}
        onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
        style={{ borderRadius: 16, background: hov ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)', border: `1px solid ${hov ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)'}`, overflow: 'hidden', cursor: 'pointer', transition: 'all 0.25s' }}>
        <div style={{ position: 'relative', aspectRatio: '1', background: trackGradient(album.id) }}>
          {album.coverImage && <img src={album.coverImage} alt={album.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
          <motion.button onClick={e => { e.preventDefault(); e.stopPropagation(); tracks.length > 0 && playTrack(tracks[0], tracks); }}
            animate={{ opacity: hov ? 1 : 0, scale: hov ? 1 : 0.7, y: hov ? 0 : 8 }}
            style={{ position: 'absolute', bottom: 10, right: 10, width: 40, height: 40, borderRadius: '50%', background: G, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(176, 136, 80,0.5)' }}>
            <Play size={16} fill="black" color="black" />
          </motion.button>
        </div>
        <div style={{ padding: '12px 14px' }}>
          <p style={{ color: '#fff', fontWeight: 700, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3 }}>{album.title}</p>
          <p style={{ color: '#737373', fontSize: 11 }}>{album.year} · {album.artistName}</p>
        </div>
      </motion.div>
    </Link>
  );
}

interface MobileLibraryViewProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  view: 'grid' | 'list';
  setView: (view: 'grid' | 'list') => void;
  sort: string;
  setSort: (sort: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  showSortMenu: boolean;
  setShowSortMenu: (show: boolean) => void;
  setShowCreateModal: (show: boolean) => void;
  setShowAddMenu: (show: boolean) => void;
  getUnifiedList: () => any[];
  likedTracks: any[];
  playTrack: (track: any, queue: any[]) => void;
  user: any;
  rooms: any[];
}

function MobileLibraryView({
  activeTab,
  setActiveTab,
  view,
  setView,
  sort,
  setSort,
  searchQuery,
  setSearchQuery,
  showSortMenu,
  setShowSortMenu,
  setShowCreateModal,
  setShowAddMenu,
  getUnifiedList,
  likedTracks,
  playTrack,
  user,
  rooms
}: MobileLibraryViewProps) {
  const { setMobileDrawerOpen } = useAuthStore();
  const { currentTrack, isPlaying, togglePlay } = usePlayerStore();
  const router = useRouter();
  const G = '#b08850';
  const SORT_OPTS = [
    { v: 'recents', l: 'Recently Added' },
    { v: 'az',      l: 'A → Z' },
    { v: 'za',      l: 'Z → A' },
  ];

  // Filter liked tracks locally for search
  const q = searchQuery.toLowerCase().trim();
  const filteredLikedTracks = q
    ? likedTracks.filter(t => t.title.toLowerCase().includes(q) || t.artistName.toLowerCase().includes(q))
    : likedTracks;

  const isLikedPlaying = isPlaying && likedTracks.some(t => t.id === currentTrack?.id);

  return (
    <div>
      {/* Mobile Spotify-Style Header */}
      {activeTab === 'Liked' ? null : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div
            onClick={() => setMobileDrawerOpen(true)}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: '#b08850', // Green circle
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
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 24, fontWeight: 900, color: '#fff' }}>Your Library</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginLeft: 'auto' }}>
            <Search size={22} color="#fff" style={{ cursor: 'pointer' }} onClick={() => {
              toast('Search library…', { icon: '🔍' });
            }} />
            <Plus size={24} color="#fff" style={{ cursor: 'pointer' }} onClick={() => setShowAddMenu(true)} />
          </div>
        </div>
      )}

      {/* Horizontally Scrolling Pills/Chips */}
      {activeTab !== 'Liked' && (
        <div style={{ 
          display: 'flex', 
          gap: 8, 
          overflowX: 'auto', 
          scrollbarWidth: 'none', 
          msOverflowStyle: 'none', 
          paddingBottom: 4,
          marginBottom: 16,
          WebkitOverflowScrolling: 'touch'
        }} className="hide-scrollbar">
          <style>{`
            .hide-scrollbar::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          {[
            { id: 'Playlists', label: 'Playlists' },
            { id: 'Artists', label: 'Artists' },
            { id: 'Albums', label: 'Albums' },
          ].map(chip => {
            const active = activeTab === chip.id;
            return (
              <button
                key={chip.id}
                onClick={() => {
                  if (active) {
                    setActiveTab('overview');
                  } else {
                    setActiveTab(chip.id);
                  }
                }}
                style={{
                  padding: '6px 16px',
                  borderRadius: 20,
                  background: active ? G : 'rgba(255,255,255,0.08)',
                  color: active ? '#000' : '#fff',
                  fontSize: 12.5,
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s'
                }}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Liked Songs Premium Banner Card (as per second reference image) */}
      {activeTab !== 'Liked' && activeTab !== 'Downloads' && (
        <div 
          onClick={() => setActiveTab('Liked')}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 16,
            padding: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 52,
              height: 52,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #064e3b, #10b981)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
            }}>
              <Heart size={24} color="#fff" fill="#fff" />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0, fontFamily: 'Outfit, sans-serif' }}>Liked Songs</h3>
              <p style={{ fontSize: 12.5, color: '#a3a3a3', margin: '4px 0 0', fontWeight: 500 }}>
                {likedTracks.length} song{likedTracks.length !== 1 ? 's' : ''} you love
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }} onClick={e => e.stopPropagation()}>
            {likedTracks.length > 0 && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  if (isLikedPlaying) {
                    togglePlay();
                  } else {
                    playTrack(likedTracks[0], likedTracks);
                  }
                }}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: G,
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: `0 4px 12px ${G}35`
                }}
              >
                {isLikedPlaying ? (
                  <Pause size={18} fill="#000" color="#000" />
                ) : (
                  <Play size={18} fill="#000" color="#000" style={{ marginLeft: 2 }} />
                )}
              </button>
            )}
            <button 
              onClick={() => setActiveTab('Liked')}
              style={{
                background: 'none',
                border: 'none',
                color: '#fff',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                padding: '4px 8px'
              }}
            >
              View all &rarr;
            </button>
          </div>
        </div>
      )}

      {/* Mobile Main Content */}
      {activeTab === 'Liked' ? (
        /* Liked Songs mobile detail view */
        <div style={{ margin: '-16px -16px 0 -16px', paddingBottom: 20 }}>
          {/* Beautiful fading top banner gradient background */}
          <div style={{ 
            background: 'linear-gradient(180deg, rgba(176, 136, 80, 0.45) 0%, rgba(13, 27, 20, 0.15) 50%, rgba(8, 8, 8, 0) 100%)',
            padding: '24px 16px 20px 16px',
          }}>
            {/* Nav row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <button onClick={() => setActiveTab('overview')} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', cursor: 'pointer', padding: 8, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 38, height: 38 }}>
                <ChevronLeft size={22} />
              </button>
              <div>
                <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 18, fontWeight: 800, color: '#fff', margin: 0 }}>Liked Songs</h1>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, margin: 0 }}>Your library</p>
              </div>
            </div>

            {/* Album art cover & info */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 24 }}>
              <div style={{
                width: 140,
                height: 140,
                borderRadius: 18,
                background: 'linear-gradient(135deg, #064e3b 0%, #10b981 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 12px 32px rgba(16, 185, 129, 0.4), 0 4px 12px rgba(0, 0, 0, 0.4)',
                marginBottom: 16,
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 100%)' }} />
                <Heart size={56} color="#fff" fill="#fff" style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))' }} />
              </div>
              
              <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', margin: '0 0 6px 0' }}>
                Liked Songs
              </h1>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#b08850', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800 }}>
                  {user?.name ? user.name[0].toUpperCase() : 'M'}
                </div>
                <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>
                  {user?.name || 'Manoj lastro'}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>•</span>
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 600 }}>
                  {likedTracks.length} song{likedTracks.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Controls Row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px', marginBottom: 12 }}>
              <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                <button onClick={() => toast.success('Offline mode is coming soon!', { icon: '👑' })} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Download size={20} />
                </button>
                <button 
                  onClick={() => {
                    if (likedTracks.length > 0) {
                      const shuffled = [...likedTracks].sort(() => Math.random() - 0.5);
                      playTrack(shuffled[0], shuffled);
                      toast.success('Shuffling Liked Songs 🔀');
                    }
                  }} 
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Shuffle size={20} />
                </button>
                <button onClick={() => toast('Playlist options')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MoreHorizontal size={20} />
                </button>
              </div>
              
              <div>
                <motion.button 
                  whileHover={{ scale: 1.06 }} 
                  whileTap={{ scale: 0.94 }}
                  onClick={() => {
                    if (isLikedPlaying) {
                      togglePlay();
                    } else if (likedTracks.length > 0) {
                      const isTrackActive = likedTracks.some(t => t.id === currentTrack?.id);
                      if (isTrackActive) {
                        togglePlay();
                      } else {
                        playTrack(likedTracks[0], likedTracks);
                      }
                    }
                  }}
                  style={{ 
                    width: 52, 
                    height: 52, 
                    borderRadius: '50%', 
                    background: G, 
                    border: 'none', 
                    cursor: 'pointer', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    boxShadow: `0 6px 20px ${G}40`,
                    color: '#000'
                  }}
                >
                  {isLikedPlaying ? (
                    <Pause size={24} fill="black" color="black" />
                  ) : (
                    <Play size={24} fill="black" color="black" style={{ marginLeft: 4 }} />
                  )}
                </motion.button>
              </div>
            </div>
          </div>

          {/* Main content area */}
          <div style={{ padding: '0 16px' }}>
            {likedTracks.length === 0 ? (
              <div style={{ padding: '40px 0' }}>
                <EmptyState icon={Heart} title="No liked songs" sub="Tap the heart on any track to save it here." />
              </div>
            ) : (
              <>
                {/* Search Bar for Liked Songs */}
                <div style={{ position: 'relative', marginBottom: 20 }}>
                  <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)', pointerEvents: 'none' }} />
                  <input
                    suppressHydrationWarning
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search in liked songs..."
                    style={{
                      width: '100%',
                      paddingLeft: 38,
                      paddingRight: searchQuery ? 32 : 12,
                      paddingTop: 10,
                      paddingBottom: 10,
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 10,
                      color: '#fff',
                      fontSize: 13,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#a3a3a3', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Clean Track list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {filteredLikedTracks.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#737373', fontSize: 13, padding: '32px 0' }}>
                      No matches found for "{searchQuery}"
                    </div>
                  ) : (
                    filteredLikedTracks.map((track, i) => (
                      <TrackCard key={`mobile-liked-${track.id}-${i}`} track={track} index={i} queue={filteredLikedTracks} compact />
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      ) : activeTab === 'Downloads' ? (
        /* Downloads section */
        <div>
          <div style={{ textAlign: 'center', padding: '32px 16px', background: 'linear-gradient(180deg, #181818 0%, #0d0d0d 100%)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)' }}>
            <Download size={28} color={G} style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 6 }}>Download offline</h3>
            <p style={{ color: '#737373', fontSize: 12, marginBottom: 16 }}>Go Premium to unlock offline mode, background play, and lossless storage.</p>
            <button onClick={() => toast.success('Upgrade to Premium!')} style={{ background: G, border: 'none', color: '#000', padding: '8px 20px', borderRadius: 20, fontSize: 12, fontWeight: 800 }}>Try Premium Free</button>
          </div>
        </div>
      ) : (
        /* Unified or filtered list view / grid view */
        <div>
          {/* Sorting Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', marginBottom: 12 }}>
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setShowSortMenu(!showSortMenu)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
              >
                <ArrowUpDown size={14} color={G} />
                <span>{SORT_OPTS.find(s => s.v === sort)?.l || 'Recents'}</span>
              </button>
              <AnimatePresence>
                {showSortMenu && (
                  <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 299 }} onClick={() => setShowSortMenu(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.96 }}
                      style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 300, background: '#1e1e1e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, overflow: 'hidden', minWidth: 160, boxShadow: '0 12px 36px rgba(0,0,0,0.5)' }}
                    >
                      <div style={{ padding: '4px' }}>
                        {SORT_OPTS.map(opt => (
                          <button key={opt.v} onClick={() => { setSort(opt.v); setShowSortMenu(false); }}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', background: 'none', border: 'none', color: sort === opt.v ? '#fff' : '#a3a3a3', fontSize: 12, fontWeight: 500, cursor: 'pointer', borderRadius: 8 }}
                          >
                            {opt.l}
                            {sort === opt.v && <Check size={12} color={G} />}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            <button 
              onClick={() => setView(view === 'grid' ? 'list' : 'grid')}
              style={{ background: 'none', border: 'none', color: '#a3a3a3', cursor: 'pointer' }}
            >
              {view === 'grid' ? <List size={18} /> : <Grid size={18} />}
            </button>
          </div>

          {/* List / Grid content */}
          {getUnifiedList().length === 0 ? (
            <EmptyState icon={Music2} title="Your Library is empty" sub="Create a playlist or save tracks to see them here." />
          ) : view === 'grid' ? (
            /* Grid Layout */
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
              {/* Create Playlist option */}
              {activeTab === 'Playlists' && (
                <div onClick={() => setShowAddMenu(true)} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ aspectRatio: '1', width: '100%', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Plus size={28} color="#737373" />
                  </div>
                  <div>
                    <p style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>Create playlist</p>
                    <p style={{ color: '#737373', fontSize: 11 }}>Build collection</p>
                  </div>
                </div>
              )}

              {getUnifiedList().map(item => {
                const isLiked = item.type === 'liked';
                const isArtist = item.type === 'artist';
                
                return (
                  <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: 8, cursor: 'pointer' }}
                    onClick={() => {
                      if (isLiked) {
                        setActiveTab('Liked');
                      } else if (item.type === 'playlist') {
                        router.push(`/playlist/${item.id}`);
                      } else if (item.type === 'artist') {
                        router.push(`/artist/${item.id}`);
                      } else if (item.type === 'album') {
                        router.push(`/album/${item.id}`);
                      } else if (item.type === 'room') {
                        router.push(`/room/${item.id}`);
                      }
                    }}
                  >
                    <div style={{
                      aspectRatio: '1',
                      width: '100%',
                      borderRadius: isArtist ? '50%' : 8,
                      overflow: 'hidden',
                      background: isLiked ? 'linear-gradient(135deg,#064e3b,#10b981)' : trackGradient(item.id),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                      position: 'relative'
                    }}>
                      {isLiked ? (
                        <Heart size={36} color="#fff" fill="#fff" />
                      ) : item.type === 'room' ? (
                        <Users size={36} color="rgba(255,255,255,0.7)" />
                      ) : item.image ? (
                        <img src={item.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <Music2 size={36} color="rgba(255,255,255,0.4)" />
                      )}
                    </div>
                    <div>
                      <p style={{
                        color: isLiked ? G : '#fff',
                        fontSize: 13,
                        fontWeight: 600,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>{item.title}</p>
                      <p style={{
                        color: '#737373',
                        fontSize: 11,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        marginTop: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                      }}>
                        {item.pinned && <Pin size={10} color={G} fill={G} />}
                        {item.subtitle}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* List Layout */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Create Playlist option */}
              {activeTab === 'Playlists' && (
                <div onClick={() => setShowAddMenu(true)} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', padding: '4px 0' }}>
                  <div style={{ width: 52, height: 52, borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Plus size={20} color="#737373" />
                  </div>
                  <div>
                    <p style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>Create playlist</p>
                    <p style={{ color: '#737373', fontSize: 12 }}>Build a custom collection</p>
                  </div>
                </div>
              )}

              {getUnifiedList().map(item => {
                const isLiked = item.type === 'liked';
                const isArtist = item.type === 'artist';

                return (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', padding: '4px 0' }}
                    onClick={() => {
                      if (isLiked) {
                        setActiveTab('Liked');
                      } else if (item.type === 'playlist') {
                        router.push(`/playlist/${item.id}`);
                      } else if (item.type === 'artist') {
                        router.push(`/artist/${item.id}`);
                      } else if (item.type === 'album') {
                        router.push(`/album/${item.id}`);
                      } else if (item.type === 'room') {
                        router.push(`/room/${item.id}`);
                      }
                    }}
                  >
                    <div style={{
                      width: 52,
                      height: 52,
                      borderRadius: isArtist ? '50%' : 8,
                      overflow: 'hidden',
                      background: isLiked ? 'linear-gradient(135deg,#064e3b,#10b981)' : trackGradient(item.id),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                    }}>
                      {isLiked ? (
                        <Heart size={20} color="#fff" fill="#fff" />
                      ) : item.type === 'room' ? (
                        <Users size={20} color="rgba(255,255,255,0.7)" />
                      ) : item.image ? (
                        <img src={item.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <Music2 size={20} color="rgba(255,255,255,0.4)" />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        color: isLiked ? G : '#fff',
                        fontSize: 14,
                        fontWeight: 600,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        marginBottom: 2
                      }}>{item.title}</p>
                      <p style={{
                        color: '#737373',
                        fontSize: 12,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                      }}>
                        {item.pinned && <Pin size={10} color={G} fill={G} />}
                        {item.subtitle}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
function LibraryPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState('Playlists');
  const [view, setView] = useState<'grid' | 'list'>('list');
  const [sort, setSort] = useState('recents');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showJoinRoomModal, setShowJoinRoomModal] = useState(false);
  const [joinRoomCode, setJoinRoomCode] = useState('');
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDesc, setNewRoomDesc] = useState('');
  const [newRoomCollab, setNewRoomCollab] = useState(true);
  const [newRoomPassword, setNewRoomPassword] = useState('');
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showActiveRoomWarning, setShowActiveRoomWarning] = useState(false);
  const [existingRoomId, setExistingRoomId] = useState<string | null>(null);
  const [existingRoomName, setExistingRoomName] = useState<string | null>(null);
  const [selectedGradient, setSelectedGradient] = useState(GRADIENTS[0]);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newTags, setNewTags] = useState('');
  const [newPublic, setNewPublic] = useState(true);
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [bulkMode, setBulkMode] = useState(false);
  const [genreFilter, setGenreFilter] = useState<string | null>(null);
  const [importUrl, setImportUrl] = useState('');
  const [rooms, setRooms] = useState<any[]>([]);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await fetch('/api/rooms');
        const data = await res.json();
        if (data.success && data.rooms) {
          setRooms(data.rooms);
        }
      } catch (err) {
        console.error('Failed to fetch rooms:', err);
      }
    };
    fetchRooms();
    const interval = setInterval(fetchRooms, 12000);
    return () => clearInterval(interval);
  }, []);

  const sortRef = useRef<HTMLDivElement>(null);
  const { user, toggleSavePlaylist } = useAuthStore();
  const { customPlaylists, addPlaylist, removePlaylist } = usePlaylistStore();
  const { getAllTracks, activeArtistIds, fetchTracks, recentlyPlayed } = useMusicStore();
  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayerStore();

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      if (typeof window !== 'undefined' && window.innerWidth <= 768) {
        setShowAddMenu(true);
      } else {
        setShowCreateModal(true);
      }
      if (typeof window !== 'undefined') {
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    fetchTracks();
    const savedPins = localStorage.getItem('beato-pinned');
    if (savedPins) { try { setPinnedIds(JSON.parse(savedPins)); } catch {} }
  }, []);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (sortRef.current && !sortRef.current.contains(e.target as Node)) setShowSortMenu(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const allTracks = getAllTracks();

  const getUnifiedList = () => {
    const list: any[] = [];
    const likedSongsCount = user?.likedSongs?.length ?? 0;

    // 1. Liked Songs
    if (activeTab === 'overview' || activeTab === 'Playlists' || activeTab === 'Liked') {
      list.push({
        id: 'liked-songs-playlist',
        type: 'liked',
        title: 'Liked Songs',
        subtitle: `Playlist • ${user?.name || 'Manoj lastro'}`,
        image: '',
        pinned: true,
        name: 'Liked Songs',
      });
    }

    // 2. Playlists
    if (activeTab === 'overview' || activeTab === 'Playlists') {
      allPlaylists.forEach(p => {
        if (p.id === 'playlist-1') return;

        // Find the first track's cover if p.coverImage is empty
        const firstTrackId = p.tracks?.[0];
        const firstTrack = allTracks.find(t => t.id === firstTrackId);
        const resolvedCover = p.coverImage || firstTrack?.coverImage || '';

        list.push({
          id: p.id,
          type: 'playlist',
          title: p.title,
          subtitle: `Playlist • ${p.ownerName || 'You'}`,
          image: resolvedCover,
          gradientCss: (p as any).gradientCss,
          pinned: pinnedIds.includes(p.id),
          item: p,
          name: p.title,
        });
      });
    }

    // 3. Artists
    if (activeTab === 'overview' || activeTab === 'Artists') {
      filteredArtists.forEach(a => {
        list.push({
          id: a.id,
          type: 'artist',
          title: a.name,
          subtitle: 'Artist',
          image: a.image,
          pinned: false,
          item: a,
          name: a.name,
        });
      });
    }

    // 4. Albums
    if (activeTab === 'overview' || activeTab === 'Albums') {
      filteredAlbums.forEach(al => {
        list.push({
          id: al.id,
          type: 'album',
          title: al.title,
          subtitle: `Album • ${al.artistName}`,
          image: al.coverImage,
          pinned: false,
          item: al,
          name: al.title,
        });
      });
    }

    // 5. Jam Rooms
    if (activeTab === 'overview' || activeTab === 'Rooms') {
      rooms.forEach(r => {
        list.push({
          id: r.id,
          type: 'room',
          title: r.name,
          subtitle: `Jam Room • Host: ${r.hostName} • ${r.participants?.length || 0} active`,
          image: '',
          pinned: false,
          item: r,
          name: r.name,
        });
      });
    }

    // Apply search query
    const queryText = searchQuery.toLowerCase().trim();
    const filteredList = queryText
      ? list.filter(item => item.title.toLowerCase().includes(queryText) || item.subtitle.toLowerCase().includes(queryText))
      : list;

    // Sort: pinned first, then by the sort state
    return filteredList.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;

      if (sort === 'az') {
        return a.title.localeCompare(b.title);
      }
      if (sort === 'za') {
        return b.title.localeCompare(a.title);
      }
      // Default: recents / type order (Liked Songs first, then alphabetical)
      return a.title.localeCompare(b.title);
    });
  };

  const artistIds = activeArtistIds || ['artist-1', 'artist-2', 'artist-3', 'artist-4', 'artist-5', 'artist-6'];
  const filteredArtists = mockArtists.filter(a => artistIds.includes(a.id));
  const filteredAlbums = mockAlbums.filter(al => artistIds.includes(al.artistId));
  const activeTrackIds = new Set(allTracks.map(t => t.id));
  const seededPlaylists = mockPlaylists
    .filter(p => p.id === 'playlist-1' || user?.playlists?.includes(p.id))
    .map(p => ({ ...p, tracks: p.tracks.filter(id => activeTrackIds.has(id)) }));
  const userCustomPlaylists = customPlaylists.filter(p => p.ownerId === user?.id || user?.playlists?.includes(p.id));
  const allPlaylists = [...userCustomPlaylists, ...seededPlaylists];

  const likedIds = user?.likedSongs ?? [];
  const likedTracks = allTracks.filter(t => likedIds.includes(t.id));

  // Stats
  const totalListeningMins = allTracks.reduce((acc, t) => acc + (t.duration || 0), 0);
  const totalHours = Math.floor(totalListeningMins / 3600);
  const uniqueGenres = [...new Set(allTracks.map(t => t.genre).filter(Boolean))];

  // Filter + sort playlists
  const q = searchQuery.toLowerCase();
  const filteredPlaylists = allPlaylists
    .filter(p => !q || p.title.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q))
    .sort((a, b) => {
      const aPinned = pinnedIds.includes(a.id) ? -1 : 1;
      const bPinned = pinnedIds.includes(b.id) ? -1 : 1;
      if (aPinned !== bPinned) return aPinned - bPinned;
      if (sort === 'az') return a.title.localeCompare(b.title);
      if (sort === 'za') return b.title.localeCompare(a.title);
      return 0;
    });
  const filteredArtistsList = filteredArtists.filter(a => !q || a.name.toLowerCase().includes(q));
  const filteredAlbumsList = filteredAlbums.filter(al => !q || al.title.toLowerCase().includes(q) || al.artistName.toLowerCase().includes(q));
  const filteredLiked = likedTracks.filter(t => !q || t.title.toLowerCase().includes(q) || t.artistName.toLowerCase().includes(q));

  const togglePin = (id: string) => {
    const updated = pinnedIds.includes(id) ? pinnedIds.filter(x => x !== id) : [...pinnedIds, id];
    setPinnedIds(updated);
    localStorage.setItem('beato-pinned', JSON.stringify(updated));
    toast(pinnedIds.includes(id) ? 'Unpinned' : 'Pinned to top', { icon: pinnedIds.includes(id) ? '📌' : '📍' });
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    const pl = customPlaylists.find(p => p.id === id);
    const isOwner = pl ? pl.ownerId === user?.id : true;
    if (isOwner) {
      removePlaylist(id);
      if (user?.playlists?.includes(id)) {
        toggleSavePlaylist(id);
      }
      toast('Playlist deleted', { icon: '🗑️', style: { background: '#1a1a1a', color: '#fff' } });
    } else {
      if (user?.playlists?.includes(id)) {
        toggleSavePlaylist(id);
      }
      toast('Removed from library', { icon: '🗑️', style: { background: '#1a1a1a', color: '#fff' } });
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const plId = `playlist-custom-${Date.now()}`;
    const randomGradient = GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)];
    const pl = {
      id: plId,
      title: newTitle.trim(),
      description: '',
      coverImage: '', ownerId: user?.id || 'user-1', ownerName: user?.name || 'You',
      tracks: [], totalTracks: 0, duration: 0, isPublic: true,
      isCollaborative: false, followers: 0,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      gradientCss: randomGradient.css, tags: [],
    };
    addPlaylist(pl);
    toggleSavePlaylist(plId);
    toast.success(`"${pl.title}" created 🎵`, { style: { background: '#1a1a1a', color: '#fff', border: `1px solid ${G}30` } });
    setNewTitle('');
    setShowCreateModal(false);
    router.push(`/playlist/${plId}`);
  };

  const handleCreateRoom = () => {
    const activeRoomId = typeof window !== 'undefined' ? localStorage.getItem('soundsphere-active-room-id') : null;
    const activeRoomName = typeof window !== 'undefined' ? localStorage.getItem('soundsphere-active-room-name') : null;
    
    if (activeRoomId) {
      setExistingRoomId(activeRoomId);
      setExistingRoomName(activeRoomName || 'Active Room');
      setShowActiveRoomWarning(true);
    } else {
      setNewRoomName(`${user?.name || 'My'}'s Listening Party`);
      setNewRoomDesc("Come listen to awesome music with me!");
      setNewRoomCollab(true);
      setNewRoomPassword('');
      setShowCreateRoomModal(true);
    }
  };

  const handleExitAndCreate = async () => {
    if (!existingRoomId) return;
    try {
      await fetch(`/api/rooms/${existingRoomId}/leave`, { method: 'POST' });
    } catch (e) {
      console.error('Failed to leave room:', e);
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('soundsphere-active-room-id');
      localStorage.removeItem('soundsphere-active-room-name');
    }
    
    setShowActiveRoomWarning(false);
    
    // Now open the creation modal
    setNewRoomName(`${user?.name || 'My'}'s Listening Party`);
    setNewRoomDesc("Come listen to awesome music with me!");
    setNewRoomCollab(true);
    setNewRoomPassword('');
    setShowCreateRoomModal(true);
  };

  const submitCreateRoom = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newRoomName.trim()) return;
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: newRoomName.trim(), 
          description: newRoomDesc.trim(), 
          isCollaborative: newRoomCollab, 
          password: newRoomPassword || undefined 
        })
      });
      const data = await res.json();
      if (data.success && data.room) {
        toast.success(`Jam Room "${newRoomName}" created! 🎧`);
        if (newRoomPassword) {
          localStorage.setItem(`soundsphere-room-password-${data.room.id}`, newRoomPassword);
        }
        setShowCreateRoomModal(false);
        router.push(`/room/${data.room.id}`);
      } else {
        toast.error(data.error || 'Failed to create room');
      }
    } catch (err) {
      console.error('Failed to create room:', err);
      toast.error('Network error creating room');
    }
  };

  const GENRES_AVAIL = ['Pop', 'Hip-Hop', 'Electronic', 'R&B', 'Indie', 'Rock', 'Ambient'];

  return (
    <div className="library-themed-container" style={{ minHeight: '100%', background: 'var(--color-ss-bg, #fbf9f5)', padding: isMobile ? 'calc(var(--sat, 0px) + 12px) 16px 80px' : 0 }}>
      {isMobile ? (
        <MobileLibraryView
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          view={view}
          setView={setView}
          sort={sort}
          setSort={setSort}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          showSortMenu={showSortMenu}
          setShowSortMenu={setShowSortMenu}
          setShowCreateModal={setShowCreateModal}
          setShowAddMenu={setShowAddMenu}
          getUnifiedList={getUnifiedList}
          likedTracks={likedTracks}
          playTrack={playTrack}
          user={user}
          rooms={rooms}
        />
      ) : (
        <div className="library-themed-container" style={{ minHeight: '100%', background: 'var(--color-ss-bg, #fbf9f5)', position: 'relative' }}>
          <TopBar />
          {/* Redesigned Clean Header (Simple, premium, like mobile collection view) */}
          <div style={{ 
            padding: '32px 32px 16px 32px',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            background: 'linear-gradient(180deg, rgba(176, 136, 80,0.06) 0%, transparent 100%)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Ambient background light */}
            <div style={{ position: 'absolute', top: -80, left: -60, width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle, rgba(176, 136, 80,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

            {/* Top Header Row: Title, Search, and Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {user?.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt="" 
                    style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.1)' }} 
                  />
                ) : (
                  <div style={{ 
                    width: 48, 
                    height: 48, 
                    borderRadius: '50%', 
                    background: 'linear-gradient(135deg, #b08850, #10b981)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    fontSize: 18, 
                    fontWeight: 800, 
                    color: '#fff' 
                  }}>
                    {user?.name ? user.name[0].toUpperCase() : 'N'}
                  </div>
                )}
                <div>
                  <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 32, fontWeight: 900, color: '#fff', letterSpacing: '-0.025em', margin: 0 }}>
                    Your Library
                  </h1>
                  <p style={{ color: '#737373', fontSize: 13, margin: '2px 0 0 0', fontWeight: 500 }}>
                    Welcome back, {user?.name || 'Nandhini'}
                  </p>
                </div>
              </div>

              {/* Search bar & actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {/* Search Input */}
                <div style={{ position: 'relative', width: 260 }}>
                  <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#a3a3a3', pointerEvents: 'none' }} />
                  <input
                    suppressHydrationWarning
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder={`Search library…`}
                    style={{ 
                      width: '100%', 
                      paddingLeft: 36, 
                      paddingRight: searchQuery ? 32 : 12, 
                      paddingTop: 9, 
                      paddingBottom: 9, 
                      background: 'rgba(255,255,255,0.06)', 
                      border: searchQuery ? `1px solid ${G}50` : '1px solid rgba(255,255,255,0.08)', 
                      borderRadius: 10, 
                      color: '#fff', 
                      fontSize: 13, 
                      outline: 'none', 
                      transition: 'all 0.2s',
                      boxSizing: 'border-box'
                    }}
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#a3a3a3', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><X size={14} /></button>
                  )}
                </div>

                {/* Sync */}
                <button
                  onClick={() => toast('Sync complete!', { icon: '🔄' })}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#d1d5db', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#d1d5db'; }}
                >
                  <RefreshCw size={13} /> Sync
                </button>

                {/* Import */}
                <button
                  onClick={() => setShowImportModal(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#d1d5db', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#d1d5db'; }}
                >
                  <Upload size={13} /> Import
                </button>

                {/* New Playlist */}
                <motion.button
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={() => setShowCreateModal(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 20px', borderRadius: 10, background: G, border: 'none', color: '#000', fontSize: 13, fontWeight: 800, cursor: 'pointer', boxShadow: `0 4px 16px ${G}35`, fontFamily: 'Outfit, sans-serif' }}
                >
                  <Plus size={15} strokeWidth={3.5} /> New Playlist
                </motion.button>
              </div>
            </div>

            {/* Filter Pills Row */}
            <div style={{ display: 'flex', gap: 8, zIndex: 1, overflowX: 'auto', paddingBottom: 4 }} className="no-scrollbar">
              {TABS.map(({ id, label, icon: Icon }) => {
                const active = activeTab === id;
                return (
                  <button key={id}
                    onClick={() => { setActiveTab(id); setSearchQuery(''); setGenreFilter(null); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 18px',
                      borderRadius: 20,
                      background: active ? G : 'rgba(255,255,255,0.06)',
                      border: `1px solid ${active ? G : 'rgba(255,255,255,0.08)'}`,
                      color: active ? '#000' : '#fff',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; } }}
                    onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; } }}
                  >
                    <Icon size={14} color={active ? '#000' : undefined} />
                    {label}
                    {id === 'Liked' && likedTracks.length > 0 && (
                      <span style={{ background: active ? 'rgba(0,0,0,0.15)' : 'rgba(16,185,129,0.2)', color: active ? '#000' : '#10b981', fontSize: 10, fontWeight: 800, padding: '1px 6px', borderRadius: 20 }}>
                        {likedTracks.length}
                      </span>
                    )}
                    {id === 'Playlists' && allPlaylists.length > 0 && (
                      <span style={{ background: active ? 'rgba(0,0,0,0.15)' : `${G}20`, color: active ? '#000' : G, fontSize: 10, fontWeight: 800, padding: '1px 6px', borderRadius: 20 }}>
                        {allPlaylists.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

      {/* ─── Toolbar ───────────────────────────────────────────────────── */}
      {activeTab !== 'overview' && activeTab !== 'Downloads' && (
        <div style={{ padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {/* Sort */}
            <div ref={sortRef} style={{ position: 'relative' }}>
              <button onClick={() => setShowSortMenu(!showSortMenu)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#a3a3a3', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#a3a3a3'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
              >
                <ArrowUpDown size={12} />
                {SORT_OPTS.find(s => s.v === sort)?.l}
                <ChevronDown size={11} style={{ transform: showSortMenu ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>
              <AnimatePresence>
                {showSortMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.96 }}
                    style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 300, background: '#1e1e1e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, overflow: 'hidden', minWidth: 200, boxShadow: '0 16px 48px rgba(0,0,0,0.6)' }}
                  >
                    <div style={{ padding: '6px 4px' }}>
                      {SORT_OPTS.map(opt => (
                        <button key={opt.v} onClick={() => { setSort(opt.v); setShowSortMenu(false); }}
                          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 14px', background: 'none', border: 'none', color: sort === opt.v ? '#fff' : '#a3a3a3', fontSize: 13, fontWeight: 500, cursor: 'pointer', borderRadius: 8, transition: 'background 0.1s' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          {opt.l}
                          {sort === opt.v && <Check size={13} color={G} />}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* View toggle */}
            {activeTab !== 'Liked' && (
              <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 2, gap: 2 }}>
                {([{ v: 'list', I: List }, { v: 'grid', I: Grid }] as { v: 'list' | 'grid'; I: any }[]).map(({ v, I }) => (
                  <button key={v} onClick={() => setView(v)}
                    style={{ padding: '5px 8px', borderRadius: 6, border: 'none', cursor: 'pointer', background: view === v ? 'rgba(255,255,255,0.12)' : 'transparent', color: view === v ? '#fff' : '#737373', transition: 'all 0.15s' }}
                  >
                    <I size={13} />
                  </button>
                ))}
              </div>
            )}

            {/* Genre filter chips */}
            {activeTab === 'Playlists' && (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                {GENRES_AVAIL.slice(0, 5).map(g => (
                  <button key={g} onClick={() => setGenreFilter(genreFilter === g ? null : g)}
                    style={{ padding: '4px 10px', borderRadius: 20, border: `1px solid ${genreFilter === g ? G : 'rgba(255,255,255,0.1)'}`, background: genreFilter === g ? `${G}20` : 'transparent', color: genreFilter === g ? G : '#737373', fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' }}
                  >{g}</button>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Bulk mode */}
            <button
              onClick={() => { setBulkMode(!bulkMode); setSelectedItems([]); }}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 8, background: bulkMode ? `${G}20` : 'rgba(255,255,255,0.05)', border: `1px solid ${bulkMode ? G + '40' : 'rgba(255,255,255,0.08)'}`, color: bulkMode ? G : '#a3a3a3', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
            >
              <SlidersHorizontal size={12} />
              {bulkMode ? 'Done' : 'Select'}
            </button>

            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#737373', pointerEvents: 'none' }} />
              <input
                suppressHydrationWarning
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={`Search ${activeTab.toLowerCase()}…`}
                style={{ width: 220, paddingLeft: 32, paddingRight: searchQuery ? 32 : 12, paddingTop: 7, paddingBottom: 7, background: 'rgba(255,255,255,0.05)', border: searchQuery ? `1px solid ${G}40` : '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#fff', fontSize: 12, outline: 'none', transition: 'all 0.2s' }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#737373', cursor: 'pointer' }}>
                  <X size={12} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bulk action bar */}
      <AnimatePresence>
        {bulkMode && selectedItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            style={{ margin: '0 32px 0', padding: '10px 16px', background: `${G}18`, border: `1px solid ${G}35`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}
          >
            <span style={{ color: G, fontSize: 13, fontWeight: 700 }}>{selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected</span>
            <div style={{ display: 'flex', gap: 8 }}>
              {[{ label: 'Add to Queue', icon: Layers }, { label: 'Share', icon: Share2 }, { label: 'Delete', icon: Trash2 }].map(btn => (
                <button key={btn.label} onClick={() => { toast(`${btn.label} — ${selectedItems.length} items`); setSelectedItems([]); setBulkMode(false); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.08)', border: 'none', color: btn.label === 'Delete' ? '#f87171' : '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                >
                  <btn.icon size={12} /> {btn.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Content ───────────────────────────────────────────────────── */}
      <div style={{ padding: '20px 32px 100px' }}>
        <AnimatePresence mode="wait">

          {/* ── OVERVIEW ── */}
          {activeTab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

              {/* Smart Collections */}
              <div style={{ marginBottom: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <h2 style={{ fontFamily: 'Outfit, sans-serif', color: '#fff', fontSize: 18, fontWeight: 800 }}>Smart Collections</h2>
                  <span style={{ color: '#525252', fontSize: 12 }}>Auto-curated by AI</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
                  {SMART_COLLECTIONS.map(item => (
                    <SmartCollectionCard key={item.id} item={item} onClick={() => { setActiveTab('Playlists'); }} />
                  ))}
                </div>
              </div>

              {/* Recent Playlists */}
              <div style={{ marginBottom: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <h2 style={{ fontFamily: 'Outfit, sans-serif', color: '#fff', fontSize: 18, fontWeight: 800 }}>Recent Playlists</h2>
                  <button onClick={() => setActiveTab('Playlists')} style={{ color: '#737373', fontSize: 12, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                    onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                    onMouseLeave={e => e.currentTarget.style.color = '#737373'}>
                    See all <ChevronRight size={13} />
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(168px, 1fr))', gap: 14 }}>
                  {allPlaylists.slice(0, 6).map(p => (
                    <LibraryPlaylistCard key={p.id} playlist={p} pinned={pinnedIds.includes(p.id)} onPin={() => togglePin(p.id)} onDelete={e => handleDelete(p.id, e)} isCustom={p.id.startsWith('playlist-custom-')} />
                  ))}
                </div>
              </div>

              {/* Top Artists + Liked Songs side by side */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {/* Top Artists */}
                <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 18, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                  <div style={{ padding: '18px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h2 style={{ fontFamily: 'Outfit, sans-serif', color: '#fff', fontSize: 15, fontWeight: 800 }}>Your Artists</h2>
                    <button onClick={() => setActiveTab('Artists')} style={{ color: '#737373', fontSize: 11, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = '#737373'}>
                      See all
                    </button>
                  </div>
                  <div style={{ padding: '8px 4px' }}>
                    {filteredArtists.slice(0, 5).map((a, i) => <ArtistRow key={a.id} artist={a} index={i} />)}
                  </div>
                </div>

                {/* Liked Songs preview */}
                <div style={{ background: 'linear-gradient(135deg, rgba(67,56,202,0.25) 0%, rgba(16, 185, 129,0.15) 100%)', borderRadius: 18, border: '1px solid rgba(99,102,241,0.25)', overflow: 'hidden' }}>
                  <div style={{ padding: '18px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Heart size={15} color="#34d399" fill="#34d399" />
                      <h2 style={{ fontFamily: 'Outfit, sans-serif', color: '#fff', fontSize: 15, fontWeight: 800 }}>Liked Songs</h2>
                      <span style={{ background: 'rgba(52, 211, 153,0.2)', color: '#34d399', fontSize: 10, fontWeight: 800, padding: '1px 7px', borderRadius: 20 }}>{likedTracks.length}</span>
                    </div>
                    <button onClick={() => setActiveTab('Liked')} style={{ color: '#737373', fontSize: 11, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = '#737373'}>
                      See all
                    </button>
                  </div>
                  {likedTracks.length === 0 ? (
                    <div style={{ padding: 32, textAlign: 'center', color: '#525252' }}>
                      <Heart size={28} style={{ margin: '0 auto 8px' }} />
                      <p style={{ fontSize: 13 }}>No liked songs yet</p>
                    </div>
                  ) : (
                    <div>
                      {likedTracks.slice(0, 5).map((track, i) => (
                        <TrackCard key={`overview-liked-${track.id}-${i}`} track={track} index={i} queue={likedTracks} compact />
                      ))}
                      {likedTracks.length > 5 && (
                        <div style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <button onClick={() => setActiveTab('Liked')} style={{ color: G, fontSize: 12, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>
                            +{likedTracks.length - 5} more songs
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  {likedTracks.length > 0 && (
                    <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 8 }}>
                      <motion.button whileTap={{ scale: 0.95 }} onClick={() => likedTracks.length && playTrack(likedTracks[0], likedTracks)}
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px', borderRadius: 8, background: G, border: 'none', color: '#000', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>
                        <Play size={13} fill="black" /> Play All
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.95 }} onClick={() => { const r = [...likedTracks].sort(() => Math.random() - 0.5); playTrack(r[0], r); }}
                        style={{ padding: '9px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                        <Shuffle size={13} />
                      </motion.button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── JAM ROOMS ── */}
          {activeTab === 'Rooms' && (
            <motion.div key="rooms" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: '#fff', margin: 0 }}>Active Listeners' Rooms</h3>
                  <p style={{ fontSize: 12, color: '#87786c', margin: '4px 0 0' }}>Join a room to listen synchronously with others in real-time.</p>
                </div>
                <button
                  onClick={handleCreateRoom}
                  style={{
                    background: G,
                    color: '#000',
                    border: 'none',
                    borderRadius: 20,
                    padding: '8px 20px',
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <Plus size={14} /> Create Room
                </button>
              </div>
              {rooms.filter(r => r.isActive).length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No active Jam Rooms"
                  sub="Create your own room and invite your friends to start jamming!"
                  action={handleCreateRoom}
                  actionLabel="Create Jam Room"
                />
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 20 }}>
                  {rooms.filter(r => r.isActive).map(r => (
                    <RoomCard key={r.id} room={r} />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ── PLAYLISTS ── */}
          {activeTab === 'Playlists' && (
            <motion.div key="playlists" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {filteredPlaylists.length === 0 ? (
                <EmptyState icon={FolderPlus} title="No playlists found" sub="Create your first playlist or try a different search." action={() => setShowCreateModal(true)} actionLabel="Create Playlist" />
              ) : view === 'grid' ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(168px, 1fr))', gap: 16 }}>
                  <CreateCard onClick={() => setShowCreateModal(true)} />
                  {filteredPlaylists.map(p => (
                    <div key={p.id} style={{ position: 'relative' }}>
                      {bulkMode && (
                        <div onClick={() => setSelectedItems(prev => prev.includes(p.id) ? prev.filter(x => x !== p.id) : [...prev, p.id])}
                          style={{ position: 'absolute', top: 8, left: 8, zIndex: 20, width: 20, height: 20, borderRadius: 6, border: `2px solid ${selectedItems.includes(p.id) ? G : 'rgba(255,255,255,0.4)'}`, background: selectedItems.includes(p.id) ? G : 'rgba(0,0,0,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {selectedItems.includes(p.id) && <Check size={11} color="#000" strokeWidth={3} />}
                        </div>
                      )}
                      <LibraryPlaylistCard playlist={p} pinned={pinnedIds.includes(p.id)} onPin={() => togglePin(p.id)} onDelete={e => handleDelete(p.id, e)} isCustom={p.id.startsWith('playlist-custom-')} />
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '28px 50px 1fr 80px 100px 40px', gap: 14, padding: '10px 16px', color: '#525252', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <span>#</span><span /><span>Title</span><span>Tracks</span><span>Updated</span><span />
                  </div>
                  {filteredPlaylists.map((p, i) => {
                    const tracks = mockTracks.filter(t => (p.tracks || []).includes(t.id));
                    const isActive = tracks.some(t => t.id === currentTrack?.id);
                    const gradCss = (p as any).gradientCss || (p.id === 'playlist-1' ? 'linear-gradient(135deg,#064e3b,#10b981)' : 'linear-gradient(135deg,#1e3a5f,#0ea5e9)');

                    // Resolve first track's cover image if playlist cover is empty
                    const firstTrackId = p.tracks?.[0];
                    const firstTrack = allTracks.find(t => t.id === firstTrackId);
                    const resolvedCover = p.coverImage || firstTrack?.coverImage || '';

                    return (
                      <Link key={p.id} href={`/playlist/${p.id}`} style={{ textDecoration: 'none' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '28px 50px 1fr 80px 100px 40px', gap: 14, alignItems: 'center', padding: '8px 16px', transition: 'background 0.15s', cursor: 'pointer' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <span style={{ color: isActive ? G : '#525252', fontSize: 12, textAlign: 'center' }}>{i + 1}</span>
                          <div style={{ width: 42, height: 42, borderRadius: 8, background: gradCss, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                            {p.id === 'playlist-1' ? <Heart size={16} color="#fff" fill="#fff" /> : (resolvedCover ? <img src={resolvedCover} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Music2 size={16} color="rgba(255,255,255,0.7)" />)}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <p style={{ color: isActive ? G : '#fff', fontWeight: 700, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</p>
                            <p style={{ color: '#737373', fontSize: 11 }}>Playlist · {p.ownerName || 'You'}</p>
                          </div>
                          <span style={{ color: '#737373', fontSize: 12 }}>{(p.tracks || []).length} songs</span>
                          <span style={{ color: '#525252', fontSize: 11 }}>{p.updatedAt || '—'}</span>
                          <div style={{ display: 'flex', justifyContent: 'center' }}>
                            {pinnedIds.includes(p.id) && <Pin size={11} color={G} />}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* ── ARTISTS ── */}
          {activeTab === 'Artists' && (
            <motion.div key="artists" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {filteredArtistsList.length === 0 ? (
                <EmptyState icon={User} title="No artists found" sub="Follow artists from the homepage to see them here." />
              ) : view === 'grid' ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 16 }}>
                  {filteredArtistsList.map(a => (
                    <ArtistGridCard key={a.id} artist={a} />
                  ))}
                </div>
              ) : (
                <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden', padding: '8px 4px' }}>
                  {filteredArtistsList.map((a, i) => <ArtistRow key={a.id} artist={a} index={i} />)}
                </div>
              )}
            </motion.div>
          )}

          {/* ── ALBUMS ── */}
          {activeTab === 'Albums' && (
            <motion.div key="albums" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {filteredAlbumsList.length === 0 ? (
                <EmptyState icon={Disc} title="No albums saved" sub="Albums you save from the player will appear here." />
              ) : view === 'grid' ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(168px, 1fr))', gap: 16 }}>
                  {filteredAlbumsList.map(al => (
                    <AlbumGridCard key={al.id} album={al} />
                  ))}
                </div>
              ) : (
                <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden', padding: '8px 4px' }}>
                  {filteredAlbumsList.map((a, i) => <AlbumRow key={a.id} album={a} index={i} />)}
                </div>
              )}
            </motion.div>
          )}

          {/* ── LIKED SONGS ── */}
          {activeTab === 'Liked' && (
            <motion.div key="liked" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {filteredLiked.length === 0 ? (
                <EmptyState icon={Heart} title="No liked songs" sub="Tap the heart on any track to save it here." />
              ) : (
                <>
                  {/* Hero */}
                  <div style={{ position: 'relative', borderRadius: 22, overflow: 'hidden', marginBottom: 24, background: 'linear-gradient(135deg, #022c22 0%, #064e3b 45%, #10b981 100%)', padding: '32px 36px' }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.25)' }} />
                    <div style={{ position: 'absolute', top: -60, right: -60, width: 280, height: 280, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', filter: 'blur(40px)' }} />
                    <div style={{ position: 'absolute', bottom: -40, left: 200, width: 200, height: 200, borderRadius: '50%', background: 'rgba(16,185,129,0.2)', filter: 'blur(40px)' }} />
                    <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                        <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(176, 136, 80,0.25)', border: '1px solid rgba(176, 136, 80,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(176, 136, 80,0.3)' }}>
                          <Heart size={28} color="#b08850" fill="#b08850" />
                        </div>
                        <div>
                          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Your Collection</p>
                          <h2 style={{ fontFamily: 'Outfit, sans-serif', color: '#fff', fontSize: 26, fontWeight: 900, letterSpacing: '-0.01em' }}>Liked Songs</h2>
                          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, marginTop: 4 }}>{likedTracks.length} songs saved</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <button onClick={() => { const r = [...likedTracks].sort(() => Math.random() - 0.5); playTrack(r[0], r); }}
                          style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', transition: 'all 0.2s' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.22)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
                        >
                          <Shuffle size={18} />
                        </button>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                          onClick={() => likedTracks.length && playTrack(likedTracks[0], likedTracks)}
                          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 26px', borderRadius: 100, background: G, border: 'none', color: '#000', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', boxShadow: '0 4px 20px rgba(176, 136, 80,0.4)' }}>
                          <Play size={17} fill="black" /> Play All
                        </motion.button>
                      </div>
                    </div>
                  </div>

                  {/* Track table */}
                  <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '28px 44px 1fr 1fr 70px', gap: 12, padding: '10px 16px 8px', color: '#525252', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <span style={{ textAlign: 'center' }}>#</span>
                      <span />
                      <span>Title</span>
                      <span>Album</span>
                      <span style={{ textAlign: 'right', paddingRight: 16 }}><Clock size={11} /></span>
                    </div>
                    {filteredLiked.map((track, i) => (
                      <TrackCard key={`liked-${track.id}-${i}`} track={track} index={i} queue={filteredLiked} />
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* ── DOWNLOADS ── */}
          {activeTab === 'Downloads' && (
            <motion.div key="downloads" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {/* Premium hero */}
              <div style={{ position: 'relative', borderRadius: 24, overflow: 'hidden', background: 'linear-gradient(135deg, #0c0a1e 0%, #1a1040 40%, #0f1a0a 100%)', border: '1px solid rgba(176, 136, 80,0.15)', padding: '52px 40px', marginBottom: 24, textAlign: 'center' }}>
                <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 20%, rgba(176, 136, 80,0.1) 0%, transparent 60%)' }} />
                <div style={{ position: 'absolute', top: -30, right: '20%', width: 200, height: 200, borderRadius: '50%', background: 'rgba(16, 185, 129,0.08)', filter: 'blur(50px)' }} />

                <div style={{ position: 'relative', display: 'inline-flex', marginBottom: 24 }}>
                  {[2, 1, 0].map(i => (
                    <div key={i} style={{
                      position: i === 0 ? 'relative' : 'absolute',
                      top: i === 1 ? -8 : i === 2 ? -16 : undefined,
                      left: i === 1 ? 8 : i === 2 ? 16 : undefined,
                      width: 80, height: 80, borderRadius: '50%',
                      background: i === 0 ? 'rgba(176, 136, 80,0.15)' : `rgba(176, 136, 80,${0.06 - i * 0.02})`,
                      border: `1px solid rgba(176, 136, 80,${0.3 - i * 0.08})`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      backdropFilter: 'blur(8px)',
                    }}>
                      {i === 0 && <Download size={32} color={G} />}
                    </div>
                  ))}
                  <div style={{ position: 'absolute', top: -6, right: -6, padding: '3px 9px', borderRadius: 20, background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', fontSize: 10, fontWeight: 900, color: '#000' }}>PRO</div>
                </div>

                <h2 style={{ position: 'relative', fontFamily: 'Outfit, sans-serif', fontSize: 28, fontWeight: 900, color: '#fff', marginBottom: 10, letterSpacing: '-0.01em' }}>
                  Download Your Entire Library
                </h2>
                <p style={{ position: 'relative', color: '#737373', fontSize: 14, maxWidth: 460, margin: '0 auto 24px', lineHeight: 1.6 }}>
                  Premium subscribers can download any track in lossless FLAC, 320kbps MP3, or AAC format — no internet required, no ads ever.
                </p>
                <div style={{ position: 'relative', display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 28 }}>
                  {['Lossless FLAC', '320kbps MP3', 'Offline Mode', 'No Ads', 'Background Play', 'Unlimited Storage'].map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 20, background: `${G}0d`, border: `1px solid ${G}30` }}>
                      <Check size={11} color={G} />
                      <span style={{ color: '#a3a3a3', fontSize: 12 }}>{f}</span>
                    </div>
                  ))}
                </div>
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  onClick={() => toast.success('Upgrade to unlock offline downloads!', { icon: '👑', style: { background: '#1a1a1a', color: '#fff' } })}
                  style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 36px', borderRadius: 100, background: G, border: 'none', color: '#000', fontSize: 15, fontWeight: 900, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', boxShadow: `0 6px 28px ${G}40`, letterSpacing: '0.01em' }}>
                  <Star size={16} fill="black" /> Go Premium — Free Trial
                </motion.button>
              </div>

              {/* Plans comparison */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                {[
                  { plan: 'Free', price: '$0', color: '#525252', features: ['Limited skips', 'Ad-supported', 'Shuffle only', '—', '—'] },
                  { plan: 'Premium', price: '$9.99/mo', color: G, popular: true, features: ['Unlimited skips', 'Ad-free', 'Any order', 'Download 10k tracks', 'Lossless FLAC'] },
                  { plan: 'Family', price: '$14.99/mo', color: '#10b981', features: ['6 accounts', 'Ad-free', 'Any order', 'Download 10k/acc', 'Lossless + Sharing'] },
                ].map(plan => (
                  <div key={plan.plan} style={{ borderRadius: 18, padding: '24px 20px', background: (plan as any).popular ? `${G}0d` : 'rgba(255,255,255,0.02)', border: `1px solid ${(plan as any).popular ? `${G}35` : 'rgba(255,255,255,0.07)'}`, position: 'relative', overflow: 'hidden' }}>
                    {(plan as any).popular && <div style={{ position: 'absolute', top: 14, right: 14, padding: '3px 10px', borderRadius: 20, background: G, fontSize: 10, fontWeight: 900, color: '#000' }}>Popular</div>}
                    <p style={{ color: plan.color, fontSize: 12, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{plan.plan}</p>
                    <p style={{ fontFamily: 'Outfit, sans-serif', color: '#fff', fontSize: 24, fontWeight: 900, marginBottom: 16 }}>{plan.price}</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {plan.features.map((f, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {f === '—' ? <X size={12} color="#525252" /> : <Check size={12} color={plan.color} strokeWidth={3} />}
                          <span style={{ color: f === '—' ? '#525252' : '#a3a3a3', fontSize: 12 }}>{f === '—' ? 'Not available' : f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
        </div>
      )}

      {/* ─── Create Playlist Modal (Spotify-style) ────────────────────── */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(251, 249, 245, 0.96)', backdropFilter: 'blur(16px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}
          >
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', maxWidth: 400 }}>
              <h2 style={{ color: 'var(--color-ss-text-primary, #221a15)', fontSize: 20, fontWeight: 700, marginBottom: 32, textAlign: 'center', fontFamily: 'var(--font-inter), sans-serif' }}>
                Give your playlist a name
              </h2>
              
              <div style={{ width: '100%', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 40 }}>
                <input
                  suppressHydrationWarning
                  type="text"
                  required
                  autoFocus
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="My playlist #1"
                  maxLength={40}
                  style={{
                    width: '90%',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: 'var(--color-ss-text-primary, #221a15)',
                    fontSize: 28,
                    fontWeight: 700,
                    textAlign: 'center',
                    fontFamily: 'var(--font-inter), sans-serif',
                  }}
                />
                <div style={{ width: '90%', height: 1, background: 'rgba(43, 34, 26, 0.15)', marginTop: 8 }} />
              </div>

              <div style={{ display: 'flex', gap: 16 }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    padding: '10px 24px',
                    borderRadius: 24,
                    border: '1.5px solid rgba(43, 34, 26, 0.25)',
                    background: 'transparent',
                    color: 'var(--color-ss-text-primary, #221a15)',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-inter), sans-serif',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newTitle.trim()}
                  style={{
                    padding: '10px 28px',
                    borderRadius: 24,
                    border: 'none',
                    background: newTitle.trim() ? G : 'rgba(176, 136, 80, 0.25)',
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: newTitle.trim() ? 'pointer' : 'not-allowed',
                    fontFamily: 'var(--font-inter), sans-serif',
                  }}
                >
                  Create
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Import Modal ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {showImportModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}
            onClick={e => { if (e.target === e.currentTarget) setShowImportModal(false); }}
          >
            <motion.div initial={{ opacity: 0, scale: 0.92, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92, y: 24 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              style={{ width: '100%', maxWidth: 460, background: '#141414', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 22, overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.8)' }}
            >
              <div style={{ height: 3, background: 'linear-gradient(90deg, #b08850, #10b981)' }} />
              <div style={{ padding: '22px 24px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(14,165,233,0.15)', border: '1px solid rgba(14,165,233,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Upload size={15} color="#0ea5e9" /></div>
                    <div>
                      <h3 style={{ fontFamily: 'Outfit, sans-serif', color: '#fff', fontSize: 16, fontWeight: 800 }}>Import Playlist</h3>
                      <p style={{ color: '#737373', fontSize: 11 }}>Paste a Spotify, Apple Music, or YouTube URL</p>
                    </div>
                  </div>
                  <button onClick={() => setShowImportModal(false)} style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a3a3a3' }}><X size={14} /></button>
                </div>

                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  {['Spotify', 'Apple Music', 'YouTube'].map(src => (
                    <div key={src} style={{ flex: 1, padding: '10px 8px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center', cursor: 'pointer' }}>
                      <p style={{ color: '#a3a3a3', fontSize: 11, fontWeight: 600 }}>{src}</p>
                    </div>
                  ))}
                </div>

                <input suppressHydrationWarning value={importUrl} onChange={e => setImportUrl(e.target.value)} placeholder="https://open.spotify.com/playlist/..."
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '11px 14px', color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box', marginBottom: 16, transition: 'border 0.2s' }}
                  onFocus={e => e.currentTarget.style.borderColor = 'rgba(14,165,233,0.4)'}
                  onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'} />

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button onClick={() => setShowImportModal(false)} style={{ padding: '10px 18px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#a3a3a3', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                  <button onClick={() => { toast.success('Import started! Playlist will appear shortly.', { icon: '⬇️' }); setShowImportModal(false); setImportUrl(''); }}
                    style={{ padding: '10px 22px', borderRadius: 10, background: '#0ea5e9', border: 'none', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>
                    Import
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Active Room Warning Bottom Sheet ───────────────────────────────── */}
      <AnimatePresence>
        {showActiveRoomWarning && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowActiveRoomWarning(false)}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.6)',
                zIndex: 999,
              }}
            />
            {/* Bottom Sheet */}
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'var(--color-ss-bg, #fbf9f5)',
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                padding: '12px 20px 40px',
                zIndex: 1000,
                boxShadow: '0 -10px 40px var(--color-ss-border, rgba(43, 34, 26, 0.08))',
                borderTop: '1px solid var(--color-ss-border, rgba(43, 34, 26, 0.08))',
                maxWidth: '100%',
                boxSizing: 'border-box',
                maxHeight: '85vh',
                overflowY: 'auto'
              }}
            >
              {/* Drag handle */}
              <div style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                background: 'var(--color-ss-border, rgba(43, 34, 26, 0.15))',
                margin: '0 auto 24px',
              }} />

              <div style={{ padding: '0 4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Users size={15} color="#ef4444" /></div>
                    <div>
                      <h3 style={{ fontFamily: 'Outfit, sans-serif', color: '#221a15', fontSize: 16, fontWeight: 800 }}>Active Jam Room</h3>
                      <p style={{ color: '#706155', fontSize: 11 }}>You must exit your current room first</p>
                    </div>
                  </div>
                  <button onClick={() => setShowActiveRoomWarning(false)} style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(176,136,80,0.08)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#706155' }}><X size={14} /></button>
                </div>

                <p style={{ color: '#221a15', fontSize: 14, lineHeight: 1.5, margin: '0 0 24px' }}>
                  You are currently in an active Jam Room: <strong style={{ color: '#b08850' }}>{existingRoomName}</strong>. You cannot host a new room until you exit this active session.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <button
                    onClick={() => {
                      setShowActiveRoomWarning(false);
                      router.push(`/room/${existingRoomId}`);
                    }}
                    style={{
                      padding: '12px', 
                      borderRadius: 12, 
                      background: '#b08850', 
                      border: 'none', 
                      color: '#fff', 
                      fontSize: 14, 
                      fontWeight: 800, 
                      cursor: 'pointer', 
                      fontFamily: 'Outfit, sans-serif',
                      textAlign: 'center'
                    }}
                  >
                    Go to Active Room
                  </button>

                  <button
                    onClick={handleExitAndCreate}
                    style={{
                      padding: '12px', 
                      borderRadius: 12, 
                      background: 'rgba(239,68,68,0.08)', 
                      border: '1px solid rgba(239,68,68,0.2)', 
                      color: '#ef4444', 
                      fontSize: 14, 
                      fontWeight: 800, 
                      cursor: 'pointer', 
                      fontFamily: 'Outfit, sans-serif',
                      textAlign: 'center'
                    }}
                  >
                    Exit Active Room & Create New
                  </button>

                  <button
                    onClick={() => setShowActiveRoomWarning(false)}
                    style={{
                      padding: '12px', 
                      borderRadius: 12, 
                      background: 'rgba(176,136,80,0.08)', 
                      border: '1px solid rgba(176,136,80,0.15)', 
                      color: '#706155', 
                      fontSize: 14, 
                      fontWeight: 700, 
                      cursor: 'pointer', 
                      fontFamily: 'Outfit, sans-serif',
                      textAlign: 'center'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── Create Jam Room Modal ───────────────────────────────────────────── */}
      <AnimatePresence>
        {showCreateRoomModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateRoomModal(false)}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.6)',
                zIndex: 999,
              }}
            />
            {/* Bottom Sheet */}
            <motion.form 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              onSubmit={submitCreateRoom}
              style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'var(--color-ss-bg, #fbf9f5)',
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                padding: '12px 20px 40px',
                zIndex: 1000,
                boxShadow: '0 -10px 40px var(--color-ss-border, rgba(43, 34, 26, 0.08))',
                borderTop: '1px solid var(--color-ss-border, rgba(43, 34, 26, 0.08))',
                maxWidth: '100%',
                boxSizing: 'border-box',
                maxHeight: '85vh',
                overflowY: 'auto'
              }}
            >
              {/* Drag handle */}
              <div style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                background: 'var(--color-ss-border, rgba(43, 34, 26, 0.15))',
                margin: '0 auto 24px',
              }} />

              <div style={{ padding: '0 4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(176,136,80,0.12)', border: '1px solid rgba(176,136,80,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Users size={15} color="#b08850" /></div>
                    <div>
                      <h3 style={{ fontFamily: 'Outfit, sans-serif', color: '#221a15', fontSize: 16, fontWeight: 800 }}>Create Jam Room</h3>
                      <p style={{ color: '#706155', fontSize: 11 }}>Listen together with friends in real-time</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setShowCreateRoomModal(false)} style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(176,136,80,0.08)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#706155' }}><X size={14} /></button>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', color: '#706155', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Room Name</label>
                  <input suppressHydrationWarning value={newRoomName} onChange={e => setNewRoomName(e.target.value)} placeholder="My Awesome Party" required
                    style={{ width: '100%', background: '#ffffff', border: '1px solid rgba(176, 136, 80, 0.25)', borderRadius: 10, padding: '11px 14px', color: '#221a15', fontSize: 14, outline: 'none', boxSizing: 'border-box', transition: 'all 0.2s' }}
                    onFocus={e => { e.currentTarget.style.borderColor = '#b08850'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(176,136,80,0.1)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'rgba(176,136,80,0.25)'; e.currentTarget.style.boxShadow = 'none'; }} />
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', color: '#706155', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Description (Optional)</label>
                  <input suppressHydrationWarning value={newRoomDesc} onChange={e => setNewRoomDesc(e.target.value)} placeholder="Come listen to awesome music!"
                    style={{ width: '100%', background: '#ffffff', border: '1px solid rgba(176, 136, 80, 0.25)', borderRadius: 10, padding: '11px 14px', color: '#221a15', fontSize: 14, outline: 'none', boxSizing: 'border-box', transition: 'all 0.2s' }}
                    onFocus={e => { e.currentTarget.style.borderColor = '#b08850'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(176,136,80,0.1)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'rgba(176,136,80,0.25)'; e.currentTarget.style.boxShadow = 'none'; }} />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', color: '#706155', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Password (Optional - leave empty for public)</label>
                  <input suppressHydrationWarning type="password" value={newRoomPassword} onChange={e => setNewRoomPassword(e.target.value)} placeholder="Enter password to make it private"
                    style={{ width: '100%', background: '#ffffff', border: '1px solid rgba(176, 136, 80, 0.25)', borderRadius: 10, padding: '11px 14px', color: '#221a15', fontSize: 14, outline: 'none', boxSizing: 'border-box', transition: 'all 0.2s' }}
                    onFocus={e => { e.currentTarget.style.borderColor = '#b08850'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(176,136,80,0.1)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'rgba(176,136,80,0.25)'; e.currentTarget.style.boxShadow = 'none'; }} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  <input type="checkbox" id="roomCollab" checked={newRoomCollab} onChange={e => setNewRoomCollab(e.target.checked)} style={{ cursor: 'pointer', accentColor: '#b08850' }} />
                  <label htmlFor="roomCollab" style={{ color: '#221a15', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>Allow anyone in the room to control playback</label>
                </div>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setShowCreateRoomModal(false)} style={{ padding: '10px 18px', borderRadius: 10, background: 'rgba(176,136,80,0.08)', border: '1px solid rgba(176,136,80,0.15)', color: '#706155', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" disabled={!newRoomName.trim()}
                    style={{ padding: '10px 22px', borderRadius: 10, background: newRoomName.trim() ? '#b08850' : 'rgba(176, 136, 80, 0.25)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 800, cursor: newRoomName.trim() ? 'pointer' : 'not-allowed', fontFamily: 'Outfit, sans-serif', boxShadow: newRoomName.trim() ? '0 4px 12px rgba(176,136,80,0.25)' : 'none' }}>
                    Create Room
                  </button>
                </div>
              </div>
            </motion.form>
          </>
        )}
      </AnimatePresence>



      {/* ─── Join Room Modal ───────────────────────────────────────────── */}
      <AnimatePresence>
        {showJoinRoomModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowJoinRoomModal(false)}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.6)',
                zIndex: 999,
              }}
            />
            {/* Bottom Sheet */}
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'var(--color-ss-bg, #fbf9f5)',
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                padding: '12px 20px 40px',
                zIndex: 1000,
                boxShadow: '0 -10px 40px var(--color-ss-border, rgba(43, 34, 26, 0.08))',
                borderTop: '1px solid var(--color-ss-border, rgba(43, 34, 26, 0.08))',
                maxWidth: '100%',
                boxSizing: 'border-box',
                maxHeight: '85vh',
                overflowY: 'auto'
              }}
            >
              {/* Drag handle */}
              <div style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                background: 'var(--color-ss-border, rgba(43, 34, 26, 0.15))',
                margin: '0 auto 24px',
              }} />

              <div style={{ padding: '0 4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(176,136,80,0.12)', border: '1px solid rgba(176,136,80,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Users size={15} color="#b08850" /></div>
                    <div>
                      <h3 style={{ fontFamily: 'Outfit, sans-serif', color: '#221a15', fontSize: 16, fontWeight: 800 }}>Join Jam Room</h3>
                      <p style={{ color: '#706155', fontSize: 11 }}>Enter room code or invite code</p>
                    </div>
                  </div>
                  <button onClick={() => setShowJoinRoomModal(false)} style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(176,136,80,0.08)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#706155' }}><X size={14} /></button>
                </div>

                <input suppressHydrationWarning value={joinRoomCode} onChange={e => setJoinRoomCode(e.target.value)} placeholder="e.g. room 12345 or code with |"
                  style={{ width: '100%', background: '#ffffff', border: '1px solid rgba(176, 136, 80, 0.25)', borderRadius: 10, padding: '11px 14px', color: '#221a15', fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 16, transition: 'all 0.2s', textAlign: 'center', fontWeight: 'bold' }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#b08850'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(176,136,80,0.1)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(176,136,80,0.25)'; e.currentTarget.style.boxShadow = 'none'; }} />

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button onClick={() => setShowJoinRoomModal(false)} style={{ padding: '10px 18px', borderRadius: 10, background: 'rgba(176,136,80,0.08)', border: '1px solid rgba(176,136,80,0.15)', color: '#706155', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                  <button 
                    onClick={() => { 
                      if(joinRoomCode.trim()) {
                        let targetId = joinRoomCode.trim();
                        if (targetId.includes('|')) {
                          const [rId, rPw] = targetId.split('|');
                          localStorage.setItem(`soundsphere-room-password-${rId}`, rPw);
                          targetId = rId;
                        }
                        router.push(`/room/${targetId}`); 
                      }
                    }}
                    disabled={!joinRoomCode.trim()}
                    style={{ padding: '10px 22px', borderRadius: 10, background: joinRoomCode.trim() ? '#b08850' : 'rgba(176, 136, 80, 0.25)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 800, cursor: joinRoomCode.trim() ? 'pointer' : 'not-allowed', fontFamily: 'Outfit, sans-serif', boxShadow: joinRoomCode.trim() ? '0 4px 12px rgba(176,136,80,0.25)' : 'none' }}>
                    Join Room
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>


      {/* ─── Bottom Sheet / Add Menu Drawer (Mobile) ──────────────────────── */}
      <AnimatePresence>
        {showAddMenu && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddMenu(false)}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.6)',
                zIndex: 999,
              }}
            />
            {/* Drawer Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'var(--color-ss-elevated, #ffffff)',
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                padding: '12px 20px 40px',
                zIndex: 1000,
                boxShadow: '0 -10px 40px var(--color-ss-border, rgba(43, 34, 26, 0.08))',
                borderTop: '1px solid var(--color-ss-border, rgba(43, 34, 26, 0.08))',
                maxWidth: '100%',
                boxSizing: 'border-box'
              }}
            >
              {/* Drag handle */}
              <div style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                background: 'var(--color-ss-border, rgba(43, 34, 26, 0.15))',
                margin: '0 auto 24px',
              }} />

              {/* Options list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {[
                  {
                    title: 'Playlist',
                    desc: 'Create a playlist with songs or episodes',
                    icon: Music2,
                    onClick: () => {
                      setShowAddMenu(false);
                      setShowCreateModal(true);
                    }
                  },
                  {
                    title: 'Create Jam Room',
                    desc: 'Host a room and listen together with friends',
                    icon: Users,
                    onClick: () => {
                      setShowAddMenu(false);
                      handleCreateRoom();
                    }
                  },
                  {
                    title: 'Join Jam Room',
                    desc: 'Join an existing room using a code',
                    icon: Users,
                    onClick: () => {
                      setShowAddMenu(false);
                      setShowJoinRoomModal(true);
                    }
                  },
                  {
                    title: 'Collaborative playlist',
                    desc: 'Create a playlist together with friends',
                    icon: Users,
                    onClick: () => {
                      setShowAddMenu(false);
                      setShowCreateModal(true);
                    }
                  },
                  {
                    title: 'Blend',
                    desc: "Combine your friends' tastes into a playlist",
                    icon: Layers,
                    onClick: () => {
                      setShowAddMenu(false);
                      toast('Blend playlists coming soon! 👥', { style: { background: '#1a1a1a', color: '#fff' } });
                    }
                  },
                  {
                    title: 'Folder',
                    desc: 'Organize your playlists',
                    icon: FolderPlus,
                    onClick: () => {
                      setShowAddMenu(false);
                      toast('Playlist folders coming soon! 📁', { style: { background: '#1a1a1a', color: '#fff' } });
                    }
                  }
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={idx}
                      onClick={item.onClick}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16,
                        cursor: 'pointer',
                        padding: '4px 0',
                        WebkitTapHighlightColor: 'transparent',
                      }}
                    >
                      <div style={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        background: 'var(--color-ss-surface, #f4eede)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <Icon size={20} color="var(--color-ss-primary, #b08850)" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ color: 'var(--color-ss-text-primary, #221a15)', fontSize: 16, fontWeight: 700, margin: 0 }}>{item.title}</p>
                        <p style={{ color: 'var(--color-ss-text-muted, #87786c)', fontSize: 12, margin: '3px 0 0', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function LibraryPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#0a0a0a' }} />}>
      <LibraryPageContent />
    </Suspense>
  );
}

// ─── Helper Components ───────────────────────────────────────────────────────

function EmptyState({ icon: Icon, title, sub, action, actionLabel }: { icon: any; title: string; sub: string; action?: () => void; actionLabel?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      style={{ textAlign: 'center', padding: '72px 24px', background: 'rgba(255,255,255,0.015)', borderRadius: 20, border: '1px dashed rgba(255,255,255,0.07)' }}>
      <div style={{ width: 68, height: 68, borderRadius: 18, background: 'rgba(255,255,255,0.04)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
        <Icon size={28} color="#525252" />
      </div>
      <h3 style={{ fontFamily: 'Outfit, sans-serif', color: '#fff', fontSize: 20, fontWeight: 800, marginBottom: 8 }}>{title}</h3>
      <p style={{ color: '#737373', fontSize: 13, marginBottom: action ? 22 : 0, maxWidth: 320, margin: '0 auto', lineHeight: 1.5 }}>{sub}</p>
      {action && (
        <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={action} style={{ marginTop: 22, padding: '10px 24px', borderRadius: 100, background: G, border: 'none', color: '#000', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', boxShadow: `0 4px 16px ${G}35` }}>
          {actionLabel}
        </motion.button>
      )}
    </motion.div>
  );
}

function CreateCard({ onClick }: { onClick: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <motion.div whileHover={{ y: -6 }} onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ borderRadius: 16, overflow: 'hidden', cursor: 'pointer', background: hov ? 'rgba(176, 136, 80,0.06)' : 'rgba(255,255,255,0.02)', border: `1px dashed ${hov ? G + '60' : 'rgba(255,255,255,0.1)'}`, transition: 'all 0.22s' }}>
      <div style={{ aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', background: hov ? `${G}0d` : 'rgba(255,255,255,0.02)' }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: hov ? `${G}20` : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', boxShadow: hov ? `0 0 20px ${G}30` : 'none' }}>
          <Plus size={24} color={hov ? G : '#525252'} />
        </div>
      </div>
      <div style={{ padding: '12px 14px' }}>
        <p style={{ color: hov ? G : '#fff', fontWeight: 700, fontSize: 13, transition: 'color 0.2s' }}>Create Playlist</p>
        <p style={{ color: '#525252', fontSize: 11, marginTop: 2 }}>Build a custom collection</p>
      </div>
    </motion.div>
  );
}
