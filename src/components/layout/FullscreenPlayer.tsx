'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1,
  Volume2, VolumeX, Volume1, Minimize2, Mic, Heart, Clock, Gauge, Sliders, Disc,
  ChevronDown, MoreVertical, Share2, ListMusic, Check, Menu, GripVertical, Trash2, Music,
  Download, PlusCircle, X, ChevronLeft, MinusCircle, User, Users, XCircle, Radio, Info, Barcode
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { usePlayerStore } from '@/store/playerStore';
import { useAuthStore } from '@/store/authStore';
import { useDownloadStore } from '@/store/downloadStore';
import { usePlaylistStore } from '@/store/playlistStore';
import { formatDuration, mockArtists } from '@/lib/mockData';
import { getLyricsForTrack } from '@/lib/lyrics';

interface FullscreenPlayerProps {
  onClose: () => void;
}

export default function FullscreenPlayer({ onClose }: FullscreenPlayerProps) {
  const {
    currentTrack, isPlaying, volume, isMuted, progress, duration,
    shuffle, repeat, crossfade, sleepTimer, activeDevice, activeDeviceId, availableDevices,
    queue, setQueue, playTrack, clearQueue, removeFromQueue, setIsPlaying,
    togglePlay, setVolume, toggleMute, toggleShuffle, cycleRepeat,
    setCrossfade, setSleepTimer, playNext, playPrevious, setActiveDevice, setActiveDeviceId
  } = usePlayerStore();

  const { user, toggleLikeSong } = useAuthStore();
  const isLiked = currentTrack ? user?.likedSongs.includes(currentTrack.id) : false;

  const { downloadTrack, removeDownloadedTrack, downloadedTrackIds, downloadingIds } = useDownloadStore();
  const downloaded = currentTrack ? downloadedTrackIds.includes(currentTrack.id) : false;
  const downloading = currentTrack ? downloadingIds.includes(currentTrack.id) : false;
  const { customPlaylists, addTrackToPlaylist, removeTrackFromPlaylist, addPlaylist } = usePlaylistStore();
  const router = useRouter();

  const [showPlaylistPicker, setShowPlaylistPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleDownloadClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentTrack) return;
    if (downloaded) {
      if (confirm(`Remove "${currentTrack.title}" from downloads?`)) {
        await removeDownloadedTrack(currentTrack.id);
      }
    } else if (!downloading) {
      await downloadTrack(currentTrack);
    }
  };

  const handleAddToLikedSongs = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentTrack) return;
    if (!isLiked) {
      toggleLikeSong(currentTrack.id);
    }
    toast(
      (t) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 4, overflow: 'hidden', flexShrink: 0,
              background: `hsl(${(currentTrack.id.charCodeAt(0) * 37) % 360}, 50%, 25%)`
            }}>
              {currentTrack.coverImage && <img src={currentTrack.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>
              {isLiked ? 'Already in Liked Songs' : 'Added to Liked Songs'}
            </span>
          </div>
          <button
            onClick={(ev) => { ev.stopPropagation(); toast.dismiss(t.id); setShowPlaylistPicker(true); }}
            style={{ background: 'none', border: 'none', color: '#b08850', fontSize: 13, fontWeight: 700, cursor: 'pointer', flexShrink: 0, padding: '2px 0' }}
          >
            Change
          </button>
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

  const [localProgress, setLocalProgress] = useState(progress);
  const [isDragging, setIsDragging] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showSleepMenu, setShowSleepMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Mobile layout state hooks
  const [isMobile, setIsMobile] = useState(false);
  const [scrollTop, setScrollTop] = useState(0);
  const [isFollowingArtist, setIsFollowingArtist] = useState(false);
  const [followedCredits, setFollowedCredits] = useState<Record<string, boolean>>({});
  const [showAllLyrics, setShowAllLyrics] = useState(false);
  const [showBio, setShowBio] = useState(false);
  const [showDeviceSelector, setShowDeviceSelector] = useState(false);
  const [showQueueDrawer, setShowQueueDrawer] = useState(false);
  
  // Custom features drawer states
  const [showFeaturesDrawer, setShowFeaturesDrawer] = useState(false);
  const [featuresDrawerTab, setFeaturesDrawerTab] = useState<'options' | 'sleep' | 'playlist'>('options');
  const [showBeatoCode, setShowBeatoCode] = useState(false);
  const [playlistSearchQuery, setPlaylistSearchQuery] = useState('');

  const handleReorder = useCallback((newQueue: any[]) => {
    setQueue(newQueue);
  }, [setQueue]);

  const handleCycleTimer = useCallback(() => {
    const times = [null, 5, 15, 30, 45, 60];
    const currentIdx = times.indexOf(sleepTimer);
    const nextIdx = (currentIdx + 1) % times.length;
    setSleepTimer(times[nextIdx]);
    if (times[nextIdx]) {
      toast.success(`Sleep timer set for ${times[nextIdx]} minutes ⏳`, { id: 'timer-toast' });
    } else {
      toast.success('Sleep timer turned off ⏳', { id: 'timer-toast' });
    }
  }, [sleepTimer, setSleepTimer]);

  const lyricsRef = useRef<HTMLDivElement>(null);
  const mobileScrollRef = useRef<HTMLDivElement>(null);

  const currentBrowserDevice = useMemo(() => {
    if (typeof window === 'undefined') return 'Web Player';
    const ua = navigator.userAgent;
    let browser = 'Chrome';
    if (ua.indexOf('Firefox') > -1) browser = 'Firefox';
    else if (ua.indexOf('Edg') > -1) browser = 'Edge';
    else if (ua.indexOf('Safari') > -1 && ua.indexOf('Chrome') === -1) browser = 'Safari';
    
    let os = 'Windows';
    if (ua.indexOf('Mac') > -1) os = 'macOS';
    else if (ua.indexOf('Linux') > -1) os = 'Linux';
    else if (ua.indexOf('Android') > -1) os = 'Android';
    else if (ua.indexOf('iPhone') > -1) os = 'iPhone';
    
    return `Web Player (${browser} on ${os})`;
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  // Synced lyrics data
  const lyrics = useMemo(() => {
    if (!currentTrack) return [];
    return getLyricsForTrack(currentTrack.id, currentTrack.title, currentTrack.artistName);
  }, [currentTrack]);

  // Handle local progress syncing
  useEffect(() => {
    if (!isDragging) {
      setLocalProgress(progress);
    }
  }, [progress, isDragging]);

  // Seek event dispatcher
  const handleSeek = (time: number) => {
    window.dispatchEvent(new CustomEvent('seek-audio', { detail: time }));
  };

  // Playback rate event dispatcher
  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    window.dispatchEvent(new CustomEvent('change-playback-speed', { detail: speed }));
    setShowSpeedMenu(false);
  };

  // Find active line index
  const activeLineIndex = useMemo(() => {
    if (lyrics.length === 0) return -1;
    let index = -1;
    for (let i = 0; i < lyrics.length; i++) {
      if (localProgress >= lyrics[i].time) {
        index = i;
      } else {
        break;
      }
    }
    return index === -1 ? 0 : index;
  }, [lyrics, localProgress]);

  // Center active lyric line in viewport
  useEffect(() => {
    if (activeLineIndex === -1 || !lyricsRef.current) return;
    const activeEl = lyricsRef.current.children[activeLineIndex] as HTMLElement;
    if (!activeEl) return;

    const parent = lyricsRef.current;
    const parentHeight = parent.clientHeight;
    const activeOffset = activeEl.offsetTop;
    const activeHeight = activeEl.clientHeight;

    parent.scrollTo({
      top: activeOffset - parentHeight / 2 + activeHeight / 2,
      behavior: 'smooth'
    });
  }, [activeLineIndex]);

  const progressPercent = duration > 0 ? (localProgress / duration) * 100 : 0;
  const volumePercent = isMuted ? 0 : volume * 100;
  const VolumeIcon = isMuted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  // Generate dynamic gradient base on current track color - warm light pastel beige theme
  const trackColorHue = currentTrack ? (currentTrack.id.charCodeAt(0) * 37) % 360 : 120;
  const bgGradient = `linear-gradient(180deg, hsl(${trackColorHue}, 35%, 96%) 0%, var(--color-ss-bg, #fbf9f5) 100%)`;

  const artist = useMemo(() => {
    if (!currentTrack) return null;
    return mockArtists.find(a => 
      a.id === currentTrack.artistId || 
      a.name.toLowerCase() === currentTrack.artistName.toLowerCase()
    ) || null;
  }, [currentTrack]);

  const activeArtist = useMemo(() => {
    if (artist) return artist;
    return {
      id: currentTrack?.artistId || 'artist-unknown',
      name: currentTrack?.artistName || 'Unknown Artist',
      image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop',
      coverImage: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=1400&h=400&fit=crop',
      bio: `${currentTrack?.artistName || 'This artist'} is a talented performer featured on Beato, bringing incredible melodies to listeners everywhere.`,
      followers: 1245000,
      monthlyListeners: 8200000,
      verified: true,
      genres: [currentTrack?.genre || 'Pop'],
    };
  }, [artist, currentTrack]);

  const toggleFollowCredit = (name: string) => {
    setFollowedCredits(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const trackCredits = useMemo(() => {
    if (!currentTrack) return [];
    
    const artistName = currentTrack.artistName || 'Unknown Artist';
    
    if (artistName.toLowerCase().includes('nandhini')) {
      return [
        { name: 'Nandhini', role: 'Main Artist • Playback Singer' },
        { name: 'Santhosh Narayanan', role: 'Composer • Producer' },
        { name: 'Vivek', role: 'Lyricist' }
      ];
    } else if (artistName.toLowerCase().includes('pradeep')) {
      return [
        { name: 'Pradeep', role: 'Main Artist • Playback Singer' },
        { name: 'Pradeep Kumar', role: 'Composer • Producer' },
        { name: 'Yugabharathi', role: 'Lyricist' }
      ];
    } else if (artistName.toLowerCase().includes('manoj')) {
      return [
        { name: 'Manoj S', role: 'Main Artist • Composer • Producer' },
        { name: 'Manoj S', role: 'Lyricist' },
        { name: 'Beato Studio', role: 'Producer' }
      ];
    } else if (artistName.toLowerCase().includes('aurora')) {
      return [
        { name: 'Aurora Nightfall', role: 'Main Artist • Vocalist' },
        { name: 'Aurora Nightfall', role: 'Composer • Producer' },
        { name: 'Astral Beats', role: 'Recording Studio' }
      ];
    } else if (artistName.toLowerCase().includes('cipher')) {
      return [
        { name: 'Cipher Nova', role: 'Main Artist • Producer' },
        { name: 'Cipher Nova', role: 'Composer • Lyricist' }
      ];
    } else if (artistName.toLowerCase().includes('selene')) {
      return [
        { name: 'Selene Ray', role: 'Main Artist • Vocalist' },
        { name: 'Max Martin', role: 'Composer • Producer' },
        { name: 'Selene Ray', role: 'Lyricist' }
      ];
    } else if (artistName.toLowerCase().includes('velvet')) {
      return [
        { name: 'The Velvet Echoes', role: 'Main Artist • Performance Group' },
        { name: 'Jack Antonoff', role: 'Producer' },
        { name: 'The Velvet Echoes', role: 'Composer' }
      ];
    }
    
    return [
      { name: artistName, role: 'Main Artist • Vocalist' },
      { name: `${artistName} Production`, role: 'Composer • Producer' },
      { name: 'Beato AI', role: 'Lyricist' }
    ];
  }, [currentTrack]);

  const lyricsPreviewLines = useMemo(() => {
    if (lyrics.length === 0) return [];
    const start = Math.max(0, activeLineIndex);
    return lyrics.slice(start, start + 5);
  }, [lyrics, activeLineIndex]);

  // Desktop player layout sub-component
  const renderDesktopPlayer = () => {
    return (
      <>
        {/* Dynamic Background Glow */}
        <div style={{
          position: 'absolute',
          top: '-10%',
          left: '25%',
          width: '50%',
          height: '60%',
          background: `radial-gradient(circle, hsla(${trackColorHue}, 70%, 30%, 0.15) 0%, transparent 70%)`,
          pointerEvents: 'none',
          zIndex: 0,
          filter: 'blur(80px)'
        }} />

        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 1,
          marginBottom: 20
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Disc size={20} color="#b08850" className={isPlaying ? 'float-animation' : ''} />
            <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Now Playing
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff',
              cursor: 'pointer',
              padding: 10,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s, transform 0.2s'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <Minimize2 size={20} />
          </button>
        </div>

        {/* Core Layout */}
        <div className="fullscreen-player-grid">
          {/* Left Side: Vinyl + Meta */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
          }}>
            {/* Vinyl Container */}
            <div className="fullscreen-vinyl-wrapper">
              {/* Grooves */}
              <div style={{
                position: 'absolute',
                top: '5%',
                left: '5%',
                right: '5%',
                bottom: '5%',
                borderRadius: '50%',
                border: '1px dashed rgba(255,255,255,0.05)',
              }} />
              <div style={{
                position: 'absolute',
                top: '15%',
                left: '15%',
                right: '15%',
                bottom: '15%',
                borderRadius: '50%',
                border: '1px solid rgba(255,255,255,0.03)',
              }} />
              <div style={{
                position: 'absolute',
                top: '25%',
                left: '25%',
                right: '25%',
                bottom: '25%',
                borderRadius: '50%',
                border: '1px dashed rgba(255,255,255,0.05)',
              }} />

              {/* Rotating Vinyl Body */}
              <motion.div
                animate={isPlaying ? { rotate: 360 } : {}}
                transition={{ repeat: Infinity, duration: 15, ease: 'linear' }}
                style={{
                  width: '65%',
                  height: '65%',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  position: 'relative',
                  background: `hsl(${trackColorHue}, 50%, 30%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 25px rgba(0,0,0,0.6) inset',
                  border: '4px solid #000'
                }}
              >
                <Disc size={64} color="rgba(255,255,255,0.3)" />
                {/* Spindle hole */}
                <div style={{
                  position: 'absolute',
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  background: '#fff',
                  boxShadow: '0 0 8px rgba(0,0,0,0.8)',
                  zIndex: 10
                }} />
              </motion.div>

              {/* Simulated Live Visualizer Wave */}
              {isPlaying && (
                <div style={{
                  position: 'absolute',
                  bottom: -25,
                  display: 'flex',
                  gap: 3,
                  alignItems: 'flex-end',
                  height: 40
                }}>
                  {Array.from({ length: 16 }).map((_, i) => (
                    <span
                      key={i}
                      className="waveform-bar"
                      style={{
                        width: 3,
                        height: 15 + Math.random() * 25,
                        background: '#b08850',
                        animationDelay: `${i * 0.08}s`
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Track Metadata */}
            <div className="fullscreen-metadata">
              <h2 style={{ fontSize: 26, fontWeight: 800, color: '#fff', margin: 0, textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                {currentTrack?.title}
              </h2>
              <p style={{ fontSize: 16, fontWeight: 500, color: '#a3a3a3', marginTop: 8, marginLeft: 0, marginRight: 0 }}>
                {currentTrack?.artistName}
              </p>
            </div>
          </div>

          {/* Right Side: Sync Lyrics */}
          <div className="fullscreen-lyrics-container">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#b08850', marginBottom: 16 }}>
              <Mic size={18} />
              <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Synced Lyrics</span>
            </div>

            <div
              ref={lyricsRef}
              style={{
                flex: 1,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 24,
                paddingRight: 10,
                paddingBottom: '20vh',
                paddingTop: '15vh',
                scrollBehavior: 'smooth',
                maskImage: 'linear-gradient(to bottom, transparent 0%, white 25%, white 75%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, white 25%, white 75%, transparent 100%)',
              }}
              className="lyrics-scroll"
            >
              {lyrics.length === 0 ? (
                <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 18, fontWeight: 600 }}>
                  No lyrics available for this track.
                </div>
              ) : (
                lyrics.map((line, index) => {
                  const isActive = index === activeLineIndex;
                  return (
                    <div
                      key={index}
                      onClick={() => handleSeek(line.time)}
                      style={{
                        fontSize: isActive ? '24px' : '20px',
                        fontWeight: 700,
                        color: isActive ? '#fff' : 'rgba(255,255,255,0.25)',
                        textShadow: isActive ? '0 0 12px rgba(255,255,255,0.3)' : 'none',
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        transform: isActive ? 'scale(1.02)' : 'scale(1)',
                        transformOrigin: 'left center',
                        lineHeight: '1.4',
                        userSelect: 'none'
                      }}
                      onMouseEnter={e => {
                        if (!isActive) e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
                      }}
                      onMouseLeave={e => {
                        if (!isActive) e.currentTarget.style.color = 'rgba(255,255,255,0.25)';
                      }}
                    >
                      {line.text}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer Playback Controls & Features Panel */}
        <div className="fullscreen-footer">
          {/* Progress Slider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 12, color: '#a3a3a3', fontVariantNumeric: 'tabular-nums', width: 35 }}>
              {formatDuration(localProgress)}
            </span>
            <div style={{ flex: 1, position: 'relative', height: 24, display: 'flex', alignItems: 'center' }}>
              <input
                type="range"
                min={0}
                max={duration || (currentTrack ? currentTrack.duration : 180)}
                value={localProgress}
                onChange={e => setLocalProgress(Number(e.target.value))}
                onMouseDown={() => setIsDragging(true)}
                onMouseUp={e => {
                  const val = Number((e.target as HTMLInputElement).value);
                  handleSeek(val);
                  setIsDragging(false);
                }}
                className="progress-bar"
                style={{
                  '--progress': `${progressPercent}%`,
                  width: '100%'
                } as React.CSSProperties}
              />
            </div>
            <span style={{ fontSize: 12, color: '#a3a3a3', fontVariantNumeric: 'tabular-nums', width: 35 }}>
              {formatDuration(duration || (currentTrack ? currentTrack.duration : 180))}
            </span>
          </div>

          {/* Action Controls & Extra Utilities */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            {/* Left Buttons: Like & Utility menus */}
            <div className="fullscreen-utils-section">
              <button
                onClick={() => currentTrack && toggleLikeSong(currentTrack.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: isLiked ? '#b08850' : '#a3a3a3' }}
              >
                <Heart size={22} fill={isLiked ? '#b08850' : 'none'} />
              </button>

              {/* Speed Controller Trigger */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => { setShowSpeedMenu(!showSpeedMenu); setShowSleepMenu(false); setShowSettings(false); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: playbackSpeed !== 1 ? '#b08850' : '#a3a3a3',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                  title="Playback Speed"
                >
                  <Gauge size={20} />
                  <span style={{ fontSize: 11, fontWeight: 700 }}>{playbackSpeed}x</span>
                </button>

                <AnimatePresence>
                  {showSpeedMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      style={{
                        position: 'absolute',
                        bottom: 'calc(100% + 10px)',
                        left: 0,
                        background: '#1a1a1a',
                        border: '1px solid #282828',
                        borderRadius: 8,
                        overflow: 'hidden',
                        zIndex: 100,
                        display: 'flex',
                        flexDirection: 'column',
                        width: 90
                      }}
                    >
                      {[0.5, 0.75, 1, 1.25, 1.5, 2].map((s) => (
                        <button
                          key={s}
                          onClick={() => handleSpeedChange(s)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: playbackSpeed === s ? '#b08850' : '#fff',
                            padding: '8px 12px',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                            textAlign: 'center',
                            backgroundColor: playbackSpeed === s ? 'rgba(176, 136, 80,0.1)' : 'transparent',
                            transition: 'background 0.2s'
                          }}
                          onMouseEnter={e => {
                            if (playbackSpeed !== s) e.currentTarget.style.backgroundColor = '#282828';
                          }}
                          onMouseLeave={e => {
                            if (playbackSpeed !== s) e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          {s}x
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Sleep Timer Trigger */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => { setShowSleepMenu(!showSleepMenu); setShowSpeedMenu(false); setShowSettings(false); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: sleepTimer ? '#b08850' : '#a3a3a3',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                  title="Sleep Timer"
                >
                  <Clock size={20} />
                  {sleepTimer && <span style={{ fontSize: 11, fontWeight: 700 }}>{sleepTimer}m</span>}
                </button>

                <AnimatePresence>
                  {showSleepMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      style={{
                        position: 'absolute',
                        bottom: 'calc(100% + 10px)',
                        left: 0,
                        background: '#1a1a1a',
                        border: '1px solid #282828',
                        borderRadius: 8,
                        overflow: 'hidden',
                        zIndex: 100,
                        display: 'flex',
                        flexDirection: 'column',
                        width: 140
                      }}
                    >
                      <span style={{ fontSize: 10, color: '#525252', padding: '6px 12px', fontWeight: 600, borderBottom: '1px solid #282828', textTransform: 'uppercase' }}>
                        Sleep Timer
                      </span>
                      {[
                        { label: 'Off', val: null },
                        { label: '5 minutes', val: 5 },
                        { label: '15 minutes', val: 15 },
                        { label: '30 minutes', val: 30 },
                        { label: '45 minutes', val: 45 },
                        { label: '60 minutes', val: 60 },
                      ].map((t) => (
                        <button
                          key={t.label}
                          onClick={() => {
                            setSleepTimer(t.val);
                            setShowSleepMenu(false);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: sleepTimer === t.val ? '#b08850' : '#fff',
                            padding: '8px 12px',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                            textAlign: 'left',
                            backgroundColor: sleepTimer === t.val ? 'rgba(176, 136, 80,0.1)' : 'transparent',
                            transition: 'background 0.2s'
                          }}
                          onMouseEnter={e => {
                            if (sleepTimer !== t.val) e.currentTarget.style.backgroundColor = '#282828';
                          }}
                          onMouseLeave={e => {
                            if (sleepTimer !== t.val) e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          {t.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Center Playback Controls */}
            <div className="fullscreen-controls-section">
              <button
                onClick={toggleShuffle}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: shuffle ? '#b08850' : '#a3a3a3' }}
                title="Shuffle"
              >
                <Shuffle size={20} />
              </button>

              <button
                onClick={playPrevious}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff' }}
                title="Previous"
              >
                <SkipBack size={26} fill="currentColor" />
              </button>

              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={togglePlay}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 15px rgba(176, 136, 80,0.4)',
                  transform: 'scale(1)',
                  transition: 'transform 0.2s'
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                title="Play/Pause"
              >
                {isPlaying ? (
                  <Pause size={24} fill="#000" color="#000" />
                ) : (
                  <Play size={24} fill="#000" color="#000" style={{ marginLeft: 3 }} />
                )}
              </motion.button>

              <button
                onClick={playNext}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff' }}
                title="Next"
              >
                <SkipForward size={26} fill="currentColor" />
              </button>

              <button
                onClick={cycleRepeat}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: repeat !== 'none' ? '#b08850' : '#a3a3a3' }}
                title="Repeat"
              >
                {repeat === 'one' ? <Repeat1 size={20} /> : <Repeat size={20} />}
              </button>
            </div>

            {/* Right Controls: Volume + Crossfade Settings */}
            <div className="fullscreen-volume-section">
              {/* Audio settings: Crossfade */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => { setShowSettings(!showSettings); setShowSpeedMenu(false); setShowSleepMenu(false); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a3a3a3' }}
                  title="Playback Settings"
                >
                  <Sliders size={20} />
                </button>

                <AnimatePresence>
                  {showSettings && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      style={{
                        position: 'absolute',
                        bottom: 'calc(100% + 10px)',
                        right: 0,
                        background: '#1a1a1a',
                        border: '1px solid #282828',
                        borderRadius: 10,
                        padding: 16,
                        zIndex: 100,
                        width: 220,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12
                      }}
                    >
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Crossfade: {crossfade} seconds
                      </span>
                      <input
                        type="range"
                        min={0}
                        max={12}
                        value={crossfade}
                        onChange={e => setCrossfade(Number(e.target.value))}
                        style={{
                          width: '100%',
                          accentColor: '#b08850'
                        }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#737373', marginTop: -4 }}>
                        <span>0s (Off)</span>
                        <span>12s</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Volume controls */}
              <button
                onClick={toggleMute}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a3a3a3' }}
              >
                <VolumeIcon size={20} />
              </button>

              <div style={{ width: 100, position: 'relative', height: 20, display: 'flex', alignItems: 'center' }}>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={isMuted ? 0 : volume}
                  onChange={e => setVolume(Number(e.target.value))}
                  className="volume-bar"
                  style={{
                    '--vol': `${volumePercent}%`,
                    width: '100%'
                  } as React.CSSProperties}
                />
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };

  const renderMobilePlayer = () => {
    if (!currentTrack) return null;

    const progressPercent = duration > 0 ? (localProgress / duration) * 100 : 0;

    return (
      <div 
        ref={mobileScrollRef}
        onScroll={handleScroll}
        style={{
          width: '100%',
          height: '100%',
          overflowY: 'auto',
          padding: '24px 20px',
          display: 'flex',
          flexDirection: 'column',
          scrollbarWidth: 'none',
        }}
        className="lyrics-scroll"
      >
        {/* 1. STICKY MINI-HEADER */}
        <div style={{
          position: 'sticky',
          top: 0,
          left: 0,
          right: 0,
          height: 60,
          marginTop: -24,
          marginLeft: -20,
          marginRight: -20,
          padding: '0 20px',
          background: `hsl(${trackColorHue}, 50%, 10%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 50,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          opacity: scrollTop > 250 ? 1 : 0,
          transform: scrollTop > 250 ? 'translateY(0)' : 'translateY(-10px)',
          pointerEvents: scrollTop > 250 ? 'auto' : 'none',
          transition: 'opacity 0.2s ease, transform 0.2s ease, background-color 0.2s ease'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: '65%' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {currentTrack.title} • {currentTrack.artistName}
            </div>
            <div 
              onClick={() => setShowDeviceSelector(true)}
              style={{ fontSize: 11, fontWeight: 600, color: '#b08850', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}
            >
              <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#b08850' }} />
              {activeDevice}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              onClick={() => toggleLikeSong(currentTrack.id)}
              style={{ background: 'none', border: 'none', padding: 0, color: isLiked ? '#b08850' : '#fff', display: 'flex', alignItems: 'center' }}
            >
              {isLiked ? (
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#b08850', display: 'flex', alignItems: 'center', color: '#121212', justifyContent: 'center' }}>
                  <Check size={12} color="#000" strokeWidth={4} />
                </div>
              ) : (
                <Heart size={20} />
              )}
            </button>
            <button
              onClick={togglePlay}
              style={{ background: 'none', border: 'none', padding: 0, color: '#fff', display: 'flex', alignItems: 'center' }}
            >
              {isPlaying ? <Pause size={20} fill="#fff" /> : <Play size={20} fill="#fff" />}
            </button>
          </div>
        </div>

        {/* 2. STANDARD HEADER */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16
        }}>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#fff', padding: 4, display: 'flex', alignItems: 'center', cursor: 'pointer' }}
          >
            <ChevronDown size={28} />
          </button>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Playing from your library
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginTop: 2 }}>
              Liked Songs
            </span>
          </div>
          <button
            onClick={() => { setFeaturesDrawerTab('options'); setShowFeaturesDrawer(true); }}
            style={{ background: 'none', border: 'none', color: '#fff', padding: 4, display: 'flex', alignItems: 'center', cursor: 'pointer' }}
          >
            <MoreVertical size={22} />
          </button>
        </div>

        {/* 3. SQUARE COVER ART */}
        <div style={{
          width: '100%',
          aspectRatio: '1/1',
          borderRadius: 8,
          overflow: 'hidden',
          boxShadow: '0 16px 38px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.08)',
          margin: '16px 0 24px 0',
          flexShrink: 0
        }}>
          <img
            src={currentTrack.coverImage}
            alt={currentTrack.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>

        {/* 4. ACTIVE LYRIC SNIPPET & METADATA */}
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', marginBottom: 12 }}>
          {lyrics.length > 0 && lyrics[activeLineIndex] && (
            <div style={{
              fontSize: 14,
              fontWeight: 600,
              color: 'rgba(255,255,255,0.9)',
              marginBottom: 8,
              height: 20,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {lyrics[activeLineIndex].text}
            </div>
          )}
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentTrack.title}
              </h1>
              <p style={{ fontSize: 15, fontWeight: 500, color: 'rgba(255,255,255,0.6)', margin: '4px 0 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentTrack.artistName}
              </p>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
              {/* Add to playlist / Liked Songs */}
              <button
                onClick={handleAddToLikedSongs}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isLiked ? '#b08850' : 'rgba(255,255,255,0.6)',
                }}
              >
                {isLiked ? (
                  <div style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: '#b08850',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Check size={14} color="#000" strokeWidth={4} />
                  </div>
                ) : (
                  <PlusCircle size={24} />
                )}
              </button>

              {/* Download for offline */}
              <button
                onClick={handleDownloadClick}
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
                {downloading ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ display: 'flex' }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#b08850' }} />
                  </motion.div>
                ) : downloaded ? (
                  <Download size={22} color="#b08850" />
                ) : (
                  <Download size={22} color="rgba(255,255,255,0.6)" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 5. PROGRESS SLIDER & DURATION */}
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', margin: '8px 0' }}>
          <div style={{ position: 'relative', height: 16, display: 'flex', alignItems: 'center' }}>
            <input
              type="range"
              min={0}
              max={duration || (currentTrack ? currentTrack.duration : 180)}
              value={localProgress}
              onChange={e => setLocalProgress(Number(e.target.value))}
              onMouseDown={() => setIsDragging(true)}
              onTouchStart={() => setIsDragging(true)}
              onMouseUp={e => {
                const val = Number((e.target as HTMLInputElement).value);
                handleSeek(val);
                setIsDragging(false);
              }}
              onTouchEnd={e => {
                const val = Number((e.target as HTMLInputElement).value);
                handleSeek(val);
                setIsDragging(false);
              }}
              onTouchCancel={() => setIsDragging(false)}
              className="progress-bar"
              style={{
                '--progress': `${progressPercent}%`,
                width: '100%'
              } as React.CSSProperties}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontVariantNumeric: 'tabular-nums' }}>
              {formatDuration(localProgress)}
            </span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontVariantNumeric: 'tabular-nums' }}>
              {formatDuration(duration || (currentTrack ? currentTrack.duration : 180))}
            </span>
          </div>
        </div>

        {/* 6. PLAYBACK CONTROLS */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          margin: '16px 0',
          position: 'relative'
        }}>
          <button
            onClick={toggleShuffle}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: shuffle ? '#b08850' : 'rgba(255,255,255,0.6)', padding: 8 }}
          >
            <Shuffle size={20} />
          </button>

          <button
            onClick={playPrevious}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', padding: 8 }}
          >
            <SkipBack size={26} fill="currentColor" />
          </button>

          <button
            onClick={togglePlay}
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: '#fff',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
            }}
          >
            {isPlaying ? (
              <Pause size={28} fill="#000" color="#000" />
            ) : (
              <Play size={28} fill="#000" color="#000" style={{ marginLeft: 3 }} />
            )}
          </button>

          <button
            onClick={playNext}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', padding: 8 }}
          >
            <SkipForward size={26} fill="currentColor" />
          </button>

          <div style={{ position: 'relative' }}>
            <button
              onClick={() => { setShowSleepMenu(!showSleepMenu); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: sleepTimer ? '#b08850' : 'rgba(255,255,255,0.6)', padding: 8, display: 'flex', alignItems: 'center', gap: 2 }}
            >
              <Clock size={20} />
              {sleepTimer && <span style={{ fontSize: 9, fontWeight: 700 }}>{sleepTimer}m</span>}
            </button>

            <AnimatePresence>
              {showSleepMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  style={{
                    position: 'absolute',
                    bottom: 'calc(100% + 8px)',
                    right: 0,
                    background: '#1a1a1a',
                    border: '1px solid #282828',
                    borderRadius: 8,
                    overflow: 'hidden',
                    zIndex: 100,
                    display: 'flex',
                    flexDirection: 'column',
                    width: 130
                  }}
                >
                  <span style={{ fontSize: 9, color: '#a3a3a3', padding: '6px 12px', fontWeight: 700, borderBottom: '1px solid #282828', textTransform: 'uppercase' }}>
                    Sleep Timer
                  </span>
                  {[
                    { label: 'Off', val: null },
                    { label: '5m', val: 5 },
                    { label: '15m', val: 15 },
                    { label: '30m', val: 30 },
                    { label: '60m', val: 60 },
                  ].map((t) => (
                    <button
                      key={t.label}
                      onClick={() => {
                        setSleepTimer(t.val);
                        setShowSleepMenu(false);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: sleepTimer === t.val ? '#b08850' : '#fff',
                        padding: '8px 12px',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        textAlign: 'left',
                        backgroundColor: sleepTimer === t.val ? 'rgba(176, 136, 80,0.1)' : 'transparent',
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* 7. DEVICE ROW & SHARE / QUEUE */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 0',
          marginBottom: 16
        }}>
          <div 
            onClick={() => setShowDeviceSelector(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#b08850', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
          >
            <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#b08850' }} />
            {activeDevice}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex' }}>
              <Share2 size={20} />
            </button>
            <button 
              onClick={() => setShowQueueDrawer(true)}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex' }}
            >
              <ListMusic size={20} />
            </button>
          </div>
        </div>

        {/* 8. LYRICS PREVIEW CARD */}
        {lyrics.length > 0 && (
          <div id="lyrics-preview-section" style={{
            background: 'rgba(255,255,255,0.08)',
            borderRadius: 16,
            padding: 20,
            margin: '12px 0',
            display: 'flex',
            flexDirection: 'column',
            gap: 16
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>
              Lyrics preview
            </div>
            
            {!showAllLyrics ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {lyricsPreviewLines.map((line, idx) => {
                  const isLineActive = (lyrics.indexOf(line) === activeLineIndex);
                  return (
                    <div
                      key={idx}
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        lineHeight: 1.4,
                        color: isLineActive ? '#fff' : 'rgba(255,255,255,0.4)',
                        transition: 'color 0.2s'
                      }}
                    >
                      {line.text}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div 
                style={{
                  maxHeight: 240,
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  paddingRight: 4
                }}
                className="lyrics-scroll"
              >
                {lyrics.map((line, idx) => {
                  const isLineActive = (idx === activeLineIndex);
                  return (
                    <div
                      key={idx}
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        lineHeight: 1.4,
                        color: isLineActive ? '#fff' : 'rgba(255,255,255,0.4)'
                      }}
                    >
                      {line.text}
                    </div>
                  );
                })}
              </div>
            )}
            
            <button
              onClick={() => setShowAllLyrics(!showAllLyrics)}
              style={{
                background: '#fff',
                color: '#000',
                border: 'none',
                borderRadius: 20,
                padding: '8px 16px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                alignSelf: 'flex-start',
                marginTop: 8
              }}
            >
              {showAllLyrics ? 'Show less' : 'Show lyrics'}
            </button>
          </div>
        )}

        {/* 9. ABOUT THE ARTIST CARD */}
        <div style={{
          background: 'rgba(255,255,255,0.06)',
          borderRadius: 16,
          overflow: 'hidden',
          margin: '16px 0',
          position: 'relative'
        }}>
          <div style={{ position: 'relative', width: '100%', height: 180 }}>
            <img
              src={activeArtist.coverImage || activeArtist.image}
              alt={activeArtist.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div style={{
              position: 'absolute',
              top: 16,
              left: 16,
              fontSize: 12,
              fontWeight: 800,
              color: '#fff',
              textShadow: '0 2px 4px rgba(0,0,0,0.8)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              About the artist
            </div>
          </div>
          
          <div style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>
                  {activeArtist.name}
                </span>
                {activeArtist.verified && (
                  <div style={{
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    background: '#b08850',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Check size={10} color="#000" strokeWidth={4} />
                  </div>
                )}
              </div>
              <button
                onClick={() => setIsFollowingArtist(!isFollowingArtist)}
                style={{
                  border: isFollowingArtist ? '1px solid #fff' : '1px solid rgba(255,255,255,0.5)',
                  background: isFollowingArtist ? '#fff' : 'transparent',
                  color: isFollowingArtist ? '#000' : '#fff',
                  borderRadius: 16,
                  padding: '6px 16px',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {isFollowingArtist ? 'Following' : 'Follow'}
              </button>
            </div>
            
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', margin: '8px 0' }}>
              {activeArtist.monthlyListeners.toLocaleString()} monthly listeners
            </div>
            
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5, margin: 0 }}>
              {showBio ? activeArtist.bio : `${activeArtist.bio.slice(0, 100)}...`}
              <span
                onClick={() => setShowBio(!showBio)}
                style={{ color: '#fff', fontWeight: 700, cursor: 'pointer', marginLeft: 4 }}
              >
                {showBio ? 'see less' : 'see more'}
              </span>
            </div>
          </div>
        </div>

        {/* 10. EXPLORE CAROUSEL */}
        <div style={{ margin: '24px 0 16px 0' }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 12, marginTop: 0 }}>
            Explore {activeArtist.name}
          </h2>
          
          <div style={{
            display: 'flex',
            overflowX: 'auto',
            gap: 12,
            paddingBottom: 8,
            scrollbarWidth: 'none'
          }} className="lyrics-scroll">
            {/* Card 1 */}
            <div style={{
              flexShrink: 0,
              width: 140,
              height: 180,
              borderRadius: 12,
              overflow: 'hidden',
              position: 'relative',
              background: '#242424',
              cursor: 'pointer'
            }}>
              <img
                src={activeArtist.image}
                alt="Songs by artist"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%)'
              }} />
              <div style={{ position: 'absolute', bottom: 12, left: 12, right: 12, color: '#fff', fontSize: 12, fontWeight: 700, lineHeight: 1.2 }}>
                Songs by {activeArtist.name}
              </div>
            </div>
            
            {/* Card 2 */}
            <div style={{
              flexShrink: 0,
              width: 140,
              height: 180,
              borderRadius: 12,
              overflow: 'hidden',
              position: 'relative',
              background: '#242424',
              cursor: 'pointer'
            }}>
              <img
                src="https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=300&h=300&fit=crop"
                alt="Similar artists"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%)'
              }} />
              <div style={{ position: 'absolute', bottom: 12, left: 12, right: 12, color: '#fff', fontSize: 12, fontWeight: 700, lineHeight: 1.2 }}>
                Similar to {activeArtist.name}
              </div>
            </div>

            {/* Card 3 */}
            <div style={{
              flexShrink: 0,
              width: 140,
              height: 180,
              borderRadius: 12,
              overflow: 'hidden',
              position: 'relative',
              background: '#242424',
              cursor: 'pointer'
            }}>
              <img
                src={currentTrack.coverImage}
                alt="Similar songs"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%)'
              }} />
              <div style={{ position: 'absolute', bottom: 12, left: 12, right: 12, color: '#fff', fontSize: 12, fontWeight: 700, lineHeight: 1.2 }}>
                Similar to {currentTrack.title}
              </div>
            </div>
          </div>
        </div>

        {/* 11. CREDITS CARD */}
        <div id="credits-section" style={{
          background: 'rgba(255,255,255,0.06)',
          borderRadius: 16,
          padding: 20,
          margin: '16px 0 32px 0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>Credits</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#b08850', cursor: 'pointer' }}>Show all</span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {trackCredits.map((credit, idx) => (
              <div 
                key={idx}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  padding: '12px 0', 
                  borderBottom: idx === trackCredits.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.06)' 
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{credit.name}</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{credit.role}</span>
                </div>
                <button
                  onClick={() => toggleFollowCredit(credit.name)}
                  style={{
                    border: followedCredits[credit.name] ? '1px solid #fff' : '1px solid rgba(255,255,255,0.5)',
                    background: followedCredits[credit.name] ? '#fff' : 'transparent',
                    color: followedCredits[credit.name] ? '#000' : '#fff',
                    borderRadius: 16,
                    padding: '4px 12px',
                    fontSize: 10,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {followedCredits[credit.name] ? 'Following' : 'Follow'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 12. DEVICE SELECTION BOTTOM SHEET */}
        <AnimatePresence>
          {showDeviceSelector && (
            <>
              {/* Backdrop */}
              <div 
                onClick={() => setShowDeviceSelector(false)}
                style={{
                  position: 'fixed',
                  inset: 0,
                  background: 'rgba(0,0,0,0.6)',
                  zIndex: 99999,
                }}
              />
              <motion.div
                initial={{ opacity: 0, y: '100%' }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 150 }}
                style={{
                  position: 'fixed',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: '#1a1a1a',
                  borderTopLeftRadius: 20,
                  borderTopRightRadius: 20,
                  padding: '24px 20px 40px 20px',
                  zIndex: 999999,
                  boxShadow: '0 -10px 30px rgba(0,0,0,0.5)'
                }}
              >
                <div style={{ width: 40, height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 2, margin: '0 auto 20px auto' }} />
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: '0 0 16px 0', textAlign: 'center' }}>
                  Connect to a device
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {availableDevices.map((dev) => (
                    <button
                      key={dev.id}
                      onClick={() => {
                        setActiveDeviceId(dev.id);
                        setActiveDevice(dev.label);
                        setShowDeviceSelector(false);
                      }}
                      style={{
                        background: activeDeviceId === dev.id ? 'rgba(176, 136, 80,0.1)' : 'transparent',
                        border: 'none',
                        color: activeDeviceId === dev.id ? '#b08850' : '#fff',
                        padding: '14px 16px',
                        fontSize: 14,
                        fontWeight: 600,
                        textAlign: 'left',
                        borderRadius: 8,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'background 0.2s'
                      }}
                    >
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '85%' }}>{dev.label}</span>
                      {activeDeviceId === dev.id && (
                        <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#b08850' }} />
                      )}
                    </button>
                  ))}
                  
                  <button
                    onClick={async () => {
                      try {
                        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                        stream.getTracks().forEach(t => t.stop());
                        window.dispatchEvent(new CustomEvent('trigger-device-scan'));
                        toast.success('Audio devices scanned successfully.', {
                          style: { background: '#1a1a1a', color: '#fff', fontSize: '12px' }
                        });
                      } catch (err) {
                        toast.error('Permission denied to scan audio devices.', {
                          style: { background: '#1a1a1a', color: '#fff', fontSize: '12px' }
                        });
                      }
                    }}
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px dashed rgba(255,255,255,0.2)',
                      color: '#a3a3a3',
                      padding: '12px 16px',
                      fontSize: 12,
                      fontWeight: 700,
                      textAlign: 'center',
                      borderRadius: 8,
                      cursor: 'pointer',
                      marginTop: 8,
                      transition: 'background 0.2s'
                    }}
                  >
                    🔍 Scan Bluetooth / WiFi Device Names
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* 13. MOBILE QUEUE DRAWER BOTTOM SHEET */}
        <AnimatePresence>
          {showQueueDrawer && (
            <>
              {/* Backdrop */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowQueueDrawer(false)}
                style={{
                  position: 'fixed',
                  inset: 0,
                  background: '#000',
                  zIndex: 99999,
                }}
              />
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 150 }}
                style={{
                  position: 'fixed',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '82vh',
                  background: '#121212',
                  borderTopLeftRadius: 20,
                  borderTopRightRadius: 20,
                  zIndex: 999999,
                  boxShadow: '0 -10px 30px rgba(0,0,0,0.5)',
                  display: 'flex',
                  flexDirection: 'column',
                  color: '#fff',
                  overflow: 'hidden'
                }}
              >
                {/* Drag Handle */}
                <div style={{ width: 40, height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 2, margin: '12px auto 8px auto', flexShrink: 0 }} />

                {/* Header */}
                <div style={{ padding: '8px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                  <div>
                    <h3 style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: 0 }}>Queue</h3>
                    <p style={{ fontSize: 12, color: '#a3a3a3', margin: '2px 0 0 0' }}>
                      Playing {currentTrack?.albumName ? `from ${currentTrack.albumName}` : 'Liked Songs'}
                    </p>
                  </div>
                  {queue.length > 0 && (
                    <button
                      onClick={clearQueue}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#a3a3a3',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      <Trash2 size={14} /> Clear
                    </button>
                  )}
                </div>

                {/* Now Playing section */}
                {currentTrack && (
                  <div style={{ padding: '0 20px', marginTop: 12, flexShrink: 0 }}>
                    <h4 style={{ fontSize: 11, fontWeight: 700, color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px 0' }}>
                      Now Playing
                    </h4>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: 12,
                      background: 'rgba(255,255,255,0.03)',
                      borderRadius: 8,
                      border: '1px solid rgba(255,255,255,0.05)'
                    }}>
                      <div style={{ width: 44, height: 44, borderRadius: 4, overflow: 'hidden', flexShrink: 0, background: '#282828' }}>
                        <img 
                          src={currentTrack.coverImage} 
                          alt={currentTrack.title} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = ''; // fallback
                          }}
                        />
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <p style={{ color: '#b08850', fontSize: 13, fontWeight: 700, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {currentTrack.title}
                        </p>
                        <p style={{ color: '#a3a3a3', fontSize: 11, fontWeight: 500, margin: '2px 0 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {currentTrack.artistName}
                        </p>
                      </div>
                      <button
                        onClick={togglePlay}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#fff',
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          backgroundColor: '#282828',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        {isPlaying ? <Pause size={14} fill="#fff" color="#fff" /> : <Play size={14} fill="#fff" color="#fff" style={{ marginLeft: 2 }} />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Next Up section title */}
                <div style={{ padding: '0 20px', marginTop: 16, flexShrink: 0 }}>
                  <h4 style={{ fontSize: 11, fontWeight: 700, color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                    {shuffle ? 'Shuffling from:' : 'Next in queue:'}
                  </h4>
                </div>

                {/* Queue list wrapper */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '10px 20px 80px 20px' }} className="hide-scrollbar">
                  {queue.length === 0 ? (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '40px 20px',
                      textAlign: 'center',
                      color: '#525252'
                    }}>
                      <Music size={28} style={{ marginBottom: 8 }} />
                      <p style={{ fontSize: 13, margin: 0 }}>Queue is empty</p>
                    </div>
                  ) : (
                    <Reorder.Group axis="y" values={queue} onReorder={(newQ) => setQueue(newQ)} style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {queue.map((track) => (
                        <Reorder.Item
                          key={track.id}
                          value={track}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            padding: '6px 0',
                            borderBottom: '1px solid rgba(255,255,255,0.02)',
                            background: '#121212',
                            cursor: 'grab',
                            userSelect: 'none'
                          }}
                          whileDrag={{
                            scale: 1.02,
                            background: '#1c1c1c',
                            cursor: 'grabbing'
                          }}
                        >
                          {/* Drag handle */}
                          <div style={{ color: '#525252', display: 'flex', alignItems: 'center' }}>
                            <Menu size={16} />
                          </div>

                          {/* Album cover */}
                          <div style={{ width: 36, height: 36, borderRadius: 4, overflow: 'hidden', flexShrink: 0, background: '#282828' }}>
                            <img 
                              src={track.coverImage} 
                              alt={track.title} 
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          </div>

                          {/* Meta */}
                          <div style={{ minWidth: 0, flex: 1 }} onClick={() => playTrack(track, queue)}>
                            <p style={{
                              color: '#fff',
                              fontSize: 13,
                              fontWeight: 600,
                              margin: 0,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              cursor: 'pointer'
                            }}>
                              {track.title}
                            </p>
                            <p style={{ color: '#a3a3a3', fontSize: 11, margin: '2px 0 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {track.artistName}
                            </p>
                          </div>

                          {/* Duration */}
                          <span style={{ fontSize: 11, color: '#525252', fontVariantNumeric: 'tabular-nums', marginRight: 4 }}>
                            {formatDuration(track.duration)}
                          </span>

                          {/* Remove button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFromQueue(track.id);
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#525252',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: 6
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </Reorder.Item>
                      ))}
                    </Reorder.Group>
                  )}
                </div>

                {/* Sticky Action Bar at the Bottom */}
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: '#181818',
                  borderTop: '1px solid #282828',
                  padding: '16px 20px',
                  display: 'flex',
                  gap: 16,
                  zIndex: 2,
                  flexShrink: 0
                }}>
                  {/* Shuffle Button */}
                  <button
                    onClick={toggleShuffle}
                    style={{
                      flex: 1,
                      height: 44,
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid #282828',
                      borderRadius: 22,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      color: shuffle ? '#b08850' : '#fff',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    <Shuffle size={16} color={shuffle ? '#b08850' : '#fff'} />
                    Shuffle
                  </button>

                  {/* Timer Button */}
                  <button
                    onClick={handleCycleTimer}
                    style={{
                      flex: 1,
                      height: 44,
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid #282828',
                      borderRadius: 22,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      color: sleepTimer ? '#b08850' : '#fff',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    <Clock size={16} color={sleepTimer ? '#b08850' : '#fff'} />
                    {sleepTimer ? `${sleepTimer}m` : 'Timer'}
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: '100%' }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 120 }}
        className="fullscreen-player-container"
        style={{
          background: bgGradient,
          padding: isMobile ? 0 : '30px 40px',
          overflow: 'hidden'
        }}
      >
        {isMobile ? renderMobilePlayer() : renderDesktopPlayer()}
      </motion.div>

      {/* ── Playlist Picker Bottom Sheet ── */}
      <AnimatePresence>
        {showPlaylistPicker && currentTrack && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setShowPlaylistPicker(false); setSearchQuery(''); }}
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
                      tracks: [currentTrack.id],
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
                    toggleLikeSong(currentTrack.id);
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
                  {isLiked ? (
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
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%', background: '#282828', border: 'none',
                      borderRadius: '8px', padding: '10px 12px 10px 38px',
                      color: '#fff', fontSize: '14px', outline: 'none',
                    }}
                  />
                </div>
                <button style={{ background: '#282828', border: 'none', borderRadius: '8px', padding: '0 16px', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                  Sort
                </button>
              </div>

              {/* Scrollable Playlists list */}
              <div style={{ overflowY: 'auto', flex: 1, padding: '0 12px' }}>
                {customPlaylists.filter(pl => pl.title.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                  <div style={{ padding: '32px 24px', textAlign: 'center', color: '#737373', fontSize: 14 }}>
                    No playlists found.
                  </div>
                ) : (
                  customPlaylists
                    .filter(pl => pl.title.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map(pl => {
                      const alreadyAdded = pl.tracks.includes(currentTrack.id);
                      return (
                        <button
                          key={pl.id}
                          onClick={() => {
                            if (alreadyAdded) {
                              removeTrackFromPlaylist(pl.id, currentTrack.id);
                              toast.success(`Removed from "${pl.title}"`, { id: 'playlist-toggle' });
                            } else {
                              addTrackToPlaylist(pl.id, currentTrack.id);
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
                      tracks: [currentTrack.id],
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

      {/* ── Features Options Drawer ── */}
      <AnimatePresence>
        {showFeaturesDrawer && currentTrack && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFeaturesDrawer(false)}
              style={{
                position: 'fixed',
                inset: 0,
                background: '#000',
                zIndex: 20010,
              }}
            />
            {/* Drawer Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 180 }}
              style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                background: '#121212',
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                padding: '8px 0 32px 0',
                zIndex: 20020,
                boxShadow: '0 -10px 30px rgba(0,0,0,0.5)',
                maxHeight: '82vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              {/* Drag Handle */}
              <div style={{ width: 40, height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 2, margin: '8px auto 16px auto', flexShrink: 0 }} />

              {featuresDrawerTab === 'options' ? (
                <>
                  {/* Song Info Header */}
                  <div style={{ display: 'flex', gap: 14, padding: '0 20px 16px 20px', alignItems: 'center', flexShrink: 0 }}>
                    <img
                      src={currentTrack.coverImage}
                      alt={currentTrack.title}
                      style={{ width: 48, height: 48, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }}
                    />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ color: '#fff', fontSize: 16, fontWeight: 700, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentTrack.title}</p>
                      <p style={{ color: '#a3a3a3', fontSize: 12, margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentTrack.artistName} • {currentTrack.albumName || 'Beato'}</p>
                    </div>
                  </div>
                  <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '0 20px 8px 20px', flexShrink: 0 }} />

                  {/* Scrollable list of features */}
                  <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 20px 12px' }} className="hide-scrollbar">
                    {/* Share */}
                    <button
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({
                            title: currentTrack.title,
                            text: `Listen to ${currentTrack.title} by ${currentTrack.artistName} on Beato`,
                            url: window.location.href,
                          }).catch(() => {});
                        } else {
                          navigator.clipboard.writeText(window.location.href);
                          toast.success("Link copied to clipboard!", { id: 'share-toast' });
                        }
                        setShowFeaturesDrawer(false);
                      }}
                      style={itemStyle}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      <Share2 size={20} color="rgba(255,255,255,0.6)" />
                      <span>Share</span>
                    </button>

                    {/* Lyrics Toggle */}
                    <button
                      onClick={() => {
                        setShowAllLyrics(true);
                        setShowFeaturesDrawer(false);
                        setTimeout(() => {
                          const lyricsEl = document.getElementById('lyrics-preview-section');
                          if (lyricsEl) {
                            lyricsEl.scrollIntoView({ behavior: 'smooth' });
                          }
                        }, 150);
                      }}
                      style={itemStyle}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      <Mic size={20} color="rgba(255,255,255,0.6)" />
                      <span>Lyrics • {showAllLyrics ? 'On' : 'Off'}</span>
                    </button>

                    {/* Add to Playlist */}
                    <button
                      onClick={() => {
                        setShowFeaturesDrawer(false);
                        setTimeout(() => {
                          setShowPlaylistPicker(true);
                        }, 100);
                      }}
                      style={itemStyle}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      <PlusCircle size={20} color="rgba(255,255,255,0.6)" />
                      <span>Add to playlist</span>
                    </button>

                    {/* Remove/Add Liked */}
                    <button
                      onClick={() => {
                        toggleLikeSong(currentTrack.id);
                        toast.success(isLiked ? 'Removed from Liked Songs' : 'Added to Liked Songs', { id: 'liked-toggle-toast' });
                        setShowFeaturesDrawer(false);
                      }}
                      style={itemStyle}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      <Heart size={20} fill={isLiked ? '#b08850' : 'none'} color={isLiked ? '#b08850' : 'rgba(255,255,255,0.6)'} />
                      <span>{isLiked ? 'Remove from Liked Songs' : 'Add to Liked Songs'}</span>
                    </button>

                    {/* Go to Queue */}
                    <button
                      onClick={() => {
                        setShowFeaturesDrawer(false);
                        setTimeout(() => {
                          setShowQueueDrawer(true);
                        }, 100);
                      }}
                      style={itemStyle}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      <ListMusic size={20} color="rgba(255,255,255,0.6)" />
                      <span>Go to Queue</span>
                    </button>

                    {/* Go to Album */}
                    <button
                      onClick={() => {
                        setShowFeaturesDrawer(false);
                        onClose();
                        router.push(`/album/${currentTrack.albumId || 'unknown'}`);
                      }}
                      style={itemStyle}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      <Disc size={20} color="rgba(255,255,255,0.6)" />
                      <span>Go to album</span>
                    </button>

                    {/* Go to Artist */}
                    <button
                      onClick={() => {
                        setShowFeaturesDrawer(false);
                        onClose();
                        router.push(`/artist/${currentTrack.artistId || 'unknown'}`);
                      }}
                      style={itemStyle}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      <User size={20} color="rgba(255,255,255,0.6)" />
                      <span>Go to artist</span>
                    </button>

                    {/* Start a Jam */}
                    <button
                      onClick={() => {
                        toast.success("Jam session started! Invite friends to listen together.", { id: 'jam-toast' });
                        setShowFeaturesDrawer(false);
                      }}
                      style={itemStyle}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      <Users size={20} color="rgba(255,255,255,0.6)" />
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <span>Start a Jam</span>
                        <span style={{ background: 'rgba(176, 136, 80, 0.15)', color: '#b08850', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase' }}>Premium</span>
                      </div>
                    </button>

                    {/* Exclude from taste profile */}
                    <button
                      onClick={() => {
                        toast.success("Track excluded from your taste profile.", { id: 'taste-toast' });
                        setShowFeaturesDrawer(false);
                      }}
                      style={itemStyle}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      <XCircle size={20} color="rgba(255,255,255,0.6)" />
                      <span>Exclude track from your taste profile</span>
                    </button>

                    {/* Sleep Timer */}
                    <button
                      onClick={() => {
                        setFeaturesDrawerTab('sleep');
                      }}
                      style={itemStyle}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      <Clock size={20} color="rgba(255,255,255,0.6)" />
                      <span>Sleep timer</span>
                    </button>

                    {/* Go to song radio */}
                    <button
                      onClick={() => {
                        toast.success(`Playing song radio for "${currentTrack.title}"`, { id: 'radio-toast' });
                        setShowFeaturesDrawer(false);
                      }}
                      style={itemStyle}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      <Radio size={20} color="rgba(255,255,255,0.6)" />
                      <span>Go to song radio</span>
                    </button>

                    {/* View song credits */}
                    <button
                      onClick={() => {
                        setShowFeaturesDrawer(false);
                        setTimeout(() => {
                          const creditsEl = document.getElementById('credits-section');
                          if (creditsEl) {
                            creditsEl.scrollIntoView({ behavior: 'smooth' });
                          }
                        }, 150);
                      }}
                      style={itemStyle}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      <Info size={20} color="rgba(255,255,255,0.6)" />
                      <span>View song credits</span>
                    </button>

                    {/* Show Spotify Code */}
                    <button
                      onClick={() => {
                        setShowFeaturesDrawer(false);
                        setTimeout(() => {
                          setShowBeatoCode(true);
                        }, 100);
                      }}
                      style={itemStyle}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      <Barcode size={20} color="rgba(255,255,255,0.6)" />
                      <span>Show Beato Code</span>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Sleep Timer Sub-Menu */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 20px 16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
                    <button
                      onClick={() => setFeaturesDrawerTab('options')}
                      style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 4 }}
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <span style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>Sleep Timer</span>
                  </div>
                  <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px 20px 12px' }}>
                    {[
                      { label: 'Off', val: null },
                      { label: '5 minutes', val: 5 },
                      { label: '15 minutes', val: 15 },
                      { label: '30 minutes', val: 30 },
                      { label: '45 minutes', val: 45 },
                      { label: '60 minutes', val: 60 },
                    ].map((t) => (
                      <button
                        key={t.label}
                        onClick={() => {
                          setSleepTimer(t.val);
                          setShowFeaturesDrawer(false);
                          if (t.val) {
                            toast.success(`Sleep timer set for ${t.label} ⏳`, { id: 'timer-toast' });
                          } else {
                            toast.success('Sleep timer turned off ⏳', { id: 'timer-toast' });
                          }
                        }}
                        style={itemStyle}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'none'}
                      >
                        <span style={{ color: sleepTimer === t.val ? '#b08850' : '#fff', flex: 1 }}>{t.label}</span>
                        {sleepTimer === t.val && <Check size={18} color="#b08850" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Beato Code Modal ── */}
      <AnimatePresence>
        {showBeatoCode && currentTrack && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBeatoCode(false)}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.85)',
                zIndex: 30000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 24,
              }}
            >
              {/* Modal Container */}
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                style={{
                  width: '100%',
                  maxWidth: 320,
                  background: '#181818',
                  borderRadius: 16,
                  border: '1px solid rgba(255,255,255,0.08)',
                  padding: 24,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 20,
                  boxShadow: '0 10px 40px rgba(0,0,0,0.8)',
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: '#fff', margin: 0 }}>Beato Code</h3>
                  <p style={{ fontSize: 11, color: '#a3a3a3', margin: '4px 0 0 0' }}>Scan to play this song instantly</p>
                </div>

                {/* Song Image */}
                <div style={{ width: 160, height: 160, borderRadius: 8, overflow: 'hidden', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.12), 0 3px 8px rgba(0, 0, 0, 0.06)' }}>
                  <img src={currentTrack.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>

                <div style={{ textAlign: 'center', minWidth: 0, width: '100%' }}>
                  <p style={{ color: '#fff', fontSize: 14, fontWeight: 700, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentTrack.title}</p>
                  <p style={{ color: '#a3a3a3', fontSize: 11, margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentTrack.artistName}</p>
                </div>

                {/* Dynamic sound wave code graphic */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 3,
                  width: '100%',
                  height: 48,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: 24,
                  padding: '0 16px',
                }}>
                  {/* Spotify/Beato code style logo */}
                  <span style={{ fontSize: 16, color: '#b08850', fontWeight: 800, marginRight: 6 }}>B</span>
                  {Array.from({ length: 18 }).map((_, idx) => {
                    const heights = [10, 24, 14, 32, 18, 28, 12, 35, 15, 30, 12, 26, 16, 32, 14, 24, 10, 18];
                    const h = heights[idx % heights.length];
                    return (
                      <motion.div
                        key={idx}
                        animate={{ height: [h * 0.7, h, h * 0.7] }}
                        transition={{
                          repeat: Infinity,
                          duration: 1.2 + (idx % 3) * 0.2,
                          ease: "easeInOut",
                          delay: idx * 0.05
                        }}
                        style={{
                          width: 3,
                          borderRadius: 1.5,
                          background: '#b08850',
                        }}
                      />
                    );
                  })}
                </div>

                <button
                  onClick={() => setShowBeatoCode(false)}
                  style={{
                    width: '100%',
                    background: '#fff',
                    color: '#000',
                    border: 'none',
                    borderRadius: 22,
                    height: 44,
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Close
                </button>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

const itemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  width: '100%',
  background: 'none',
  border: 'none',
  padding: '14px 20px',
  color: '#fff',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  textAlign: 'left',
  transition: 'background 0.2s',
  borderRadius: 8,
};

