'use client';

import { useState, useRef, useEffect, Suspense, useMemo, useCallback } from 'react';
import { motion, AnimatePresence, animate } from 'framer-motion';
import {
  BarChart3, TrendingUp, Users, Music, DollarSign, Upload,
  Globe, Calendar, Play, Eye, Heart, Plus, X, Check,
  Mic2, Image as ImageIcon, AlertCircle, Trash2, Clock,
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight, ExternalLink, Award, ShoppingBag, 
  MessageSquare, Share2, User, Trophy, Sparkles, PlusCircle, Laptop2,
  Volume2, FileText, Mail, Code, Wand2, BookOpen, CheckSquare, LayoutGrid, FileEdit
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useMusicStore, trackGradient } from '@/store/musicStore';
import { useArtistApplicationStore } from '@/store/artistApplicationStore';
import { usePlayerStore } from '@/store/playerStore';
import { useSocket, socketManager } from '@/lib/socket';
import { useRealtimeStore } from '@/store/realtimeStore';
import { Track } from '@/types';
import toast from 'react-hot-toast';
import TopBar from '@/components/layout/TopBar';

const G = '#b08850';
const V = '#10b981'; // Violet
const P = '#34d399'; // Pink
const COLORS = ['#b08850', '#10b981', '#34d399', '#f59e0b', '#06b6d4', '#ef4444'];
const GENRES = ['Pop', 'Hip-Hop', 'Electronic', 'Indie', 'R&B', 'Rock', 'Jazz', 'Classical', 'Dance', 'Ambient', 'Synth Wave', 'Dream Pop'];
const FONT = { fontFamily: "Inter, 'Outfit', sans-serif" };

const TABS = [
  'Overview', 
  'My Music', 
  'Analytics', 
  'Revenue', 
  'Audience', 
  'Campaigns', 
  'Profile', 
  'Live Events'
];

const TAB_ICONS: Record<string, any> = {
  'Overview': BarChart3,
  'My Music': Music,
  'Analytics': TrendingUp,
  'Revenue': DollarSign,
  'Audience': Users,
  'Campaigns': Globe,
  'Profile': User,
  'Live Events': Calendar,
  'Sample Upload': Upload
};

const SIMULATED_PLAYLIST_SONGS_LOCAL = [
  // --- Tamil Hits (50) ---
  { title: "Mutta Kalakki", artist: "Ken Karunaas" },
  { title: "Arabic Kuthu", artist: "Anirudh Ravichander" },
  { title: "Rowdy Baby", artist: "Dhanush & Dhee" },
  { title: "Hukum", artist: "Anirudh Ravichander" },
  { title: "Badass", artist: "Anirudh Ravichander" },
  { title: "Naa Ready", artist: "Vijay & Anirudh" },
  { title: "Kaavaalaa", artist: "Shilpa Rao & Anirudh" },
  { title: "Vaseegara", artist: "Bombay Jayashri" },
  { title: "Munbe Vaa", artist: "Shreya Ghoshal" },
  { title: "Vizhiyil", artist: "Haricharan" },
  { title: "Anbil Avan", artist: "Deval" },
  { title: "Kanja Poovu Kannala", artist: "Yuvan Shankar Raja" },
  { title: "Ennodu Nee Irundhal", artist: "Sid Sriram" },
  { title: "New York Nagaram", artist: "A.R. Rahman" },
  { title: "Enna Sona", artist: "Arijit Singh" },
  { title: "Kadhal Sadugudu", artist: "S.P.B. Charan" },
  { title: "Pachai Nirame", artist: "Hariharan" },
  { title: "Mental Manadhil", artist: "Jonita Gandhi" },
  { title: "Snehidhane", artist: "Sadhana Sargam" },
  { title: "Aalaporaan Thamizhan", artist: "Kailash Kher" },
  { title: "Verithanam", artist: "Vijay" },
  { title: "Singappenney", artist: "A.R. Rahman" },
  { title: "Theri Baby", artist: "G.V. Prakash" },
  { title: "Neethanae", artist: "Shreya Ghoshal" },
  { title: "Pookkalae Sattru", artist: "Haricharan" },
  { title: "Aathangara Orathil", artist: "G.V. Prakash" },
  { title: "Adhaaru Adhaaru", artist: "Anirudh Ravichander" },
  { title: "Donu Donu", artist: "Anirudh Ravichander" },
  { title: "Why This Kolaveri Di", artist: "Dhanush" },
  { title: "Kolaigaran", artist: "Vijay Antony" },
  { title: "Kannaana Kanney", artist: "Sid Sriram" },
  { title: "Darling Dambakku", artist: "Benny Dayal" },
  { title: "Chilla Chilla", artist: "Anirudh Ravichander" },
  { title: "Ranjithame", artist: "Vijay & M.M. Manasi" },
  { title: "Thee Thalapathy", artist: "Silambarasan TR" },
  { title: "Celebration of Varisu", artist: "Anirudh Ravichander" },
  { title: "Jimikki Ponnu", artist: "Anirudh Ravichander" },
  { title: "Dippam Dappam", artist: "Anthony Daasan" },
  { title: "Rathamaarey", artist: "Anirudh Ravichander" },
  { title: "Bloody Sweet", artist: "Anirudh Ravichander" },
  { title: "Ordinary Person", artist: "Anirudh Ravichander" },
  { title: "Scuba Diving", artist: "Sid Sriram" },
  { title: "Megham Karukatha", artist: "Dhanush" },
  { title: "Thenmozhi", artist: "Santhosh Narayanan" },
  { title: "Gundu Malli", artist: "Yuvan Shankar Raja" },
  { title: "Hayyoda", artist: "Anirudh Ravichander" },
  { title: "Soul of Varisu", artist: "K.S. Chithra" },
  { title: "Nira", artist: "Sid Sriram" },
  { title: "Oru Manam", artist: "Karthik" },
  { title: "Adiye", artist: "Sid Sriram" },

  // --- English Hits (50) ---
  { title: "Blinding Lights", artist: "The Weeknd" },
  { title: "Shape of You", artist: "Ed Sheeran" },
  { title: "Stay", artist: "The Kid LAROI & Justin Bieber" },
  { title: "As It Was", artist: "Harry Styles" },
  { title: "Flowers", artist: "Miley Cyrus" },
  { title: "Cruel Summer", artist: "Taylor Swift" },
  { title: "Starboy", artist: "The Weeknd" },
  { title: "Perfect", artist: "Ed Sheeran" },
  { title: "Believer", artist: "Imagine Dragons" },
  { title: "Dynamite", artist: "BTS" },
  { title: "Closer", artist: "The Chainsmokers" },
  { title: "Bad Guy", artist: "Billie Eilish" },
  { title: "Levitating", artist: "Dua Lipa" },
  { title: "Save Your Tears", artist: "The Weeknd" },
  { title: "Sweater Weather", artist: "The Neighbourhood" },
  { title: "Someone You Loved", artist: "Lewis Capaldi" },
  { title: "Without Me", artist: "Halsey" },
  { title: "Heat Waves", artist: "Glass Animals" },
  { title: "Radioactive", artist: "Imagine Dragons" },
  { title: "Dance Monkey", artist: "Tones and I" },
  { title: "Wake Me Up", artist: "Avicii" },
  { title: "Take Me To Church", artist: "Hozier" },
  { title: "Rolling in the Deep", artist: "Adele" },
  { title: "Someone Like You", artist: "Adele" },
  { title: "Thinking Out Loud", artist: "Ed Sheeran" },
  { title: "Love Yourself", artist: "Justin Bieber" },
  { title: "Sorry", artist: "Justin Bieber" },
  { title: "What Do You Mean", artist: "Justin Bieber" },
  { title: "Despacito", artist: "Luis Fonsi & Daddy Yankee" },
  { title: "Uptown Funk", artist: "Mark Ronson ft. Bruno Mars" },
  { title: "Sugar", artist: "Maroon 5" },
  { title: "Girls Like You", artist: "Maroon 5" },
  { title: "Memories", artist: "Maroon 5" },
  { title: "Payphone", artist: "Maroon 5" },
  { title: "Maps", artist: "Maroon 5" },
  { title: "Animals", artist: "Maroon 5" },
  { title: "Don't Wanna Know", artist: "Maroon 5" },
  { title: "One More Night", artist: "Maroon 5" },
  { title: "Cold", artist: "Maroon 5" },
  { title: "Beautiful Mistakes", artist: "Maroon 5" },
  { title: "Attention", artist: "Charlie Puth" },
  { title: "We Don't Talk Anymore", artist: "Charlie Puth" },
  { title: "How Long", artist: "Charlie Puth" },
  { title: "Cheating on You", artist: "Charlie Puth" },
  { title: "Light Switch", artist: "Charlie Puth" },
  { title: "Left and Right", artist: "Charlie Puth ft. Jungkook" },
  { title: "See You Again", artist: "Wiz Khalifa ft. Charlie Puth" },
  { title: "Sucker", artist: "Jonas Brothers" },
  { title: "Only Human", artist: "Jonas Brothers" },
  { title: "I Don't Care", artist: "Ed Sheeran & Justin Bieber" }
];



const GRID2: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'var(--grid-cols, 1fr 1fr)', gap: 'var(--grid-gap, 20px)', marginBottom: 24 };
const CARD: React.CSSProperties = { background: 'var(--color-ss-elevated, #ffffff)', borderRadius: 18, padding: 22, border: '1px solid var(--color-ss-border, rgba(43, 34, 26, 0.08))', minWidth: 0, boxShadow: '0 4px 12px rgba(43, 34, 26, 0.04)' };
const INPUT: React.CSSProperties = {
  width: '100%', background: 'var(--color-ss-surface, #f4eede)', border: '1.5px solid var(--color-ss-border, rgba(43, 34, 26, 0.08))',
  borderRadius: 10, padding: '12px 14px', color: 'var(--color-ss-text-primary, #221a15)', fontSize: 14, outline: 'none',
  fontFamily: 'Inter, sans-serif', boxSizing: 'border-box',
};
const BUTTON_PRIMARY: React.CSSProperties = {
  padding: '11px 22px', borderRadius: 9, border: 'none', background: G, color: '#000',
  fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'Outfit, sans-serif'
};
const BUTTON_SECONDARY: React.CSSProperties = {
  padding: '10px 18px', borderRadius: 9, border: '1px solid var(--color-ss-border, rgba(43, 34, 26, 0.08))', background: 'var(--color-ss-surface, #f4eede)',
  color: 'var(--color-ss-text-primary, #221a15)', fontSize: 12, fontWeight: 600, cursor: 'pointer'
};

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
  const [color1] = useState(() => ['#b08850', '#10b981', '#34d399', '#f59e0b', '#06b6d4'][Math.floor(Math.random() * 5)]);
  const [color2] = useState(() => ['#0d7a35', '#5b21b6', '#9d174d', '#92400e', '#0e7490'][Math.floor(Math.random() * 5)]);

  const handleUpload = async () => {
    if (!title || !audioFile) { toast.error('Add a title and audio file'); return; }
    setStep('uploading');

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

      uploadTrack(uploadData.track);

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
        style={{ background: 'var(--color-ss-elevated, #ffffff)', border: '1px solid var(--color-ss-border, rgba(43, 34, 26, 0.08))', borderRadius: 24, padding: 36, width: '100%', maxWidth: 540, position: 'relative' }}>
        
        <button onClick={onClose} style={{ position: 'absolute', top: 20, right: 20, background: 'var(--color-ss-surface, #f4eede)', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--color-ss-text-muted, #87786c)' }}>
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
                  <input value={title} onChange={e => setTitle(e.target.value)} placeholder="My Amazing Track" style={INPUT}
                    onFocus={e => (e.target.style.borderColor = G)} onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.15)')} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#737373', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Genre</label>
                  <select value={genre} onChange={e => setGenre(e.target.value)} style={{ ...INPUT, colorScheme: 'dark' }}>
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
                      background: audioFile ? 'rgba(176, 136, 80,0.05)' : 'rgba(255,255,255,0.03)',
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
                  flex: 2, padding: '13px', borderRadius: 12, background: (!title || !audioFile) ? 'rgba(176, 136, 80,0.3)' : G,
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
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(176, 136, 80,0.1)', border: `3px solid ${G}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', position: 'relative' }}>
                <Upload size={30} color={G} />
                <svg style={{ position: 'absolute', inset: -3, width: 86, height: 86 }} viewBox="0 0 86 86">
                  <circle cx="43" cy="43" r="40" fill="none" stroke="rgba(176, 136, 80,0.2)" strokeWidth="3" />
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
                style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(176, 136, 80,0.15)', border: `2px solid ${G}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 0 30px rgba(176, 136, 80,0.3)' }}>
                <Check size={36} color={G} />
              </motion.div>
              <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 24, fontWeight: 900, color: '#fff', marginBottom: 8 }}>🎉 Track Published!</h3>
              <p style={{ color: '#a3a3a3', fontSize: 15, marginBottom: 8 }}>
                <span style={{ color: '#fff', fontWeight: 600 }}>"{title}"</span> is now live on Beato
              </p>
              <p style={{ color: '#737373', fontSize: 13, marginBottom: 28 }}>Fans can discover and stream your song right now</p>
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={onClose} style={BUTTON_PRIMARY}>
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
function StatCard({ icon: Icon, label, value, change, positive, color, cardBg }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      style={{ 
        padding: '14px 16px', 
        borderRadius: 12, 
        background: cardBg || color,
        position: 'relative',
        overflow: 'hidden',
        height: 100,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
      }}
    >
      {/* Top Row: Label and Trend Badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 1 }}>
        <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,0.9)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {label}
        </span>
        <span style={{
          fontSize: 10, 
          fontWeight: 800, 
          padding: '2px 8px', 
          borderRadius: 100,
          background: 'rgba(255,255,255,0.18)',
          color: '#fff',
        }}>
          {change}
        </span>
      </div>

      {/* Value */}
      <div style={{ zIndex: 1 }}>
        <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 28, fontWeight: 900, color: '#fff', margin: 0, lineHeight: 1.1 }}>
          {value}
        </p>
      </div>

      {/* Rotated Icon Container (Search Page Style) */}
      <div style={{ 
        position: 'absolute', 
        bottom: -8, 
        right: -10, 
        width: 52, 
        height: 52, 
        transform: 'rotate(25deg)', 
        borderRadius: 6, 
        background: 'rgba(255, 255, 255, 0.2)', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 0 
      }}>
        <Icon size={24} color="#fff" style={{ transform: 'rotate(-25deg)' }} />
      </div>
    </motion.div>
  );
}

// ── Main Page Content ─────────────────────────────────────────────────────────
function ArtistDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'Overview';
  const [showUpload, setShowUpload] = useState(false);
  const [visibleActivityCount, setVisibleActivityCount] = useState(6);
  const { uploadedTracks, removeUploadedTrack, fetchTracks, syncTrackStatus } = useMusicStore();
  const { user, setMobileDrawerOpen } = useAuthStore();
  const { activeUsers } = useRealtimeStore();

  // Importer states
  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [importLogs, setImportLogs] = useState<string[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [importSuccess, setImportSuccess] = useState(false);

  const allowedTabs = useMemo(() => {
    if (user?.email === 'manoj2104s@gmail.com') {
      return [...TABS, 'Sample Upload'];
    }
    return TABS;
  }, [user]);

  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Scroll clicked or active tab smoothly to the first visible position (left edge)
  const scrollToTab = useCallback((tabName: string) => {
    const container = tabsContainerRef.current;
    const tabEl = tabRefs.current[tabName];
    if (container && tabEl) {
      const targetScroll = Math.max(0, tabEl.offsetLeft - 16);
      // Snappy and hardware-accelerated spring animation for scroll position
      animate(container.scrollLeft, targetScroll, {
        type: 'spring',
        stiffness: 450,
        damping: 32,
        onUpdate: (value) => {
          container.scrollLeft = value;
        }
      });
    }
  }, []);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (isMobile) {
      const timer = setTimeout(() => scrollToTab(activeTab), 100);
      return () => clearTimeout(timer);
    }
  }, [activeTab, isMobile, scrollToTab]);

  // Drag-to-scroll support for mouse/trackpad users on desktop or emulator
  const [isDragScrolling, setIsDragScrolling] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragScrollLeft, setDragScrollLeft] = useState(0);

  const handleDragMouseDown = (e: React.MouseEvent) => {
    const container = tabsContainerRef.current;
    if (!container) return;
    setIsDragScrolling(true);
    setDragStartX(e.pageX - container.offsetLeft);
    setDragScrollLeft(container.scrollLeft);
  };

  const handleDragMouseMove = (e: React.MouseEvent) => {
    if (!isDragScrolling) return;
    e.preventDefault();
    const container = tabsContainerRef.current;
    if (!container) return;
    const x = e.pageX - container.offsetLeft;
    const walk = (x - dragStartX) * 1.5;
    container.scrollLeft = dragScrollLeft - walk;
  };

  const handleDragMouseUpOrLeave = () => {
    setIsDragScrolling(false);
  };
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  const { getApplicationByUserId } = useArtistApplicationStore();

  // Advanced My Music States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');
  const [genreFilter, setGenreFilter] = useState('all');
  const [selectedTrackForDetail, setSelectedTrackForDetail] = useState<Track | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const tracksPerPage = 15;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, genreFilter]);

  const activeApp = user ? getApplicationByUserId(user.id) : undefined;
  const isApproved = activeApp?.status === 'APPROVED';

  // Resolve artist profile dynamically
  const artistName = activeApp?.artistName || user?.name || 'Artist';
  const artistGenres = user?.stats?.topGenres?.length ? user.stats.topGenres : ['Independent'];

  const artistId = user?.id || '';
  
  // Real database metrics state
  const [metrics, setMetrics] = useState<any>({
    totalStreams: 0,
    followers: 0,
    revenue: 0.0,
    profileViews: 0,
    concurrentListeners: 0,
    spm: 0,
    spmTrend: 'down'
  });

  const totalStreams = metrics.totalStreams;
  const followers = metrics.followers;
  const revenue = metrics.revenue;
  const profileViews = metrics.profileViews;
  const artistListeners = totalStreams > 0 ? Math.max(1, Math.round(totalStreams * 0.75)).toLocaleString() : '0';

  const [myTracks, setMyTracks] = useState<Track[]>([]);
  const myTracksRef = useRef<Track[]>([]);
  useEffect(() => {
    myTracksRef.current = myTracks;
  }, [myTracks]);

  const [streamTrends, setStreamTrends] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);

  // Real-time chart parameters mapping to actual aggregates
  const currentStreamData = useMemo(() => {
    return streamTrends.length > 0 ? streamTrends : [
      { date: 'Today', streams: totalStreams }
    ];
  }, [streamTrends, totalStreams]);

  const currentRevenueData = useMemo(() => [
    { month: 'Feb', revenue: Math.max(0, Number((revenue * 0.15).toFixed(2))) },
    { month: 'Mar', revenue: Math.max(0, Number((revenue * 0.35).toFixed(2))) },
    { month: 'Apr', revenue: Math.max(0, Number((revenue * 0.7).toFixed(2))) },
    { month: 'May', revenue: Number(revenue.toFixed(2)) },
  ], [revenue]);

  // Active listeners parameters
  const [totalConcurrent, setTotalConcurrent] = useState(0);
  const streamVelocity = metrics.spm ?? 0;
  const velocityTrend = metrics.spmTrend ?? 'down';

  // Real data arrays fetched from unified dashboard API
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [fanComments, setFanComments] = useState<any[]>([]);
  // Removed unused tab states
  const [ticketSales, setTicketSales] = useState({
    totalRevenue: 0,
    ticketsSold: 0,
    recentSales: [] as any[]
  });
  const [selectedEventForBookings, setSelectedEventForBookings] = useState<any | null>(null);
  const [showMapModal, setShowMapModal] = useState(false);
  const [mapSearch, setMapSearch] = useState('');
  const [mapLocation, setMapLocation] = useState({
    lat: 12.9716, // Bengaluru default
    lon: 77.5946,
    name: 'Bengaluru, Karnataka, India'
  });
  const [geoHotspots, setGeoHotspots] = useState<any[]>([]);
  const [activeSessionsList, setActiveSessionsList] = useState<any[]>([]);
  const [payoutStreams, setPayoutStreams] = useState<any[]>([]);
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [userDetailMap, setUserDetailMap] = useState<Record<string, any>>({});

  const [liveActivity, setLiveActivity] = useState<any[]>([]);
  const [liveTrackListeners, setLiveTrackListeners] = useState<Record<string, number>>({});

  const currentCountryData = useMemo(() => {
    if (geoHotspots.length === 0) {
      return [];
    }
    const countryMap: Record<string, number> = {};
    let total = 0;
    geoHotspots.forEach(h => {
      const displayCountry = h.country === 'IN' ? 'India' : h.country === 'US' ? 'USA' : h.country === 'UK' || h.country === 'GB' ? 'UK' : h.country === 'BR' ? 'Brazil' : h.country;
      countryMap[displayCountry] = (countryMap[displayCountry] || 0) + h.listeners;
      total += h.listeners;
    });
    
    if (total === 0) total = 1;
    return Object.entries(countryMap).map(([country, listeners]) => ({
      country,
      pct: Math.round((listeners / total) * 100)
    })).sort((a, b) => b.pct - a.pct);
  }, [geoHotspots]);

  // 1. Calculate Average Daily Streams dynamically
  const avgDailyStreams = useMemo(() => {
    if (payoutStreams.length === 0) {
      return totalStreams > 0 ? totalStreams : 0;
    }
    const timestamps = payoutStreams.map(s => new Date(s.timestamp).getTime());
    const minTime = Math.min(...timestamps);
    const maxTime = Date.now();
    const diffDays = Math.max(1, Math.ceil((maxTime - minTime) / (1000 * 60 * 60 * 24)));
    return Math.round(payoutStreams.length / diffDays);
  }, [payoutStreams, totalStreams]);

  // 2. Calculate Popular Genre based on plays
  const popularGenre = useMemo(() => {
    if (myTracks.length === 0) return 'None';
    const genrePlays: Record<string, number> = {};
    myTracks.forEach(t => {
      genrePlays[t.genre] = (genrePlays[t.genre] || 0) + (t.plays || 0);
    });
    let maxGenre = '';
    let maxPlays = -1;
    Object.entries(genrePlays).forEach(([genre, plays]) => {
      if (plays > maxPlays) {
        maxPlays = plays;
        maxGenre = genre;
      }
    });
    return maxGenre || myTracks[0].genre;
  }, [myTracks]);

  // 3. Calculate Engagement Rate dynamically
  const engagementRate = useMemo(() => {
    if (totalStreams === 0) return '0.0%';
    const interactions = fanComments.length + (ticketSales?.ticketsSold || 0);
    const rate = (interactions / totalStreams) * 100;
    return `${rate.toFixed(1)}%`;
  }, [totalStreams, fanComments.length, ticketSales?.ticketsSold]);
  // 4. Calculate Top Tracks for Stream Distribution
  const topTracksData = useMemo(() => {
    return [...myTracks]
      .sort((a, b) => (b.plays || 0) - (a.plays || 0))
      .slice(0, 5)
      .map(t => ({
        name: t.title.length > 15 ? t.title.substring(0, 15) + '...' : t.title,
        streams: t.plays || 0
      }));
  }, [myTracks]);

  // 5. Optimization Recommendations Engine
  const optimizationRecommendations = useMemo(() => {
    const list = [];
    
    // Recommendation A: Genre Focus
    if (popularGenre !== 'None') {
      list.push({
        title: `Genre Focus: ${popularGenre}`,
        desc: `Your ${popularGenre} tracks represent your highest streaming category. Focus on writing more ${popularGenre} releases to maximize algorithmic recommendation features.`,
        action: 'Manage Releases',
        tab: 'My Music'
      });
    }
    
    // Recommendation B: Geographic Hotspots
    if (geoHotspots.length > 0) {
      const topGeo = geoHotspots[0];
      list.push({
        title: `Regional Promotion: ${topGeo.city || topGeo.country}`,
        desc: `Listener density is surging in ${topGeo.city} (${topGeo.country}). Launch a target ad campaign to engage this region.`,
        action: 'Create Campaign',
        tab: 'Campaigns'
      });
    } else {
      list.push({
        title: 'Regional Promotion: India',
        desc: 'Surge in regional streaming detected in Chennai and Bengaluru. Run promotions to expand your South India audience.',
        action: 'Create Campaign',
        tab: 'Campaigns'
      });
    }

    // Recommendation C: Promote Song
    const unpromotedTrack = myTracks.find(t => t.status === 'approved' && !campaigns.some(c => c.track === t.title));
    if (unpromotedTrack) {
      list.push({
        title: `Promote "${unpromotedTrack.title}"`,
        desc: `This song is approved and ready. Launching a campaign for it will boost streams and increase listener engagement.`,
        action: 'Create Campaign',
        tab: 'Campaigns'
      });
    } else {
      list.push({
        title: 'Share your Profile',
        desc: 'Keep your social profiles active. Update booking contacts and press links on your profile.',
        action: 'Edit Profile',
        tab: 'Profile'
      });
    }
    return list;
  }, [popularGenre, geoHotspots, myTracks, campaigns]);
  // 6. Calculate Premium vs Free streams for listener cohort growth
  const listenerCohortData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      const dayStreams = payoutStreams.filter(s => {
        const sDate = new Date(s.timestamp);
        return sDate.getFullYear() === d.getFullYear() &&
               sDate.getMonth() === d.getMonth() &&
               sDate.getDate() === d.getDate();
      });

      const premium = dayStreams.filter(s => s.isPremium).length;
      const free = dayStreams.filter(s => !s.isPremium).length;

      return {
        date: dateStr,
        Premium: premium,
        Free: free
      };
    });
  }, [payoutStreams]);

  // 7. Calculate Geographic listener share for donut chart
  const geoShareData = useMemo(() => {
    if (geoHotspots.length === 0) {
      return [
        { name: 'India', value: 1, color: '#b08850', pct: 100 }
      ];
    }
    const total = geoHotspots.reduce((sum, h) => sum + (h.listeners || 0), 0) || 1;
    return geoHotspots.map(h => {
      const displayCountry = h.country === 'IN' ? 'India' : h.country === 'US' ? 'USA' : h.country === 'UK' || h.country === 'GB' ? 'UK' : h.country === 'BR' ? 'Brazil' : h.country;
      return {
        name: displayCountry,
        value: h.listeners || 0,
        pct: Math.round(((h.listeners || 0) / total) * 100),
        color: h.color || '#10b981'
      };
    });
  }, [geoHotspots]);

  const [analyticsSubTab, setAnalyticsSubTab] = useState<'Overview' | 'Advanced'>('Overview');

  // 8. Advanced Analytics Calculations
  const advancedAnalytics = useMemo(() => {
    // 8.1 Monthly Active Listeners (MAL) (Feature 1)
    const mal = new Set(payoutStreams.filter(s => new Date(s.timestamp).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000).map(s => s.userId)).size || new Set(payoutStreams.map(s => s.userId)).size || 0;
    
    // 8.2 Fan Retention (New vs Returning) (Feature 10)
    const userFrequencies: Record<string, number> = {};
    payoutStreams.forEach(s => {
      userFrequencies[s.userId] = (userFrequencies[s.userId] || 0) + 1;
    });
    let newFans = 0;
    let returningFans = 0;
    Object.values(userFrequencies).forEach(count => {
      if (count > 1) returningFans++;
      else newFans++;
    });
    const totalFans = newFans + returningFans || 1;
    const returningPct = Math.round((returningFans / totalFans) * 100);
    const newPct = Math.round((newFans / totalFans) * 100);

    // 8.3 Payout Milestone Progress (Feature 2)
    const nextMilestone = Math.ceil((revenue + 0.01) / 100) * 100 || 100;
    const milestoneProgress = Math.min(100, Math.round((revenue / nextMilestone) * 100));

    // 8.4 Skip Rate & Average Play Completion Rate (Feature 3)
    const premiumStreams = payoutStreams.filter(s => s.isPremium).length;
    const totalStreamsCount = payoutStreams.length || 1;
    const completionRate = Math.round(((premiumStreams * 92) + ((totalStreamsCount - premiumStreams) * 68)) / totalStreamsCount);
    const skipRate = 100 - completionRate;

    // 8.5 Hi-Res Audio Stream Share vs Standard (Feature 4)
    const hiResPct = totalStreamsCount > 0 ? Math.round((premiumStreams / totalStreamsCount) * 100) : 75;
    const standardPct = 100 - hiResPct;

    // 8.6 Peak Listening Hours (Feature 5)
    const hourlyStreams = Array.from({ length: 24 }, (_, i) => ({
      hour: `${i.toString().padStart(2, '0')}:00`,
      Streams: 0
    }));
    payoutStreams.forEach(s => {
      try {
        const hr = new Date(s.timestamp).getHours();
        if (hr >= 0 && hr < 24) {
          hourlyStreams[hr].Streams++;
        }
      } catch {}
    });

    // 8.7 Fan Demographics (Feature 6) & Age
    let female = 0;
    let male = 0;
    let nonBinary = 0;
    let genZ = 0; // 18-24
    let millennial = 0; // 25-34
    let genX = 0; // 35+

    const uniqueUserIds = Array.from(new Set(payoutStreams.map(s => s.userId)));
    uniqueUserIds.forEach(uid => {
      const name = userMap[uid] || 'Listener';
      const uDetail = userDetailMap[uid];

      // 1. Gender check (use real field if set)
      if (uDetail && uDetail.gender) {
        const g = uDetail.gender.toLowerCase();
        if (g === 'female') female++;
        else if (g === 'male') male++;
        else nonBinary++;
      } else {
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
          hash += name.charCodeAt(i);
        }
        const remGender = hash % 10;
        if (remGender < 4) female++;
        else if (remGender < 8) male++;
        else nonBinary++;
      }

      // 2. Age check (use real field if set)
      if (uDetail && uDetail.age) {
        const age = uDetail.age;
        if (age >= 18 && age <= 24) genZ++;
        else if (age >= 25 && age <= 34) millennial++;
        else genX++;
      } else {
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
          hash += name.charCodeAt(i);
        }
        const remAge = hash % 3;
        if (remAge === 0) genZ++;
        else if (remAge === 1) millennial++;
        else genX++;
      }
    });

    const totalDemo = female + male + nonBinary || 1;
    const femalePct = Math.round((female / totalDemo) * 100);
    const malePct = Math.round((male / totalDemo) * 100);
    const nonBinaryPct = 100 - femalePct - malePct;
    const genderData = [
      { name: 'Female', value: femalePct, color: '#34d399' },
      { name: 'Male', value: malePct, color: '#60a5fa' },
      { name: 'Non-binary', value: nonBinaryPct, color: '#a78bfa' }
    ];

    const totalAge = genZ + millennial + genX || 1;
    const genZPct = Math.round((genZ / totalAge) * 100);
    const millennialPct = Math.round((millennial / totalAge) * 100);
    const genXPct = 100 - genZPct - millennialPct;
    
    const ageData = [
      { age: '18 - 24 years old', pct: genZPct, col: '#34d399' },
      { age: '25 - 34 years old', pct: millennialPct, col: '#10b981' },
      { age: '35+ years old', pct: genXPct, col: '#f59e0b' }
    ];

    // 8.8 Device Breakdowns (Feature 7)
    let mobileCount = 0;
    let desktopCount = 0;
    let tabletCount = 0;
    payoutStreams.forEach(s => {
      const dev = (s.device || '').toLowerCase();
      if (dev.includes('mobile')) {
        mobileCount++;
      } else if (dev.includes('desktop') || dev.includes('web') || dev.includes('player')) {
        desktopCount++;
      } else if (dev.includes('speaker') || dev.includes('tablet')) {
        tabletCount++;
      } else {
        const charCode = s.id.charCodeAt(s.id.length - 1) || 0;
        if (charCode % 3 === 0) {
          mobileCount++;
        } else if (charCode % 3 === 1) {
          desktopCount++;
        } else {
          tabletCount++;
        }
      }
    });
    const totalDevices = mobileCount + desktopCount + tabletCount || 1;
    const mobilePct = Math.round((mobileCount / totalDevices) * 100);
    const desktopPct = Math.round((desktopCount / totalDevices) * 100);
    const tabletPct = 100 - mobilePct - desktopPct;

    const deviceData = [
      { device: 'Mobile Phones', pct: mobilePct, col: '#b08850' },
      { device: 'Desktop App / Web', pct: desktopPct, col: '#60a5fa' },
      { device: 'Smart Speakers / Other', pct: tabletPct, col: '#a78bfa' }
    ];

    // 8.9 Live Active Listening Sessions Table (Feature 8)
    const liveSessions = payoutStreams.slice(0, 5).map(s => {
      const dbTrack = myTracks.find(t => t.id === s.trackId);
      return {
        id: s.id,
        user: userMap[s.userId] || 'Guest Listener',
        track: dbTrack?.title || 'Unknown Song',
        country: s.country || 'IN',
        device: s.isPremium ? 'Mobile App' : 'Web Player',
        timestamp: new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      };
    });

    // 8.10 Campaign ROI Tracker (Feature 9)
    const campaignROI = campaigns.map(c => {
      const ctrVal = parseFloat(c.ctr || '2.0');
      const spent = c.spent || 0;
      const impressions = c.impressions || 0;
      const clicks = Math.round((impressions * ctrVal) / 100) || 0;
      const conversions = Math.round(clicks * 0.18) || 0;
      const costPerConversion = conversions > 0 ? (spent / conversions).toFixed(2) : '0.00';
      return {
        id: c.id,
        name: c.name,
        spent,
        impressions,
        ctr: c.ctr,
        clicks,
        conversions,
        cpc: `$${costPerConversion}`
      };
    });

    // 8.11 Listening Days of the week (New Feature for Audience)
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dailyDistribution = Array.from({ length: 7 }, (_, i) => ({
      day: dayNames[i],
      Streams: 0
    }));
    payoutStreams.forEach(s => {
      try {
        const day = new Date(s.timestamp).getDay();
        if (day >= 0 && day < 7) {
          dailyDistribution[day].Streams++;
        }
      } catch {}
    });

    // 8.12 Loyal Fans top 5 (New Feature for Audience)
    const userStreamCounts: Record<string, number> = {};
    payoutStreams.forEach(s => {
      userStreamCounts[s.userId] = (userStreamCounts[s.userId] || 0) + 1;
    });
    const loyalFans = Object.entries(userStreamCounts)
      .map(([uid, count]) => {
        const name = userMap[uid] || 'Listener';
        const lastStream = payoutStreams.filter(s => s.userId === uid).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
        const dbTrack = myTracks.find(t => t.id === lastStream?.trackId);
        const isPremium = lastStream?.isPremium || false;
        return {
          id: uid,
          name,
          count,
          lastTrack: dbTrack?.title || 'Unknown Song',
          tier: isPremium ? 'Premium' : 'Free'
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 8.13 Subscription Split (New Feature for Audience)
    const subscriptionData = [
      { name: 'Premium Tier', value: hiResPct, color: '#10b981' },
      { name: 'Free Tier', value: standardPct, color: '#b08850' }
    ];

    // 8.14 Discovery Channels (New Feature for Audience)
    const directPct = payoutStreams.length > 0 ? Math.max(10, 100 - (campaigns.length * 15)) : 60;
    const editorialPct = Math.round((100 - directPct) * 0.6);
    const campaignPct = 100 - directPct - editorialPct;
    const discoveryChannels = [
      { name: 'Direct Search / Shares', pct: directPct, color: '#b08850' },
      { name: 'Editorial Playlists', pct: editorialPct, color: '#10b981' },
      { name: 'Promoted Campaigns', pct: campaignPct, color: '#06b6d4' }
    ];

    // 8.15 Fan Sentiment Meter (New Feature for Audience)
    let positiveComments = 0;
    let neutralComments = 0;
    fanComments.forEach(c => {
      const text = (c.text || '').toLowerCase();
      if (text.includes('love') || text.includes('stellar') || text.includes('great') || text.includes('incredible') || text.includes('stellar') || text.includes('awesome') || text.includes('repeat') || text.includes('masterpiece') || text.includes('good') || text.includes('nice') || text.includes('beautiful') || text.includes('thank')) {
        positiveComments++;
      } else {
        neutralComments++;
      }
    });
    const totalCommentsCount = fanComments.length || 1;
    const positivePct = Math.round((positiveComments / totalCommentsCount) * 100) || 85;
    const neutralPct = 100 - positivePct;

    // 8.16 Listener Growth Cumulative Trend (New Feature for Audience)
    const listenerGrowthTrend = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).getTime();
      const uniqueUsersCount = new Set(
        payoutStreams
          .filter(s => new Date(s.timestamp).getTime() <= dayEnd)
          .map(s => s.userId)
      ).size;
      
      return { date: dateStr, Fans: uniqueUsersCount || 0 };
    });

    return {
      mal,
      newPct,
      returningPct,
      milestoneProgress,
      nextMilestone,
      completionRate,
      skipRate,
      hiResPct,
      standardPct,
      hourlyStreams,
      genderData,
      mobilePct,
      desktopPct,
      tabletPct,
      liveSessions,
      campaignROI,
      ageData,
      deviceData,
      dailyDistribution,
      loyalFans,
      subscriptionData,
      discoveryChannels,
      positivePct,
      neutralPct,
      listenerGrowthTrend
    };
  }, [payoutStreams, revenue, myTracks, campaigns, userMap, fanComments]);

  // State elements for form inputs
  const [newCampaign, setNewCampaign] = useState({ name: '', trackId: '', budget: '25' });
  const [artistBio, setArtistBio] = useState('');
  const [socialLinks, setSocialLinks] = useState({ instagram: '', twitter: '', website: '' });

  // ── Artist Profile Platform State ─────────────────────────────────────────
  const [artistProfile, setArtistProfile] = useState<any>(null);
  const [profileStats, setProfileStats] = useState<any>({ profileScore: 0, suggestions: [], totalStreams: 0, followers: 0 });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileActiveSection, setProfileActiveSection] = useState<string>('identity');
  // Identity
  const [profileIdentity, setProfileIdentity] = useState({ stageName: '', realName: '', username: '', customUrl: '', artistCategory: 'Independent', primaryGenre: 'Pop', secondaryGenres: [] as string[], languages: ['English'], country: 'IN', city: '', timezone: 'Asia/Kolkata', labelName: '', managementContact: '', bookingContact: '', pressContact: '', businessContact: '', brandColor: '#b08850', brandFont: 'Inter' });
  // Bio
  const [profileBio, setProfileBio] = useState('');
  const [profileMilestones, setProfileMilestones] = useState<any[]>([]);
  const [newMilestone, setNewMilestone] = useState({ year: '', title: '', description: '' });
  const [profileKeywords, setProfileKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  // Social
  const [profileSocial, setProfileSocial] = useState<Record<string, string>>({});
  const [verifySocialPlatform, setVerifySocialPlatform] = useState('');
  const [socialVerified, setSocialVerified] = useState<Record<string, boolean>>({});
  // Verification
  const [verificationLevel, setVerificationLevel] = useState('none');
  const [verificationSubmission, setVerificationSubmission] = useState({ level: 'verified_artist', documents: [''], notes: '' });
  const [verificationStatus, setVerificationStatus] = useState<any>({});
  // SEO
  const [seoKeywords, setSeoKeywords] = useState<string[]>([]);
  const [seoInput, setSeoInput] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  // Booking Requests
  const [bookingRequests, setBookingRequests] = useState<any[]>([]);
  const [newBooking, setNewBooking] = useState({ requester: '', type: 'show', message: '', date: '', budget: '' });
  // Security
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [auditLog, setAuditLog] = useState<any[]>([]);
  // Awards
  const [profileAwards, setProfileAwards] = useState<any[]>([]);
  const [newAward, setNewAward] = useState({ title: '', issuedBy: '', year: '', icon: '🏆' });
  // Customization
  const [layoutTheme, setLayoutTheme] = useState('dark');
  const [featuredTracks, setFeaturedTracks] = useState<string[]>([]);

  const fetchArtistProfile = async () => {
    setProfileLoading(true);
    try {
      const res = await fetch('/api/artist/profile');
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) {
        const p = data.profile;
        setArtistProfile(p);
        setProfileStats(data.stats);
        setProfileIdentity({
          stageName: p.stageName || '',
          realName: p.realName || '',
          username: p.username || '',
          customUrl: p.customUrl || '',
          artistCategory: p.artistCategory || 'Independent',
          primaryGenre: p.primaryGenre || 'Pop',
          secondaryGenres: p.secondaryGenres || [],
          languages: p.languages || ['English'],
          country: p.country || 'IN',
          city: p.city || '',
          timezone: p.timezone || 'Asia/Kolkata',
          labelName: p.labelName || '',
          managementContact: p.managementContact || '',
          bookingContact: p.bookingContact || '',
          pressContact: p.pressContact || '',
          businessContact: p.businessContact || '',
          brandColor: p.brandColor || '#b08850',
          brandFont: p.brandFont || 'Inter',
        });
        setProfileBio(p.bio || '');
        setArtistBio(p.bio || '');
        setSocialLinks({ instagram: p.socialLinks?.instagram || '', twitter: p.socialLinks?.twitter || '', website: p.socialLinks?.website || '' });
        setProfileSocial(p.socialLinks || {});
        setSocialVerified(Object.fromEntries(Object.entries(p.verificationStatus || {}).filter(([, v]: any) => v.verified).map(([k]) => [k, true])));
        setVerificationLevel(p.verificationLevel || 'none');
        setVerificationStatus(p.verificationStatus || {});
        setProfileMilestones(p.careerMilestones || []);
        setProfileKeywords(p.keywords || []);
        setSeoKeywords(p.tags || []);
        setSeoTitle(p.seoTitle || '');
        setSeoDescription(p.seoDescription || '');
        setBookingRequests(p.bookingRequests || []);
        setTwoFactorEnabled(p.twoFactorEnabled || false);
        setAuditLog(p.auditLog || []);
        setProfileAwards(p.awards || []);
        setLayoutTheme(p.layoutTheme || 'dark');
        setFeaturedTracks(p.featuredTracks || []);
      }
    } catch (e) {
      console.error('Failed to fetch artist profile', e);
    } finally {
      setProfileLoading(false);
    }
  };

  // Load profile when on Profile tab
  useEffect(() => {
    if (activeTab === 'Profile') fetchArtistProfile();
  }, [activeTab]);

  const [newEvent, setNewEvent] = useState({ name: '', date: '', time: '', location: '', price: '' });
  const [replyInput, setReplyInput] = useState<Record<string, string>>({});
  const [newMerch, setNewMerch] = useState({ name: '', price: '', stock: '', emoji: '💿' });
  const [newSplit, setNewSplit] = useState({ track: '', collaborator: '', role: 'Co-writer', share: '50' });

  // State elements for navigation tabs
  const [newPitch, setNewPitch] = useState({ trackId: '', curatorList: 'Global Pop Hits', message: '' });
  const [lyricsTrackId, setLyricsTrackId] = useState('');
  const [lyricsText, setLyricsText] = useState('');
  const [lyricsTimeline, setLyricsTimeline] = useState<any[]>([]);
  const [newLyricLine, setNewLyricLine] = useState({ time: '0:00', text: '' });
  const insights = useMemo(() => {
    const items = [];
    if (myTracks.length === 0) {
      items.push({ id: 'in-upload', category: 'Release Workflow', text: 'Upload and approve your first track to unlock streaming, country, and revenue insights.', priority: 'High', type: 'info' });
    }
    if (campaigns.length === 0 && myTracks.length > 0) {
      items.push({ id: 'in-campaign', category: 'Growth', text: 'Create a campaign for your strongest track to start tracking impressions and fan conversion.', priority: 'Medium', type: 'success' });
    }
    if (fanComments.length > 0) {
      items.push({ id: 'in-fans', category: 'Audience', text: `${fanComments.length} fan message${fanComments.length === 1 ? '' : 's'} need your attention.`, priority: 'Medium', type: 'warning' });
    }
    return items;
  }, [campaigns.length, fanComments.length, myTracks.length]);
  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/artist/dashboard');
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) {
        setMetrics(data.metrics);
        setTotalConcurrent(data.metrics.concurrentListeners);
        setCampaigns(data.campaigns);
        setEvents(data.events);
        setFanComments(data.comments);
                setTicketSales(data.ticketSales);
        setGeoHotspots(data.geoHotspots);
        setActiveSessionsList(data.activeSessionsList || []);
        setMyTracks(data.tracks);
        setStreamTrends(data.streamTrends || []);
        setLiveActivity(data.liveActivity || []);
        setPayoutStreams(data.payoutStreams || []);
        setAchievements(data.achievements || []);
        setUserMap(data.userMap || {});
        setUserDetailMap(data.userDetailMap || {});
        
        // Sync bio if active app verified
        if (isApproved && activeApp) {
          setArtistBio(activeApp.bio || '');
        }      }
    } catch (e) {
      console.error('Failed to load dashboard data:', e);
    }
  };

  const handleDeleteTrack = async (trackId: string) => {
    if (!confirm('Are you sure you want to delete this track?')) return;
    try {
      const res = await fetch('/api/artist/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_track',
          payload: { trackId }
        })
      });
      const data = await res.json();
      if (data.success) {
        removeUploadedTrack(trackId);
        setMyTracks(prev => prev.filter(t => t.id !== trackId));
        toast.success('Track deleted permanently');
      } else {
        toast.error(data.error || 'Failed to delete track');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete track');
    }
  };

  const fetchArtistStats = async () => {
    await fetchDashboardData();
  };

  useEffect(() => {
    fetchTracks();
    if (user) {
      fetchDashboardData();
    }
  }, [user, uploadedTracks.length]);

  // Removed lyrics sync effect

  // Real-time active play listener (self)
  const { currentTrack, isPlaying, playTrack: globalPlayTrack } = usePlayerStore();
  const liveListeners = currentTrack && myTracks.some(t => t.id === currentTrack.id) && isPlaying ? 1 : 0;

  // Listen for real-time play events across tabs
  useSocket('PLAY_COUNT_UPDATE', ({ trackId }) => {
    if (myTracks.some(t => t.id === trackId)) {
      fetchDashboardData();
      setLiveTrackListeners(prev => ({
        ...prev,
        [trackId]: (prev[trackId] ?? 0) + 1
      }));
      setTimeout(() => {
        setLiveTrackListeners(prev => ({
          ...prev,
          [trackId]: Math.max(0, (prev[trackId] ?? 1) - 1)
        }));
      }, 15000);
      const track = myTracks.find(t => t.id === trackId);
      if (track) {
        toast.success(`🔥 Real-time listen: Someone is playing "${track.title}"!`, {
          style: { background: '#121212', color: '#fff', border: `1px solid ${G}30`, borderRadius: 12 },
          icon: '🎧',
          id: `socket-play-toast-${trackId}`
        });
      }
    }
  });

  // Listen for follower events in real-time
  useSocket('ARTIST_FOLLOWED', ({ artistId: followedArtistId }) => {
    if (followedArtistId === artistId) {
      fetchDashboardData();
    }
  });

  // Listen for real-time track status updates from admin approval workflow
  useSocket('TRACK_STATUS_UPDATE', ({ trackId, status }) => {
    syncTrackStatus(trackId, status);
    fetchDashboardData();
    const track = myTracksRef.current.find(t => t.id === trackId);
    if (track) {
      if (status === 'approved') {
        toast.success(`🎉 Your track "${track.title}" has been APPROVED by the admin!`, {
          style: { background: '#121212', color: '#fff', border: `1px solid ${G}30`, borderRadius: 12 },
          icon: '✅',
          duration: 5000
        });
      } else if (status === 'rejected') {
        toast.error(`❌ Your track "${track.title}" has been REJECTED by the admin.`, {
          style: { background: '#121212', color: '#fff', border: `1px solid #ef444430`, borderRadius: 12 },
          icon: '🚫',
          duration: 5000
        });
      }
    }
  });

  // Poll dashboard data every 30 seconds to keep metrics in sync with database
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 30000);
    return () => clearInterval(interval);
  }, [user]);


  // ── Render Helpers for All Tabs ───────────────────────────────────────────────

  // 1. Overview Tab
  const renderOverview = () => (
    <div>
      {/* Stats Grid */}
      <div className="stats-grid">
        <StatCard icon={Play} label="Streams" value={totalStreams.toLocaleString()} change="+12.3%" positive color="#b08850" cardBg="#047857" />
        <StatCard icon={Users} label="Followers" value={followers.toLocaleString()} change="+5.8%" positive color="#10b981" cardBg="#006450" />
        <StatCard icon={DollarSign} label="Revenue" value={`$${revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} change="+18.2%" positive color="#f59e0b" cardBg="#15803d" />
        <StatCard icon={Eye} label="Views" value={profileViews.toLocaleString()} change="-2.1%" positive={false} color="#34d399" cardBg="#14532d" />
        
        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }}
          whileTap={{ scale: 0.98 }}
          className="active-now-card"
          style={{ 
            padding: '14px 16px', 
            borderRadius: 12, 
            background: totalConcurrent > 0 ? 'rgba(176, 136, 80, 0.12)' : 'var(--color-ss-elevated, #ffffff)',
            border: '1.5px solid var(--color-ss-border, rgba(43, 34, 26, 0.08))',
            position: 'relative',
            overflow: 'hidden',
            height: 100,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(43, 34, 26, 0.04)',
            transition: 'all 0.5s'
          }}
        >
          {/* Top Row: Label and Live Badge */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 1 }}>
            <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: 13, fontWeight: 800, color: 'var(--color-ss-text-primary, #221a15)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Active Now
            </span>
            {totalConcurrent > 0 ? (
              <span style={{
                fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 100,
                background: 'rgba(176, 136, 80, 0.2)', color: G, display: 'inline-flex', alignItems: 'center', gap: 4
              }}>
                <motion.span animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} style={{ width: 6, height: 6, borderRadius: '50%', background: G, display: 'inline-block' }} />
                LIVE
              </span>
            ) : (
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: 'var(--color-ss-surface, #f4eede)', color: 'var(--color-ss-text-muted, #87786c)' }}>OFFLINE</span>
            )}
          </div>

          {/* Value */}
          <div style={{ zIndex: 1 }}>
            <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 28, fontWeight: 900, color: 'var(--color-ss-text-primary, #221a15)', margin: 0, lineHeight: 1.1 }}>
              {totalConcurrent.toLocaleString()}
            </p>
          </div>

          {/* Rotated Icon Container (Search Page Style) */}
          <div style={{ 
            position: 'absolute', 
            bottom: -8, 
            right: -10, 
            width: 52, 
            height: 52, 
            transform: 'rotate(25deg)', 
            borderRadius: 6, 
            background: 'var(--color-ss-surface, #f4eede)', 
            boxShadow: '0 2px 8px rgba(43, 34, 26, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 0 
          }}>
            <Users size={24} color="var(--color-ss-primary, #b08850)" style={{ transform: 'rotate(-25deg)' }} />
          </div>
        </motion.div>
      </div>

      {/* Charts Grid */}
      <div style={GRID2}>
        <div style={CARD}>
          <h3 style={{ color: '#fff', fontWeight: 700, fontSize: 16, marginBottom: 18 }}>Stream Trends</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={currentStreamData}>
              <defs>
                <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={G} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={G} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
              <XAxis dataKey="date" stroke="#525252" fontSize={isMobile ? 9 : 11} tickLine={false} axisLine={false} interval={isMobile ? 1 : 0} />
              <YAxis stroke="#525252" fontSize={isMobile ? 9 : 11} tickLine={false} axisLine={false} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : `${v}`} />
              <Tooltip contentStyle={{ background: 'var(--color-ss-elevated, #ffffff)', border: '1px solid var(--color-ss-border, rgba(43, 34, 26, 0.08))', borderRadius: 8, color: 'var(--color-ss-text-primary, #221a15)' }} formatter={(v: any) => [Number(v) >= 1000 ? `${(Number(v) / 1000).toFixed(0)}K` : `${v}`, 'Streams']} />
              <Area type="monotone" dataKey="streams" stroke={G} strokeWidth={2.5} fill="url(#sg)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div style={CARD}>
          <h3 style={{ color: '#fff', fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Top Countries</h3>
          {currentCountryData.length === 0 ? (
            <div style={{ minHeight: 190, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: '#737373', fontSize: 13, lineHeight: 1.5 }}>
              Country data will appear after listeners stream your approved tracks.
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12, height: 140 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={currentCountryData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} dataKey="pct">
                      {currentCountryData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {currentCountryData.map((c, i) => (
                <div key={c.country} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i] }} />
                    <span style={{ color: '#a3a3a3', fontSize: 12 }}>{c.country}</span>
                  </div>
                  <span style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>{c.pct}%</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Real-time Activity & Geo Section */}
      <div style={GRID2}>
        <div style={CARD}>
          <h3 style={{ color: '#fff', fontWeight: 700, fontSize: 16, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={18} color={G} /> Live Fan Activity Feed
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <AnimatePresence initial={false}>
              {liveActivity.length === 0 ? (
                <div style={{ minHeight: 130, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: '#737373', fontSize: 13, lineHeight: 1.5 }}>
                  Real fan activity will show here when listeners stream, comment, buy tickets, or buy merch.
                </div>
              ) : liveActivity.slice(0, visibleActivityCount).map((act) => (
                <motion.div
                  key={act.id}
                  initial={{ opacity: 0, x: -20, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: 'auto' }}
                  exit={{ opacity: 0, x: 20, height: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.04)', overflow: 'hidden' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 18 }}>{act.icon}</span>
                    <span style={{ fontSize: 13, color: '#e5e5e5' }}>
                      <strong style={{ color: '#fff' }}>{act.user}</strong> {act.action} <span style={{ color: G, fontWeight: 600 }}>{act.detail}</span>
                    </span>
                  </div>
                  <span style={{ fontSize: 11, color: '#737373', flexShrink: 0 }}>{act.time}</span>
                </motion.div>
              ))}
            </AnimatePresence>

            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              {liveActivity.length > visibleActivityCount && (
                <button
                  onClick={() => setVisibleActivityCount(prev => prev + 10)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: 12,
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: 'pointer',
                    textAlign: 'center',
                    fontFamily: 'Outfit, sans-serif',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                >
                  View More
                </button>
              )}
              {visibleActivityCount > 6 && (
                <button
                  onClick={() => setVisibleActivityCount(6)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: 12,
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    color: '#a3a3a3',
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: 'pointer',
                    textAlign: 'center',
                    fontFamily: 'Outfit, sans-serif',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.07)'; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'; e.currentTarget.style.color = '#a3a3a3'; }}
                >
                  View Less
                </button>
              )}
            </div>
          </div>
        </div>

        <div style={CARD}>
          <h3 style={{ color: '#fff', fontWeight: 700, fontSize: 16, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Globe size={18} color="#10b981" /> Stream Source Geography
          </h3>
          <p style={{ color: '#525252', fontSize: 11, marginBottom: 16 }}>Based on actual stream records from your listeners</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {geoHotspots.length === 0 ? (
              <div style={{ minHeight: 130, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: '#737373', fontSize: 13, lineHeight: 1.5 }}>
                Geography data will appear after listeners stream your tracks.
              </div>
            ) : geoHotspots.map((h: any, i: number) => {
              const maxStreams = (geoHotspots[0] as any)?.streams || 1;
              const percentage = Math.min(100, Math.round(((h.streams || h.listeners) / maxStreams) * 100));
              return (
                <div key={h.city}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 5 }}>
                    <span style={{ color: '#fff', fontWeight: 600 }}>{i + 1}. {h.city}, {h.country}</span>
                    <span style={{ color: h.color, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ fontSize: 11, color: '#a3a3a3', fontWeight: 400, marginRight: 2 }}>
                        {h.listeners} {h.listeners === 1 ? 'listener' : 'listeners'} ·
                      </span>
                      {h.streams || h.listeners} streams
                    </span>
                  </div>
                  <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ type: 'spring', stiffness: 80 }}
                      style={{ height: '100%', background: h.color, borderRadius: 3 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  const handleSpotifyImport = async () => {
    if (!spotifyUrl.trim()) return;
    setImporting(true);
    setImportSuccess(false);
    setImportProgress(0);
    setImportLogs(['[System] Initializing connection to Spotify Importer...']);

    const url = spotifyUrl.trim();
    const isTrack = url.includes('/track/');
    const isPlaylist = url.includes('/playlist/');

    if (!isTrack && !isPlaylist) {
      setImportLogs(prev => [...prev, '[Error] Invalid Spotify URL. Please paste a track or playlist URL.']);
      setImporting(false);
      toast.error('Invalid Spotify URL');
      return;
    }

    try {
      if (isTrack) {
        setImportLogs(prev => [...prev, '[oEmbed] Resolving track metadata...']);
        setImportProgress(20);
        
        // Fetch oEmbed
        const oEmbedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`;
        const res = await fetch(oEmbedUrl);
        if (!res.ok) {
          throw new Error('Failed to resolve Spotify track info via oEmbed');
        }
        const data = await res.json();
        
        const parts = data.title ? data.title.split(' by ') : [];
        const songName = parts[0] || 'Unknown Track';
        const artistName = parts[1] || 'Spotify Artist';
        const coverImage = data.thumbnail_url || '';

        setImportLogs(prev => [
          ...prev,
          `[oEmbed] Resolved: "${songName}" by "${artistName}"`,
          `[Importer] Registering track to Beato DB...`
        ]);
        setImportProgress(50);

        // Send to backend sample upload API
        const importRes = await fetch('/api/artist/sample-upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'track',
            title: songName,
            artistName,
            coverImage,
            spotifyUrl: url
          })
        });

        if (!importRes.ok) {
          const errData = await importRes.json();
          throw new Error(errData.error || 'Failed to import track in backend');
        }

        setImportProgress(100);
        setImportLogs(prev => [
          ...prev,
          `[Success] Track "${songName}" imported successfully under status 'pending'!`,
          `[System] Import complete.`
        ]);
        setImportSuccess(true);
        toast.success(`"${songName}" successfully imported!`);
        fetchTracks();
      } else {
        setImportLogs(prev => [...prev, '[oEmbed] Resolving playlist metadata...']);
        setImportProgress(5);
        
        const oEmbedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`;
        const res = await fetch(oEmbedUrl);
        if (!res.ok) {
          throw new Error('Failed to resolve Spotify playlist info via oEmbed');
        }
        const data = await res.json();
        const playlistTitle = data.title || 'Spotify Playlist';
        const coverImage = data.thumbnail_url || '';

        setImportLogs(prev => [
          ...prev,
          `[oEmbed] Resolved playlist: "${playlistTitle}"`,
          `[Database] Submitting request for 100 tracks import...`
        ]);
        setImportProgress(15);

        const importRes = await fetch('/api/artist/sample-upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'playlist',
            playlistTitle,
            coverImage
          })
        });

        if (!importRes.ok) {
          const errData = await importRes.json();
          throw new Error(errData.error || 'Failed to import playlist in backend');
        }

        const importData = await importRes.json();
        setImportLogs(prev => [...prev, `[Importer] Playlist parsing complete. Beginning live extraction stream...`]);

        // Beautiful step-by-step progress simulation to mimic extraction logs of 100 songs
        let currentTrack = 1;
        const totalSimulatedTracks = 100;
        
        const interval = setInterval(() => {
          if (currentTrack <= totalSimulatedTracks) {
            const simulatedSong = SIMULATED_PLAYLIST_SONGS_LOCAL[(currentTrack - 1) % SIMULATED_PLAYLIST_SONGS_LOCAL.length];
            const displayTitle = simulatedSong.title;
            const displayArtist = simulatedSong.artist;
            
            setImportLogs(prev => [
              ...prev,
              `[${currentTrack}/${totalSimulatedTracks}] Extracted: "${displayTitle}" by "${displayArtist}"`
            ]);
            
            const progressVal = Math.floor(15 + (currentTrack / totalSimulatedTracks) * 85);
            setImportProgress(progressVal);
            currentTrack++;
          } else {
            clearInterval(interval);
            setImportLogs(prev => [
              ...prev,
              `[Success] Imported ${totalSimulatedTracks} songs into Beato!`,
              `[System] Batch sample import complete. Sent to admin for approval.`
            ]);
            setImporting(false);
            setImportSuccess(true);
            toast.success(`Successfully imported 100 songs from "${playlistTitle}"!`);
            fetchTracks();
          }
        }, 120);
        
        return;
      }
    } catch (err: any) {
      console.error('Import error:', err);
      setImportLogs(prev => [...prev, `[Error] ${err.message || 'Unknown error occurred.'}`]);
      toast.error(err.message || 'Import failed');
    }
    setImporting(false);
  };

  const renderSampleUpload = () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 800, margin: '0 auto', padding: '24px 0' }}>
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          borderRadius: 24,
          padding: 36,
          border: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
        }}>
          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 24, fontWeight: 800, color: '#fff', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Sparkles size={24} color={G} /> Spotify Sample Importer
            </h2>
            <p style={{ color: '#a3a3a3', fontSize: 14, margin: 0 }}>
              Paste a real Spotify Track or Playlist link to extract all metadata, cover art, generate synchronized lyrics, and register playable tracks under your account.
            </p>
          </div>

          {/* Form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Spotify URL</label>
              <input
                type="text"
                value={spotifyUrl}
                onChange={e => setSpotifyUrl(e.target.value)}
                placeholder="e.g., https://open.spotify.com/track/... or https://open.spotify.com/playlist/..."
                disabled={importing}
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 100,
                  padding: '12px 20px',
                  color: '#fff',
                  fontSize: 14,
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'Inter, sans-serif'
                }}
              />
            </div>

            <button
              onClick={handleSpotifyImport}
              disabled={importing || !spotifyUrl.trim()}
              style={{
                ...BUTTON_PRIMARY,
                background: importing || !spotifyUrl.trim() ? 'rgba(255,255,255,0.08)' : G,
                color: importing || !spotifyUrl.trim() ? '#737373' : '#000',
                cursor: importing || !spotifyUrl.trim() ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                height: 46,
                fontSize: 14,
                transition: 'all 0.2s'
              }}
            >
              {importing ? (
                <>
                  <div className="animate-spin" style={{ width: 16, height: 16, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%' }} /> Importing Samples...
                </>
              ) : (
                <>Import from Spotify</>
              )}
            </button>
          </div>
        </div>

        {/* Progress board */}
        {(importing || importLogs.length > 0) && (
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            borderRadius: 24,
            padding: 24,
            border: '1px solid rgba(176, 136, 80, 0.15)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 16, fontWeight: 700, color: '#fff', margin: 0 }}>
                Extraction Logs
              </h3>
              <span style={{ fontSize: 13, fontWeight: 700, color: G }}>
                {importProgress}%
              </span>
            </div>

            {/* Progress bar */}
            <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 100, marginBottom: 20, overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${importProgress}%` }}
                style={{ height: '100%', background: G, borderRadius: 100 }}
              />
            </div>

            {/* Logs console */}
            <div style={{
              background: '#0a0a0a',
              borderRadius: 12,
              padding: 16,
              height: 240,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              fontFamily: 'Consolas, Monaco, monospace',
              fontSize: 12.5,
              color: '#d4d4d4',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              {importLogs.map((log, idx) => (
                <div key={idx} style={{
                  color: log.includes('Success') || log.includes('complete') ? '#10b981' : log.includes('Error') ? '#ef4444' : log.includes('Extracted') ? '#fff' : '#d4d4d4'
                }}>
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // 2. My Music Tab
  const renderMyMusic = () => {
    const uniqueGenres = ['all', ...Array.from(new Set(myTracks.map(t => t.genre)))];
    
    const filteredTracks = myTracks.filter(track => {
      const matchesSearch = track.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            track.albumName.toLowerCase().includes(searchQuery.toLowerCase());
      const trackStatus = track.status || (track.id.startsWith('track-uploaded') ? 'pending' : 'approved');
      const matchesStatus = statusFilter === 'all' || trackStatus === statusFilter;
      const matchesGenre = genreFilter === 'all' || track.genre === genreFilter;
      return matchesSearch && matchesStatus && matchesGenre;
    });

    // Sort tracks by latest uploads first
    const sortedTracks = [...filteredTracks].sort((a, b) => {
      const isAUploaded = a.id.startsWith('track-uploaded-');
      const isBUploaded = b.id.startsWith('track-uploaded-');
      
      if (isAUploaded && isBUploaded) {
        const timeA = parseInt(a.id.replace('track-uploaded-', ''), 10) || 0;
        const timeB = parseInt(b.id.replace('track-uploaded-', ''), 10) || 0;
        return timeB - timeA;
      }
      
      if (isAUploaded && !isBUploaded) return -1;
      if (!isAUploaded && isBUploaded) return 1;
      
      const indexA = parseInt(a.id.replace('track-', ''), 10) || 0;
      const indexB = parseInt(b.id.replace('track-', ''), 10) || 0;
      return indexB - indexA;
    });

    // Pagination calculations
    const indexOfLastTrack = currentPage * tracksPerPage;
    const indexOfFirstTrack = indexOfLastTrack - tracksPerPage;
    const paginatedTracks = sortedTracks.slice(indexOfFirstTrack, indexOfLastTrack);
    const totalPages = Math.ceil(sortedTracks.length / tracksPerPage);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 18, border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
          
          {/* Header */}
          <div style={{ padding: '20px 22px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <h3 style={{ color: '#fff', fontWeight: 700, fontSize: 16, margin: 0 }}>
              Your Tracks <span style={{ color: G, fontSize: 13 }}>({filteredTracks.length} of {myTracks.length})</span>
            </h3>
            <Link href="/artist/upload" style={{ textDecoration: 'none' }}>
              <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9, background: 'rgba(176, 136, 80,0.15)', border: '1px solid rgba(176, 136, 80,0.3)', color: G, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                <Plus size={14} /> Add Track
              </button>
            </Link>
          </div>

          {/* Advanced Search & Filters Bar */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, padding: '12px 22px', background: 'rgba(255,255,255,0.01)', borderBottom: '1px solid rgba(255,255,255,0.06)', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search track title or album..."
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 100,
                  padding: '8px 16px',
                  color: '#fff',
                  fontSize: 13,
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'all 0.2s',
                  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.2)'
                }}
                onFocus={e => {
                  e.target.style.borderColor = G;
                  e.target.style.boxShadow = '0 0 8px rgba(176, 136, 80, 0.2)';
                }}
                onBlur={e => {
                  e.target.style.borderColor = 'rgba(255,255,255,0.08)';
                  e.target.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.2)';
                }}
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 100,
                padding: '8px 16px',
                color: '#fff',
                fontSize: 13,
                outline: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                colorScheme: 'dark'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            >
              <option value="all">All Statuses</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>

            <select
              value={genreFilter}
              onChange={e => setGenreFilter(e.target.value)}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 100,
                padding: '8px 16px',
                color: '#fff',
                fontSize: 13,
                outline: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                colorScheme: 'dark'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            >
              <option value="all">All Genres</option>
              {uniqueGenres.filter(g => g !== 'all').map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>

          </div>

          {/* Mobile Track Listing */}
          <div className="mobile-only" style={{ display: 'flex', flexDirection: 'column' }}>
            {paginatedTracks.length === 0 ? (
              <div style={{ padding: '40px 22px', textAlign: 'center', color: '#737373' }}>
                No tracks match your query. Click "Add Track" to release a new song!
              </div>
            ) : (
              paginatedTracks.map((track, i) => {
                const isUploaded = uploadedTracks.some(u => u.id === track.id);
                const currentPlays = track.plays || 0;
                const trackStatus = track.status || (track.id.startsWith('track-uploaded') ? 'pending' : 'approved');
                const trackActive = liveTrackListeners[track.id] ?? 0;
                return (
                  <div
                    key={track.id}
                    onClick={() => setSelectedTrackForDetail(track)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '14px 16px',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      cursor: 'pointer',
                      transition: 'background 0.15s'
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    {/* Left Side: Index + Artwork + Title & Stats Layout */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
                      <span style={{ fontSize: 12, color: '#525252', width: 16, textAlign: 'center', fontWeight: 600 }}>{indexOfFirstTrack + i + 1}</span>
                      <div style={{
                        width: 48,
                        height: 48,
                        borderRadius: 8,
                        background: track.coverImage ? `url(${track.coverImage}) center/cover no-repeat` : trackGradient(track.id),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        overflow: 'hidden',
                        boxShadow: 'none',
                        border: '1px solid rgba(43, 34, 26, 0.1)'
                      }}>
                        {!track.coverImage && <Music size={18} color="rgba(255,255,255,0.8)" />}
                      </div>
                      
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'nowrap' }}>
                          <p style={{ color: '#fff', fontSize: 14, fontWeight: 700, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {track.title}
                          </p>
                          {isUploaded && (
                            <span style={{
                              fontSize: 8,
                              background: 'rgba(176, 136, 80,0.15)',
                              color: G,
                              border: '1px solid rgba(176, 136, 80,0.25)',
                              padding: '1px 5px',
                              borderRadius: 100,
                              fontWeight: 800,
                              flexShrink: 0
                            }}>
                              NEW
                            </span>
                          )}
                        </div>
                        <p style={{ color: '#a3a3a3', fontSize: 11, marginTop: 3, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {track.albumName} · {track.genre}
                        </p>
                        <p style={{ color: '#737373', fontSize: 11, marginTop: 2, margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Play size={10} style={{ display: 'inline', flexShrink: 0 }} /> 
                          <span style={{ color: '#fff', fontWeight: 600 }}>{currentPlays.toLocaleString()}</span> streams
                        </p>
                        {trackActive > 0 && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4, fontSize: 10, fontWeight: 700, color: '#ef4444' }}>
                            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
                            {trackActive} live
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right Side: Status Badge + Delete Button */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        padding: '4px 8px',
                        borderRadius: '100px',
                        background: trackStatus === 'approved' ? 'rgba(176, 136, 80,0.08)' : trackStatus === 'rejected' ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)',
                        border: `1px solid ${trackStatus === 'approved' ? 'rgba(176, 136, 80,0.15)' : trackStatus === 'rejected' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)'}`,
                        color: trackStatus === 'approved' ? '#b08850' : trackStatus === 'rejected' ? '#ef4444' : '#f59e0b',
                        fontSize: '10px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em'
                      }}>
                        <span style={{
                          width: 5,
                          height: 5,
                          borderRadius: '50%',
                          background: trackStatus === 'approved' ? '#b08850' : trackStatus === 'rejected' ? '#ef4444' : '#f59e0b',
                          display: 'inline-block'
                        }} />
                        {trackStatus}
                      </div>
                      
                      <button
                        onClick={() => handleDeleteTrack(track.id)}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          background: 'rgba(239,68,68,0.08)',
                          border: '1px solid rgba(239,68,68,0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ef4444',
                          cursor: 'pointer',
                          padding: 0,
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = 'rgba(239,68,68,0.15)';
                          e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = 'rgba(239,68,68,0.08)';
                          e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.15)';
                        }}
                        title="Delete Track"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Desktop Track Listing */}
          <div className="desktop-only" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ color: '#525252', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  <th style={{ padding: '12px 22px', textAlign: 'left', fontWeight: 600 }}>#</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 600 }}>Track</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 600 }}>Genre</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 600 }}>Active Now</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 600 }}>Streams</th>
                  <th style={{ padding: '12px 22px', textAlign: 'right', fontWeight: 600 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTracks.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '40px 22px', textAlign: 'center', color: '#737373' }}>
                      No tracks match your query. Click "Add Track" to release a new song!
                    </td>
                  </tr>
                ) : (
                  paginatedTracks.map((track, i) => {
                    const isUploaded = uploadedTracks.some(u => u.id === track.id);
                    const currentPlays = track.plays || 0;
                    const trackStatus = track.status || (track.id.startsWith('track-uploaded') ? 'pending' : 'approved');
                    const trackActive = liveTrackListeners[track.id] ?? 0;
                    return (
                      <tr key={track.id} 
                        onClick={() => setSelectedTrackForDetail(track)}
                        style={{ borderTop: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', transition: 'background 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <td style={{ padding: '14px 22px', color: '#525252' }}>{indexOfFirstTrack + i + 1}</td>
                        <td style={{ padding: '14px 8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{
                              width: 40,
                              height: 40,
                              borderRadius: 6,
                              background: track.coverImage ? `url(${track.coverImage}) center/cover no-repeat` : trackGradient(track.id),
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              overflow: 'hidden'
                            }}>
                              {!track.coverImage && <Music size={16} color="rgba(255,255,255,0.8)" />}
                            </div>
                            <div>
                              <p style={{ color: '#fff', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
                                {track.title}
                                {isUploaded && <span style={{ fontSize: 10, background: 'rgba(176, 136, 80,0.2)', color: G, padding: '2px 7px', borderRadius: 100, fontWeight: 700 }}>NEW</span>}
                              </p>
                              <p style={{ color: '#737373', fontSize: 11, marginTop: 2, margin: 0 }}>{track.albumName}</p>
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
                            background: trackStatus === 'approved' ? 'rgba(176, 136, 80,0.12)' : trackStatus === 'rejected' ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)',
                            color: trackStatus === 'approved' ? '#b08850' : trackStatus === 'rejected' ? '#ef4444' : '#f59e0b',
                          }}>
                            {trackStatus}
                          </span>
                        </td>
                        <td style={{ padding: '14px 8px' }}>
                          {trackActive > 0 ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 8px', borderRadius: 100, fontSize: 11, fontWeight: 700, background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>
                              <motion.span
                                animate={{ opacity: [0.4, 1, 0.4] }}
                                transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                                style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }}
                              />
                              {trackActive} listening
                            </span>
                          ) : (
                            <span style={{ color: '#525252', fontSize: 11.5 }}>Inactive</span>
                          )}
                        </td>
                        <td style={{ padding: '14px 8px', textAlign: 'right', color: '#a3a3a3' }}>{currentPlays.toLocaleString()}</td>
                        <td style={{ padding: '14px 22px', textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                          <button onClick={() => handleDeleteTrack(track.id)}
                            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, padding: '4px 8px', color: '#ef4444', cursor: 'pointer' }}>
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer Controls */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
              padding: '16px 22px',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(255,255,255,0.01)'
            }}>
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: currentPage === 1 ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: currentPage === 1 ? '#525252' : '#fff',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => {
                  if (currentPage > 1) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                  }
                }}
                onMouseLeave={e => {
                  if (currentPage > 1) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                  }
                }}
                title="Previous Page"
              >
                <ChevronLeft size={18} />
              </button>
              
              <span style={{ fontSize: 13, color: '#a3a3a3', fontWeight: 600, fontFamily: 'Outfit, sans-serif' }}>
                Page <span style={{ color: '#fff' }}>{currentPage}</span> of {totalPages}
              </span>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: currentPage === totalPages ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: currentPage === totalPages ? '#525252' : '#fff',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => {
                  if (currentPage < totalPages) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                  }
                }}
                onMouseLeave={e => {
                  if (currentPage < totalPages) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                  }
                }}
                title="Next Page"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>

        {/* Dynamic Advanced Analytics Drawer */}
        <AnimatePresence>
          {selectedTrackForDetail && (
            <div style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(6px)',
              zIndex: 1000,
              display: 'flex',
              justifyContent: 'flex-end',
            }} onClick={() => setSelectedTrackForDetail(null)}>
              <motion.div
                initial={{ x: 400, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 400, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                style={{
                  width: '420px',
                  height: '100%',
                  background: '#0e0e10',
                  borderLeft: '1px solid rgba(255,255,255,0.08)',
                  padding: '30px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 20,
                  boxShadow: '-12px 0 40px rgba(0,0,0,0.7)',
                  overflowY: 'auto',
                  boxSizing: 'border-box'
                }}
                onClick={e => e.stopPropagation()}
              >
                {/* Drawer Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <TrendingUp size={16} color={G} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#737373', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Track Analytics</span>
                  </div>
                  <button
                    onClick={() => setSelectedTrackForDetail(null)}
                    style={{ background: 'none', border: 'none', color: '#737373', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                    onMouseLeave={e => e.currentTarget.style.color = '#737373'}
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Track Visual Card */}
                <div style={{ display: 'flex', gap: 16, alignItems: 'center', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ 
                    width: 72, height: 72, borderRadius: 12, 
                    background: selectedTrackForDetail.coverImage ? `url(${selectedTrackForDetail.coverImage}) center/cover no-repeat` : trackGradient(selectedTrackForDetail.id), 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    flexShrink: 0, position: 'relative', overflow: 'hidden' 
                  }}>
                    {!selectedTrackForDetail.coverImage && <Music size={24} color="rgba(255,255,255,0.8)" />}
                    {/* Play Overlay */}
                    <div
                      onClick={() => globalPlayTrack(selectedTrackForDetail, myTracks)}
                      style={{
                        position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        opacity: 0, cursor: 'pointer', transition: 'opacity 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '0'}
                    >
                      <Play size={20} color="#fff" fill="#fff" />
                    </div>
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{ color: '#fff', fontSize: 15, fontWeight: 800, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {selectedTrackForDetail.title}
                    </h4>
                    <p style={{ color: '#737373', fontSize: 12, margin: '4px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      Album: {selectedTrackForDetail.albumName}
                    </p>
                    <span style={{
                      display: 'inline-block', marginTop: 8, padding: '2px 8px', borderRadius: 10, fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
                      background: (selectedTrackForDetail.status || 'approved') === 'approved' ? 'rgba(176, 136, 80,0.12)' : (selectedTrackForDetail.status === 'rejected' ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)'),
                      color: (selectedTrackForDetail.status || 'approved') === 'approved' ? G : (selectedTrackForDetail.status === 'rejected' ? '#ef4444' : '#f59e0b')
                    }}>
                      {selectedTrackForDetail.status || 'approved'}
                    </span>
                  </div>
                </div>

                {/* Action Play Button */}
                <button
                  type="button"
                  onClick={() => globalPlayTrack(selectedTrackForDetail, myTracks)}
                  style={{
                    width: '100%', padding: '12px', borderRadius: 12, background: G, border: 'none', color: 'black',
                    fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    fontFamily: 'Outfit, sans-serif'
                  }}
                >
                  <Play size={14} fill="black" /> Audition Track Live
                </button>

                {/* Analytics Metrics Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ padding: 14, background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ fontSize: 10, color: '#737373', textTransform: 'uppercase', fontWeight: 700 }}>Total Streams</span>
                    <p style={{ fontSize: 20, fontWeight: 900, color: '#fff', margin: '4px 0 0' }}>{(selectedTrackForDetail.plays || 0).toLocaleString()}</p>
                  </div>
                  <div style={{ padding: 14, background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ fontSize: 10, color: '#737373', textTransform: 'uppercase', fontWeight: 700 }}>Net Revenue</span>
                    <p style={{ fontSize: 20, fontWeight: 900, color: G, margin: '4px 0 0' }}>${((selectedTrackForDetail.plays || 0) * 0.0028).toFixed(2)}</p>
                  </div>
                </div>

                {/* Live Listeners Indicator */}
                <div style={{ padding: '14px', borderRadius: 12, background: (liveTrackListeners[selectedTrackForDetail.id] ?? 0) > 0 ? 'rgba(239,68,68,0.05)' : 'rgba(255,255,255,0.02)', border: `1px solid ${(liveTrackListeners[selectedTrackForDetail.id] ?? 0) > 0 ? '#ef444430' : 'rgba(255,255,255,0.04)'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: '#a3a3a3' }}>Active Listeners Now</span>
                  <span style={{
                    fontSize: 12, fontWeight: 700, color: (liveTrackListeners[selectedTrackForDetail.id] ?? 0) > 0 ? '#ef4444' : '#737373',
                    display: 'flex', alignItems: 'center', gap: 6
                  }}>
                    <span style={{
                      width: 6, height: 6, borderRadius: '50%', background: (liveTrackListeners[selectedTrackForDetail.id] ?? 0) > 0 ? '#ef4444' : '#737373',
                      display: 'inline-block', animation: (liveTrackListeners[selectedTrackForDetail.id] ?? 0) > 0 ? 'pulse 1.5s infinite' : 'none'
                    }} />
                    {liveTrackListeners[selectedTrackForDetail.id] ?? 0} listening
                  </span>
                </div>

                {/* Geographic Hotspots */}
                <div>
                  <h5 style={{ color: '#fff', fontSize: 12, fontWeight: 700, margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Geo Demographics</h5>
                  {payoutStreams.filter(s => s.trackId === selectedTrackForDetail.id).length === 0 ? (
                    <p style={{ color: '#737373', fontSize: 11, margin: 0 }}>No streams recorded yet to aggregate geography stats.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {(() => {
                        const trackStreams = payoutStreams.filter(s => s.trackId === selectedTrackForDetail.id);
                        const total = trackStreams.length || 1;
                        const counts: Record<string, number> = {};
                        trackStreams.forEach(s => {
                          const country = s.country === 'IN' ? 'India' : s.country === 'US' ? 'USA' : s.country === 'GB' || s.country === 'UK' ? 'UK' : s.country === 'BR' ? 'Brazil' : s.country;
                          counts[country] = (counts[country] || 0) + 1;
                        });
                        return Object.entries(counts).map(([country, count]) => {
                          const pct = Math.round((count / total) * 100);
                          return (
                            <div key={country}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                                <span style={{ color: 'var(--color-ss-text-muted, #87786c)' }}>{country}</span>
                                <span style={{ color: 'var(--color-ss-text-primary, #221a15)', fontWeight: 600 }}>{count} streams ({pct}%)</span>
                              </div>
                              <div style={{ height: 4, background: 'var(--color-ss-surface, #f4eede)', borderRadius: 2, overflow: 'hidden' }}>
                                <div style={{ height: '100%', background: G, width: `${pct}%` }} />
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  )}
                </div>

                {/* Recent Listeners */}
                <div>
                  <h5 style={{ color: '#fff', fontSize: 12, fontWeight: 700, margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recent Streams</h5>
                  {(() => {
                    const trackStreams = payoutStreams
                      .filter(s => s.trackId === selectedTrackForDetail.id)
                      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                      .slice(0, 3);
                    
                    if (trackStreams.length === 0) {
                      return <p style={{ color: '#737373', fontSize: 11, margin: 0 }}>No recent streams found.</p>;
                    }

                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {trackStreams.map(s => {
                          const dateStr = new Date(s.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date(s.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                          return (
                            <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 8, background: 'rgba(255,255,255,0.01)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.03)', fontSize: 11 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 14 }}>🎧</span>
                                <div>
                                  <p style={{ color: '#fff', fontWeight: 600, margin: 0 }}>Fan (Anonymous)</p>
                                  <p style={{ color: '#737373', fontSize: 10, margin: 0 }}>Country: {s.country || 'IN'} • {s.isPremium ? 'Premium' : 'Free Ad'}</p>
                                </div>
                              </div>
                              <span style={{ color: '#737373', fontSize: 10, marginLeft: 'auto' }}>{dateStr}</span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>

                {/* Fan Feed comments */}
                <div>
                  <h5 style={{ color: '#fff', fontSize: 12, fontWeight: 700, margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Track Fan Comments</h5>
                  {(() => {
                    const trackComments = fanComments.filter(c => c.track === selectedTrackForDetail.title).slice(0, 2);
                    if (trackComments.length === 0) {
                      return <p style={{ color: '#737373', fontSize: 11, margin: 0 }}>No comments on this track yet.</p>;
                    }
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {trackComments.map(c => (
                          <div key={c.id} style={{ padding: 10, background: 'rgba(255,255,255,0.01)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.03)', fontSize: 11.5 }}>
                            <p style={{ color: '#fff', fontWeight: 700, margin: 0 }}>{c.user}</p>
                            <p style={{ color: '#a3a3a3', marginTop: 4, margin: '4px 0 0', lineHeight: 1.4 }}>"{c.text}"</p>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>

              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  // 3. Analytics Tab
  const renderAnalytics = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Analytics Sub-tab Selector */}
      <div style={{ 
        display: 'flex', 
        gap: 6, 
        background: 'rgba(255,255,255,0.03)', 
        padding: 4, 
        borderRadius: 12, 
        border: '1px solid rgba(255,255,255,0.05)', 
        width: isMobile ? '100%' : 'auto',
        alignSelf: isMobile ? 'stretch' : 'flex-start',
        boxSizing: 'border-box'
      }}>
        <button
          onClick={() => setAnalyticsSubTab('Overview')}
          style={{
            flex: isMobile ? 1 : 'none',
            padding: '8px 16px',
            borderRadius: 8,
            border: 'none',
            background: analyticsSubTab === 'Overview' ? 'rgba(255,255,255,0.08)' : 'transparent',
            color: analyticsSubTab === 'Overview' ? '#fff' : '#a3a3a3',
            fontSize: 12.5,
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s',
            textAlign: 'center',
            whiteSpace: 'nowrap'
          }}
        >
          Growth Overview
        </button>
        <button
          onClick={() => setAnalyticsSubTab('Advanced')}
          style={{
            flex: isMobile ? 1 : 'none',
            padding: '8px 16px',
            borderRadius: 8,
            border: 'none',
            background: analyticsSubTab === 'Advanced' ? 'rgba(255,255,255,0.08)' : 'transparent',
            color: analyticsSubTab === 'Advanced' ? '#fff' : '#a3a3a3',
            fontSize: 12.5,
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s',
            textAlign: 'center',
            whiteSpace: 'nowrap'
          }}
        >
          Advanced Insights
        </button>
      </div>

      {analyticsSubTab === 'Overview' ? (
        <>
          {/* Top Summary Cards (Spotify / Overview style) */}
          <div className="stats-grid">
            <StatCard icon={Play} label="Avg. Daily Streams" value={avgDailyStreams.toLocaleString()} change="+12.4%" positive color="#10b981" cardBg="#15803d" />
            <StatCard icon={Heart} label="Engagement Rate" value={engagementRate} change="+4.8%" positive color="#34d399" cardBg="#047857" />
            <StatCard icon={Users} label="Monthly Listeners" value={advancedAnalytics.mal.toLocaleString()} change="+8.2%" positive color="#b08850" cardBg="#006450" />
            <StatCard icon={TrendingUp} label="Stream Velocity" value={`${streamVelocity} SPM`} change="LIVE" positive color="#06b6d4" cardBg="#14532d" />
          </div>

          {/* Row 1: Area chart & Streaming velocity */}
          <div style={GRID2}>
            <div style={CARD}>
              <h3 style={{ color: '#fff', fontWeight: 700, fontSize: 16, marginBottom: 18 }}>Granular Stream Growth</h3>
              <ResponsiveContainer width="100%" height={isMobile ? 180 : 240}>
                <AreaChart data={currentStreamData}>
                  <defs>
                    <linearGradient id="an_sg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="date" stroke="#525252" fontSize={isMobile ? 9 : 11} tickLine={false} axisLine={false} interval={isMobile ? 1 : 0} />
                  <YAxis stroke="#525252" fontSize={isMobile ? 9 : 11} tickLine={false} axisLine={false} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : `${v}`} />
                  <Tooltip contentStyle={{ background: 'var(--color-ss-elevated, #ffffff)', border: '1px solid var(--color-ss-border, rgba(43, 34, 26, 0.08))', borderRadius: 8, color: 'var(--color-ss-text-primary, #221a15)' }} formatter={(v: any) => [Number(v).toLocaleString(), 'Streams']} />
                  <Area type="monotone" dataKey="streams" stroke="#10b981" strokeWidth={2.5} fill="url(#an_sg)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div style={{ ...CARD, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: isMobile ? 240 : 'auto' }}>
              <div>
                <h3 style={{ color: '#fff', fontWeight: 700, fontSize: 16, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <TrendingUp size={18} color={G} /> Real-Time Streaming Velocity
                </h3>
                <p style={{ color: '#737373', fontSize: 12.5, margin: 0 }}>Streams propagating across the network</p>
              </div>
              
              <div style={{ padding: isMobile ? '12px 0' : '20px 0', textAlign: 'center' }}>
                <div style={{ position: 'relative', width: 140, height: 75, margin: '0 auto', overflow: 'hidden' }}>
                  {/* Semi-circle Gauge Background */}
                  <div style={{ width: 140, height: 140, borderRadius: '50%', border: '12px solid rgba(255,255,255,0.05)', borderBottomColor: 'transparent', borderLeftColor: 'transparent', transform: 'rotate(-45deg)', position: 'absolute', top: 0, left: 0 }} />
                  {/* Gauged color arc using progress */}
                  <div style={{
                    width: 140, height: 140, borderRadius: '50%',
                    border: `12px solid ${G}`, borderBottomColor: 'transparent', borderLeftColor: 'transparent',
                    transform: `rotate(${-45 + (Math.min(10, streamVelocity) / 10) * 180}deg)`,
                    transition: 'transform 0.5s ease',
                    position: 'absolute', top: 0, left: 0
                  }} />
                  <div style={{ position: 'absolute', bottom: 0, width: '100%', textAlign: 'center' }}>
                    <span style={{ fontSize: 36, fontWeight: 900, fontFamily: 'Outfit, sans-serif', color: '#fff' }}>{streamVelocity}</span>
                  </div>
                </div>
                <div style={{ color: '#a3a3a3', fontSize: 12, fontWeight: 600, marginTop: 8 }}>SPM (Streams Per Minute)</div>
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: '#737373' }}>Network Trend</span>
                {velocityTrend === 'up' ? (
                  <span style={{ color: G, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}><ChevronUp size={14} /> Speeding up (+14%)</span>
                ) : (
                  <span style={{ color: '#ef4444', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}><ChevronDown size={14} /> Stabilizing (-3%)</span>
                )}
              </div>
            </div>
          </div>

          {/* Row 2: Advanced line & donut charts */}
          <div style={GRID2}>
            {/* Premium vs Free line chart */}
            <div style={CARD}>
              <h3 style={{ color: '#fff', fontWeight: 700, fontSize: 16, marginBottom: 6 }}>Listener Cohort Activity</h3>
              <p style={{ color: '#737373', fontSize: 12.5, margin: '0 0 18px 0' }}>Comparison of Premium vs Free user streaming behaviors</p>
              <ResponsiveContainer width="100%" height={isMobile ? 180 : 220}>
                <LineChart data={listenerCohortData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="date" stroke="#525252" fontSize={isMobile ? 9 : 11} tickLine={false} axisLine={false} interval={isMobile ? 1 : 0} />
                  <YAxis stroke="#525252" fontSize={isMobile ? 9 : 11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: 'var(--color-ss-elevated, #ffffff)', border: '1px solid var(--color-ss-border, rgba(43, 34, 26, 0.08))', borderRadius: 8, color: 'var(--color-ss-text-primary, #221a15)' }} />
                  <Line type="monotone" dataKey="Premium" stroke="#10b981" strokeWidth={2.5} activeDot={{ r: 6 }} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="Free" stroke="#b08850" strokeWidth={2.5} activeDot={{ r: 6 }} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 20, fontSize: 11.5, marginTop: 8 }}>
                <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 8, height: 8, background: '#10b981', borderRadius: '50%' }} /> Premium Listeners</span>
                <span style={{ color: '#b08850', display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 8, height: 8, background: '#b08850', borderRadius: '50%' }} /> Free Listeners</span>
              </div>
            </div>

            {/* Geographic donut chart */}
            <div style={CARD}>
              <h3 style={{ color: '#fff', fontWeight: 700, fontSize: 16, marginBottom: 6 }}>Geographic Fan Hotspots</h3>
              <p style={{ color: '#737373', fontSize: 12.5, margin: '0 0 18px 0' }}>Regional share and distribution of your streams</p>
              
              <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'center', gap: isMobile ? 14 : 20, height: isMobile ? 'auto' : 220 }}>
                <div style={{ flex: isMobile ? 'none' : 1.2, height: isMobile ? 160 : '100%', width: isMobile ? '100%' : 'auto' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={geoShareData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {geoShareData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: 'var(--color-ss-elevated, #ffffff)', border: '1px solid var(--color-ss-border, rgba(43, 34, 26, 0.08))', borderRadius: 8, color: 'var(--color-ss-text-primary, #221a15)' }} formatter={(v: any) => [`${v} listener(s)`]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Custom Legend */}
                <div style={{ 
                  flex: isMobile ? 'none' : 0.8, 
                  display: 'flex', 
                  flexDirection: isMobile ? 'row' : 'column', 
                  flexWrap: 'wrap', 
                  justifyContent: isMobile ? 'center' : 'flex-start', 
                  gap: 10,
                  width: isMobile ? '100%' : 'auto',
                  marginTop: isMobile ? 8 : 0
                }}>
                  {geoShareData.slice(0, 4).map((item, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 8, width: isMobile ? '45%' : 'auto', minWidth: 0 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ color: '#fff', fontSize: 12, fontWeight: 700, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{item.name}</div>
                        <div style={{ color: '#737373', fontSize: 10.5, marginTop: 2 }}>{item.pct}% share</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Row 3: Top Tracks Breakdown & Recommendations */}
          <div style={GRID2}>
            {/* Top Tracks Bar Chart */}
            <div style={CARD}>
              <h3 style={{ color: '#fff', fontWeight: 700, fontSize: 16, marginBottom: 18 }}>Top Tracks Stream Distribution</h3>
              {topTracksData.length === 0 ? (
                <div style={{ padding: '60px 0', textAlign: 'center', color: '#737373', fontSize: 13 }}>No streams recorded yet. Share your tracks to get insights!</div>
              ) : (
                <ResponsiveContainer width="100%" height={isMobile ? 180 : 200}>
                  <BarChart data={topTracksData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
                    <XAxis type="number" stroke="#525252" fontSize={isMobile ? 9 : 11} tickLine={false} axisLine={false} />
                    <YAxis dataKey="name" type="category" stroke="#525252" fontSize={isMobile ? 9 : 11} width={isMobile ? 65 : 100} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: 'var(--color-ss-elevated, #ffffff)', border: '1px solid var(--color-ss-border, rgba(43, 34, 26, 0.08))', borderRadius: 8, color: 'var(--color-ss-text-primary, #221a15)' }} formatter={(v: any) => [Number(v).toLocaleString(), 'Streams']} />
                    <Bar dataKey="streams" fill="#10b981" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Real-Time Stream Optimizer */}
            <div style={{ ...CARD, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <h3 style={{ color: '#fff', fontWeight: 700, fontSize: 16, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sparkles size={18} color="#f59e0b" /> Real-Time Stream Optimizer
              </h3>
              <p style={{ color: '#737373', fontSize: 12.5, margin: 0 }}>Algorithmic recommendations to boost metrics</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, justifyContent: 'center' }}>
                {optimizationRecommendations.map((rec, index) => (
                  <div key={index} style={{ 
                    padding: 12, 
                    background: 'rgba(255,255,255,0.02)', 
                    borderRadius: 10, 
                    border: '1px solid rgba(255,255,255,0.05)', 
                    display: 'flex', 
                    flexDirection: isMobile ? 'column' : 'row', 
                    justifyContent: 'space-between', 
                    alignItems: isMobile ? 'stretch' : 'center', 
                    gap: 12 
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>{rec.title}</div>
                      <div style={{ color: '#a3a3a3', fontSize: 11, marginTop: 4, lineHeight: 1.3 }}>{rec.desc}</div>
                    </div>
                    <Link href={`/artist/dashboard?tab=${encodeURIComponent(rec.tab)}`} style={{ display: 'block', width: isMobile ? '100%' : 'auto' }}>
                      <button style={{ 
                        width: '100%',
                        padding: '8px 12px', 
                        borderRadius: 6, 
                        background: 'rgba(255,255,255,0.05)', 
                        border: '1px solid rgba(255,255,255,0.1)', 
                        color: '#fff', 
                        fontSize: 11, 
                        fontWeight: 700, 
                        cursor: 'pointer', 
                        transition: 'all 0.2s', 
                        whiteSpace: 'nowrap' 
                      }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}>
                        {rec.action}
                      </button>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Advanced Insights Sub-tab: 10 Real-Time Features */}
          {/* Row 1: 4 Metric Cards (Vibrant Spotify / Overview style) */}
          <div className="stats-grid">
            {/* Feature 1: Monthly Active Listeners (MAL) */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }}
              whileTap={{ scale: 0.98 }}
              style={{ 
                padding: '14px 16px', 
                borderRadius: 12, 
                background: '#15803d',
                position: 'relative',
                overflow: 'hidden',
                height: 105,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 1 }}>
                <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.9)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  MAL (Monthly Listeners)
                </span>
                <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 100, background: 'rgba(255,255,255,0.2)', color: '#fff', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <TrendingUp size={10} /> Real-time
                </span>
              </div>
              <div style={{ zIndex: 1 }}>
                <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 26, fontWeight: 900, color: '#fff', margin: 0, lineHeight: 1.1 }}>
                  {advancedAnalytics.mal.toLocaleString()}
                </p>
              </div>
              <div style={{ 
                position: 'absolute', bottom: -8, right: -10, width: 52, height: 52, transform: 'rotate(25deg)', borderRadius: 6, 
                background: 'rgba(255, 255, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 0 
              }}>
                <Users size={24} color="#fff" style={{ transform: 'rotate(-25deg)' }} />
              </div>
            </motion.div>

            {/* Feature 3: Play Completion */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }}
              whileTap={{ scale: 0.98 }}
              style={{ 
                padding: '14px 16px', 
                borderRadius: 12, 
                background: '#006450',
                position: 'relative',
                overflow: 'hidden',
                height: 105,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 1 }}>
                <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.9)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Play Completion
                </span>
                <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 100, background: 'rgba(255,255,255,0.2)', color: '#fff' }}>
                  Skip: {advancedAnalytics.skipRate}%
                </span>
              </div>
              <div style={{ zIndex: 1 }}>
                <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 26, fontWeight: 900, color: '#fff', margin: 0, lineHeight: 1.1 }}>
                  {advancedAnalytics.completionRate}%
                </p>
              </div>
              <div style={{ 
                position: 'absolute', bottom: -8, right: -10, width: 52, height: 52, transform: 'rotate(25deg)', borderRadius: 6, 
                background: 'rgba(255, 255, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 0 
              }}>
                <Clock size={24} color="#fff" style={{ transform: 'rotate(-25deg)' }} />
              </div>
            </motion.div>

            {/* Feature 4: Hi-Res Audio Stream Share */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }}
              whileTap={{ scale: 0.98 }}
              style={{ 
                padding: '14px 16px', 
                borderRadius: 12, 
                background: '#14532d',
                position: 'relative',
                overflow: 'hidden',
                height: 105,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 1 }}>
                <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.9)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Hi-Res Share
                </span>
                <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 100, background: 'rgba(255,255,255,0.2)', color: '#fff' }}>
                  Std: {advancedAnalytics.standardPct}%
                </span>
              </div>
              <div style={{ zIndex: 1 }}>
                <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 26, fontWeight: 900, color: '#fff', margin: 0, lineHeight: 1.1 }}>
                  {advancedAnalytics.hiResPct}%
                </p>
              </div>
              <div style={{ 
                position: 'absolute', bottom: -8, right: -10, width: 52, height: 52, transform: 'rotate(25deg)', borderRadius: 6, 
                background: 'rgba(255, 255, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 0 
              }}>
                <Volume2 size={24} color="#fff" style={{ transform: 'rotate(-25deg)' }} />
              </div>
            </motion.div>

            {/* Feature 2: Payout Threshold Milestone */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }}
              whileTap={{ scale: 0.98 }}
              style={{ 
                padding: '14px 16px', 
                borderRadius: 12, 
                background: '#047857',
                position: 'relative',
                overflow: 'hidden',
                height: 105,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 1 }}>
                <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.9)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Payout Milestone
                </span>
                <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 100, background: 'rgba(255,255,255,0.2)', color: '#fff' }}>
                  Target: ${advancedAnalytics.nextMilestone}
                </span>
              </div>
              <div style={{ zIndex: 1, display: 'flex', flexDirection: 'column', gap: 4, width: '85%' }}>
                <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 24, fontWeight: 900, color: '#fff', margin: 0, lineHeight: 1.1 }}>
                  {advancedAnalytics.milestoneProgress}%
                </p>
                <div style={{ height: 4, background: 'rgba(255,255,255,0.25)', borderRadius: 2, overflow: 'hidden', width: '100%', marginTop: 2 }}>
                  <div style={{ height: '100%', background: '#fff', width: `${advancedAnalytics.milestoneProgress}%` }} />
                </div>
              </div>
              <div style={{ 
                position: 'absolute', bottom: -8, right: -10, width: 52, height: 52, transform: 'rotate(25deg)', borderRadius: 6, 
                background: 'rgba(255, 255, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 0 
              }}>
                <Award size={24} color="#fff" style={{ transform: 'rotate(-25deg)' }} />
              </div>
            </motion.div>
          </div>

          {/* Row 2: Peak Hours & Demographics/Devices */}
          <div style={GRID2}>
            {/* Feature 5: Peak Listening Hours */}
            <div style={CARD}>
              <h3 style={{ color: '#fff', fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Peak Listening Hours</h3>
              <p style={{ color: '#737373', fontSize: 12.5, margin: '0 0 18px 0' }}>Hourly stream density across the 24-hour cycle</p>
              <ResponsiveContainer width="100%" height={isMobile ? 180 : 240}>
                <LineChart data={advancedAnalytics.hourlyStreams}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="hour" stroke="#525252" fontSize={isMobile ? 9 : 11} tickLine={false} axisLine={false} interval={isMobile ? 2 : 0} />
                  <YAxis stroke="#525252" fontSize={isMobile ? 9 : 11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: 'var(--color-ss-elevated, #ffffff)', border: '1px solid var(--color-ss-border, rgba(43, 34, 26, 0.08))', borderRadius: 8, color: 'var(--color-ss-text-primary, #221a15)' }} />
                  <Line type="monotone" dataKey="Streams" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Feature 6 & Feature 7: Demographics Donut & Devices Bar */}
            <div style={{ ...CARD, display: 'flex', flexDirection: 'column', gap: 24, justifyContent: 'space-between', minHeight: isMobile ? 240 : 'auto' }}>
              <div>
                <h3 style={{ color: '#fff', fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Fan Profile & Devices</h3>
                <p style={{ color: '#737373', fontSize: 12.5, margin: '0 0 12px 0' }}>Gender split and device configuration metrics</p>
                
                {/* Donut Chart: Demographics (Gender) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 110 }}>
                  <div style={{ flex: 1.2, height: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={advancedAnalytics.genderData}
                          cx="50%"
                          cy="50%"
                          innerRadius={25}
                          outerRadius={45}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {advancedAnalytics.genderData.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: 'var(--color-ss-elevated, #ffffff)', border: '1px solid var(--color-ss-border, rgba(43, 34, 26, 0.08))', borderRadius: 8, color: 'var(--color-ss-text-primary, #221a15)' }} formatter={(v: any) => [`${v}%`]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ flex: 0.8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {advancedAnalytics.genderData.map((item: any, index: number) => (
                      <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                        <span style={{ color: '#fff', fontSize: 11, fontWeight: 600 }}>{item.name} ({item.value}%)</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Devices Percentage bar */}
              <div>
                <div style={{ height: 10, borderRadius: 5, overflow: 'hidden', display: 'flex', background: 'var(--color-ss-surface, #f4eede)' }}>
                  <div style={{ width: `${advancedAnalytics.mobilePct}%`, background: '#10b981' }} title={`Mobile: ${advancedAnalytics.mobilePct}%`} />
                  <div style={{ width: `${advancedAnalytics.desktopPct}%`, background: '#06b6d4' }} title={`Web Desktop: ${advancedAnalytics.desktopPct}%`} />
                  <div style={{ width: `${advancedAnalytics.tabletPct}%`, background: '#34d399' }} title={`Tablet/Smart Speaker: ${advancedAnalytics.tabletPct}%`} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginTop: 6, color: 'var(--color-ss-text-muted, #87786c)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 6, height: 6, background: '#10b981', borderRadius: '50%' }} /> Mobile ({advancedAnalytics.mobilePct}%)</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 6, height: 6, background: '#06b6d4', borderRadius: '50%' }} /> Desktop ({advancedAnalytics.desktopPct}%)</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 6, height: 6, background: '#34d399', borderRadius: '50%' }} /> Other ({advancedAnalytics.tabletPct}%)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Row 3: Live Listeners Table & Campaign ROI + Retention */}
          <div style={GRID2}>
            {/* Feature 8: Live Sessions Registry */}
            <div style={CARD}>
              <h3 style={{ color: '#fff', fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Live Listener Registry</h3>
              <p style={{ color: '#737373', fontSize: 12.5, margin: '0 0 16px 0' }}>Real-time playback instances mapped from database records</p>
              
              <div style={{ overflowX: 'auto', margin: '0 -14px', padding: '0 14px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: isMobile ? 11 : 12.5, textAlign: 'left', minWidth: isMobile ? 540 : '100%' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', color: '#737373' }}>
                      <th style={{ padding: isMobile ? '6px 4px' : '8px 6px', fontWeight: 500, whiteSpace: 'nowrap' }}>Listener</th>
                      <th style={{ padding: isMobile ? '6px 4px' : '8px 6px', fontWeight: 500, whiteSpace: 'nowrap' }}>Track</th>
                      <th style={{ padding: isMobile ? '6px 4px' : '8px 6px', fontWeight: 500, whiteSpace: 'nowrap' }}>Country</th>
                      <th style={{ padding: isMobile ? '6px 4px' : '8px 6px', fontWeight: 500, whiteSpace: 'nowrap' }}>Device</th>
                      <th style={{ padding: isMobile ? '6px 4px' : '8px 6px', fontWeight: 500, textAlign: 'right', whiteSpace: 'nowrap' }}>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {advancedAnalytics.liveSessions.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ padding: '20px 6px', color: '#737373', textAlign: 'center' }}>No streams recorded yet.</td>
                      </tr>
                    ) : (
                      advancedAnalytics.liveSessions.map(sess => (
                        <tr key={sess.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', color: '#fff' }}>
                          <td style={{ padding: isMobile ? '8px 4px' : '10px 6px', fontWeight: 600, whiteSpace: 'nowrap' }}>{sess.user}</td>
                          <td style={{ padding: isMobile ? '8px 4px' : '10px 6px', color: '#a3a3a3', whiteSpace: 'nowrap', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }}>{sess.track}</td>
                          <td style={{ padding: isMobile ? '8px 4px' : '10px 6px', whiteSpace: 'nowrap' }}>
                            <span style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>{sess.country}</span>
                          </td>
                          <td style={{ padding: isMobile ? '8px 4px' : '10px 6px', color: '#10b981', fontWeight: 600, whiteSpace: 'nowrap' }}>{sess.device}</td>
                          <td style={{ padding: isMobile ? '8px 4px' : '10px 6px', textAlign: 'right', color: '#737373', whiteSpace: 'nowrap' }}>{sess.timestamp}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Feature 9 & Feature 10: Campaign ROI & Retention Splits */}
            <div style={{ ...CARD, display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Feature 10: Retention Splits */}
              <div>
                <h4 style={{ color: '#fff', fontSize: 13, fontWeight: 700, margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fan Retention splits</h4>
                <div style={{ display: 'flex', gap: 10, fontSize: 12, marginBottom: 8 }}>
                  <span style={{ color: '#b08850', fontWeight: 700 }}>Returning: {advancedAnalytics.returningPct}%</span>
                  <span style={{ color: 'var(--color-ss-text-muted, #87786c)' }}>|</span>
                  <span style={{ color: '#10b981', fontWeight: 700 }}>New: {advancedAnalytics.newPct}%</span>
                </div>
                <div style={{ height: 6, background: 'var(--color-ss-surface, #f4eede)', borderRadius: 3, overflow: 'hidden', display: 'flex' }}>
                  <div style={{ width: `${advancedAnalytics.returningPct}%`, background: '#b08850' }} />
                  <div style={{ width: `${advancedAnalytics.newPct}%`, background: '#10b981' }} />
                </div>
              </div>

              {/* Feature 9: Campaign ROI Table */}
              <div>
                <h4 style={{ color: '#fff', fontSize: 13, fontWeight: 700, margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Campaign ROI Tracker</h4>
                <div style={{ overflowX: 'auto', margin: '0 -14px', padding: '0 14px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: isMobile ? 11 : 12, textAlign: 'left', minWidth: isMobile ? 520 : '100%' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', color: '#737373' }}>
                        <th style={{ padding: '6px 4px', fontWeight: 500, whiteSpace: 'nowrap' }}>Campaign</th>
                        <th style={{ padding: '6px 4px', fontWeight: 500, whiteSpace: 'nowrap' }}>Spent</th>
                        <th style={{ padding: '6px 4px', fontWeight: 500, whiteSpace: 'nowrap' }}>Clicks (CTR)</th>
                        <th style={{ padding: '6px 4px', fontWeight: 500, whiteSpace: 'nowrap' }}>Conv</th>
                        <th style={{ padding: '6px 4px', fontWeight: 500, textAlign: 'right', whiteSpace: 'nowrap' }}>CPC</th>
                      </tr>
                    </thead>
                    <tbody>
                      {advancedAnalytics.campaignROI.length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ padding: '12px 4px', color: '#737373', textAlign: 'center' }}>No active campaigns found.</td>
                        </tr>
                      ) : (
                        advancedAnalytics.campaignROI.map(c => (
                          <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', color: '#fff' }}>
                            <td style={{ padding: '8px 4px', fontWeight: 600, whiteSpace: 'nowrap', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</td>
                            <td style={{ padding: '8px 4px', whiteSpace: 'nowrap' }}>${c.spent}</td>
                            <td style={{ padding: '8px 4px', whiteSpace: 'nowrap' }}>{c.clicks} ({c.ctr})</td>
                            <td style={{ padding: '8px 4px', color: '#b08850', fontWeight: 700, whiteSpace: 'nowrap' }}>{c.conversions}</td>
                            <td style={{ padding: '8px 4px', textAlign: 'right', fontWeight: 700, whiteSpace: 'nowrap' }}>{c.cpc}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );

  // 4. Revenue Tab
  const renderRevenue = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="responsive-card" style={CARD}>
        <div className="responsive-header-row" style={{ marginBottom: 18 }}>
          <h3 style={{ color: '#fff', fontWeight: 700, fontSize: 16, margin: 0 }}>Payout History</h3>
          <span style={{ color: G, fontWeight: 800, fontSize: 15 }}>Accumulated Balance: ${revenue.toFixed(2)}</span>
        </div>
        <ResponsiveContainer width="100%" height={isMobile ? 180 : 200}>
          <BarChart data={currentRevenueData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
            <XAxis dataKey="month" stroke="#525252" fontSize={isMobile ? 9 : 11} tickLine={false} axisLine={false} />
            <YAxis stroke="#525252" fontSize={isMobile ? 9 : 11} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
            <Tooltip contentStyle={{ background: 'var(--color-ss-elevated, #ffffff)', border: '1px solid var(--color-ss-border, rgba(43, 34, 26, 0.08))', borderRadius: 8, color: 'var(--color-ss-text-primary, #221a15)' }} formatter={(v: any) => [`$${v}`, 'Revenue']} />
            <Bar dataKey="revenue" fill="#f59e0b" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="responsive-grid-2">
        <div className="responsive-card" style={CARD}>
          <h4 style={{ color: '#fff', fontWeight: 700, fontSize: 14, margin: '0 0 16px 0' }}>Disbursement Settings</h4>
          <p style={{ color: '#a3a3a3', fontSize: 12, lineHeight: 1.5, marginBottom: 16 }}>Configure how and when your royalties are transferred. Minimum payout threshold is $10.00 USD.</p>
          <div className="responsive-flex-row">
            <button className="responsive-button" style={BUTTON_PRIMARY} onClick={() => toast.success('PayPal Account Synced')}>Connect PayPal</button>
            <button className="responsive-button" style={BUTTON_SECONDARY} onClick={() => toast.success('Stripe Account Synced')}>Connect Stripe</button>
          </div>
        </div>
        <div className="responsive-card" style={CARD}>
          <h4 style={{ color: '#fff', fontWeight: 700, fontSize: 14, margin: '0 0 16px 0' }}>Royalties Rate Calculator</h4>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #282828', paddingBottom: 8, fontSize: 12 }}>
            <span style={{ color: '#737373' }}>Streaming Rate per Play</span>
            <span style={{ color: '#fff', fontWeight: 700 }}>$0.0040 USD</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #282828', paddingTop: 8, paddingBottom: 8, fontSize: 12 }}>
            <span style={{ color: '#737373' }}>Platform Commission Share</span>
            <span style={{ color: '#b08850', fontWeight: 700 }}>0% (PRO Artist Plan)</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, fontSize: 12 }}>
            <span style={{ color: '#737373' }}>Estimated Net Royalties</span>
            <span style={{ color: G, fontWeight: 700 }}>${(totalStreams * 0.0040).toFixed(2)} USD</span>
          </div>
        </div>
      </div>
    </div>
  );

  // 5. Audience Tab (Fully Implemented)
  const renderAudience = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Real-time Listeners Map & Ping Registry */}
      <div className="responsive-card" style={{ ...CARD, border: activeSessionsList.length > 0 ? '1px solid rgba(176, 136, 80, 0.2)' : '1px solid rgba(255, 255, 255, 0.05)' }}>
        <div className="responsive-header-row" style={{ marginBottom: 16 }}>
          <div>
            <h3 style={{ color: '#fff', fontWeight: 700, fontSize: 16, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%', backgroundColor: activeSessionsList.length > 0 ? '#b08850' : '#737373',
                boxShadow: activeSessionsList.length > 0 ? '0 0 10px #b08850' : 'none', display: 'inline-block',
                animation: activeSessionsList.length > 0 ? 'pulse 1.5s ease-in-out infinite' : 'none'
              }} />
              Real-time Listening Map & Telemetry Registry
            </h3>
            <p style={{ color: '#737373', fontSize: 12.5, margin: '4px 0 0 0' }}>Real-time listener pings originating from active playbacks</p>
          </div>
          <span style={{ fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 12, background: activeSessionsList.length > 0 ? 'rgba(176, 136, 80,0.1)' : 'rgba(255,255,255,0.05)', color: activeSessionsList.length > 0 ? '#b08850' : '#737373', textTransform: 'uppercase', textAlign: 'center' }}>
            {activeSessionsList.length} Active Now
          </span>
        </div>

        {activeSessionsList.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 16px', background: 'rgba(255,255,255,0.01)', borderRadius: 12, border: '1px dashed rgba(255,255,255,0.05)', textAlign: 'center' }}>
            <span style={{ fontSize: 24, marginBottom: 8 }}>📡</span>
            <span style={{ color: '#a3a3a3', fontSize: 13, fontWeight: 600 }}>Real-time telemetry desk online</span>
            <p style={{ color: '#525252', fontSize: 11.5, margin: '4px 0 0 0', maxWidth: 400 }}>Waiting for audience playbacks. Real-time city/country telemetry ping will register here when a fan starts streaming.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
            {activeSessionsList.map((session, index) => (
              <div key={session.sessionId} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(176, 136, 80,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                  🎧
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                    <span style={{ color: '#fff', fontWeight: 700, fontSize: 13, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      Listener #{index + 1}
                    </span>
                    <span style={{ fontSize: 10, color: '#b08850', background: 'rgba(176, 136, 80,0.1)', padding: '2px 6px', borderRadius: 4 }}>
                      {session.city}, {session.country}
                    </span>
                  </div>
                  <p style={{ color: '#a3a3a3', fontSize: 12, margin: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    Streaming: <span style={{ color: '#fff', fontWeight: 600 }}>{session.trackTitle}</span>
                  </p>
                  <span style={{ fontSize: 10, color: '#525252', marginTop: 2, display: 'block' }}>
                    Signal: Active (polled 4s ago)
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Feature 10: Audience Health & Retention Metrics Grid */}
      <div className="stats-grid">
        <StatCard icon={Users} label="Total Unique Fans" value={new Set(payoutStreams.map(s => s.userId)).size.toLocaleString()} change="100% Real" positive color="#b08850" cardBg="#006450" />
        <StatCard icon={Clock} label="Fan Retention Rate" value={`${advancedAnalytics.returningPct}%`} change="Loyalty" positive color="#10b981" cardBg="#15803d" />
        <StatCard icon={Heart} label="Audience Sentiment" value={`${advancedAnalytics.positivePct}% Pos`} change="Comments" positive color="#34d399" cardBg="#047857" />
        <StatCard icon={TrendingUp} label="Active MAL (30d)" value={advancedAnalytics.mal.toLocaleString()} change="Active Index" positive color="#06b6d4" cardBg="#14532d" />
      </div>

      {/* Row 2: Devices Used (Dynamic) & Age Demographics (Dynamic) */}
      <div className="responsive-grid-2">
        {/* Feature 1: Dynamic Devices Used */}
        <div className="responsive-card" style={CARD}>
          <h3 style={{ color: '#fff', fontWeight: 700, fontSize: 16, marginBottom: 18 }}>Devices Used</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 10 }}>
            {advancedAnalytics.deviceData.map(d => (
              <div key={d.device}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: 'var(--color-ss-text-muted, #87786c)' }}>{d.device}</span>
                  <span style={{ color: 'var(--color-ss-text-primary, #221a15)', fontWeight: 600 }}>{d.pct}%</span>
                </div>
                <div style={{ height: 6, background: 'var(--color-ss-surface, #f4eede)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: d.col, width: `${d.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Feature 2: Dynamic Age Demographics */}
        <div className="responsive-card" style={CARD}>
          <h3 style={{ color: 'var(--color-ss-text-primary, #221a15)', fontWeight: 700, fontSize: 16, marginBottom: 18 }}>Listener Age Demographics</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 10 }}>
            {advancedAnalytics.ageData.map(a => (
              <div key={a.age}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: 'var(--color-ss-text-muted, #87786c)' }}>{a.age}</span>
                  <span style={{ color: 'var(--color-ss-text-primary, #221a15)', fontWeight: 600 }}>{a.pct}%</span>
                </div>
                <div style={{ height: 6, background: 'var(--color-ss-surface, #f4eede)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: a.col, width: `${a.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Cumulative Fan Base Growth Chart & Subscription Splits Donut */}
      <div className="responsive-grid-2">
        {/* Feature 3: Cumulative Listener Growth Area Chart */}
        <div className="responsive-card" style={CARD}>
          <h3 style={{ color: '#fff', fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Fan Base Acquisition Timeline</h3>
          <p style={{ color: '#737373', fontSize: 12.5, margin: '0 0 18px 0' }}>Real-time cumulative unique fan growth</p>
          <ResponsiveContainer width="100%" height={isMobile ? 180 : 200}>
            <AreaChart data={advancedAnalytics.listenerGrowthTrend}>
              <defs>
                <linearGradient id="an_lgt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#b08850" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#b08850" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <XAxis dataKey="date" stroke="#525252" fontSize={isMobile ? 9 : 11} tickLine={false} axisLine={false} interval={isMobile ? 1 : 0} />
              <YAxis stroke="#525252" fontSize={isMobile ? 9 : 11} allowDecimals={false} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: 'var(--color-ss-elevated, #ffffff)', border: '1px solid var(--color-ss-border, rgba(43, 34, 26, 0.08))', borderRadius: 8, color: 'var(--color-ss-text-primary, #221a15)' }} />
              <Area type="monotone" dataKey="Fans" stroke="#b08850" strokeWidth={2.5} fill="url(#an_lgt)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Feature 7: Subscription Split Donut */}
        <div className="responsive-card" style={CARD}>
          <h3 style={{ color: '#fff', fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Listener Subscription Tier Share</h3>
          <p style={{ color: '#737373', fontSize: 12.5, margin: '0 0 18px 0' }}>Premium subscribers vs Standard free tier users</p>
          <div className="donut-container">
            <div style={{ flex: isMobile ? 'none' : 1.2, height: isMobile ? 140 : '100%', width: isMobile ? '100%' : 'auto' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={advancedAnalytics.subscriptionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {advancedAnalytics.subscriptionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--color-ss-elevated, #ffffff)', border: '1px solid var(--color-ss-border, rgba(43, 34, 26, 0.08))', borderRadius: 8, color: 'var(--color-ss-text-primary, #221a15)' }} formatter={(v: any) => [`${v}% share`]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="donut-legend">
              {advancedAnalytics.subscriptionData.map((item, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: '#fff', fontSize: 12, fontWeight: 700, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{item.name}</div>
                    <div style={{ color: '#737373', fontSize: 11, marginTop: 2 }}>{item.value}% share</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 4: Listening Days Bar Chart & Fan Discovery Channels */}
      <div className="responsive-grid-2">
        {/* Feature 5: Top Listening Days Bar Chart */}
        <div className="responsive-card" style={CARD}>
          <h3 style={{ color: '#fff', fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Streams by Day of Week</h3>
          <p style={{ color: '#737373', fontSize: 12.5, margin: '0 0 18px 0' }}>Weekly listening patterns and density</p>
          <ResponsiveContainer width="100%" height={isMobile ? 160 : 180}>
            <BarChart data={advancedAnalytics.dailyDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <XAxis dataKey="day" stroke="#525252" fontSize={isMobile ? 9 : 11} tickLine={false} axisLine={false} />
              <YAxis stroke="#525252" fontSize={isMobile ? 9 : 11} allowDecimals={false} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: 'var(--color-ss-elevated, #ffffff)', border: '1px solid var(--color-ss-border, rgba(43, 34, 26, 0.08))', borderRadius: 8, color: 'var(--color-ss-text-primary, #221a15)' }} />
              <Bar dataKey="Streams" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Feature 8: Discovery Channels Progress Tracks */}
        <div className="responsive-card" style={CARD}>
          <h3 style={{ color: '#fff', fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Audience Acquisition Channels</h3>
          <p style={{ color: '#737373', fontSize: 12.5, margin: '0 0 18px 0' }}>How listeners discover and access your tracks</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 10 }}>
            {advancedAnalytics.discoveryChannels.map(c => (
              <div key={c.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: 'var(--color-ss-text-muted, #87786c)' }}>{c.name}</span>
                  <span style={{ color: 'var(--color-ss-text-primary, #221a15)', fontWeight: 600 }}>{c.pct}%</span>
                </div>
                <div style={{ height: 6, background: 'var(--color-ss-surface, #f4eede)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: c.color, width: `${c.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 5: Stream Source Geography Table & Loyal Fans Table */}
      <div className="responsive-grid-2">
        {/* Feature 4: Geography Distribution Table */}
        <div className="responsive-card" style={CARD}>
          <h3 style={{ color: '#fff', fontWeight: 700, fontSize: 16, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Globe size={18} color="#10b981" /> Geographic Fan Hotspots
          </h3>
          <p style={{ color: '#737373', fontSize: 12.5, margin: '0 0 16px 0' }}>Cities and countries with highest stream contribution</p>
          
          <div style={{ overflowX: 'auto', margin: '0 -14px', padding: '0 14px' }}>
            <table className="responsive-table">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', color: '#737373' }}>
                  <th style={{ padding: '8px 6px', fontWeight: 500 }}>Rank & Region</th>
                  <th style={{ padding: '8px 6px', fontWeight: 500 }}>Streams</th>
                  <th style={{ padding: '8px 6px', fontWeight: 500 }}>Unique Fans</th>
                  <th style={{ padding: '8px 6px', fontWeight: 500, textAlign: 'right' }}>Share %</th>
                </tr>
              </thead>
              <tbody>
                {geoHotspots.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '20px 4px', color: '#737373', textAlign: 'center' }}>No streams recorded yet.</td>
                  </tr>
                ) : (
                  (() => {
                    const totalStreams = geoHotspots.reduce((sum, h) => sum + (h.streams || 0), 0) || 1;
                    
                    const getDistanceString = (city: string) => {
                      const c = city.toLowerCase();
                      if (c.includes('chennai')) return '📍 In Studio';
                      if (c.includes('bengaluru') || c.includes('bangalore')) return '⚡ 350 km';
                      if (c.includes('mumbai')) return '⚡ 1,030 km';
                      if (c.includes('delhi')) return '⚡ 1,760 km';
                      if (c.includes('kolkata')) return '⚡ 1,360 km';
                      if (c.includes('london')) return '✈️ 8,200 km';
                      if (c.includes('new york')) return '✈️ 13,500 km';
                      if (c.includes('são paulo') || c.includes('sao paulo')) return '✈️ 13,800 km';
                      return '✈️ Global';
                    };

                    return geoHotspots.slice(0, 5).map((h, idx) => {
                      const sharePct = Math.round(((h.streams || 0) / totalStreams) * 100);
                      return (
                        <tr key={h.city} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', color: '#fff' }}>
                          <td style={{ padding: '10px 4px', fontWeight: 600 }}>
                            <div>{idx + 1}. {h.city}, {h.country}</div>
                            <span style={{ fontSize: 10, color: '#a3a3a3', background: 'rgba(255,255,255,0.04)', padding: '2px 6px', borderRadius: 4, marginTop: 4, display: 'inline-block', fontWeight: 500 }}>
                              {getDistanceString(h.city)}
                            </span>
                          </td>
                          <td style={{ padding: '10px 4px' }}>{h.streams}</td>
                          <td style={{ padding: '10px 4px', color: h.color, fontWeight: 700 }}>{h.listeners} listeners</td>
                          <td style={{ padding: '10px 4px', textAlign: 'right', fontWeight: 700 }}>{sharePct}%</td>
                        </tr>
                      );
                    });
                  })()
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Feature 6: Loyal Fans Top 5 Table */}
        <div className="responsive-card" style={CARD}>
          <h3 style={{ color: '#fff', fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Top Listener Registry</h3>
          <p style={{ color: '#737373', fontSize: 12.5, margin: '0 0 16px 0' }}>Most active fans in your streaming database</p>
          
          <div style={{ overflowX: 'auto', margin: '0 -14px', padding: '0 14px' }}>
            <table className="responsive-table">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', color: '#737373' }}>
                  <th style={{ padding: '8px 4px', fontWeight: 500 }}>Fan Name</th>
                  <th style={{ padding: '8px 4px', fontWeight: 500 }}>Streams</th>
                  <th style={{ padding: '8px 4px', fontWeight: 500 }}>Last Streamed Song</th>
                  <th style={{ padding: '8px 4px', fontWeight: 500, textAlign: 'right' }}>Tier</th>
                </tr>
              </thead>
              <tbody>
                {advancedAnalytics.loyalFans.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '20px 4px', color: '#737373', textAlign: 'center' }}>No streams recorded yet.</td>
                  </tr>
                ) : (
                  advancedAnalytics.loyalFans.map(fan => (
                    <tr key={fan.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', color: '#fff' }}>
                      <td style={{ padding: '10px 4px', fontWeight: 600 }}>{fan.name}</td>
                      <td style={{ padding: '10px 4px', color: '#b08850', fontWeight: 700 }}>{fan.count} plays</td>
                      <td style={{ padding: '10px 4px', color: '#a3a3a3', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }}>{fan.lastTrack}</td>
                      <td style={{ padding: '10px 4px', textAlign: 'right', color: '#10b981', fontWeight: 700 }}>{fan.tier}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Feature 9: Fan Sentiment Meter & Feedback Logs */}
      <div className="responsive-card" style={CARD}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <h3 style={{ color: '#fff', fontWeight: 700, fontSize: 16, margin: 0 }}>Fan Engagement Sentiment</h3>
            <p style={{ color: '#737373', fontSize: 12.5, margin: '4px 0 0 0' }}>Algorithmic analysis of comment history</p>
          </div>
          <span style={{ fontSize: 18, fontWeight: 900, color: '#34d399', fontFamily: 'Outfit, sans-serif' }}>{advancedAnalytics.positivePct}% Positive</span>
        </div>
        <div style={{ height: 10, background: 'var(--color-ss-surface, #f4eede)', borderRadius: 5, overflow: 'hidden', display: 'flex' }}>
          <div style={{ width: `${advancedAnalytics.positivePct}%`, background: '#34d399' }} />
          <div style={{ width: `${advancedAnalytics.neutralPct}%`, background: 'var(--color-ss-border, rgba(43, 34, 26, 0.08))' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--color-ss-text-muted, #87786c)', marginTop: 8 }}>
          <span>Positive Sentiment ({advancedAnalytics.positivePct}%)</span>
          <span>Neutral / Other ({advancedAnalytics.neutralPct}%)</span>
        </div>
      </div>
    </div>
  );

  // 6. Campaigns Tab
  const renderCampaigns = () => {
    const handleLaunchCampaign = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newCampaign.name || !newCampaign.trackId) {
        return toast.error('Campaign Name and Track selection are required');
      }
      const track = myTracks.find(t => t.id === newCampaign.trackId);
      try {
        const res = await fetch('/api/artist/dashboard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'add_campaign',
            payload: {
              name: newCampaign.name,
              track: track?.title || 'Unknown Track',
              budget: Number(newCampaign.budget)
            }
          })
        });
        const data = await res.json();
        if (data.success) {
          setCampaigns(c => [data.item, ...c]);
          setNewCampaign({ name: '', trackId: '', budget: '25' });
          toast.success(`Promoted showcase campaign "${newCampaign.name}" launched successfully! 🚀`);
        } else {
          toast.error(data.error || 'Failed to launch campaign');
        }
      } catch (err) {
        toast.error('Failed to launch campaign');
      }
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div className="responsive-grid-2">
          {/* Active Campaigns List */}
          <div className="responsive-card grid-span-2" style={CARD}>
            <h3 style={{ color: '#fff', fontWeight: 700, fontSize: 16, marginBottom: 18 }}>Active Track Showcases</h3>
            <div style={{ overflowX: 'auto', margin: '0 -14px', padding: '0 14px' }}>
              <table className="responsive-table">
                <thead>
                  <tr style={{ color: '#525252', textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.05em' }}>
                    <th style={{ padding: '8px 4px', textAlign: 'left' }}>Campaign</th>
                    <th style={{ padding: '8px 4px', textAlign: 'left' }}>Track</th>
                    <th style={{ padding: '8px 4px', textAlign: 'right' }}>Budget</th>
                    <th style={{ padding: '8px 4px', textAlign: 'right' }}>Impressions</th>
                    <th style={{ padding: '8px 4px', textAlign: 'right' }}>CTR</th>
                    <th style={{ padding: '8px 4px', textAlign: 'right' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map(c => (
                    <tr key={c.id} style={{ borderTop: '1px solid #282828' }}>
                      <td style={{ padding: '12px 4px', color: '#fff', fontWeight: 600 }}>{c.name}</td>
                      <td style={{ padding: '12px 4px', color: '#a3a3a3', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.track}</td>
                      <td style={{ padding: '12px 4px', textAlign: 'right', color: G, fontWeight: 600 }}>${c.spent} / ${c.budget}</td>
                      <td style={{ padding: '12px 4px', textAlign: 'right', color: '#fff' }}>{c.impressions.toLocaleString()}</td>
                      <td style={{ padding: '12px 4px', textAlign: 'right', color: '#60a5fa' }}>{c.ctr}</td>
                      <td style={{ padding: '12px 4px', textAlign: 'right' }}>
                        <span style={{
                          padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700,
                          background: c.status === 'Active' ? 'rgba(176, 136, 80,0.12)' : 'rgba(255,255,255,0.08)',
                          color: c.status === 'Active' ? G : '#737373'
                        }}>{c.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Launch New Showcase Form */}
        <div className="responsive-card" style={CARD}>
          <h3 style={{ color: '#fff', fontWeight: 700, fontSize: 16, marginBottom: 18 }}>Promote a New Track</h3>
          <form onSubmit={handleLaunchCampaign} className="responsive-grid-3" style={{ alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#737373', textTransform: 'uppercase', marginBottom: 6 }}>Campaign Name</label>
              <input type="text" value={newCampaign.name} onChange={e => setNewCampaign({ ...newCampaign, name: e.target.value })} placeholder="e.g. Summer Single Push" style={INPUT} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#737373', textTransform: 'uppercase', marginBottom: 6 }}>Select Track</label>
              <select value={newCampaign.trackId} onChange={e => setNewCampaign({ ...newCampaign, trackId: e.target.value })} style={INPUT}>
                <option value="" disabled>Select track to boost</option>
                {myTracks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'end', width: '100%' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#737373', textTransform: 'uppercase', marginBottom: 6 }}>Daily Budget ($)</label>
                <select value={newCampaign.budget} onChange={e => setNewCampaign({ ...newCampaign, budget: e.target.value })} style={INPUT}>
                  <option value="10">$10 / day</option>
                  <option value="25">$25 / day</option>
                  <option value="50">$50 / day</option>
                  <option value="100">$100 / day</option>
                </select>
              </div>
              <button type="submit" className="responsive-button" style={{ ...BUTTON_PRIMARY, padding: '13px 20px', flexShrink: 0, height: 42 }}>🚀 Launch</button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // 7. Profile Tab — World-Class Artist Identity & Brand Management Platform
  const renderProfile = () => {
    const L: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, color: '#737373', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 };
    const S: React.CSSProperties = { background: 'var(--color-ss-elevated, #ffffff)', border: '1.5px solid var(--color-ss-border, rgba(43, 34, 26, 0.08))', borderRadius: 16, padding: 24, boxShadow: '0 4px 12px rgba(43, 34, 26, 0.04)' };

    const genres = ['Pop','Hip-Hop','Electronic','R&B','Rock','Indie','Jazz','Classical','Country','Latin','Afrobeats','K-Pop','Tamil','Bollywood','Folk','Soul','Reggae','Dance'];
    const countries = [{ code: 'IN', name: 'India' },{ code: 'US', name: 'USA' },{ code: 'GB', name: 'UK' },{ code: 'BR', name: 'Brazil' },{ code: 'NG', name: 'Nigeria' },{ code: 'KR', name: 'South Korea' },{ code: 'JP', name: 'Japan' },{ code: 'DE', name: 'Germany' },{ code: 'AU', name: 'Australia' },{ code: 'CA', name: 'Canada' }];

    const socialList = [
      { id: 'instagram', label: 'Instagram', emoji: '📸', placeholder: '@yourhandle' },
      { id: 'twitter', label: 'X / Twitter', emoji: '🐦', placeholder: '@handle' },
      { id: 'youtube', label: 'YouTube', emoji: '▶️', placeholder: 'youtube.com/c/...' },
      { id: 'tiktok', label: 'TikTok', emoji: '🎵', placeholder: '@yourhandle' },
      { id: 'website', label: 'Website', emoji: '🌐', placeholder: 'https://yoursite.com' },
    ];

    const handleSave = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        await fetch('/api/artist/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'save_identity',
            payload: profileIdentity,
          }),
        });
        await fetch('/api/artist/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'save_bio',
            payload: { bio: profileBio },
          }),
        });
        await fetch('/api/artist/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'save_social',
            payload: { socialLinks: profileSocial },
          }),
        });
        setArtistBio(profileBio);
        setSocialLinks({ instagram: profileSocial.instagram || '', twitter: profileSocial.twitter || '', website: profileSocial.website || '' });
        toast.success('✅ Profile saved!');
        fetchArtistProfile();
      } catch { toast.error('Save failed'); }
    };

    const isVerified = verificationLevel !== 'none';

    return (
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── Banner + Avatar Hero ── */}
        <div style={{ borderRadius: 18, overflow: 'hidden', border: '1.5px solid var(--color-ss-border, rgba(43, 34, 26, 0.08))', background: 'var(--color-ss-elevated, #ffffff)' }}>
          {/* Banner */}
          <div style={{
            height: isMobile ? 110 : 130,
            background: artistProfile?.bannerImage
              ? `url(${artistProfile.bannerImage}) center/cover`
              : `linear-gradient(135deg, ${profileIdentity.brandColor}30 0%, var(--color-ss-surface, #f4eede) 100%)`,
            position: 'relative',
          }}>
            {/* Hidden file input for banner */}
            <input
              type='file'
              id='banner-upload-input'
              accept='image/*'
              style={{ display: 'none' }}
              onChange={e => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = ev => {
                  const url = ev.target?.result as string;
                  fetch('/api/artist/profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update_banner', payload: { url } }) })
                    .then(() => { fetchArtistProfile(); toast.success('✅ Banner updated!'); });
                };
                reader.readAsDataURL(file);
                e.target.value = '';
              }}
            />
            <label htmlFor='banner-upload-input' style={{ position: 'absolute', top: 10, right: 12, background: 'rgba(0,0,0,0.65)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, color: '#fff', padding: '6px 14px', fontSize: 11, fontWeight: 600, backdropFilter: 'blur(6px)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              📷 Upload Banner
            </label>

            {/* Avatar overlapping banner */}
            <input
              type='file'
              id='avatar-upload-input'
              accept='image/*'
              style={{ display: 'none' }}
              onChange={e => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = ev => {
                  const url = ev.target?.result as string;
                  fetch('/api/artist/profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update_avatar', payload: { url } }) })
                    .then(() => { fetchArtistProfile(); toast.success('✅ Photo updated!'); });
                };
                reader.readAsDataURL(file);
                e.target.value = '';
              }}
            />
            <label htmlFor='avatar-upload-input' style={{
              position: 'absolute', bottom: isMobile ? -28 : -36, left: isMobile ? 16 : 24,
              width: isMobile ? 64 : 72, height: isMobile ? 64 : 72, borderRadius: '50%',
              border: `3px solid ${profileIdentity.brandColor}`,
              backgroundImage: artistProfile?.avatar ? `url(${artistProfile.avatar})` : 'none',
              backgroundColor: artistProfile?.avatar ? 'transparent' : 'var(--color-ss-surface, #f4eede)',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: 'cover',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', boxShadow: '0 4px 12px rgba(43, 34, 26, 0.08)',
            }}>
              {!artistProfile?.avatar && <User size={isMobile ? 22 : 26} color='var(--color-ss-text-muted, #87786c)' />}
              <div style={{ position: 'absolute', bottom: 1, right: 1, width: 20, height: 20, borderRadius: '50%', background: G, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9 }}>📷</div>
            </label>
          </div>

          {/* Name + meta row */}
          <div className="profile-hero-row">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: 'var(--color-ss-text-primary, #221a15)', fontFamily: 'Outfit,sans-serif', fontWeight: 900, fontSize: 20 }}>
                  {profileIdentity.stageName || artistName}
                </span>
                {isVerified && (
                  <span style={{ fontSize: 11, fontWeight: 800, color: G, background: 'rgba(176, 136, 80,0.15)', padding: '2px 10px', borderRadius: 20 }}>✅ Verified</span>
                )}
                {!isVerified && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-ss-text-muted, #87786c)', background: 'var(--color-ss-surface, #f4eede)', padding: '2px 10px', borderRadius: 20 }}>Unverified</span>
                )}
              </div>
              <div className="profile-meta-row">
                <span>🎵 {profileIdentity.primaryGenre}</span>
                <span>📍 {countries.find(c => c.code === profileIdentity.country)?.name || profileIdentity.country}</span>
                <span>👥 {profileStats.followers || 0} followers</span>
                <span>▶️ {profileStats.totalStreams || 0} streams</span>
              </div>
            </div>
            <button type='submit' className="responsive-button" style={{ ...BUTTON_PRIMARY, padding: '10px 24px', fontSize: 13, marginTop: isMobile ? 8 : 0 }}>💾 Save Profile</button>
          </div>
        </div>

        {/* ── Two Column Layout ── */}
        <div className="responsive-grid-2">

          {/* LEFT — Basic Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Basic Info */}
            <div style={S}>
              <h3 style={{ color: '#fff', fontWeight: 800, fontSize: 14, margin: '0 0 16px' }}>🎤 Artist Info</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                <div>
                  <label style={L}>Stage Name</label>
                  <input style={INPUT} value={profileIdentity.stageName} onChange={e => setProfileIdentity(p => ({ ...p, stageName: e.target.value }))} placeholder='Your artist name' />
                </div>
                <div>
                  <label style={L}>Genre</label>
                  <select style={INPUT} value={profileIdentity.primaryGenre} onChange={e => setProfileIdentity(p => ({ ...p, primaryGenre: e.target.value }))}>
                    {genres.map(g => <option key={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label style={L}>Country</label>
                  <select style={INPUT} value={profileIdentity.country} onChange={e => setProfileIdentity(p => ({ ...p, country: e.target.value }))}>
                    {countries.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={L}>City</label>
                  <input style={INPUT} value={profileIdentity.city} onChange={e => setProfileIdentity(p => ({ ...p, city: e.target.value }))} placeholder='Your city' />
                </div>
                <div>
                  <label style={L}>Brand Color</label>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input type='color' value={profileIdentity.brandColor} onChange={e => setProfileIdentity(p => ({ ...p, brandColor: e.target.value }))} style={{ width: 40, height: 40, borderRadius: 8, border: 'none', background: 'none', cursor: 'pointer', padding: 2 }} />
                    <input style={{ ...INPUT, flex: 1 }} value={profileIdentity.brandColor} onChange={e => setProfileIdentity(p => ({ ...p, brandColor: e.target.value }))} />
                  </div>
                </div>
              </div>
            </div>

            {/* Bio */}
            <div style={S}>
              <h3 style={{ color: '#fff', fontWeight: 800, fontSize: 14, margin: '0 0 14px' }}>✍️ Artist Bio</h3>
              <textarea
                value={profileBio}
                onChange={e => setProfileBio(e.target.value)}
                rows={5}
                style={{ ...INPUT, resize: 'vertical', lineHeight: 1.7 }}
                placeholder='Tell your fans who you are, what you create, and what drives you...'
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                <span style={{ fontSize: 11, color: '#525252' }}>{profileBio.length} chars</span>
                <span style={{ fontSize: 11, color: profileBio.length > 40 ? G : '#737373', fontWeight: 700 }}>
                  {profileBio.length > 40 ? '✅ Looks good' : 'Write more...'}
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT — Social + Stats + Verification */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Quick Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { label: 'Followers', val: profileStats.followers || 0, icon: '👥', color: G },
                { label: 'Streams', val: profileStats.totalStreams || 0, icon: '▶️', color: '#06b6d4' },
                { label: 'Tracks', val: profileStats.trackCount || 0, icon: '🎵', color: '#10b981' },
                { label: 'Profile Views', val: profileStats.profileViews || 0, icon: '👁️', color: '#f59e0b' },
              ].map(stat => (
                <div key={stat.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20 }}>{stat.icon}</span>
                  <div>
                    <div style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 900, fontSize: 18, color: stat.color }}>{stat.val.toLocaleString()}</div>
                    <div style={{ fontSize: 11, color: '#525252' }}>{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Social Links */}
            <div style={S}>
              <h3 style={{ color: '#fff', fontWeight: 800, fontSize: 14, margin: '0 0 14px' }}>🔗 Social Links</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {socialList.map(p => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 18, width: 24, textAlign: 'center', flexShrink: 0 }}>{p.emoji}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <input
                        style={{ ...INPUT, padding: '9px 12px' }}
                        value={profileSocial[p.id] || ''}
                        onChange={e => setProfileSocial(prev => ({ ...prev, [p.id]: e.target.value }))}
                        placeholder={p.placeholder}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Verification */}
            <div style={{ ...S, border: isVerified ? '1px solid rgba(176, 136, 80,0.25)' : '1px solid rgba(255,255,255,0.08)' }}>
              <h3 style={{ color: '#fff', fontWeight: 800, fontSize: 14, margin: '0 0 14px' }}>✅ Verification</h3>

              {/* Current status */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: isVerified ? 'rgba(176, 136, 80,0.12)' : artistProfile?.verificationSubmission?.status === 'under_review' ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                  {isVerified ? '✅' : artistProfile?.verificationSubmission?.status === 'under_review' ? '⏳' : '⬜'}
                </div>
                <div>
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>
                    {isVerified ? 'Verified Artist' : artistProfile?.verificationSubmission?.status === 'under_review' ? 'Under Review' : artistProfile?.verificationSubmission?.status === 'rejected' ? 'Request Rejected' : 'Not Verified'}
                  </div>
                  <div style={{ color: '#737373', fontSize: 12, marginTop: 2 }}>
                    {isVerified ? 'Your profile is officially verified.' : artistProfile?.verificationSubmission?.status === 'under_review' ? 'Admin is reviewing your request.' : artistProfile?.verificationSubmission?.status === 'rejected' ? 'Your request was rejected. Try again.' : 'Upload proof documents to get verified.'}
                  </div>
                </div>
              </div>

              {/* Verification request form */}
              {!isVerified && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#737373', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Proof Document</div>
                  <div style={{ border: '1px dashed rgba(255,255,255,0.15)', borderRadius: 10, padding: 14, background: 'rgba(255,255,255,0.02)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <input
                      type='file'
                      id='verify-doc-input'
                      accept='image/*,.pdf'
                      style={{ display: 'none' }}
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = ev => {
                          const dataUrl = ev.target?.result as string;
                          // Store locally to show preview
                          (window as any).__verifyDocUrl = dataUrl;
                          (window as any).__verifyDocName = file.name;
                          // Update UI
                          const preview = document.getElementById('verify-doc-preview');
                          if (preview) { preview.textContent = `📄 ${file.name}`; (preview as HTMLElement).style.color = '#b08850'; }
                          const btn = document.getElementById('verify-submit-btn');
                          if (btn) (btn as HTMLButtonElement).disabled = false;
                        };
                        reader.readAsDataURL(file);
                        e.target.value = '';
                      }}
                    />
                    <label htmlFor='verify-doc-input' style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, width: '100%' }}>
                      <span style={{ fontSize: 24 }}>📎</span>
                      <span style={{ fontSize: 12, color: '#a3a3a3' }}>Click to upload ID / Proof</span>
                      <span style={{ fontSize: 10, color: '#525252' }}>PNG, JPG, PDF accepted</span>
                    </label>
                    <div id='verify-doc-preview' style={{ fontSize: 12, color: '#525252', marginTop: 2 }}>No file selected</div>
                  </div>
                  <button
                    id='verify-submit-btn'
                    type='button'
                    onClick={async () => {
                      const docUrl = (window as any).__verifyDocUrl || '';
                      const docName = (window as any).__verifyDocName || '';
                      if (!docUrl) return toast.error('Please upload a proof document first');
                      const res = await fetch('/api/artist/profile', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          action: 'submit_verification',
                          payload: { level: 'verified_artist', documents: [docUrl], notes: docName }
                        })
                      });
                      const d = await res.json();
                      if (d.success) {
                        toast.success('🔍 Verification submitted! Admin will review soon.');
                        delete (window as any).__verifyDocUrl;
                        delete (window as any).__verifyDocName;
                        fetchArtistProfile();
                      } else {
                        toast.error(d.error || 'Submit failed');
                      }
                    }}
                    style={{ ...BUTTON_PRIMARY, width: '100%', justifyContent: 'center', opacity: 1 }}
                  >
                    {artistProfile?.verificationSubmission?.status === 'under_review' ? '🔄 Resubmit Verification' : '🔍 Request Verification'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

      </form>
    );
  };

  // 8. Live Events Tab
  const renderLiveEvents = () => {
    const handleAddEvent = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newEvent.name || !newEvent.date || !newEvent.location) {
        return toast.error('Event Name, Date, and Location are required');
      }
      try {
        const res = await fetch('/api/artist/dashboard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'add_event',
            payload: {
              name: newEvent.name,
              date: newEvent.date,
              time: newEvent.time || '8:00 PM',
              location: newEvent.location,
              price: newEvent.price || 'Free'
            }
          })
        });
        const data = await res.json();
        if (data.success) {
          setEvents(evs => [...evs, data.item]);
          setNewEvent({ name: '', date: '', time: '', location: '', price: '' });
          toast.success(`Live Tour/Concert event "${newEvent.name}" scheduled! 📅`);
        } else {
          toast.error(data.error || 'Failed to schedule event');
        }
      } catch (err) {
        toast.error('Failed to schedule event');
      }
    };
    const handleDeleteEvent = async (eventId: string, eventName: string) => {
      if (!confirm(`Are you sure you want to cancel and delete the event "${eventName}"?`)) return;

      try {
        const res = await fetch('/api/artist/dashboard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'delete_event',
            payload: { eventId }
          })
        });
        const data = await res.json();
        if (data.success) {
          setEvents(evs => evs.filter(e => e.id !== eventId));
          toast.success(`Successfully cancelled live event "${eventName}" 🗑️`);
        } else {
          toast.error(data.error || 'Failed to delete event');
        }
      } catch (err) {
        toast.error('Failed to delete event');
      }
    };

    const handleDetectLocation = () => {
      if (!navigator.geolocation) {
        return toast.error('Geolocation is not supported by your browser');
      }
      toast.loading('Detecting location...', { id: 'geo' });
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
            .then(res => res.json())
            .then(data => {
              toast.dismiss('geo');
              const city = data.address?.city || data.address?.town || data.address?.suburb || 'Chennai';
              const country = data.address?.country || 'India';
              setNewEvent(prev => ({ ...prev, location: `${city}, ${country}` }));
              toast.success(`Location set to ${city}, ${country}! 🎯`);
            })
            .catch(() => {
              toast.dismiss('geo');
              setNewEvent(prev => ({ ...prev, location: `Chennai, India (GPS: ${latitude.toFixed(4)}, ${longitude.toFixed(4)})` }));
              toast.success('Location set via coordinates! 🎯');
            });
        },
        (err) => {
          toast.dismiss('geo');
          setNewEvent(prev => ({ ...prev, location: 'Chennai, Tamil Nadu (Current Location)' }));
          toast.success('Location set to fallback current location! 🎯');
        }
      );
    };

    const handleMapSearch = async () => {
      if (!mapSearch.trim()) return;
      toast.loading('Searching map...', { id: 'mapsearch' });
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(mapSearch)}&limit=1`);
        const data = await res.json();
        toast.dismiss('mapsearch');
        if (data && data.length > 0) {
          const item = data[0];
          setMapLocation({
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon),
            name: item.display_name
          });
          toast.success('Location found on map! 📍');
        } else {
          toast.error('Location not found');
        }
      } catch (err) {
        toast.dismiss('mapsearch');
        toast.error('Search failed');
      }
    };

    const handleConfirmLocation = () => {
      const parts = mapLocation.name.split(',');
      const simpleName = parts.slice(0, 3).join(',').trim();
      setNewEvent(prev => ({ ...prev, location: simpleName }));
      setShowMapModal(false);
      toast.success('Location set! 📍');
    };

    const getEventBookings = (eventName: string) => {
      return (ticketSales?.recentSales || []).filter(
        (sale: any) => sale.event?.toLowerCase() === eventName.toLowerCase()
      );
    };

    const getEventTicketsSold = (eventName: string) => {
      return getEventBookings(eventName).reduce((sum: number, sale: any) => sum + (sale.tickets || 0), 0);
    };

    const getEventRevenue = (eventName: string) => {
      return getEventBookings(eventName).reduce((sum: number, sale: any) => sum + (sale.amount || 0), 0);
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div className="responsive-grid-2">
          {/* Scheduled Tour Dates */}
          <div className="responsive-card" style={CARD}>
            <h3 style={{ color: '#fff', fontWeight: 700, fontSize: 16, marginBottom: 18 }}>Upcoming Events & Tours</h3>
            {events.length === 0 ? (
              <p style={{ color: '#737373', fontSize: 13, textAlign: 'center', margin: '20px 0' }}>No tour dates scheduled. Build one below!</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {events.map(e => (
                  <div key={e.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📅</div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#fff' }}>{e.name}</h4>
                        <p style={{ color: '#a3a3a3', fontSize: 12, marginTop: 4 }}>{e.date} • {e.time} • {e.location}</p>
                      </div>
                    </div>
                    <span style={{ fontSize: 13, color: G, fontWeight: 800 }}>{e.price}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ticket Desk Sales (Feature 6) */}
          <div className="responsive-card" style={CARD}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>Live Ticket Office Sales</h3>
              <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 6, background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>
                🔴 Active Feed
              </span>
            </div>
            
            <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
              <div style={{ flex: 1, padding: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ color: '#737373', fontSize: 11 }}>Total Revenue</span>
                <div style={{ fontSize: 18, fontWeight: 950, color: G, marginTop: 4 }}>₹{ticketSales.totalRevenue.toLocaleString()}</div>
              </div>
              <div style={{ flex: 1, padding: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ color: '#737373', fontSize: 11 }}>Tickets Sold</span>
                <div style={{ fontSize: 18, fontWeight: 950, color: '#fff', marginTop: 4 }}>{ticketSales.ticketsSold}</div>
              </div>
            </div>

            <h4 style={{ color: '#a3a3a3', fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Recent Transactions</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <AnimatePresence initial={false}>
                {ticketSales.recentSales.map(sale => (
                  <motion.div
                    key={sale.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 8, background: 'rgba(255,255,255,0.01)', borderRadius: 8, fontSize: 12 }}
                  >
                    <div>
                      <span style={{ color: '#fff', fontWeight: 600 }}>{sale.buyer}</span>
                      <span style={{ color: '#737373' }}> bought {sale.tickets} ticket(s)</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ color: G, fontWeight: 700 }}>₹{sale.amount}</span>
                      <div style={{ fontSize: 10, color: '#525252' }}>{sale.time}</div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Schedule Tour Date Form */}
        <div className="responsive-card" style={CARD}>
          <h3 style={{ color: '#fff', fontWeight: 700, fontSize: 16, marginBottom: 18 }}>Schedule a Tour Date or Listening Party</h3>
          <form onSubmit={handleAddEvent} className="responsive-event-form">
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#737373', textTransform: 'uppercase', marginBottom: 6 }}>Event Name *</label>
              <input type="text" value={newEvent.name} onChange={e => setNewEvent({ ...newEvent, name: e.target.value })} placeholder="Live at Social" style={INPUT} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#737373', textTransform: 'uppercase', marginBottom: 6 }}>Date *</label>
              <input type="date" value={newEvent.date} onChange={e => setNewEvent({ ...newEvent, date: e.target.value })} style={{ ...INPUT, colorScheme: 'dark' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#737373', textTransform: 'uppercase', marginBottom: 6 }}>Time</label>
              <input type="text" value={newEvent.time} onChange={e => setNewEvent({ ...newEvent, time: e.target.value })} placeholder="e.g. 8:00 PM IST" style={INPUT} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#737373', textTransform: 'uppercase', marginBottom: 6 }}>Location *</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input type="text" value={newEvent.location} onChange={e => setNewEvent({ ...newEvent, location: e.target.value })} placeholder="Stadium or Online URL" style={{ ...INPUT, paddingRight: 60 }} />
                <div style={{ position: 'absolute', right: 8, display: 'flex', gap: 6 }}>
                  <button
                    type="button"
                    title="Detect Current Location"
                    onClick={handleDetectLocation}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    🎯
                  </button>
                  <button
                    type="button"
                    title="Pin on Map"
                    onClick={() => setShowMapModal(true)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    📍
                  </button>
                </div>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#737373', textTransform: 'uppercase', marginBottom: 6 }}>Price / Ticket</label>
              <input type="text" value={newEvent.price} onChange={e => setNewEvent({ ...newEvent, price: e.target.value })} placeholder="Free or $9.99" style={INPUT} />
            </div>
            <div>
              <button type="submit" className="responsive-button" style={{ ...BUTTON_PRIMARY, padding: '13px 24px', whiteSpace: 'nowrap' }}>📅 Schedule</button>
            </div>
          </form>
        </div>

        {/* Manage Scheduled Events */}
        <div className="responsive-card" style={CARD}>
          <h3 style={{ color: '#fff', fontWeight: 700, fontSize: 16, marginBottom: 18 }}>Manage Scheduled Events</h3>
          {events.length === 0 ? (
            <p style={{ color: '#737373', fontSize: 13, textAlign: 'center', margin: '20px 0' }}>No scheduled events found. Schedule one above to get started!</p>
          ) : (
            <div style={{ overflowX: 'auto', margin: '0 -14px', padding: '0 14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 640 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1.2fr 1.2fr 1fr', gap: 12, padding: '10px 16px', color: '#737373', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <span>Event Name</span>
                  <span>Date & Time</span>
                  <span>Location</span>
                  <span>Ticket Price</span>
                  <span>Tickets Sold</span>
                  <span style={{ textAlign: 'right' }}>Actions</span>
                </div>
                {events.map(e => {
                  const ticketsSoldForEvent = getEventTicketsSold(e.name);
                  const revenueForEvent = getEventRevenue(e.name);
                  return (
                    <div key={e.id} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1.2fr 1.2fr 1fr', gap: 12, alignItems: 'center', padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.04)', fontSize: 13.5 }}>
                    <div style={{ fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.name}</div>
                    <div style={{ color: '#d1d5db' }}>
                      <div>{e.date}</div>
                      <div style={{ color: '#737373', fontSize: 11, marginTop: 2 }}>{e.time}</div>
                    </div>
                    <div style={{ color: '#a3a3a3', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.location}</div>
                    <div style={{ color: G, fontWeight: 700 }}>{e.price}</div>
                    <div>
                      <span style={{ color: '#fff', fontWeight: 600 }}>{ticketsSoldForEvent} sold</span>
                      {ticketsSoldForEvent > 0 && (
                        <div style={{ color: G, fontSize: 11, marginTop: 2 }}>₹{revenueForEvent.toLocaleString()}</div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        onClick={() => setSelectedEventForBookings(e)}
                        style={{
                          background: 'rgba(176, 136, 80,0.12)',
                          color: G,
                          border: `1px solid ${G}30`,
                          borderRadius: 8,
                          padding: '6px 12px',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = 'rgba(176, 136, 80,0.2)';
                          e.currentTarget.style.borderColor = G;
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = 'rgba(176, 136, 80,0.12)';
                          e.currentTarget.style.borderColor = `${G}30`;
                        }}
                      >
                        Bookings
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteEvent(e.id, e.name)}
                        style={{
                          background: 'rgba(239,68,68,0.12)',
                          color: '#ef4444',
                          border: '1px solid rgba(239,68,68,0.3)',
                          borderRadius: 8,
                          padding: '6px 12px',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = 'rgba(239,68,68,0.2)';
                          e.currentTarget.style.borderColor = '#ef4444';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = 'rgba(239,68,68,0.12)';
                          e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)';
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

        {selectedEventForBookings && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              style={{ background: 'var(--color-ss-elevated, #ffffff)', border: '1px solid var(--color-ss-border, rgba(43, 34, 26, 0.08))', borderRadius: 24, padding: 36, width: '100%', maxWidth: 640, position: 'relative' }}>
              
              <button onClick={() => setSelectedEventForBookings(null)} style={{ position: 'absolute', top: 20, right: 20, background: 'var(--color-ss-surface, #f4eede)', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--color-ss-text-muted, #87786c)' }}>
                <X size={16} />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(176, 136, 80,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                  🎫
                </div>
                <div>
                  <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 20, fontWeight: 800, color: 'var(--color-ss-text-primary, #221a15)' }}>Ticket Sales & Bookings</h2>
                  <p style={{ color: 'var(--color-ss-text-muted, #87786c)', fontSize: 13 }}>For event: {selectedEventForBookings.name}</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                <div style={{ flex: 1, padding: 14, background: 'var(--color-ss-surface, #f4eede)', borderRadius: 12, border: '1px solid var(--color-ss-border, rgba(43, 34, 26, 0.08))' }}>
                  <span style={{ color: 'var(--color-ss-text-muted, #87786c)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Event Tickets Sold</span>
                  <div style={{ fontSize: 20, fontWeight: 950, color: 'var(--color-ss-text-primary, #221a15)', marginTop: 4 }}>
                    {getEventTicketsSold(selectedEventForBookings.name)}
                  </div>
                </div>
                <div style={{ flex: 1, padding: 14, background: 'var(--color-ss-surface, #f4eede)', borderRadius: 12, border: '1px solid var(--color-ss-border, rgba(43, 34, 26, 0.08))' }}>
                  <span style={{ color: 'var(--color-ss-text-muted, #87786c)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Event Revenue</span>
                  <div style={{ fontSize: 20, fontWeight: 950, color: G, marginTop: 4 }}>
                    ₹{getEventRevenue(selectedEventForBookings.name).toLocaleString()}
                  </div>
                </div>
              </div>

              <h3 style={{ color: 'var(--color-ss-text-primary, #221a15)', fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Bookings Log</h3>
              <div style={{ maxHeight: 250, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }} className="custom-scrollbar">
                {getEventBookings(selectedEventForBookings.name).length === 0 ? (
                  <p style={{ color: 'var(--color-ss-text-muted, #87786c)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No ticket bookings recorded yet for this show.</p>
                ) : (
                  getEventBookings(selectedEventForBookings.name).map((sale: any) => (
                    <div key={sale.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: 'var(--color-ss-surface, #f4eede)', border: '1px solid var(--color-ss-border, rgba(43, 34, 26, 0.08))', borderRadius: 10, fontSize: 13 }}>
                      <div>
                        <span style={{ color: 'var(--color-ss-text-primary, #221a15)', fontWeight: 600 }}>{sale.buyer}</span>
                        <span style={{ color: 'var(--color-ss-text-muted, #87786c)' }}> bought {sale.tickets} ticket(s)</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ color: G, fontWeight: 700 }}>₹{sale.amount}</span>
                        <div style={{ fontSize: 10, color: 'var(--color-ss-text-muted, #87786c)', marginTop: 2 }}>{sale.time}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 28 }}>
                <button type="button" onClick={() => setSelectedEventForBookings(null)} style={{ ...BUTTON_SECONDARY, padding: '10px 20px' }}>Close Window</button>
              </div>
            </motion.div>
          </div>
        )}

        {showMapModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              style={{ background: 'var(--color-ss-elevated, #ffffff)', border: '1px solid var(--color-ss-border, rgba(43, 34, 26, 0.08))', borderRadius: 24, padding: 36, width: '100%', maxWidth: 640, position: 'relative' }}>
              
              <button type="button" onClick={() => setShowMapModal(false)} style={{ position: 'absolute', top: 20, right: 20, background: 'var(--color-ss-surface, #f4eede)', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--color-ss-text-muted, #87786c)' }}>
                <X size={16} />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(176, 136, 80,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                  📍
                </div>
                <div>
                  <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 20, fontWeight: 800, color: 'var(--color-ss-text-primary, #221a15)' }}>Pin Show Location on Map</h2>
                  <p style={{ color: 'var(--color-ss-text-muted, #87786c)', fontSize: 13 }}>Search for a venue or select from popular presets</p>
                </div>
              </div>

              {/* Map search field */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
                <input
                  type="text"
                  value={mapSearch}
                  onChange={e => setMapSearch(e.target.value)}
                  placeholder="Search city, venue or stadium (e.g. Phoenix Marketcity Chennai)..."
                  style={{ ...INPUT, flex: 1 }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleMapSearch();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleMapSearch}
                  style={{ ...BUTTON_PRIMARY, padding: '12px 20px', whiteSpace: 'nowrap' }}
                >
                  🔍 Search Map
                </button>
              </div>

              {/* OpenStreetMap Iframe Container */}
              <div style={{ marginBottom: 18 }}>
                <iframe
                  width="100%"
                  height="280"
                  style={{ border: '1px solid var(--color-ss-border, rgba(43, 34, 26, 0.08))', borderRadius: 16, background: 'var(--color-ss-surface, #f4eede)' }}
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${mapLocation.lon - 0.015}%2C${mapLocation.lat - 0.015}%2C${mapLocation.lon + 0.015}%2C${mapLocation.lat + 0.015}&layer=mapnik&marker=${mapLocation.lat}%2C${mapLocation.lon}`}
                />
              </div>

              {/* Selected Pin Description */}
              <div style={{ background: 'var(--color-ss-surface, #f4eede)', border: '1px solid var(--color-ss-border, rgba(43, 34, 26, 0.08))', padding: '10px 14px', borderRadius: 12, marginBottom: 20, fontSize: 12.5, color: 'var(--color-ss-text-muted, #87786c)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                📍 <span style={{ fontWeight: 600, color: 'var(--color-ss-text-primary, #221a15)' }}>Selected Pin: </span>{mapLocation.name}
              </div>

              {/* Hotspot Presets */}
              <h4 style={{ color: 'var(--color-ss-text-muted, #87786c)', fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Popular Venues Presets</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 24 }}>
                {[
                  { name: 'Indiranagar Social, Bengaluru', lat: 12.9716, lon: 77.6412 },
                  { name: 'Phoenix Marketcity, Chennai', lat: 12.9912, lon: 80.2173 },
                  { name: 'NCPA, Mumbai', lat: 18.9261, lon: 72.8203 },
                  { name: 'DLF Avenue, New Delhi', lat: 28.5284, lon: 77.2185 },
                  { name: 'Madison Square Garden, New York', lat: 40.7505, lon: -73.9934 },
                  { name: 'O2 Arena, London', lat: 51.5030, lon: 0.0032 }
                ].map(preset => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => setMapLocation({ lat: preset.lat, lon: preset.lon, name: preset.name })}
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.04)',
                      borderRadius: 8,
                      padding: '8px 10px',
                      fontSize: 11,
                      color: '#d1d5db',
                      textAlign: 'left',
                      cursor: 'pointer',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(176, 136, 80,0.12)';
                      e.currentTarget.style.borderColor = G;
                      e.currentTarget.style.color = '#fff';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)';
                      e.currentTarget.style.color = '#d1d5db';
                    }}
                  >
                    🏢 {preset.name.split(',')[0]}
                  </button>
                ))}
              </div>

              {/* Footer action buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowMapModal(false)}
                  style={{ ...BUTTON_SECONDARY, padding: '10px 20px' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmLocation}
                  style={{ ...BUTTON_PRIMARY, padding: '10px 22px' }}
                >
                  Confirm Location
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    );
  };

  // Removed render functions for deleted tabs

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        minHeight: '100vh',
        background: 'var(--color-ss-bg, #fbf9f5)',
        ...FONT
      }}
    >
      <style>{`
        :root {
          --grid-cols: 1fr 1fr;
          --grid-gap: 20px;
        }
        @media (max-width: 768px) {
          :root {
            --grid-cols: 1fr;
            --grid-gap: 16px;
          }
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        
        /* Responsive visibility utility classes */
        .desktop-only {
          display: block !important;
        }
        .mobile-only {
          display: block !important;
        }
        .desktop-flex {
          display: flex !important;
        }
        .mobile-flex {
          display: flex !important;
        }
        
        /* Stats grid layout styling */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 14px;
          margin-bottom: 24px;
        }
        .active-now-card {
          grid-column: auto;
        }
        
        /* Content body padding responsive class */
        .content-body {
          padding: 24px 24px 40px;
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        /* Pure CSS responsive classes to replace state checks */
        .responsive-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .responsive-grid-3 {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 14px;
        }
        .responsive-flex-row {
          display: flex;
          flex-direction: row;
          gap: 12px;
        }
        .responsive-button {
          width: auto;
        }
        .responsive-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
        }
        .responsive-card {
          padding: 22px;
        }
        .responsive-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12.5px;
          text-align: left;
          min-width: 100%;
        }
        .responsive-table th, .responsive-table td {
          white-space: nowrap;
        }
        .grid-span-2 {
          grid-column: span 2;
        }
        .donut-container {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 20px;
          height: 220px;
        }
        .donut-legend {
          flex: 0.8;
          display: flex;
          flex-direction: column;
          gap: 10px;
          width: auto;
        }
        .profile-hero-row {
          background: var(--color-ss-elevated, #ffffff);
          padding: 46px 24px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
        }
        .profile-meta-row {
          color: var(--color-ss-text-muted, #87786c);
          font-size: 12px;
          margin-top: 4px;
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
        }
        .responsive-event-form {
          display: grid;
          grid-template-columns: 1.2fr 1fr 0.8fr 1.2fr 0.8fr auto;
          gap: 12px;
          align-items: flex-end;
        }

        @media (max-width: 768px) {
          .desktop-only, .desktop-flex {
            display: none !important;
          }
          .mobile-only {
            display: block !important;
          }
          .mobile-flex {
            display: flex !important;
          }
          .stats-grid {
            grid-template-columns: 1fr 1fr !important;
          }
          .active-now-card {
            grid-column: span 2 !important;
          }
          .content-body {
            padding: 16px 16px 40px !important;
          }

          /* Responsive classes adjustments on mobile */
          .responsive-grid-2 {
            grid-template-columns: 1fr !important;
            gap: 14px !important;
          }
          .responsive-grid-3 {
            grid-template-columns: 1fr !important;
            gap: 14px !important;
          }
          .responsive-flex-row {
            flex-direction: column !important;
            gap: 10px !important;
          }
          .responsive-button {
            width: 100% !important;
          }
          .responsive-header-row {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 8px !important;
          }
          .responsive-card {
            padding: 16px !important;
          }
          .responsive-table {
            font-size: 11px !important;
            min-width: 540px !important;
          }
          .grid-span-2 {
            grid-column: auto !important;
          }
          .donut-container {
            flex-direction: column !important;
            gap: 14px !important;
            height: auto !important;
            align-items: stretch !important;
          }
          .donut-legend {
            flex: none !important;
            flex-direction: row !important;
            flex-wrap: wrap !important;
            justify-content: center !important;
            width: 100% !important;
          }
          .profile-hero-row {
            padding: 38px 16px 16px !important;
            flex-direction: column !important;
            align-items: stretch !important;
          }
          .profile-meta-row {
            font-size: 11px !important;
            gap: 4px 10px !important;
          }
          .responsive-event-form {
            grid-template-columns: 1fr !important;
            gap: 14px !important;
          }
        }
        @media (min-width: 769px) {
          .mobile-only, .mobile-flex {
            display: none !important;
          }
        }
      `}</style>

      {showUpload && <UploadModal onClose={() => setShowUpload(false)} />}
      
      <div className="mobile-only" style={{ width: '100%', position: 'sticky', top: 0, zIndex: 100, background: 'var(--color-ss-bg, #fbf9f5)' }}>
        {/* Mobile Premium Header */}
        <div
          style={{
            background: 'linear-gradient(180deg, rgba(176, 136, 80,0.15) 0%, var(--color-ss-bg, #fbf9f5) 100%)',
            paddingTop: 'calc(var(--sat, 0px) + 12px)',
            paddingRight: '16px',
            paddingBottom: '10px',
            paddingLeft: '16px',
            borderBottom: '1px solid var(--color-ss-border, rgba(43, 34, 26, 0.08))',
            display: 'flex',
            flexDirection: 'column',
            gap: 12
          }}
        >
          {/* Top Row: Avatar & Title & Live & Refresh */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* User Profile Avatar */}
            <div
              onClick={() => setMobileDrawerOpen(true)}
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: '#34d399', // Pink circle matching screenshot
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: 14,
                fontFamily: 'Outfit, sans-serif',
                cursor: 'pointer',
                flexShrink: 0
              }}
            >
              {user?.name ? user.name[0].toUpperCase() : 'M'}
            </div>

            <h1
              style={{
                fontFamily: 'Outfit, sans-serif',
                fontSize: 22,
                fontWeight: 900,
                color: '#fff',
                margin: 0
              }}
            >
              Dashboard
            </h1>

            {/* Live active listeners */}
            {activeUsers > 0 && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  padding: '3px 8px',
                  borderRadius: 100,
                  background: 'rgba(176, 136, 80,0.12)',
                  border: '1px solid rgba(176, 136, 80,0.2)',
                  color: G,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    background: G,
                    display: 'inline-block',
                    animation: 'pulse 1.5s infinite'
                  }}
                />
                {activeUsers} active
              </span>
            )}

            <button
              onClick={() => fetchArtistStats()}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#a3a3a3',
                fontSize: 14,
                cursor: 'pointer',
                flexShrink: 0,
                marginLeft: 'auto'
              }}
              title="Refresh"
            >
              🔄
            </button>
          </div>

          {/* Subtitle */}
          <p style={{ color: '#737373', fontSize: 12.5, margin: 0 }}>
            {activeTab === 'Overview'
              ? 'Your overall streaming metrics recap'
              : `Manage and review your artist ${activeTab.toLowerCase()} data`}
          </p>

          {/* Horizontally scrolling tab chips with Apple Music / Spotify segmented slider effects */}
          <div
            ref={tabsContainerRef}
            onMouseDown={handleDragMouseDown}
            onMouseMove={handleDragMouseMove}
            onMouseUp={handleDragMouseUpOrLeave}
            onMouseLeave={handleDragMouseUpOrLeave}
            style={{
              display: 'flex',
              gap: 8,
              overflowX: 'auto',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              paddingBottom: 6,
              paddingTop: 4,
              WebkitOverflowScrolling: 'touch',
              cursor: isDragScrolling ? 'grabbing' : 'grab',
              userSelect: 'none',
              scrollSnapType: 'x proximity',
              scrollPaddingLeft: 16
            }}
            className="hide-scrollbar"
          >
            {allowedTabs.map(tab => {
              const active = activeTab === tab;
              return (
                <div
                  key={tab}
                  ref={el => { tabRefs.current[tab] = el; }}
                  style={{
                    position: 'relative',
                    flexShrink: 0,
                    scrollSnapAlign: 'start'
                  }}
                >
                  <motion.button
                    onClick={() => {
                      router.push(`/artist/dashboard?tab=${tab}`);
                      scrollToTab(tab);
                    }}
                    whileTap={{ scale: 0.96 }}
                    animate={{
                      scale: active ? 1.05 : 1,
                      color: active ? '#000' : '#ffffffc0'
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 450,
                      damping: 32
                    }}
                    style={{
                      padding: '7px 16px',
                      borderRadius: 20,
                      background: 'transparent',
                      fontSize: 12.5,
                      fontWeight: 800,
                      border: 'none',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      fontFamily: 'Outfit, sans-serif',
                      zIndex: 2,
                      position: 'relative',
                      textShadow: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {tab}
                  </motion.button>
                  
                  {active && (
                    <motion.div
                      layoutId="activeTabSegmentPill"
                      transition={{
                        type: 'spring',
                        stiffness: 450,
                        damping: 32
                      }}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: G, // Spotify Green #b08850
                        borderRadius: 20,
                        zIndex: 1,
                        boxShadow: '0 0 14px rgba(176, 136, 80, 0.45)'
                      }}
                    />
                  )}
                  
                  {!active && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(255, 255, 255, 0.06)',
                        borderRadius: 20,
                        zIndex: 0,
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(8px)',
                        pointerEvents: 'none'
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="desktop-only" style={{ width: '100%' }}>
        {/* Desktop Header */}
        <div
          style={{
            background: 'linear-gradient(180deg, rgba(176, 136, 80,0.15) 0%, var(--color-ss-bg, #fbf9f5) 100%)',
            borderBottom: '1px solid var(--color-ss-border, rgba(43, 34, 26, 0.08))'
          }}
        >
          <TopBar transparent />
          
          <div
            style={{
              padding: '18px 24px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div>
              <h1
                style={{
                  fontFamily: 'Outfit, sans-serif',
                  fontSize: 28,
                  fontWeight: 900,
                  color: '#fff',
                  margin: 0
                }}
              >
                {activeTab}
              </h1>
              <p
                style={{
                  color: '#737373',
                  fontSize: 13,
                  marginTop: 4,
                  margin: 0
                }}
              >
                {activeTab === 'Overview'
                  ? 'Your overall streaming metrics recap'
                  : `Manage and review your artist ${activeTab.toLowerCase()} data`}
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => fetchArtistStats()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 14px',
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#a3a3a3',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                🔄 Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content body */}
      <div className="content-body" style={{ overflow: 'hidden' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            style={{ width: '100%' }}
          >
            {activeTab === 'Overview' && renderOverview()}
            {activeTab === 'My Music' && renderMyMusic()}
            {activeTab === 'Analytics' && renderAnalytics()}
            {activeTab === 'Revenue' && renderRevenue()}
            {activeTab === 'Audience' && renderAudience()}
            {activeTab === 'Campaigns' && renderCampaigns()}
            {activeTab === 'Profile' && renderProfile()}
            {activeTab === 'Live Events' && renderLiveEvents()}
            {activeTab === 'Sample Upload' && renderSampleUpload()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function ArtistDashboardPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--color-ss-bg, #fbf9f5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-ss-text-primary, #221a15)', fontFamily: 'Outfit, sans-serif' }}>Loading Artist Dashboard...</div>}>
      <ArtistDashboardContent />
    </Suspense>
  );
}
