'use client';

import { motion } from 'framer-motion';
import {
  X, Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1,
  Music2, Heart, Disc, Info
} from 'lucide-react';
import { usePlayerStore } from '@/store/playerStore';
import { useAuthStore } from '@/store/authStore';
import { useRealtimeStore } from '@/store/realtimeStore';
import { useMusicStore } from '@/store/musicStore';
import { formatDuration } from '@/lib/mockData';
import { Track } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';

interface NowPlayingPanelProps {
  onClose: () => void;
}

const GREEN = '#1db954';

function SafeTrackImage({ src, alt, size = 20, style = {}, borderRadius = '0px' }: { src?: string; alt: string; size?: number; style?: React.CSSProperties; borderRadius?: string }) {
  const [hasError, setHasError] = useState(false);
  
  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (!src || hasError || src === 'undefined' || src === 'null') {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#282828' }}>
        <Music2 size={size} color="#a3a3a3" />
      </div>
    );
  }

  const isValidUrl = src.startsWith('data:') || src.startsWith('http:') || src.startsWith('https:') || src.startsWith('/');
  
  if (!isValidUrl) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#282828' }}>
        <Music2 size={size} color="#a3a3a3" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      style={{ objectFit: 'cover', width: '100%', height: '100%', borderRadius, ...style }}
      onError={() => setHasError(true)}
    />
  );
}

const MiniTrackCard = ({ track, onPlay, isCurrent, isPlaying }: { track: Track; onPlay: () => void; isCurrent: boolean; isPlaying: boolean }) => {
  return (
    <div 
      onClick={onPlay}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '6px 8px',
        borderRadius: 6,
        cursor: 'pointer',
        width: '100%',
        background: isCurrent ? 'rgba(29, 185, 84, 0.08)' : 'transparent',
        transition: 'background 0.2s',
      }}
      onMouseEnter={e => {
        if (!isCurrent) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
      }}
      onMouseLeave={e => {
        if (!isCurrent) e.currentTarget.style.background = 'transparent';
      }}
    >
      <div style={{ width: 36, height: 36, borderRadius: 4, overflow: 'hidden', position: 'relative', background: '#282828', flexShrink: 0 }}>
        <SafeTrackImage src={track.coverImage} alt={track.title} size={12} />
      </div>
      
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ color: isCurrent ? GREEN : '#fff', fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
          {track.title}
        </p>
        <p style={{ color: '#a3a3a3', fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: '2px 0 0 0' }}>
          {track.artistName}
        </p>
      </div>
      
      {isCurrent && isPlaying ? (
        <span style={{ display: 'flex', gap: 1.5, alignItems: 'flex-end', height: 8, marginRight: 4 }}>
          <span className="waveform-bar" style={{ width: 1.5, height: 8, animationDelay: '0.1s' }} />
          <span className="waveform-bar" style={{ width: 1.5, height: 5, animationDelay: '0.3s' }} />
          <span className="waveform-bar" style={{ width: 1.5, height: 9, animationDelay: '0.5s' }} />
        </span>
      ) : null}
    </div>
  );
};

interface Comment {
  id: string;
  user: string;
  avatarColor: string;
  text: string;
  timestamp: string;
  isUser?: boolean;
}

const MOCK_USERS = [
  { name: 'Emma', color: '#ff4757' },
  { name: 'Raj', color: '#ffa502' },
  { name: 'Vikram', color: '#2ed573' },
  { name: 'Sofia', color: '#1e90ff' },
  { name: 'Lucas', color: '#9b59b6' },
  { name: 'Hana', color: '#fd79a8' },
  { name: 'Alex', color: '#00cec9' },
  { name: 'Chloe', color: '#eccc68' }
];

const getVibeComments = (genre: string) => {
  const g = genre ? genre.toLowerCase() : '';
  if (g.includes('electronic') || g.includes('dance') || g.includes('techno') || g.includes('bass') || g.includes('synth')) {
    return [
      "This drop is insane! 🔥",
      "The synths in this track are out of this world.",
      "Dancing in my living room right now! 🕺",
      "That bassline is so clean.",
      "Cyberpunk vibes, loving the production here.",
      "Pure club vibes, turn it up!",
      "Perfect coding fuel 💻✨"
    ];
  } else if (g.includes('pop') || g.includes('r&b') || g.includes('soul') || g.includes('dance pop')) {
    return [
      "Such a catchy hook! I can't stop singing along.",
      "The vocals are absolutely angelic 🥺❤️",
      "This song is a whole mood.",
      "On repeat all day everyday!",
      "This is going straight into my summer playlist.",
      "The harmonies in the chorus are so beautiful.",
      "Unbelievable production quality here."
    ];
  } else if (g.includes('rock') || g.includes('alternative') || g.includes('post') || g.includes('metal')) {
    return [
      "That guitar solo gave me chills! 🎸",
      "The drum work is absolutely phenomenal.",
      "This is real music. Loving the raw energy here!",
      "Reminds me of late night drives.",
      "This band never disappoints.",
      "Gives me nostalgia, love the guitar tone.",
      "So powerful, play this loud!"
    ];
  } else if (g.includes('ambient') || g.includes('jazz') || g.includes('bossa') || g.includes('world') || g.includes('chill')) {
    return [
      "So relaxing... perfect study vibes ☕",
      "This melody is pure gold.",
      "Brings so much peace to my mind.",
      "Incredible atmosphere, feeling so chilled.",
      "This track is the ultimate aesthetic.",
      "Floating on a cloud right now.",
      "So smooth, macro vibes."
    ];
  } else {
    return [
      "What a masterpiece!",
      "Discovered this today, and I'm obsessed.",
      "The vibe is immaculate ✨",
      "This song is so underrated!",
      "Who else is listening in 2026? 🙋‍♂️",
      "This track makes me feel so nostalgic.",
      "Can't get this melody out of my head."
    ];
  }
};

export default function NowPlayingPanel({ onClose }: NowPlayingPanelProps) {
  const {
    currentTrack, isPlaying, volume, isMuted, progress, duration,
    shuffle, repeat, queue,
    togglePlay, setProgress, toggleShuffle, cycleRepeat, playNext, playPrevious, playTrack
  } = usePlayerStore();

  const { user, toggleLikeSong } = useAuthStore();
  const liveListeners = useRealtimeStore(state => state.liveListeners);
  const isLiked = currentTrack ? user?.likedSongs.includes(currentTrack.id) : false;

  const { allTracks } = useMusicStore();
  const getForYouTracks = useMusicStore(state => state.getForYouTracks);
  const getTrendingTracks = useMusicStore(state => state.getTrendingTracks);

  const likedTrackIds = user?.likedSongs || [];
  const likedSongs = allTracks.filter(t => likedTrackIds.includes(t.id)).slice(0, 5);
  const recommendedSongs = getForYouTracks().slice(0, 5);
  const trendingSongs = getTrendingTracks().slice(0, 5);
  const moreSongs = allTracks.filter(t => t.id !== (currentTrack?.id || '') && !likedTrackIds.includes(t.id)).slice(0, 5);

  const [localProgress, setLocalProgress] = useState(progress);
  const [isDragging, setIsDragging] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const listSectionRef = useRef<HTMLDivElement | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  const [comments, setComments] = useState<Comment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');

  // Sync audio progress bar local state
  useEffect(() => {
    if (!isDragging) {
      setLocalProgress(progress);
    }
  }, [progress, isDragging]);

  // Smooth scroll logic based on playing state
  useEffect(() => {
    if (!containerRef.current) return;
    
    const timer = setTimeout(() => {
      if (isPlaying) {
        containerRef.current?.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      } else {
        if (listSectionRef.current) {
          containerRef.current?.scrollTo({
            top: listSectionRef.current.offsetTop - 16,
            behavior: 'smooth'
          });
        }
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [isPlaying]);

  // Reset comments when track changes. User comments stay real instead of seeded chat.
  useEffect(() => {
    setComments([]);
  }, [currentTrack?.id]);

  // Auto-scroll chat feed
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [comments]);

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    const userComment: Comment = {
      id: `user-${Date.now()}`,
      user: user?.name || 'You',
      avatarColor: GREEN,
      text: newCommentText.trim(),
      timestamp: timeStr,
      isUser: true
    };
    
    setComments(prev => [...prev, userComment].slice(-50));
    setNewCommentText('');
  };

  if (!currentTrack) return null;

  const progressPercent = duration > 0 ? (localProgress / duration) * 100 : 0;
  const listenerCount = liveListeners[currentTrack.id] || 0;

  // Next up song preview
  const nextTrack = queue.length > 0 ? queue[0] : null;

  const btnStyle = (active?: boolean): React.CSSProperties => ({
    background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: '50%',
    color: active ? GREEN : '#a3a3a3', transition: 'all 0.2s',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  });

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: '#121212',
      borderLeft: '1px solid #282828',
      borderRadius: '0 12px 12px 0',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        borderBottom: '1px solid #282828'
      }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: 0 }}>Now Playing</h3>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#a3a3a3',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 4,
            borderRadius: '50%',
            transition: 'background 0.2s, color 0.2s'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.color = '#fff';
            e.currentTarget.style.background = '#282828';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = '#a3a3a3';
            e.currentTarget.style.background = 'none';
          }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Main Container */}
      <div 
        ref={containerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px 20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        gap: 20
      }}>
        {/* Vinyl CD Spinning Wrapper */}
        <div style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '1',
          maxWidth: 260,
          borderRadius: '50%',
          boxShadow: isPlaying ? '0 16px 36px rgba(29, 185, 84,0.15), 0 10px 24px rgba(0,0,0,0.6)' : '0 10px 24px rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0d0d0d',
          border: '6px solid #1a1a1a',
          flexShrink: 0,
          transition: 'box-shadow 0.4s'
        }}>
          {/* Concentric Grooves */}
          <div style={{ position: 'absolute', inset: '8%', borderRadius: '50%', border: '1px dashed rgba(255,255,255,0.04)' }} />
          <div style={{ position: 'absolute', inset: '16%', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.02)' }} />
          <div style={{ position: 'absolute', inset: '24%', borderRadius: '50%', border: '1px dashed rgba(255,255,255,0.03)' }} />
          <div style={{ position: 'absolute', inset: '32%', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.01)' }} />

          {/* Rotating Vinyl Core */}
          <motion.div
            animate={isPlaying ? { rotate: 360 } : {}}
            transition={{ repeat: Infinity, duration: 14, ease: 'linear' }}
            style={{
              width: '64%',
              height: '64%',
              borderRadius: '50%',
              overflow: 'hidden',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(0,0,0,0.6) inset',
              border: '3px solid #000',
              background: `hsl(${(currentTrack.id.charCodeAt(0) * 37) % 360}, 40%, 25%)`
            }}
          >
            <SafeTrackImage src={currentTrack.coverImage} alt={currentTrack.title} size={36} borderRadius="50%" />

            {/* Spindle hole in center */}
            <div style={{
              position: 'absolute',
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: '#121212',
              border: '2px solid #fff',
              zIndex: 10,
              boxShadow: '0 0 4px rgba(0,0,0,0.8)'
            }} />
          </motion.div>
        </div>

        {/* Live Audio Visualizer Wave */}
        <div style={{ height: 24, display: 'flex', alignItems: 'flex-end', gap: 3, justifyContent: 'center' }}>
          {Array.from({ length: 15 }).map((_, i) => (
            <span
              key={i}
              className={isPlaying ? "waveform-bar" : ""}
              style={{
                width: 3,
                height: isPlaying ? [14, 20, 12, 18, 24, 16, 10, 22, 14, 18, 12, 20, 16, 24, 14][i] : 4,
                background: GREEN,
                animationDelay: `${i * 0.11}s`,
                opacity: isPlaying ? 1 : 0.3,
                transition: 'height 0.3s, opacity 0.3s',
                borderRadius: 2
              }}
            />
          ))}
        </div>

        {/* Meta Info */}
        <div style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <Link href={`/album/${currentTrack.albumId}`} style={{ textDecoration: 'none' }}>
              <h4 style={{
                color: '#fff',
                fontSize: 16,
                fontWeight: 700,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                margin: 0,
                cursor: 'pointer'
              }}
                onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
              >
                {currentTrack.title}
              </h4>
            </Link>
            <Link href={`/artist/${currentTrack.artistId}`} style={{ textDecoration: 'none' }}>
              <p style={{
                color: '#a3a3a3',
                fontSize: 13,
                fontWeight: 500,
                margin: '4px 0 0 0',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                cursor: 'pointer'
              }}
                onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={e => (e.currentTarget.style.color = '#a3a3a3')}
              >
                {currentTrack.artistName}
              </p>
            </Link>
            {currentTrack.albumName && (
              <p style={{ color: '#525252', fontSize: 11, margin: '2px 0 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                Album: {currentTrack.albumName}
              </p>
            )}
            
            {/* Live listener count */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%', backgroundColor: GREEN,
                boxShadow: '0 0 8px #1db954', display: 'inline-block',
                animation: 'pulse 1.5s ease-in-out infinite'
              }} />
              <span style={{ color: '#1db954', fontSize: 12, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                {listenerCount.toLocaleString()} listening now
              </span>
            </div>
          </div>

          <button
            onClick={() => toggleLikeSong(currentTrack.id)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', color: isLiked ? GREEN : '#a3a3a3',
              padding: 4, transition: 'color 0.2s', marginTop: 2
            }}
            onMouseEnter={e => (e.currentTarget.style.color = isLiked ? GREEN : '#fff')}
            onMouseLeave={e => (e.currentTarget.style.color = isLiked ? GREEN : '#a3a3a3')}
          >
            <Heart size={20} fill={isLiked ? GREEN : 'none'} />
          </button>
        </div>

        {/* Custom Progress Slider */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ position: 'relative', height: 16, display: 'flex', alignItems: 'center' }}>
            <input
              type="range"
              min={0}
              max={duration || currentTrack.duration}
              value={localProgress}
              onChange={e => setLocalProgress(Number(e.target.value))}
              onMouseDown={() => setIsDragging(true)}
              onMouseUp={e => {
                const val = Number((e.target as HTMLInputElement).value);
                window.dispatchEvent(new CustomEvent('seek-audio', { detail: val }));
                setIsDragging(false);
              }}
              className="progress-bar"
              style={{ '--progress': `${progressPercent}%`, width: '100%' } as React.CSSProperties}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#737373', fontVariantNumeric: 'tabular-nums' }}>
            <span>{formatDuration(localProgress)}</span>
            <span>{formatDuration(duration || currentTrack.duration)}</span>
          </div>
        </div>

        {/* Playback Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, width: '100%', marginTop: 8 }}>
          <button onClick={toggleShuffle} style={btnStyle(shuffle)} title="Shuffle"
            onMouseEnter={e => (e.currentTarget.style.color = shuffle ? GREEN : '#fff')}
            onMouseLeave={e => (e.currentTarget.style.color = shuffle ? GREEN : '#a3a3a3')}>
            <Shuffle size={16} />
          </button>

          <button onClick={playPrevious} style={btnStyle()} title="Previous"
            onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={e => (e.currentTarget.style.color = '#a3a3a3')}>
            <SkipBack size={20} fill="currentColor" />
          </button>

          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={togglePlay}
            style={{
              width: 48, height: 48, borderRadius: '50%', background: '#fff',
              border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)', transition: 'transform 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause size={20} fill="#000" color="#000" />
            ) : (
              <Play size={20} fill="#000" color="#000" style={{ marginLeft: 2 }} />
            )}
          </motion.button>

          <button onClick={playNext} style={btnStyle()} title="Next"
            onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={e => (e.currentTarget.style.color = '#a3a3a3')}>
            <SkipForward size={20} fill="currentColor" />
          </button>

          <button onClick={cycleRepeat} style={btnStyle(repeat !== 'none')} title="Repeat"
            onMouseEnter={e => (e.currentTarget.style.color = repeat !== 'none' ? GREEN : '#fff')}
            onMouseLeave={e => (e.currentTarget.style.color = repeat !== 'none' ? GREEN : '#a3a3a3')}>
            {repeat === 'one' ? <Repeat1 size={16} /> : <Repeat size={16} />}
          </button>
        </div>

        {/* Next Track Preview */}
        {nextTrack && (
          <div style={{
            width: '100%',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: 10,
            padding: '12px 14px',
            border: '1px solid rgba(255,255,255,0.05)',
            marginTop: 12,
            textAlign: 'left'
          }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#737373', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Next In Queue
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 4, overflow: 'hidden', position: 'relative',
                background: `hsl(${(nextTrack.id.charCodeAt(0) * 37) % 360}, 50%, 25%)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                <SafeTrackImage src={nextTrack.coverImage} alt={nextTrack.title} size={12} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ color: '#fff', fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
                  {nextTrack.title}
                </p>
                <p style={{ color: '#a3a3a3', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: '2px 0 0 0' }}>
                  {nextTrack.artistName}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Lists Wrapper for Smooth Scrolling target */}
        <div ref={listSectionRef} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Liked Songs list */}
          {likedSongs.length > 0 && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10, marginTop: 24 }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: '#fff', alignSelf: 'flex-start', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Liked Songs
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
              {likedSongs.map(t => (
                <MiniTrackCard 
                  key={t.id} 
                  track={t} 
                  onPlay={() => playTrack(t, allTracks)} 
                  isCurrent={currentTrack?.id === t.id}
                  isPlaying={isPlaying}
                />
              ))}
            </div>
          </div>
        )}

        {/* Recommended Songs list */}
        {recommendedSongs.length > 0 && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10, marginTop: 24 }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: '#fff', alignSelf: 'flex-start', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Recommended For You
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
              {recommendedSongs.map(t => (
                <MiniTrackCard 
                  key={t.id} 
                  track={t} 
                  onPlay={() => playTrack(t, allTracks)} 
                  isCurrent={currentTrack?.id === t.id}
                  isPlaying={isPlaying}
                />
              ))}
            </div>
          </div>
        )}

        {/* Trending Songs list */}
        {trendingSongs.length > 0 && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10, marginTop: 24 }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: '#fff', alignSelf: 'flex-start', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Trending Now
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
              {trendingSongs.map(t => (
                <MiniTrackCard 
                  key={t.id} 
                  track={t} 
                  onPlay={() => playTrack(t, allTracks)} 
                  isCurrent={currentTrack?.id === t.id}
                  isPlaying={isPlaying}
                />
              ))}
            </div>
          </div>
        )}

        {/* More list */}
        {moreSongs.length > 0 && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10, marginTop: 24 }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: '#fff', alignSelf: 'flex-start', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              More Songs
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
              {moreSongs.map(t => (
                <MiniTrackCard 
                  key={t.id} 
                  track={t} 
                  onPlay={() => playTrack(t, allTracks)} 
                  isCurrent={currentTrack?.id === t.id}
                  isPlaying={isPlaying}
                />
              ))}
            </div>
          </div>
        )}

        {/* Live Listening Party Chat Room */}
        <div style={{
          width: '100%',
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: 12,
          padding: '16px 14px',
          marginTop: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          textAlign: 'left'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: '#ff4757',
                display: 'inline-block',
                boxShadow: '0 0 8px #ff4757',
                animation: 'pulse 1.5s ease-in-out infinite'
              }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Listening Party Chat
              </span>
            </div>
            <span style={{ fontSize: 10, color: '#1db954', fontWeight: 600 }}>
              {listenerCount.toLocaleString()} online
            </span>
          </div>

          {/* Chat Feed */}
          <div 
            ref={chatScrollRef}
            style={{
              height: 180,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              paddingRight: 4,
              borderTop: '1px solid rgba(255,255,255,0.04)',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
              paddingTop: 8,
              paddingBottom: 8,
            }}
          >
            {comments.length === 0 ? (
              <p style={{ color: '#525252', fontSize: 11, textAlign: 'center', margin: '20px 0' }}>
                No comments yet. Start the conversation!
              </p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: '#fff',
                      backgroundColor: comment.avatarColor,
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textTransform: 'uppercase',
                      flexShrink: 0
                    }}>
                      {comment.user[0]}
                    </span>
                    <span style={{ fontWeight: 600, color: comment.isUser ? GREEN : '#e0e0e0' }}>
                      {comment.user}
                      {comment.isUser && <span style={{ fontSize: 9, color: GREEN, marginLeft: 4, fontWeight: 400 }}>(You)</span>}
                    </span>
                    <span style={{ fontSize: 9, color: '#525252', marginLeft: 'auto' }}>
                      {comment.timestamp}
                    </span>
                  </div>
                  <p style={{ color: '#a3a3a3', margin: '0 0 0 24px', lineHeight: 1.4, wordBreak: 'break-word' }}>
                    {comment.text}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Chat Input */}
          <form 
            onSubmit={handleSendComment}
            style={{
              display: 'flex',
              gap: 6,
              marginTop: 4
            }}
          >
            <input
              type="text"
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              placeholder="Share your vibe..."
              style={{
                flex: 1,
                background: '#1a1a1a',
                border: '1px solid #282828',
                borderRadius: 6,
                padding: '6px 10px',
                fontSize: 12,
                color: '#fff',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = GREEN}
              onBlur={(e) => e.target.style.borderColor = '#282828'}
            />
            <button
              type="submit"
              disabled={!newCommentText.trim()}
              style={{
                background: GREEN,
                color: '#000',
                border: 'none',
                borderRadius: 6,
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                opacity: newCommentText.trim() ? 1 : 0.5,
                transition: 'opacity 0.2s, transform 0.1s',
                flexShrink: 0
              }}
            >
              Send
            </button>
          </form>
        </div>
        </div>
      </div>
    </div>
  );
}
