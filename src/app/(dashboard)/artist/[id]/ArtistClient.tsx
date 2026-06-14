'use client';

import { use, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Pause, UserCheck, UserPlus, Share2,
  Music, CheckCircle2, TrendingUp, Headphones,
  Clock, Shuffle, ListMusic, Users, MicVocal,
  AtSign, Hash, Globe, Heart, ExternalLink,
  Disc, Mic2, ChevronRight, Flame, Radio, BarChart3,
  MoreHorizontal, MoreVertical, ArrowLeft
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, type: 'spring', stiffness: 220, damping: 22 }}
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: pulse === 'up'
          ? `1px solid rgba(74, 222, 128, 0.4)`
          : pulse === 'down'
          ? `1px solid rgba(239, 68, 68, 0.4)`
          : '1px solid rgba(255,255,255,0.06)',
        borderRadius: 16,
        padding: '20px 22px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: pulse === 'up'
          ? '0 0 15px rgba(74, 222, 128, 0.15)'
          : pulse === 'down'
          ? '0 0 15px rgba(239, 68, 68, 0.15)'
          : 'none',
        transition: 'border-color 0.3s, box-shadow 0.3s, background 0.3s',
      }}
      whileHover={{ borderColor: `${color}30`, background: 'rgba(255,255,255,0.06)' }}
    >
      {/* Background glow */}
      <div style={{
        position: 'absolute',
        top: -20,
        right: -20,
        width: 100,
        height: 100,
        borderRadius: '50%',
        background: pulse === 'up' ? '#4ade80' : pulse === 'down' ? '#ef4444' : color,
        opacity: pulse ? 0.18 : 0.10,
        filter: 'blur(30px)',
        pointerEvents: 'none',
        transition: 'background 0.3s, opacity 0.3s',
      }} />

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          display: 'flex',
          alignItems: 'center',
          color,
          justifyContent: 'center',
          background: `${color}1a`,
        }}>
          {icon}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {isLive && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
              padding: '2px 6px',
              borderRadius: 4,
              background: 'rgba(74, 222, 128, 0.1)',
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
          <span style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.14em' }}>
            {label}
          </span>
        </div>
      </div>

      {/* Number and activity trend */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
        <p style={{
          fontFamily: 'Outfit, sans-serif',
          fontWeight: 900,
          fontSize: 38,
          lineHeight: 1,
          color: pulse === 'up' ? '#4ade80' : pulse === 'down' ? '#ef4444' : color,
          letterSpacing: -1,
          transition: 'color 0.3s',
        }}>
          <CountUp to={value} />
        </p>

        {/* Change Indicator */}
        <AnimatePresence>
          {pulse && (
            <motion.span
              initial={{ opacity: 0, y: 4, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.8 }}
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: pulse === 'up' ? '#4ade80' : '#ef4444',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 2,
              }}
            >
              {pulse === 'up' ? '▲' : '▼'} {Math.abs(diff).toLocaleString()}
            </motion.span>
          )}
        </AnimatePresence>
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
          background: '#1db954', borderRadius: 1,
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
      className="grid grid-cols-[24px_40px_1fr_auto_40px] md:grid-cols-[32px_48px_1fr_auto_80px_52px] gap-2.5 md:gap-3 px-3 md:px-4 py-2 md:py-2.5 items-center rounded-lg cursor-pointer transition-colors"
      style={{
        background: active ? 'rgba(29, 185, 84,0.07)' : hov ? 'rgba(255,255,255,0.05)' : 'transparent',
      }}
    >
      {/* Index / play indicator */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {hov || (active && playing) ? (
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1db954', display: 'flex', alignItems: 'center' }}>
            {active && playing ? <WaveBar /> : <Play size={14} fill="#1db954" color="#1db954" style={{ transform: 'translateX(1px)' }} />}
          </button>
        ) : (
          <span style={{ fontSize: 12, fontWeight: 700, color: active ? '#1db954' : 'rgba(255,255,255,0.25)', fontVariantNumeric: 'tabular-nums' }}>
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
        <p style={{ color: active ? '#1db954' : '#fff', fontSize: 15, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>
          {track.title}
        </p>
        <p className="block md:hidden text-white/50 text-[12px] mt-0.5">
          {track.plays.toLocaleString()}
        </p>
        <p className="hidden md:block text-white/30 text-[11px] mt-0.5 overflow-hidden text-ellipsis whitespace-nowrap">
          {track.albumName || 'Single'}
        </p>
      </div>

      {/* Like */}
      <button
        onClick={e => { e.stopPropagation(); toggleLikeSong(track.id); }}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: liked ? '#1db954' : 'rgba(255,255,255,0.2)',
          display: 'flex', alignItems: 'center',
          opacity: hov || liked ? 1 : 0,
          transition: 'opacity 0.15s, color 0.15s',
          padding: 4,
        }}
      >
        <Heart size={14} fill={liked ? '#1db954' : 'none'} />
      </button>

      {/* Plays (Desktop only) */}
      <span className="hidden md:inline text-[11px] text-white/25 text-right tabular-nums">
        {track.plays >= 1_000_000 ? `${(track.plays / 1_000_000).toFixed(1)}M` : track.plays.toLocaleString()}
      </span>

      {/* Duration (Desktop only) / More (Mobile only) */}
      <span className="hidden md:inline text-[11px] text-white/30 text-right tabular-nums">
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
  const [scrollTop, setScrollTop] = useState(0);

  useEffect(() => {
    const el = document.querySelector('.app-main');
    if (!el) return;
    const handler = () => {
      setScrollTop(el.scrollTop);
    };
    el.addEventListener('scroll', handler, { passive: true });
    handler();
    return () => el.removeEventListener('scroll', handler);
  }, []);

  // Color theme accent
  const hue = (artist.id.split('').reduce((a: number, c: string) => a + c.charCodeAt(0), 0) * 37) % 360;

  return (
    <div style={{ minHeight: '100vh', background: '#0d0d0d', color: '#fff', fontFamily: 'Inter, sans-serif', paddingBottom: 120 }}>
      {/* Sticky/Fixed Mobile Header */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        paddingLeft: 16,
        paddingRight: 16,
        paddingTop: 'calc(env(safe-area-inset-top, 24px) + 12px)',
        paddingBottom: '12px',
        background: scrollTop > 150 ? '#0d0d0d' : 'transparent',
        borderBottom: scrollTop > 150 ? '1px solid rgba(255,255,255,0.05)' : '1px solid transparent',
        transition: 'background 0.2s, border-bottom 0.2s',
      }}>
        <button onClick={() => router.back()} style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: 'none',
          color: '#fff',
          cursor: 'pointer'
        }}>
          <ArrowLeft size={18} color="#fff" />
        </button>
        {scrollTop > 150 && (
          <h1 style={{
            fontFamily: 'Outfit, sans-serif',
            fontSize: 18,
            fontWeight: 800,
            color: '#fff',
            margin: 0,
          }}>
            {artist.name}
          </h1>
        )}
      </div>

      {/* ── HERO BANNER ── */}
      <div style={{ position: 'relative', height: 320, overflow: 'hidden' }}>

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
                background: '#1db954', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center'
              }}>
                <CheckCircle2 size={10} color="black" strokeWidth={4} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>Verified by Spotify</span>
            </div>
          )}
          
          <h1 style={{
            fontFamily: 'Outfit, sans-serif',
            fontSize: 38,
            fontWeight: 900,
            color: '#fff',
            margin: '2px 0 4px',
            lineHeight: 1,
            letterSpacing: '-1px',
            textShadow: '0 2px 10px rgba(0,0,0,0.8)'
          }}>{artist.name}</h1>
          
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 600, margin: 0, textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>
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
        background: '#0d0d0d'
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
            <Shuffle size={20} color="#1db954" />
          </button>

          {/* Solid Green Play Button */}
          <button 
            onClick={doPlay}
            style={{
              width: 50,
              height: 50,
              borderRadius: '50%',
              background: '#1db954',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(29, 185, 84,0.4)'
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
                background: '#1db954'
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
                              <div key={i} style={{ width: 2, background: '#1db954', borderRadius: 1, height: `${4 + i * 2}px`, animation: `waveformH ${0.5 + i * 0.15}s ease-in-out infinite` }} />
                            ))}
                          </div>
                        ) : (
                          <span style={{ fontSize: 13, fontWeight: 700, color: isTrackActive ? '#1db954' : 'rgba(255,255,255,0.4)' }}>
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
                          color: isTrackActive ? '#1db954' : '#fff',
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
                        <div style={{ color: '#1db954', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ 
                            width: 16, 
                            height: 16, 
                            borderRadius: '50%', 
                            background: '#1db954', 
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
            <h5 style={{ color: '#1db954', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', margin: '0 0 10px', letterSpacing: '0.1em' }}>Biography</h5>
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
                <p style={{ color: '#1db954', fontSize: 20, fontWeight: 900, margin: '0 0 4px' }}>{fmt(item.val)}</p>
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
  const [polledStats, setPolledStats] = useState<{
    followers: number;
    monthlyListeners: number;
    listeningNow: number;
  } | null>(null);

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
    const iv = setInterval(fetchLiveStats, 3500);
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

  // ── loading state ──────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#0d0d0d', gap: 16 }}>
      <div style={{ width: 48, height: 48, borderRadius: '50%', border: '2px solid rgba(29, 185, 84,0.2)', borderTopColor: '#1db954', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, letterSpacing: 1 }}>Loading artist…</p>
    </div>
  );

  if (!artist) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#0d0d0d', gap: 16 }}>
      <MicVocal size={40} color="rgba(255,255,255,0.15)" />
      <p style={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>Artist not found</p>
      <Link href="/search" style={{ padding: '10px 24px', borderRadius: 100, background: '#1db954', color: '#000', fontWeight: 700, textDecoration: 'none', fontSize: 13 }}>Browse Artists</Link>
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

  // ── Build a gradient accent from artist ID ─────────────────────────────────
  const hue = (artist.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) * 37) % 360;
  const accentColor = `hsl(${hue}, 55%, 45%)`;

  // Construct a dynamic latestAlbum from tracks
  const tracksWithAlbums = artistTracks.filter(t => t.albumId && t.albumName);
  const latestAlbum = tracksWithAlbums.length > 0 ? {
    id: tracksWithAlbums[0].albumId,
    title: tracksWithAlbums[0].albumName,
    coverImage: tracksWithAlbums[0].coverImage,
  } : null;

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
    <div ref={mainRef} style={{ minHeight: '100%', background: '#0d0d0d', position: 'relative' }}>

      {/* ════════════════════════════════════════════
          HERO
      ════════════════════════════════════════════ */}
      <div style={{ position: 'relative', height: 380, overflow: 'hidden' }}>

        {/* Background: cover image OR rich gradient */}
        {artist.coverImage ? (
          <div style={{ position: 'absolute', inset: 0 }}>
            <Image src={artist.coverImage} alt="" fill priority style={{ objectFit: 'cover', objectPosition: 'center top', filter: 'brightness(0.3) saturate(1.5)', transform: 'scale(1.06)' }} />
          </div>
        ) : (
          <div style={{
            position: 'absolute', inset: 0,
            background: `linear-gradient(135deg, hsl(${hue},60%,12%) 0%, hsl(${(hue+40)%360},50%,8%) 50%, #0d0d0d 100%)`,
          }} />
        )}

        {/* Overlay gradients */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(13,13,13,0.05) 0%, rgba(13,13,13,0.4) 50%, rgba(13,13,13,1) 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(13,13,13,0.75) 0%, rgba(13,13,13,0.1) 60%, transparent 100%)' }} />
        {/* Subtle color glow */}
        <div style={{ position: 'absolute', top: 0, right: '15%', width: 400, height: 400, borderRadius: '50%', background: `hsl(${hue},70%,50%)`, opacity: 0.07, filter: 'blur(80px)' }} />

        {/* Top bar */}
        <div style={{ position: 'relative', zIndex: 10 }}>
          <TopBar transparent />
        </div>

        {/* Hero content */}
        <div className="absolute bottom-0 left-0 right-0 p-4 md:px-8 md:pb-7 z-[10]">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-5 md:gap-7 text-left">

            {/* Avatar */}
            <motion.div
              initial={{ opacity: 0, scale: 0.75, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 22 }}
              className="hidden md:block"
              style={{ flexShrink: 0, position: 'relative' }}
            >
              <div style={{
                width: 148, height: 148, borderRadius: '50%', overflow: 'hidden',
                border: followed ? '3px solid #1db954' : '2px solid rgba(255,255,255,0.12)',
                boxShadow: followed
                  ? '0 0 0 4px rgba(29, 185, 84,0.18), 0 12px 40px rgba(0,0,0,0.7)'
                  : '0 12px 40px rgba(0,0,0,0.7)',
                transition: 'border-color 0.3s, box-shadow 0.3s',
              }}>
                <Image
                  src={artist.image || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop'}
                  alt={artist.name} fill priority style={{ objectFit: 'cover' }}
                />
              </div>
              {/* Live dot */}
              <div style={{
                position: 'absolute', bottom: 6, right: 6,
                background: 'rgba(13,13,13,0.92)', backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.12)', borderRadius: 100,
                padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 5,
              }}>
                <span style={{ position: 'relative', width: 6, height: 6 }}>
                  <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#4ade80', animation: 'ping 1.2s cubic-bezier(0,0,0.2,1) infinite', opacity: 0.7 }} />
                  <span style={{ position: 'relative', display: 'block', width: 6, height: 6, borderRadius: '50%', background: '#4ade80' }} />
                </span>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#4ade80', letterSpacing: 0.3 }}>{currentListeningNow}</span>
              </div>
            </motion.div>

            {/* Mobile Hero Text (Visible only on mobile) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.45 }}
              className="block md:hidden flex-1 min-w-0"
            >
              {/* Name */}
              <h1 style={{
                fontFamily: 'Outfit, sans-serif',
                fontWeight: 900,
                color: '#fff',
                lineHeight: 0.9,
                letterSpacing: -1.5,
                margin: '0 0 10px',
                textShadow: '0 2px 20px rgba(0,0,0,0.6)',
                fontSize: '42px',
              }}>
                {artist.name}
              </h1>

              {/* Verified by Spotify */}
              {artist.verified && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <CheckCircle2 size={16} color="#fff" fill="#1db954" />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>Verified by Spotify</span>
                </div>
              )}

              {/* Monthly Listeners */}
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', fontWeight: 500, margin: 0, textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                {fmt(currentMonthlyListeners)} monthly listeners
              </p>
            </motion.div>

            {/* Desktop Hero Text (Visible only on desktop) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.45 }}
              className="hidden md:block flex-1 min-w-0"
            >
              {/* Badges */}
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                {artist.verified && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 12px', borderRadius: 100, background: 'rgba(29, 185, 84,0.14)', border: '1px solid rgba(29, 185, 84,0.3)' }}>
                    <CheckCircle2 size={10} color="#1db954" />
                    <span style={{ fontSize: 10, fontWeight: 800, color: '#1db954', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Verified Artist</span>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 12px', borderRadius: 100, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <Flame size={9} color="#f59e0b" />
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{currentListeningNow} listening now</span>
                </div>
                {artist.genres.slice(0, 3).map(g => (
                  <div key={g} style={{ padding: '4px 10px', borderRadius: 100, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{g}</span>
                  </div>
                ))}
              </div>

              {/* Name */}
              <h1 style={{
                fontFamily: 'Outfit, sans-serif',
                fontWeight: 900,
                color: '#fff',
                lineHeight: 0.88,
                letterSpacing: -2,
                margin: '0 0 12px',
                textShadow: '0 4px 32px rgba(0,0,0,0.5)',
                fontSize: 'clamp(44px, 7vw, 76px)',
              }}>
                {artist.name}
              </h1>
      {/* Stats row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                {[
                  { icon: <Users size={12} color="#1db954" />, val: fmt(currentFollowers), label: 'followers' },
                  { icon: <Headphones size={12} color="rgba(255,255,255,0.4)" />, val: fmt(currentMonthlyListeners), label: 'monthly listeners' },
                  ...(artistTracks.length ? [{ icon: <Music size={12} color="rgba(255,255,255,0.4)" />, val: String(artistTracks.length), label: 'tracks' }] : []),
                ].map((s, i) => (
                  <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {i > 0 && <span style={{ color: 'rgba(255,255,255,0.15)', margin: '0 4px' }}>·</span>}
                    {s.icon}
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{s.val}</span>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{s.label}</span>
                  </span>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ── STICKY ACTION BAR ─────────────────────────────────────────── */}
      <div 
        className="sticky top-0 z-50 px-4 md:px-8 py-3.5 flex items-center justify-between md:justify-start gap-4 md:gap-5"
        style={{
          background: scrolled ? 'rgba(13,13,13,0.96)' : 'transparent',
          backdropFilter: scrolled ? 'blur(24px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(255,255,255,0.05)' : 'none',
          transition: 'background 0.35s, backdrop-filter 0.35s',
        }}
      >
        {/* Left section: Avatar + Follow + More options */}
        <div className="flex items-center gap-3.5 md:gap-5 order-1 md:order-2">
          {/* Small scrolled avatar - visible on desktop scroll or mobile */}
          <div className={`w-9 h-9 rounded-md overflow-hidden relative flex-shrink-0 border border-white/10 transition-all duration-300 ${scrolled ? 'opacity-100 scale-100' : 'opacity-100 md:opacity-0 md:scale-75'}`}>
            <Image
              src={artist.image || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop'}
              alt={artist.name} fill style={{ objectFit: 'cover' }}
            />
          </div>

          {/* Follow Outline Button */}
          <motion.button 
            whileTap={{ scale: 0.96 }} 
            onClick={doFollow}
            className="h-8 px-4 rounded-full border text-[13px] font-semibold transition-all flex items-center justify-center gap-1.5"
            style={{
              borderColor: followed ? '#fff' : 'rgba(255,255,255,0.4)',
              background: 'transparent',
              color: '#fff',
            }}
          >
            {followed ? 'Following' : 'Follow'}
          </motion.button>

          {/* Three dots - vertical More icon */}
          <button 
            onClick={doShare} 
            className="w-9 h-9 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 transition-colors border-none bg-transparent cursor-pointer"
          >
            <MoreVertical size={18} color="rgba(255,255,255,0.6)" />
          </button>
        </div>

        {/* Right section: Play + Shuffle */}
        <div className="flex items-center gap-4 ml-auto order-2 md:order-1">
          {/* Shuffle */}
          <motion.button 
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.9 }} 
            onClick={doShuffle}
            className="w-9 h-9 rounded-full flex items-center justify-center text-ss-primary hover:bg-white/5 transition-colors border-none bg-transparent cursor-pointer"
          >
            <Shuffle size={18} color="#1db954" />
          </motion.button>

          {/* Play */}
          <motion.button 
            whileHover={{ scale: 1.06 }} 
            whileTap={{ scale: 0.9 }} 
            onClick={doPlay}
            className="w-14 h-14 rounded-full bg-ss-primary flex items-center justify-center shadow-glow-green flex-shrink-0 border-none cursor-pointer"
          >
            {isCurrent && isPlaying
              ? <Pause size={22} fill="black" color="black" />
              : <Play size={22} fill="black" color="black" style={{ transform: 'translateX(2px)' }} />}
          </motion.button>
        </div>
      </div>

      {/* Promo Banner (Listen to the new album) - mobile-friendly */}
      {latestAlbum && (
        <Link href={`/album/${latestAlbum.id}`} className="block mx-4 md:mx-8 mb-4 mt-2">
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 14px',
            borderRadius: 8,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.06)',
            cursor: 'pointer',
          }}>
            <div style={{ width: 40, height: 40, borderRadius: 4, overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
              {latestAlbum.coverImage ? (
                <img src={latestAlbum.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #2a2a2a, #111)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>💿</div>
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
      <div className="px-4 md:px-8 pt-1 border-b border-white/5">
        <div style={{ display: 'flex', gap: 0 }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{
                position: 'relative', padding: '0 20px 14px',
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: tab === t ? 700 : 500,
                color: tab === t ? '#fff' : 'rgba(255,255,255,0.38)',
                transition: 'color 0.15s',
                letterSpacing: 0.3,
              }}
              onMouseEnter={e => { if (tab !== t) (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.65)'; }}
              onMouseLeave={e => { if (tab !== t) (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.38)'; }}
            >
              {t}
              {tab === t && (
                <motion.div layoutId="tabUnderline"
                  style={{ position: 'absolute', bottom: -1, left: 20, right: 20, height: 2, background: '#1db954', borderRadius: 2 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════════════
          CONTENT
      ════════════════════════════════════════════ */}
      <div className="px-4 md:px-8 py-6 md:py-8 pb-24">
        <AnimatePresence mode="wait">

          {/* ── OVERVIEW ────────────────────────────── */}
          {tab === 'Overview' && (
            <motion.div key="ov"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 32 }}
            >
              {/* Stats – 4 cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                <StatsCard index={0} label="Followers" value={currentFollowers} color="#1db954" icon={<Users size={15} />} isLive />
                <StatsCard index={1} label="Monthly Listeners" value={currentMonthlyListeners} color="#a78bfa" icon={<Headphones size={15} />} isLive />
                <StatsCard index={2} label="Listening Now" value={currentListeningNow} color="#34d399" icon={<Radio size={15} />} isLive />
                <StatsCard index={3} label="Tracks" value={artistTracks.length} color="#fb923c" icon={<Music size={15} />} />
              </div>

              {/* Popular Tracks */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 20, fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <TrendingUp size={18} color="#1db954" /> Popular Tracks
                  </h2>
                  {artistTracks.length > 5 && (
                    <button onClick={() => setTab('Popular')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 3 }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.7)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.3)'}>
                      See all <ChevronRight size={12} />
                    </button>
                  )}
                </div>

                {artistTracks.length > 0 ? (
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, overflow: 'hidden' }}>
                    {/* Header */}
                    <div className="hidden md:grid" style={{ gridTemplateColumns: '32px 48px 1fr auto 80px 52px', gap: 12, padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)', alignItems: 'center' }}>
                      <span style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>#</span>
                      <span />
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Title</span>
                      <span />
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'right' }}>Plays</span>
                      <span style={{ display: 'flex', justifyContent: 'flex-end' }}><Clock size={11} color="rgba(255,255,255,0.2)" /></span>
                    </div>
                    <div style={{ padding: 8 }}>
                      {artistTracks.slice(0, 5).map((t, i) => (
                        <TrackRow key={t.id} track={t} idx={i}
                          active={currentTrack?.id === t.id} playing={isPlaying}
                          onPlay={() => currentTrack?.id === t.id ? togglePlay() : playTrack(t, artistTracks.filter(x => x.id !== t.id))}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 16, textAlign: 'center', gap: 10 }}>
                    <Music size={32} color="rgba(255,255,255,0.12)" />
                    <p style={{ color: '#fff', fontWeight: 600, fontSize: 15 }}>No tracks yet</p>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>Music appears here after approval</p>
                  </div>
                )}
              </div>

              {/* Bio + Genres 2-col */}
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5">

                {/* Bio */}
                <div style={{ position: 'relative', borderRadius: 18, overflow: 'hidden', minHeight: 260 }}>
                  <Image
                    src={artist.coverImage || artist.image || 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=1200&h=500&fit=crop'}
                    alt="" fill style={{ objectFit: 'cover', filter: 'brightness(0.25) saturate(1.2)' }}
                  />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(13,13,13,0.98) 0%, rgba(13,13,13,0.4) 55%, transparent 100%)' }} />
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                      <Mic2 size={12} color="#1db954" />
                      <span style={{ fontSize: 9, fontWeight: 800, color: '#1db954', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Artist Bio</span>
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 1.7, fontWeight: 300, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {artist.bio || `${artist.name} is a verified creator delivering dynamic music on Beato.`}
                    </p>
                    <button onClick={() => setTab('About')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1db954', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, marginTop: 10, padding: 0 }}>
                      Read more <ChevronRight size={12} />
                    </button>
                  </div>
                </div>

                {/* Right col: genres + queue */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* Genres */}
                  <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 18, padding: 22, display: 'flex', flexDirection: 'column', gap: 18 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <BarChart3 size={15} color="#a78bfa" />
                      <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Genre Mix</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {artist.genres.map((g, i) => (
                        <div key={g} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', width: 16, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{i + 1}</span>
                          <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.max(35, 100 - i * 18)}%` }}
                              transition={{ delay: 0.25 + i * 0.1, duration: 0.75, ease: 'easeOut' }}
                              style={{ height: '100%', borderRadius: 2, background: `hsl(${145 - i * 30}, 68%, 52%)` }}
                            />
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.6)', width: 70, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Queue button */}
                  {artistTracks.length > 0 && (
                    <button
                      onClick={() => { artistTracks.forEach(t => usePlayerStore.getState().addToQueue(t)); toast.success(`${artistTracks.length} tracks queued 🎵`); }}
                      style={{ width: '100%', padding: '14px 20px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', transition: 'all 0.15s' }}
                      onMouseEnter={e => { const el = e.currentTarget; el.style.background = 'rgba(255,255,255,0.08)'; el.style.color = '#fff'; el.style.borderColor = 'rgba(255,255,255,0.14)'; }}
                      onMouseLeave={e => { const el = e.currentTarget; el.style.background = 'rgba(255,255,255,0.04)'; el.style.color = 'rgba(255,255,255,0.5)'; el.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                    >
                      <ListMusic size={15} /> Add All to Queue
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── POPULAR ─────────────────────────────── */}
          {tab === 'Popular' && (
            <motion.div key="pop"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 20, fontWeight: 800, color: '#fff' }}>All Tracks</h2>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{artistTracks.length} songs</span>
              </div>

              {artistTracks.length > 0 ? (
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, overflow: 'hidden' }}>
                  <div className="hidden md:grid" style={{ gridTemplateColumns: '32px 48px 1fr auto 80px 52px', gap: 12, padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)', alignItems: 'center' }}>
                    <span style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>#</span>
                    <span />
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Title</span>
                    <span />
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'right' }}>Plays</span>
                    <span style={{ display: 'flex', justifyContent: 'flex-end' }}><Clock size={11} color="rgba(255,255,255,0.2)" /></span>
                  </div>
                  <div style={{ padding: 8 }}>
                    {artistTracks.map((t, i) => (
                      <TrackRow key={t.id} track={t} idx={i}
                        active={currentTrack?.id === t.id} playing={isPlaying}
                        onPlay={() => currentTrack?.id === t.id ? togglePlay() : playTrack(t, artistTracks.filter(x => x.id !== t.id))}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 16, textAlign: 'center', gap: 12 }}>
                  <Music size={40} color="rgba(255,255,255,0.12)" />
                  <p style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>No Published Tracks</p>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>Tracks appear here after approval.</p>
                </div>
              )}
            </motion.div>
          )}

          {/* ── ALBUMS ──────────────────────────────── */}
          {tab === 'Albums' && (
            <motion.div key="alb"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            >
              <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 24 }}>Discography</h2>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 18, textAlign: 'center', gap: 12 }}>
                <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Disc size={28} color="rgba(255,255,255,0.2)" style={{ animation: 'spin 8s linear infinite' }} />
                </div>
                <p style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>No Albums Yet</p>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>Albums will appear here when published.</p>
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
                  <Mic2 size={14} color="#1db954" />
                  <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>About the Artist</span>
                </div>
                <p style={{ color: 'rgba(255,255,255,0.62)', fontSize: 14, lineHeight: 1.75, fontWeight: 300 }}>
                  {artist.bio || `${artist.name} is a composing creator delivering rich melodies and digital releases to listeners globally on Beato.`}
                </p>
              </div>

              {/* Stats 3-col */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {[
                  { label: 'Followers', v: currentFollowers, color: '#1db954' },
                  { label: 'Monthly Listeners', v: currentMonthlyListeners, color: '#a78bfa' },
                  { label: 'Listening Now', v: currentListeningNow, color: '#34d399' },
                ].map(({ label, v, color }) => (
                  <div key={label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 14, padding: '18px 20px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: -16, right: -16, width: 70, height: 70, borderRadius: '50%', background: color, opacity: 0.12, filter: 'blur(20px)' }} />
                    <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 28, color, lineHeight: 1, marginBottom: 6 }}><CountUp to={v} /></p>
                    <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>{label}</p>
                  </div>
                ))}
              </div>

              {/* Genres */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, padding: '18px 22px' }}>
                <p style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 14 }}>Genres</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {artist.genres.map(g => (
                    <span key={g} style={{ padding: '8px 18px', borderRadius: 100, background: 'rgba(29, 185, 84,0.1)', border: '1px solid rgba(29, 185, 84,0.22)', color: '#1db954', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{g}</span>
                  ))}
                </div>
              </div>

              {/* Social */}
              {Object.values(artist.socialLinks || {}).some(Boolean) && (
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, padding: '18px 22px' }}>
                  <p style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 14 }}>Official Links</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {artist.socialLinks?.instagram && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', transition: 'all 0.15s' }}
                        onMouseEnter={e => { const el = e.currentTarget; el.style.background = 'rgba(225,48,108,0.06)'; el.style.borderColor = 'rgba(225,48,108,0.2)'; }}
                        onMouseLeave={e => { const el = e.currentTarget; el.style.background = 'rgba(255,255,255,0.03)'; el.style.borderColor = 'rgba(255,255,255,0.05)'; }}>
                        <AtSign size={15} color="rgba(255,255,255,0.3)" />
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.6)', flex: 1 }}>{artist.socialLinks.instagram}</span>
                        <ExternalLink size={12} color="rgba(255,255,255,0.2)" />
                      </div>
                    )}
                    {artist.socialLinks?.website && (
                      <a href={`https://${artist.socialLinks.website}`} target="_blank" rel="noopener noreferrer"
                        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', textDecoration: 'none', transition: 'all 0.15s' }}
                        onMouseEnter={e => { const el = e.currentTarget; el.style.background = 'rgba(29, 185, 84,0.06)'; el.style.borderColor = 'rgba(29, 185, 84,0.2)'; }}
                        onMouseLeave={e => { const el = e.currentTarget; el.style.background = 'rgba(255,255,255,0.03)'; el.style.borderColor = 'rgba(255,255,255,0.05)'; }}>
                        <Globe size={15} color="rgba(255,255,255,0.3)" />
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.6)', flex: 1 }}>{artist.socialLinks.website}</span>
                        <ExternalLink size={12} color="rgba(255,255,255,0.2)" />
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