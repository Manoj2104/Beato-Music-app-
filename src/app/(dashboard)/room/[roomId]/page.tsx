'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { usePlayerStore } from '@/store/playerStore';
import { useAuthStore } from '@/store/authStore';
import { useMusicStore } from '@/store/musicStore';
import { socketManager } from '@/lib/socket';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Users, Headphones, MessageSquare, Send, Volume2, Play, Pause,
  Search, Share2, Crown, LogOut, Music, ChevronRight, VolumeX, SkipForward, HelpCircle,
  Shuffle, SkipBack, Repeat, Heart, Download, Copy, X
} from 'lucide-react';

interface Participant {
  userId: string;
  name: string;
  avatar?: string;
  role: 'host' | 'guest';
  joinedAt: string;
  lastActive: string;
}

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  timestamp: string;
}

interface Room {
  id: string;
  name: string;
  description?: string;
  hostId: string;
  hostName: string;
  createdAt: string;
  isActive: boolean;
  participants: Participant[];
  chatHistory: ChatMessage[];
  currentTrackId?: string;
  currentTrackPosition?: number;
  isPlaying?: boolean;
  updatedAt: string;
  queue: string[];
  isCollaborative: boolean;
  isLocked: boolean; // when true, only host can control playback
}

interface FloatingEmojiInstance {
  id: string;
  emoji: string;
  x: number;
}

export default function JamRoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId: rawRoomId } = use(params);
  const roomId = decodeURIComponent(rawRoomId).toUpperCase();
  const router = useRouter();

  // State definitions
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [roomQueue, setRoomQueue] = useState<string[]>([]);
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmojiInstance[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState<'player' | 'queue' | 'chat'>('player');
  const [roomSearchQuery, setRoomSearchQuery] = useState('');
  const [allTracksPage, setAllTracksPage] = useState(1);
  const [isRoomLocked, setIsRoomLocked] = useState(false); // mirror of room.isLocked
  const [showInviteMenu, setShowInviteMenu] = useState(false);
  const tracksPerPage = 10;

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // ─── Zustand stores ───
  const { user } = useAuthStore();
  const { getAllTracks } = useMusicStore();
  const allTracks = getAllTracks();
  const {
    currentTrack: localTrack,
    isPlaying: localIsPlaying,
    progress: localProgress,
    duration: localDuration,
    playTrack,
    setIsPlaying,
    setProgress
  } = usePlayerStore();

  // ─── Live refs (always current inside setInterval, no stale closures) ───
  const allTracksRef = useRef(allTracks);
  allTracksRef.current = allTracks;

  const localTrackRef = useRef(localTrack);
  localTrackRef.current = localTrack;

  const localIsPlayingRef = useRef(localIsPlaying);
  localIsPlayingRef.current = localIsPlaying;

  const localProgressRef = useRef(localProgress);
  localProgressRef.current = localProgress;

  const roomRef = useRef(room);
  roomRef.current = room;

  const chatEndRef = useRef<HTMLDivElement>(null);
  const ignoreNextLocalSync = useRef(false);
  const lastSyncWriteRef = useRef<number>(0); // timestamp of last write from this tab

  const currentUserId = user?.id || 'guest';
  const isHost = room ? room.hostId === currentUserId : false;
  // canControl: host always can; guests can only if room is not locked
  const canControl = isHost || !isRoomLocked;

  // ─── applyRoomPlayback: applies room state to the local player ───
  const applyRoomPlayback = (roomData: Room) => {
    if (!roomData.currentTrackId) return;

    const tracks = allTracksRef.current;
    const trackToPlay = tracks.find(t => t.id === roomData.currentTrackId);
    if (!trackToPlay) return;

    // Mark: this change came from server → do NOT re-broadcast
    ignoreNextLocalSync.current = true;

    // Calculate target position with server-elapsed latency compensation
    const calcTargetPos = () => {
      let pos = roomData.currentTrackPosition || 0;
      if (roomData.isPlaying && roomData.updatedAt) {
        const elapsed = (Date.now() - new Date(roomData.updatedAt).getTime()) / 1000;
        pos += Math.max(0, elapsed);
      }
      return pos;
    };

    const currentId = localTrackRef.current?.id;
    const isSameTrack = currentId === trackToPlay.id;

    if (isSameTrack) {
      // Same track — just sync position & play state immediately
      const targetPos = calcTargetPos();
      const drift = Math.abs(localProgressRef.current - targetPos);

      if (roomData.isPlaying !== localIsPlayingRef.current) {
        setIsPlaying(!!roomData.isPlaying);
      }

      if (drift > 1.5) {
        setIsSyncing(true);
        window.dispatchEvent(new CustomEvent('seek-audio', { detail: targetPos }));
        setTimeout(() => setIsSyncing(false), 800);
      }
    } else {
      // Different track — must load it first, THEN seek once audio is ready
      playTrack(trackToPlay, []);

      // Wait for the audio element to signal it's ready to play
      const onCanPlay = () => {
        const targetPos = calcTargetPos();
        if (targetPos > 1) {
          setIsSyncing(true);
          window.dispatchEvent(new CustomEvent('seek-audio', { detail: targetPos }));
          setTimeout(() => setIsSyncing(false), 800);
        }
        if (roomData.isPlaying) {
          setIsPlaying(true);
        }
        // Clean up listener
        const audio = document.querySelector('audio');
        audio?.removeEventListener('canplay', onCanPlay);
      };

      // Attach to the audio element
      const audio = document.querySelector('audio');
      if (audio) {
        audio.addEventListener('canplay', onCanPlay, { once: true });
        // Fallback: if canplay doesn't fire in 1.5s, seek anyway
        setTimeout(() => {
          const targetPos = calcTargetPos();
          if (targetPos > 1) {
            window.dispatchEvent(new CustomEvent('seek-audio', { detail: targetPos }));
          }
          if (roomData.isPlaying) setIsPlaying(true);
        }, 1500);
      }
    }
  };


  // 1. Fetch Room State
  const fetchRoomInfo = async (joinRoom = false, enteredPassword?: string) => {
    try {
      const endpoint = joinRoom 
        ? `/api/rooms/${roomId}/join` 
        : `/api/rooms/${roomId}`;

      let finalPassword = enteredPassword;
      if (joinRoom && !finalPassword && typeof window !== 'undefined') {
        finalPassword = localStorage.getItem(`soundsphere-room-password-${roomId}`) || undefined;
      }

      const res = await fetch(endpoint, {
        method: joinRoom ? 'POST' : 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: joinRoom ? JSON.stringify({ password: finalPassword }) : undefined
      });
      const data = await res.json();
      if (data.success && data.room) {
        setRoom(data.room);
        setChatHistory(data.room.chatHistory || []);
        setRoomQueue(data.room.queue || []);
        setIsRoomLocked(!!data.room.isLocked); // sync lock state on join
        if (typeof window !== 'undefined') {
          localStorage.setItem('soundsphere-active-room-id', data.room.id);
          localStorage.setItem('soundsphere-active-room-name', data.room.name);
          if (finalPassword) {
            localStorage.setItem(`soundsphere-room-password-${roomId}`, finalPassword);
          }
        }
        // On initial join, sync to whatever is currently playing in the room
        if (data.room.currentTrackId) {
          applyRoomPlayback(data.room);
        }
      } else if (res.status === 403 && data.passwordRequired) {
        const pass = prompt("This room is password-protected. Enter Password:");
        if (pass !== null) {
          fetchRoomInfo(true, pass);
        } else {
          router.push('/library');
        }
      } else {
        setIsPlaying(false);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('soundsphere-active-room-id');
          localStorage.removeItem('soundsphere-active-room-name');
        }
        toast(data.error || 'This room has been closed by the host.');
        router.push('/library');
      }
    } catch (err) {
      console.error('Fetch room error:', err);
      toast.error('Connection error');
    } finally {
      setLoading(false);
    }
  };

  // Initial Join
  useEffect(() => {
    fetchRoomInfo(true);
  }, [roomId]);

  // 2. Real-Time Socket Connection & Polling (runs once per roomId, uses refs for fresh state)
  useEffect(() => {
    // Handle local same-browser tab updates via BroadcastChannel/socket
    const handleRoomUpdate = (data: any) => {
      if (data.roomId !== roomId) return;

      if (data.action === 'sync') {
        const sinceWrite = Date.now() - lastSyncWriteRef.current;
        if (sinceWrite > 300) {
          const cur = roomRef.current;
          if (!cur) return;
          const updated: Room = {
            ...cur,
            currentTrackId: data.playback.currentTrackId,
            currentTrackPosition: data.playback.currentTrackPosition,
            isPlaying: data.playback.isPlaying,
            updatedAt: data.playback.updatedAt
          };
          setRoom(updated);
          applyRoomPlayback(updated);
        }

      } else if (data.action === 'join' || data.action === 'leave') {
        fetchRoomInfo();
      } else if (data.action === 'lock') {
        // Host toggled the room lock - update immediately for all participants
        setIsRoomLocked(!!data.isLocked);
        toast(data.isLocked ? '🔒 Host locked controls' : '🔓 Host unlocked controls');
      } else if (data.action === 'chat') {
        setChatHistory(prev => {
          if (prev.some(m => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });
      } else if (data.action === 'react') {
        spawnEmoji(data.payload.emoji);
      } else if (data.action === 'queue') {
        setRoomQueue(data.queue);
      }
    };

    const unsub = socketManager.on('PLAYLIST_UPDATED', handleRoomUpdate);

    // ⚡ Poll DB every 2s — the ONLY cross-browser sync mechanism (no Supabase needed)
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/rooms/${roomId}`, { method: 'GET' });
        if (res.status === 404) {
          // Room was closed / deactivated by host!
          setIsPlaying(false);
          if (typeof window !== 'undefined') {
            localStorage.removeItem('soundsphere-active-room-id');
            localStorage.removeItem('soundsphere-active-room-name');
          }
          toast('This room has been closed by the host.');
          router.push('/library');
          return;
        }
        const data = await res.json();
        if (!data.success || !data.room) return;

        const fresh = data.room;
        const cur = roomRef.current; // ✅ Always fresh, no stale closure

        // Skip if we just wrote (avoid applying our own broadcast)
        const sinceWrite = Date.now() - lastSyncWriteRef.current;
        if (sinceWrite < 1500) return;

        const trackChanged = fresh.currentTrackId && fresh.currentTrackId !== cur?.currentTrackId;
        const playChanged = fresh.isPlaying !== cur?.isPlaying;
        // ⚡ Sync also updates isLocked state from poll
        if (fresh.isLocked !== isRoomLocked) setIsRoomLocked(!!fresh.isLocked);
        // 🎯 Tight drift threshold: 0.5s for near-perfect sync
        const positionDrift = Math.abs((fresh.currentTrackPosition || 0) - localProgressRef.current);

        if (trackChanged || playChanged || positionDrift > 0.5) {
          setRoom(fresh);
          applyRoomPlayback(fresh); // ✅ reads from refs internally
        }
      } catch {
        // Network error - silently continue
      }
    }, 2000);

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, [roomId]); // ✅ Only depends on roomId — no stale closures possible

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // 3. Controller Actions (Sync Host events to Guests)
  const syncPlaybackState = async (trackId: string | undefined, pos: number, playing: boolean) => {
    // Record that THIS tab is the initiator of this sync write
    lastSyncWriteRef.current = Date.now();
    try {
      await fetch(`/api/rooms/${roomId}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentTrackId: trackId,
          currentTrackPosition: pos,
          isPlaying: playing
        })
      });
    } catch (e) {
      console.error('Failed to sync playback state:', e);
    }
  };

  // Auto-sync: when this tab's track/play state changes, broadcast to DB (unless it was triggered by incoming data)
  const lastSyncRef = useRef<{ trackId?: string; playing?: boolean }>({});
  useEffect(() => {
    if (!room) return;

    // Skip: this change was triggered by incoming server data (applyRoomPlayback set this flag)
    if (ignoreNextLocalSync.current) {
      ignoreNextLocalSync.current = false;
      lastSyncRef.current = { trackId: localTrack?.id, playing: localIsPlaying };
      return;
    }

    // Only broadcast when track or play state actually changes (not on every render)
    const trackChanged = lastSyncRef.current.trackId !== localTrack?.id;
    const playChanged = lastSyncRef.current.playing !== localIsPlaying;
    if ((trackChanged || playChanged) && localTrack?.id && canControl) {
      lastSyncRef.current = { trackId: localTrack?.id, playing: localIsPlaying };
      syncPlaybackState(localTrack.id, localProgressRef.current, localIsPlaying);
    }
  }, [localTrack?.id, localIsPlaying]);

  // Seek helper — uses refs so it's always accurate, then broadcasts immediately
  const handleHostSeek = (newProgress: number) => {
    if (!canControl) return;
    setProgress(newProgress);
    window.dispatchEvent(new CustomEvent('seek-audio', { detail: newProgress }));
    // Broadcast seek with the current track & play state from refs
    syncPlaybackState(localTrackRef.current?.id, newProgress, localIsPlayingRef.current);
  };

  // Play/pause toggle — broadcasts immediately
  const handleHostPlayToggle = () => {
    if (!canControl) return;
    
    // If no track is currently loaded locally or in the room playback, play the first recommended song by default
    if (!localTrackRef.current && currentRoomTrack) {
      playTrack(currentRoomTrack, []);
      setIsPlaying(true);
      syncPlaybackState(currentRoomTrack.id, 0, true);
      return;
    }

    const nextPlayState = !localIsPlayingRef.current;
    setIsPlaying(nextPlayState);
    syncPlaybackState(localTrackRef.current?.id, localProgressRef.current, nextPlayState);
  };

  // Host lock toggle
  const handleToggleLock = async () => {
    if (!isHost) return;
    const newLock = !isRoomLocked;
    setIsRoomLocked(newLock); // optimistic update
    try {
      await fetch(`/api/rooms/${roomId}/lock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isLocked: newLock })
      });
      toast.success(newLock ? '🔒 Room locked — only you can control' : '🔓 Room unlocked — everyone can control');
    } catch {
      setIsRoomLocked(!newLock); // revert on error
      toast.error('Failed to toggle lock');
    }
  };

  // Manual alignment trigger
  const handleManualSync = () => {
    const cur = roomRef.current;
    if (cur) {
      toast.success('Syncing with room playback... ⚡');
      applyRoomPlayback(cur);
    }
  };

  // 4. Send Chat message
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    const currentMsg = messageText;
    setMessageText('');

    try {
      const res = await fetch(`/api/rooms/${roomId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: currentMsg })
      });
      const data = await res.json();
      if (data.success && data.room) {
        setChatHistory(data.room.chatHistory || []);
      }
    } catch (err) {
      console.error('Chat error:', err);
      toast.error('Failed to send message');
    }
  };

  // 5. Send Emoji reactions
  const sendEmojiReaction = async (emoji: string) => {
    spawnEmoji(emoji);
    try {
      await fetch(`/api/rooms/${roomId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji })
      });
    } catch (e) {
      console.error('Reaction sync failed:', e);
    }
  };

  const spawnEmoji = (emoji: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    const x = Math.random() * 80 + 10; // offset percentage
    setFloatingEmojis(prev => [...prev, { id, emoji, x }]);
    setTimeout(() => {
      setFloatingEmojis(prev => prev.filter(e => e.id !== id));
    }, 2500);
  };

  // 6. Shared Queue management
  const handleSearchSongs = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    const filtered = allTracks.filter(
      t => t.title.toLowerCase().includes(query.toLowerCase()) || 
           t.artistName.toLowerCase().includes(query.toLowerCase())
    );
    setSearchResults(filtered);
  };

  const addSongToRoomQueue = async (trackId: string) => {
    setSearchQuery('');
    setSearchResults([]);
    const updatedQueue = [...roomQueue, trackId];
    setRoomQueue(updatedQueue);

    try {
      const res = await fetch(`/api/rooms/${roomId}/queue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queue: updatedQueue })
      });
      const data = await res.json();
      if (data.success && data.room) {
        setRoomQueue(data.room.queue || []);
        toast.success('Track added to room queue!');
      } else {
        toast.error(data.error || 'Failed to update queue');
      }
    } catch (err) {
      console.error('Queue add failed:', err);
      toast.error('Failed to add to queue');
    }
  };

  const removeSongFromRoomQueue = async (idxToRemove: number) => {
    const updatedQueue = roomQueue.filter((_, i) => i !== idxToRemove);
    setRoomQueue(updatedQueue);

    try {
      const res = await fetch(`/api/rooms/${roomId}/queue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queue: updatedQueue })
      });
      const data = await res.json();
      if (data.success && data.room) {
        setRoomQueue(data.room.queue || []);
      }
    } catch (err) {
      console.error('Queue remove failed:', err);
    }
  };

  // Share session link helper
  const handleShareRoom = () => {
    setShowInviteMenu(true);
  };

  const getInviteDetails = () => {
    if (typeof window === 'undefined') return { link: '', code: '', message: '' };
    
    let pw = '';
    if (typeof window !== 'undefined') {
      pw = localStorage.getItem(`soundsphere-room-password-${roomId}`) || '';
    }
    
    const cleanRoomId = decodeURIComponent(roomId);
    
    const link = pw 
      ? `${window.location.origin}/room/${encodeURIComponent(cleanRoomId)}?pw=${encodeURIComponent(pw)}` 
      : `${window.location.origin}/room/${encodeURIComponent(cleanRoomId)}`;
      
    const code = pw 
      ? `${cleanRoomId}|${pw}` 
      : cleanRoomId;
      
    const message = `Hey! Join my Jam Room on SoundSphere! 🎧\n\nLink: ${link}\nInvite Code: ${code}\n\nLet's listen to awesome music together! 🎵`;
    
    return { link, code, message };
  };

  const handleLeaveRoom = async () => {
    setIsPlaying(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('soundsphere-active-room-id');
      localStorage.removeItem('soundsphere-active-room-name');
    }
    try {
      await fetch(`/api/rooms/${roomId}/leave`, { method: 'POST' });
    } catch (e) {
      console.error('Failed to leave room:', e);
    }
    router.push('/library');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', width: '100%', height: '80vh', alignItems: 'center', justifyContent: 'center', background: '#fbf9f5' }}>
        <div style={{ textAlign: 'center' }}>
          <Headphones size={40} className="pulse" color="#b08850" style={{ marginBottom: 12 }} />
          <p style={{ color: '#706155', fontSize: 14, fontWeight: 600 }}>Tuning in to Jam Room...</p>
        </div>
      </div>
    );
  }

  if (!room) return null;

  // Helper resolving track detail
  const defaultTrack = allTracks.length > 0 ? allTracks[0] : undefined;
  const currentRoomTrack = allTracks.find(t => t.id === room.currentTrackId) || localTrack || defaultTrack;

  return (
    <div className="jam-room-page" style={{
      minHeight: '100vh',
      background: 'var(--color-ss-bg, #fbf9f5)',
      color: '#221a15',
      fontFamily: 'Inter, sans-serif',
      boxSizing: 'border-box'
    }}>
      {/* ── Sticky Header Container ── */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        background: 'var(--color-ss-bg, #fbf9f5)',
        paddingTop: isMobile ? 'calc(var(--sat, 0px) + 8px)' : 16,
        paddingBottom: 8,
        width: '100%',
        boxSizing: 'border-box'
      }}>
        {/* ── Header Bar ── */}
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'stretch' : 'center',
          justifyContent: 'space-between',
          gap: isMobile ? 16 : 12,
          paddingBottom: '16px',
          borderBottom: '1px solid rgba(176,136,80,0.18)',
          marginBottom: isMobile ? '12px' : '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #b08850, #8f6a39)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(176,136,80,0.2)',
              flexShrink: 0
            }}>
              <Headphones size={24} color="#000" />
            </div>
            <div>
              <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 'clamp(17px, 5vw, 20px)', fontWeight: 900, margin: 0 }}>{room.name}</h1>
              <p style={{ color: '#706155', fontSize: 12, margin: '2px 0 0' }}>
                Host: <span style={{ fontWeight: 700 }}>{room.hostName}</span> • {room.isCollaborative ? '👥 Collaboration active' : '👑 Host Controls'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, width: isMobile ? '100%' : 'auto', boxSizing: 'border-box' }}>
            <button
              onClick={handleShareRoom}
              style={{
                flex: isMobile ? 1 : 'initial',
                background: 'rgba(176,136,80,0.08)',
                border: '1px solid rgba(176,136,80,0.18)',
                padding: '8px 16px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                height: 38,
                boxSizing: 'border-box'
              }}
            >
              <Share2 size={13} color="#b08850" /> Invite Friends
            </button>

            {/* Lock/Unlock control — host only */}
            {isHost && (
              <button
                onClick={handleToggleLock}
                title={isRoomLocked ? 'Unlock room controls' : 'Lock room controls'}
                style={{
                  flex: isMobile ? 1 : 'initial',
                  background: isRoomLocked ? 'rgba(220,80,80,0.15)' : 'rgba(80,200,120,0.12)',
                  color: isRoomLocked ? '#e05050' : '#50c878',
                  border: `1px solid ${isRoomLocked ? 'rgba(220,80,80,0.4)' : 'rgba(80,200,120,0.35)'}`,
                  padding: '8px 14px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5,
                  height: 38,
                  boxSizing: 'border-box',
                  transition: 'all 0.2s'
                }}
              >
                {isRoomLocked ? '🔒 Locked' : '🔓 Unlocked'}
              </button>
            )}
            {/* Non-host sees lock status badge */}
            {!isHost && isRoomLocked && (
              <span style={{
                display: 'flex', alignItems: 'center', gap: 4,
                background: 'rgba(220,80,80,0.12)',
                color: '#e05050',
                border: '1px solid rgba(220,80,80,0.3)',
                borderRadius: 20, padding: '4px 12px',
                fontSize: 11, fontWeight: 700, height: 38,
                boxSizing: 'border-box'
              }}>🔒 Host controls only</span>
            )}

            <button
              onClick={handleLeaveRoom}
              style={{
                flex: isMobile ? 1 : 'initial',
                background: '#b08850',
                color: '#000',
                border: 'none',
                padding: '8px 16px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                height: 38,
                boxSizing: 'border-box'
              }}
            >
              <LogOut size={13} /> Leave Room
            </button>
          </div>
        </div>

        {/* Mobile Tabbed Switcher */}
        {isMobile && (
          <div style={{
            display: 'flex',
            background: 'rgba(176,136,80,0.06)',
            border: '1px solid rgba(176,136,80,0.12)',
            borderRadius: 20,
            padding: 3,
            marginBottom: 8,
            gap: 2
          }}>
            {([
              { id: 'player', label: 'Player', icon: Music },
              { id: 'queue', label: 'Queue', icon: SkipForward },
              { id: 'chat', label: 'Chat & People', icon: MessageSquare }
            ] as const).map((tab) => {
              const ActiveIcon = tab.icon;
              const active = activeMobileTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveMobileTab(tab.id)}
                  style={{
                    flex: 1,
                    padding: '8px 10px',
                    borderRadius: 18,
                    border: 'none',
                    background: active ? '#b08850' : 'transparent',
                    color: active ? '#000' : '#706155',
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    transition: 'all 0.2s'
                  }}
                >
                  <ActiveIcon size={12} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Main Layout ── */}
      <div className="jam-room-grid" style={{
        display: 'grid',
        gap: '24px',
        maxWidth: 1200,
        margin: '0 auto',
        width: '100%',
        minWidth: 0,
        boxSizing: 'border-box'
      }}>
        {/* Left Column: Player & Queue */}
        {(!isMobile || activeMobileTab === 'player' || activeMobileTab === 'queue') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
            {/* Main Sync Player Card (Matches Spotify-like second reference image!) */}
            {(!isMobile || activeMobileTab === 'player') && (
              <div className="jam-player-card" style={{
                background: '#f5f0e6', // Soft cream background matching second ref image
                borderRadius: 24,
                border: '1px solid rgba(176,136,80,0.15)',
                boxShadow: '0 8px 30px rgba(43,34,26,0.04)',
                padding: '20px 24px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '100%',
                minWidth: 0,
                boxSizing: 'border-box',
                position: 'relative'
              }}>
                {/* Header text */}
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  <p style={{ color: '#706155', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', margin: 0 }}>
                    Playing from your library
                  </p>
                  <p style={{ color: '#221a15', fontSize: 12.5, fontWeight: 700, margin: '2px 0 0 0' }}>
                    {room.name}
                  </p>
                </div>

                {/* Big Square Album Cover Art */}
                <div style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  marginBottom: 16,
                  position: 'relative'
                }}>
                  <div style={{
                    width: 'clamp(200px, 60vw, 280px)',
                    height: 'clamp(200px, 60vw, 280px)',
                    borderRadius: 16,
                    overflow: 'hidden',
                    boxShadow: '0 12px 36px rgba(0,0,0,0.12)',
                    background: '#e5e7eb',
                    border: '1px solid rgba(176,136,80,0.1)'
                  }}>
                    {currentRoomTrack?.coverImage ? (
                      <img src={currentRoomTrack.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#374151' }}>
                        <Music size={40} color="#b08850" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Tagline & Song Title block */}
                <div style={{ width: '100%', textAlign: 'left', marginBottom: 12, boxSizing: 'border-box' }}>
                  <p style={{ color: '#706155', fontSize: 11.5, margin: '0 0 6px 0', fontWeight: 500 }}>
                    Where the music comes alive.
                  </p>
                  
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 12 }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 'clamp(18px, 5.5vw, 22px)', fontWeight: 900, margin: 0, color: '#221a15', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {currentRoomTrack ? currentRoomTrack.title : 'Nothing playing'}
                      </h2>
                      <p style={{ color: '#706155', fontSize: 13, margin: '2px 0 0 0', fontWeight: 500, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {currentRoomTrack ? currentRoomTrack.artistName : "Host hasn't selected a song yet."}
                      </p>
                    </div>
                    
                    {/* Action buttons (Heart & Download) */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
                      <motion.button 
                        whileTap={{ scale: 0.9 }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                        onClick={() => toast.success('Added to Liked Songs! 💖')}
                      >
                        <Heart size={20} color="#706155" />
                      </motion.button>
                      <motion.button 
                        whileTap={{ scale: 0.9 }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                        onClick={() => toast.success('Download started! 📥')}
                      >
                        <Download size={20} color="#706155" />
                      </motion.button>
                    </div>
                  </div>
                </div>

                {/* Progress Slider (Interactive for all controllers/users) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', padding: '0 4px', boxSizing: 'border-box', marginBottom: 20 }}>
                  <input
                    type="range"
                    min="0"
                    max={localDuration || currentRoomTrack?.duration || 100}
                    value={localProgress || 0}
                    onChange={e => handleHostSeek(parseFloat(e.target.value))}
                    disabled={!canControl}
                    style={{
                      width: '100%',
                      accentColor: '#221a15',
                      cursor: canControl ? 'pointer' : 'not-allowed',
                      opacity: canControl ? 1 : 0.5,
                      margin: 0,
                      boxSizing: 'border-box'
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#706155', fontWeight: 600 }}>
                    <span>{new Date((localProgress || 0) * 1000).toISOString().slice(14, 19)}</span>
                    <span>{new Date((localDuration || currentRoomTrack?.duration || 0) * 1000).toISOString().slice(14, 19)}</span>
                  </div>
                </div>

                {/* Control Buttons (Shuffle, Previous, circular Play/Pause, Next, Repeat) */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '0 8px',
                  boxSizing: 'border-box'
                }}>
                  {/* Shuffle Button */}
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#706155' }}
                    onClick={() => toast.success('Shuffle toggled! 🔀')}
                  >
                    <Shuffle size={20} />
                  </motion.button>

                  {/* Skip Back / Previous */}
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    style={{ background: 'none', border: 'none', cursor: canControl ? 'pointer' : 'not-allowed', color: '#221a15', opacity: canControl ? 1 : 0.35 }}
                    onClick={() => {
                      if (canControl) {
                        toast.success('Restarting track... ⏮️');
                        handleHostSeek(0);
                      } else {
                        toast.error('🔒 Room is locked — only host can control.');
                      }
                    }}
                  >
                    <SkipBack size={22} fill="#221a15" />
                  </motion.button>

                  {/* Large Dark Play/Pause Circle */}
                  <motion.button
                    whileHover={{ scale: canControl ? 1.05 : 1 }}
                    whileTap={{ scale: canControl ? 0.95 : 1 }}
                    onClick={handleHostPlayToggle}
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      background: '#221a15',
                      color: '#ffffff',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: canControl ? 'pointer' : 'not-allowed',
                      boxShadow: '0 6px 20px rgba(34,26,21,0.2)',
                      opacity: canControl ? 1 : 0.45
                    }}
                  >
                    {localIsPlaying ? <Pause size={22} fill="white" color="white" /> : <Play size={22} fill="white" color="white" style={{ marginLeft: 3 }} />}
                  </motion.button>

                  {/* Skip Forward / Next */}
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#221a15' }}
                    onClick={() => {
                      toast.success('Skipping to next in queue... ⏭️');
                    }}
                  >
                    <SkipForward size={22} fill="#221a15" />
                  </motion.button>

                  {/* Repeat Button */}
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#706155' }}
                    onClick={() => toast.success('Repeat toggled! 🔁')}
                  >
                    <Repeat size={20} />
                  </motion.button>
                </div>

                {/* Manual Sync Button — available to all participants */}
                <button
                  onClick={handleManualSync}
                  disabled={isSyncing}
                  style={{
                    marginTop: 16,
                    background: 'rgba(34,26,21,0.05)',
                    border: '1px solid rgba(34,26,21,0.15)',
                    borderRadius: 16,
                    padding: '5px 12px',
                    fontSize: 10.5,
                    fontWeight: 700,
                    color: '#221a15',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  ⚡ Sync with Room
                </button>
              </div>
            )}

          {/* Browse & Search Section */}
          {(!isMobile || activeMobileTab === 'player') && (
            <div className="jam-browse-card" style={{
              background: '#ffffff',
              borderRadius: 20,
              border: '1px solid rgba(176,136,80,0.18)',
              boxShadow: '0 8px 30px rgba(43,34,26,0.04)',
              marginTop: 20,
              width: '100%',
              minWidth: 0,
              boxSizing: 'border-box'
            }}>
              <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 16, fontWeight: 900, margin: '0 0 16px', color: '#221a15' }}>
                Browse & Search Songs
              </h3>

              {/* Inside-Room Search Input */}
              <div style={{ position: 'relative', marginBottom: 20 }}>
                <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#b08850' }} />
                <input
                  type="text"
                  placeholder="Search songs to play or queue..."
                  value={roomSearchQuery}
                  onChange={e => setRoomSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px 10px 36px',
                    borderRadius: 12,
                    border: '1px solid rgba(176,136,80,0.25)',
                    fontSize: 12.5,
                    outline: 'none',
                    background: '#faf9f6',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {roomSearchQuery.trim() !== '' ? (
                /* ── Search Results ── */
                <div>
                  <h4 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 13, fontWeight: 800, margin: '0 0 12px', color: '#b08850', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    🔍 Search Results
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', boxSizing: 'border-box' }}>
                    {allTracks.filter(t => 
                      t.title.toLowerCase().includes(roomSearchQuery.toLowerCase()) || 
                      t.artistName.toLowerCase().includes(roomSearchQuery.toLowerCase())
                    ).slice(0, 5).map((track) => (
                      <motion.div
                        key={track.id}
                        whileHover={{ x: 4, background: 'rgba(176,136,80,0.05)' }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          borderRadius: 12,
                          background: 'rgba(43,34,26,0.02)',
                          border: '1px solid rgba(176,136,80,0.06)',
                          width: '100%',
                          boxSizing: 'border-box'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 6, overflow: 'hidden', background: '#e5e7eb', flexShrink: 0 }}>
                            {track.coverImage && <img src={track.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <p style={{ fontSize: 12.5, fontWeight: 700, margin: 0, color: '#221a15', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.title}</p>
                            <p style={{ fontSize: 11, color: '#706155', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.artistName}</p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            onClick={() => {
                              playTrack(track, []);
                              syncPlaybackState(track.id, 0, true);
                              toast.success(`Playing "${track.title}" in the room! 🎵`);
                            }}
                            style={{
                              background: '#b08850',
                              border: 'none',
                              color: '#000',
                              padding: '5px 10px',
                              borderRadius: 8,
                              fontSize: 10.5,
                              fontWeight: 800,
                              cursor: 'pointer'
                            }}
                          >
                            Play
                          </button>
                          <button
                            onClick={() => {
                              addSongToRoomQueue(track.id);
                              toast.success(`Added "${track.title}" to queue! ➕`);
                            }}
                            style={{
                              background: 'rgba(176,136,80,0.08)',
                              border: '1px solid rgba(176,136,80,0.18)',
                              color: '#b08850',
                              padding: '5px 10px',
                              borderRadius: 8,
                              fontSize: 10.5,
                              fontWeight: 800,
                              cursor: 'pointer'
                            }}
                          >
                            Queue
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : (
                /* ── Home-style Playlists / Browse Sections ── */
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  
                  {/* Home-style Quick Vibe Grid (6 items) */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 8,
                    width: '100%',
                    boxSizing: 'border-box'
                  }}>
                    {[
                      { label: 'Liked Songs', color: 'linear-gradient(135deg, #4f46e5, #6366f1)', trackIdx: 0 },
                      { label: 'Discover Weekly', color: 'linear-gradient(135deg, #059669, #10b981)', trackIdx: 1 },
                      { label: 'Daily Mix 1', color: 'linear-gradient(135deg, #db2777, #ec4899)', trackIdx: 2 },
                      { label: 'Midnight Vibes', color: 'linear-gradient(135deg, #1e3a8a, #3b82f6)', trackIdx: 3 },
                      { label: 'Workout Energy', color: 'linear-gradient(135deg, #b45309, #f59e0b)', trackIdx: 4 },
                      { label: 'Chill Lounge', color: 'linear-gradient(135deg, #0369a1, #0ea5e9)', trackIdx: 5 }
                    ].map((vibe) => {
                      const track = allTracks[vibe.trackIdx % allTracks.length];
                      return (
                        <motion.div
                          key={vibe.label}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => {
                            if (track) {
                              playTrack(track, []);
                              syncPlaybackState(track.id, 0, true);
                              toast.success(`Playing ${vibe.label} selection: "${track.title}"! 🎵`);
                            }
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            background: 'rgba(43,34,26,0.03)',
                            border: '1px solid rgba(176,136,80,0.08)',
                            borderRadius: 12,
                            padding: '6px 10px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            overflow: 'hidden',
                            height: 44,
                            boxSizing: 'border-box'
                          }}
                        >
                          <div style={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            background: vibe.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            <Music size={12} color="#ffffff" />
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#221a15', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                            {vibe.label}
                          </span>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Home-style Horizontal Scrolling Recommended Section */}
                  <div style={{ width: '100%', boxSizing: 'border-box', marginTop: 8 }}>
                    <h4 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 13, fontWeight: 800, margin: '0 0 12px', color: '#b08850', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Recommended Songs
                    </h4>
                    <div style={{
                      display: 'flex',
                      gap: 12,
                      overflowX: 'auto',
                      paddingBottom: 10,
                      width: '100%',
                      boxSizing: 'border-box',
                      scrollSnapType: 'x mandatory',
                      scrollbarWidth: 'none',
                      msOverflowStyle: 'none'
                    }} className="hide-scrollbar">
                      {allTracks.map((track) => (
                        <motion.div
                          key={track.id}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            playTrack(track, []);
                            syncPlaybackState(track.id, 0, true);
                            toast.success(`Playing "${track.title}"! 🎵`);
                          }}
                          style={{
                            flexShrink: 0,
                            width: 110,
                            scrollSnapAlign: 'start',
                            cursor: 'pointer'
                          }}
                        >
                          <div style={{
                            width: 110,
                            height: 110,
                            borderRadius: 14,
                            overflow: 'hidden',
                            background: '#e5e7eb',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                            border: '1px solid rgba(176,136,80,0.1)',
                            marginBottom: 6,
                            position: 'relative'
                          }}>
                            {track.coverImage && <img src={track.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                            
                            {/* Play button overlay */}
                            <div style={{
                              position: 'absolute',
                              bottom: 6,
                              right: 6,
                              width: 24,
                              height: 24,
                              borderRadius: '50%',
                              background: '#b08850',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                            }}>
                              <Play size={10} fill="black" stroke="none" />
                            </div>
                          </div>
                          <p style={{
                            fontSize: 11.5,
                            fontWeight: 700,
                            margin: 0,
                            color: '#221a15',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {track.title}
                          </p>
                          <p style={{
                            fontSize: 10,
                            color: '#706155',
                            margin: '2px 0 0',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {track.artistName}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Section 3: Featured Carousels (Horizontal Slider) */}
                  <div style={{ width: '100%', boxSizing: 'border-box', marginTop: 16 }}>
                    <h4 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 13, fontWeight: 800, margin: '0 0 12px', color: '#b08850', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      🌟 Featured Carousels
                    </h4>
                    <div style={{
                      display: 'flex',
                      gap: 12,
                      overflowX: 'auto',
                      paddingBottom: 10,
                      width: '100%',
                      boxSizing: 'border-box',
                      scrollSnapType: 'x mandatory',
                      scrollbarWidth: 'none',
                      msOverflowStyle: 'none'
                    }} className="hide-scrollbar">
                      {allTracks.slice().reverse().map((track) => (
                        <motion.div
                          key={`carousel-${track.id}`}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            playTrack(track, []);
                            syncPlaybackState(track.id, 0, true);
                            toast.success(`Playing "${track.title}"! 🎵`);
                          }}
                          style={{
                            flexShrink: 0,
                            width: 100,
                            scrollSnapAlign: 'start',
                            cursor: 'pointer'
                          }}
                        >
                          <div style={{
                            width: 100,
                            height: 100,
                            borderRadius: 14,
                            overflow: 'hidden',
                            background: '#e5e7eb',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                            border: '1px solid rgba(176,136,80,0.1)',
                            marginBottom: 6,
                            position: 'relative'
                          }}>
                            {track.coverImage && <img src={track.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                            <div style={{
                              position: 'absolute',
                              bottom: 6,
                              right: 6,
                              width: 22,
                              height: 22,
                              borderRadius: '50%',
                              background: '#b08850',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                            }}>
                              <Play size={8} fill="black" stroke="none" />
                            </div>
                          </div>
                          <p style={{ fontSize: 11, fontWeight: 700, margin: 0, color: '#221a15', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {track.title}
                          </p>
                          <p style={{ fontSize: 9.5, color: '#706155', margin: '2px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {track.artistName}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Section 4: All Tracks (Numbered List with Play and Queue options!) */}
                  <div style={{ width: '100%', boxSizing: 'border-box', marginTop: 20 }}>
                    <h4 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 13, fontWeight: 800, margin: '0 0 12px', color: '#b08850', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      🎵 All Tracks Queue
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', boxSizing: 'border-box' }}>
                      {allTracks.slice((allTracksPage - 1) * tracksPerPage, allTracksPage * tracksPerPage).map((track, i) => (
                        <div
                          key={`list-${track.id}`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 12px',
                            borderRadius: 12,
                            background: 'rgba(43,34,26,0.02)',
                            border: '1px solid rgba(176,136,80,0.06)',
                            width: '100%',
                            boxSizing: 'border-box',
                            gap: 12
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                            <span style={{ fontSize: 12, fontWeight: 800, color: '#b08850', width: 16, textAlign: 'center', flexShrink: 0 }}>
                              {(allTracksPage - 1) * tracksPerPage + i + 1}
                            </span>
                            <div style={{ width: 36, height: 36, borderRadius: 6, overflow: 'hidden', background: '#e5e7eb', flexShrink: 0 }}>
                              {track.coverImage && <img src={track.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <p style={{ fontSize: 12.5, fontWeight: 700, margin: 0, color: '#221a15', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {track.title}
                              </p>
                              <p style={{ fontSize: 11, color: '#706155', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {track.artistName}
                              </p>
                            </div>
                          </div>
                          
                          {/* Play & Queue Actions */}
                          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                            <button
                              onClick={() => {
                                playTrack(track, []);
                                syncPlaybackState(track.id, 0, true);
                                toast.success(`Playing "${track.title}"! 🎵`);
                              }}
                              style={{
                                background: '#b08850',
                                border: 'none',
                                color: '#000',
                                padding: '5px 12px',
                                borderRadius: 8,
                                fontSize: 10.5,
                                fontWeight: 800,
                                cursor: 'pointer'
                              }}
                            >
                              Play
                            </button>
                            <button
                              onClick={() => {
                                addSongToRoomQueue(track.id);
                                toast.success(`Added "${track.title}" to queue! ➕`);
                              }}
                              style={{
                                background: 'rgba(176,136,80,0.08)',
                                border: '1px solid rgba(176,136,80,0.18)',
                                color: '#b08850',
                                padding: '5px 12px',
                                borderRadius: 8,
                                fontSize: 10.5,
                                fontWeight: 800,
                                cursor: 'pointer'
                              }}
                            >
                              Queue
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Pagination Controls */}
                    {allTracks.length > tracksPerPage && (
                      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 16 }}>
                        <button
                          onClick={() => setAllTracksPage(p => Math.max(1, p - 1))}
                          disabled={allTracksPage === 1}
                          style={{
                            padding: '8px 16px',
                            borderRadius: 20,
                            background: allTracksPage === 1 ? 'transparent' : 'rgba(176,136,80,0.1)',
                            border: `1px solid ${allTracksPage === 1 ? 'rgba(176,136,80,0.1)' : 'rgba(176,136,80,0.3)'}`,
                            color: allTracksPage === 1 ? 'rgba(34,26,21,0.3)' : '#b08850',
                            fontWeight: 700,
                            fontSize: 12,
                            cursor: allTracksPage === 1 ? 'default' : 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          Previous
                        </button>
                        <span style={{ display: 'flex', alignItems: 'center', fontSize: 12, fontWeight: 700, color: '#706155' }}>
                          Page {allTracksPage} of {Math.ceil(allTracks.length / tracksPerPage)}
                        </span>
                        <button
                          onClick={() => setAllTracksPage(p => Math.min(Math.ceil(allTracks.length / tracksPerPage), p + 1))}
                          disabled={allTracksPage >= Math.ceil(allTracks.length / tracksPerPage)}
                          style={{
                            padding: '8px 16px',
                            borderRadius: 20,
                            background: allTracksPage >= Math.ceil(allTracks.length / tracksPerPage) ? 'transparent' : '#b08850',
                            border: `1px solid ${allTracksPage >= Math.ceil(allTracks.length / tracksPerPage) ? 'rgba(176,136,80,0.1)' : '#b08850'}`,
                            color: allTracksPage >= Math.ceil(allTracks.length / tracksPerPage) ? 'rgba(34,26,21,0.3)' : '#fff',
                            fontWeight: 700,
                            fontSize: 12,
                            cursor: allTracksPage >= Math.ceil(allTracks.length / tracksPerPage) ? 'default' : 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Shared Room Queue Panel */}
          {(!isMobile || activeMobileTab === 'queue') && (
            <div className="jam-browse-card" style={{
              background: '#ffffff',
              borderRadius: 20,
              border: '1px solid rgba(176,136,80,0.18)',
              boxShadow: '0 8px 30px rgba(43,34,26,0.04)',
              width: '100%',
              minWidth: 0,
              boxSizing: 'border-box'
            }}>
            <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 16, fontWeight: 800, margin: '0 0 16px' }}>Shared Queue</h3>

            {/* Song Search to Add to Queue */}
            <div style={{ position: 'relative', marginBottom: 16 }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#706155' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => handleSearchSongs(e.target.value)}
                placeholder="Search and append songs to queue..."
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 36px',
                  borderRadius: 12,
                  border: '1px solid rgba(176,136,80,0.25)',
                  outline: 'none',
                  fontSize: 12.5,
                  background: '#faf9f6'
                }}
              />

              {/* Search dropdown results */}
              {searchResults.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  zIndex: 200,
                  background: '#ffffff',
                  border: '1px solid rgba(176,136,80,0.18)',
                  borderRadius: 12,
                  maxHeight: 220,
                  overflowY: 'auto',
                  boxShadow: '0 8px 32px rgba(43,34,26,0.12)',
                  padding: '6px'
                }}>
                  {searchResults.map(track => (
                    <div
                      key={track.id}
                      onClick={() => addSongToRoomQueue(track.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        borderRadius: 8,
                        cursor: 'pointer',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(176,136,80,0.05)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 4, background: '#e5e7eb', overflow: 'hidden' }}>
                          {track.coverImage && <img src={track.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                        </div>
                        <div>
                          <p style={{ fontSize: 12, fontWeight: 700, margin: 0, color: '#221a15' }}>{track.title}</p>
                          <p style={{ fontSize: 10.5, color: '#706155', margin: 0 }}>{track.artist}</p>
                        </div>
                      </div>
                      <span style={{ fontSize: 11, color: '#b08850', fontWeight: 800 }}>+ Add</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Queue List */}
            {roomQueue.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '24px 0', fontSize: 12.5, color: '#706155', fontStyle: 'italic', margin: 0 }}>
                Queue is empty. Search and add tracks!
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {roomQueue.map((trackId, idx) => {
                  const trackObj = allTracks.find(t => t.id === trackId);
                  if (!trackObj) return null;
                  return (
                    <div
                      key={`${trackId}-${idx}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        background: 'rgba(176,136,80,0.02)',
                        border: '1px solid rgba(176,136,80,0.08)',
                        borderRadius: 12
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: '#706155', width: 14 }}>{idx + 1}</span>
                        <div style={{ width: 36, height: 36, borderRadius: 6, overflow: 'hidden', background: '#e5e7eb' }}>
                          {trackObj.coverImage && <img src={trackObj.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                        </div>
                        <div>
                          <p style={{ fontSize: 12.5, fontWeight: 700, margin: 0 }}>{trackObj.title}</p>
                          <p style={{ fontSize: 11, color: '#706155', margin: 0 }}>{trackObj.artistName}</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {canControl && (
                          <button
                            onClick={() => {
                              playTrack(trackObj, []);
                              syncPlaybackState(trackObj.id, 0, true);
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#b08850',
                              fontSize: 11,
                              fontWeight: 800,
                              cursor: 'pointer'
                            }}
                          >
                            Play Now
                          </button>
                        )}
                        <button
                          onClick={() => removeSongFromRoomQueue(idx)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#e11d48',
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          )}
        </div>
        )}

        {/* Right Column: Participants, Chat & Emoji reactions */}
        {(!isMobile || activeMobileTab === 'chat') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, height: isMobile ? 'auto' : '80vh' }}>
          {/* Active Participants List */}
          <div className="jam-browse-card" style={{
            background: '#ffffff',
            borderRadius: 20,
            border: '1px solid rgba(176,136,80,0.18)',
            boxShadow: '0 8px 30px rgba(43,34,26,0.04)',
            width: '100%',
            minWidth: 0,
            boxSizing: 'border-box'
          }}>
            <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 15, fontWeight: 800, margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={16} color="#b08850" /> Active Listeners ({room.participants?.length || 0})
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {room.participants?.map(p => (
                <div
                  key={p.userId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 10px',
                    borderRadius: 16,
                    background: p.role === 'host' ? 'rgba(176,136,80,0.12)' : 'rgba(43,34,26,0.04)',
                    border: p.role === 'host' ? '1px solid rgba(176,136,80,0.25)' : '1px solid transparent',
                    fontSize: 12,
                    fontWeight: 600
                  }}
                >
                  {p.role === 'host' && <Crown size={12} color="#b08850" fill="#b08850" />}
                  <span>{p.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Social Chat Interface with Bubble reactions */}
          <div className="jam-browse-card" style={{
            background: '#ffffff',
            borderRadius: 20,
            border: '1px solid rgba(176,136,80,0.18)',
            boxShadow: '0 8px 30px rgba(43,34,26,0.04)',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            overflow: 'hidden',
            width: '100%',
            minWidth: 0,
            boxSizing: 'border-box'
          }}>
            {/* Animated Emoji Floating Container overlay */}
            <div style={{
              position: 'absolute',
              bottom: 80,
              left: 0,
              right: 0,
              top: 0,
              pointerEvents: 'none',
              zIndex: 100,
              overflow: 'hidden'
            }}>
              <AnimatePresence>
                {floatingEmojis.map(item => (
                  <motion.div
                    key={item.id}
                    initial={{ y: 350, opacity: 0, x: `${item.x}%`, scale: 0.8 }}
                    animate={{ 
                      y: 0, 
                      opacity: [0, 1, 1, 0],
                      scale: [0.8, 1.4, 1.4, 0.8],
                      x: [`${item.x}%`, `${item.x + (Math.random() * 20 - 10)}%`] 
                    }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 2, ease: 'easeOut' }}
                    style={{
                      position: 'absolute',
                      fontSize: 28,
                      bottom: 0
                    }}
                  >
                    {item.emoji}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 15, fontWeight: 800, margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <MessageSquare size={16} color="#b08850" /> Live Chat
            </h3>

            {/* Chat message logs */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              paddingRight: 6,
              marginBottom: 16
            }}>
              {chatHistory.map(msg => {
                const isSystem = msg.userId === 'system';
                const isOwnMsg = msg.userId === currentUserId;

                if (isSystem) {
                  return (
                    <div key={msg.id} style={{ textAlign: 'center', padding: '4px 8px', fontSize: 11.5, color: '#706155', fontStyle: 'italic' }}>
                      {msg.text}
                    </div>
                  );
                }

                return (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isOwnMsg ? 'flex-end' : 'flex-start',
                      width: '100%'
                    }}
                  >
                    <div style={{ display: 'flex', gap: 6, alignItems: 'baseline', marginBottom: 2 }}>
                      <span style={{ fontSize: 10.5, fontWeight: 700, color: '#706155' }}>{msg.userName}</span>
                      <span style={{ fontSize: 9, color: '#a08f84' }}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div style={{
                      padding: '8px 12px',
                      borderRadius: 12,
                      background: isOwnMsg ? '#b08850' : 'rgba(43,34,26,0.05)',
                      color: isOwnMsg ? '#000' : '#221a15',
                      fontSize: 12.5,
                      fontWeight: 500,
                      maxWidth: '85%',
                      wordBreak: 'break-word',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                    }}>
                      {msg.text}
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            {/* Emoji Reaction Drawer */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 8px',
              borderRadius: 12,
              background: 'rgba(176,136,80,0.05)',
              border: '1px solid rgba(176,136,80,0.12)',
              marginBottom: 12
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#706155' }}>React:</span>
              <div style={{ display: 'flex', gap: 10 }}>
                {['❤️', '🔥', '😂', '🎉', '👏', '🚀'].map(emoji => (
                  <motion.button
                    key={emoji}
                    whileHover={{ scale: 1.25, y: -2, background: 'rgba(176,136,80,0.12)' }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => sendEmojiReaction(emoji)}
                    style={{
                      background: 'rgba(255,255,255,0.7)',
                      border: '1px solid rgba(176,136,80,0.15)',
                      fontSize: 16,
                      cursor: 'pointer',
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 6px rgba(43,34,26,0.04)',
                      transition: 'all 0.15s'
                    }}
                  >
                    {emoji}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Chat Input Console */}
            <form onSubmit={handleSendChat} style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={messageText}
                onChange={e => setMessageText(e.target.value)}
                placeholder="Say something to the room..."
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: 12,
                  border: '1px solid rgba(176,136,80,0.25)',
                  fontSize: 12.5,
                  outline: 'none',
                  background: '#faf9f6'
                }}
              />
              <button
                type="submit"
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  background: '#b08850',
                  color: '#000',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <Send size={15} />
              </button>
            </form>
          </div>
        </div>
        )}
        {/* ─── Invite Friends Bottom Sheet ───────────────────────────────── */}
        <AnimatePresence>
          {showInviteMenu && (() => {
            const { link, code, message } = getInviteDetails();
            return (
              <>
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowInviteMenu(false)}
                  style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.6)',
                    zIndex: 9999,
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
                    background: 'var(--color-ss-bg, #fbf9f5)',
                    borderTopLeftRadius: 24,
                    borderTopRightRadius: 24,
                    padding: '12px 20px 40px',
                    zIndex: 10000,
                    boxShadow: '0 -10px 40px rgba(43, 34, 26, 0.08)',
                    borderTop: '1px solid rgba(176, 136, 80, 0.22)',
                    maxWidth: '100%',
                    boxSizing: 'border-box'
                  }}
                >
                  {/* Drag handle */}
                  <div style={{
                    width: 36,
                    height: 4,
                    borderRadius: 2,
                    background: 'rgba(176, 136, 80, 0.15)',
                    margin: '0 auto 24px',
                  }} />

                  <div style={{ padding: '0 4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(176, 136, 80, 0.12)', border: '1px solid rgba(176, 136, 80, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Share2 size={15} color="#b08850" /></div>
                        <div>
                          <h3 style={{ fontFamily: 'Outfit, sans-serif', color: '#221a15', fontSize: 16, fontWeight: 800 }}>Invite Friends</h3>
                          <p style={{ color: '#706155', fontSize: 11 }}>Share access to this Jam Room</p>
                        </div>
                      </div>
                      <button onClick={() => setShowInviteMenu(false)} style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(176, 136, 80, 0.08)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#706155' }}><X size={14} /></button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(link);
                          toast.success('Invite link copied! 📋');
                          setShowInviteMenu(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '14px 18px',
                          borderRadius: 14,
                          background: '#ffffff',
                          border: '1px solid rgba(176, 136, 80, 0.18)',
                          cursor: 'pointer',
                          textAlign: 'left',
                          width: '100%',
                          transition: 'all 0.2s'
                        }}
                      >
                        <div>
                          <p style={{ fontSize: 13.5, fontWeight: 700, margin: 0, color: '#221a15' }}>Copy Invite Link</p>
                          <p style={{ fontSize: 10.5, color: '#706155', margin: '2px 0 0' }}>Bypasses password screen automatically</p>
                        </div>
                        <Copy size={16} color="#b08850" />
                      </button>

                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(code);
                          toast.success('Invite code copied! 📋');
                          setShowInviteMenu(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '14px 18px',
                          borderRadius: 14,
                          background: '#ffffff',
                          border: '1px solid rgba(176, 136, 80, 0.18)',
                          cursor: 'pointer',
                          textAlign: 'left',
                          width: '100%',
                          transition: 'all 0.2s'
                        }}
                      >
                        <div>
                          <p style={{ fontSize: 13.5, fontWeight: 700, margin: 0, color: '#221a15' }}>Copy Invite Code</p>
                          <p style={{ fontSize: 10.5, color: '#706155', margin: '2px 0 0' }}>Code with password details embedded</p>
                        </div>
                        <Copy size={16} color="#b08850" />
                      </button>

                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(message);
                          toast.success('Invite message copied! ✉️');
                          setShowInviteMenu(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '14px 18px',
                          borderRadius: 14,
                          background: '#ffffff',
                          border: '1px solid rgba(176, 136, 80, 0.18)',
                          cursor: 'pointer',
                          textAlign: 'left',
                          width: '100%',
                          transition: 'all 0.2s'
                        }}
                      >
                        <div>
                          <p style={{ fontSize: 13.5, fontWeight: 700, margin: 0, color: '#221a15' }}>Share Message</p>
                          <p style={{ fontSize: 10.5, color: '#706155', margin: '2px 0 0' }}>Copies link and code as a single text message</p>
                        </div>
                        <Send size={16} color="#b08850" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              </>
            );
          })()}
        </AnimatePresence>
      </div>
    </div>
  );
}
