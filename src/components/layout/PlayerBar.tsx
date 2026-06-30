'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1,
  Volume2, VolumeX, Volume1, Maximize2, ListMusic, Mic2, Heart,
  MoreHorizontal, Laptop2, Music2, Clock, Gauge, Sliders, Headphones, Download, X, Plus
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { usePlayerStore } from '@/store/playerStore';
import { useAuthStore } from '@/store/authStore';
import { useMusicStore } from '@/store/musicStore';
import { useRealtimeStore } from '@/store/realtimeStore';
import { useDownloadStore } from '@/store/downloadStore';
import { usePlaylistStore } from '@/store/playlistStore';
import { formatDuration } from '@/lib/mockData';
import { socketManager } from '@/lib/socket';
import { useSocket } from '@/lib/useSocket';
import FullscreenPlayer from './FullscreenPlayer';
import {
  updateMediaMetadata,
  updateMediaPlaybackState,
  updateMediaPositionState,
  registerMediaActionHandlers
} from '@/lib/mediaSessionHelper';

const GREEN = '#b08850';

const EQ_PRESETS = {
  'Flat': [50, 50, 50, 50, 50],
  'Bass Booster': [85, 70, 50, 50, 30],
  'Treble Booster': [30, 50, 60, 80, 95],
  'Vocal Booster': [20, 40, 85, 85, 40],
  'Electronic': [75, 65, 40, 70, 80],
  'Acoustic': [65, 55, 50, 65, 70]
};

function PlayerTrackImage({ coverImage, title }: { coverImage: string; title: string }) {
  const [hasError, setHasError] = useState(false);
  
  useEffect(() => {
    setHasError(false);
  }, [coverImage]);

  if (!coverImage || hasError || coverImage === 'undefined' || coverImage === 'null') {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Music2 size={20} color="rgba(34,26,21,0.35)" />
      </div>
    );
  }

  const isValidUrl = coverImage.startsWith('data:') || coverImage.startsWith('http:') || coverImage.startsWith('https:') || coverImage.startsWith('/');
  
  if (!isValidUrl) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Music2 size={20} color="rgba(34,26,21,0.35)" />
      </div>
    );
  }

  return (
    <img
      src={coverImage}
      alt={title}
      style={{ objectFit: 'cover', width: '100%', height: '100%' }}
      onError={() => setHasError(true)}
    />
  );
}

export default function PlayerBar() {
  const {
    currentTrack, isPlaying, volume, isMuted, progress, duration,
    shuffle, repeat, showQueue, showLyrics, sleepTimer, crossfade,
    city, country, activeDevice, activeDeviceId, availableDevices,
    togglePlay, setIsPlaying, setVolume, toggleMute,
    setProgress, setDuration, toggleShuffle, cycleRepeat,
    toggleQueue, toggleLyrics, playNext, setSleepTimer, setCrossfade,
    setActiveDevice, setActiveDeviceId, setAvailableDevices
  } = usePlayerStore();

  const { downloadTrack, removeDownloadedTrack, downloadedTrackIds, downloadingIds } = useDownloadStore();
  const { customPlaylists, addTrackToPlaylist, removeTrackFromPlaylist, addPlaylist } = usePlaylistStore();
  const downloaded = currentTrack ? downloadedTrackIds.includes(currentTrack.id) : false;
  const downloading = currentTrack ? downloadingIds.includes(currentTrack.id) : false;
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
            <span style={{ fontSize: 13, fontWeight: 600, color: '#221a15' }}>
              {isLiked ? 'Already in Liked Songs' : 'Added to Liked Songs'}
            </span>
          </div>
          <button
            onClick={(ev) => { ev.stopPropagation(); toast.dismiss(t.id); setShowPlaylistPicker(true); }}
            style={{ background: 'none', border: 'none', color: GREEN, fontSize: 13, fontWeight: 700, cursor: 'pointer', flexShrink: 0, padding: '2px 0' }}
          >
            Change
          </button>
        </div>
      ),
      {
        id: 'liked-toast',
        duration: 2500,
        style: {
          background: '#ffffff',
          color: '#221a15',
          borderRadius: '8px',
          border: '1px solid rgba(43, 34, 26, 0.08)',
          padding: '10px 14px',
          maxWidth: 340,
          fontSize: 13,
          boxShadow: '0 4px 12px rgba(43, 34, 26, 0.05)',
        },
      }
    );
  };

  const audioRef = useRef<HTMLAudioElement>(null);
  const loadedTrackIdRef = useRef<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [localProgress, setLocalProgress] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentSpeed, setCurrentSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showSleepMenu, setShowSleepMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [eqPreset, setEqPreset] = useState<keyof typeof EQ_PRESETS>('Flat');

  useEffect(() => {
    const handleOpen = () => setIsFullscreen(true);
    window.addEventListener('open-fullscreen-player', handleOpen);
    return () => window.removeEventListener('open-fullscreen-player', handleOpen);
  }, []);

  // Enumerate physical audio output devices dynamically
  const updateDevices = useCallback(async (requestPermission = false) => {
    try {
      if (typeof window === 'undefined' || !navigator.mediaDevices) return;
      
      let devices = await navigator.mediaDevices.enumerateDevices();
      let audioOutputs = devices.filter(d => d.kind === 'audiooutput');
      
      const hasLabels = audioOutputs.some(d => d.label);
      if (!hasLabels && requestPermission) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach(track => track.stop());
          devices = await navigator.mediaDevices.enumerateDevices();
          audioOutputs = devices.filter(d => d.kind === 'audiooutput');
        } catch (err) {
          console.warn('Microphone permission denied, device labels will remain generic:', err);
        }
      }
      
      // Get browser device details
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
      
      const browserLabel = `Web Player (${browser} on ${os})`;
      
      const formatted = audioOutputs.map(d => {
        let label = d.label;
        if (!label) {
          if (d.deviceId === 'default') label = `${browserLabel} Speakers`;
          else if (d.deviceId === 'communications') label = 'Communications Device';
          else label = 'External Speakers/Headphones';
        } else {
          if (d.deviceId === 'default') label = `${browserLabel} Speakers (${label})`;
        }
        return {
          id: d.deviceId,
          label: label
        };
      });
      
      usePlayerStore.setState({ availableDevices: formatted });
      
      const { activeDeviceId } = usePlayerStore.getState();
      const activeExists = formatted.some(f => f.id === activeDeviceId);
      if (!activeExists && formatted.length > 0) {
        usePlayerStore.setState({
          activeDeviceId: formatted[0].id,
          activeDevice: formatted[0].label
        });
      } else if (activeExists) {
        const match = formatted.find(f => f.id === activeDeviceId);
        if (match) {
          usePlayerStore.setState({ activeDevice: match.label });
        }
      }
    } catch (err) {
      console.error('Error updating audio devices:', err);
    }
  }, []);

  useEffect(() => {
    updateDevices();

    const handleDeviceChange = () => {
      updateDevices();
    };

    const handleForceScan = () => {
      updateDevices(true);
    };

    if (typeof window !== 'undefined' && navigator.mediaDevices) {
      navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('trigger-device-scan', handleForceScan);
    }

    return () => {
      if (typeof window !== 'undefined' && navigator.mediaDevices) {
        navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('trigger-device-scan', handleForceScan);
      }
    };
  }, [updateDevices]);

  // Set physical audio output device
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !activeDeviceId) return;
    if ('setSinkId' in audio) {
      (audio as any).setSinkId(activeDeviceId)
        .catch((err: any) => {
          console.warn('Audio setSinkId failed:', err);
        });
    }
  }, [activeDeviceId]);

  const liveListeners = useRealtimeStore(state => state.liveListeners);

  const { user, toggleLikeSong } = useAuthStore();
  const isLiked = currentTrack ? user?.likedSongs.includes(currentTrack.id) : false;

  // Track listening history
  useEffect(() => {
    if (currentTrack && isPlaying) {
      useMusicStore.getState().recordListen(currentTrack);
      useMusicStore.getState().addToRecentlyPlayed(currentTrack);
      if (socketManager) {
        socketManager.emit('PLAY_COUNT_UPDATE', { trackId: currentTrack.id });
      }
    }
  }, [currentTrack?.id, isPlaying]);

  // Send active play state heartbeat to track real-time "Listening Now" count
  useEffect(() => {
    if (!currentTrack || !currentTrack.artistId) return;

    // Generate unique session ID per tab/device
    let sessionId = sessionStorage.getItem('beato-session-id');
    if (!sessionId) {
      sessionId = 'sess-' + Math.random().toString(36).substring(2, 11);
      sessionStorage.setItem('beato-session-id', sessionId);
    }

    const artistId = currentTrack.artistId;
    const sendHeartbeat = async (playingState: boolean) => {
      try {
        await fetch('/api/track/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            artistId,
            trackId: currentTrack.id,
            sessionId,
            isPlaying: playingState,
            city,
            country
          }),
        });
      } catch (err) {
        // silent fail
      }
    };

    // Send immediate active/inactive update on play/pause or track switch
    sendHeartbeat(isPlaying);

    if (!isPlaying) return;

    // Periodic heartbeat to keep session alive while playing (polled on server every 40s cutoff)
    const timer = setInterval(() => {
      sendHeartbeat(true);
    }, 15000);

    return () => {
      clearInterval(timer);
      // Immediately notify server that we are no longer playing this track
      sendHeartbeat(false);
    };
  }, [currentTrack?.id, isPlaying]);

  // Send active browsing heartbeat to track global real-time "Active Now" count
  useEffect(() => {
    // Generate unique session ID per tab/device
    let sessionId = sessionStorage.getItem('beato-session-id');
    if (!sessionId) {
      sessionId = 'sess-' + Math.random().toString(36).substring(2, 11);
      sessionStorage.setItem('beato-session-id', sessionId);
    }

    const sendUserHeartbeat = async () => {
      try {
        await fetch('/api/user/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });
      } catch (err) {
        // silent fail
      }
    };

    // Send immediate browsing update and poll every 15 seconds
    sendUserHeartbeat();
    const timer = setInterval(sendUserHeartbeat, 15000);

    return () => clearInterval(timer);
  }, []);

  // Listen for track status updates in real-time (cross-tab)
  useSocket('TRACK_STATUS_UPDATE', ({ trackId, status }) => {
    useMusicStore.getState().syncTrackStatus(trackId, status);
  });

  // Unified Audio Source & State controller
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!currentTrack) {
      audio.src = '';
      loadedTrackIdRef.current = null;
      audio.pause();
      setProgress(0);
      setLocalProgress(0);
      return;
    }

    let active = true;

    const loadAudio = async () => {
      let resolvedUrl = currentTrack.audioUrl;
      try {
        const { getOfflineAudio } = await import('@/lib/offlineDb');
        const cachedBlob = await getOfflineAudio(currentTrack.id);
        if (cachedBlob && active) {
          resolvedUrl = URL.createObjectURL(cachedBlob);
          console.log(`[PlayerBar] Playing offline cached audio for track: ${currentTrack.id}`);
        }
      } catch (err) {
        console.error('Failed to load offline audio:', err);
      }

      if (!active) return;

      // Resolve absolute path if relative
      if (resolvedUrl.startsWith('/') && typeof window !== 'undefined') {
        resolvedUrl = `${window.location.origin}${resolvedUrl}`;
      }

      // Determine if current audio src has changed
      let srcChanged = false;
      if (!audio.src || loadedTrackIdRef.current !== currentTrack.id) {
        srcChanged = true;
      }

      if (srcChanged) {
        // Clean up previous blob URL to prevent memory leak
        if (audio.src && audio.src.startsWith('blob:')) {
          URL.revokeObjectURL(audio.src);
        }

        audio.src = resolvedUrl;
        loadedTrackIdRef.current = currentTrack.id;
        setProgress(0);
        setLocalProgress(0);
        setDuration(currentTrack.duration || 0);
      }

      // Apply properties
      audio.volume = isMuted ? 0 : volume;
      audio.playbackRate = currentSpeed;

      if (isPlaying) {
        audio.play().catch((err) => {
          console.warn('Playback request failed or interrupted:', err);
          if (err.name === 'NotAllowedError') {
            toast.error('Autoplay blocked. Tap Play to start music!', { id: 'autoplay-toast' });
            setIsPlaying(false);
          }
        });
      } else {
        audio.pause();
      }
    };

    loadAudio();

    return () => {
      active = false;
    };
  }, [currentTrack?.id, isPlaying, volume, isMuted, currentSpeed, setProgress, setIsPlaying, setDuration]);

  // Media Session API for Lock Screen & Status Bar controls (Web + Native via @capgo/capacitor-media-session)
  useEffect(() => {
    if (!currentTrack) return;
    updateMediaMetadata({
      title: currentTrack.title,
      artistName: currentTrack.artistName,
      albumName: currentTrack.albumName,
      coverImage: currentTrack.coverImage
    });
  }, [currentTrack]);

  // Update Media Session Playback State (Web + Native)
  useEffect(() => {
    updateMediaPlaybackState(isPlaying);
  }, [isPlaying]);

  // Update Media Session Position/Progress State (Web + Native)
  useEffect(() => {
    if (!currentTrack) return;
    updateMediaPositionState({
      duration: duration || currentTrack.duration || 0,
      position: localProgress || 0,
      playbackRate: currentSpeed || 1
    });
  }, [localProgress, duration, currentSpeed, currentTrack]);

  // Register Media Session Action Handlers (Web + Native via @capgo/capacitor-media-session)
  useEffect(() => {
    let cleanup: (() => void) | undefined;

    const setup = async () => {
      cleanup = await registerMediaActionHandlers({
        onPlay: () => setIsPlaying(true),
        onPause: () => setIsPlaying(false),
        onPrevious: () => usePlayerStore.getState().playPrevious(),
        onNext: () => usePlayerStore.getState().playNext(),
        onSeekTo: (time: number) => {
          if (audioRef.current) {
            audioRef.current.currentTime = time;
          }
          setProgress(time);
          setLocalProgress(time);
        }
      });
    };

    setup();

    return () => {
      cleanup?.();
    };
  }, [setIsPlaying, setProgress]);

  // Sleep Timer countdown
  useEffect(() => {
    if (sleepTimer === null) return;
    const ms = sleepTimer * 60 * 1000;
    const timeoutId = setTimeout(() => {
      setIsPlaying(false);
      if (audioRef.current) audioRef.current.pause();
      setSleepTimer(null);
    }, ms);
    return () => clearTimeout(timeoutId);
  }, [sleepTimer, setIsPlaying, setSleepTimer]);

  // Seeking via custom event
  useEffect(() => {
    const handleSeek = (e: Event) => {
      const customEvent = e as CustomEvent<number>;
      if (audioRef.current) {
        audioRef.current.currentTime = customEvent.detail;
        setProgress(customEvent.detail);
        setLocalProgress(customEvent.detail);
      }
    };
    window.addEventListener('seek-audio', handleSeek);
    return () => window.removeEventListener('seek-audio', handleSeek);
  }, [setProgress]);

  // Speed changes via custom event
  useEffect(() => {
    const handleSpeed = (e: Event) => {
      const customEvent = e as CustomEvent<number>;
      setCurrentSpeed(customEvent.detail);
      if (audioRef.current) {
        audioRef.current.playbackRate = customEvent.detail;
      }
    };
    window.addEventListener('change-playback-speed', handleSpeed);
    return () => window.removeEventListener('change-playback-speed', handleSpeed);
  }, []);

  const handleTimeUpdate = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || isDragging) return;
    setProgress(audio.currentTime);
    setDuration(audio.duration || currentTrack?.duration || 0);
    setLocalProgress(audio.currentTime);
  }, [isDragging, currentTrack?.duration, setProgress, setDuration]);

  const handleEnded = useCallback(() => {
    if (repeat === 'one') {
      audioRef.current!.currentTime = 0;
      audioRef.current!.play();
    } else {
      playNext();
    }
  }, [repeat, playNext]);

  const handleLoadedMetadata = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      setDuration(audio.duration || currentTrack?.duration || 0);
    }
  }, [currentTrack?.duration, setDuration]);

  const handlePlay = useCallback(() => {
    if (!isPlaying) setIsPlaying(true);
  }, [isPlaying, setIsPlaying]);

  const handlePause = useCallback(() => {
    if (isPlaying) setIsPlaying(false);
  }, [isPlaying, setIsPlaying]);

  const handleAudioError = useCallback((e: Event) => {
    const audio = e.target as HTMLAudioElement;
    console.error('Audio element error:', audio.error);
    toast.error('Unable to load or play audio track.', { id: 'audio-error-toast' });
    setIsPlaying(false);
  }, [setIsPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('durationchange', handleLoadedMetadata);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('error', handleAudioError);
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('durationchange', handleLoadedMetadata);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('error', handleAudioError);
    };
  }, [handleTimeUpdate, handleEnded, handleLoadedMetadata, handlePlay, handlePause, handleAudioError]);

  const progressPercent = duration > 0 ? (localProgress / duration) * 100 : 0;
  const volumePercent = isMuted ? 0 : volume * 100;
  const VolumeIcon = isMuted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  const btnStyle = (active?: boolean): React.CSSProperties => ({
    background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 4,
    color: active ? GREEN : '#87786c', transition: 'color 0.15s',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  });

  if (!currentTrack) return null;

  // Progress circle geometry math for mobile player (matching second ref image capsule layout)
  const circleRadius = 23;
  const strokeWidth = 2.5;
  const normalizedRadius = circleRadius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const currentProgress = localProgress || 0;
  const strokeDashoffset = duration > 0 ? circumference - (currentProgress / duration) * circumference : circumference;

  return (
    <div className="app-player">
      <audio ref={audioRef} preload="metadata" />

      {/* ── Desktop Player Layout ── */}
      <div className="desktop-player-layout">
        {/* ── Track Info (Left Column) ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: '1 1 0%', minWidth: 0, justifyContent: 'flex-start' }}>
          {/* Album art */}
          <div style={{
            width: 56, height: 56, borderRadius: 8, overflow: 'hidden', flexShrink: 0, position: 'relative',
            background: `hsl(${(currentTrack.id.charCodeAt(0) * 37) % 360}, 50%, 25%)`,
            boxShadow: isPlaying ? `0 0 20px rgba(176,136,80,0.3), 0 4px 20px rgba(43,34,26,0.1)` : '0 4px 16px rgba(43,34,26,0.1)',
            transition: 'box-shadow 0.4s',
          }}>
            <PlayerTrackImage coverImage={currentTrack.coverImage} title={currentTrack.title} />
            {/* Spinning vinyl overlay when playing */}
            {isPlaying && (
              <div style={{
                position: 'absolute', inset: 0, borderRadius: 8,
                background: 'radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.15) 100%)',
                animation: 'spin 4s linear infinite',
              }} />
            )}
          </div>

          <div style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Link href={`/album/${currentTrack.albumId}`} style={{ textDecoration: 'none' }}>
              <p style={{ color: '#221a15', fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer', margin: 0 }}
                onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}>
                {currentTrack.title}
              </p>
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
              <Link href={`/artist/${currentTrack.artistId}`} style={{ textDecoration: 'none', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <span style={{ color: '#87786c', fontSize: 12, cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#221a15')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#87786c')}>
                  {currentTrack.artistName}
                </span>
              </Link>
            </div>
            {/* Live Listener Count Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%', backgroundColor: GREEN,
                boxShadow: '0 0 8px ' + GREEN, display: 'inline-block',
                animation: 'pulse 1.5s ease-in-out infinite'
              }} />
              <span style={{ color: GREEN, fontSize: 11, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
                {(liveListeners[currentTrack.id] || 0).toLocaleString()} live
              </span>
            </div>
          </div>

          <button onClick={() => currentTrack && toggleLikeSong(currentTrack.id)}
            style={{ ...btnStyle(!!isLiked), flexShrink: 0 }}
            onMouseEnter={e => (e.currentTarget.style.color = isLiked ? GREEN : '#221a15')}
            onMouseLeave={e => (e.currentTarget.style.color = isLiked ? GREEN : '#87786c')}>
            <Heart size={16} fill={isLiked ? GREEN : 'none'} color={isLiked ? GREEN : undefined} />
          </button>

          <button style={{ ...btnStyle(), flexShrink: 0 }}
            onMouseEnter={e => (e.currentTarget.style.color = '#221a15')}
            onMouseLeave={e => (e.currentTarget.style.color = '#87786c')}>
            <MoreHorizontal size={16} />
          </button>
        </div>

        {/* ── Player Controls (Center Column) ── */}
        <div style={{ flex: '1 1 0%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, maxWidth: 650, width: '100%', justifyContent: 'center' }}>
          {/* Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <button onClick={toggleShuffle} style={btnStyle(shuffle)} title="Shuffle"
              onMouseEnter={e => (e.currentTarget.style.color = shuffle ? GREEN : '#221a15')}
              onMouseLeave={e => (e.currentTarget.style.color = shuffle ? GREEN : '#87786c')}>
              <Shuffle size={16} />
            </button>

            <button onClick={() => usePlayerStore.getState().playPrevious()} style={btnStyle()}
              onMouseEnter={e => (e.currentTarget.style.color = '#221a15')}
              onMouseLeave={e => (e.currentTarget.style.color = '#87786c')}>
              <SkipBack size={20} fill="currentColor" />
            </button>

            <motion.button whileTap={{ scale: 0.9 }} onClick={togglePlay}
              style={{
                width: 38, height: 38, borderRadius: '50%', background: '#221a15',
                border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(43, 34, 26, 0.15)', transition: 'transform 0.15s',
              }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.transform = 'scale(1.06)')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.transform = 'scale(1)')}>
              {isPlaying ? <Pause size={18} fill="white" color="white" /> : <Play size={18} fill="white" color="white" />}
            </motion.button>

            <button onClick={() => usePlayerStore.getState().playNext()} style={btnStyle()}
              onMouseEnter={e => (e.currentTarget.style.color = '#221a15')}
              onMouseLeave={e => (e.currentTarget.style.color = '#87786c')}>
              <SkipForward size={20} fill="currentColor" />
            </button>

            <button onClick={cycleRepeat} style={btnStyle(repeat !== 'none')} title="Repeat"
              onMouseEnter={e => (e.currentTarget.style.color = repeat !== 'none' ? GREEN : '#221a15')}
              onMouseLeave={e => (e.currentTarget.style.color = repeat !== 'none' ? GREEN : '#87786c')}>
              {repeat === 'one' ? <Repeat1 size={16} /> : <Repeat size={16} />}
            </button>
          </div>

          {/* Progress Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
            <span style={{ color: '#87786c', fontSize: 11, fontVariantNumeric: 'tabular-nums', width: 32, textAlign: 'right', flexShrink: 0 }}>
              {formatDuration(localProgress)}
            </span>
            <div style={{ flex: 1, position: 'relative', height: 20, display: 'flex', alignItems: 'center' }}>
              <input type="range" min={0} max={duration || currentTrack.duration} value={localProgress}
                onChange={e => setLocalProgress(Number(e.target.value))}
                onMouseDown={() => setIsDragging(true)}
                onTouchStart={() => setIsDragging(true)}
                onMouseUp={e => {
                  const val = Number((e.target as HTMLInputElement).value);
                  if (audioRef.current) audioRef.current.currentTime = val;
                  setProgress(val); setIsDragging(false);
                }}
                onTouchEnd={e => {
                  const val = Number((e.target as HTMLInputElement).value);
                  if (audioRef.current) audioRef.current.currentTime = val;
                  setProgress(val); setIsDragging(false);
                }}
                onTouchCancel={() => setIsDragging(false)}
                className="progress-bar"
                style={{ '--progress': `${progressPercent}%`, width: '100%' } as React.CSSProperties} />
            </div>
            <span style={{ color: '#87786c', fontSize: 11, fontVariantNumeric: 'tabular-nums', width: 32, flexShrink: 0 }}>
              {formatDuration(duration || currentTrack.duration)}
            </span>
          </div>
        </div>

        {/* ── Extra Controls (Right Column) ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: '1 1 0%', justifyContent: 'flex-end', position: 'relative' }}>
          {/* Speed Selector Trigger */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => {
                setShowSpeedMenu(!showSpeedMenu);
                setShowSleepMenu(false);
                setShowSettings(false);
              }}
              style={btnStyle(currentSpeed !== 1)}
              title="Playback Speed"
              onMouseEnter={e => (e.currentTarget.style.color = currentSpeed !== 1 ? GREEN : '#221a15')}
              onMouseLeave={e => (e.currentTarget.style.color = currentSpeed !== 1 ? GREEN : '#87786c')}
            >
              <Gauge size={16} />
              <span style={{ fontSize: 10, fontWeight: 700, marginLeft: 2 }}>{currentSpeed}x</span>
            </button>

            <AnimatePresence>
              {showSpeedMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  style={{
                    position: 'absolute',
                    bottom: 'calc(100% + 12px)',
                    right: 0,
                    background: '#ffffff',
                    border: '1px solid rgba(43, 34, 26, 0.08)',
                    borderRadius: 8,
                    overflow: 'hidden',
                    zIndex: 100,
                    display: 'flex',
                    flexDirection: 'column',
                    width: 90,
                    boxShadow: '0 8px 24px rgba(43,34,26,0.1)'
                  }}
                >
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setCurrentSpeed(s);
                        window.dispatchEvent(new CustomEvent('change-playback-speed', { detail: s }));
                        setShowSpeedMenu(false);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: currentSpeed === s ? GREEN : '#221a15',
                        padding: '8px 12px',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        textAlign: 'center',
                        backgroundColor: currentSpeed === s ? 'rgba(176,136,80,0.1)' : 'transparent',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={e => {
                        if (currentSpeed !== s) e.currentTarget.style.backgroundColor = 'rgba(43, 34, 26, 0.05)';
                      }}
                      onMouseLeave={e => {
                        if (currentSpeed !== s) e.currentTarget.style.backgroundColor = 'transparent';
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
              onClick={() => {
                setShowSleepMenu(!showSleepMenu);
                setShowSpeedMenu(false);
                setShowSettings(false);
              }}
              style={btnStyle(sleepTimer !== null)}
              title="Sleep Timer"
              onMouseEnter={e => (e.currentTarget.style.color = sleepTimer !== null ? GREEN : '#221a15')}
              onMouseLeave={e => (e.currentTarget.style.color = sleepTimer !== null ? GREEN : '#87786c')}
            >
              <Clock size={16} />
              {sleepTimer && <span style={{ fontSize: 10, fontWeight: 700, marginLeft: 2 }}>{sleepTimer}m</span>}
            </button>

            <AnimatePresence>
              {showSleepMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  style={{
                    position: 'absolute',
                    bottom: 'calc(100% + 12px)',
                    right: 0,
                    background: '#ffffff',
                    border: '1px solid rgba(43, 34, 26, 0.08)',
                    borderRadius: 8,
                    overflow: 'hidden',
                    zIndex: 100,
                    display: 'flex',
                    flexDirection: 'column',
                    width: 140,
                    boxShadow: '0 8px 24px rgba(43,34,26,0.1)'
                  }}
                >
                  <span style={{ fontSize: 10, color: '#87786c', padding: '6px 12px', fontWeight: 600, borderBottom: '1px solid rgba(43, 34, 26, 0.08)', textTransform: 'uppercase' }}>
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
                        color: sleepTimer === t.val ? GREEN : '#221a15',
                        padding: '8px 12px',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        textAlign: 'left',
                        backgroundColor: sleepTimer === t.val ? 'rgba(176,136,80,0.1)' : 'transparent',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={e => {
                        if (sleepTimer !== t.val) e.currentTarget.style.backgroundColor = 'rgba(43, 34, 26, 0.05)';
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

          {/* Crossfade Sliders Settings */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => {
                setShowSettings(!showSettings);
                setShowSpeedMenu(false);
                setShowSleepMenu(false);
              }}
              style={btnStyle(showSettings)}
              title="Playback Settings"
              onMouseEnter={e => (e.currentTarget.style.color = '#221a15')}
              onMouseLeave={e => (e.currentTarget.style.color = showSettings ? GREEN : '#87786c')}
            >
              <Sliders size={16} />
            </button>

            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  style={{
                    position: 'absolute',
                    bottom: 'calc(100% + 12px)',
                    right: 0,
                    background: '#ffffff',
                    border: '1px solid rgba(43, 34, 26, 0.08)',
                    borderRadius: 10,
                    padding: 16,
                    zIndex: 100,
                    width: 220,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    boxShadow: '0 8px 24px rgba(43,34,26,0.1)'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#87786c', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
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
                        accentColor: GREEN,
                        cursor: 'pointer'
                      }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#87786c', marginTop: -4 }}>
                      <span>0s (Off)</span>
                      <span>12s</span>
                    </div>
                  </div>

                  {/* Equalizer Section */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px solid rgba(43, 34, 26, 0.08)', paddingTop: 12 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#87786c', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Equalizer
                    </span>
                    <select
                      value={eqPreset}
                      onChange={(e) => {
                        const selected = e.target.value as keyof typeof EQ_PRESETS;
                        setEqPreset(selected);
                        toast.success(`EQ Preset: ${selected}`, {
                          id: 'eq-toast',
                          icon: '🎚️',
                          style: {
                            borderRadius: '8px',
                            background: '#ffffff',
                            color: '#221a15',
                            border: '1px solid rgba(176, 136, 80, 0.2)',
                            fontSize: '12px',
                            boxShadow: '0 4px 12px rgba(43, 34, 26, 0.05)',
                          },
                        });
                      }}
                      style={{
                        background: '#f4eede',
                        color: '#221a15',
                        border: '1px solid rgba(43, 34, 26, 0.1)',
                        borderRadius: 6,
                        padding: '6px 10px',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        outline: 'none',
                        width: '100%'
                      }}
                    >
                      {Object.keys(EQ_PRESETS).map(presetName => (
                        <option key={presetName} value={presetName} style={{ background: '#ffffff' }}>
                          {presetName}
                        </option>
                      ))}
                    </select>

                    {/* EQ Bands Visualization */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-end',
                      height: 38,
                      background: '#fbf9f5',
                      borderRadius: 6,
                      padding: '8px 14px',
                      border: '1px solid rgba(43, 34, 26, 0.08)',
                      marginTop: 4
                    }}>
                      {EQ_PRESETS[eqPreset].map((level, i) => (
                        <motion.div
                          key={i}
                          animate={isPlaying ? {
                            height: [`${level * 0.8}%`, `${Math.min(100, level * 1.2)}%`, `${level}%`]
                          } : { height: `${level}%` }}
                          transition={isPlaying ? {
                            repeat: Infinity,
                            duration: 0.8 + (i * 0.15) + Math.random() * 0.3,
                            ease: "easeInOut"
                          } : { duration: 0.3 }}
                          style={{
                            width: 12,
                            background: `linear-gradient(0deg, ${GREEN} 0%, #ebdcb9 100%)`,
                            borderRadius: 2,
                            boxShadow: `0 0 6px rgba(176, 136, 80, 0.15)`
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button onClick={toggleLyrics} style={btnStyle(showLyrics)} title="Lyrics"
            onMouseEnter={e => (e.currentTarget.style.color = showLyrics ? GREEN : '#221a15')}
            onMouseLeave={e => (e.currentTarget.style.color = showLyrics ? GREEN : '#87786c')}>
            <Mic2 size={16} />
          </button>

          <button onClick={toggleQueue} style={btnStyle(showQueue)} title="Queue"
            onMouseEnter={e => (e.currentTarget.style.color = showQueue ? GREEN : '#221a15')}
            onMouseLeave={e => (e.currentTarget.style.color = showQueue ? GREEN : '#87786c')}>
            <ListMusic size={16} />
          </button>

          <button style={btnStyle()} title="Devices"
            onMouseEnter={e => (e.currentTarget.style.color = '#221a15')}
            onMouseLeave={e => (e.currentTarget.style.color = '#87786c')}>
            <Laptop2 size={16} />
          </button>

          {/* Volume */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button onClick={toggleMute} style={btnStyle()}
              onMouseEnter={e => (e.currentTarget.style.color = '#221a15')}
              onMouseLeave={e => (e.currentTarget.style.color = '#87786c')}>
              <VolumeIcon size={16} />
            </button>
            <div style={{ width: 90, position: 'relative', height: 20, display: 'flex', alignItems: 'center' }}>
              <input type="range" min={0} max={1} step={0.01} value={isMuted ? 0 : volume}
                onChange={e => setVolume(Number(e.target.value))}
                className="volume-bar"
                style={{ '--vol': `${volumePercent}%`, width: '100%' } as React.CSSProperties} />
            </div>
          </div>

          <button onClick={() => setIsFullscreen(true)} style={btnStyle()} title="Fullscreen"
            onMouseEnter={e => (e.currentTarget.style.color = '#221a15')}
            onMouseLeave={e => (e.currentTarget.style.color = '#87786c')}>
            <Maximize2 size={14} />
          </button>
        </div>
      </div>

      {/* ── Mobile Player Layout ── */}
      <div 
        className="mobile-player-layout" 
        onClick={() => setIsFullscreen(true)}
        style={{ cursor: 'pointer' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
          {/* Circular Album Cover Art with progress ring (48px outer, 38px inner) */}
          <div style={{ position: 'relative', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg height={48} width={48} style={{ position: 'absolute', transform: 'rotate(-90deg)', zIndex: 1, pointerEvents: 'none' }}>
              <circle
                stroke="rgba(176, 136, 80, 0.15)"
                fill="transparent"
                strokeWidth={2}
                r={normalizedRadius}
                cx={24}
                cy={24}
              />
              <circle
                stroke="var(--color-ss-secondary, #8c6c44)"
                fill="transparent"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference + ' ' + circumference}
                style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.1s linear' }}
                strokeLinecap="round"
                r={normalizedRadius}
                cx={24}
                cy={24}
              />
            </svg>
            <div style={{ width: 38, height: 38, borderRadius: '50%', overflow: 'hidden', position: 'relative', zIndex: 2, border: '1px solid rgba(176, 136, 80, 0.15)' }}>
              <PlayerTrackImage coverImage={currentTrack.coverImage} title={currentTrack.title} />
            </div>
          </div>

          {/* Title & Artist */}
          <div style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <p style={{
              color: '#221a15',
              fontWeight: '800',
              fontSize: 14,
              margin: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontFamily: 'Outfit, sans-serif'
            }}>{currentTrack.title}</p>
            <p style={{
              color: '#87786c',
              fontWeight: '500',
              fontSize: 12,
              margin: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontFamily: 'Outfit, sans-serif'
            }}>{currentTrack.artistName}</p>
          </div>
        </div>

        {/* Action Buttons (Playback Skip & Play/Pause controls + Plus & Download symbols) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} onClick={e => e.stopPropagation()}>
          {/* Plus / Add to Playlist Button */}
          <button
            onClick={e => { e.stopPropagation(); setShowPlaylistPicker(true); }}
            style={{ background: 'transparent', border: 'none', padding: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#87786c', transition: 'color 0.15s' }}
            title="Add to Playlist"
            onMouseEnter={e => (e.currentTarget.style.color = '#221a15')}
            onMouseLeave={e => (e.currentTarget.style.color = '#87786c')}
          >
            <Plus size={18} strokeWidth={1.8} />
          </button>

          {/* Download Button */}
          <button
            onClick={handleDownloadClick}
            style={{
              background: 'transparent',
              border: 'none',
              padding: 4,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              color: downloading ? 'var(--color-ss-secondary, #8c6c44)' : downloaded ? 'var(--color-ss-secondary, #8c6c44)' : '#87786c',
              transition: 'color 0.15s',
              position: 'relative'
            }}
            title={downloaded ? "Remove download" : downloading ? "Downloading..." : "Download"}
            onMouseEnter={e => { if (!downloaded && !downloading) e.currentTarget.style.color = '#221a15'; }}
            onMouseLeave={e => { if (!downloaded && !downloading) e.currentTarget.style.color = '#87786c'; }}
          >
            {downloading ? (
              <div style={{
                width: 18, height: 18, border: '2px solid rgba(176,136,80,0.2)', borderTop: '2px solid var(--color-ss-secondary, #8c6c44)',
                borderRadius: '50%', animation: 'spin 0.7s linear infinite'
              }} />
            ) : (
              <Download size={18} strokeWidth={1.8} />
            )}
          </button>

          {/* Previous Button */}
          <button
            onClick={e => { e.stopPropagation(); usePlayerStore.getState().playPrevious(); }}
            style={{ background: 'transparent', border: 'none', padding: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#221a15', transition: 'color 0.15s' }}
            title="Previous"
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-ss-secondary, #8c6c44)')}
            onMouseLeave={e => (e.currentTarget.style.color = '#221a15')}
          >
            <SkipBack size={18} strokeWidth={1.8} fill="none" />
          </button>

          {/* Play/Pause Button */}
          <button
            onClick={e => { e.stopPropagation(); togglePlay(); }}
            style={{ background: 'transparent', border: 'none', padding: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#221a15', transition: 'color 0.15s' }}
            title={isPlaying ? "Pause" : "Play"}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-ss-secondary, #8c6c44)')}
            onMouseLeave={e => (e.currentTarget.style.color = '#221a15')}
          >
            {isPlaying ? (
              <Pause size={20} strokeWidth={1.8} fill="none" />
            ) : (
              <Play size={20} strokeWidth={1.8} fill="none" />
            )}
          </button>

          {/* Next Button */}
          <button
            onClick={e => { e.stopPropagation(); playNext(); }}
            style={{ background: 'transparent', border: 'none', padding: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#221a15', transition: 'color 0.15s' }}
            title="Next"
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-ss-secondary, #8c6c44)')}
            onMouseLeave={e => (e.currentTarget.style.color = '#221a15')}
          >
            <SkipForward size={18} strokeWidth={1.8} fill="none" />
          </button>
        </div>
      </div>

      {/* ── Playlist Picker Bottom Sheet ── */}
      <AnimatePresence>
        {showPlaylistPicker && currentTrack && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setShowPlaylistPicker(false); setSearchQuery(''); }}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(43,34,26,0.3)',
              backdropFilter: 'blur(4px)',
              zIndex: 20000, display: 'flex', alignItems: 'flex-end',
            }}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 250 }}
              onClick={e => e.stopPropagation()}
              style={{
                width: '100%', background: '#ffffff',
                borderRadius: '24px 24px 0 0', padding: '8px 0 32px',
                display: 'flex', flexDirection: 'column', gap: 0,
                boxShadow: '0 -10px 40px rgba(43,34,26,0.08)',
                maxHeight: '80vh', overflow: 'hidden',
              }}
            >
              {/* Drag Handle Indicator */}
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(43,34,26,0.1)', margin: '8px auto 16px', flexShrink: 0 }} />

              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px 16px', flexShrink: 0 }}>
                <span style={{ fontSize: 18, fontWeight: 800, color: '#221a15', fontFamily: 'Outfit, sans-serif' }}>Saved in</span>
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
                  style={{ background: 'none', border: 'none', color: GREEN, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
                >
                  New playlist
                </button>
              </div>

              {/* Liked Songs Row (Current saved state indicator) */}
              <div style={{ padding: '0 24px 16px', borderBottom: '1px solid rgba(43,34,26,0.08)', flexShrink: 0 }}>
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
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(43,34,26,0.04)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <div style={{
                    width: 44, height: 44, borderRadius: 6, flexShrink: 0,
                    background: 'linear-gradient(135deg, #b08850, #ebdcb9)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Heart size={20} fill="#fff" color="#fff" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: '#221a15', fontSize: 14, fontWeight: 600, margin: 0 }}>Liked Songs</p>
                  </div>
                  {isLiked ? (
                    <div style={{
                      width: 22, height: 22, borderRadius: '50%', background: GREEN,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  ) : (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(43,34,26,0.4)" strokeWidth="2">
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
                  <svg style={{ position: 'absolute', left: 12, color: 'rgba(43,34,26,0.4)' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  <input
                    type="text"
                    placeholder="Find playlist"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%', background: '#f4eede', border: 'none',
                      borderRadius: '8px', padding: '10px 12px 10px 38px',
                      color: '#221a15', fontSize: '14px', outline: 'none',
                    }}
                  />
                </div>
                <button style={{ background: '#f4eede', border: 'none', borderRadius: '8px', padding: '0 16px', color: '#221a15', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                  Sort
                </button>
              </div>

              {/* Scrollable Playlists list */}
              <div style={{ overflowY: 'auto', flex: 1, padding: '0 12px' }}>
                {customPlaylists.filter(pl => pl.title.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                  <div style={{ padding: '32px 24px', textAlign: 'center', color: '#87786c', fontSize: 14 }}>
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
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(43,34,26,0.04)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'none'}
                        >
                          <div style={{
                            width: 44, height: 44, borderRadius: 6, flexShrink: 0,
                            background: pl.gradientCss || 'linear-gradient(135deg,#b08850,#ebdcb9)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                          }}>
                            {pl.coverImage ? (
                              <img src={pl.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
                            )}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ color: alreadyAdded ? GREEN : '#221a15', fontSize: 14, fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pl.title}</p>
                            <p style={{ color: '#87786c', fontSize: 12, margin: '2px 0 0', }}>{pl.tracks.length === 0 ? 'Empty' : `${pl.tracks.length} song${pl.tracks.length === 1 ? '' : 's'}`}</p>
                          </div>
                          {alreadyAdded ? (
                            <div style={{
                              width: 22, height: 22, borderRadius: '50%', background: GREEN,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            </div>
                          ) : (
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(43,34,26,0.4)" strokeWidth="2">
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
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(43,34,26,0.04)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <div style={{
                    width: 44, height: 44, borderRadius: 6, flexShrink: 0,
                    background: '#f4eede', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(43,34,26,0.6)" strokeWidth="2.5">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: '#221a15', fontSize: 14, fontWeight: 600, margin: 0 }}>New playlist</p>
                  </div>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isFullscreen && (
          <FullscreenPlayer onClose={() => setIsFullscreen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
