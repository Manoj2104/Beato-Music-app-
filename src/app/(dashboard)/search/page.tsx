'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Music, User, Disc, Play, Camera, Plus, CheckCircle2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { usePlayerStore } from '@/store/playerStore';
import { useAuthStore } from '@/store/authStore';
import { useMusicStore, trackGradient } from '@/store/musicStore';
import { mockArtists, mockAlbums, mockPlaylists } from '@/lib/mockData';
import { search, getSuggestions, SearchResult, SearchSuggestion } from '@/lib/search';
import TrackCard from '@/components/music/TrackCard';
import TopBar from '@/components/layout/TopBar';
import { usePlaylistStore } from '@/store/playlistStore';
import { useIsMobile } from '@/hooks/useIsMobile';
import toast from 'react-hot-toast';

// ─────────────────────────────────────────────────────────────
// Design tokens — match home page warm theme
// ─────────────────────────────────────────────────────────────
const BG        = 'var(--color-ss-bg,#fbf9f5)';
const ELEVATED  = 'var(--color-ss-elevated,#ffffff)';
const SURFACE   = 'var(--color-ss-surface,#f4eede)';
const BORDER    = 'var(--color-ss-border,rgba(43,34,26,0.08))';
const TEXT      = 'var(--color-ss-text-primary,#221a15)';
const MUTED     = 'var(--color-ss-text-muted,#87786c)';
const GREEN     = '#0f5132';
const GREEN_L   = '#16a34a';
const INPUT_BG  = '#f0ede8';   // warm tinted input

// ─────────────────────────────────────────────────────────────
// Recent Search helpers
// ─────────────────────────────────────────────────────────────
const RECENT_KEY = 'beato_recent_searches';
const MAX_RECENT = 15;

interface RecentItem {
  uid: string;
  query: string;
  title: string;
  subtitle: string;
  type: 'song' | 'artist' | 'album' | 'playlist' | 'query';
  coverImage: string | null;
  gradient: string | null;
  saved: boolean;   // green-check if song is liked / playlist is saved
  ts: number;
}

function loadRecents(): RecentItem[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; }
}
function saveRecents(items: RecentItem[]) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(items.slice(0, MAX_RECENT))); } catch {}
}
function pushRecent(entry: Omit<RecentItem, 'uid' | 'ts'>) {
  const prev = loadRecents().filter(r => r.query !== entry.query);
  saveRecents([{ ...entry, uid: `r${Date.now()}`, ts: Date.now() }, ...prev]);
}

// ─────────────────────────────────────────────────────────────
// Browse genre data
// ─────────────────────────────────────────────────────────────
const BROWSE_GENRES = [
  { name: 'Pop',          color: '#34d399', emoji: '🎤', image: 'https://images.unsplash.com/photo-1529518969858-8baa65152fc8?w=120&auto=format&fit=crop&q=80' },
  { name: 'Hip-Hop',      color: '#f59e0b', emoji: '🎙️', image: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=120&auto=format&fit=crop&q=80' },
  { name: 'Electronic',   color: '#06b6d4', emoji: '⚡',  image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=120&auto=format&fit=crop&q=80' },
  { name: 'Rock',         color: '#ef4444', emoji: '🎸', image: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=120&auto=format&fit=crop&q=80' },
  { name: 'R&B',          color: '#10b981', emoji: '🎶', image: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=120&auto=format&fit=crop&q=80' },
  { name: 'Indie',        color: '#14b8a6', emoji: '🌿', image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=120&auto=format&fit=crop&q=80' },
  { name: 'Jazz',         color: '#d97706', emoji: '🎺', image: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=120&auto=format&fit=crop&q=80' },
  { name: 'Classical',    color: '#7c3aed', emoji: '🎻', image: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=120&auto=format&fit=crop&q=80' },
  { name: 'Dance',        color: '#34d399', emoji: '🕺', image: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=120&auto=format&fit=crop&q=80' },
  { name: 'Ambient',      color: '#0ea5e9', emoji: '🌊', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=120&auto=format&fit=crop&q=80' },
  { name: 'Synth Wave',   color: '#6366f1', emoji: '🌃', image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=120&auto=format&fit=crop&q=80' },
  { name: 'Lo-Fi',        color: '#64748b', emoji: '📻', image: 'https://images.unsplash.com/photo-1513829096999-4978602297f7?w=120&auto=format&fit=crop&q=80' },
  { name: 'Metal',        color: '#374151', emoji: '🤘', image: 'https://images.unsplash.com/photo-1524567244388-11d371737a2a?w=120&auto=format&fit=crop&q=80' },
  { name: 'Soul',         color: '#f97316', emoji: '💫', image: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=120&auto=format&fit=crop&q=80' },
  { name: 'Latin',        color: '#10b981', emoji: '💃', image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=120&auto=format&fit=crop&q=80' },
  { name: 'Country',      color: '#92400e', emoji: '🤠', image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=120&auto=format&fit=crop&q=80' },
  { name: 'Gospel',       color: '#fbbf24', emoji: '✝️', image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=120&auto=format&fit=crop&q=80' },
  { name: 'Reggae',       color: '#16a34a', emoji: '🌴', image: 'https://images.unsplash.com/photo-1529518969858-8baa65152fc8?w=120&auto=format&fit=crop&q=80' },
  { name: 'Podcast',      color: '#10b981', emoji: '🎧', image: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=120&auto=format&fit=crop&q=80' },
  { name: 'New Releases', color: '#10b981', emoji: '🆕', image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=120&auto=format&fit=crop&q=80' },
];

// ─────────────────────────────────────────────────────────────
// Small sub-components (search results cards)
// ─────────────────────────────────────────────────────────────
function ArtistCard({ artist }: { artist: any }) {
  return (
    <Link href={`/artist/${artist.id}`} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 100, height: 100, borderRadius: '50%', background: `hsl(${artist.id.charCodeAt(artist.id.length-1)*40%360},50%,35%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, boxShadow: '0 4px 20px rgba(0,0,0,0.18)' }}>🎤</div>
      <p style={{ color: TEXT, fontSize: 14, fontWeight: 600, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>{artist.name}</p>
      <p style={{ color: MUTED, fontSize: 11, marginTop: -4 }}>Artist</p>
    </Link>
  );
}

function AlbumCard({ album }: { album: any }) {
  return (
    <Link href={`/album/${album.id}`} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ width: '100%', paddingBottom: '100%', position: 'relative', borderRadius: 10, overflow: 'hidden', background: trackGradient(album.id) }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>🎵</div>
      </div>
      <p style={{ color: TEXT, fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{album.title}</p>
      <p style={{ color: MUTED, fontSize: 11 }}>{album.year} · {album.artistName}</p>
    </Link>
  );
}

function PlaylistSearchCard({ playlist }: { playlist: any }) {
  const isLiked = playlist.id === 'playlist-1';
  let fallbackImg: string | null = null;
  if (!playlist.coverImage || playlist.coverImage === 'undefined') {
    const firstTrack = useMusicStore.getState().getAllTracks().find((t: any) => t.id === playlist.tracks?.[0]);
    if (firstTrack?.coverImage) fallbackImg = firstTrack.coverImage;
  }
  const displayImg = (playlist.coverImage && playlist.coverImage !== 'undefined') ? playlist.coverImage : fallbackImg;
  const grad = playlist.gradientCss || (isLiked ? 'linear-gradient(135deg,#4338ca,#60a5fa)' : 'linear-gradient(135deg,#1e3a5f,#0ea5e9)');
  return (
    <Link href={`/playlist?id=${playlist.id}`} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ width: '100%', paddingBottom: '100%', position: 'relative', borderRadius: 10, overflow: 'hidden', background: displayImg ? 'none' : grad }}>
        {displayImg ? <img src={displayImg} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>{isLiked ? '❤️' : '🎶'}</div>}
      </div>
      <p style={{ color: TEXT, fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{playlist.title}</p>
      <p style={{ color: MUTED, fontSize: 11 }}>Playlist · {playlist.ownerName}</p>
    </Link>
  );
}

function TopResult({ topResult, onPlay }: { topResult: SearchResult['topResult']; onPlay: () => void }) {
  if (!topResult) return null;
  const item = topResult.item as any;
  let displayImg: string | null = null;
  if (topResult.type === 'playlist') {
    let fallbackImg: string | null = null;
    if (!item.coverImage || item.coverImage === 'undefined' || item.coverImage === 'null') {
      const firstTrack = useMusicStore.getState().getAllTracks().find((t: any) => t.id === item.tracks?.[0]);
      if (firstTrack?.coverImage) fallbackImg = firstTrack.coverImage;
    }
    displayImg = (item.coverImage && item.coverImage !== 'undefined' && item.coverImage !== 'null') ? item.coverImage : fallbackImg;
  } else {
    displayImg = (item.coverImage && item.coverImage !== 'undefined' && item.coverImage !== 'null') ? item.coverImage
      : ((item.imageUrl && item.imageUrl !== 'undefined' && item.imageUrl !== 'null') ? item.imageUrl : null);
  }
  const typeLabel = topResult.type === 'track' ? `Song · ${item.artistName}`
    : topResult.type === 'artist' ? 'Artist'
    : topResult.type === 'album' ? `Album · ${item.artistName}`
    : 'Playlist';

  return (
    <div style={{ background: ELEVATED, borderRadius: 14, padding: '16px 16px 20px', border: `1px solid ${BORDER}`, marginBottom: 4 }}>
      {/* Label */}
      <p style={{ color: MUTED, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 14 }}>Top Result</p>
      {/* Content row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Artwork */}
        <div style={{
          width: 72, height: 72, borderRadius: topResult.type === 'artist' ? '50%' : 10,
          flexShrink: 0, overflow: 'hidden', position: 'relative',
          background: displayImg ? 'none' : trackGradient(item.id),
          boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
        }}>
          {displayImg
            ? <img src={displayImg} alt="" loading="lazy" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            : <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>{topResult.type === 'artist' ? '🎤' : '🎵'}</div>}
        </div>
        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: 'Outfit,sans-serif', fontSize: 20, fontWeight: 900, color: TEXT, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.2 }}>
            {item.name || item.title}
          </p>
          <p style={{ color: MUTED, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {typeLabel}
          </p>
        </div>
        {/* Play button */}
        <button
          onClick={onPlay}
          style={{ width: 48, height: 48, borderRadius: '50%', background: GREEN, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(15,81,50,0.45)', flexShrink: 0, transition: 'transform 0.15s, box-shadow 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(15,81,50,0.55)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(15,81,50,0.45)'; }}
        >
          <Play size={20} fill="white" color="white" style={{ marginLeft: 2 }} />
        </button>
      </div>
    </div>
  );
}

// Inline song row matching reference image (cover + title + artist + + + ⋮)
function SongRow({ track, index, queue, onPlay, isActive, isPlaying }: {
  track: any; index: number; queue: any[]; onPlay: () => void;
  isActive: boolean; isPlaying: boolean;
}) {
  const { user, toggleLikeSong } = useAuthStore();
  const likedSongIds = user?.likedSongs || [];
  const isLiked = (likedSongIds || []).includes(track.id);
  const displayImg = (track.coverImage && track.coverImage !== 'undefined' && track.coverImage !== 'null') ? track.coverImage : null;

  return (
    <div
      onClick={onPlay}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 14px', cursor: 'pointer', transition: 'background 0.12s',
        borderRadius: 8,
      }}
      onMouseEnter={e => (e.currentTarget.style.background = INPUT_BG)}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      {/* Cover */}
      <div style={{ width: 44, height: 44, borderRadius: 6, flexShrink: 0, overflow: 'hidden', position: 'relative', background: displayImg ? 'none' : trackGradient(track.id) }}>
        {displayImg
          ? <img src={displayImg} alt="" loading="lazy" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🎵</div>}
        {/* Playing indicator overlay */}
        {isActive && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {isPlaying
              ? <span style={{ fontSize: 14 }}>▐▐</span>
              : <Play size={14} fill="white" color="white" />}
          </div>
        )}
      </div>
      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: isActive ? GREEN : TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2, fontFamily: 'Outfit,sans-serif' }}>
          {track.title}
        </p>
        <p style={{ fontSize: 12, color: MUTED, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {track.artistName}
        </p>
      </div>
      {/* Actions */}
      <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
        <button
          onClick={() => usePlaylistStore.getState().openPlaylistPicker(track)}
          style={{ width: 30, height: 30, borderRadius: '50%', border: `1.5px solid ${BORDER}`, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: MUTED, transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = GREEN; e.currentTarget.style.color = GREEN; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = MUTED; }}
        >
          <Plus size={14} />
        </button>
        <button
          style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: MUTED, transition: 'color 0.15s', fontSize: 16, fontWeight: 700, lineHeight: 1 }}
          onMouseEnter={e => e.currentTarget.style.color = TEXT}
          onMouseLeave={e => e.currentTarget.style.color = MUTED}
        >
          ⋮
        </button>
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────
// Full-page Recents view (like second reference image)
// ─────────────────────────────────────────────────────────────
function RecentsFullPage({
  items,
  onSelect,
  onRemove,
  onClearAll,
}: {
  items: RecentItem[];
  onSelect: (item: RecentItem) => void;
  onRemove: (uid: string) => void;
  onClearAll: () => void;
}) {
  if (items.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{ padding: '48px 16px', textAlign: 'center' }}
      >
        <p style={{ fontSize: 40, marginBottom: 12 }}>🔍</p>
        <p style={{ color: TEXT, fontFamily: 'Outfit,sans-serif', fontWeight: 700, fontSize: 17, marginBottom: 6 }}>No recent searches</p>
        <p style={{ color: MUTED, fontSize: 13 }}>Your recent searches will appear here</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.2 }}
    >
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 0 12px' }}>
        <h2 style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 900, fontSize: 22, color: TEXT, margin: 0 }}>Recents</h2>
        <button
          onClick={onClearAll}
          style={{
            background: 'none',
            border: 'none',
            color: MUTED,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: 6,
            transition: 'color 0.15s, background-color 0.15s'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.color = '#dc2626';
            e.currentTarget.style.backgroundColor = 'rgba(220, 38, 38, 0.05)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = MUTED;
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          Clear all
        </button>
      </div>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {items.map((item, idx) => {
          const isArtist = item.type === 'artist';
          const isQuery  = item.type === 'query';
          return (
            <motion.div
              key={item.uid}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.03, duration: 0.18 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '10px 0',
                borderBottom: idx < items.length - 1 ? `1px solid ${BORDER}` : 'none',
                cursor: 'pointer',
              }}
              onClick={() => onSelect(item)}
            >
              {/* Thumbnail */}
              <div style={{
                width: 52, height: 52, borderRadius: isArtist ? '50%' : 8,
                flexShrink: 0, overflow: 'hidden', position: 'relative',
                background: item.gradient || (isQuery ? SURFACE : INPUT_BG),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {item.coverImage ? (
                  <img
                    src={item.coverImage}
                    alt=""
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : isQuery ? (
                  <Search size={18} color={MUTED} />
                ) : isArtist ? (
                  <span style={{ fontSize: 22 }}>🎤</span>
                ) : (
                  <span style={{ fontSize: 22 }}>🎵</span>
                )}
              </div>

              {/* Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: TEXT, fontSize: 15, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2, fontFamily: 'Outfit,sans-serif' }}>
                  {item.title}
                </p>
                <p style={{ color: MUTED, fontSize: 12.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.subtitle}
                </p>
              </div>

              {/* Action buttons */}
              <div
                style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}
                onClick={e => e.stopPropagation()}
              >
                {/* Saved/Add toggle */}
                {!isQuery && (
                  item.saved ? (
                    <button
                      title="Saved"
                      style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: 'transparent', border: 'none',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <CheckCircle2 size={20} color={GREEN_L} fill={GREEN_L} style={{ opacity: 0.9 }} />
                    </button>
                  ) : (
                    <button
                      onClick={() => onSelect(item)}
                      title="Add"
                      style={{
                        width: 32, height: 32, borderRadius: '50%',
                        border: `1.5px solid ${BORDER}`, background: 'transparent',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: MUTED, transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = GREEN; e.currentTarget.style.color = GREEN; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = MUTED; }}
                    >
                      <Plus size={14} />
                    </button>
                  )
                )}

                {/* Remove */}
                <button
                  onClick={() => onRemove(item.uid)}
                  title="Remove from recents"
                  style={{
                    width: 32, height: 32, borderRadius: '50%',
                    border: 'none', background: 'transparent',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: MUTED, transition: 'color 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = '#dc2626'}
                  onMouseLeave={e => e.currentTarget.style.color = MUTED}
                >
                  <X size={15} />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

// Unified result row matching Spotify list view design
function ResultRow({ item, type, onPlay, isActive, isPlaying, user, likedSongIds }: {
  item: any;
  type: 'song' | 'playlist' | 'album' | 'artist';
  onPlay?: () => void;
  isActive?: boolean;
  isPlaying?: boolean;
  user: any;
  likedSongIds: string[];
}) {
  let displayImg = (item.coverImage && item.coverImage !== 'undefined' && item.coverImage !== 'null') ? item.coverImage
                   : ((item.avatar && item.avatar !== 'undefined') ? item.avatar : null);

  // Fallback for playlist cover image using its first track
  if (type === 'playlist' && (!displayImg || displayImg === 'undefined' || displayImg === 'null')) {
    const firstTrack = useMusicStore.getState().getAllTracks().find((t: any) => t.id === item.tracks?.[0]);
    if (firstTrack?.coverImage) displayImg = firstTrack.coverImage;
  }

  let subtitleText = '';
  if (type === 'song') {
    subtitleText = `Song • ${item.artistName || 'Unknown Artist'}`;
  } else if (type === 'playlist') {
    subtitleText = `Playlist • ${item.ownerName || 'Spotify'}`;
  } else if (type === 'album') {
    subtitleText = `Album • ${item.artistName || 'Various Artists'}`;
  } else if (type === 'artist') {
    subtitleText = `Artist`;
  }

  const handleRowClick = () => {
    if (type === 'song') {
      if (onPlay) onPlay();
    } else {
      if (type === 'artist') window.location.href = `/artist/${item.id}`;
      else if (type === 'album') window.location.href = `/album/${item.id}`;
      else if (type === 'playlist') window.location.href = `/playlist/${item.id}`;
    }
  };

  return (
    <div
      onClick={handleRowClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '8px 8px', cursor: 'pointer', transition: 'background 0.12s',
        borderRadius: 8,
      }}
      onMouseEnter={e => (e.currentTarget.style.background = INPUT_BG)}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      {/* Cover */}
      <div style={{
        width: 44, height: 44,
        borderRadius: type === 'artist' ? '50%' : 6,
        flexShrink: 0, overflow: 'hidden', position: 'relative',
        background: displayImg ? 'none' : trackGradient(item.id)
      }}>
        {displayImg ? (
          <img src={displayImg} alt="" loading="lazy" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
            {type === 'artist' ? '🎤' : type === 'album' ? '💿' : type === 'playlist' ? '🎶' : '🎵'}
          </div>
        )}
        {type === 'song' && isActive && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {isPlaying ? <span style={{ fontSize: 14, color: '#fff' }}>▐▐</span> : <Play size={14} fill="white" color="white" />}
          </div>
        )}
      </div>

      {/* Texts */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 14, fontWeight: 700,
          color: isActive ? GREEN : TEXT,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          marginBottom: 2, fontFamily: 'Outfit,sans-serif'
        }}>
          {item.title || item.name}
        </p>
        <p style={{ fontSize: 12, color: MUTED, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {subtitleText}
        </p>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
        {type === 'song' && (
          <>
            <button
              onClick={() => usePlaylistStore.getState().openPlaylistPicker(item)}
              style={{
                width: 30, height: 30, borderRadius: '50%',
                border: `1.5px solid ${BORDER}`, background: 'transparent',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: MUTED, transition: 'all 0.15s'
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = GREEN; e.currentTarget.style.color = GREEN; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = MUTED; }}
            >
              <Plus size={14} />
            </button>
            <button
              style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: MUTED, transition: 'color 0.15s', fontSize: 16, fontWeight: 700, lineHeight: 1 }}
              onMouseEnter={e => e.currentTarget.style.color = TEXT}
              onMouseLeave={e => e.currentTarget.style.color = MUTED}
            >
              ⋮
            </button>
          </>
        )}
        {type !== 'song' && (
          <button
            onClick={() => {
              if (type === 'playlist') {
                toast.success(`Saved playlist "${item.title}" to library!`);
              } else if (type === 'artist') {
                toast.success(`Followed artist "${item.name}"!`);
              } else {
                toast.success(`Saved album "${item.title || item.name}" to library!`);
              }
            }}
            style={{
              width: 30, height: 30, borderRadius: '50%',
              border: `1.5px solid ${BORDER}`, background: 'transparent',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: MUTED, transition: 'all 0.15s'
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = GREEN; e.currentTarget.style.color = GREEN; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = MUTED; }}
          >
            <Plus size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────
export default function SearchPage() {
  const [query, setQuery]               = useState('');
  const [debouncedQuery, setDebouncedQ] = useState('');
  const [results, setResults]           = useState<SearchResult | null>(null);
  const [suggestions, setSuggestions]   = useState<SearchSuggestion[]>([]);
  const [isFocused, setIsFocused]       = useState(false);
  const [recents, setRecents]           = useState<RecentItem[]>([]);
  const [activeFilter, setFilter]       = useState<'all'|'songs'|'artists'|'albums'|'playlists'>('all');
  const [scrolled, setScrolled]         = useState(false);
  const [mounted, setMounted]           = useState(false);

  const debRef   = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);

  const { playTrack, currentTrack, togglePlay, isPlaying } = usePlayerStore();
  const { getAllTracks, uploadedTracks, activeArtistIds } = useMusicStore();
  const { user, setMobileDrawerOpen } = useAuthStore();
  const { customPlaylists } = usePlaylistStore();
  const likedSongIds = user?.likedSongs || [];
  const allTracks = getAllTracks().filter(
    t => t.genre !== 'Podcast' && !t.genre?.startsWith('PodcastChannel:') && t.audioUrl !== 'channel-marker'
  );
  const isMobile  = useIsMobile();

  // mount
  useEffect(() => {
    setMounted(true);
    setRecents(loadRecents());

    // Sync latest public and custom playlists from the cloud database so they can be searched!
    usePlaylistStore.getState().syncFromCloud().catch(err => {
      console.error('Failed to sync search playlists on mount:', err);
    });

    const el = document.querySelector('.app-main');
    if (!el) return;
    const h = () => setScrolled(el.scrollTop > 5);
    el.addEventListener('scroll', h, { passive: true });
    h();
    return () => el.removeEventListener('scroll', h);
  }, []);

  // debounce
  useEffect(() => {
    clearTimeout(debRef.current);
    debRef.current = setTimeout(() => setDebouncedQ(query), 300);
    return () => clearTimeout(debRef.current);
  }, [query]);

  // search
  useEffect(() => {
    if (!debouncedQuery.trim()) { setResults(null); setSuggestions([]); return; }
    const ids      = activeArtistIds || ['artist-1','artist-2','artist-3','artist-4','artist-5','artist-6'];
    const artists  = mockArtists.filter(a  => ids.includes(a.id));
    const albums   = mockAlbums.filter(al  => ids.includes(al.artistId));
    const plylists = [...customPlaylists.filter(p => p.isPublic !== false || p.ownerId === user?.id), ...mockPlaylists];
    const r = search(debouncedQuery, { tracks: allTracks, artists, albums, playlists: plylists });
    setResults(r);
    setSuggestions(getSuggestions(debouncedQuery, { tracks: allTracks, artists, albums }));

    // save to recents
    if (r.topResult) {
      const it = r.topResult.item as any;
      const ci = (it.coverImage && it.coverImage !== 'undefined' && it.coverImage !== 'null') ? it.coverImage
               : ((it.imageUrl && it.imageUrl !== 'undefined') ? it.imageUrl : null);
      const type: RecentItem['type'] = r.topResult.type === 'track' ? 'song'
                                     : r.topResult.type === 'artist' ? 'artist'
                                     : r.topResult.type === 'album'  ? 'album'
                                     : 'playlist';
      const subtitle = type === 'song'    ? `Song • ${it.artistName || ''}`
                     : type === 'artist'  ? 'Artist'
                     : type === 'album'   ? `Album • ${it.artistName || ''}`
                     : 'Playlist';
      const isSaved = type === 'song' ? (likedSongIds || []).includes(it.id) : false;
      pushRecent({ query: debouncedQuery, title: it.name || it.title || debouncedQuery, subtitle, type, coverImage: ci, gradient: (type === 'song' || type === 'album') ? trackGradient(it.id) : null, saved: isSaved });
    } else {
      pushRecent({ query: debouncedQuery, title: debouncedQuery, subtitle: 'Search', type: 'query', coverImage: null, gradient: null, saved: false });
    }
    setRecents(loadRecents());
  }, [debouncedQuery, uploadedTracks, activeArtistIds, customPlaylists]);

  // ── Handlers ────────────────────────────────────────────────
  const exitFocus = () => {
    setIsFocused(false);
    setQuery('');
    setResults(null);
    setSuggestions([]);
  };


  const handleRecentSelect = (item: RecentItem) => {
    setQuery(item.query);
    setIsFocused(false);
    inputRef.current?.blur();
  };

  const handleRecentRemove = (uid: string) => {
    const next = loadRecents().filter(r => r.uid !== uid);
    saveRecents(next);
    setRecents(next);
  };

  const handleClearAll = () => { saveRecents([]); setRecents([]); };

  const FILTERS = ['all','songs','artists','albums','playlists'] as const;

  if (!mounted) return <div style={{ minHeight: '100%', background: BG }} />;

  // ── Show recents full-page: focused + no query typed ────────
  const showRecentsPage = isFocused && !query.trim();
  // ── Show results: focused + has query ───────────────────────
  const showResults     = !!results && !!query.trim();

  return (
    <div style={{ minHeight: '100%', background: BG, padding: isMobile ? '0 0 32px' : '20px 24px' }}>

      {/* ── MOBILE LAYOUT ──────────────────────────────────────── */}
      {isMobile ? (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
          {/* Sticky top bar — always same design */}
          <div style={{
            position: 'sticky', top: 0, zIndex: 50,
            background: scrolled ? 'rgba(251,249,245,0.94)' : BG,
            backdropFilter: scrolled ? 'blur(20px)' : 'none',
            WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
            borderBottom: (scrolled || isFocused) ? `1px solid ${BORDER}` : '1px solid transparent',
            padding: 'calc(var(--sat,0px) + 12px) 16px 14px',
            transition: 'background 0.25s, border-color 0.25s',
          }}>
            {/* Avatar · Search title · Camera — always visible */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div
                onClick={() => setMobileDrawerOpen(true)}
                style={{ width: 32, height: 32, borderRadius: '50%', background: GREEN, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, fontFamily: 'Outfit,sans-serif', cursor: 'pointer', flexShrink: 0 }}
              >
                {user?.name ? user.name[0].toUpperCase() : 'M'}
              </div>
              <h1 style={{ fontFamily: 'Outfit,sans-serif', fontSize: 24, fontWeight: 900, color: TEXT, margin: 0 }}>Search</h1>
              <Camera size={22} color={TEXT} style={{ cursor: 'pointer', marginLeft: 'auto' }} />
            </div>

            {/* Search input — always the same pill shape */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search
                size={16}
                color={isFocused ? GREEN : MUTED}
                style={{ position: 'absolute', left: 13, zIndex: 1, pointerEvents: 'none', transition: 'color 0.2s' }}
              />
              <input
                ref={inputRef}
                suppressHydrationWarning
                value={query}
                onChange={e => { setQuery(e.target.value); setIsFocused(true); }}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                placeholder="What do you want to listen to?"
                style={{
                  width: '100%',
                  background: INPUT_BG,
                  border: isFocused ? `1.5px solid ${GREEN}` : `1px solid ${BORDER}`,
                  borderRadius: 22,
                  padding: '11px 40px 11px 38px',
                  color: TEXT, fontSize: 14, outline: 'none',
                  fontFamily: 'Inter,sans-serif',
                  boxShadow: isFocused ? `0 0 0 3px rgba(15,81,50,0.08)` : 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
              />
              {query ? (
                <button
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => { setQuery(''); setResults(null); setSuggestions([]); inputRef.current?.focus(); }}
                  style={{ position: 'absolute', right: 12, background: 'none', border: 'none', cursor: 'pointer', color: MUTED, display: 'flex', alignItems: 'center', zIndex: 1 }}
                >
                  <X size={15} />
                </button>
              ) : null}
            </div>
          </div>

          {/* Page body */}
          <div style={{ flex: 1, padding: '0 16px' }}>
            <AnimatePresence mode="wait">
              {/* ── Recents full page ── */}
              {showRecentsPage && (
                <RecentsFullPage
                  items={recents}
                  onSelect={handleRecentSelect}
                  onRemove={handleRecentRemove}
                  onClearAll={handleClearAll}
                />
              )}

              {/* ── Search Results ── */}
              {showResults && !showRecentsPage && (
                <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {/* Filter pills */}
                  <div className="no-scrollbar" style={{ display: 'flex', gap: 8, margin: '16px 0', overflowX: 'auto' }}>
                    {FILTERS.map(f => (
                      <button key={f} onClick={() => setFilter(f)} style={{
                        padding: '7px 16px', borderRadius: 100, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                        background: activeFilter === f ? TEXT : ELEVATED,
                        border: activeFilter === f ? '1px solid transparent' : `1px solid ${BORDER}`,
                        color: activeFilter === f ? '#fff' : TEXT, transition: 'all 0.15s',
                      }}>
                        {f.charAt(0).toUpperCase()+f.slice(1)}
                      </button>
                    ))}
                  </div>

                  {(() => {
                    const songsList = results!.tracks;
                    const artistsList = results!.artists;
                    const albumsList = results!.albums;
                    const playlistsList = results!.playlists;

                    let listItems: { item: any; type: 'song' | 'playlist' | 'album' | 'artist' }[] = [];

                    if (activeFilter === 'all') {
                      playlistsList.slice(0, 2).forEach(p => listItems.push({ item: p, type: 'playlist' }));
                      songsList.forEach(t => listItems.push({ item: t, type: 'song' }));
                      playlistsList.slice(2).forEach(p => listItems.push({ item: p, type: 'playlist' }));
                      albumsList.forEach(al => listItems.push({ item: al, type: 'album' }));
                      artistsList.forEach(art => listItems.push({ item: art, type: 'artist' }));
                    } else if (activeFilter === 'songs') {
                      songsList.forEach(t => listItems.push({ item: t, type: 'song' }));
                    } else if (activeFilter === 'artists') {
                      artistsList.forEach(art => listItems.push({ item: art, type: 'artist' }));
                    } else if (activeFilter === 'albums') {
                      albumsList.forEach(al => listItems.push({ item: al, type: 'album' }));
                    } else if (activeFilter === 'playlists') {
                      playlistsList.forEach(p => listItems.push({ item: p, type: 'playlist' }));
                    }

                    const seen = new Set<string>();
                    const uniqueListItems: typeof listItems = [];
                    for (const r of listItems) {
                      const title = (r.item.title || r.item.name || '').toLowerCase().trim();
                      const artistName = (r.item.artistName || r.item.ownerName || '').toLowerCase().trim();
                      const key = `${r.type}-${title}-${artistName}`;
                      if (!seen.has(key)) {
                        seen.add(key);
                        uniqueListItems.push(r);
                      }
                    }

                    if (uniqueListItems.length === 0) {
                      return (
                        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                          <p style={{ fontSize: 48, marginBottom: 16 }}>🔍</p>
                          <h3 style={{ fontFamily: 'Outfit,sans-serif', color: TEXT, fontSize: 20, fontWeight: 800, marginBottom: 8 }}>No results for "{query}"</h3>
                          <p style={{ color: MUTED, fontSize: 14 }}>Try different keywords or check for typos</p>
                        </div>
                      );
                    }

                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {activeFilter === 'all' && query && (
                          <div style={{ display: 'flex', flexDirection: 'column', borderBottom: `1px solid ${BORDER}`, paddingBottom: 8, marginBottom: 8 }}>
                            {[
                              query,
                              `${query} songs`,
                              `${query} playlist`,
                              `${query} 2026`,
                              `${query} hits`
                            ].slice(0, 3).map((suggestionText, idx) => (
                              <div
                                key={idx}
                                onClick={() => { setQuery(suggestionText); setDebouncedQ(suggestionText); }}
                                style={{
                                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                  padding: '8px 8px', cursor: 'pointer', transition: 'background 0.12s',
                                  borderRadius: 8,
                                }}
                                onMouseEnter={e => (e.currentTarget.style.background = INPUT_BG)}
                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                  <span style={{ fontSize: 14, color: MUTED }}>🔍</span>
                                  <span style={{ fontSize: 14, fontWeight: 600, color: TEXT }}>{suggestionText}</span>
                                </div>
                                <span style={{ fontSize: 14, color: MUTED }}>↗</span>
                              </div>
                            ))}
                          </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '4px 0' }}>
                          {uniqueListItems.map(({ item, type }) => (
                            <ResultRow
                              key={`${type}-${item.id}`}
                              item={item}
                              type={type}
                              isActive={type === 'song' && currentTrack?.id === item.id}
                              isPlaying={type === 'song' && currentTrack?.id === item.id && isPlaying}
                              user={user}
                              likedSongIds={likedSongIds}
                              onPlay={() => {
                                if (type === 'song') {
                                  currentTrack?.id === item.id ? togglePlay() : playTrack(item, songsList);
                                }
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </motion.div>
              )}

              {/* ── Default Browse ── */}
              {!isFocused && !showResults && (
                <motion.div key="browse" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {/* Start browsing */}
                    <div>
                      <h2 style={{ fontFamily: 'Outfit,sans-serif', color: TEXT, fontSize: 18, fontWeight: 800, marginBottom: 12 }}>Start browsing</h2>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
                        {[
                          { name: 'Music',        color: '#eb1e32', image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120&auto=format&fit=crop&q=80' },
                          { name: 'Podcasts',      color: '#006450', image: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=120&auto=format&fit=crop&q=80' },
                          { name: 'Live Events',   color: '#8c19ff', image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=120&auto=format&fit=crop&q=80' },
                          { name: 'Home of I-Pop', color: '#283ea3', image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=120&auto=format&fit=crop&q=80' },
                        ].map(item => (
                          <motion.div key={item.name} whileTap={{ scale: 0.97 }} onClick={() => { setIsFocused(true); setQuery(item.name); }}
                            style={{ padding: 12, borderRadius: 8, background: item.color, cursor: 'pointer', position: 'relative', overflow: 'hidden', height: 84 }}>
                            <p style={{ color: '#fff', fontWeight: 800, fontSize: 14, fontFamily: 'Outfit,sans-serif', margin: 0, position: 'relative', zIndex: 1 }}>{item.name}</p>
                            <div style={{ position: 'absolute', bottom: -5, right: -10, width: 52, height: 52, transform: 'rotate(25deg)', borderRadius: 4, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
                              <img src={item.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Discover */}
                    <div>
                      <h2 style={{ fontFamily: 'Outfit,sans-serif', color: TEXT, fontSize: 18, fontWeight: 800, marginBottom: 12 }}>Discover something new</h2>
                      <div className="no-scrollbar" style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 6 }}>
                        {[
                          { tag: '#tamil dance', image: 'https://images.unsplash.com/photo-1519834785169-98be25ec3f84?w=200&auto=format&fit=crop&q=80' },
                          { tag: '#tamil pop',   image: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=200&auto=format&fit=crop&q=80' },
                          { tag: '#clean groove',image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200&auto=format&fit=crop&q=80' },
                          { tag: '#acoustic vibes',image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=200&auto=format&fit=crop&q=80' },
                        ].map(item => (
                          <motion.div key={item.tag} whileTap={{ scale: 0.97 }} onClick={() => { setIsFocused(true); setQuery(item.tag.replace('#','')); }}
                            style={{ width: 110, height: 165, borderRadius: 12, overflow: 'hidden', position: 'relative', flexShrink: 0, cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.25)' }}>
                            <img src={item.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(0,0,0,0.75) 0%,rgba(0,0,0,0) 55%)' }} />
                            <span style={{ position: 'absolute', bottom: 10, left: 10, right: 10, color: '#fff', fontSize: 11, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.tag}</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Browse all */}
                    <div>
                      <h2 style={{ fontFamily: 'Outfit,sans-serif', color: TEXT, fontSize: 18, fontWeight: 800, marginBottom: 12 }}>Browse all</h2>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
                        {BROWSE_GENRES.map(g => (
                          <motion.div key={g.name} whileTap={{ scale: 0.97 }} onClick={() => { setIsFocused(true); setQuery(g.name); }}
                            style={{ padding: 12, borderRadius: 8, background: g.color, cursor: 'pointer', position: 'relative', overflow: 'hidden', height: 84 }}>
                            <p style={{ color: '#fff', fontWeight: 800, fontSize: 14, fontFamily: 'Outfit,sans-serif', margin: 0, position: 'relative', zIndex: 1 }}>{g.name}</p>
                            {g.image ? (
                              <div style={{ position: 'absolute', bottom: -5, right: -10, width: 52, height: 52, transform: 'rotate(25deg)', borderRadius: 4, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
                                <img src={g.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              </div>
                            ) : (
                              <div style={{ position: 'absolute', bottom: -8, right: -4, fontSize: 36, opacity: 0.6, transform: 'rotate(15deg)' }}>{g.emoji}</div>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      ) : (
        /* ── DESKTOP LAYOUT ────────────────────────────────────── */
        <>
          <TopBar />
          {/* Desktop search bar */}
          <div style={{ position: 'relative', maxWidth: 680, margin: '0 auto 28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {isFocused && (
                <motion.button
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  onClick={exitFocus}
                  style={{ width: 36, height: 36, borderRadius: '50%', background: SURFACE, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                >
                  <ArrowLeft size={17} color={TEXT} />
                </motion.button>
              )}
              <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Search size={17} color={MUTED} style={{ position: 'absolute', left: 14, zIndex: 1, pointerEvents: 'none' }} />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  placeholder="What do you want to listen to?"
                  style={{
                    width: '100%', background: INPUT_BG,
                    border: isFocused ? `1.5px solid ${GREEN}` : `1px solid ${BORDER}`,
                    borderRadius: 24, padding: '12px 44px 12px 44px',
                    color: TEXT, fontSize: 14.5, outline: 'none',
                    fontFamily: 'Inter,sans-serif', transition: 'border-color 0.2s, box-shadow 0.2s',
                    boxShadow: isFocused ? `0 0 0 3px rgba(15,81,50,0.09)` : 'none',
                  }}
                />
                {query && (
                  <button onClick={() => { setQuery(''); setResults(null); setSuggestions([]); }}
                    style={{ position: 'absolute', right: 14, background: 'none', border: 'none', cursor: 'pointer', color: MUTED, display: 'flex' }}>
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Desktop: Recents full page or results */}
          <div style={{ maxWidth: 860, margin: '0 auto' }}>
            <AnimatePresence mode="wait">
              {showRecentsPage && (
                <RecentsFullPage
                  items={recents}
                  onSelect={handleRecentSelect}
                  onRemove={handleRecentRemove}
                  onClearAll={handleClearAll}
                />
              )}

              {showResults && !showRecentsPage && (
                <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="no-scrollbar" style={{ display: 'flex', gap: 8, marginBottom: 24, overflowX: 'auto' }}>
                    {FILTERS.map(f => (
                      <button key={f} onClick={() => setFilter(f)} style={{
                        padding: '7px 16px', borderRadius: 100, fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                        background: activeFilter === f ? TEXT : ELEVATED,
                        border: activeFilter === f ? '1px solid transparent' : `1px solid ${BORDER}`,
                        color: activeFilter === f ? '#fff' : TEXT, transition: 'all 0.15s',
                      }}>
                        {f.charAt(0).toUpperCase()+f.slice(1)}
                      </button>
                    ))}
                  </div>

                  {(() => {
                    const songsList = results!.tracks;
                    const artistsList = results!.artists;
                    const albumsList = results!.albums;
                    const playlistsList = results!.playlists;

                    let listItems: { item: any; type: 'song' | 'playlist' | 'album' | 'artist' }[] = [];

                    if (activeFilter === 'all') {
                      playlistsList.slice(0, 2).forEach(p => listItems.push({ item: p, type: 'playlist' }));
                      songsList.forEach(t => listItems.push({ item: t, type: 'song' }));
                      playlistsList.slice(2).forEach(p => listItems.push({ item: p, type: 'playlist' }));
                      albumsList.forEach(al => listItems.push({ item: al, type: 'album' }));
                      artistsList.forEach(art => listItems.push({ item: art, type: 'artist' }));
                    } else if (activeFilter === 'songs') {
                      songsList.forEach(t => listItems.push({ item: t, type: 'song' }));
                    } else if (activeFilter === 'artists') {
                      artistsList.forEach(art => listItems.push({ item: art, type: 'artist' }));
                    } else if (activeFilter === 'albums') {
                      albumsList.forEach(al => listItems.push({ item: al, type: 'album' }));
                    } else if (activeFilter === 'playlists') {
                      playlistsList.forEach(p => listItems.push({ item: p, type: 'playlist' }));
                    }

                    const seen = new Set<string>();
                    const uniqueListItems: typeof listItems = [];
                    for (const r of listItems) {
                      const title = (r.item.title || r.item.name || '').toLowerCase().trim();
                      const artistName = (r.item.artistName || r.item.ownerName || '').toLowerCase().trim();
                      const key = `${r.type}-${title}-${artistName}`;
                      if (!seen.has(key)) {
                        seen.add(key);
                        uniqueListItems.push(r);
                      }
                    }

                    if (uniqueListItems.length === 0) {
                      return (
                        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                          <p style={{ fontSize: 48, marginBottom: 16 }}>🔍</p>
                          <h3 style={{ fontFamily: 'Outfit,sans-serif', color: TEXT, fontSize: 20, fontWeight: 800, marginBottom: 8 }}>No results for "{query}"</h3>
                          <p style={{ color: MUTED, fontSize: 14 }}>Try different keywords or check for typos</p>
                        </div>
                      );
                    }

                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {activeFilter === 'all' && query && (
                          <div style={{ display: 'flex', flexDirection: 'column', borderBottom: `1px solid ${BORDER}`, paddingBottom: 8, marginBottom: 8 }}>
                            {[
                              query,
                              `${query} songs`,
                              `${query} playlist`,
                              `${query} 2026`,
                              `${query} hits`
                            ].slice(0, 5).map((suggestionText, idx) => (
                              <div
                                key={idx}
                                onClick={() => { setQuery(suggestionText); setDebouncedQ(suggestionText); }}
                                style={{
                                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                  padding: '8px 8px', cursor: 'pointer', transition: 'background 0.12s',
                                  borderRadius: 8,
                                }}
                                onMouseEnter={e => (e.currentTarget.style.background = INPUT_BG)}
                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                  <span style={{ fontSize: 14, color: MUTED }}>🔍</span>
                                  <span style={{ fontSize: 14, fontWeight: 600, color: TEXT }}>{suggestionText}</span>
                                </div>
                                <span style={{ fontSize: 14, color: MUTED }}>↗</span>
                              </div>
                            ))}
                          </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '4px 0' }}>
                          {uniqueListItems.map(({ item, type }) => (
                            <ResultRow
                              key={`${type}-${item.id}`}
                              item={item}
                              type={type}
                              isActive={type === 'song' && currentTrack?.id === item.id}
                              isPlaying={type === 'song' && currentTrack?.id === item.id && isPlaying}
                              user={user}
                              likedSongIds={likedSongIds}
                              onPlay={() => {
                                if (type === 'song') {
                                  currentTrack?.id === item.id ? togglePlay() : playTrack(item, songsList);
                                }
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </motion.div>
              )}

              {!isFocused && !showResults && (
                <motion.div key="browse" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <h2 style={{ fontFamily: 'Outfit,sans-serif', color: TEXT, fontSize: 20, fontWeight: 800, marginBottom: 18 }}>Browse Genres</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 12 }}>
                    {BROWSE_GENRES.map(g => (
                      <motion.div key={g.name} whileHover={{ scale: 1.03 }} onClick={() => { setIsFocused(true); setQuery(g.name); }}
                        style={{ padding: '20px 18px', borderRadius: 12, background: g.color, cursor: 'pointer', position: 'relative', overflow: 'hidden', height: 100, display: 'flex', alignItems: 'flex-end' }}>
                        {g.image ? (
                          <div style={{ position: 'absolute', bottom: -10, right: -15, width: 64, height: 64, transform: 'rotate(24deg)', borderRadius: 4, overflow: 'hidden', boxShadow: '0 4px 10px rgba(0,0,0,0.4)' }}>
                            <img src={g.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        ) : (
                          <div style={{ position: 'absolute', top: -8, right: -4, fontSize: 52, opacity: 0.6, transform: 'rotate(15deg)' }}>{g.emoji}</div>
                        )}
                        <p style={{ color: '#fff', fontWeight: 800, fontSize: 16, fontFamily: 'Outfit,sans-serif', position: 'relative', zIndex: 1, textShadow: '0 2px 4px rgba(0,0,0,0.4)' }}>{g.name}</p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  );
}
