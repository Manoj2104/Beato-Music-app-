'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music2, Users, Layers, FolderPlus, X, AlertTriangle, Crown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { usePlaylistStore } from '@/store/playlistStore';

const G = '#0f5132';
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

export default function CreateOptionsBottomSheet() {
  const router = useRouter();
  const { user, isCreateBottomSheetOpen, setCreateBottomSheetOpen, toggleSavePlaylist } = useAuthStore();
  const isFree = user?.subscription === 'free';
  const { addPlaylist } = usePlaylistStore();

  // Modals States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  const [showJoinRoomModal, setShowJoinRoomModal] = useState(false);
  const [showActiveRoomWarning, setShowActiveRoomWarning] = useState(false);

  // Input States
  const [newTitle, setNewTitle] = useState('');
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDesc, setNewRoomDesc] = useState('');
  const [newRoomCollab, setNewRoomCollab] = useState(true);
  const [newRoomPassword, setNewRoomPassword] = useState('');
  const [joinRoomCode, setJoinRoomCode] = useState('');
  const [existingRoomId, setExistingRoomId] = useState<string | null>(null);
  const [existingRoomName, setExistingRoomName] = useState('');

  // Reset modals when the bottom sheet is opened
  useEffect(() => {
    if (isCreateBottomSheetOpen) {
      setShowCreateModal(false);
      setShowCreateRoomModal(false);
      setShowJoinRoomModal(false);
      setShowActiveRoomWarning(false);
    }
  }, [isCreateBottomSheetOpen]);

  // Playlist handlers
  const handleCreatePlaylist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const plId = `playlist-custom-${Date.now()}`;
    const randomGradient = GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)];
    const pl = {
      id: plId,
      title: newTitle.trim(),
      description: '',
      coverImage: '',
      ownerId: user?.id || 'user-1',
      ownerName: user?.name || 'You',
      tracks: [],
      totalTracks: 0,
      duration: 0,
      isPublic: true,
      isCollaborative: false,
      followers: 0,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      gradientCss: randomGradient.css,
      tags: [],
    };
    addPlaylist(pl);
    toggleSavePlaylist(plId);
    toast.success(`"${pl.title}" created 🎵`, { style: { background: '#1a1a1a', color: '#fff', border: `1px solid ${G}30` } });
    setNewTitle('');
    setShowCreateModal(false);
    setCreateBottomSheetOpen(false);
    router.push(`/playlist/${plId}`);
  };

  // Jam Room handlers
  const handleCreateRoomClick = () => {
    const activeRoomId = typeof window !== 'undefined' ? localStorage.getItem('soundsphere-active-room-id') : null;
    const activeRoomName = typeof window !== 'undefined' ? localStorage.getItem('soundsphere-active-room-name') : null;

    setCreateBottomSheetOpen(false); // Close the options sheet

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
        credentials: 'include',
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

  const handleJoinRoomSubmit = () => {
    if (joinRoomCode.trim()) {
      let targetId = joinRoomCode.trim();
      if (targetId.includes('|')) {
        const [rId, rPw] = targetId.split('|');
        localStorage.setItem(`soundsphere-room-password-${rId}`, rPw);
        targetId = rId;
      }
      setShowJoinRoomModal(false);
      router.push(`/room/${targetId}`);
    }
  };

  return (
    <>
      {/* ─── Bottom Sheet / Create Options Menu (Mobile) ──────────────────────── */}
      <AnimatePresence>
        {isCreateBottomSheetOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCreateBottomSheetOpen(false)}
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
                background: '#ffffff',
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                padding: '12px 20px 40px',
                zIndex: 1000,
                boxShadow: '0 -10px 40px var(--color-ss-border, rgba(43, 34, 26, 0.08))',
                borderTop: '1px solid var(--color-ss-border, rgba(43, 34, 26, 0.08))',
                maxWidth: '100%',
                boxSizing: 'border-box',
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
                      setCreateBottomSheetOpen(false);
                      setShowCreateModal(true);
                    }
                  },
                  {
                    title: 'Create Jam Room',
                    desc: 'Host a room and listen together with friends',
                    icon: Users,
                    isPremium: true,
                    onClick: () => {
                      if (isFree) {
                        setCreateBottomSheetOpen(false);
                        router.push('/premium');
                        toast('Jam Rooms require Beato Premium! 👑', { style: { background: '#1a1a1a', color: '#fff' } });
                      } else {
                        handleCreateRoomClick();
                      }
                    }
                  },
                  {
                    title: 'Join Jam Room',
                    desc: 'Join an existing room using a code',
                    icon: Users,
                    isPremium: true,
                    onClick: () => {
                      if (isFree) {
                        setCreateBottomSheetOpen(false);
                        router.push('/premium');
                        toast('Jam Rooms require Beato Premium! 👑', { style: { background: '#1a1a1a', color: '#fff' } });
                      } else {
                        setCreateBottomSheetOpen(false);
                        setShowJoinRoomModal(true);
                      }
                    }
                  },
                  {
                    title: 'Collaborative playlist',
                    desc: 'Create a playlist together with friends',
                    icon: Users,
                    onClick: () => {
                      setCreateBottomSheetOpen(false);
                      setShowCreateModal(true);
                    }
                  },
                  {
                    title: 'Blend',
                    desc: "Combine your friends' tastes into a playlist",
                    icon: Layers,
                    onClick: () => {
                      setCreateBottomSheetOpen(false);
                      toast('Blend playlists coming soon! 👥', { style: { background: '#1a1a1a', color: '#fff' } });
                    }
                  },
                  {
                    title: 'Folder',
                    desc: 'Organize your playlists',
                    icon: FolderPlus,
                    onClick: () => {
                      setCreateBottomSheetOpen(false);
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <p style={{ color: 'var(--color-ss-text-primary, #221a15)', fontSize: 16, fontWeight: 700, margin: 0 }}>{item.title}</p>
                          {(item as any).isPremium && isFree && (
                            <span style={{ 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              gap: 3, 
                              background: 'linear-gradient(135deg, #0f5132, #10b981)', 
                              color: '#fff', 
                              fontSize: 9, 
                              fontWeight: 800, 
                              padding: '2px 6px', 
                              borderRadius: 8, 
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em'
                            }}>
                              <Crown size={8} fill="#fff" /> Premium
                            </span>
                          )}
                        </div>
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

      {/* ─── Create Playlist Modal (Spotify-style) ────────────────────── */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(255, 255, 255, 0.98)', backdropFilter: 'blur(16px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}
          >
            <form onSubmit={handleCreatePlaylist} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', maxWidth: 400 }}>
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
                    border: '1.5px solid rgba(15, 81, 50, 0.2)',
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
                    background: newTitle.trim() ? G : 'rgba(15, 81, 50, 0.15)',
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
                background: '#ffffff',
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
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(15,81,50,0.08)', border: '1px solid rgba(15,81,50,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Users size={15} color="#0f5132" /></div>
                    <div>
                      <h3 style={{ fontFamily: 'Outfit, sans-serif', color: '#0f172a', fontSize: 16, fontWeight: 800 }}>Create Jam Room</h3>
                      <p style={{ color: '#64748b', fontSize: 11 }}>Listen together with friends in real-time</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setShowCreateRoomModal(false)} style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(15,81,50,0.06)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}><X size={14} /></button>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', color: '#64748b', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Room Name</label>
                  <input suppressHydrationWarning value={newRoomName} onChange={e => setNewRoomName(e.target.value)} placeholder="My Awesome Party" required
                    style={{ width: '100%', background: '#ffffff', border: '1px solid rgba(15, 81, 50, 0.15)', borderRadius: 10, padding: '11px 14px', color: '#0f172a', fontSize: 14, outline: 'none', boxSizing: 'border-box', transition: 'all 0.2s' }}
                    onFocus={e => { e.currentTarget.style.borderColor = '#0f5132'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(15,81,50,0.06)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'rgba(15,81,50,0.15)'; e.currentTarget.style.boxShadow = 'none'; }} />
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', color: '#64748b', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Description (Optional)</label>
                  <input suppressHydrationWarning value={newRoomDesc} onChange={e => setNewRoomDesc(e.target.value)} placeholder="Come listen to awesome music!"
                    style={{ width: '100%', background: '#ffffff', border: '1px solid rgba(15, 81, 50, 0.15)', borderRadius: 10, padding: '11px 14px', color: '#0f172a', fontSize: 14, outline: 'none', boxSizing: 'border-box', transition: 'all 0.2s' }}
                    onFocus={e => { e.currentTarget.style.borderColor = '#0f5132'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(15,81,50,0.06)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'rgba(15,81,50,0.15)'; e.currentTarget.style.boxShadow = 'none'; }} />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', color: '#64748b', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Password (Optional - leave empty for public)</label>
                  <input suppressHydrationWarning type="password" value={newRoomPassword} onChange={e => setNewRoomPassword(e.target.value)} placeholder="Enter password to make it private"
                    style={{ width: '100%', background: '#ffffff', border: '1px solid rgba(15, 81, 50, 0.15)', borderRadius: 10, padding: '11px 14px', color: '#0f172a', fontSize: 14, outline: 'none', boxSizing: 'border-box', transition: 'all 0.2s' }}
                    onFocus={e => { e.currentTarget.style.borderColor = '#0f5132'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(15,81,50,0.06)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'rgba(15,81,50,0.15)'; e.currentTarget.style.boxShadow = 'none'; }} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  <input type="checkbox" id="roomCollab" checked={newRoomCollab} onChange={e => setNewRoomCollab(e.target.checked)} style={{ cursor: 'pointer', accentColor: '#0f5132' }} />
                  <label htmlFor="roomCollab" style={{ color: '#0f172a', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>Allow anyone in the room to control playback</label>
                </div>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setShowCreateRoomModal(false)} style={{ padding: '10px 18px', borderRadius: 10, background: 'rgba(15,81,50,0.06)', border: '1px solid rgba(176,136,80,0.15)', color: '#64748b', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" disabled={!newRoomName.trim()}
                    style={{ padding: '10px 22px', borderRadius: 10, background: newRoomName.trim() ? '#0f5132' : 'rgba(15, 81, 50, 0.15)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 800, cursor: newRoomName.trim() ? 'pointer' : 'not-allowed', fontFamily: 'Outfit, sans-serif', boxShadow: newRoomName.trim() ? '0 4px 12px rgba(15,81,50,0.15)' : 'none' }}>
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
                background: '#ffffff',
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
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(15,81,50,0.08)', border: '1px solid rgba(15,81,50,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Users size={15} color="#0f5132" /></div>
                    <div>
                      <h3 style={{ fontFamily: 'Outfit, sans-serif', color: '#0f172a', fontSize: 16, fontWeight: 800 }}>Join Jam Room</h3>
                      <p style={{ color: '#64748b', fontSize: 11 }}>Enter room code or invite code</p>
                    </div>
                  </div>
                  <button onClick={() => setShowJoinRoomModal(false)} style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(15,81,50,0.06)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}><X size={14} /></button>
                </div>

                <input suppressHydrationWarning value={joinRoomCode} onChange={e => setJoinRoomCode(e.target.value)} placeholder="e.g. room 12345 or code with |"
                  style={{ width: '100%', background: '#ffffff', border: '1px solid rgba(15, 81, 50, 0.15)', borderRadius: 10, padding: '11px 14px', color: '#0f172a', fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 16, transition: 'all 0.2s', textAlign: 'center', fontWeight: 'bold' }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#0f5132'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(15,81,50,0.06)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(15,81,50,0.15)'; e.currentTarget.style.boxShadow = 'none'; }} />

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button onClick={() => setShowJoinRoomModal(false)} style={{ padding: '10px 18px', borderRadius: 10, background: 'rgba(15,81,50,0.06)', border: '1px solid rgba(176,136,80,0.15)', color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                  <button 
                    onClick={handleJoinRoomSubmit}
                    disabled={!joinRoomCode.trim()}
                    style={{ padding: '10px 22px', borderRadius: 10, background: joinRoomCode.trim() ? '#0f5132' : 'rgba(15, 81, 50, 0.15)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 800, cursor: joinRoomCode.trim() ? 'pointer' : 'not-allowed', fontFamily: 'Outfit, sans-serif', boxShadow: joinRoomCode.trim() ? '0 4px 12px rgba(15,81,50,0.15)' : 'none' }}>
                    Join Room
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── Active Room Warning Modal ────────────────────────────────────────── */}
      <AnimatePresence>
        {showActiveRoomWarning && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}
            onClick={e => { if (e.target === e.currentTarget) setShowActiveRoomWarning(false); }}
          >
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              style={{ width: '100%', maxWidth: 400, background: '#ffffff', borderRadius: 20, padding: 24, boxShadow: '0 20px 50px rgba(43,34,26,0.15)', border: '1px solid var(--color-ss-border, rgba(43,34,26,0.08))', color: '#0f172a', fontFamily: 'Outfit, sans-serif' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(239,68,68,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}><AlertTriangle size={20} /></div>
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Leave Current Room?</h3>
              </div>
              <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.5, margin: '0 0 24px' }}>
                You are currently in the Jam Room <strong>{existingRoomName}</strong>. You must leave this room before you can host a new one.
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button onClick={() => setShowActiveRoomWarning(false)} style={{ padding: '10px 18px', borderRadius: 10, background: 'rgba(15,81,50,0.06)', border: '1px solid rgba(176,136,80,0.15)', color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleExitAndCreate} style={{ padding: '10px 20px', borderRadius: 10, background: '#ef4444', border: 'none', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 12px rgba(239,68,68,0.2)' }}>Leave & Create</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
