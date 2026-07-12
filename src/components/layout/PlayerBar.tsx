'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1,
  Volume2, VolumeX, Volume1, Maximize2, ListMusic, Mic2, Heart,
  MoreHorizontal, Laptop2, Music2, Clock, Gauge, Sliders, Headphones, Download, X, Plus, PlusCircle, Smartphone, Check
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
import { getOfflineAudio } from '@/lib/offlineDb';
import { useGestureControls } from '@/hooks/useGestureControls';
import { getLyricsForTrack, parseLrc } from '@/lib/lyrics';
import { useIsMobile } from '@/hooks/useIsMobile';
import {
  updateMediaMetadata,
  updateMediaPlaybackState,
  updateMediaPositionState,
  registerMediaActionHandlers
} from '@/lib/mediaSessionHelper';

const GREEN = 'var(--color-ss-primary, #0f5132)';

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

const lyricsClientCache = new Map<string, any>();

export default function PlayerBar() {
  const {
    currentTrack, isPlaying, volume, isMuted, progress, duration,
    shuffle, repeat, showQueue, showLyrics, sleepTimer, crossfade,
    city, country, activeDevice, activeDeviceId, availableDevices,
    togglePlay, setIsPlaying, setVolume, toggleMute,
    setProgress, setDuration, toggleShuffle, cycleRepeat,
    toggleQueue, toggleLyrics, playNext, setSleepTimer, setCrossfade,
    setActiveDevice, setActiveDeviceId, setAvailableDevices,
    prevSongTimestamps, gestureControlsEnabled, setGestureControlsEnabled
  } = usePlayerStore();

  const { user, toggleLikeSong } = useAuthStore();
  const isFree = user?.subscription === 'free';
  const now = Date.now();
  const oneHourAgo = now - 3600000;
  const isPrevLocked = isFree && (prevSongTimestamps || []).filter((t: number) => t > oneHourAgo).length >= 10;

  const { downloadTrack, removeDownloadedTrack, downloadedTrackIds, downloadingIds } = useDownloadStore();
  const { 
    customPlaylists, 
    addTrackToPlaylist, 
    removeTrackFromPlaylist, 
    addPlaylist, 
    playlistPickerTrack, 
    closePlaylistPicker 
  } = usePlaylistStore();
  const { getAllTracks } = useMusicStore();
  const allTracks = getAllTracks();
  const downloaded = currentTrack ? downloadedTrackIds.includes(currentTrack.id) : false;
  const downloading = currentTrack ? downloadingIds.includes(currentTrack.id) : false;
  const isMobile = useIsMobile();
  const [showPlaylistPicker, setShowPlaylistPicker] = useState(false);
  const activePickerTrack = playlistPickerTrack || (showPlaylistPicker ? currentTrack : null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileContext, setShowMobileContext] = useState(false);

  // Trigger Spotify-style context banner slide-up animation on track change
  useEffect(() => {
    if (currentTrack) {
      setShowMobileContext(true);
      const timer = setTimeout(() => {
        setShowMobileContext(false);
      }, 3000); // Stays visible for 3 seconds, then collapses smoothly
      return () => clearTimeout(timer);
    }
  }, [currentTrack?.id]);

  // Back button handler for Playlist Picker when opened via PlayerBar
  useEffect(() => {
    if (!activePickerTrack) return;

    const handleBackButton = () => {
      setShowPlaylistPicker(false);
      closePlaylistPicker();
      setSearchQuery('');
      return true; // handled
    };

    (window as any).backButtonHandlers = (window as any).backButtonHandlers || [];
    (window as any).backButtonHandlers.push(handleBackButton);

    return () => {
      if ((window as any).backButtonHandlers) {
        (window as any).backButtonHandlers = (window as any).backButtonHandlers.filter(
          (h: any) => h !== handleBackButton
        );
      }
    };
  }, [activePickerTrack, closePlaylistPicker]);

  // Device Gesture and Motion controls (Nod to Play/Pause, Shake to Skip)
  const { toggleGestures } = useGestureControls(
    isPlaying,
    togglePlay,
    () => usePlayerStore.getState().playNext(true),
    gestureControlsEnabled,
    setGestureControlsEnabled
  );

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).toggleGestureControls = toggleGestures;
    }
    return () => {
      if (typeof window !== 'undefined') {
        try { delete (window as any).toggleGestureControls; } catch {}
      }
    };
  }, [toggleGestures]);

  const handleDownloadClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentTrack) return;
    if (currentTrack.isAd) return;
    if (isFree) {
      toast.error("Offline downloading is a Premium-only feature! Upgrade to Premium. 💎");
      return;
    }
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

  // YouTube IFrame Player API integration
  const [ytPlayer, setYtPlayer] = useState<any>(null);
  const [isYtReady, setIsYtReady] = useState(false);
  const ytPlayerContainerRef = useRef<HTMLDivElement>(null);
  const handleEndedRef = useRef<() => void>(undefined);
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

  // Load YouTube IFrame API script
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkYt = () => {
      if ((window as any).YT && (window as any).YT.Player) {
        setIsYtReady(true);
        return true;
      }
      return false;
    };

    if (checkYt()) return;

    // If not loaded, inject script
    if (!(window as any).YT_Script_Injected) {
      (window as any).YT_Script_Injected = true;
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    // Set callback
    const prevOnReady = (window as any).onYouTubeIframeAPIReady;
    (window as any).onYouTubeIframeAPIReady = () => {
      if (prevOnReady) prevOnReady();
      setIsYtReady(true);
    };

    // Fallback polling interval to check if YT is loaded
    const interval = setInterval(() => {
      if (checkYt()) {
        clearInterval(interval);
      }
    }, 200);

    return () => clearInterval(interval);
  }, []);

  // Instantiate YouTube IFrame Player
  useEffect(() => {
    if (typeof window === 'undefined' || !isYtReady || ytPlayer || !ytPlayerContainerRef.current) return;

    try {
      const player = new (window as any).YT.Player(ytPlayerContainerRef.current, {
        height: '1',
        width: '1',
        videoId: '',
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          rel: 0,
          modestbranding: 1,
          showinfo: 0,
        },
        events: {
          onStateChange: (event: any) => {
            const state = event.data;
            if (state === (window as any).YT.PlayerState.PLAYING) {
              setIsPlaying(true);
            } else if (state === (window as any).YT.PlayerState.PAUSED) {
              setIsPlaying(false);
            } else if (state === (window as any).YT.PlayerState.ENDED) {
              handleEndedRef.current?.();
            }
          },
          onError: (event: any) => {
            console.error('YouTube playback error:', event.data);
            toast.error('YouTube playback failed.', { id: 'yt-error' });
            setIsPlaying(false);
          }
        }
      });
      setYtPlayer(player);
    } catch (e) {
      console.warn('Failed to init YT player:', e);
    }
  }, [isYtReady, ytPlayer, setIsPlaying]);

  // Sync YouTube Volume / Muting
  useEffect(() => {
    if (!ytPlayer || typeof ytPlayer.setVolume !== 'function') return;
    try {
      if (isMuted) {
        ytPlayer.mute();
      } else {
        ytPlayer.unMute();
        ytPlayer.setVolume(volume * 100);
      }
    } catch {}
  }, [volume, isMuted, ytPlayer]);

  // Sync YouTube Playback Speed
  useEffect(() => {
    if (!ytPlayer || typeof ytPlayer.setPlaybackRate !== 'function') return;
    try {
      ytPlayer.setPlaybackRate(currentSpeed);
    } catch {}
  }, [currentSpeed, ytPlayer]);

  // Poll YouTube track progress
  useEffect(() => {
    const isYtTrack = !!(currentTrack as any)?.youtubeVideoId && (!currentTrack?.audioUrl || currentTrack.audioUrl.startsWith('/api/track/stream'));
    if (!isPlaying || !isYtTrack || !ytPlayer || typeof ytPlayer.getCurrentTime !== 'function') return;

    const interval = setInterval(() => {
      try {
        const time = ytPlayer.getCurrentTime();
        if (time >= 0) {
          setProgress(time);
          setLocalProgress(time);
        }
      } catch {}
    }, 250);

    return () => clearInterval(interval);
  }, [isPlaying, currentTrack?.id, currentTrack?.audioUrl, ytPlayer, setProgress]);

  // Retrieve YouTube track duration
  useEffect(() => {
    const isYtTrack = !!(currentTrack as any)?.youtubeVideoId && (!currentTrack?.audioUrl || currentTrack.audioUrl.startsWith('/api/track/stream'));
    if (!isYtTrack || !ytPlayer || typeof ytPlayer.getDuration !== 'function') return;
    
    const checkDuration = setInterval(() => {
      try {
        const d = ytPlayer.getDuration();
        if (d > 0) {
          setDuration(d);
          clearInterval(checkDuration);
        }
      } catch {}
    }, 500);
    
    return () => clearInterval(checkDuration);
  }, [currentTrack?.id, currentTrack?.audioUrl, ytPlayer, setDuration]);

  const liveListeners = useRealtimeStore(state => state.liveListeners);
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

  // 1. Audio Source Loading Effect
  // Runs only when the track ID or URL changes.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!currentTrack) {
      audio.src = '';
      loadedTrackIdRef.current = null;
      audio.pause();
      if (ytPlayer && typeof ytPlayer.stopVideo === 'function') {
        try { ytPlayer.stopVideo(); } catch {}
      }
      setProgress(0);
      setLocalProgress(0);
      return;
    }

    const isYtTrack = !!(currentTrack as any).youtubeVideoId && (!currentTrack?.audioUrl || currentTrack.audioUrl.startsWith('/api/track/stream'));

    if (isYtTrack) {
      // Pause local audio element & clean src to release connection
      audio.pause();
      audio.src = '';
      loadedTrackIdRef.current = null;

      if (ytPlayer && typeof ytPlayer.loadVideoById === 'function') {
        const currentYtId = ytPlayer.getVideoData?.()?.video_id;
        if (currentYtId !== (currentTrack as any).youtubeVideoId) {
          try {
            ytPlayer.loadVideoById((currentTrack as any).youtubeVideoId, 0);
            setProgress(0);
            setLocalProgress(0);
            setDuration(currentTrack.duration || 0);
          } catch {}
        }
        
        try {
          if (isPlaying) {
            ytPlayer.playVideo();
          } else {
            ytPlayer.pauseVideo();
          }
        } catch {}
      }
      return;
    }

    // Normal audio file track playback
    if (ytPlayer && typeof ytPlayer.pauseVideo === 'function') {
      try { ytPlayer.pauseVideo(); } catch {}
    }

    let active = true;

    const loadAudio = async () => {
      let resolvedUrl = currentTrack.audioUrl;
      try {
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
      if (resolvedUrl && resolvedUrl.startsWith('/') && typeof window !== 'undefined') {
        resolvedUrl = `${window.location.origin}${resolvedUrl}`;
      }

      // Determine if current audio src has changed
      let srcChanged = false;
      if (!audio.src || loadedTrackIdRef.current !== currentTrack.id) {
        srcChanged = true;
        if (!resolvedUrl) {
          console.warn('[PlayerBar] Track has no audioUrl:', currentTrack.id);
          toast.error('This track has no audio file.', { id: 'no-audio-toast' });
          setIsPlaying(false);
          return;
        }
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

        // Once loaded, check if we should start playing
        if (isPlaying) {
          audio.play().catch((err) => {
            console.warn('Playback request failed or interrupted:', err);
            if (err.name === 'NotAllowedError') {
              toast.error('Autoplay blocked. Tap Play to start music!', { id: 'autoplay-toast' });
              setIsPlaying(false);
            }
          });
        }
      }
    };

    loadAudio();

    return () => {
      active = false;
    };
  }, [currentTrack?.id, currentTrack?.audioUrl, ytPlayer]);

  // 2. Playback Control Effect (Instant Sync)
  // Runs whenever play/pause state, volume, mute, or speed changes.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    const isYtTrack = !!(currentTrack as any).youtubeVideoId && (!currentTrack?.audioUrl || currentTrack.audioUrl.startsWith('/api/track/stream'));

    if (isYtTrack) {
      if (ytPlayer && typeof ytPlayer.getPlayerState === 'function') {
        try {
          if (isPlaying) {
            ytPlayer.playVideo();
          } else {
            ytPlayer.pauseVideo();
          }
        } catch {}
      }
      return;
    }

    // Apply properties synchronously
    audio.volume = isMuted ? 0 : volume;
    audio.playbackRate = currentSpeed;

    // Trigger play or pause instantly if the correct source is already set
    if (loadedTrackIdRef.current === currentTrack.id) {
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
    }
  }, [isPlaying, volume, isMuted, currentSpeed, currentTrack?.id, ytPlayer]);

  const cleanTrackTitleForQuery = (title: string): string => {
    if (!title) return '';
    let cleaned = title
      .replace(/\(official\s+video\)/gi, '')
      .replace(/\[lyrical\]/gi, '')
      .replace(/\(lyrics\)/gi, '')
      .replace(/\(lyric\s+video\)/gi, '')
      .replace(/\(full\s+song\)/gi, '')
      .replace(/\(video\s+song\)/gi, '')
      .replace(/\(audio\)/gi, '')
      .replace(/\[audio\]/gi, '')
      .replace(/\(remix\)/gi, '')
      .replace(/\[remix\]/gi, '')
      .replace(/\(cover\)/gi, '')
      .replace(/\[cover\]/gi, '')
      .replace(/with\s+lyrics/gi, '')
      .replace(/lyrical\s+video/gi, '')
      .replace(/official\s+audio/gi, '')
      .replace(/video\s+song/gi, '')
      .replace(/full\s+song/gi, '')
      .replace(/audio\s+song/gi, '')
      .replace(/8d\s+audio/gi, '')
      .replace(/8d\s+version/gi, '')
      .replace(/lo-fi\s+remix/gi, '')
      .replace(/lofi\s+remix/gi, '')
      .trim();

    const separators = /[|\-•:\/\\]/;
    const parts = cleaned.split(separators);
    if (parts.length > 0) {
      const firstPart = parts[0].trim();
      if (firstPart.length > 0) {
        cleaned = firstPart;
      }
    }

    return cleaned
      .replace(/\(From "[^"]+"\)/gi, '')
      .replace(/\(From '[^']+'\)/gi, '')
      .replace(/\([^)]+\)/g, '')
      .replace(/\[[^\]]+\]/g, '')
      .trim();
  };

  const cleanArtistNameForQuery = (artist: string): string => {
    if (!artist) return '';
    return artist
      .replace(/feat\..*/gi, '')
      .replace(/ft\..*/gi, '')
      .replace(/featuring.*/gi, '')
      .split(',')[0]
      .split('&')[0]
      .split(';')[0]
      .trim();
  };

  // 3. Lyrics Fetcher Effect
  // Asynchronously queries LRCLIB for real synced lyrics when the track changes
  useEffect(() => {
    if (!currentTrack) {
      usePlayerStore.setState({ lyrics: [] });
      return;
    }

    let active = true;

    const fetchTrackLyrics = async () => {
      const cacheKey = currentTrack.id;

      // 1. First check client cache to load instantly (0ms)
      if (lyricsClientCache.has(cacheKey)) {
        if (active) {
          const cachedLyrics = lyricsClientCache.get(cacheKey);
          usePlayerStore.setState({ lyrics: cachedLyrics });
        }
        return;
      }

      // 2. Get placeholder/local lyrics first so there is no delay/empty screen
      const localLyrics = getLyricsForTrack(currentTrack.id, currentTrack.title, currentTrack.artistName);
      if (active) {
        usePlayerStore.setState({ lyrics: localLyrics });
      }

      // 3. Query local Server Proxy route
      try {
        const cleanedTitle = cleanTrackTitleForQuery(currentTrack.title);
        const cleanedArtist = cleanArtistNameForQuery(currentTrack.artistName);

        const url = `/api/lyrics?title=${encodeURIComponent(cleanedTitle)}&artist=${encodeURIComponent(cleanedArtist)}`;
        const res = await fetch(url);
        
        if (!active) return;

        if (res.ok) {
          const data = await res.json();
          let parsed = [];
          if (data.syncedLyrics) {
            parsed = parseLrc(data.syncedLyrics);
          } else if (data.plainLyrics) {
            // Fallback: If only plain text lyrics exist, map them dynamically across song duration
            const lines = data.plainLyrics.split('\n').filter((l: string) => l.trim());
            const trackDuration = duration || currentTrack.duration || 180;
            const step = trackDuration / (lines.length || 1);
            parsed = lines.map((line: string, i: number) => ({
              time: i * step,
              text: line.trim()
            }));
          }

          if (parsed.length > 0 && active) {
            console.log(`[PlayerBar] Successfully loaded lyrics for: ${currentTrack.title}`);
            // Save to client cache so next plays are completely instant
            lyricsClientCache.set(cacheKey, parsed);
            usePlayerStore.setState({ lyrics: parsed });
            return;
          }
        }
      } catch (err) {
        console.warn('[PlayerBar] Failed to fetch lyrics:', err);
      }
    };

    fetchTrackLyrics();

    return () => {
      active = false;
    };
  }, [currentTrack?.id, duration]);

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
          const isYtTrack = !!(currentTrack as any)?.youtubeVideoId && (!currentTrack?.audioUrl || currentTrack.audioUrl.startsWith('/api/track/stream'));
          if (isYtTrack && ytPlayer && typeof ytPlayer.seekTo === 'function') {
            try { ytPlayer.seekTo(time, true); } catch {}
          } else if (audioRef.current) {
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
  }, [setIsPlaying, setProgress, currentTrack, ytPlayer]);

  // Sleep Timer countdown
  useEffect(() => {
    if (sleepTimer === null) return;
    const ms = sleepTimer * 60 * 1000;
    const timeoutId = setTimeout(() => {
      setIsPlaying(false);
      const isYtTrack = !!(currentTrack as any)?.youtubeVideoId && (!currentTrack?.audioUrl || currentTrack.audioUrl.startsWith('/api/track/stream'));
      if (isYtTrack && ytPlayer && typeof ytPlayer.pauseVideo === 'function') {
        try { ytPlayer.pauseVideo(); } catch {}
      } else if (audioRef.current) {
        audioRef.current.pause();
      }
      setSleepTimer(null);
    }, ms);
    return () => clearTimeout(timeoutId);
  }, [sleepTimer, setIsPlaying, setSleepTimer, currentTrack, ytPlayer]);

  // Seeking via custom event
  useEffect(() => {
    const handleSeek = (e: Event) => {
      const customEvent = e as CustomEvent<number>;
      const isYtTrack = !!(currentTrack as any)?.youtubeVideoId && (!currentTrack?.audioUrl || currentTrack.audioUrl.startsWith('/api/track/stream'));
      if (isYtTrack && ytPlayer && typeof ytPlayer.seekTo === 'function') {
        try { ytPlayer.seekTo(customEvent.detail, true); } catch {}
      } else if (audioRef.current) {
        audioRef.current.currentTime = customEvent.detail;
      }
      setProgress(customEvent.detail);
      setLocalProgress(customEvent.detail);
    };
    window.addEventListener('seek-audio', handleSeek);
    return () => window.removeEventListener('seek-audio', handleSeek);
  }, [setProgress, currentTrack, ytPlayer]);

  // Speed changes via custom event
  useEffect(() => {
    const handleSpeed = (e: Event) => {
      const customEvent = e as CustomEvent<number>;
      setCurrentSpeed(customEvent.detail);
      const isYtTrack = !!(currentTrack as any)?.youtubeVideoId && (!currentTrack?.audioUrl || currentTrack.audioUrl.startsWith('/api/track/stream'));
      if (isYtTrack && ytPlayer && typeof ytPlayer.setPlaybackRate === 'function') {
        try { ytPlayer.setPlaybackRate(customEvent.detail); } catch {}
      } else if (audioRef.current) {
        audioRef.current.playbackRate = customEvent.detail;
      }
    };
    window.addEventListener('change-playback-speed', handleSpeed);
    return () => window.removeEventListener('change-playback-speed', handleSpeed);
  }, [currentTrack, ytPlayer]);

  const handleTimeUpdate = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || isDragging) return;
    
    const adCutoff = currentTrack?.duration || 15;
    if (currentTrack?.isAd && audio.currentTime >= adCutoff) {
      playNext(true); // Automatically advance after ad break cutoff
      return;
    }

    setProgress(audio.currentTime);
    const trackDuration = currentTrack?.isAd ? adCutoff : (audio.duration || currentTrack?.duration || 0);
    setDuration(trackDuration);
    setLocalProgress(audio.currentTime);
  }, [isDragging, currentTrack, playNext, setProgress, setDuration]);

  const handleEnded = useCallback(() => {
    if (repeat === 'one') {
      const isYtTrack = !!(currentTrack as any)?.youtubeVideoId && (!currentTrack?.audioUrl || currentTrack.audioUrl.startsWith('/api/track/stream'));
      if (isYtTrack && ytPlayer && typeof ytPlayer.seekTo === 'function') {
        try {
          ytPlayer.seekTo(0, true);
          ytPlayer.playVideo();
        } catch {}
      } else if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
    } else {
      playNext();
    }
  }, [repeat, playNext, currentTrack, ytPlayer]);

  // Keep ref up to date
  handleEndedRef.current = handleEnded;

  const handleLoadedMetadata = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      const adCutoff = currentTrack?.duration || 15;
      const trackDuration = currentTrack?.isAd ? adCutoff : (audio.duration || currentTrack?.duration || 0);
      setDuration(trackDuration);
    }
  }, [currentTrack, setDuration]);

  const handlePlay = useCallback(() => {
    if (!isPlaying) setIsPlaying(true);
  }, [isPlaying, setIsPlaying]);

  const handlePause = useCallback(() => {
    if (isPlaying) setIsPlaying(false);
  }, [isPlaying, setIsPlaying]);

  const handleAudioError = useCallback((e: Event) => {
    // If this is a YouTube track, ignore HTML5 audio element errors completely
    const isYtTrack = !!(currentTrack as any)?.youtubeVideoId && (!currentTrack?.audioUrl || currentTrack.audioUrl.startsWith('/api/track/stream'));
    if (isYtTrack) {
      console.info('[PlayerBar] Ignoring audio element error since this is a YouTube track.');
      return;
    }

    const audio = e.target as HTMLAudioElement;
    const err = audio.error;
    // Map MediaError codes to human-readable messages
    const codeMap: Record<number, string> = {
      1: 'Playback aborted by the user.',
      2: 'Network error while loading audio.',
      3: 'Audio decoding failed — file may be corrupt.',
      4: 'Audio format not supported by this browser.',
    };
    const detail = err ? (codeMap[err.code] || `Error code ${err.code}`) : 'Unknown audio error';
    console.error(`[PlayerBar] Audio error: ${detail}`, err);

    // Code 4 on a YouTube-resolved stream → the cached URL may be stale or wrong format.
    // Auto-retry by busting the cache (add a timestamp param) so the server re-resolves.
    if (err?.code === 4 && audio.src?.includes('/api/songs/resolve')) {
      const ytId = (currentTrack as any)?.youtubeVideoId;
      if (ytId && /^[a-zA-Z0-9_-]{11}$/.test(ytId)) {
        console.info(`[PlayerBar] Retrying resolve for ${ytId} with cache-bust...`);
        const freshUrl = `${window.location.origin}/api/songs/resolve?youtubeId=${ytId}&t=${Date.now()}`;
        audio.src = freshUrl;
        audio.load();
        audio.play().catch(() => setIsPlaying(false));
        return; // Don't show the error toast — we're retrying
      }
    }

    // Only show toast for real errors (code 2, 3, 4), not for aborted loads (code 1)

    if (!err || err.code !== 1) {
      toast.error(`Playback error: ${detail}`, { id: 'audio-error-toast' });
    }
    setIsPlaying(false);
  }, [setIsPlaying, currentTrack]);

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

  if (!currentTrack) {
    if (activePickerTrack) {
      return (
        <AnimatePresence>
          {activePickerTrack && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setShowPlaylistPicker(false); closePlaylistPicker(); setSearchQuery(''); }}
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
                        tracks: [activePickerTrack.id],
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
                {(() => {
                  const isTargetLiked = user?.likedSongs?.includes(activePickerTrack.id) ?? false;
                  return (
                    <div style={{ padding: '0 24px 16px', borderBottom: '1px solid rgba(43,34,26,0.08)', flexShrink: 0 }}>
                      <button
                        onClick={() => {
                          toggleLikeSong(activePickerTrack.id);
                          toast.success(isTargetLiked ? 'Removed from Liked Songs' : 'Added to Liked Songs', { id: 'liked-toggle-toast' });
                        }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 14, width: '100%',
                          background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                          padding: '12px 16px', borderRadius: 8, transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(15,81,50,0.04)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'none'}
                      >
                        <div style={{
                          width: 44, height: 44, borderRadius: 6, flexShrink: 0,
                          background: 'linear-gradient(135deg, var(--color-ss-primary, #0f5132), var(--color-ss-secondary, #198754))',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Heart size={20} fill="#fff" color="#fff" />
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ color: '#221a15', fontSize: 14, fontWeight: 600, margin: 0 }}>Liked Songs</p>
                          <p style={{ color: '#87786c', fontSize: 12, margin: '2px 0 0' }}>Your favorite songs list</p>
                        </div>
                        {isTargetLiked ? (
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
                  );
                })()}

                {/* Search bar inside sheet */}
                <div style={{ padding: '16px 24px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10, background: '#fafaf9' }}>
                  <input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Find playlist"
                    style={{
                      flex: 1, background: '#f4eede', border: '1px solid rgba(43,34,26,0.08)',
                      borderRadius: 18, padding: '8px 16px', fontSize: 13.5, color: '#221a15',
                      outline: 'none', fontFamily: 'var(--font-inter), sans-serif',
                    }}
                  />
                </div>

                {/* Scrollable Playlists list */}
                <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '8px 24px' }}>
                  {(() => {
                    const myPlaylists = customPlaylists.filter(pl => {
                      if (user) return pl.ownerId === user.id;
                      return pl.ownerId === 'guest' || !pl.ownerId;
                    });
                    const filtered = myPlaylists.filter(pl => pl.title.toLowerCase().includes(searchQuery.toLowerCase()));
                    if (filtered.length === 0) {
                      return (
                        <div style={{ textAlign: 'center', padding: '32px 0', color: '#87786c', fontSize: 13.5 }}>
                          No playlists found.
                        </div>
                      );
                    }
                    return filtered.map(pl => {
                      const alreadyAdded = pl.tracks.includes(activePickerTrack.id);
                      const firstTrackId = pl.tracks?.[0];
                      const firstTrack = allTracks.find(t => t.id === firstTrackId);
                      const resolvedCover = pl.coverImage || firstTrack?.coverImage || '';

                      return (
                        <button
                          key={pl.id}
                          onClick={() => {
                            if (alreadyAdded) {
                              removeTrackFromPlaylist(pl.id, activePickerTrack.id);
                              toast.success(`Removed from "${pl.title}"`, { id: 'playlist-toggle' });
                            } else {
                              addTrackToPlaylist(pl.id, activePickerTrack.id);
                              toast.success(`Added to "${pl.title}"`, { id: 'playlist-toggle' });
                            }
                          }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 14,
                            width: '100%', padding: '10px 12px', borderRadius: 8,
                            background: 'none', border: 'none', cursor: 'pointer',
                            textAlign: 'left', transition: 'background 0.15s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(15,81,50,0.04)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'none'}
                        >
                          <div style={{
                            width: 44, height: 44, borderRadius: 6, flexShrink: 0,
                            background: pl.gradientCss || 'linear-gradient(135deg, var(--color-ss-primary, #0f5132), var(--color-ss-secondary, #198754))',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                          }}>
                            {resolvedCover ? (
                              <img src={resolvedCover} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                    });
                  })()}

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
                        tracks: [activePickerTrack.id],
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
      );
    }
    return null;
  }

  // Progress circle geometry math for mobile player (matching second ref image capsule layout)
  const circleRadius = 23;
  const strokeWidth = 2.5;
  const normalizedRadius = circleRadius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const currentProgress = localProgress || 0;
  const strokeDashoffset = duration > 0 ? circumference - (currentProgress / duration) * circumference : circumference;

  return (
    <div 
      className="app-player"
      style={isMobile ? {
        height: 56,
        position: 'relative',
        overflow: 'visible',
        width: 'calc(100vw - 16px)',
        margin: '4px auto 2px auto',
      } : undefined}
    >
      <audio ref={audioRef} preload="metadata" />
      <div style={{ position: 'absolute', width: 1, height: 1, opacity: 0.001, pointerEvents: 'none', overflow: 'hidden' }}>
        <div ref={ytPlayerContainerRef} />
      </div>

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
            {currentTrack.isAd ? (
              <p style={{ color: '#221a15', fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
                {currentTrack.title}
              </p>
            ) : (
              <Link href={`/album/${currentTrack.albumId}`} style={{ textDecoration: 'none' }}>
                <p style={{ color: '#221a15', fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer', margin: 0 }}
                  onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                  onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}>
                  {currentTrack.title}
                </p>
              </Link>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
              {currentTrack.isAd ? (
                <span style={{ color: '#87786c', fontSize: 12 }}>
                  {currentTrack.artistName}
                </span>
              ) : (
                <Link href={`/artist/${currentTrack.artistId}`} style={{ textDecoration: 'none', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <span style={{ color: '#87786c', fontSize: 12, cursor: 'pointer' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#221a15')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#87786c')}>
                    {currentTrack.artistName}
                  </span>
                </Link>
              )}
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
            <button 
              onClick={() => {
                if (isFree) {
                  toast.error("Shuffle mode is disabled for Free users. Upgrade to Premium to toggle Shuffle! 💎");
                  return;
                }
                toggleShuffle();
              }} 
              style={{
                ...btnStyle(shuffle && !isFree),
                opacity: isFree ? 0.35 : 1,
                cursor: isFree ? 'not-allowed' : 'pointer'
              }} 
              title={isFree ? "Shuffle (Premium Only)" : "Shuffle"}
              onMouseEnter={e => { if (!isFree) e.currentTarget.style.color = shuffle ? GREEN : '#221a15'; }}
              onMouseLeave={e => { if (!isFree) e.currentTarget.style.color = shuffle ? GREEN : '#87786c'; }}
            >
              <Shuffle size={16} />
            </button>

            <button 
              onClick={() => usePlayerStore.getState().playPrevious()} 
              disabled={isPrevLocked}
              style={{ ...btnStyle(), opacity: isPrevLocked ? 0.35 : 1, cursor: isPrevLocked ? 'not-allowed' : 'pointer' }}
              title={isPrevLocked ? "Previous (Premium Only or wait 1 hour)" : "Previous"}
              onMouseEnter={e => { if (!isPrevLocked) e.currentTarget.style.color = '#221a15'; }}
              onMouseLeave={e => { if (!isPrevLocked) e.currentTarget.style.color = '#87786c'; }}>
              <SkipBack size={20} fill="currentColor" />
            </button>

            <motion.button whileTap={{ scale: 0.9 }} onClick={togglePlay}
              disabled={currentTrack?.isAd === true}
              style={{
                width: 38, height: 38, borderRadius: '50%', background: '#221a15',
                border: 'none', cursor: currentTrack?.isAd ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(43, 34, 26, 0.15)', transition: 'transform 0.15s',
                opacity: currentTrack?.isAd ? 0.5 : 1
              }}
              onMouseEnter={e => { if (currentTrack?.isAd !== true) (e.currentTarget as HTMLElement).style.transform = 'scale(1.06)'; }}
              onMouseLeave={e => { if (currentTrack?.isAd !== true) (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}>
              {isPlaying ? <Pause size={18} fill="white" color="white" /> : <Play size={18} fill="white" color="white" />}
            </motion.button>

            <button 
              onClick={() => usePlayerStore.getState().playNext(true)} 
              disabled={currentTrack?.isAd === true}
              style={{ ...btnStyle(), opacity: currentTrack?.isAd ? 0.35 : 1, cursor: currentTrack?.isAd ? 'not-allowed' : 'pointer' }}
              title={currentTrack?.isAd ? "Next (Ad Playing)" : "Next"}
              onMouseEnter={e => { if (currentTrack?.isAd !== true) e.currentTarget.style.color = '#221a15'; }}
              onMouseLeave={e => { if (currentTrack?.isAd !== true) e.currentTarget.style.color = '#87786c'; }}>
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
                disabled={currentTrack?.isAd === true}
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
                style={{ '--progress': `${progressPercent}%`, width: '100%', cursor: currentTrack?.isAd ? 'not-allowed' : 'pointer' } as React.CSSProperties} />
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

      {/* ── Mobile Player Layout (Spotify Style) ── */}
      <div 
        className="mobile-player-layout" 
        style={{ 
          cursor: 'pointer',
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          alignItems: 'stretch',
          overflow: 'visible'
        }}
        onClick={() => setIsFullscreen(true)}
        onTouchStart={(e) => {
          (e.currentTarget as any)._touchStartY = e.touches[0].clientY;
          (e.currentTarget as any)._touchMoved = false;
        }}
        onTouchMove={(e) => {
          const startY = (e.currentTarget as any)._touchStartY || 0;
          if (Math.abs(e.touches[0].clientY - startY) > 10) {
            (e.currentTarget as any)._touchMoved = true;
          }
        }}
        onTouchEnd={(e) => {
          const startY = (e.currentTarget as any)._touchStartY || 0;
          const endY = e.changedTouches[0].clientY;
          const dy = startY - endY;
          if (dy > 40) {
            e.preventDefault();
            setIsFullscreen(true);
          }
        }}
      >
        {/* ── TOP SECTION (Lighter green context banner - floats/slides UP behind the main pill) ── */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 6,
          right: 6,
          height: 26,
          background: '#198754',
          borderRadius: '12px 12px 0 0',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderBottom: 'none',
          display: 'flex',
          alignItems: 'center',
          paddingLeft: 10,
          paddingRight: 10,
          boxSizing: 'border-box',
          zIndex: 1,
          pointerEvents: showMobileContext ? 'auto' : 'none',
          transform: showMobileContext ? 'translateY(-25px)' : 'translateY(0)',
          opacity: showMobileContext ? 1 : 0,
          transition: 'transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.35s'
        }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: '#ffffff', letterSpacing: '0.05em', textTransform: 'uppercase', fontFamily: 'Outfit, sans-serif' }}>
            {currentTrack.isAd ? 'Sponsored' : 'Recommended for you'}
          </div>
        </div>

        {/* ── BOTTOM SECTION (Main Dark Green Player Pill - stays in place, zIndex: 2) ── */}
        <div style={{
          position: 'relative',
          zIndex: 2,
          height: 56,
          width: '100%',
          background: '#0f5132',
          borderRadius: 16,
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingLeft: 12,
          paddingRight: 12,
          boxSizing: 'border-box'
        }}>
          {/* Left side: Cover art & Title/Artist */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
            <div style={{ width: 38, height: 38, borderRadius: 6, overflow: 'hidden', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
              <PlayerTrackImage coverImage={currentTrack.coverImage} title={currentTrack.title} />
            </div>

            {/* Title & Artist & Device info */}
            <div style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                <span style={{
                  color: '#ffffff',
                  fontWeight: '800',
                  fontSize: 13.5,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontFamily: 'Outfit, sans-serif'
                }}>{currentTrack.title}</span>
                {currentTrack.explicit && (
                  <span style={{
                    fontSize: 8.5,
                    fontWeight: 800,
                    background: 'rgba(255, 255, 255, 0.2)',
                    color: '#ffffff',
                    padding: '1px 3px',
                    borderRadius: 2,
                    textTransform: 'uppercase',
                    flexShrink: 0,
                    fontFamily: 'Outfit, sans-serif'
                  }}>E</span>
                )}
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 1, minWidth: 0 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: '#1db954', fontSize: 11, fontWeight: 700, fontFamily: 'Outfit, sans-serif', flexShrink: 0 }}>
                  ⚡ {activeDevice || 'Speaker'}
                </span>
                <span style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: 11, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'Outfit, sans-serif' }}>
                  • {currentTrack.artistName}
                </span>
              </div>
            </div>
          </div>

          {/* Right side: Action controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }} onClick={e => e.stopPropagation()} onTouchEnd={e => e.stopPropagation()}>
            {/* Dynamic Device Icon based on name */}
            <button
              onClick={e => { e.stopPropagation(); setIsFullscreen(true); }}
              style={{ background: 'transparent', border: 'none', padding: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#1db954' }}
              title={`Playing on ${activeDevice || 'Speaker'}`}
            >
              {(() => {
                const name = (activeDevice || 'Speaker').toLowerCase();
                if (name.includes('headphone') || name.includes('headset') || name.includes('earphone') || name.includes('buds') || name.includes('air 01') || name.includes('bluetooth')) {
                  return <Headphones size={18} strokeWidth={2.2} />;
                }
                if (name.includes('phone') || name.includes('mobile') || name.includes('iphone') || name.includes('android')) {
                  return <Smartphone size={18} strokeWidth={2.2} />;
                }
                return <Laptop2 size={18} strokeWidth={2.2} />;
              })()}
            </button>

            {/* Plus Button: Toggles Liked Songs */}
            <button
              onClick={e => {
                e.stopPropagation();
                if (currentTrack) {
                  toggleLikeSong(currentTrack.id);
                  if (!isLiked) {
                    toast.success(`Added "${currentTrack.title}" to Liked Songs! 💚`, { id: 'liked-toast' });
                  } else {
                    toast.success(`Removed "${currentTrack.title}" from Liked Songs`, { id: 'liked-toast' });
                  }
                }
              }}
              style={{ background: 'transparent', border: 'none', padding: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', color: isLiked ? '#1db954' : '#ffffff' }}
              title={isLiked ? "Remove from Liked Songs" : "Add to Liked Songs"}
            >
              {isLiked ? (
                <Check size={20} strokeWidth={2.5} />
              ) : (
                <PlusCircle size={20} strokeWidth={2} />
              )}
            </button>

            <button
              onClick={e => { e.stopPropagation(); togglePlay(); }}
              disabled={currentTrack?.isAd === true}
              style={{ 
                background: 'transparent', 
                border: 'none', 
                padding: 4,
                cursor: currentTrack?.isAd ? 'not-allowed' : 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                color: '#ffffff',
                opacity: currentTrack?.isAd ? 0.5 : 1
              }}
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause size={20} strokeWidth={2.2} fill="currentColor" />
              ) : (
                <Play size={20} strokeWidth={2.2} fill="currentColor" />
              )}
            </button>
          </div>

          {/* Thin bottom progress bar (Spotify Style) */}
          <div style={{ 
            position: 'absolute', 
            bottom: 0, 
            left: 0, 
            right: 0, 
            height: 3, 
            background: 'rgba(255, 255, 255, 0.15)',
            zIndex: 3,
            pointerEvents: 'none'
          }}>
            <div style={{ 
              height: '100%', 
              width: `${(localProgress / (duration || (currentTrack ? currentTrack.duration : 180))) * 100}%`, 
              background: '#ffffff',
              borderRadius: '0 2px 2px 0',
              transition: 'width 0.2s linear'
            }} />
          </div>
        </div>
      </div>

      {/* ── Playlist Picker Bottom Sheet ── */}
      <AnimatePresence>
        {activePickerTrack && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setShowPlaylistPicker(false); closePlaylistPicker(); setSearchQuery(''); }}
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
                      tracks: [activePickerTrack.id],
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
              {(() => {
                const isTargetLiked = user?.likedSongs?.includes(activePickerTrack.id) ?? false;
                return (
                  <div style={{ padding: '0 24px 16px', borderBottom: '1px solid rgba(43,34,26,0.08)', flexShrink: 0 }}>
                    <button
                      onClick={() => {
                        toggleLikeSong(activePickerTrack.id);
                        toast.success(isTargetLiked ? 'Removed from Liked Songs' : 'Added to Liked Songs', { id: 'liked-toggle-toast' });
                      }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 14, width: '100%',
                        background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                        padding: '12px 16px', borderRadius: 8, transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(15,81,50,0.04)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      <div style={{
                        width: 44, height: 44, borderRadius: 6, flexShrink: 0,
                        background: 'linear-gradient(135deg, var(--color-ss-primary, #0f5132), var(--color-ss-secondary, #198754))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Heart size={20} fill="#fff" color="#fff" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ color: '#221a15', fontSize: 14, fontWeight: 600, margin: 0 }}>Liked Songs</p>
                        <p style={{ color: '#87786c', fontSize: 12, margin: '2px 0 0' }}>Your favorite songs list</p>
                      </div>
                      {isTargetLiked ? (
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
                );
              })()}

              {/* Search bar inside sheet */}
              <div style={{ padding: '16px 24px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10, background: '#fafaf9' }}>
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Find playlist"
                  style={{
                    flex: 1, background: '#f4eede', border: '1px solid rgba(43,34,26,0.08)',
                    borderRadius: 18, padding: '8px 16px', fontSize: 13.5, color: '#221a15',
                    outline: 'none', fontFamily: 'var(--font-inter), sans-serif',
                  }}
                />
              </div>

              {/* Scrollable Playlists list */}
              <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '8px 24px' }}>
                {(() => {
                  const myPlaylists = customPlaylists.filter(pl => {
                    if (user) return pl.ownerId === user.id;
                    return pl.ownerId === 'guest' || !pl.ownerId;
                  });
                  const filtered = myPlaylists.filter(pl => pl.title.toLowerCase().includes(searchQuery.toLowerCase()));
                  if (filtered.length === 0) {
                    return (
                      <div style={{ textAlign: 'center', padding: '32px 0', color: '#87786c', fontSize: 13.5 }}>
                        No playlists found.
                      </div>
                    );
                  }
                  return filtered.map(pl => {
                    const alreadyAdded = pl.tracks.includes(activePickerTrack.id);
                    const firstTrackId = pl.tracks?.[0];
                    const firstTrack = allTracks.find(t => t.id === firstTrackId);
                    const resolvedCover = pl.coverImage || firstTrack?.coverImage || '';

                    return (
                      <button
                        key={pl.id}
                        onClick={() => {
                          if (alreadyAdded) {
                            removeTrackFromPlaylist(pl.id, activePickerTrack.id);
                            toast.success(`Removed from "${pl.title}"`, { id: 'playlist-toggle' });
                          } else {
                            addTrackToPlaylist(pl.id, activePickerTrack.id);
                            toast.success(`Added to "${pl.title}"`, { id: 'playlist-toggle' });
                          }
                        }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 14,
                          width: '100%', padding: '10px 12px', borderRadius: 8,
                          background: 'none', border: 'none', cursor: 'pointer',
                          textAlign: 'left', transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(15,81,50,0.04)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'none'}
                      >
                        <div style={{
                          width: 44, height: 44, borderRadius: 6, flexShrink: 0,
                          background: pl.gradientCss || 'linear-gradient(135deg, var(--color-ss-primary, #0f5132), var(--color-ss-secondary, #198754))',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                        }}>
                          {resolvedCover ? (
                            <img src={resolvedCover} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                  });
                })()}

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
                      tracks: [activePickerTrack.id],
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
