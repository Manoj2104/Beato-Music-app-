'use client';

import { use, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Pause, UserCheck, UserPlus, Share2,
  Music, CheckCircle2, TrendingUp, Headphones,
  Clock, Shuffle, ListMusic, Users, MicVocal,
  AtSign, Hash, Globe, Heart, ExternalLink,
  Disc, Mic2, ChevronRight, Flame, Radio, BarChart3,
  MoreHorizontal, MoreVertical, ArrowLeft, Search, BarChart2, ChevronDown, Download, Check, Star, X,
  Plus, Copy, Music2
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import TopBar from '@/components/layout/TopBar';
import { usePlayerStore } from '@/store/playerStore';
import { useAuthStore } from '@/store/authStore';
import { useMusicStore } from '@/store/musicStore';
import toast from 'react-hot-toast';
import { Artist, Track } from '@/types';
import { formatDuration } from '@/lib/mockData';
import { useIsMobile } from '@/hooks/useIsMobile';

// ─── helpers ────────────────────────────────────────────────────────────────
function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 100_000 ? 0 : 1)}K`;
  return n.toLocaleString();
}

// Smooth count-up that transitions from the previous value
function CountUp({ to }: { to: number }) {
  const [val, setVal] = useState(to);
  const prevToRef = useRef(to);

  useEffect(() => {
    const from = prevToRef.current;
    if (from === to) {
      setVal(to);
      return;
    }
    
    let raf: number;
    const t0 = performance.now();
    const dur = 800;
    const run = (t: number) => {
      const p = Math.min(1, (t - t0) / dur);
      const e = 1 - (1 - p) ** 3; // cubic ease out
      setVal(Math.round(from + (to - from) * e));
      if (p < 1) {
        raf = requestAnimationFrame(run);
      } else {
        prevToRef.current = to;
      }
    };
    raf = requestAnimationFrame(run);
    return () => {
      cancelAnimationFrame(raf);
      prevToRef.current = to;
    };
  }, [to]);

  return <>{fmt(val)}</>;
}

// Premium StatsCard with Pulse animation on value change
function StatsCard({ label, value, color, icon, index, isLive }: {
  label: string; value: number; color: string; icon: React.ReactNode; index: number; isLive?: boolean;
}) {
  const [pulse, setPulse] = useState<'up' | 'down' | null>(null);
  const [diff, setDiff] = useState<number>(0);
  const prevVal = useRef(value);

  useEffect(() => {
    if (prevVal.current === value) return;
    const change = value - prevVal.current;
    setDiff(change);
    setPulse(change > 0 ? 'up' : 'down');
    prevVal.current = value;

    const t = setTimeout(() => {
      setPulse(null);
    }, 2000);
    return () => clearTimeout(t);
  }, [value]);

  const activeColor = pulse === 'up' ? '#4ade80' : pulse === 'down' ? '#ef4444' : color;

  // Render custom sparkline curve based on index
  const renderSparkline = () => {
    let pathD = "";
    if (index === 0) {
      // Followers - steady upward slope
      pathD = "M 0 25 C 20 23, 40 16, 60 12 C 80 8, 90 4, 100 2";
    } else if (index === 1) {
      // Monthly Listeners - wavy sinusoidal peaks
      pathD = "M 0 22 C 15 14, 30 26, 45 10 C 60 4, 75 18, 100 6";
    } else if (index === 2) {
      // Listening Now - jittery real-time peaks
      pathD = "M 0 26 C 10 26, 20 12, 35 20 C 50 10, 65 6, 80 24 C 90 24, 95 20, 100 18";
    } else {
      // Tracks - stairs upward increments
      pathD = "M 0 24 H 18 V 19 H 38 V 14 H 58 V 9 H 78 V 4 H 100";
    }

    return (
      <svg className="stats-sparkline" viewBox="0 0 100 30" style={{ width: '100%', height: '100%', pointerEvents: 'none' }}>
        <path d={`${pathD} L 100 30 L 0 30 Z`} fill={`url(#grad-${index})`} opacity="0.12" style={{ transition: 'all 0.3s' }} />
        <path d={pathD} fill="none" stroke={activeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.75" style={{ transition: 'all 0.3s' }} />
        <defs>
          <linearGradient id={`grad-${index}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>
      </svg>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, type: 'spring', stiffness: 220, damping: 22 }}
      className={`premium-stats-card ${pulse === 'up' ? 'pulse-up' : pulse === 'down' ? 'pulse-down' : ''}`}
      style={{
        '--card-accent-color': activeColor,
        '--card-base-color': color,
        '--card-accent-tint': `${color}18`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: 130,
      } as any}
    >
      {/* Background glow */}
      <div style={{
        position: 'absolute',
        top: -15,
        right: -15,
        width: 80,
        height: 80,
        borderRadius: '50%',
        background: activeColor,
        opacity: pulse ? 0.15 : 0.06,
        filter: 'blur(25px)',
        pointerEvents: 'none',
        transition: 'background 0.3s, opacity 0.3s',
        zIndex: 0,
      }} />

      {/* Top Row: Label & Icon */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 1, position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="stats-label-text">{label}</span>
          {isLive && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
              padding: '2px 6px',
              borderRadius: 4,
              background: 'rgba(74, 222, 128, 0.12)',
              color: '#4ade80',
              fontSize: 8,
              fontWeight: 900,
              letterSpacing: 0.5,
              textTransform: 'uppercase',
            }}>
              <span style={{
                width: 4,
                height: 4,
                borderRadius: '50%',
                background: '#4ade80',
                display: 'inline-block',
                animation: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite',
              }} />
              Live
            </span>
          )}
        </div>
        <div className="stats-icon-container">
          {icon}
        </div>
      </div>

      {/* Bottom Row: Number on left, Sparkline on right */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', width: '100%', zIndex: 1, position: 'relative', marginTop: 'auto' }}>
        
        {/* Value & Pulse indicator */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <p className="stats-value-text text-white-force" style={{
            fontFamily: 'Outfit, sans-serif',
            fontWeight: 900,
            fontSize: 34,
            lineHeight: 1,
            letterSpacing: -1,
            margin: 0,
            transition: 'color 0.3s',
          }}>
            <CountUp to={value} />
          </p>
          
          {pulse && (
            <motion.span
              initial={{ opacity: 0, y: 4, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.8 }}
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: pulse === 'up' ? '#4ade80' : '#ef4444',
                marginTop: 4,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 2,
              }}
            >
              {pulse === 'up' ? '▲' : '▼'} {Math.abs(diff).toLocaleString()}
            </motion.span>
          )}
        </div>

        {/* Sparkline Graph on the Right (No text overlap!) */}
        <div style={{ width: 100, height: 40, position: 'relative', overflow: 'hidden' }}>
          {renderSparkline()}
        </div>
      </div>
    </motion.div>
  );
}

// Waveform bars
function WaveBar() {
  return (
    <span style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 16 }}>
      {[4, 10, 7, 13, 9, 6, 11].map((h, i) => (
        <span key={i} style={{
          display: 'block', width: 2, height: h,
          background: '#b08850', borderRadius: 1,
          animation: `waveformH ${0.4 + i * 0.09}s ease-in-out infinite alternate`,
        }} />
      ))}
    </span>
  );
}

// ─── Track row ───────────────────────────────────────────────────────────────
function TrackRow({ track, idx, active, playing, onPlay }: {
  track: Track; idx: number; active: boolean; playing: boolean; onPlay: () => void;
}) {
  const [hov, setHov] = useState(false);
  const { user, toggleLikeSong } = useAuthStore();
  const liked = !!user?.likedSongs?.includes(track.id);

  return (
    <div
      onClick={onPlay}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className={`premium-track-row ${active ? 'active' : ''} grid grid-cols-[24px_40px_1fr_auto_40px] md:grid-cols-[32px_48px_1fr_auto_80px_52px] gap-2.5 md:gap-3 px-3 md:px-4 py-2 md:py-2.5 items-center rounded-lg cursor-pointer transition-colors`}
      style={{}}
    >
      {/* Index / play indicator */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {hov || (active && playing) ? (
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b08850', display: 'flex', alignItems: 'center' }}>
            {active && playing ? <WaveBar /> : <Play size={14} fill="#b08850" color="#b08850" style={{ transform: 'translateX(1px)' }} />}
          </button>
        ) : (
          <span style={{ fontSize: 12, fontWeight: 700, color: active ? '#b08850' : 'rgba(255,255,255,0.25)', fontVariantNumeric: 'tabular-nums' }}>
            {idx + 1}
          </span>
        )}
      </div>

      {/* Album art */}
      <div style={{ position: 'relative', width: 40, height: 40, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: 'rgba(255,255,255,0.06)' }}>
        {track.coverImage ? (
          <Image src={track.coverImage} alt="" fill sizes="40px" style={{ objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Music size={16} color="rgba(255,255,255,0.25)" />
          </div>
        )}
        {active && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <WaveBar />
          </div>
        )}
      </div>

      {/* Title + album/plays */}
      <div style={{ minWidth: 0 }}>
        <p style={{ color: active ? '#b08850' : '#fff', fontSize: 15, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>
          {track.title}
        </p>
        <p className="block md:hidden text-ss-text-muted text-[12px] mt-0.5">
          {track.plays.toLocaleString()}
        </p>
        <p className="hidden md:block text-ss-text-muted text-[11px] mt-0.5 overflow-hidden text-ellipsis whitespace-nowrap">
          {track.albumName || 'Single'}
        </p>
      </div>

      {/* Like */}
      <button
        onClick={e => { e.stopPropagation(); toggleLikeSong(track.id); }}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: liked ? '#b08850' : 'rgba(255,255,255,0.2)',
          display: 'flex', alignItems: 'center',
          opacity: hov || liked ? 1 : 0,
          transition: 'opacity 0.15s, color 0.15s',
          padding: 4,
        }}
      >
        <Heart size={14} fill={liked ? '#b08850' : 'none'} />
      </button>

      {/* Plays (Desktop only) */}
      <span className="hidden md:inline text-[11px] text-ss-text-muted text-right tabular-nums">
        {track.plays >= 1_000_000 ? `${(track.plays / 1_000_000).toFixed(1)}M` : track.plays.toLocaleString()}
      </span>

      {/* Duration (Desktop only) / More (Mobile only) */}
      <span className="hidden md:inline text-[11px] text-ss-text-muted text-right tabular-nums">
        {formatDuration(track.duration)}
      </span>
      <button className="flex md:hidden items-center justify-center text-white/40 hover:text-white p-1 bg-none border-none cursor-pointer">
        <MoreHorizontal size={16} />
      </button>
    </div>
  );
}

// ── Mobile View Component ──
function ArtistMobileView({
  artist,
  artistTracks,
  latestAlbum,
  currentTrack,
  isPlaying,
  playTrack,
  togglePlay,
  followed,
  doFollow,
  doShare,
  doPlay,
  doShuffle,
  currentMonthlyListeners,
  currentFollowers,
  currentListeningNow,
  user
}: any) {
  const [mobileTab, setMobileTab] = useState<'Music' | 'About'>('Music');
  const router = useRouter();

  // Color theme accent
  const hue = (artist.id.split('').reduce((a: number, c: string) => a + c.charCodeAt(0), 0) * 37) % 360;

  return (
    <div className="artist-themed-container" style={{ minHeight: '100vh', background: 'var(--color-ss-bg, #fbf9f5)', color: 'var(--color-ss-text-primary, #221a15)', fontFamily: 'Inter, sans-serif', paddingBottom: 120 }}>
      <style>{`
        .artist-themed-container {
          background-color: var(--color-ss-bg, #fbf9f5) !important;
          color: var(--color-ss-text-primary, #221a15) !important;
        }
        .artist-themed-container h1:not(.text-white-force),
        .artist-themed-container h2:not(.text-white-force),
        .artist-themed-container h3:not(.text-white-force),
        .artist-themed-container h4:not(.text-white-force) {
          color: var(--color-ss-text-primary, #221a15) !important;
        }
        .artist-themed-container p:not(.text-white-force),
        .artist-themed-container span:not(.text-white-force),
        .artist-themed-container label:not(.text-white-force) {
          color: var(--color-ss-text-primary, #221a15) !important;
        }
        .artist-themed-container .text-ss-text-muted,
        .artist-themed-container p[style*="color: rgba(255,255,255,0.5)"],
        .artist-themed-container p[style*="color: rgba(255,255,255,0.7)"],
        .artist-themed-container p[style*="color: rgb(163, 163, 163)"],
        .artist-themed-container span[style*="color: rgb(163, 163, 163)"],
        .artist-themed-container p[style*="color: #a3a3a3"],
        .artist-themed-container span[style*="color: #a3a3a3"] {
          color: var(--color-ss-text-muted, #87786c) !important;
        }
        .artist-themed-container div[style*="background: rgba(255, 255, 255, 0.04)"],
        .artist-themed-container div[style*="background: rgba(255,255,255,0.04)"],
        .artist-themed-container div[style*="background: rgba(255, 255, 255, 0.03)"],
        .artist-themed-container div[style*="background: rgba(255,255,255,0.03)"] {
          background: var(--color-ss-surface, #f4eede) !important;
          border: 1px solid var(--color-ss-border, rgba(43, 34, 26, 0.08)) !important;
          box-shadow: none !important;
        }
        .artist-themed-container button:not(.play-btn-force):not(.text-white-force) {
          color: var(--color-ss-text-primary, #221a15) !important;
          border-color: rgba(43, 34, 26, 0.2) !important;
        }
        .artist-themed-container div[style*="background: #0d0d0d"],
        .artist-themed-container div[style*="background: rgb(13, 13, 13)"] {
          background: var(--color-ss-bg, #fbf9f5) !important;
        }
        .artist-themed-container div[style*="border-bottom: 1px solid rgba(255,255,255,0.05)"] {
          border-bottom: 1px solid var(--color-ss-border, rgba(43, 34, 26, 0.08)) !important;
        }
      `}</style>
      {/* ── HERO BANNER ── */}
      <div style={{ position: 'relative', height: 320, overflow: 'hidden' }}>
        {/* Back Button */}
        <button onClick={() => router.back()} style={{
          position: 'absolute',
          top: 'calc(var(--sat, 0px) + 16px)',
          left: 16,
          width: 38,
          height: 38,
          borderRadius: '50%',
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: 'none',
          color: '#fff',
          cursor: 'pointer',
          zIndex: 50
        }}>
          <ArrowLeft size={20} color="#fff" />
        </button>

        {/* Background Image */}
        {artist.coverImage || artist.image ? (
          <img 
            src={artist.coverImage || artist.image} 
            alt={artist.name} 
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', filter: 'brightness(0.7)' }} 
          />
        ) : (
          <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, hsl(${hue},60%,12%) 0%, hsl(${(hue+40)%360},50%,8%) 100%)` }} />
        )}

        {/* Gradient Overlays */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(13,13,13,0) 0%, rgba(13,13,13,0.7) 70%, #0d0d0d 100%)' }} />

        {/* Floating Artist Info */}
        <div style={{
          position: 'absolute',
          bottom: 12,
          left: 16,
          right: 16,
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: 4
        }}>
          {/* Verified Badge */}
          {artist.verified && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ 
                width: 14, 
                height: 14, 
                borderRadius: '50%', 
                background: '#b08850', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center'
              }}>
                <CheckCircle2 size={10} color="black" strokeWidth={4} />
              </div>
              <span className="text-white-force" style={{ fontSize: 11, fontWeight: 700, color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>Verified by Spotify</span>
            </div>
          )}
          
          <h1 className="text-white-force" style={{
            fontFamily: 'Outfit, sans-serif',
            fontSize: 38,
            fontWeight: 900,
            color: '#fff',
            margin: '2px 0 4px',
            lineHeight: 1,
            letterSpacing: '-1px',
            textShadow: '0 2px 10px rgba(0,0,0,0.8)'
          }}>{artist.name}</h1>
          
          <p className="text-white-force" style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 600, margin: 0, textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>
            {fmt(currentMonthlyListeners)} monthly listeners
          </p>
        </div>
      </div>

      {/* ── CONTROLS ROW ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        background: 'var(--color-ss-bg, #fbf9f5)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Small circular profile pic */}
          <img 
            src={artist.image || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop'} 
            alt="" 
            style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }} 
          />
          
          {/* Following pill button */}
          <button 
            onClick={doFollow}
            style={{
              background: followed ? 'rgba(255,255,255,0.08)' : 'transparent',
              border: followed ? '1px solid #fff' : '1px solid rgba(255,255,255,0.4)',
              color: '#fff',
              padding: '6px 16px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {followed ? 'Following' : 'Follow'}
          </button>

          {/* Three dots option */}
          <button 
            onClick={doShare}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255,255,255,0.6)',
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <MoreVertical size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Shuffle Icon */}
          <button 
            onClick={doShuffle}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4 }}
          >
            <Shuffle size={20} color="#b08850" />
          </button>

          {/* Solid Green Play Button */}
          <button 
            onClick={doPlay}
            style={{
              width: 50,
              height: 50,
              borderRadius: '50%',
              background: '#b08850',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(176, 136, 80,0.4)'
            }}
          >
            {currentTrack?.artistId === artist.id && isPlaying ? (
              <Pause size={20} fill="black" color="black" />
            ) : (
              <Play size={20} fill="black" color="black" style={{ marginLeft: 2 }} />
            )}
          </button>
        </div>
      </div>

      {/* ── PROMO BANNER ── */}
      {latestAlbum && (
        <Link href={`/album/${latestAlbum.id}`} style={{ textDecoration: 'none' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 14px',
            margin: '8px 16px 16px',
            background: 'rgba(255,255,255,0.04)',
            borderRadius: 8,
            cursor: 'pointer',
            border: '1px solid rgba(255,255,255,0.06)'
          }}>
            <div style={{ width: 38, height: 38, borderRadius: 4, overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
              {latestAlbum.coverImage ? (
                <img src={latestAlbum.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#2a2a2a,#111)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>💿</div>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: '#fff', fontSize: 13, fontWeight: 700, margin: 0 }}>Listen to the new album</p>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{latestAlbum.title}</p>
            </div>
            <ChevronRight size={16} color="rgba(255,255,255,0.5)" />
          </div>
        </Link>
      )}

      {/* ── TABS ── */}
      <div style={{
        display: 'flex',
        padding: '0 16px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        marginBottom: 20
      }}>
        {['Music', 'About'].map((tabName) => (
          <button 
            key={tabName}
            onClick={() => setMobileTab(tabName as any)}
            style={{
              background: 'none',
              border: 'none',
              padding: '12px 16px',
              color: mobileTab === tabName ? '#fff' : 'rgba(255,255,255,0.4)',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              position: 'relative'
            }}
          >
            {tabName}
            {mobileTab === tabName && (
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 16,
                right: 16,
                height: 2,
                background: '#b08850'
              }} />
            )}
          </button>
        ))}
      </div>

      {/* ── TAB CONTENT ── */}
      {mobileTab === 'Music' ? (
        <div>
          {/* Popular Section */}
          <div style={{ padding: '0 16px' }}>
            <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 16 }}>Popular</h3>
            
            {artistTracks.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {artistTracks.slice(0, 5).map((track: any, index: number) => {
                  const isTrackActive = currentTrack?.id === track.id;
                  const isTrackPlaying = isTrackActive && isPlaying;
                  const isTrackLiked = user?.likedSongs?.includes(track.id);
                  
                  return (
                    <div 
                      key={track.id}
                      onClick={() => isTrackActive ? togglePlay() : playTrack(track, artistTracks.filter((x: any) => x.id !== track.id))}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '8px 0',
                        cursor: 'pointer'
                      }}
                    >
                      {/* Index / Waveform */}
                      <div style={{ width: 20, display: 'flex', justifyContent: 'center' }}>
                        {isTrackPlaying ? (
                          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 12 }}>
                            {[1, 2, 3].map(i => (
                              <div key={i} style={{ width: 2, background: '#b08850', borderRadius: 1, height: `${4 + i * 2}px`, animation: `waveformH ${0.5 + i * 0.15}s ease-in-out infinite` }} />
                            ))}
                          </div>
                        ) : (
                          <span style={{ fontSize: 13, fontWeight: 700, color: isTrackActive ? '#b08850' : 'rgba(255,255,255,0.4)' }}>
                            {index + 1}
                          </span>
                        )}
                      </div>

                      {/* Track Cover */}
                      <div style={{ width: 44, height: 44, borderRadius: 6, overflow: 'hidden', background: 'rgba(255,255,255,0.05)', flexShrink: 0, position: 'relative' }}>
                        {track.coverImage ? (
                          <img src={track.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Music size={16} color="rgba(255,255,255,0.2)" />
                          </div>
                        )}
                      </div>

                      {/* Title + plays */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          color: isTrackActive ? '#b08850' : '#fff',
                          fontSize: 14,
                          fontWeight: 600,
                          margin: '0 0 3px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>{track.title}</p>
                        
                        <p style={{
                          color: 'rgba(255,255,255,0.4)',
                          fontSize: 11,
                          fontWeight: 500,
                          margin: 0
                        }}>{track.plays.toLocaleString()}</p>
                      </div>

                      {/* Checkmark icon for liked tracks */}
                      {isTrackLiked && (
                        <div style={{ color: '#b08850', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ 
                            width: 16, 
                            height: 16, 
                            borderRadius: '50%', 
                            background: '#b08850', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            color: 'black'
                          }}>
                            <CheckCircle2 size={10} color="black" strokeWidth={4} />
                          </div>
                        </div>
                      )}

                      {/* Option vertical dots */}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          toast(`Options for ${track.title}`);
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'rgba(255,255,255,0.4)',
                          cursor: 'pointer',
                          padding: 4
                        }}
                      >
                        <MoreVertical size={18} />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.04)' }}>
                <Music size={24} color="rgba(255,255,255,0.2)" style={{ marginBottom: 8 }} />
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, margin: 0 }}>No tracks published yet</p>
              </div>
            )}
          </div>

          {/* Popular Releases Section */}
          <div style={{ marginTop: 32, padding: '0 16px' }}>
            <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 16 }}>Popular releases</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              {latestAlbum ? (
                <Link href={`/album/${latestAlbum.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 10, border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ aspectRatio: '1', width: '100%', borderRadius: 8, overflow: 'hidden', marginBottom: 8, position: 'relative' }}>
                      <img src={latestAlbum.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <p style={{ color: '#fff', fontSize: 13, fontWeight: 600, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{latestAlbum.title}</p>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: 0 }}>Album</p>
                  </div>
                </Link>
              ) : (
                <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 12, padding: '24px 12px', border: '1px solid rgba(255,255,255,0.04)', gridColumn: 'span 2', textAlign: 'center' }}>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, margin: 0 }}>No albums released yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* About Tab Content */
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Cover image banner */}
          <div style={{ position: 'relative', height: 180, borderRadius: 12, overflow: 'hidden' }}>
            <img 
              src={artist.coverImage || artist.image || 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&h=400&fit=crop'} 
              alt="" 
              style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.3)' }} 
            />
            <div style={{ position: 'absolute', bottom: 16, left: 16 }}>
              <h4 style={{ color: '#fff', fontSize: 24, fontWeight: 900, margin: 0 }}>{artist.name}</h4>
            </div>
          </div>

          {/* Biography Text Box */}
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 16, border: '1px solid rgba(255,255,255,0.05)' }}>
            <h5 style={{ color: '#b08850', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', margin: '0 0 10px', letterSpacing: '0.1em' }}>Biography</h5>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 1.6, margin: 0 }}>
              {artist.bio || `${artist.name} is a composer and artist on Beato.`}
            </p>
          </div>

          {/* Custom stats view */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {[
              { label: 'Followers', val: currentFollowers },
              { label: 'Listeners', val: currentMonthlyListeners },
              { label: 'Live Now', val: currentListeningNow }
            ].map((item) => (
              <div key={item.label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 12, border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                <p style={{ color: '#b08850', fontSize: 20, fontWeight: 900, margin: '0 0 4px' }}>{fmt(item.val)}</p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', margin: 0 }}>{item.label}</p>
              </div>
            ))}
          </div>

          {/* Social links */}
          {Object.values(artist.socialLinks || {}).some(Boolean) && (
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 16, border: '1px solid rgba(255,255,255,0.05)' }}>
              <p style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', margin: '0 0 12px', letterSpacing: '0.1em' }}>Official Links</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {artist.socialLinks?.instagram && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <AtSign size={14} color="rgba(255,255,255,0.4)" />
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', flex: 1 }}>{artist.socialLinks.instagram}</span>
                  </div>
                )}
                {artist.socialLinks?.website && (
                  <a href={`https://${artist.socialLinks.website}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', textDecoration: 'none' }}>
                    <Globe size={14} color="rgba(255,255,255,0.4)" />
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', flex: 1 }}>{artist.socialLinks.website}</span>
                    <ExternalLink size={12} color="rgba(255,255,255,0.2)" />
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────
const TABS = ['Overview', 'Popular', 'Albums', 'About'];

export default function ArtistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { allTracks } = useMusicStore();
  const { user, toggleFollowArtist } = useAuthStore();
  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayerStore();
  const mainRef = useRef<HTMLDivElement>(null);

  const [artist, setArtist] = useState<Artist | null>(null);
  const [dbTracks, setDbTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('Overview');
  const [initFollowed, setInitFollowed] = useState(false);
  const [live, setLive] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSort, setActiveSort] = useState('popular');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const menuRef = useRef<HTMLDivElement>(null);
  const [polledStats, setPolledStats] = useState<{
    followers: number;
    monthlyListeners: number;
    listeningNow: number;
  } | null>(null);

  const isMobile = useIsMobile(); // ⚡ shared single resize listener

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const r = await fetch(`/api/artist/${id}`);
        const d = await r.json();
        if (d.success && alive) { setArtist(d.artist); setDbTracks(d.dbTracks || []); }
      } finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, [id]);

  useEffect(() => {
    if (artist && user) setInitFollowed(!!user.followedArtists?.includes(artist.id));
  }, [artist?.id, user?.id]);

  // Poll real-time database-backed stats (Monthly listeners, Followers, Listening Now)
  useEffect(() => {
    if (!artist) return;

    const fetchLiveStats = async () => {
      try {
        const r = await fetch(`/api/artist/${artist.id}/live`);
        const data = await r.json();
        if (data.success && data.stats) {
          setPolledStats({
            followers: data.stats.followers,
            monthlyListeners: data.stats.monthlyListeners,
            listeningNow: data.stats.listeningNow,
          });
          setLive(data.stats.listeningNow);
        }
      } catch (err) {
        console.error('Error fetching live stats:', err);
      }
    };

    fetchLiveStats();
    const iv = setInterval(fetchLiveStats, 10000); // ⚡ 10s instead of 3.5s — reduces server load
    return () => clearInterval(iv);
  }, [artist?.id]);

  // Watch parent scroll for sticky header
  useEffect(() => {
    const el = mainRef.current?.closest('.app-main') as HTMLElement | null;
    if (!el) return;
    const handler = () => setScrolled(el.scrollTop > 300);
    el.addEventListener('scroll', handler);
    return () => el.removeEventListener('scroll', handler);
  }, [loading]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMoreMenu(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // ── loading state ──────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#0d0d0d', gap: 16 }}>
      <div style={{ width: 48, height: 48, borderRadius: '50%', border: '2px solid rgba(176, 136, 80,0.2)', borderTopColor: '#b08850', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, letterSpacing: 1 }}>Loading artist…</p>
    </div>
  );

  if (!artist) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#0d0d0d', gap: 16 }}>
      <MicVocal size={40} color="rgba(255,255,255,0.15)" />
      <p style={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>Artist not found</p>
      <Link href="/search" style={{ padding: '10px 24px', borderRadius: 100, background: '#b08850', color: '#000', fontWeight: 700, textDecoration: 'none', fontSize: 13 }}>Browse Artists</Link>
    </div>
  );

  // ── derived data ───────────────────────────────────────────────────────────
  const fromDb = dbTracks;
  const fromMock = allTracks.filter(t => t.artistId === artist.id && (!t.status || t.status === 'approved'));
  const artistTracks = [...fromDb, ...fromMock.filter(t => !fromDb.find(d => d.id === t.id))];
  const isCurrent = artistTracks.some(t => t.id === currentTrack?.id);
  const followed = !!user?.followedArtists?.includes(artist.id);
  
  // Real-time values
  const baseFollowers = polledStats ? polledStats.followers : artist.followers;
  const currentFollowers = followed === initFollowed ? baseFollowers : followed ? baseFollowers + 1 : Math.max(0, baseFollowers - 1);
  const currentMonthlyListeners = polledStats ? polledStats.monthlyListeners : artist.monthlyListeners;
  const currentListeningNow = polledStats ? polledStats.listeningNow : live;

  const doPlay = () => {
    if (!artistTracks.length) { toast.error('No songs available'); return; }
    isCurrent ? togglePlay() : playTrack(artistTracks[0], artistTracks.slice(1));
  };
  const doShuffle = () => {
    if (!artistTracks.length) { toast.error('No songs available'); return; }
    const s = [...artistTracks].sort(() => Math.random() - 0.5);
    playTrack(s[0], s.slice(1));
    toast.success('Shuffling!', { icon: '🔀' });
  };
  const doFollow = () => {
    if (!user) { toast.error('Please log in to follow'); return; }
    toggleFollowArtist(artist.id);
    toast.success(followed ? `Unfollowed ${artist.name}` : `Following ${artist.name}! 🎵`);
  };
  const doShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied!');
  };

  const hue = (artist.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) * 37) % 360;
  const accentColor = `hsl(${hue}, 55%, 45%)`;
  const G = '#b08850';

  // Construct a dynamic latestAlbum from tracks
  const tracksWithAlbums = artistTracks.filter(t => t.albumId && t.albumName);
  const latestAlbum = tracksWithAlbums.length > 0 ? {
    id: tracksWithAlbums[0].albumId,
    title: tracksWithAlbums[0].albumName,
    coverImage: tracksWithAlbums[0].coverImage,
  } : null;

  const filteredTracks = artistTracks.filter(t =>
    !searchQuery ||
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.artistName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const ITEMS_PER_PAGE = 20;
  const totalPages = Math.max(1, Math.ceil(filteredTracks.length / ITEMS_PER_PAGE));
  const paginatedTracks = filteredTracks.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);


  const SORT_OPTS = [
    { v: 'popular', l: 'Popular' },
    { v: 'az',      l: 'Title (A → Z)' },
    { v: 'recent',  l: 'Date Added' },
    { v: 'duration',l: 'Duration' },
  ];

  if (isMobile) {
    return (
      <ArtistMobileView
        artist={artist}
        artistTracks={artistTracks}
        latestAlbum={latestAlbum}
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        playTrack={playTrack}
        togglePlay={togglePlay}
        followed={followed}
        doFollow={doFollow}
        doShare={doShare}
        doPlay={doPlay}
        doShuffle={doShuffle}
        currentMonthlyListeners={currentMonthlyListeners}
        currentFollowers={currentFollowers}
        currentListeningNow={currentListeningNow}
        user={user}
      />
    );
  }

  return (
    <div ref={mainRef} className="artist-themed-container" style={{ minHeight: '100%', background: 'var(--color-ss-bg, #fbf9f5)', position: 'relative' }}>
      <style>{`
        .artist-themed-container {
          background-color: var(--color-ss-bg, #fbf9f5) !important;
          color: var(--color-ss-text-primary, #221a15) !important;
        }
        .artist-themed-container h1:not(.text-white-force),
        .artist-themed-container h2:not(.text-white-force),
        .artist-themed-container h3:not(.text-white-force),
        .artist-themed-container h4:not(.text-white-force) {
          color: var(--color-ss-text-primary, #221a15) !important;
        }
        .artist-themed-container p:not(.text-white-force),
        .artist-themed-container span:not(.text-white-force),
        .artist-themed-container label:not(.text-white-force) {
          color: var(--color-ss-text-primary, #221a15) !important;
        }
        .artist-themed-container .text-ss-text-muted,
        .artist-themed-container p[style*="color: rgba(255,255,255,0.5)"],
        .artist-themed-container p[style*="color: rgba(255,255,255,0.7)"],
        .artist-themed-container p[style*="color: rgb(163, 163, 163)"],
        .artist-themed-container span[style*="color: rgb(163, 163, 163)"],
        .artist-themed-container p[style*="color: #a3a3a3"],
        .artist-themed-container span[style*="color: #a3a3a3"] {
          color: var(--color-ss-text-muted, #87786c) !important;
        }
        .artist-themed-container div[style*="background: rgba(255, 255, 255, 0.04)"],
        .artist-themed-container div[style*="background: rgba(255,255,255,0.04)"],
        .artist-themed-container div[style*="background: rgba(255, 255, 255, 0.03)"],
        .artist-themed-container div[style*="background: rgba(255,255,255,0.03)"],
        .artist-themed-container div[style*="background: rgba(255, 255, 255, 0.02)"],
        .artist-themed-container div[style*="background: rgba(255,255,255,0.02)"] {
          background: var(--color-ss-surface, #f4eede) !important;
          border-color: var(--color-ss-border, rgba(43, 34, 26, 0.08)) !important;
          box-shadow: none !important;
        }
        .artist-themed-container button:not(.play-btn-force):not(.text-white-force):not(.premium-follow-btn) {
          color: var(--color-ss-text-primary, #221a15) !important;
          border-color: rgba(43, 34, 26, 0.2) !important;
        }
        .artist-themed-container div[style*="background: #0d0d0d"],
        .artist-themed-container div[style*="background: rgb(13, 13, 13)"] {
          background: var(--color-ss-bg, #fbf9f5) !important;
        }
        .artist-themed-container div[style*="border-bottom: 1px solid rgba(255,255,255,0.05)"],
        .artist-themed-container div[style*="border-bottom: 1px solid rgba(255,255,255,0.08)"],
        .artist-themed-container div[style*="border-bottom: 1px solid rgba(255,255,255,0.07)"] {
          border-bottom: 1px solid var(--color-ss-border, rgba(43, 34, 26, 0.08)) !important;
        }
        .artist-themed-container div[style*="border-top: 1px solid rgba(255,255,255,0.08)"],
        .artist-themed-container div[style*="border-top: 1px solid rgba(255,255,255,0.07)"] {
          border-top: 1px solid var(--color-ss-border, rgba(43, 34, 26, 0.08)) !important;
        }
        .artist-themed-container div[style*="border-bottom: 2px solid #fff"] {
          border-bottom: 2px solid var(--color-ss-primary, #b08850) !important;
        }

        /* ── Redesigned UI Styles ── */
        .premium-stats-card {
          background: rgba(255, 255, 255, 0.72) !important;
          backdrop-filter: blur(16px) !important;
          border: 1px solid rgba(43, 34, 26, 0.06) !important;
          border-radius: 20px !important;
          padding: 20px 22px !important;
          position: relative !important;
          overflow: hidden !important;
          box-shadow: 0 4px 20px rgba(43, 34, 26, 0.02), 0 1px 4px rgba(43, 34, 26, 0.01) !important;
          transition: all 0.35s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
          cursor: pointer !important;
        }
        .premium-stats-card:hover {
          transform: translateY(-4px) !important;
          background: rgba(255, 255, 255, 0.85) !important;
          border-color: rgba(176, 136, 80, 0.25) !important;
          box-shadow: 0 12px 28px rgba(43, 34, 26, 0.05), 0 2px 8px rgba(43, 34, 26, 0.02) !important;
        }
        .premium-stats-card.pulse-up {
          border-color: rgba(74, 222, 128, 0.4) !important;
          box-shadow: 0 0 15px rgba(74, 222, 128, 0.12) !important;
        }
        .premium-stats-card.pulse-down {
          border-color: rgba(239, 68, 68, 0.4) !important;
          box-shadow: 0 0 15px rgba(239, 68, 68, 0.12) !important;
        }
        .premium-stats-card .stats-icon-container {
          width: 36px !important;
          height: 36px !important;
          border-radius: 12px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          color: var(--card-base-color) !important;
          background: var(--card-accent-tint) !important;
          transition: all 0.3s ease !important;
        }
        .premium-stats-card .stats-label-text {
          color: var(--color-ss-text-muted, #87786c) !important;
          font-size: 9px !important;
          font-weight: 800 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.14em !important;
        }
        .premium-stats-card .stats-value-text {
          color: var(--card-accent-color) !important;
          transition: color 0.3s !important;
        }
        .premium-follow-btn {
          height: 32px !important;
          padding: 0 18px !important;
          border-radius: 9999px !important;
          font-size: 13px !important;
          font-weight: 700 !important;
          transition: all 0.3s ease !important;
          cursor: pointer !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 6px !important;
        }
        .premium-follow-btn.unfollowed {
          background: transparent !important;
          border: 1.5px solid var(--color-ss-primary, #b08850) !important;
          color: var(--color-ss-primary, #b08850) !important;
        }
        .premium-follow-btn.unfollowed:hover {
          background: rgba(176, 136, 80, 0.08) !important;
          transform: scale(1.03) !important;
        }
        .premium-follow-btn.followed {
          background: var(--color-ss-primary, #b08850) !important;
          border: 1.5px solid var(--color-ss-primary, #b08850) !important;
          color: #ffffff !important;
          box-shadow: 0 4px 12px rgba(176, 136, 80, 0.25) !important;
        }
        .premium-follow-btn.followed:hover {
          background: #9d7641 !important;
          border-color: #9d7641 !important;
          transform: scale(1.03) !important;
        }
        .premium-promo-banner {
          background: rgba(255, 255, 255, 0.6) !important;
          backdrop-filter: blur(12px) !important;
          border: 1px solid rgba(43, 34, 26, 0.05) !important;
          border-radius: 12px !important;
          padding: 10px 16px !important;
          box-shadow: 0 4px 12px rgba(43, 34, 26, 0.01) !important;
          transition: all 0.3s ease !important;
          cursor: pointer !important;
        }
        .premium-promo-banner:hover {
          background: rgba(255, 255, 255, 0.85) !important;
          border-color: rgba(176, 136, 80, 0.2) !important;
          box-shadow: 0 8px 20px rgba(43, 34, 26, 0.04) !important;
          transform: translateY(-1px) !important;
        }
        .premium-tracks-container {
          background: rgba(255, 255, 255, 0.5) !important;
          backdrop-filter: blur(12px) !important;
          border: 1px solid rgba(43, 34, 26, 0.04) !important;
          border-radius: 20px !important;
          overflow: hidden !important;
          box-shadow: 0 4px 20px rgba(43, 34, 26, 0.01) !important;
        }
        .premium-track-row {
          background: transparent !important;
          transition: all 0.2s ease !important;
        }
        .premium-track-row:hover {
          background: rgba(255, 255, 255, 0.45) !important;
        }
        .premium-track-row.active {
          background: rgba(176, 136, 80, 0.08) !important;
        }
        .premium-avatar-container {
          border-radius: 50% !important;
          overflow: hidden !important;
          box-shadow: 0 12px 40px rgba(0,0,0,0.65) !important;
          transition: all 0.3s ease !important;
        }
        .premium-avatar-container:hover {
          transform: scale(1.02) rotate(2deg) !important;
        }
        .premium-avatar-container img {
          border-radius: 50% !important;
          object-fit: cover !important;
        }
        .stats-sparkline path {
          transition: stroke 0.3s, fill 0.3s;
        }

        /* Active track styling */
        .premium-track-row.active p {
          color: var(--color-ss-primary, #b08850) !important;
        }
        
        /* Tabs navigation */
        .artist-themed-container .tabs-btn {
          color: var(--color-ss-text-muted, #87786c) !important;
          font-weight: 500 !important;
          opacity: 0.8 !important;
        }
        .artist-themed-container .tabs-btn.active {
          color: var(--color-ss-text-primary, #221a15) !important;
          font-weight: 700 !important;
          opacity: 1 !important;
        }
        .artist-themed-container .tabs-btn:hover:not(.active) {
          color: var(--color-ss-text-primary, #221a15) !important;
          opacity: 1 !important;
        }

        /* Queue button */
        .premium-queue-btn {
          background: rgba(43, 34, 26, 0.03) !important;
          border: 1px solid rgba(43, 34, 26, 0.08) !important;
          color: var(--color-ss-text-muted, #87786c) !important;
          border-radius: 14px !important;
          padding: 14px 20px !important;
          width: 100% !important;
          font-weight: 700 !important;
          font-size: 12px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.1em !important;
          transition: all 0.2s ease !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 8px !important;
          cursor: pointer !important;
        }
        .premium-queue-btn:hover {
          background: rgba(176, 136, 80, 0.08) !important;
          border-color: rgba(176, 136, 80, 0.25) !important;
          color: var(--color-ss-primary, #b08850) !important;
        }

        /* Social Link cards */
        .premium-social-link {
          display: flex !important;
          align-items: center !important;
          gap: 12px !important;
          padding: 12px 16px !important;
          border-radius: 12px !important;
          background: rgba(43, 34, 26, 0.02) !important;
          border: 1px solid rgba(43, 34, 26, 0.05) !important;
          text-decoration: none !important;
          transition: all 0.2s ease !important;
          cursor: pointer !important;
        }
        .premium-social-link:hover {
          background: rgba(176, 136, 80, 0.06) !important;
          border-color: rgba(176, 136, 80, 0.2) !important;
        }
        .premium-social-link span {
          color: var(--color-ss-text-primary, #221a15) !important;
          font-weight: 600 !important;
          font-size: 13px !important;
          flex: 1 !important;
        }
        .premium-social-link svg {
          color: var(--color-ss-text-muted, #87786c) !important;
        }

        /* Empty states */
        .premium-empty-state {
          background: rgba(255, 255, 255, 0.4) !important;
          backdrop-filter: blur(8px) !important;
          border: 1px solid rgba(43, 34, 26, 0.05) !important;
          border-radius: 18px !important;
          box-shadow: 0 4px 12px rgba(43, 34, 26, 0.01) !important;
          padding: 50px 24px !important;
        }
        .premium-empty-state p {
          color: var(--color-ss-text-primary, #221a15) !important;
        }
        .premium-empty-state p.muted {
          color: var(--color-ss-text-muted, #87786c) !important;
        }
        .premium-empty-state .icon-wrapper {
          background: rgba(43, 34, 26, 0.03) !important;
          color: var(--color-ss-text-muted, #87786c) !important;
        }
      `}</style>

      {/* ════════════════════════════════════════════
          HERO (Playlist Style)
      ════════════════════════════════════════════ */}
      <div className="playlist-hero-container" style={{ position: 'relative', overflow: 'hidden', height: 380, width: '100%', background: '#1e1610' }}>
        
        {/* Cover Photo Banner */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          {artist.coverImage || artist.image ? (
            <img 
              src={artist.coverImage || artist.image} 
              alt={artist.name} 
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'cover',
                opacity: 0.65
              }} 
            />
          ) : (
            <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, hsl(${hue},60%,12%), #b08850)`, opacity: 0.75 }} />
          )}
          
          {/* Linear Gradient Overlay for deep contrast */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, rgba(43,34,26,0.15) 0%, rgba(43,34,26,0.85) 100%)'
          }} />
        </div>

        {/* Top bar */}
        <div style={{ position: 'relative', zIndex: 10 }}>
          <TopBar transparent />
        </div>

        {/* Hero Details Overlay */}
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
            {artist.verified ? (
              <>
                <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#b08850', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', flexShrink: 0 }}>
                  <Check size={10} strokeWidth={4} color="black" />
                </div>
                <span className="text-white-force" style={{ fontSize: 12, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-inter), sans-serif', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Verified Artist
                </span>
              </>
            ) : (
              <span className="text-white-force" style={{ fontSize: 12, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-inter), sans-serif', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Artist
              </span>
            )}
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 100, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', marginLeft: 8 }}>
              <Flame size={10} color="#f59e0b" />
              <span className="text-white-force" style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{fmt(currentListeningNow)} listening now</span>
            </div>
          </div>

          {/* Artist Name */}
          <h1 className="text-white-force" style={{ 
            fontFamily: 'var(--font-outfit), sans-serif', 
            fontSize: 64, 
            fontWeight: 900, 
            letterSpacing: '-0.02em', 
            margin: '0 0 4px 0',
            color: '#fff',
            lineHeight: 1.1,
            textShadow: '0 2px 16px rgba(0,0,0,0.8)'
          }}>
            {artist.name}
          </h1>

          {/* Stats Row */}
          <div className="text-white-force" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 8, 
            fontSize: 14, 
            color: '#d1d5db', 
            fontWeight: 600,
            textShadow: '0 1px 4px rgba(0,0,0,0.6)'
          }}>
            <span className="text-white-force">{fmt(currentMonthlyListeners)} monthly listeners</span>
            <span className="text-white-force">•</span>
            <span className="text-white-force">{fmt(currentFollowers)} followers</span>
          </div>
        </div>
      </div>

      {/* ── Controls Bar ───────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        style={{ 
          background: 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '32px 32px 24px 32px',
        }}
      >
        {/* Left section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          {/* Play Button */}
          <motion.button
            whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
            onClick={doPlay}
            style={{ 
              width: 56, height: 56, borderRadius: '50%', background: G, border: 'none', cursor: 'pointer', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 6px 24px ${G}50`, flexShrink: 0
            }}
          >
            {isCurrent && isPlaying
              ? <Pause size={24} fill="black" color="black" />
              : <Play size={24} fill="black" color="black" style={{ marginLeft: 2 }} />}
          </motion.button>

          {/* Shuffle */}
          <motion.button 
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={doShuffle}
            style={{
              width: 32, height: 32, borderRadius: '50%', background: 'transparent',
              border: '1px solid var(--color-ss-border, rgba(43, 34, 26, 0.08))', color: 'var(--color-ss-text-primary, #221a15)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', flexShrink: 0
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-ss-surface, #f4eede)'; e.currentTarget.style.borderColor = 'var(--color-ss-border, rgba(43, 34, 26, 0.08))'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--color-ss-border, rgba(43, 34, 26, 0.08))'; }}
          >
            <Shuffle size={14} />
          </motion.button>

          {/* Follow Button */}
          <motion.button 
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={doFollow}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 20px', borderRadius: 20,
              background: followed ? 'var(--color-ss-primary, #b08850)' : 'var(--color-ss-surface, #f4eede)',
              border: followed ? 'none' : '1px solid var(--color-ss-border, rgba(43, 34, 26, 0.08))',
              color: followed ? '#fff' : 'var(--color-ss-text-primary, #221a15)',
              fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-inter), sans-serif', transition: 'all 0.2s', flexShrink: 0
            }}
          >
            {followed ? <Check size={14} color="white" strokeWidth={3} /> : <Plus size={14} />}
            <span>{followed ? 'Following' : 'Follow'}</span>
          </motion.button>

          {/* Share/More */}
          <div ref={menuRef} style={{ position: 'relative', flexShrink: 0 }}>
            <motion.button 
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              style={{
                width: 32, height: 32, borderRadius: '50%', background: 'transparent',
                border: '1px solid var(--color-ss-border, rgba(43, 34, 26, 0.08))', color: 'var(--color-ss-text-primary, #221a15)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-ss-surface, #f4eede)'; e.currentTarget.style.borderColor = 'var(--color-ss-border, rgba(43, 34, 26, 0.08))'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--color-ss-border, rgba(43, 34, 26, 0.08))'; }}
            >
              <MoreHorizontal size={16} />
            </motion.button>
            <AnimatePresence>
              {showMoreMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.92, y: -6 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.92, y: -6 }}
                  style={{ position: 'absolute', left: 0, top: 44, zIndex: 200, background: '#1e1e1e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, overflow: 'hidden', minWidth: 200, boxShadow: '0 20px 60px rgba(0,0,0,0.7)' }}
                >
                  {[
                    { l: 'Copy Link', i: Copy, fn: doShare },
                    { l: 'Go to Artist Radio', i: Radio, fn: () => toast('Opening radio...', { icon: '📻' }) },
                  ].map(item => (
                    <button key={item.l} onClick={() => { setShowMoreMenu(false); item.fn(); }}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', background: 'none', border: 'none', color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer', textAlign: 'left', transition: 'background 0.1s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <item.i size={14} /> {item.l}
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
            { label: `${artistTracks.length} Songs`, icon: Music2, color: G },
            { label: `${artist.genres.length || 0} Genres`, icon: Star, color: '#f59e0b' },
          ].map(({ label, icon: Icon, color }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 14px', borderRadius: 20, background: 'rgba(43, 34, 26, 0.03)', border: '1px solid rgba(43, 34, 26, 0.06)' }}>
              <Icon size={13} color={color} />
              <span className="text-ss-text-muted" style={{ fontSize: 12, fontWeight: 600 }}>{label}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Search + Sort Toolbar ─────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 32px 20px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
          {/* Search */}
          <div style={{ position: 'relative', width: 280 }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-ss-text-muted, #87786c)', pointerEvents: 'none' }} />
            <input value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }} placeholder="Search tracks…"
              style={{ width: '100%', paddingLeft: 36, paddingRight: searchQuery ? 32 : 12, paddingTop: 9, paddingBottom: 9, background: 'rgba(43, 34, 26, 0.04)', border: searchQuery ? `1px solid ${G}50` : '1px solid rgba(43, 34, 26, 0.08)', borderRadius: 10, color: 'var(--color-ss-text-primary, #221a15)', fontSize: 13, outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box' }}
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(''); setCurrentPage(1); }} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--color-ss-text-muted, #87786c)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><X size={14} /></button>
            )}
          </div>

          {/* Sort */}
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowSortMenu(!showSortMenu)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', borderRadius: 10, background: 'rgba(43, 34, 26, 0.04)', border: '1px solid rgba(43, 34, 26, 0.08)', color: 'var(--color-ss-text-muted, #87786c)', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(43, 34, 26, 0.08)'; e.currentTarget.style.color = 'var(--color-ss-text-primary, #221a15)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(43, 34, 26, 0.04)'; e.currentTarget.style.color = 'var(--color-ss-text-muted, #87786c)'; }}
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
        <span className="text-ss-text-muted" style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap' }}>
          {filteredTracks.length} {filteredTracks.length !== artistTracks.length ? `of ${artistTracks.length} ` : ''}tracks
        </span>
      </div>

      {/* ── Track Table ─────────────────────────────────────────────────── */}
      <div style={{ padding: '0 32px' }}>
        {/* Table header */}
        <div className="track-list-header" style={{ display: 'grid', gridTemplateColumns: '32px 48px 1fr auto 80px 52px', gap: 12, padding: '8px 14px 10px', color: 'var(--color-ss-text-muted, #87786c)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid var(--color-ss-border, rgba(43, 34, 26, 0.08))', marginBottom: 4 }}>
          <span style={{ textAlign: 'center' }}>#</span>
          <span />
          <span>Title</span>
          <span />
          <span style={{ textAlign: 'right' }}>Plays</span>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {paginatedTracks.map((track, i) => (
                <motion.div key={track.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}>
                  <TrackRow key={track.id} track={track} idx={(currentPage - 1) * ITEMS_PER_PAGE + i}
                    active={currentTrack?.id === track.id} playing={isPlaying}
                    onPlay={() => currentTrack?.id === track.id ? togglePlay() : playTrack(track, filteredTracks.filter(x => x.id !== track.id))}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 32, marginBottom: 24 }}>
            <button 
              disabled={currentPage === 1} 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              style={{
                padding: '8px 16px', borderRadius: 100, fontSize: 13, fontWeight: 600, cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                background: currentPage === 1 ? 'rgba(43, 34, 26, 0.02)' : 'rgba(43, 34, 26, 0.05)',
                color: currentPage === 1 ? 'rgba(43, 34, 26, 0.3)' : 'var(--color-ss-text-primary, #221a15)',
                border: '1px solid var(--color-ss-border, rgba(43, 34, 26, 0.08))', transition: 'all 0.2s'
              }}
            >
              Previous
            </button>
            <span className="text-ss-text-muted" style={{ fontSize: 13, fontWeight: 600 }}>
              Page {currentPage} of {totalPages}
            </span>
            <button 
              disabled={currentPage === totalPages} 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              style={{
                padding: '8px 16px', borderRadius: 100, fontSize: 13, fontWeight: 600, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                background: currentPage === totalPages ? 'rgba(43, 34, 26, 0.02)' : 'rgba(43, 34, 26, 0.05)',
                color: currentPage === totalPages ? 'rgba(43, 34, 26, 0.3)' : 'var(--color-ss-text-primary, #221a15)',
                border: '1px solid var(--color-ss-border, rgba(43, 34, 26, 0.08))', transition: 'all 0.2s'
              }}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* ── TABS ── */}
      <div className="px-4 md:px-8 pt-12 border-b border-white/5" style={{ marginTop: 24, borderTop: '1px solid var(--color-ss-border, rgba(43, 34, 26, 0.08))' }}>
        <div className="tabs-container" style={{ display: 'flex', gap: 0 }}>
          {['Albums', 'About'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`tabs-btn ${tab === t ? 'active' : ''}`}
              style={{
                position: 'relative', padding: '0 20px 14px',
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 13,
                transition: 'color 0.15s',
                letterSpacing: 0.3,
              }}
            >
              {t}
              {tab === t && (
                <motion.div layoutId="tabUnderline"
                  style={{ position: 'absolute', bottom: -1, left: 20, right: 20, height: 2, background: '#b08850', borderRadius: 2 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════════════
          TAB CONTENT
      ════════════════════════════════════════════ */}
      <div className="px-4 md:px-8 py-6 md:py-8 pb-24">
        <AnimatePresence mode="wait">

          {/* ── ALBUMS ──────────────────────────────── */}
          {tab === 'Albums' && (
            <motion.div key="alb"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            >
              <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 20, fontWeight: 800, color: 'var(--color-ss-text-primary, #221a15)', marginBottom: 24 }}>Discography</h2>
              <div className="premium-empty-state" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', textAlign: 'center', gap: 10 }}>
                <div className="icon-wrapper" style={{ width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Disc size={20} style={{ animation: 'spin 8s linear infinite' }} />
                </div>
                <p style={{ fontWeight: 700, fontSize: 16, margin: 0 }}>No Albums Yet</p>
                <p className="muted" style={{ fontSize: 12, margin: 0 }}>Albums will appear here when published.</p>
              </div>
            </motion.div>
          )}

          {/* ── ABOUT ───────────────────────────────── */}
          {tab === 'About' && (
            <motion.div key="ab"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              style={{ maxWidth: 680, display: 'flex', flexDirection: 'column', gap: 20 }}
            >
              {/* Cover */}
              <div style={{ position: 'relative', height: 220, borderRadius: 18, overflow: 'hidden' }}>
                {artist.coverImage || artist.image ? (
                  <Image src={artist.coverImage || artist.image} alt="" fill style={{ objectFit: 'cover', filter: 'brightness(0.4)' }} />
                ) : (
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #1e1b4b, #311042)' }} />
                )}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(13,13,13,0.95) 0%, transparent 55%)' }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 24px' }}>
                  <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, color: '#fff', fontSize: 28 }}>{artist.name}</h2>
                </div>
              </div>

              {/* Bio card */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, padding: '22px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <Mic2 size={14} color="#b08850" />
                  <span className="text-ss-text-muted" style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em' }}>About the Artist</span>
                </div>
                <p className="text-ss-text-muted" style={{ fontSize: 14, lineHeight: 1.75, fontWeight: 300 }}>
                  {artist.bio || `${artist.name} is a composing creator delivering rich melodies and digital releases to listeners globally on Beato.`}
                </p>
              </div>

              {/* Stats 3-col */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {[
                  { label: 'Followers', v: currentFollowers, color: '#b08850' },
                  { label: 'Monthly Listeners', v: currentMonthlyListeners, color: '#a78bfa' },
                  { label: 'Listening Now', v: currentListeningNow, color: '#34d399' },
                ].map(({ label, v, color }) => (
                  <div key={label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 14, padding: '18px 20px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: -16, right: -16, width: 70, height: 70, borderRadius: '50%', background: color, opacity: 0.12, filter: 'blur(20px)' }} />
                    <p className="text-white-force" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 28, color, lineHeight: 1, marginBottom: 6 }}><CountUp to={v} /></p>
                    <p className="text-ss-text-muted" style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em' }}>{label}</p>
                  </div>
                ))}
              </div>

              {/* Genres */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, padding: '18px 22px' }}>
                <p className="text-ss-text-muted" style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 14 }}>Genres</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {artist.genres.map(g => (
                    <span key={g} style={{ padding: '8px 18px', borderRadius: 100, background: 'rgba(176, 136, 80,0.1)', border: '1px solid rgba(176, 136, 80,0.22)', color: '#b08850', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{g}</span>
                  ))}
                </div>
              </div>

              {/* Social */}
              {Object.values(artist.socialLinks || {}).some(Boolean) && (
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, padding: '18px 22px' }}>
                  <p className="text-ss-text-muted" style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 14 }}>Official Links</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {artist.socialLinks?.instagram && (
                      <div className="premium-social-link">
                        <AtSign size={15} />
                        <span>{artist.socialLinks.instagram}</span>
                        <ExternalLink size={12} />
                      </div>
                    )}
                    {artist.socialLinks?.website && (
                      <a href={`https://${artist.socialLinks.website}`} target="_blank" rel="noopener noreferrer" className="premium-social-link">
                        <Globe size={15} />
                        <span>{artist.socialLinks.website}</span>
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* CSS for ping animation */}
      <style>{`
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
      `}</style>
    </div>
  );
}