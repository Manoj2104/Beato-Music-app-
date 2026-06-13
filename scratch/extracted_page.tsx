'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3, TrendingUp, Users, Music, DollarSign, Upload,
  Globe, Calendar, Play, Eye, Heart, Plus, X, Check,
  Mic2, Image as ImageIcon, AlertCircle, Trash2, Clock,
  ChevronUp, ChevronDown, ExternalLink
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { useMusicStore, trackGradient } from '@/store/musicStore';
import { useArtistApplicationStore } from '@/store/artistApplicationStore';
import { usePlayerStore } from '@/store/playerStore';
import { useSocket } from '@/lib/socket';
import { mockArtists, mockTracks } from '@/lib/mockData';
import { Track } from '@/types';
import toast from 'react-hot-toast';

const G = '#1db954';
const COLORS = ['#1db954', '#8b5cf6', '#ec4899', '#f59e0b', '#6b7280'];
const GENRES = ['Pop', 'Hip-Hop', 'Electronic', 'Indie', 'R&B', 'Rock', 'Jazz', 'Classical', 'Dance', 'Ambient', 'Synth Wave', 'Dream Pop'];

const streamData = [
  { date: 'May 1', streams: 142000 }, { date: 'May 8', streams: 198000 },
  { date: 'May 15', streams: 175000 }, { date: 'May 22', streams: 260000 },
  { date: 'May 29', streams: 310000 }, { date: 'Jun 5', streams: 285000 },
  { date: 'Jun 12', streams: 342000 },
];
const revenueData = [
  { month: 'Jan', revenue: 2400 }, { month: 'Feb', revenue: 2800 },
  { month: 'Mar', revenue: 3200 }, { month: 'Apr', revenue: 2900 },
  { month: 'May', revenue: 4100 }, { month: 'Jun', revenue: 3800 },
];
const countryData = [
  { country: 'India', pct: 34 }, { country: 'USA', pct: 22 },
  { country: 'UK', pct: 15 }, { country: 'Brazil', pct: 11 }, { country: 'Others', pct: 18 },
];

const TABS = ['Overview', 'My Music', 'Analytics', 'Revenue', 'Audience'];

// ── Upload Modal ──────────────────────────────────────────────────────────────
function UploadModal({ onClose }: { onClose: () => void }) {
  const { user } = useAuthStore();
  const { uploadTrack } = useMusicStore();
  const { getApplicationByUserId } = useArtistApplicationStore();
  const activeApp = user ? getApplicationByUserId(user.id) : undefined;
  const isApproved = activeApp?.status === 'APPROVED';
  const artistName = isApproved && activeApp ? activeApp.artistName : (user?.name || 'Artist');
  const artistId = user?.id || 'artist-1';

  const audioRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<'details' | 'uploading' | 'done'>('details');
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('Pop');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [color1] = useState(() => ['#1db954', '#8b5cf6', '#ec4899', '#f59e0b', '#06b6d4'][Math.floor(Math.random() * 5)]);
  const [color2] = useState(() => ['#0d7a35', '#5b21b6', '#9d174d', '#92400e', '#0e7490'][Math.floor(Math.random() * 5)]);

  const inputS: React.CSSProperties = {
    width: '100%', background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(255,255,255,0.15)',
    borderRadius: 10, padding: '12px 14px', color: '#fff', fontSize: 14, outline: 'none',
    fontFamily: 'Inter, sans-serif', boxSizing: 'border-box',
  };

  const handleUpload = async () => {
    if (!title || !audioFile) { toast.error('Add a title and audio file'); return; }
    setStep('uploading');

    // Simulate upload progress first phase
    for (let i = 0; i <= 60; i += 10) {
      await new Promise(r => setTimeout(r, 50));
      setProgress(i);
    }

    const formData = new FormData();
    formData.append('audio', audioFile);
    formData.append('title', title);
    formData.append('genre', genre);
    formData.append('artistName', artistName);
    formData.append('artistId', artistId);
    formData.append('albumName', 'Singles');
    formData.append('lyrics', '');
    formData.append('explicit', 'false');

    try {
      const uploadRes = await fetch('/api/upload-song', {
        method: 'POST',
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok || !uploadData.track) {
        throw new Error(uploadData.error || 'Failed to upload song');
      }

      // Add to store with the static server URL
      uploadTrack(uploadData.track);

      // Finish progress animation
      for (let i = 70; i <= 100; i += 10) {
        await new Promise(r => setTimeout(r, 40));
        setProgress(i);
      }
      setStep('done');
      toast.success(`"${title}" is now live on Beato! 🎉`);
    } catch (e: any) {
      console.error('Failed to upload song:', e);
      toast.error('Upload failed: ' + e.message);
      setStep('details');
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 24, padding: 36, width: '100%', maxWidth: 540, position: 'relative' }}>
        
        <button onClick={onClose} style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#a3a3a3' }}>
          <X size={16} />
        </button>

        <AnimatePresence mode="wait">
          {step === 'details' && (
            <motion.div key="details" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `linear-gradient(135deg, ${G}, #0d7a35)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Upload size={22} color="black" />
                </div>
                <div>
                  <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 22, fontWeight: 800, color: '#fff' }}>Upload Track</h2>
                  <p style={{ color: '#737373', fontSize: 13 }}>Your song goes live instantly</p>
                </div>
              </div>

              {/* Cover art preview */}
              <div style={{ marginBottom: 24, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{ width: 100, height: 100, borderRadius: 14, background: `linear-gradient(135deg, ${color1}, ${color2})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer', border: '2px dashed rgba(255,255,255,0.2)' }}>
                  {title ? (
                    <div style={{ textAlign: 'center', padding: 8 }}>
                      <p style={{ color: '#fff', fontSize: 10, fontWeight: 700, wordBreak: 'break-word', lineHeight: 1.3 }}>{title}</p>
                      <Music size={14} color="rgba(255,255,255,0.6)" style={{ marginTop: 4 }} />
                    </div>
                  ) : (
                    <ImageIcon size={28} color="rgba(255,255,255,0.4)" />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ color: '#737373', fontSize: 12, marginBottom: 8 }}>Auto-generated cover art based on your track title</p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {GENRES.slice(0, 6).map(g => (
                      <button key={g} onClick={() => setGenre(g)} style={{
                        padding: '4px 10px', borderRadius: 100, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: 'none',
                        background: genre === g ? G : 'rgba(255,255,255,0.08)', color: genre === g ? '#000' : '#a3a3a3',
                        transition: 'all 0.15s',
                      }}>{g}</button>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#737373', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Track Title *</label>
                  <input value={title} onChange={e => setTitle(e.target.value)} placeholder="My Amazing Track" style={inputS}
                    onFocus={e => (e.target.style.borderColor = G)} onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.15)')} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#737373', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Genre</label>
                  <select value={genre} onChange={e => setGenre(e.target.value)} style={{ ...inputS, colorScheme: 'dark' }}>
                    {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#737373', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Audio File * (MP3, WAV, FLAC)</label>
                  <div
                    onClick={() => audioRef.current?.click()}
                    style={{
                      border: `2px dashed ${audioFile ? G : 'rgba(255,255,255,0.2)'}`,
                      borderRadius: 12, padding: '20px', textAlign: 'center', cursor: 'pointer',
                      background: audioFile ? 'rgba(29,185,84,0.05)' : 'rgba(255,255,255,0.03)',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = G)}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = audioFile ? G : 'rgba(255,255,255,0.2)')}>
                    <input ref={audioRef} type="file" accept="audio/*" style={{ display: 'none' }}
                      onChange={e => e.target.files?.[0] && setAudioFile(e.target.files[0])} />
                    {audioFile ? (
                      <div>
                        <Check size={22} color={G} style={{ margin: '0 auto 6px' }} />
                        <p style={{ color: G, fontSize: 13, fontWeight: 600 }}>{audioFile.name}</p>
                        <p style={{ color: '#737373', fontSize: 11 }}>{(audioFile.size / 1024 / 1024).toFixed(1)} MB</p>
                      </div>
                    ) : (
                      <div>
                        <Upload size={22} color="#737373" style={{ margin: '0 auto 8px' }} />
                        <p style={{ color: '#a3a3a3', fontSize: 13 }}>Click to select audio file</p>
                        <p style={{ color: '#525252', fontSize: 11 }}>MP3, WAV, FLAC — max 100MB</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button onClick={onClose} style={{ flex: 1, padding: '13px', borderRadius: 12, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>Cancel</button>
                <button onClick={handleUpload} disabled={!title || !audioFile} style={{
                  flex: 2, padding: '13px', borderRadius: 12, background: (!title || !audioFile) ? 'rgba(29,185,84,0.3)' : G,
                  border: 'none', color: '#000', fontWeight: 800, cursor: (!title || !audioFile) ? 'not-allowed' : 'pointer',
                  fontSize: 14, fontFamily: 'Outfit, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}>
                  <Upload size={16} /> Publish Track
                </button>
              </div>
            </motion.div>
          )}

          {step === 'uploading' && (
            <motion.div key="uploading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(29,185,84,0.1)', border: `3px solid ${G}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', position: 'relative' }}>
                <Upload size={30} color={G} />
                <svg style={{ position: 'absolute', inset: -3, width: 86, height: 86 }} viewBox="0 0 86 86">
                  <circle cx="43" cy="43" r="40" fill="none" stroke="rgba(29,185,84,0.2)" strokeWidth="3" />
                  <circle cx="43" cy="43" r="40" fill="none" stroke={G} strokeWidth="3"
                    strokeDasharray={`${2 * Math.PI * 40}`} strokeDashoffset={`${2 * Math.PI * 40 * (1 - progress / 100)}`}
                    strokeLinecap="round" transform="rotate(-90 43 43)" style={{ transition: 'stroke-dashoffset 0.1s' }} />
                </svg>
              </div>
              <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 8 }}>Publishing "{title}"</h3>
              <p style={{ color: '#737373', fontSize: 14, marginBottom: 20 }}>Processing and adding to Beato...</p>
              <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: G, width: `${progress}%`, borderRadius: 2, transition: 'width 0.1s' }} />
              </div>
              <p style={{ color: G, fontSize: 13, fontWeight: 700, marginTop: 10 }}>{progress}%</p>
            </motion.div>
          )}

          {step === 'done' && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', padding: '20px 0' }}>
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(29,185,84,0.15)', border: `2px solid ${G}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 0 30px rgba(29,185,84,0.3)' }}>
                <Check size={36} color={G} />
              </motion.div>
              <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 24, fontWeight: 900, color: '#fff', marginBottom: 8 }}>🎉 Track Published!</h3>
              <p style={{ color: '#a3a3a3', fontSize: 15, marginBottom: 8 }}>
                <span style={{ color: '#fff', fontWeight: 600 }}>"{title}"</span> is now live on Beato
              </p>
              <p style={{ color: '#737373', fontSize: 13, marginBottom: 28 }}>Fans can discover and stream your song right now</p>
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={onClose} style={{ flex: 1, padding: '12px', borderRadius: 12, background: G, border: 'none', color: '#000', fontWeight: 800, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>
                  Done
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, change, positive, color }: any) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      style={{ padding: 22, borderRadius: 18, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={18} color={color} />
        </div>
        <span style={{
          fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 100,
          background: positive ? 'rgba(29,185,84,0.15)' : 'rgba(239,68,68,0.15)',
          color: positive ? G : '#ef4444',
        }}>{change}</span>
      </div>
      <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 28, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{value}</p>
      <p style={{ color: '#737373', fontSize: 12, marginTop: 4 }}>{label}</p>
    </motion.div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ArtistDashboardPage() {
  const [activeTab, setActiveTab] = useState('Overview');
  const [showUpload, setShowUpload] = useState(false);
  const { uploadedTracks, removeUploadedTrack, fetchTracks } = useMusicStore();
  const { user } = useAuthStore();
  const { getApplicationByUserId } = useArtistApplicationStore();

  const activeApp = user ? getApplicationByUserId(user.id) : undefined;
  const isApproved = activeApp?.status === 'APPROVED';

  // Resolve artist profile dynamically
  const artistName = isApproved ? activeApp.artistName : 'Aurora Nightfall';
  const artistGenres = isApproved ? ['Electronic', 'Pop', 'Dance'] : ['Indie Electronic', 'Dream Pop', 'Synth Wave'];

  const artistId = user?.id || '';
  const myTracks = [
    ...uploadedTracks.filter(t => t.artistId === artistId),
    ...mockTracks.filter(t => t.artistId === artistId)
  ];

  // Initialize track plays state dynamically
  const [trackPlays, setTrackPlays] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    myTracks.forEach(t => {
      initial[t.id] = t.plays || 0;
    });
    return initial;
  });

  // Track state sync if track list changes (e.g. after a new upload)
  useEffect(() => {
    setTrackPlays(prev => {
      const updated = { ...prev };
      myTracks.forEach(t => {
        if (updated[t.id] === undefined) {
          updated[t.id] = t.plays || 0;
        }
      });
      return updated;
    });
  }, [uploadedTracks]);

  // Dynamic metrics calculated reactively
  const totalStreams = myTracks.reduce((sum, track) => sum + (trackPlays[track.id] ?? track.plays ?? 0), 0);
  const revenue = totalStreams * 0.004;
  const artistListeners = totalStreams > 0 ? Math.max(1, Math.round(totalStreams * 0.75)).toLocaleString() : '0';

  const [followers, setFollowers] = useState(0);

  const fetchArtistStats = async () => {
    try {
      const res = await fetch('/api/artist/stats');
      const data = await res.json();
      if (data.success) {
        setFollowers(data.followersCount);
      }
    } catch (e) {
      console.error('Failed to fetch artist stats:', e);
    }
  };

  useEffect(() => {
    fetchTracks();
    if (user) {
      fetchArtistStats();
    }
  }, [user]);

  // Real-time active play listener (self)
  const { currentTrack, isPlaying } = usePlayerStore();
  const liveListeners = currentTrack && myTracks.some(t => t.id === currentTrack.id) && isPlaying ? 1 : 0;
  
  // Real profile views scaled by followers and streams
  const profileViews = totalStreams + followers * 3;

  // Listen for real-time play events across tabs
  useSocket('PLAY_COUNT_UPDATE', ({ trackId }) => {
    const track = myTracks.find(t => t.id === trackId);
    if (track) {
      setTrackPlays(prev => ({
        ...prev,
        [trackId]: (prev[trackId] || 0) + 1
      }));
      
      toast.success(`🔥 Real-time listen: Someone is playing "${track.title}"!`, {
        style: { background: '#121212', color: '#fff', border: `1px solid ${G}30`, borderRadius: 12 },
        icon: '🎧',
        id: `socket-play-toast-${trackId}`
      });
    }
  });

  // Listen for follower events in real-time
  useSocket('ARTIST_FOLLOWED', ({ artistId: followedArtistId }) => {
    if (followedArtistId === artistId) {
      fetchArtistStats();
    }
  });

  // Dynamic Chart Data mapping directly to real streams and revenue
  const currentStreamData = [
    { date: 'May 8', streams: 0 },
    { date: 'May 15', streams: 0 },
    { date: 'May 22', streams: 0 },
    { date: 'May 29', streams: totalStreams },
  ];

  const currentRevenueData = [
    { month: 'Feb', revenue: 0 },
    { month: 'Mar', revenue: 0 },
    { month: 'Apr', revenue: 0 },
    { month: 'May', revenue: Number(revenue.toFixed(2)) },
  ];

  return (
    <div style={{ minHeight: '100%', paddingBottom: 40, background: '#0a0a0a' }}>
      {showUpload && <UploadModal onClose={() => setShowUpload(false)} />}

      {/* ── Top Header ── */}
      <div style={{ background: 'linear-gradient(180deg, rgba(29,185,84,0.15) 0%, #0a0a0a 100%)', padding: '24px 28px 0' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <p style={{ color: '#1db954', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Artist Dashboard</p>
            <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 32, fontWeight: 900, color: '#fff' }}>{artistName}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
              <p style={{ color: '#737373', fontSize: 14, margin: 0 }}>
                {artistGenres.join(' · ')} · {artistListeners} monthly listeners
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 100, background: 'rgba(29,185,84,0.08)', border: `1px solid ${G}25` }}>
                <motion.div 
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                  style={{ width: 6, height: 6, borderRadius: '50%', background: G }} 
                />
                <span style={{ color: G, fontSize: 11, fontWeight: 700 }}>
                  {liveListeners} listening now
                </span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 10, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <Calendar size={15} /> Schedule
            </button>
            <button onClick={() => setShowUpload(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 10, background: G, border: 'none', color: '#000', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', boxShadow: '0 0 20px rgba(29,185,84,0.3)' }}>
              <Upload size={15} /> Upload Track
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 4, width: 'fit-content' }}>
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: '8px 18px', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none',
              background: activeTab === tab ? G : 'transparent',
              color: activeTab === tab ? '#000' : '#737373',
              transition: 'all 0.2s',
            }}>{tab}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '24px 28px' }}>
        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
          <StatCard icon={Play} label="Total Streams" value={totalStreams.toLocaleString()} change="+12.3%" positive color="#1db954" />
          <StatCard icon={Users} label="Followers" value={followers.toLocaleString()} change="+5.8%" positive color="#8b5cf6" />
          <StatCard icon={DollarSign} label="Revenue" value={`$${revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} change="+18.2%" positive color="#f59e0b" />
          <StatCard icon={Eye} label="Profile Views" value={profileViews.toLocaleString()} change="-2.1%" positive={false} color="#ec4899" />
        </div>

        {/* Uploaded tracks highlight */}
        {uploadedTracks.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            style={{ background: 'rgba(29,185,84,0.08)', border: '1px solid rgba(29,185,84,0.25)', borderRadius: 16, padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(29,185,84,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Check size={18} color={G} />
            </div>
            <div>
              <p style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{uploadedTracks.length} track{uploadedTracks.length > 1 ? 's' : ''} live on Beato!</p>
              <p style={{ color: '#737373', fontSize: 12 }}>Your uploaded songs are now available to all listeners globally</p>
            </div>
          </motion.div>
        )}

        {/* Charts — Overview & Analytics */}
        {(activeTab === 'Overview' || activeTab === 'Analytics') && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 24 }}>
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 18, padding: 22, border: '1px solid rgba(255,255,255,0.07)' }}>
              <h3 style={{ color: '#fff', fontWeight: 700, fontSize: 16, marginBottom: 18 }}>Stream Trends</h3>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={currentStreamData}>
                  <defs>
                    <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={G} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={G} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="date" stroke="#525252" fontSize={11} />
                  <YAxis stroke="#525252" fontSize={11} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : `${v}`} />
                  <Tooltip contentStyle={{ background: '#1e1e1e', border: '1px solid #333', borderRadius: 8, color: '#fff' }} formatter={(v: any) => [Number(v) >= 1000 ? `${(Number(v) / 1000).toFixed(0)}K` : `${v}`, 'Streams']} />
                  <Area type="monotone" dataKey="streams" stroke={G} strokeWidth={2.5} fill="url(#sg)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 18, padding: 22, border: '1px solid rgba(255,255,255,0.07)' }}>
              <h3 style={{ color: '#fff', fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Top Countries</h3>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                <PieChart width={150} height={150}>
                  <Pie data={countryData} cx={75} cy={75} innerRadius={45} outerRadius={70} dataKey="pct">
                    {countryData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                </PieChart>
              </div>
              {countryData.map((c, i) => (
                <div key={c.country} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[i] }} />
                    <span style={{ color: '#a3a3a3', fontSize: 13 }}>{c.country}</span>
                  </div>
                  <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{c.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Revenue chart */}
        {(activeTab === 'Overview' || activeTab === 'Revenue') && (
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 18, padding: 22, border: '1px solid rgba(255,255,255,0.07)', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>Revenue Overview</h3>
              <span style={{ color: G, fontWeight: 800, fontSize: 15 }}>${revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })} YTD</span>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={currentRevenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="month" stroke="#525252" fontSize={11} />
                <YAxis stroke="#525252" fontSize={11} tickFormatter={v => `$${v}`} />
                <Tooltip contentStyle={{ background: '#1e1e1e', border: '1px solid #333', borderRadius: 8, color: '#fff' }} formatter={(v: any) => [`$${v}`, 'Revenue']} />
                <Bar dataKey="revenue" fill={G} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* My Music tab */}
        {(activeTab === 'Overview' || activeTab === 'My Music') && (
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 18, border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
            <div style={{ padding: '20px 22px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>Your Tracks <span style={{ color: G, fontSize: 13 }}>({myTracks.length})</span></h3>
              <button onClick={() => setShowUpload(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9, background: 'rgba(29,185,84,0.15)', border: '1px solid rgba(29,185,84,0.3)', color: G, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                <Plus size={14} /> Add Track
              </button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ color: '#525252', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    <th style={{ padding: '12px 22px', textAlign: 'left', fontWeight: 600 }}>#</th>
                    <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 600 }}>Track</th>
                    <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 600 }}>Genre</th>
                    <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 600 }}>Streams</th>
                    <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 600 }}>Revenue</th>
                    <th style={{ padding: '12px 22px', textAlign: 'right', fontWeight: 600 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {myTracks.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '40px 22px', textAlign: 'center', color: '#737373' }}>
                        No tracks published yet. Click "Upload Track" to release your first song!
                      </td>
                    </tr>
                  ) : (
                    myTracks.map((track, i) => {
                      const isUploaded = uploadedTracks.some(u => u.id === track.id);
                      const currentPlays = trackPlays[track.id] ?? track.plays;
                      const trackStatus = track.status || (track.id.startsWith('track-uploaded') ? 'pending' : 'approved');
                      return (
                        <tr key={track.id} style={{ borderTop: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                          <td style={{ padding: '14px 22px', color: '#525252' }}>{i + 1}</td>
                          <td style={{ padding: '14px 8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <div style={{ width: 40, height: 40, borderRadius: 6, background: trackGradient(track.id), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Music size={16} color="rgba(255,255,255,0.8)" />
                              </div>
                              <div>
                                <p style={{ color: '#fff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                                  {track.title}
                                  {isUploaded && <span style={{ fontSize: 10, background: 'rgba(29,185,84,0.2)', color: G, padding: '2px 7px', borderRadius: 100, fontWeight: 700 }}>NEW</span>}
                                </p>
                                <p style={{ color: '#737373', fontSize: 11, marginTop: 2 }}>{track.albumName}</p>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '14px 8px', color: '#a3a3a3' }}>{track.genre}</td>
                          <td style={{ padding: '14px 8px' }}>
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: 12,
                              fontSize: 10,
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              background: trackStatus === 'approved' ? 'rgba(29,185,84,0.12)' : trackStatus === 'rejected' ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)',
                              color: trackStatus === 'approved' ? '#1db954' : trackStatus === 'rejected' ? '#ef4444' : '#f59e0b',
                            }}>
                              {trackStatus}
                            </span>
                          </td>
                          <td style={{ padding: '14px 8px', textAlign: 'right', color: '#a3a3a3' }}>{currentPlays.toLocaleString()}</td>
                          <td style={{ padding: '14px 8px', textAlign: 'right', color: G, fontWeight: 600 }}>{`$${(currentPlays * 0.004).toFixed(2)}`}</td>
                          <td style={{ padding: '14px 22px', textAlign: 'right' }}>
                            {isUploaded && (
                              <button onClick={() => { removeUploadedTrack(track.id); toast.success('Track removed'); }}
                                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, padding: '4px 8px', color: '#ef4444', cursor: 'pointer' }}>
                                <Trash2 size={14} />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
