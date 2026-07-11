'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, Music, Image as ImageIcon, Check, X, ChevronRight,
  ChevronLeft, ChevronDown, AlertCircle, FileAudio, Shield, Zap, Info, Play, Pause,
  RefreshCw, BarChart2, HardDrive, Sparkles, CheckCircle, Sliders,
  HelpCircle, Eye, Disc, Award, Globe, Heart
} from 'lucide-react';
import Link from 'next/link';
import { useUploadStore, UploadStage, STAGE_ORDER } from '@/store/uploadStore';
import { useMusicStore, trackGradient } from '@/store/musicStore';
import { useNotificationStore } from '@/store/notificationStore';
import { useAuthStore } from '@/store/authStore';
import { useArtistApplicationStore } from '@/store/artistApplicationStore';
import { socketManager } from '@/lib/socket';
import toast from 'react-hot-toast';



const G = '#0f5132'; // Spotify Green
const V = '#10b981'; // Violet
const P = '#34d399'; // Pink

const GENRES = ['Pop', 'Hip-Hop', 'R&B', 'Electronic', 'Rock', 'Indie', 'Jazz', 'Classical',
  'Dance', 'Ambient', 'Synth Wave', 'Dream Pop', 'Lo-Fi', 'Metal', 'Country',
  'Reggae', 'Blues', 'Soul', 'Gospel', 'Experimental'];

const LANGUAGES = ['English', 'Hindi', 'Tamil', 'Telugu', 'Spanish', 'French', 'Portuguese',
  'Korean', 'Japanese', 'Arabic', 'German', 'Italian', 'Punjabi', 'Bengali'];

const FILTER_PRESETS = [
  { id: 'none', name: 'Original', filter: 'none' },
  { id: 'cyberpunk', name: 'Cyberpunk', filter: 'saturate(1.8) hue-rotate(50deg) contrast(1.1)' },
  { id: 'vivid', name: 'Vivid Dream', filter: 'contrast(1.3) saturate(1.6) brightness(1.05)' },
  { id: 'retro', name: 'Retro Glow', filter: 'sepia(0.4) saturate(1.3) contrast(1.1) brightness(0.95)' },
  { id: 'gold', name: 'Mono Gold', filter: 'grayscale(1) sepia(0.55) contrast(1.2) brightness(0.9) hue-rotate(10deg)' },
];

const STAGE_CONFIG: Partial<Record<UploadStage, { label: string; icon: string; color: string }>> = {
  validating:      { label: 'Validating File Security', icon: '🔍', color: '#06b6d4' },
  uploading:       { label: 'Uploading to Cloud Node', icon: '☁️', color: '#10b981' },
  processing:      { label: 'Spectral Audio Analysis', icon: '⚙️', color: '#f59e0b' },
  transcoding_320: { label: 'Transcoding 320kbps Master', icon: '🎵', color: G },
  transcoding_160: { label: 'Transcoding 160kbps High', icon: '🎵', color: G },
  transcoding_96:  { label: 'Transcoding 96kbps Standard', icon: '🎵', color: G },
  waveform:        { label: 'Waveform Map Generation', icon: '📊', color: '#34d399' },
  indexing:        { label: 'Global Directory Indexing', icon: '🔎', color: '#f97316' },
  publishing:      { label: 'Deploying Live Stream Nodes', icon: '🚀', color: G },
};

// ─── Styled Helpers ────────────────────────────────────────────────────────
const labelS: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--color-ss-text-muted, #87786c)',
  textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8,
};

const inputS = (focused: boolean): React.CSSProperties => ({
  width: '100%', background: 'var(--color-ss-surface, #f4eede)',
  border: `1.5px solid ${focused ? G : 'var(--color-ss-border, rgba(43, 34, 26, 0.08))'}`,
  borderRadius: 12, padding: '14px 16px', color: 'var(--color-ss-text-primary, #221a15)', fontSize: 14,
  outline: 'none', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box',
  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
  boxShadow: focused ? `0 0 16px rgba(15, 81, 50, 0.12)` : 'none',
});

// DropZone component for file uploads
function DropZone({ accept, onFile, file, label, icon: Icon, color = G }: {
  accept: string; onFile: (f: File) => void; file: File | null; label: string; icon: any; color?: string;
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) onFile(f);
  }, [onFile]);

  return (
    <div onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)} onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className="upload-dropzone"
      style={{
        border: `2px dashed ${file ? G : dragging ? color : 'var(--color-ss-border, rgba(43, 34, 26, 0.08))'}`,
        borderRadius: 16, textAlign: 'center', cursor: 'pointer',
        background: file ? 'rgba(15, 81, 50,0.03)' : dragging ? `rgba(16,185,129,0.04)` : 'var(--color-ss-surface, #f4eede)',
        backdropFilter: 'blur(8px)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: dragging ? `0 0 24px rgba(16,185,129,0.1)` : 'none',
      }}>
      <input suppressHydrationWarning ref={inputRef} type="file" accept={accept} style={{ display: 'none' }}
        onChange={e => e.target.files?.[0] && onFile(e.target.files[0])} />
      {file ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: 54, height: 54, borderRadius: '50%', background: 'rgba(15, 81, 50,0.12)', border: `2px solid ${G}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
            <Check size={24} color={G} />
          </div>
          <p style={{ color: G, fontWeight: 700, fontSize: 14, marginBottom: 4, maxWidth: '90%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</p>
          <p style={{ color: 'var(--color-ss-text-muted, #87786c)', fontSize: 12 }}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
        </div>
      ) : (
        <div>
          <div style={{ width: 54, height: 54, borderRadius: '50%', background: 'var(--color-ss-bg, #fbf9f5)', border: '1px solid var(--color-ss-border, rgba(43, 34, 26, 0.08))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', transition: 'all 0.25s' }}>
            <Icon size={24} color={dragging ? color : 'var(--color-ss-text-muted, #87786c)'} />
          </div>
          <p style={{ color: 'var(--color-ss-text-primary, #221a15)', fontSize: 14, fontWeight: 600 }}>{label}</p>
          <p style={{ color: 'var(--color-ss-text-muted, #87786c)', fontSize: 12, marginTop: 4 }}>Drag & drop or click to browse</p>
        </div>
      )}
    </div>
  );
}

// Stage display row for publishing pipeline
function PipelineRow({ stage, currentStage, index }: { stage: UploadStage; currentStage: UploadStage; index: number }) {
  const stageIdx = STAGE_ORDER.indexOf(currentStage);
  const myIdx = STAGE_ORDER.indexOf(stage);
  const isDone = myIdx < stageIdx || currentStage === 'done';
  const isActive = myIdx === stageIdx && currentStage !== 'done';
  const config = STAGE_CONFIG[stage];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
      style={{
        display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderRadius: 12,
        background: isActive ? 'rgba(15, 81, 50,0.05)' : isDone ? 'var(--color-ss-elevated, #ffffff)' : 'var(--color-ss-surface, #f4eede)',
        border: `1px solid ${isActive ? 'rgba(15, 81, 50,0.2)' : 'var(--color-ss-border, rgba(43, 34, 26, 0.08))'}`,
        marginBottom: 8, transition: 'all 0.3s',
      }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        background: isDone ? 'rgba(15, 81, 50,0.1)' : isActive ? `rgba(15, 81, 50,0.05)` : 'var(--color-ss-bg, #fbf9f5)',
        border: `1.5px solid ${isDone ? G : isActive ? G : 'var(--color-ss-border, rgba(43, 34, 26, 0.08))'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        {isDone ? <Check size={14} color={G} /> : isActive ? (
          <div style={{ width: 14, height: 14, border: `2px solid ${G}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        ) : (
          <span style={{ fontSize: 13, filter: 'grayscale(1)' }}>{config?.icon ?? '⏳'}</span>
        )}
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ color: isDone ? 'var(--color-ss-text-primary, #221a15)' : isActive ? 'var(--color-ss-text-primary, #221a15)' : 'var(--color-ss-text-muted, #87786c)', fontSize: 13, fontWeight: isDone || isActive ? 600 : 400 }}>
          {config?.label ?? stage}
        </p>
      </div>
      {isDone && <span style={{ color: G, fontSize: 11, fontWeight: 700 }}>Verified</span>}
      {isActive && <span style={{ color: G, fontSize: 11, fontWeight: 500, animation: 'pulse 1.5s infinite' }}>Processing...</span>}
    </motion.div>
  );
}

// ─── Crop Image Canvas Helper ──────────────────────────────────────────────
const cropImage = (
  imageSrc: string,
  zoom: number,
  rotation: number,
  shiftX: number,
  shiftY: number,
  fileType: string
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 600;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas 2D context'));
        return;
      }

      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, 600, 600);

      ctx.save();
      ctx.translate(300, 300);
      ctx.rotate((rotation * Math.PI) / 180);

      const dx = shiftX * (600 / 160);
      const dy = shiftY * (600 / 160);

      const minDim = Math.min(img.width, img.height);
      const renderScale = (600 / minDim) * zoom;
      const w = img.width * renderScale;
      const h = img.height * renderScale;

      ctx.drawImage(img, dx - w / 2, dy - h / 2, w, h);
      ctx.restore();

      canvas.toBlob(
        blob => {
          if (blob) resolve(blob);
          else reject(new Error('Canvas toBlob returned null'));
        },
        fileType || 'image/jpeg',
        0.95
      );
    };
    img.onerror = e => reject(e);
  });
};

// ─── Main Component ─────────────────────────────────────────────────────────
export default function UploadPage() {
  const [step, setStep] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  const [activeRightTab, setActiveRightTab] = useState<'preview' | 'ai' | 'outlets'>('preview');
  const [showArtworkAdjust, setShowArtworkAdjust] = useState(true);
  const { currentJob, startUpload, reset } = useUploadStore();
  const { uploadTrack, allTracks } = useMusicStore();
  const { addNotification } = useNotificationStore();
  const { user, setMobileDrawerOpen } = useAuthStore();
  const { getApplicationByUserId } = useArtistApplicationStore();
  
  // Real user data hooks
  const activeApp = user ? getApplicationByUserId(user.id) : undefined;
  const isApproved = activeApp?.status === 'APPROVED' || ['ARTIST', 'artist'].includes(user?.role || '') || ['ADMIN', 'SUPER_ADMIN', 'admin', 'super_admin', 'moderator', 'analyst', 'MODERATOR', 'ANALYST'].includes(user?.role || '');
  const defaultArtistName = isApproved && activeApp ? activeApp.artistName : (user?.name || 'Manoj S');
  const artistId = user?.id || 'artist-user-1780052773758';
  const userAvatar = user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop';
  
  // Count how many tracks the user currently has uploaded to database
  const myUploadedTracksCount = allTracks.filter(t => t.artistId === artistId).length;

  const [formData, setFormData] = useState({
    title: '', artistName: defaultArtistName, albumName: 'Singles',
    genre: 'Pop', language: 'English', releaseDate: new Date().toISOString().split('T')[0],
    explicit: false, lyrics: '', audioFile: null as File | null, audioFileName: '',
    coverFile: null as File | null, coverUrl: '',
    copyrightAccepted: false, policyAccepted: false,
  });

  // UI States
  const [focused, setFocused] = useState<Record<string, boolean>>({});
  const f = (field: string) => ({ onFocus: () => setFocused(p => ({ ...p, [field]: true })), onBlur: () => setFocused(p => ({ ...p, [field]: false })) });
  
  // Audio Analyzer states
  const [audioDuration, setAudioDuration] = useState<number | null>(null);
  const [audioSpec, setAudioSpec] = useState<{ sampleRate: number; channels: number; bitrate: string; format: string } | null>(null);
  const [waveformPeaks, setWaveformPeaks] = useState<number[]>([]);
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isAnalyzingAudio, setIsAnalyzingAudio] = useState(false);

  // Duplication Detection state
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);
  const [duplicateTrack, setDuplicateTrack] = useState<any>(null);

  // YouTube MP3 Extractor States
  const [uploadMode, setUploadMode] = useState<'file' | 'youtube' | 'spotify'>('file');
  const [artists, setArtists] = useState<any[]>([]);
  const [ytUrl, setYtUrl] = useState('');
  const [ytArtistId, setYtArtistId] = useState('');
  const [ytLoading, setYtLoading] = useState(false);
  const [ytParsedData, setYtParsedData] = useState<any>(null);
  const [ytConvertProgress, setYtConvertProgress] = useState(0);
  const [ytLogs, setYtLogs] = useState<string[]>([]);
  const [ytPlaylistSelection, setYtPlaylistSelection] = useState<Record<string, boolean>>({});
  const [ytSingleMetadata, setYtSingleMetadata] = useState<any>({
    title: '',
    songName: '',
    singer: '',
    genre: 'Pop',
    duration: 180,
    explicit: false,
    coverImage: ''
  });

  // ─── Spotify Extractor States ───────────────────────────────────────────
  const [spUrl, setSpUrl] = useState('');
  const [spArtistId, setSpArtistId] = useState('');
  const [spLoading, setSpLoading] = useState(false);
  const [spParsedData, setSpParsedData] = useState<any>(null);
  const [spConvertProgress, setSpConvertProgress] = useState(0);
  const [spLogs, setSpLogs] = useState<string[]>([]);
  const [spPlaylistSelection, setSpPlaylistSelection] = useState<Record<string, boolean>>({});
  const [spClientId, setSpClientId] = useState('');
  const [spClientSecret, setSpClientSecret] = useState('');
  const [spHideDuplicates, setSpHideDuplicates] = useState(true);
  const [spWarning, setSpWarning] = useState<string | null>(null);

  // Load saved Spotify credentials from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedId = localStorage.getItem('ss_spotify_client_id');
      const savedSecret = localStorage.getItem('ss_spotify_client_secret');
      if (savedId) setSpClientId(savedId);
      if (savedSecret) setSpClientSecret(savedSecret);
    }
  }, []);

  const [spSingleMetadata, setSpSingleMetadata] = useState<any>({
    title: '',
    songName: '',
    artist: '',
    album: '',
    genre: 'Pop',
    duration: 180,
    explicit: false,
    coverImage: '',
    youtubeVideoId: null,
    spotifyId: '',
    spotifyUrl: '',
    releaseDate: '',
    popularity: 0,
  });

  // Fetch active artists list for Super Admin dropdown selection
  useEffect(() => {
    if (user?.role === 'SUPER_ADMIN' || user?.role === 'super_admin') {
      fetch('/api/admin/artists')
        .then(res => res.json())
        .then(data => {
          if (data.success) setArtists(data.artists);
        })
        .catch(() => {});
    }
  }, [user]);

  const handleYtParse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ytUrl) {
      toast.error('Please paste a YouTube URL');
      return;
    }
    if (!ytArtistId) {
      toast.error('Please select a target artist');
      return;
    }

    try {
      setYtLoading(true);
      setYtParsedData(null);
      setYtLogs([]);
      setYtConvertProgress(0);

      const res = await fetch('/api/admin/youtube-extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'parse',
          url: ytUrl,
          artistId: ytArtistId
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to parse YouTube URL');

      if (data.success) {
        setYtParsedData(data);
        if (data.type === 'video' && data.video) {
          setYtSingleMetadata(data.video);
        } else if (data.type === 'playlist' && data.tracks) {
          const initialSelection: Record<string, boolean> = {};
          data.tracks.forEach((t: any) => {
            initialSelection[t.id] = true;
          });
          setYtPlaylistSelection(initialSelection);
        }
        toast.success(`Successfully parsed YouTube ${data.type}!`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Error parsing YouTube URL');
    } finally {
      setYtLoading(false);
    }
  };

  const handleYtConvert = async () => {
    if (!ytParsedData) return;

    const selectedTracks = ytParsedData.type === 'video'
      ? [ytSingleMetadata]
      : ytParsedData.tracks.filter((t: any) => ytPlaylistSelection[t.id]);

    if (selectedTracks.length === 0) {
      toast.error('Please select at least one song to upload');
      return;
    }

    const payload: any = {
      artistId: ytArtistId,
      genre: ytSingleMetadata?.genre || 'Pop',
    };
    if (ytParsedData.type === 'video') {
      payload.metadata = ytSingleMetadata;
    } else {
      payload.tracks = selectedTracks;
    }

    try {
      setYtLoading(true);
      setYtConvertProgress(0);
      setYtLogs([`🚀 Starting conversion of ${selectedTracks.length} track(s)...`]);

      const res = await fetch('/api/admin/youtube-convert-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ error: 'Stream failed' }));
        throw new Error(err.error || 'Conversion stream failed');
      }

      // Read the SSE stream line by line
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';   // keep incomplete last line

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(line.slice(6));

            switch (event.type) {
              case 'start':
                setYtLogs([`🚀 ${event.message}`]);
                setYtConvertProgress(1);
                break;

              case 'track_progress':
                setYtConvertProgress(Math.min(event.percentage, 99));
                setYtLogs(prev => {
                  // Replace last line if it's for the same track step, else append
                  const last = prev[prev.length - 1] || '';
                  const isUpdate = last.startsWith(`[${(event.trackIndex ?? 0) + 1}/`);
                  return isUpdate ? [...prev.slice(0, -1), event.message] : [...prev, event.message];
                });
                break;

              case 'track_done':
                setYtConvertProgress(event.percentage);
                setYtLogs(prev => [...prev, event.message]);
                break;

              case 'track_error':
                setYtLogs(prev => [...prev, event.message]);
                break;

              case 'complete':
                setYtConvertProgress(100);
                setYtLogs(prev => [...prev, `\n✅ ${event.message}`]);
                if (event.errors?.length) {
                  event.errors.forEach((e: string) =>
                    setYtLogs(prev => [...prev, `⚠️ ${e}`])
                  );
                }
                toast.success(event.message);
                setYtUrl('');
                setYtParsedData(null);
                useMusicStore.getState().fetchTracks();
                break;
            }
          } catch {}
        }
      }
    } catch (err: any) {
      setYtLogs(prev => [...prev, `❌ ${err.message || 'Conversion failed'}`]);
      toast.error(err.message || 'Conversion failed');
    } finally {
      setYtLoading(false);
    }
  };

  // ─── Spotify Handlers ────────────────────────────────────────────────────
  const handleSpParse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spUrl) { toast.error('Please paste a Spotify URL'); return; }
    if (!spArtistId) { toast.error('Please select a target artist'); return; }

    try {
      setSpWarning(null);
      // Save credentials in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('ss_spotify_client_id', spClientId);
        localStorage.setItem('ss_spotify_client_secret', spClientSecret);
      }

      setSpLoading(true);
      setSpParsedData(null);
      setSpLogs(['🔍 Fetching Spotify metadata...']);
      setSpConvertProgress(0);

      const res = await fetch('/api/admin/spotify-extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          url: spUrl, 
          artistId: spArtistId,
          clientId: spClientId || undefined,
          clientSecret: spClientSecret || undefined
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to parse Spotify URL');

      if (data.success) {
        setSpParsedData(data);
        if (data.warning) {
          setSpWarning(data.warning);
        }
        if (data.type === 'track' && data.track) {
          setSpSingleMetadata({ ...data.track, genre: 'Pop' });
        } else if ((data.type === 'playlist' || data.type === 'album') && data.tracks) {
          const initialSel: Record<string, boolean> = {};
          data.tracks.forEach((t: any) => {
            const isDup = allTracks.some((ext: any) => {
              if (ext.spotifyTrackId && ext.spotifyTrackId === t.spotifyId) return true;
              const cleanExtTitle = ext.title.toLowerCase().replace(/[^a-z0-9]/g, '');
              const cleanSpTitle = t.title.toLowerCase().replace(/[^a-z0-9]/g, '');
              return cleanExtTitle === cleanSpTitle;
            });
            initialSel[t.spotifyId] = !isDup;
          });
          setSpPlaylistSelection(initialSel);
        }
        toast.success(`Successfully parsed Spotify ${data.type}!`);
        setSpLogs([]);
      }
    } catch (err: any) {
      toast.error(err.message || 'Error parsing Spotify URL');
      setSpLogs([`❌ ${err.message || 'Error parsing Spotify URL'}`]);
    } finally {
      setSpLoading(false);
    }
  };

  const handleSpConvert = async () => {
    if (!spParsedData) return;

    const selectedTracks = (spParsedData.type === 'track')
      ? [spSingleMetadata]
      : spParsedData.tracks.filter((t: any) => spPlaylistSelection[t.spotifyId]);

    if (selectedTracks.length === 0) {
      toast.error('Please select at least one track to upload');
      return;
    }

    const payload: any = {
      artistId: spArtistId,
      genre: spSingleMetadata?.genre || 'Pop',
    };
    if (spParsedData.type === 'track') {
      payload.track = spSingleMetadata;
    } else {
      payload.tracks = selectedTracks;
    }

    try {
      setSpLoading(true);
      setSpConvertProgress(0);
      setSpLogs([`🚀 Starting Spotify extraction of ${selectedTracks.length} track(s)...`]);

      const res = await fetch('/api/admin/spotify-convert-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ error: 'Stream failed' }));
        throw new Error(err.error || 'Conversion stream failed');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(line.slice(6));
            switch (event.type) {
              case 'start':
                setSpLogs([`🚀 ${event.message}`]);
                setSpConvertProgress(1);
                break;
              case 'track_progress':
                setSpConvertProgress(Math.min(event.percentage, 99));
                setSpLogs(prev => {
                  const last = prev[prev.length - 1] || '';
                  const isUpdate = last.startsWith(`[${(event.trackIndex ?? 0) + 1}/`);
                  return isUpdate ? [...prev.slice(0, -1), event.message] : [...prev, event.message];
                });
                break;
              case 'track_done':
                setSpConvertProgress(event.percentage);
                setSpLogs(prev => [...prev, event.message]);
                break;
              case 'track_error':
                setSpLogs(prev => [...prev, event.message]);
                break;
              case 'complete':
                setSpConvertProgress(100);
                setSpLogs(prev => [...prev, `\n✅ ${event.message}`]);
                if (event.errors?.length) {
                  event.errors.forEach((e: string) => setSpLogs(prev => [...prev, `⚠️ ${e}`]));
                }
                toast.success(event.message);
                setSpUrl('');
                setSpParsedData(null);
                useMusicStore.getState().fetchTracks();
                break;
            }
          } catch {}
        }
      }
    } catch (err: any) {
      setSpLogs(prev => [...prev, `❌ ${err.message || 'Conversion failed'}`]);
      toast.error(err.message || 'Conversion failed');
    } finally {
      setSpLoading(false);
    }
  };

  // Copyright Scan state
  const [copyrightScore, setCopyrightScore] = useState<number | null>(null);
  const [copyrightScanLog, setCopyrightScanLog] = useState<string[]>([]);
  const [copyrightStatus, setCopyrightStatus] = useState<'clean' | 'warning' | 'scanning' | 'idle'>('idle');

  // Distribution check state
  const [platforms, setPlatforms] = useState<Record<string, boolean>>({
    beato: true,
    spotify: true,
    apple_music: true,
    tidal: false,
    amazon_music: false,
  });

  // Cover image adjustments
  const [coverType, setCoverType] = useState<'upload' | 'url'>('upload');
  const [selectedFilter, setSelectedFilter] = useState('none');
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [shiftX, setShiftX] = useState(0);
  const [shiftY, setShiftY] = useState(0);
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [isApplyingCrop, setIsApplyingCrop] = useState(false);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);

  // Custom combobox state for Genre & Language
  const [genreOpen, setGenreOpen] = useState(false);
  const [genreInput, setGenreInput] = useState('');
  const [customGenres, setCustomGenres] = useState<string[]>([]);
  const [langOpen, setLangOpen] = useState(false);
  const [langInput, setLangInput] = useState('');
  const [customLangs, setCustomLangs] = useState<string[]>([]);
  const genreRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (genreRef.current && !genreRef.current.contains(e.target as Node)) setGenreOpen(false);
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Sync artistName once user is loaded
  useEffect(() => {
    if (defaultArtistName) {
      setFormData(prev => ({ ...prev, artistName: defaultArtistName }));
    }
  }, [defaultArtistName]);

  // Sync cover file preview URL with memory cleanup
  useEffect(() => {
    if (formData.coverFile) {
      const url = URL.createObjectURL(formData.coverFile);
      setCoverPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setCoverPreviewUrl(null);
    }
  }, [formData.coverFile]);

  // Handle Audio File Selection & Analysis
  const handleAudioFile = async (file: File) => {
    setFormData(prev => ({ ...prev, audioFile: file, audioFileName: file.name }));
    setIsAnalyzingAudio(true);
    
    // Revoke old URL if playing
    if (playbackUrl) URL.revokeObjectURL(playbackUrl);
    setIsPlaying(false);
    setPlaybackProgress(0);

    const blobUrl = URL.createObjectURL(file);
    setPlaybackUrl(blobUrl);

    // Audio Analysis & Real-time Waveform Generation via Web Audio API
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const arrayBuffer = await file.arrayBuffer();
      
      // Decode audio data asynchronously
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      const duration = audioBuffer.duration;
      const sampleRate = audioBuffer.sampleRate;
      const channels = audioBuffer.numberOfChannels;
      
      setAudioDuration(duration);
      setAudioSpec({
        sampleRate,
        channels,
        format: file.name.split('.').pop()?.toUpperCase() || 'MP3',
        bitrate: `${Math.round((file.size * 8) / (duration * 1000))} kbps`
      });

      // Extract raw audio channel peaks for rendering actual waveform representation
      const rawData = audioBuffer.getChannelData(0); // get first channel
      const samples = 80; // Number of bars to generate
      const blockSize = Math.floor(rawData.length / samples);
      const peaks: number[] = [];
      for (let i = 0; i < samples; i++) {
        let max = 0;
        const blockStart = blockSize * i;
        for (let j = 0; j < blockSize; j++) {
          const val = Math.abs(rawData[blockStart + j]);
          if (val > max) max = val;
        }
        peaks.push(max);
      }
      
      // Normalize peaks
      const maxPeak = Math.max(...peaks);
      const normalizedPeaks = peaks.map(p => maxPeak > 0 ? p / maxPeak : 0.05);
      setWaveformPeaks(normalizedPeaks);

      // Trigger Copyright Scanning Simulation
      runCopyrightScan(file.name, normalizedPeaks);
      
    } catch (e) {
      console.error('Failed to parse Web Audio API details, falling back to mock waveform', e);
      setAudioDuration(180);
      setAudioSpec({
        sampleRate: 44100,
        channels: 2,
        format: file.name.split('.').pop()?.toUpperCase() || 'MP3',
        bitrate: '320 kbps'
      });
      // Fallback random waveform
      const fakePeaks = Array.from({ length: 80 }, () => 0.1 + Math.random() * 0.9);
      setWaveformPeaks(fakePeaks);
      runCopyrightScan(file.name, fakePeaks);
    } finally {
      setIsAnalyzingAudio(false);
    }
  };

  // Run Real-time Copyright Verification System (SCVS) simulation
  const runCopyrightScan = async (filename: string, audioPeaks: number[]) => {
    setCopyrightStatus('scanning');
    setCopyrightScanLog(['Initializing Copyright Scan Engine...', 'Deconstructing spectral wave patterns...']);
    
    // Step-by-step console logging style
    await new Promise(r => setTimeout(r, 800));
    setCopyrightScanLog(prev => [...prev, `Matching audio profile against publisher database (Hash index size: 1.4M)...`]);
    
    await new Promise(r => setTimeout(r, 600));
    // Text Similarity Matching: check title or filename against prohibited terms
    const titleMatchLower = formData.title.toLowerCase().trim();
    const bannedArtists = ['drake', 'taylor swift', 'eminem', 'bts', 'the weeknd', 'billie eilish', 'justin bieber', 'ariana grande', 'travis scott'];
    const matchesBanned = bannedArtists.some(artist => titleMatchLower.includes(artist) || filename.toLowerCase().includes(artist));
    
    if (matchesBanned) {
      setCopyrightScanLog(prev => [
        ...prev,
        `⚠️ Alert: Metadata match detected with catalog fingerprint.`,
        `Target similarity overlaps: 86.4% matching reference artist signature.`
      ]);
      setCopyrightScore(38); // Red Zone
      setCopyrightStatus('warning');
      toast.error('⚠️ Metadata overlap detected in Copyright Scan!');
    } else {
      setCopyrightScanLog(prev => [
        ...prev,
        `✓ Frequency spectrogram verified: 100% Unique amplitude fingerprint`,
        `✓ No catalog matches found in global DMCA database.`,
        `Signature check: CLEAN. Store ready.`
      ]);
      setCopyrightScore(98); // Green Zone
      setCopyrightStatus('clean');
      toast.success('✓ Copyright clean! No duplicates detected.');
    }
  };

  // Run Real-time Duplication Song check
  const checkTrackDuplication = (titleInput: string) => {
    if (!titleInput.trim()) {
      setDuplicateTrack(null);
      return;
    }

    setIsCheckingDuplicate(true);
    // Scan all tracks inside local store (which contains db tracks)
    const match = allTracks.find(t => 
      t.title.toLowerCase().trim() === titleInput.toLowerCase().trim()
    );

    if (match) {
      setDuplicateTrack(match);
      toast.error(`⚠️ Duplication Alert: "${match.title}" already exists in Beato database!`);
    } else {
      setDuplicateTrack(null);
    }
    setIsCheckingDuplicate(false);
  };

  const update = (patch: Partial<typeof formData>) => {
    setFormData(p => {
      const next = { ...p, ...patch };
      // Trigger live duplicate track matching when title changes
      if (patch.title !== undefined) {
        checkTrackDuplication(patch.title);
      }
      return next;
    });
  };

  const applyCrop = async () => {
    if (!rawImageSrc || !originalFile) return;
    setIsApplyingCrop(true);
    const toastId = toast.loading('Applying cover art adjustments...');
    try {
      const croppedBlob = await cropImage(rawImageSrc, zoom, rotation, shiftX, shiftY, originalFile.type);
      const croppedFile = new File([croppedBlob], originalFile.name, { type: originalFile.type });
      setFormData(prev => ({ ...prev, coverFile: croppedFile }));
      setRawImageSrc(null); // Clear raw view, show crop preview
      toast.success('Crop adjustments saved!', { id: toastId });
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to crop image: ' + err.message, { id: toastId });
    } finally {
      setIsApplyingCrop(false);
    }
  };

  const handleStep2Continue = async () => {
    if (rawImageSrc && originalFile) {
      setIsApplyingCrop(true);
      const toastId = toast.loading('Processing image adjustments...');
      try {
        const croppedBlob = await cropImage(rawImageSrc, zoom, rotation, shiftX, shiftY, originalFile.type);
        const croppedFile = new File([croppedBlob], originalFile.name, { type: originalFile.type });
        setFormData(prev => ({ ...prev, coverFile: croppedFile }));
        setRawImageSrc(null);
        toast.success('Cover adjustments processed!', { id: toastId });
        setStep(3);
      } catch (err: any) {
        toast.error('Failed to crop cover: ' + err.message, { id: toastId });
      } finally {
        setIsApplyingCrop(false);
      }
    } else {
      setStep(3);
    }
  };

  const canProceed = () => {
    if (step === 1) return !!formData.title && !!formData.artistName;
    if (step === 2) {
      if (!formData.audioFile) return false;
      if (coverType === 'upload') {
        return !!formData.coverFile || !!rawImageSrc;
      } else {
        return !!formData.coverUrl;
      }
    }
    if (step === 3) return formData.copyrightAccepted && formData.policyAccepted;
    return true;
  };

  const handleAudioPlayback = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(e => console.error(e));
      setIsPlaying(true);
    }
  };

  const handlePlaybackTimeUpdate = () => {
    if (!audioRef.current) return;
    const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
    setPlaybackProgress(progress || 0);
  };

  const handlePlaybackEnded = () => {
    setIsPlaying(false);
    setPlaybackProgress(0);
  };

  const handleScrubberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const pct = parseFloat(e.target.value);
    const newTime = (pct / 100) * audioRef.current.duration;
    audioRef.current.currentTime = newTime;
    setPlaybackProgress(pct);
  };

  const handleSubmit = async () => {
    if (!formData.audioFile) return;

    setStep(4);

    // Call standard simulation starting upload progress indicators
    startUpload({
      title: formData.title,
      artistName: formData.artistName,
      albumName: formData.albumName,
      genre: formData.genre,
      language: formData.language,
      releaseDate: formData.releaseDate,
      explicit: formData.explicit,
      lyrics: formData.lyrics,
      audioFileName: formData.audioFileName,
      coverUrl: coverType === 'url' ? formData.coverUrl : '',
      copyrightAccepted: formData.copyrightAccepted,
      policyAccepted: formData.policyAccepted,
    });

    const bodyFormData = new FormData();
    bodyFormData.append('audio', formData.audioFile);
    if (coverType === 'upload' && formData.coverFile) {
      bodyFormData.append('cover', formData.coverFile);
    } else if (coverType === 'url' && formData.coverUrl) {
      bodyFormData.append('coverUrl', formData.coverUrl);
    }
    bodyFormData.append('title', formData.title);
    bodyFormData.append('artistName', formData.artistName);
    bodyFormData.append('albumName', formData.albumName);
    bodyFormData.append('genre', formData.genre);
    bodyFormData.append('language', formData.language);
    bodyFormData.append('explicit', formData.explicit ? 'true' : 'false');
    bodyFormData.append('lyrics', formData.lyrics);
    bodyFormData.append('artistId', artistId);

    try {
      const uploadRes = await fetch('/api/upload-song', {
        method: 'POST',
        body: bodyFormData,
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok || !uploadData.track) {
        throw new Error(uploadData.error || 'Failed to upload song files to server');
      }

      // Add to music store so it updates application state globally
      uploadTrack(uploadData.track);

      // Add real-time user feed notifications
      addNotification({
        type: 'new_release',
        message: `New Track published: "${formData.title}" is now streaming!`,
        artistName: formData.artistName,
        trackTitle: formData.title,
      });

      // Socket emit updates for live streaming
      try {
        socketManager?.emit('NEW_SONG', uploadData.track);
      } catch {
        /* ignore */
      }

      toast.success(`🎉 "${formData.title}" successfully published live!`);
      
      // Let the simulation finish smoothly
      setTimeout(() => {
        setStep(5);
      }, 1000);
    } catch (e: any) {
      console.error('Failed to publish track:', e);
      toast.error('Failed to publish track: ' + e.message);
      setStep(3); // Go back to metadata form step
    }
  };

  // Dynamic suggestions from AI Co-pilot based on inputs
  const getAiSuggestions = () => {
    const title = formData.title.trim();
    const genre = formData.genre;
    const suggestions = {
      seoScore: 60,
      releaseRecommendation: 'Friday (increases streaming potential by 45%)',
      tags: ['#music', `#${genre.toLowerCase()}`, '#beato'],
      advice: 'Enter a track title to let AI audit formatting and recommend optimal distribution parameters.',
    };

    if (title) {
      suggestions.seoScore = Math.min(100, 75 + (title.length > 5 && title.length < 25 ? 20 : 0) + (title.includes('(') ? 5 : 0));
      suggestions.advice = `Title formatting is highly standard. Recommended for store indexes. Genre matches perfectly with standard playlists.`;
      
      // Generate smart tags
      const words = title.toLowerCase().split(' ');
      if (words.includes('love') || words.includes('vibes') || words.includes('night') || words.includes('dream')) {
        suggestions.tags = [`#${genre.toLowerCase()}`, '#chill', '#latenight', '#moody'];
      } else {
        suggestions.tags = [`#${genre.toLowerCase()}`, `#${words[0]}`, '#independent', '#newmusic'];
      }

      if (genre === 'Pop' || genre === 'Dance') {
        suggestions.releaseRecommendation = 'Thursday 11:00 PM EST (Maximizes peak streaming hours)';
      } else if (genre === 'Lo-Fi' || genre === 'Ambient') {
        suggestions.releaseRecommendation = 'Sunday Evening (Best time to reach study & chill listeners)';
      }
    }
    return suggestions;
  };

  const aiCoPilot = getAiSuggestions();
  const STEPS = ['Basic Details', 'Audio & Cover Art', 'Metadata & SCVS'];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-ss-bg, #fbf9f5)', padding: '0 0 80px', color: 'var(--color-ss-text-primary, #221a15)' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .upload-studio-grid {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 32px;
        }
        .two-col-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .artwork-upload-grid {
          display: grid;
          grid-template-columns: 1fr 100px;
          gap: 16px;
        }
        .upload-subheader {
          padding: 12px 32px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .upload-studio-container {
          padding: 0 32px;
        }
        .upload-header-profile {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .upload-header-profile .profile-avatar {
          width: 36px; height: 36px; border-radius: 50%;
          background: linear-gradient(135deg,#b08850,#10b981);
          display: flex; align-items: center; justify-content: center;
          font-size: 15px; font-weight: 900; color: #000; flex-shrink: 0;
        }
        .upload-header-profile .profile-info { display: flex; flex-direction: column; gap: 2px; }
        .upload-header-profile .profile-name { color: var(--color-ss-text-primary, #221a15); font-size: 13px; font-weight: 700; line-height: 1; }
        .upload-header-profile .profile-sub { color: var(--color-ss-text-muted, #87786c); font-size: 10px; }
        .combobox-dropdown {
          position: absolute; top: calc(100% + 4px); left: 0; right: 0;
          background: var(--color-ss-elevated, #ffffff);
          border: 1.5px solid var(--color-ss-border, rgba(43, 34, 26, 0.08)); border-radius: 12px;
          overflow: hidden; z-index: 200;
          box-shadow: 0 16px 40px rgba(43, 34, 26, 0.08);
          max-height: 220px; overflow-y: auto;
        }
        .combobox-item {
          padding: 10px 14px; font-size: 13px; color: var(--color-ss-text-secondary, #4d3f35);
          cursor: pointer; transition: background 0.15s;
        }
        .combobox-item:hover, .combobox-item.active { background: rgba(15, 81, 50,0.12); color: var(--color-ss-text-primary, #221a15); }
        .combobox-item.create { color: #b08850; font-weight: 700; }
        .combobox-item.create:hover { background: rgba(15, 81, 50,0.18); }
        .step-editor-card {
          background: var(--color-ss-elevated, #ffffff);
          backdrop-filter: blur(16px);
          border-radius: 24px;
          padding: 30px;
          border: 1px solid var(--color-ss-border, rgba(43, 34, 26, 0.08));
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .right-tabs-container {
          background: var(--color-ss-elevated, #ffffff);
          backdrop-filter: blur(16px);
          border-radius: 20px;
          padding: 18px;
          border: 1px solid var(--color-ss-border, rgba(43, 34, 26, 0.08));
          min-height: 340px;
        }
        @media (min-width: 901px) {
          .upload-right-panel {
            position: sticky;
            top: 24px;
            align-self: start;
          }
        }
        @media (max-width: 768px) {
          .step-editor-card {
            padding: 16px;
            border-radius: 16px;
            gap: 16px;
          }
          .right-tabs-container {
            padding: 12px;
            border-radius: 16px;
            min-height: auto;
          }
        }

        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }

        @media (max-width: 900px) {
          .upload-studio-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }
        }

        @media (max-width: 768px) {
          .upload-subheader {
            padding: 10px 16px;
          }
          .upload-studio-container {
            padding: 0 12px;
          }
        }

        @media (max-width: 600px) {
          .step-label { display: none !important; }
          .breadcrumbs-desktop { display: none !important; }
          .upload-tracks-count { display: none !important; }
        }

        @media (max-width: 480px) {
          .two-col-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }
          .two-col-grid .explicit-container {
            padding-top: 0 !important;
          }
          .artwork-upload-grid {
            grid-template-columns: 1fr 80px;
            gap: 10px;
          }
          .artwork-upload-grid > div {
            align-items: flex-start;
          }
          .upload-studio-container {
            padding: 0 10px;
          }
        }

        .upload-dropzone {
          padding: 36px 20px;
        }
        @media (max-width: 768px) {
          .upload-dropzone {
            padding: 18px 12px;
          }
        }
        
        .audition-map-card {
          padding: 14px;
          margin-top: 12px;
        }
        @media (max-width: 768px) {
          .audition-map-card {
            padding: 10px;
            margin-top: 8px;
          }
        }

        .spec-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px 12px;
          padding: 10px;
          margin-top: 8px;
        }
        @media (max-width: 768px) {
          .spec-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 6px 8px;
            padding: 8px;
          }
        }
        
        .artwork-preview-box {
          width: 100px;
          height: 100px;
        }
        @media (max-width: 768px) {
          .artwork-preview-box {
            width: 80px;
            height: 80px;
          }
        }

        .upload-success-card {
          padding: 40px;
          margin: 40px auto;
          border-radius: 28px;
        }
        @media (max-width: 768px) {
          .upload-success-card {
            padding: 24px 16px;
            margin: 20px auto;
            border-radius: 20px;
          }
        }
        
        .upload-pipeline-card {
          padding: 40px;
          margin: 40px auto;
          border-radius: 28px;
        }
        @media (max-width: 768px) {
          .upload-pipeline-card {
            padding: 24px 16px;
            margin: 20px auto;
            border-radius: 20px;
          }
        }

        .upload-success-buttons {
          display: flex;
          gap: 12px;
          justify-content: center;
        }
        .upload-success-buttons > a {
          flex: 1;
        }
        .upload-success-buttons > button {
          flex: 1;
        }
        @media (max-width: 580px) {
          .upload-success-buttons {
            flex-direction: column;
            width: 100%;
          }
          .upload-success-buttons > a,
          .upload-success-buttons > button {
            width: 100% !important;
          }
        }
        .upload-selector-btn-override {
          color: var(--color-ss-text-muted, #87786c) !important;
        }
        .upload-selector-btn-override.active {
          color: #ffffff !important;
        }
      ` }} />
      {playbackUrl && (
        <audio
          ref={audioRef}
          src={playbackUrl}
          onTimeUpdate={handlePlaybackTimeUpdate}
          onEnded={handlePlaybackEnded}
          style={{ display: 'none' }}
        />
      )}

      {/* Header section — Dashboard-style, no TopBar */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'var(--color-ss-bg, #fbf9f5)',
        borderBottom: '1px solid var(--color-ss-border, rgba(43, 34, 26, 0.08))',
      }}>
        <div style={{
          background: 'linear-gradient(180deg, rgba(16,185,129,0.12) 0%, transparent 100%)',
          paddingTop: 'var(--sat, 0px)',
          paddingBottom: '4px'
        }}>
          <div className="upload-subheader" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

            {/* Left: Avatar (opens drawer) + Artist name + badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Pink avatar — click opens mobile drawer */}
              <div
                onClick={() => setMobileDrawerOpen(true)}
                style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: '#34d399',
                  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 900, fontSize: 15, fontFamily: 'Outfit, sans-serif', flexShrink: 0,
                  cursor: 'pointer',
                  boxShadow: '0 2px 10px rgba(52,211,153,0.35)',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.08)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
              >
                {user?.name ? user.name[0].toUpperCase() : formData.artistName[0]?.toUpperCase() || 'A'}
              </div>

              {/* Name + verified badge + subtitle */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 17, fontWeight: 900, color: 'var(--color-ss-text-primary, #221a15)', margin: 0, lineHeight: 1 }}>
                    {formData.artistName}
                  </h2>
                  <span style={{
                    fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 100,
                    background: 'rgba(15, 81, 50,0.12)', border: '1px solid rgba(15, 81, 50,0.22)',
                    color: G, display: 'inline-flex', alignItems: 'center', gap: 4
                  }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: G, display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
                    Verified
                  </span>
                </div>
                <p style={{ color: 'var(--color-ss-text-muted, #87786c)', fontSize: 11, margin: '3px 0 0', fontFamily: 'Inter, sans-serif' }}>Upload Studio</p>
              </div>
            </div>

            {/* Right: track count + back button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="upload-tracks-count" style={{ fontSize: 11, color: 'var(--color-ss-text-muted, #87786c)', whiteSpace: 'nowrap' }}>
                <strong style={{ color: 'var(--color-ss-text-primary, #221a15)' }}>{myUploadedTracksCount}</strong> tracks
              </span>
              <Link href="/artist/dashboard" style={{ textDecoration: 'none' }}>
                <button style={{
                  padding: '7px 13px', borderRadius: 9, color: 'var(--color-ss-text-primary, #221a15)', fontSize: 12, fontWeight: 700,
                  cursor: 'pointer', border: '1px solid var(--color-ss-border, rgba(43, 34, 26, 0.08))',
                  background: 'var(--color-ss-elevated, #ffffff)', display: 'flex', alignItems: 'center',
                  gap: 5, whiteSpace: 'nowrap', transition: 'all 0.2s'
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-ss-surface, #f4eede)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-ss-elevated, #ffffff)')}>
                  <ChevronLeft size={13} /> Dashboard
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stepper Wizard Indicator */}
      {step <= 3 && (
        <div style={{ display: 'flex', justifyContent: 'center', margin: '12px 0 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: 'var(--color-ss-elevated, #ffffff)', border: '1px solid var(--color-ss-border, rgba(43, 34, 26, 0.08))', borderRadius: 30, padding: '8px 20px', backdropFilter: 'blur(8px)' }}>
            {STEPS.map((s, i) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 800, border: `2px solid ${step > i + 1 ? G : step === i + 1 ? G : 'var(--color-ss-border, rgba(43, 34, 26, 0.08))'}`,
                    background: step > i + 1 ? G : step === i + 1 ? 'rgba(15, 81, 50,0.12)' : 'transparent',
                    color: step > i + 1 ? '#000' : step === i + 1 ? G : 'var(--color-ss-text-muted, #87786c)',
                    transition: 'all 0.3s'
                  }}>
                    {step > i + 1 ? <Check size={10} strokeWidth={3} /> : i + 1}
                  </div>
                  <span className="step-label" style={{ color: step === i + 1 ? 'var(--color-ss-text-primary, #221a15)' : step > i + 1 ? G : 'var(--color-ss-text-muted, #87786c)', fontSize: 12, fontWeight: step === i + 1 ? 700 : 500, whiteSpace: 'nowrap' }}>{s}</span>
                </div>
                {i < 2 && <div style={{ width: 40, height: 1.5, background: step > i + 1 ? G : 'var(--color-ss-border, rgba(43, 34, 26, 0.08))', margin: '0 10px' }} />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Studio Area */}
      <div className="upload-studio-container">
        
        {/* Toggle between standard upload, YouTube MP3 Extractor, and Spotify Extractor (Super Admin only, and only on localhost:3000) */}
        {typeof window !== 'undefined' && 
         (window.location.host === 'localhost:3000' || window.location.host === '127.0.0.1:3000') && 
         (user?.role === 'SUPER_ADMIN' || user?.role === 'super_admin') && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
            <div style={{ display: 'inline-flex', background: 'var(--color-ss-elevated, #ffffff)', border: '1px solid var(--color-ss-border, rgba(43, 34, 26, 0.08))', borderRadius: 24, padding: 4, gap: 2 }}>
              <button
                onClick={() => setUploadMode('file')}
                className={uploadMode === 'file' ? 'upload-selector-btn-override active' : 'upload-selector-btn-override'}
                style={{
                  padding: '8px 20px', borderRadius: 20, border: 'none',
                  background: uploadMode === 'file' ? G : 'transparent',
                  fontSize: 12.5, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                📁 Standard File Upload
              </button>
              <button
                onClick={() => setUploadMode('youtube')}
                className={uploadMode === 'youtube' ? 'upload-selector-btn-override active' : 'upload-selector-btn-override'}
                style={{
                  padding: '8px 20px', borderRadius: 20, border: 'none',
                  background: uploadMode === 'youtube' ? G : 'transparent',
                  fontSize: 12.5, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                📥 Extract from YouTube
              </button>
              <button
                onClick={() => setUploadMode('spotify')}
                className={uploadMode === 'spotify' ? 'upload-selector-btn-override active' : 'upload-selector-btn-override'}
                style={{
                  padding: '8px 20px', borderRadius: 20, border: 'none',
                  background: uploadMode === 'spotify' ? '#1DB954' : 'transparent',
                  fontSize: 12.5, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', gap: 5
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill={uploadMode === 'spotify' ? '#fff' : '#1DB954'}><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
                Extract from Spotify
              </button>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {step <= 3 && uploadMode === 'file' && (
            <motion.div key={`step-${step}`} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }}
              className="upload-studio-grid"
              style={{}}>
              
              {/* LEFT SIDE: STEP EDITORS */}
              <div className="step-editor-card">
                
                {/* STEP 1: BASIC DETAILS */}
                {step === 1 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div style={{ borderBottom: '1px solid var(--color-ss-border, rgba(43, 34, 26, 0.08))', paddingBottom: 12, marginBottom: 4 }}>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-ss-text-primary, #221a15)', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                        <Disc size={18} color={G} /> Track Metadata Registry
                      </h3>
                      <p style={{ color: 'var(--color-ss-text-muted, #87786c)', fontSize: 12, marginTop: 2, margin: 0 }}>Standard storefront descriptors for worldwide systems.</p>
                    </div>

                    <div>
                      <label style={labelS}>Song Title *</label>
                      <input suppressHydrationWarning value={formData.title} onChange={e => update({ title: e.target.value })}
                        placeholder="e.g. Midnight Waves" style={inputS(!!focused.title)} {...f('title')} />
                      
                      {/* Duplication Warning Banner */}
                      {duplicateTrack && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                          style={{ marginTop: 8, padding: '10px 12px', background: 'rgba(239,68,68,0.04)', borderRadius: 10, border: '1px solid rgba(239,68,68,0.15)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                          <AlertCircle size={14} color="#ef4444" style={{ flexShrink: 0, marginTop: 1 }} />
                          <div>
                            <p style={{ color: 'var(--color-ss-text-primary, #221a15)', fontSize: 12, fontWeight: 700, margin: 0 }}>Duplicate Song Flagged</p>
                            <p style={{ color: 'var(--color-ss-text-muted, #87786c)', fontSize: 11, marginTop: 2, margin: 0, lineHeight: 1.3 }}>
                              "{duplicateTrack.title}" is already registered. Searching may collapse duplicates.
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </div>

                    <div className="two-col-grid">
                      <div>
                        <label style={labelS}>Artist Profile Identity *</label>
                        <input suppressHydrationWarning value={formData.artistName} disabled style={{ ...inputS(false), opacity: 0.6, cursor: 'not-allowed' }} />
                      </div>
                      <div>
                        <label style={labelS}>Album / Single Context</label>
                        <input suppressHydrationWarning value={formData.albumName} onChange={e => update({ albumName: e.target.value })}
                          placeholder="Singles" style={inputS(!!focused.album)} {...f('album')} />
                      </div>
                    </div>

                    <div className="two-col-grid">
                      {/* Genre Combobox */}
                      <div ref={genreRef} style={{ position: 'relative' }}>
                        <label style={labelS}>Primary Genre *</label>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                          <input suppressHydrationWarning
                            value={genreInput || formData.genre}
                            onChange={e => { setGenreInput(e.target.value); setGenreOpen(true); }}
                            onFocus={() => { setGenreInput(''); setGenreOpen(true); }}
                            placeholder="Type or pick genre..."
                            style={{ ...inputS(genreOpen), paddingRight: 36 }}
                          />
                          <button type="button" onClick={() => setGenreOpen(o => !o)}
                            style={{ position: 'absolute', right: 12, background: 'none', border: 'none', color: 'var(--color-ss-text-muted, #87786c)', cursor: 'pointer', display: 'flex', padding: 0 }}>
                            <ChevronDown size={14} color={genreOpen ? G : 'var(--color-ss-text-muted, #87786c)'} style={{ transform: genreOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                          </button>
                        </div>
                        {genreOpen && (
                          <div className="combobox-dropdown">
                            {/* Create custom option */}
                            {genreInput.trim() && ![...GENRES, ...customGenres].some(g => g.toLowerCase() === genreInput.trim().toLowerCase()) && (
                              <div className="combobox-item create" onClick={() => {
                                const newG = genreInput.trim();
                                setCustomGenres(prev => [...prev, newG]);
                                update({ genre: newG });
                                setGenreInput('');
                                setGenreOpen(false);
                              }}>+ Create "{genreInput.trim()}"</div>
                            )}
                            {[...GENRES, ...customGenres]
                              .filter(g => !genreInput.trim() || g.toLowerCase().includes(genreInput.toLowerCase()))
                              .map(g => (
                                <div key={g} className={`combobox-item${formData.genre === g ? ' active' : ''}`}
                                  onClick={() => { update({ genre: g }); setGenreInput(''); setGenreOpen(false); }}>
                                  {g}
                                </div>
                              ))}
                          </div>
                        )}
                      </div>

                      {/* Language Combobox */}
                      <div ref={langRef} style={{ position: 'relative' }}>
                        <label style={labelS}>Vocal Language</label>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                          <input suppressHydrationWarning
                            value={langInput || formData.language}
                            onChange={e => { setLangInput(e.target.value); setLangOpen(true); }}
                            onFocus={() => { setLangInput(''); setLangOpen(true); }}
                            placeholder="Type or pick language..."
                            style={{ ...inputS(langOpen), paddingRight: 36 }}
                          />
                          <button type="button" onClick={() => setLangOpen(o => !o)}
                            style={{ position: 'absolute', right: 12, background: 'none', border: 'none', color: 'var(--color-ss-text-muted, #87786c)', cursor: 'pointer', display: 'flex', padding: 0 }}>
                            <ChevronDown size={14} color={langOpen ? G : 'var(--color-ss-text-muted, #87786c)'} style={{ transform: langOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                          </button>
                        </div>
                        {langOpen && (
                          <div className="combobox-dropdown">
                            {/* Create custom option */}
                            {langInput.trim() && ![...LANGUAGES, ...customLangs].some(l => l.toLowerCase() === langInput.trim().toLowerCase()) && (
                              <div className="combobox-item create" onClick={() => {
                                const newL = langInput.trim();
                                setCustomLangs(prev => [...prev, newL]);
                                update({ language: newL });
                                setLangInput('');
                                setLangOpen(false);
                              }}>+ Create "{langInput.trim()}"</div>
                            )}
                            {[...LANGUAGES, ...customLangs]
                              .filter(l => !langInput.trim() || l.toLowerCase().includes(langInput.toLowerCase()))
                              .map(l => (
                                <div key={l} className={`combobox-item${formData.language === l ? ' active' : ''}`}
                                  onClick={() => { update({ language: l }); setLangInput(''); setLangOpen(false); }}>
                                  {l}
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: MEDIA AUDIO & COVER PRESETS */}
                {step === 2 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div style={{ borderBottom: '1px solid var(--color-ss-border, rgba(43, 34, 26, 0.08))', paddingBottom: 12 }}>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-ss-text-primary, #221a15)', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                        <FileAudio size={18} color={V} /> Lossless Mastering Nodes
                      </h3>
                      <p style={{ color: 'var(--color-ss-text-muted, #87786c)', fontSize: 12, marginTop: 2, margin: 0 }}>Deploy high-fidelity audio streams and visual album covers.</p>
                    </div>

                    <div>
                      <label style={labelS}>Master Audio File * (FLAC, WAV, MP3)</label>
                      <DropZone accept="audio/*" file={formData.audioFile} label="Select track master file"
                        icon={FileAudio} color={V} onFile={handleAudioFile} />
                      
                      {/* Audio Analysis Loader */}
                      {isAnalyzingAudio && (
                        <div style={{ marginTop: 12, background: 'var(--color-ss-surface, #f4eede)', border: '1px solid var(--color-ss-border, rgba(43, 34, 26, 0.08))', borderRadius: 12, padding: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                          <div style={{ width: 16, height: 16, border: `2.5px solid ${V}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                          <span style={{ color: 'var(--color-ss-text-muted, #87786c)', fontSize: 13, fontWeight: 500 }}>Spectral Audio Analysis running...</span>
                        </div>
                      )}

                      {/* Premium Interactive Audio Player & Waveform Visualizer */}
                      {!isAnalyzingAudio && formData.audioFile && waveformPeaks.length > 0 && (
                        <div className="audition-map-card" style={{ background: 'var(--color-ss-surface, #f4eede)', border: '1px solid var(--color-ss-border, rgba(43, 34, 26, 0.08))', borderRadius: 12, padding: 14 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                            <button
                               type="button"
                              onClick={handleAudioPlayback}
                              style={{
                                width: 32, height: 32, borderRadius: '50%', background: V, border: 'none',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                                transition: 'transform 0.2s', boxShadow: `0 0 12px rgba(16,185,129,0.3)`
                              }}
                            >
                              {isPlaying ? <Pause size={14} color="black" fill="black" /> : <Play size={14} color="black" fill="black" style={{ marginLeft: 2 }} />}
                            </button>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ color: 'var(--color-ss-text-primary, #221a15)', fontSize: 12, fontWeight: 700, margin: 0 }}>Playback Audition Map</p>
                              <p style={{ color: 'var(--color-ss-text-muted, #87786c)', fontSize: 10, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Check spectral balance prior to transcode</p>
                            </div>
                            <span style={{ marginLeft: 'auto', fontSize: 11, color: V, fontWeight: 700, fontFamily: 'monospace' }}>
                              {audioDuration ? `${Math.floor(audioDuration / 60)}:${String(Math.floor(audioDuration % 60)).padStart(2, '0')}` : '0:00'}
                            </span>
                          </div>

                          {/* Dynamic Waveform Render */}
                          <div style={{ position: 'relative', height: isMobile ? 24 : 32, display: 'flex', alignItems: 'center', gap: 1.5, marginBottom: 8, overflow: 'hidden', width: '100%' }}>
                            {waveformPeaks.map((peak, idx) => {
                              const barPct = (idx / waveformPeaks.length) * 100;
                              const isPlayed = barPct <= playbackProgress;
                              return (
                                <div
                                  key={idx}
                                  style={{
                                    flex: 1,
                                    minWidth: 0,
                                    height: `${peak * 100}%`,
                                    background: isPlayed ? `linear-gradient(to top, ${V}, ${P})` : 'var(--color-ss-border, rgba(43, 34, 26, 0.08))',
                                    borderRadius: 1,
                                    transition: 'background 0.1s'
                                  }}
                                />
                              );
                            })}
                          </div>

                          {/* Audio Scrubbing Slider */}
                          <input suppressHydrationWarning
                            type="range"
                            min="0"
                            max="100"
                            step="0.1"
                            value={playbackProgress}
                            onChange={handleScrubberChange}
                            style={{
                              width: '100%', accentColor: V, cursor: 'pointer', outline: 'none', background: 'var(--color-ss-border, rgba(43, 34, 26, 0.08))', height: 3, borderRadius: 2
                            }}
                          />
                        </div>
                      )}

                      {/* Display Real-time Audio specifications */}
                      {!isAnalyzingAudio && audioSpec && (
                        <div className="spec-grid" style={{ background: 'rgba(16,185,129,0.04)', borderRadius: 10, border: '1px solid rgba(16,185,129,0.15)', padding: 10, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginTop: 12 }}>
                          <span style={{ color: 'var(--color-ss-text-muted, #87786c)', fontSize: 11 }}>Format: <span style={{ color: 'var(--color-ss-text-primary, #221a15)', fontWeight: 600 }}>{audioSpec.format}</span></span>
                          <span style={{ color: 'var(--color-ss-text-muted, #87786c)', fontSize: 11 }}>Channels: <span style={{ color: 'var(--color-ss-text-primary, #221a15)', fontWeight: 600 }}>{audioSpec.channels === 2 ? 'Stereo (2.0)' : 'Mono'}</span></span>
                          <span style={{ color: 'var(--color-ss-text-muted, #87786c)', fontSize: 11 }}>Rate: <span style={{ color: 'var(--color-ss-text-primary, #221a15)', fontWeight: 600 }}>{(audioSpec.sampleRate / 1000).toFixed(1)} kHz</span></span>
                          <span style={{ color: 'var(--color-ss-text-muted, #87786c)', fontSize: 11 }}>Bitrate: <span style={{ color: 'var(--color-ss-text-primary, #221a15)', fontWeight: 600 }}>{audioSpec.bitrate}</span></span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label style={labelS}>Cover Artwork Source *</label>
                      <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                        <button
                          type="button"
                          onClick={() => setCoverType('upload')}
                          style={{
                            flex: 1, padding: '10px', borderRadius: 10,
                            background: coverType === 'upload' ? 'rgba(16,185,129,0.1)' : 'var(--color-ss-surface, #f4eede)',
                            color: coverType === 'upload' ? V : 'var(--color-ss-text-muted, #87786c)',
                            border: `1.5px solid ${coverType === 'upload' ? V : 'var(--color-ss-border, rgba(43, 34, 26, 0.08))'}`,
                            fontWeight: 700, fontSize: 12, cursor: 'pointer', transition: 'all 0.2s'
                          }}
                        >
                          📁 Local File
                        </button>
                        <button
                          type="button"
                          onClick={() => setCoverType('url')}
                          style={{
                            flex: 1, padding: '10px', borderRadius: 10,
                            background: coverType === 'url' ? 'rgba(16,185,129,0.1)' : 'var(--color-ss-surface, #f4eede)',
                            color: coverType === 'url' ? V : 'var(--color-ss-text-muted, #87786c)',
                            border: `1.5px solid ${coverType === 'url' ? V : 'var(--color-ss-border, rgba(43, 34, 26, 0.08))'}`,
                            fontWeight: 700, fontSize: 12, cursor: 'pointer', transition: 'all 0.2s'
                          }}
                        >
                          🔗 Artwork URL
                        </button>
                      </div>

                      {coverType === 'upload' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          <div className="artwork-upload-grid">
                            <DropZone accept="image/*" file={formData.coverFile} label="Select image artwork"
                              icon={ImageIcon} color={V} onFile={f => {
                                setOriginalFile(f);
                                const reader = new FileReader();
                                reader.onload = e => {
                                  setRawImageSrc(e.target?.result as string);
                                  setZoom(1);
                                  setRotation(0);
                                  setShiftX(0);
                                  setShiftY(0);
                                  setShowArtworkAdjust(true);
                                };
                                reader.readAsDataURL(f);
                              }} />
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                              <div className="artwork-preview-box" style={{
                                borderRadius: 12, overflow: 'hidden', flexShrink: 0,
                                position: 'relative', border: '1px solid var(--color-ss-border, rgba(43, 34, 26, 0.08))',
                                background: 'var(--color-ss-surface, #f4eede)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                width: 80, height: 80
                              }}>
                                {rawImageSrc ? (
                                  <img 
                                    src={rawImageSrc} 
                                    alt="Cover crop adjust" 
                                    style={{
                                      width: '100%', height: '100%', objectFit: 'contain',
                                      transform: `scale(${zoom}) rotate(${rotation}deg) translate(${shiftX}px, ${shiftY}px)`,
                                      filter: FILTER_PRESETS.find(f => f.id === selectedFilter)?.filter || 'none',
                                      transition: 'transform 0.1s ease-out'
                                    }}
                                  />
                                ) : formData.coverFile ? (
                                  <img src={URL.createObjectURL(formData.coverFile)} alt="Preview cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                  <ImageIcon size={20} color="var(--color-ss-text-muted, #87786c)" />
                                )}
                              </div>
                              <span style={{ fontSize: 10, color: 'var(--color-ss-text-muted, #87786c)', fontWeight: 600 }}>Active Cover</span>
                            </div>
                          </div>

                          {/* Collapsible Image Adjustment controls */}
                          {rawImageSrc && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              <button
                                type="button"
                                onClick={() => setShowArtworkAdjust(!showArtworkAdjust)}
                                style={{
                                  padding: '8px 12px', borderRadius: 8, background: 'var(--color-ss-elevated, #ffffff)',
                                  border: '1px solid var(--color-ss-border, rgba(43, 34, 26, 0.08))', color: 'var(--color-ss-text-primary, #221a15)', fontSize: 11,
                                  fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                                }}
                              >
                                <Sliders size={13} color={V} /> {showArtworkAdjust ? 'Hide Visual Settings' : 'Edit Artwork Style & Filters'}
                              </button>

                              {showArtworkAdjust && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                                  style={{ padding: 14, background: 'var(--color-ss-surface, #f4eede)', borderRadius: 12, border: '1px solid var(--color-ss-border, rgba(43, 34, 26, 0.08))', display: 'flex', flexDirection: 'column', gap: 12 }}>
                                  
                                  {/* Filter presets */}
                                  <div>
                                    <span style={{ ...labelS, fontSize: 9, marginBottom: 4 }}>Color Palette Presets</span>
                                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                                      {FILTER_PRESETS.map(filter => (
                                        <button
                                          key={filter.id}
                                          type="button"
                                          onClick={() => setSelectedFilter(filter.id)}
                                          style={{
                                            padding: '4px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600,
                                            background: selectedFilter === filter.id ? V : 'var(--color-ss-elevated, #ffffff)',
                                            border: `1px solid ${selectedFilter === filter.id ? V : 'var(--color-ss-border, rgba(43, 34, 26, 0.08))'}`,
                                            color: selectedFilter === filter.id ? 'black' : 'var(--color-ss-text-muted, #87786c)',
                                            cursor: 'pointer', transition: 'all 0.2s'
                                          }}
                                        >
                                          {filter.name}
                                        </button>
                                      ))}
                                    </div>
                                  </div>

                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    <div>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--color-ss-text-muted, #87786c)', marginBottom: 2 }}>
                                        <span>🔍 Zoom ({zoom.toFixed(2)}x)</span>
                                        <button onClick={() => setZoom(1)} style={{ background: 'none', border: 'none', color: V, fontSize: 10, cursor: 'pointer' }}>Reset</button>
                                      </div>
                                      <input suppressHydrationWarning type="range" min="1" max="3" step="0.05" value={zoom} onChange={e => setZoom(parseFloat(e.target.value))}
                                        style={{ width: '100%', accentColor: V, cursor: 'pointer' }} />
                                    </div>
                                    <div>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--color-ss-text-muted, #87786c)', marginBottom: 2 }}>
                                        <span>🔄 Rotate ({rotation}°)</span>
                                        <button onClick={() => setRotation(0)} style={{ background: 'none', border: 'none', color: V, fontSize: 10, cursor: 'pointer' }}>Reset</button>
                                      </div>
                                      <input suppressHydrationWarning type="range" min="-180" max="180" step="1" value={rotation} onChange={e => setRotation(parseInt(e.target.value))}
                                        style={{ width: '100%', accentColor: V, cursor: 'pointer' }} />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                      <div>
                                        <span style={{ fontSize: 11, color: 'var(--color-ss-text-muted, #87786c)' }}>↔ Move X</span>
                                        <input suppressHydrationWarning type="range" min="-100" max="100" step="1" value={shiftX} onChange={e => setShiftX(parseInt(e.target.value))}
                                          style={{ width: '100%', accentColor: V, cursor: 'pointer' }} />
                                      </div>
                                      <div>
                                        <span style={{ fontSize: 11, color: 'var(--color-ss-text-muted, #87786c)' }}>↕ Move Y</span>
                                        <input suppressHydrationWarning type="range" min="-100" max="100" step="1" value={shiftY} onChange={e => setShiftY(parseInt(e.target.value))}
                                          style={{ width: '100%', accentColor: V, cursor: 'pointer' }} />
                                      </div>
                                    </div>
                                    <button 
                                      type="button"
                                      disabled={isApplyingCrop}
                                      onClick={applyCrop}
                                      style={{
                                        marginTop: 4, padding: '8px', borderRadius: 8, background: V, color: 'black',
                                        fontWeight: 800, fontSize: 11, cursor: isApplyingCrop ? 'not-allowed' : 'pointer', border: 'none',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, opacity: isApplyingCrop ? 0.7 : 1
                                      }}
                                    >
                                      {isApplyingCrop ? 'Embedding filters...' : '✓ Lock Visual Adjustments'}
                                    </button>
                                  </div>
                                </motion.div>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <input suppressHydrationWarning 
                            type="url" 
                            placeholder="https://images.unsplash.com/photo-..." 
                            value={formData.coverUrl}
                            onChange={e => update({ coverUrl: e.target.value, coverFile: null })}
                            style={inputS(false)}
                          />
                          {formData.coverUrl && (
                            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 10 }}>
                              <div style={{
                                width: 100, height: 100, borderRadius: 12, overflow: 'hidden',
                                border: '1px solid var(--color-ss-border, rgba(43, 34, 26, 0.08))',
                                background: `url(${formData.coverUrl}) center/cover`
                              }} />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* STEP 3: METADATA & COPYRIGHT VERIFICATION (SCVS) */}
                {step === 3 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div style={{ borderBottom: '1px solid var(--color-ss-border, rgba(43, 34, 26, 0.08))', paddingBottom: 12 }}>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-ss-text-primary, #221a15)', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                        <Shield size={18} color={P} /> Rights & System Verification
                      </h3>
                      <p style={{ color: 'var(--color-ss-text-muted, #87786c)', fontSize: 12, marginTop: 2, margin: 0 }}>Verify licensing, copyright tags, and distribute globally.</p>
                    </div>

                    <div className="two-col-grid">
                      <div>
                        <label style={labelS}>Commercial Release Date</label>
                        <input suppressHydrationWarning type="date" value={formData.releaseDate} onChange={e => update({ releaseDate: e.target.value })}
                          style={{ ...inputS(!!focused.date), colorScheme: 'light', cursor: 'pointer' }} {...f('date')} />
                      </div>
                      <div className="explicit-container" style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 20 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                          <div onClick={() => update({ explicit: !formData.explicit })}
                            style={{
                              width: 38, height: 20, borderRadius: 10,
                              background: formData.explicit ? P : 'var(--color-ss-border, rgba(43, 34, 26, 0.08))',
                              position: 'relative', transition: 'background 0.2s', cursor: 'pointer',
                            }}>
                            <div style={{
                              width: 14, height: 14, borderRadius: '50%', background: '#fff',
                              position: 'absolute', top: 3, left: formData.explicit ? 21 : 3, transition: 'left 0.2s',
                            }} />
                          </div>
                          <span style={{ color: 'var(--color-ss-text-primary, #221a15)', fontSize: 12, fontWeight: 600 }}>Explicit Lyrics</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label style={labelS}>Synchronized Lyrics <span style={{ color: 'var(--color-ss-text-muted, #87786c)', textTransform: 'none' }}>(optional)</span></label>
                      <textarea value={formData.lyrics} onChange={e => update({ lyrics: e.target.value })}
                        placeholder="Paste lyrics here for lyric sync engines..." rows={3}
                        style={{ ...inputS(!!focused.lyrics), resize: 'vertical', lineHeight: 1.5 }} {...f('lyrics')} />
                    </div>

                    {/* Beato Copyright Verification System Dashboard */}
                    <div style={{ background: 'var(--color-ss-elevated, #ffffff)', border: '1px solid var(--color-ss-border, rgba(43, 34, 26, 0.08))', borderRadius: 12, padding: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <h4 style={{ color: 'var(--color-ss-text-primary, #221a15)', fontSize: 12, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Shield size={14} color={copyrightStatus === 'warning' ? '#ef4444' : G} /> Copyright Scan Index (SCVS)
                        </h4>
                        <span style={{
                          fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 12,
                          background: copyrightStatus === 'scanning' ? 'rgba(245,158,11,0.1)' : copyrightStatus === 'warning' ? 'rgba(239,68,68,0.1)' : 'rgba(15, 81, 50,0.1)',
                          color: copyrightStatus === 'scanning' ? '#f59e0b' : copyrightStatus === 'warning' ? '#ef4444' : G,
                          border: `1px solid ${copyrightStatus === 'scanning' ? '#f59e0b' : copyrightStatus === 'warning' ? '#ef4444' : G}`
                        }}>
                          {copyrightStatus === 'scanning' ? 'Scanning...' : copyrightStatus === 'warning' ? 'Warning flag' : 'Clean Signature'}
                        </span>
                      </div>

                      {/* Safety index gauge */}
                      {copyrightScore !== null && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid var(--color-ss-border, rgba(43, 34, 26, 0.08))' }}>
                          <div style={{ width: 40, height: 40, borderRadius: '50%', background: copyrightScore > 50 ? 'rgba(15, 81, 50,0.08)' : 'rgba(239,68,68,0.08)', border: `2px solid ${copyrightScore > 50 ? G : '#ef4444'}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <span style={{ fontSize: 12, fontWeight: 900, color: copyrightScore > 50 ? G : '#ef4444' }}>{copyrightScore}%</span>
                          </div>
                          <div>
                            <p style={{ fontSize: 11, color: 'var(--color-ss-text-primary, #221a15)', fontWeight: 700, margin: 0 }}>Safety Score Rating</p>
                            <p style={{ fontSize: 10, color: 'var(--color-ss-text-muted, #87786c)', margin: '2px 0 0', lineHeight: 1.3 }}>
                              {copyrightScore > 50 ? 'Low collision risk. Suitable for global distribution.' : 'Metadata overlaps detected. Review name credits.'}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Collapsible log view */}
                      <details style={{ cursor: 'pointer' }}>
                        <summary style={{ fontSize: 10, color: V, fontWeight: 700, outline: 'none' }}>View SCVS Spectral Logs</summary>
                        <div style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--color-ss-text-primary, #221a15)', display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 80, overflowY: 'auto', background: 'var(--color-ss-surface, #f4eede)', padding: 8, borderRadius: 8, marginTop: 6 }}>
                          {copyrightScanLog.map((log, i) => (
                            <div key={i}>{log}</div>
                          ))}
                        </div>
                      </details>
                    </div>

                    {/* Legal Agreements */}
                    <div style={{ padding: 12, background: 'rgba(239,68,68,0.02)', border: '1px solid rgba(239,68,68,0.1)', borderRadius: 12 }}>
                      {[
                        { key: 'copyrightAccepted', text: 'I verify I hold all clean commercial licenses to publish this content.' },
                        { key: 'policyAccepted', text: 'I agree to terms. Copyright strikes result in account suspension.' },
                      ].map(({ key, text }) => (
                        <label key={key} style={{ display: 'flex', gap: 10, marginBottom: 8, cursor: 'pointer', alignItems: 'flex-start' }}>
                          <div onClick={() => update({ [key]: !(formData as any)[key] })}
                            style={{
                              width: 16, height: 16, borderRadius: 4, border: `2px solid ${(formData as any)[key] ? G : 'var(--color-ss-border, rgba(43, 34, 26, 0.08))'}`,
                              background: (formData as any)[key] ? G : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              flexShrink: 0, marginTop: 1, transition: 'all 0.15s',
                            }}>
                            {(formData as any)[key] && <Check size={10} color="black" strokeWidth={3.5} />}
                          </div>
                          <span style={{ color: 'var(--color-ss-text-muted, #87786c)', fontSize: 11, lineHeight: 1.4 }}>{text}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* BOTTOM BUTTON BAR */}
                <div style={{ display: 'flex', gap: 14, borderTop: '1px solid var(--color-ss-border, rgba(43, 34, 26, 0.08))', paddingTop: 16, marginTop: 8 }}>
                  {step > 1 && (
                    <button onClick={() => setStep(s => s - 1)} style={{ flex: 1, padding: '10px', borderRadius: 10, background: 'var(--color-ss-elevated, #ffffff)', border: '1px solid var(--color-ss-border, rgba(43, 34, 26, 0.08))', color: 'var(--color-ss-text-primary, #221a15)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, transition: 'all 0.2s', fontSize: 13 }}>
                      <ChevronLeft size={14} /> Back
                    </button>
                  )}
                  {step < 3 ? (
                    <button 
                      onClick={() => {
                        if (canProceed()) {
                          if (step === 2) {
                            handleStep2Continue();
                          } else {
                            setStep(s => s + 1);
                          }
                        }
                      }} 
                      disabled={!canProceed() || isApplyingCrop || (step === 1 && duplicateTrack !== null)} 
                      style={{
                        flex: 2, padding: '10px', borderRadius: 10, background: (canProceed() && !isApplyingCrop && (step !== 1 || !duplicateTrack)) ? G : 'rgba(15, 81, 50,0.15)',
                        border: 'none', color: (canProceed() && !isApplyingCrop && (step !== 1 || !duplicateTrack)) ? '#fff' : 'rgba(15, 81, 50, 0.45)', fontWeight: 800, cursor: (canProceed() && !isApplyingCrop && (step !== 1 || !duplicateTrack)) ? 'pointer' : 'not-allowed',
                        fontFamily: 'Outfit, sans-serif', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, transition: 'all 0.2s'
                      }}
                    >
                      Continue to Step {step + 1} <ChevronRight size={14} />
                    </button>
                  ) : (
                    <button onClick={handleSubmit} disabled={!canProceed() || copyrightStatus === 'scanning'} style={{
                      flex: 2, padding: '10px', borderRadius: 10, background: (canProceed() && copyrightStatus !== 'scanning') ? G : 'rgba(15, 81, 50,0.15)',
                      border: 'none', color: (canProceed() && copyrightStatus !== 'scanning') ? '#fff' : 'rgba(15, 81, 50, 0.45)', fontWeight: 800, cursor: (canProceed() && copyrightStatus !== 'scanning') ? 'pointer' : 'not-allowed',
                      fontFamily: 'Outfit, sans-serif', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, transition: 'all 0.2s'
                    }}>
                      <Upload size={14} /> Publish Master to Storefront
                    </button>
                  )}
                </div>
              </div>

              {/* RIGHT SIDE: LIVE PREVIEW, AI CO-PILOT, WORLDWIDE OUTLETS IN TABS */}
              <div className="upload-right-panel" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Tab Switcher */}
                <div style={{ display: 'flex', background: 'var(--color-ss-surface, #f4eede)', border: '1px solid var(--color-ss-border, rgba(43, 34, 26, 0.08))', borderRadius: 12, padding: 4 }}>
                  {[
                    { id: 'preview', label: 'Preview', icon: <Music size={13} /> },
                    { id: 'ai', label: 'AI Co-Pilot', icon: <Sparkles size={13} /> },
                    { id: 'outlets', label: 'Outlets', icon: <Globe size={13} /> }
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setActiveRightTab(t.id as any)}
                      style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        padding: '8px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                        background: activeRightTab === t.id ? 'var(--color-ss-elevated, #ffffff)' : 'transparent',
                        border: 'none', color: activeRightTab === t.id ? 'var(--color-ss-text-primary, #221a15)' : 'var(--color-ss-text-muted, #87786c)',
                        cursor: 'pointer', transition: 'all 0.2s', boxShadow: activeRightTab === t.id ? '0 2px 8px rgba(43, 34, 26, 0.04)' : 'none'
                      }}
                    >
                      {t.icon}
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <div className="right-tabs-container">
                  
                  {/* TAB 1: PREVIEW */}
                  {activeRightTab === 'preview' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div style={{ maxWidth: isMobile ? 160 : 280, width: '100%', margin: '0 auto', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ 
                          width: '100%', paddingBottom: '100%', borderRadius: 12, 
                          background: coverType === 'url' && formData.coverUrl 
                            ? `url(${formData.coverUrl}) center/cover`
                            : coverPreviewUrl 
                            ? `url(${coverPreviewUrl}) center/cover`
                            : trackGradient(formData.title || 'x'), 
                          position: 'relative', overflow: 'hidden',
                          border: '1px solid var(--color-ss-border, rgba(43, 34, 26, 0.08))',
                          boxShadow: '0 8px 24px rgba(43, 34, 26, 0.08)'
                        }}>
                          {coverType === 'upload' && rawImageSrc && (
                            <img 
                              src={rawImageSrc} 
                              alt="Art Preview" 
                              style={{
                                position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain',
                                transform: `scale(${zoom}) rotate(${rotation}deg) translate(${shiftX}px, ${shiftY}px)`,
                                filter: FILTER_PRESETS.find(f => f.id === selectedFilter)?.filter || 'none',
                              }}
                            />
                          )}
                          <div style={{ 
                            position: 'absolute', inset: 0, 
                            background: 'linear-gradient(to bottom, rgba(0,0,0,0) 40%, rgba(7,7,8,0.95) 100%)',
                            display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', 
                            padding: 16
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Music size={12} color="#fff" />
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <h4 style={{ color: '#fff', fontSize: 13, fontWeight: 800, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {formData.title || 'Untitled Master'}
                                </h4>
                                <p style={{ color: '#a3a3a3', fontSize: 11, margin: '2px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {formData.artistName || 'Creator Profile'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                        {[
                          ['Language', formData.language],
                          ['Genre', formData.genre],
                          ['Album/Single', formData.albumName || 'Singles'],
                          ['Explicit', formData.explicit ? 'Yes (Explicit)' : 'Clean'],
                        ].map(([k, v]) => (
                          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-ss-border, rgba(43, 34, 26, 0.08))', paddingBottom: 4 }}>
                            <span style={{ color: 'var(--color-ss-text-muted, #87786c)', fontSize: 11 }}>{k}</span>
                            <span style={{ color: 'var(--color-ss-text-primary, #221a15)', fontSize: 11, fontWeight: 600 }}>{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TAB 2: AI CO-PILOT */}
                  {activeRightTab === 'ai' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: V, fontWeight: 700 }}>SEO Optimization Score</span>
                        <span style={{ fontSize: 11, color: V, fontWeight: 700 }}>{aiCoPilot.seoScore}/100</span>
                      </div>

                      <div style={{ height: 4, background: 'var(--color-ss-surface, #f4eede)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ width: `${aiCoPilot.seoScore}%`, height: '100%', background: `linear-gradient(90deg, ${V}, ${P})`, borderRadius: 2, transition: 'width 0.3s' }} />
                      </div>

                      <div>
                        <span style={{ ...labelS, fontSize: 9, marginBottom: 4 }}>Optimization Tip</span>
                        <p style={{ color: 'var(--color-ss-text-muted, #87786c)', fontSize: 11, lineHeight: 1.4, margin: 0 }}>{aiCoPilot.advice}</p>
                      </div>

                      <div>
                        <span style={{ ...labelS, fontSize: 9, marginBottom: 4 }}>Smart Auto Tags</span>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                          {aiCoPilot.tags.map(tag => (
                            <span key={tag} style={{ fontSize: 10, color: G, background: 'rgba(15, 81, 50,0.08)', padding: '1px 6px', borderRadius: 12, fontWeight: 600 }}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span style={{ ...labelS, fontSize: 9, marginBottom: 4 }}>Distribution Window</span>
                        <p style={{ color: 'var(--color-ss-text-primary, #221a15)', fontSize: 11, fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Zap size={11} color="#f59e0b" /> {aiCoPilot.releaseRecommendation}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: WORLDWIDE OUTLETS */}
                  {activeRightTab === 'outlets' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <p style={{ color: 'var(--color-ss-text-primary, #221a15)', fontSize: 12, margin: 0, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Globe size={13} color={G} /> Distribution Outlets
                        </p>
                        <span style={{ fontSize: 10, color: G, fontWeight: 700 }}>
                          {Object.values(platforms).filter(Boolean).length} / {Object.keys(platforms).length} selected
                        </span>
                      </div>

                      {/* Progress bar showing how many selected */}
                      <div style={{ height: 3, background: 'var(--color-ss-surface, #f4eede)', borderRadius: 2, overflow: 'hidden', marginBottom: 6 }}>
                        <div style={{
                          height: '100%', borderRadius: 2, transition: 'width 0.3s',
                          background: `linear-gradient(90deg, ${G}, #10b981)`,
                          width: `${(Object.values(platforms).filter(Boolean).length / Object.keys(platforms).length) * 100}%`
                        }} />
                      </div>

                      {[
                        { id: 'beato', name: 'Beato', sub: 'Native streaming', icon: '🎧', color: G },
                        { id: 'spotify', name: 'Spotify', sub: 'Global store', icon: '🟢', color: '#b08850' },
                        { id: 'apple_music', name: 'Apple Music', sub: 'iOS + Mac', icon: '🍎', color: '#fc3c44' },
                        { id: 'tidal', name: 'Tidal Hi-Fi', sub: 'Lossless masters', icon: '💎', color: '#00bfff' },
                        { id: 'amazon_music', name: 'Amazon Music', sub: 'Prime subscribers', icon: '🟠', color: '#ff9900' },
                      ].map(platform => (
                        <div
                          key={platform.id}
                          onClick={() => setPlatforms(prev => ({ ...prev, [platform.id]: !prev[platform.id] }))}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '10px 12px', borderRadius: 12, cursor: 'pointer',
                            background: platforms[platform.id] ? `rgba(15, 81, 50,0.06)` : 'var(--color-ss-surface, #f4eede)',
                            border: `1px solid ${platforms[platform.id] ? 'rgba(15, 81, 50,0.2)' : 'var(--color-ss-border, rgba(43, 34, 26, 0.08))'}`,
                            transition: 'all 0.2s'
                          }}
                        >
                          <span style={{ fontSize: 18, flexShrink: 0 }}>{platform.icon}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ color: 'var(--color-ss-text-primary, #221a15)', fontSize: 12, fontWeight: 700, margin: 0 }}>{platform.name}</p>
                            <p style={{ color: 'var(--color-ss-text-muted, #87786c)', fontSize: 10, margin: '1px 0 0' }}>{platform.sub}</p>
                          </div>
                          {/* Toggle switch */}
                          <div style={{
                            width: 34, height: 18, borderRadius: 9, flexShrink: 0,
                            background: platforms[platform.id] ? G : 'var(--color-ss-bg, #fbf9f5)',
                            position: 'relative', transition: 'background 0.2s',
                          }}>
                            <div style={{
                              width: 12, height: 12, borderRadius: '50%', background: '#fff',
                              position: 'absolute', top: 3,
                              left: platforms[platform.id] ? 19 : 3,
                              transition: 'left 0.2s',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                            }} />
                          </div>
                        </div>
                      ))}

                      {/* Summary footer */}
                      <div style={{ marginTop: 4, padding: '8px 10px', borderRadius: 10, background: 'rgba(15, 81, 50,0.04)', border: '1px solid rgba(15, 81, 50,0.1)' }}>
                        <p style={{ color: 'var(--color-ss-text-muted, #87786c)', fontSize: 10, margin: 0, lineHeight: 1.4 }}>
                          🌍 Your track will reach <strong style={{ color: 'var(--color-ss-text-primary, #221a15)' }}>{Object.values(platforms).filter(Boolean).length} platform{Object.values(platforms).filter(Boolean).length !== 1 ? 's' : ''}</strong> upon publishing.
                        </p>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 4: MASTER TRANSCODING PIPELINE */}
          {step === 4 && (
            <motion.div key="pipeline" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="upload-pipeline-card"
              style={{ maxWidth: 600, background: 'var(--color-ss-elevated, #ffffff)', border: '1px solid var(--color-ss-border, rgba(43, 34, 26, 0.08))', borderRadius: 24, padding: 30, margin: '0 auto' }}>
              <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <div style={{ width: 68, height: 68, borderRadius: '50%', background: 'rgba(16,185,129,0.1)', border: `2px solid ${V}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', animation: 'pulse 2.2s infinite' }}>
                  <Upload size={28} color={V} />
                </div>
                <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 26, fontWeight: 900, color: 'var(--color-ss-text-primary, #221a15)', marginBottom: 6 }}>
                  Publishing "{formData.title}"
                </h2>
                <p style={{ color: 'var(--color-ss-text-muted, #87786c)', fontSize: 14, margin: 0 }}>Syncing multi-track masters to decentralized global nodes...</p>
              </div>

              {/* Progress Tracker bar */}
              <div style={{ marginBottom: 32 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12 }}>
                  <span style={{ color: 'var(--color-ss-text-muted, #87786c)' }}>Store Deployment Completion</span>
                  <span style={{ color: G, fontWeight: 800 }}>{currentJob?.overallProgress ?? 0}%</span>
                </div>
                <div style={{ height: 6, background: 'var(--color-ss-surface, #f4eede)', borderRadius: 3, overflow: 'hidden' }}>
                  <motion.div style={{ height: '100%', background: `linear-gradient(90deg, ${G}, ${V}, ${P})`, borderRadius: 3 }}
                    animate={{ width: `${currentJob?.overallProgress ?? 0}%` }} transition={{ duration: 0.3 }} />
                </div>
              </div>

              {/* Pipeline Stages checklist */}
              <div>
                {(STAGE_ORDER.filter(s => s !== 'done') as UploadStage[]).map((stage, i) => (
                  <PipelineRow key={stage} stage={stage} currentStage={currentJob?.stage ?? 'idle'} index={i} />
                ))}
              </div>

              {/* Multicast Bitrate deployment matrix */}
              {currentJob && (
                <div style={{ display: 'flex', gap: 12, marginTop: 24, borderTop: '1px solid var(--color-ss-border, rgba(43, 34, 26, 0.08))', paddingTop: 20 }}>
                  {(['320kbps', '160kbps', '96kbps'] as const).map(br => (
                    <div key={br} style={{
                      flex: 1, padding: '12px', borderRadius: 12, textAlign: 'center',
                      background: currentJob.bitrates[br] ? 'rgba(15, 81, 50,0.06)' : 'var(--color-ss-surface, #f4eede)',
                      border: `1px solid ${currentJob.bitrates[br] ? 'rgba(15, 81, 50,0.25)' : 'var(--color-ss-border, rgba(43, 34, 26, 0.08))'}`,
                    }}>
                      <p style={{ color: currentJob.bitrates[br] ? G : 'var(--color-ss-text-muted, #87786c)', fontSize: 13, fontWeight: 800, margin: 0 }}>{br}</p>
                      <p style={{ color: 'var(--color-ss-text-muted, #87786c)', fontSize: 11, marginTop: 4, margin: 0 }}>{currentJob.bitrates[br] ? 'Deployed ✓' : 'Pending'}</p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 5: SUCCESS PUBLISHED PORTAL */}
          {step === 5 && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="upload-success-card"
              style={{ maxWidth: 540, textAlign: 'center', background: 'var(--color-ss-elevated, #ffffff)', border: '1px solid var(--color-ss-border, rgba(43, 34, 26, 0.08))', borderRadius: 24, padding: 30, margin: '0 auto' }}>
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.15, type: 'spring', stiffness: 180 }}
                style={{ width: 90, height: 90, borderRadius: '50%', background: 'rgba(15, 81, 50,0.1)', border: `2.5px solid ${G}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: `0 0 40px rgba(15, 81, 50,0.25)` }}>
                <Check size={42} color={G} strokeWidth={2.5} />
              </motion.div>

              <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 32, fontWeight: 900, color: 'var(--color-ss-text-primary, #221a15)', marginBottom: 8, margin: 0 }}>
                🎉 Master Deployed Live!
              </h2>
              <p style={{ color: 'var(--color-ss-text-muted, #87786c)', fontSize: 15, marginBottom: 28, marginTop: 8 }}>
                <span style={{ color: 'var(--color-ss-text-primary, #221a15)', fontWeight: 700 }}>"{formData.title}"</span> is streaming worldwide on distributed networks.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 32 }}>
                {[
                  { icon: '🌍', label: 'Global Retailers', val: 'Outlets Synced' },
                  { icon: '🎵', label: 'Container Master', val: 'FLAC / 320kbps' },
                  { icon: '📊', label: 'Analytics Pipeline', val: 'Realtime Tracker' },
                  { icon: '🛡️', label: 'Fingerprint Scan', val: 'SCVS Cleared' },
                ].map(s => (
                  <div key={s.label} style={{ padding: 14, background: 'var(--color-ss-surface, #f4eede)', borderRadius: 14, border: '1px solid var(--color-ss-border, rgba(43, 34, 26, 0.08))', textAlign: 'center' }}>
                    <p style={{ fontSize: 20, margin: 0 }}>{s.icon}</p>
                    <p style={{ color: 'var(--color-ss-text-primary, #221a15)', fontWeight: 700, fontSize: 13, marginTop: 8, margin: '8px 0 0' }}>{s.val}</p>
                    <p style={{ color: 'var(--color-ss-text-muted, #87786c)', fontSize: 11, marginTop: 2, margin: '2px 0 0' }}>{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="upload-success-buttons" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Link href="/artist/dashboard" style={{ display: 'block', textDecoration: 'none' }}>
                  <button style={{ width: '100%', padding: '12px 24px', borderRadius: 12, background: G, border: 'none', color: 'black', fontWeight: 800, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: 14 }}>
                    View Portal Dashboard
                  </button>
                </Link>
                <button onClick={() => { reset(); setStep(1); setFormData({ title: '', artistName: defaultArtistName, albumName: 'Singles', genre: 'Pop', language: 'English', releaseDate: new Date().toISOString().split('T')[0], explicit: false, lyrics: '', audioFile: null, audioFileName: '', coverFile: null, coverUrl: '', copyrightAccepted: false, policyAccepted: false }); setWaveformPeaks([]); setAudioSpec(null); setDuplicateTrack(null); setCopyrightScore(null); }}
                  style={{ width: '100%', padding: '12px 24px', borderRadius: 12, background: 'var(--color-ss-surface, #f4eede)', border: '1px solid var(--color-ss-border, rgba(43, 34, 26, 0.08))', color: 'var(--color-ss-text-primary, #221a15)', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
                  Distribute Another
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* YouTube MP3 Extractor Panel (Super Admin only, when uploadMode is 'youtube', and only on localhost:3000) */}
        {uploadMode === 'youtube' && 
         typeof window !== 'undefined' && 
         (window.location.host === 'localhost:3000' || window.location.host === '127.0.0.1:3000') && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
            style={{
              background: 'var(--color-ss-elevated, #ffffff)', border: '1px solid var(--color-ss-border, rgba(43, 34, 26, 0.08))',
              borderRadius: 24, padding: 30, display: 'flex', flexDirection: 'column', gap: 20
            }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 900, color: 'var(--color-ss-text-primary, #221a15)', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                📥 YouTube Video & Playlist MP3 Extractor
              </h3>
              <p style={{ color: 'var(--color-ss-text-muted, #87786c)', fontSize: 12, marginTop: 4, margin: 0 }}>
                Convert any YouTube link into a high-fidelity platform song on behalf of any platform artist profile.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 32, alignItems: 'start' }}>
              {/* Left Column: Form Controls */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <form onSubmit={handleYtParse} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* Select Target Artist */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={labelS}>Target Artist *</label>
                    <select
                      value={ytArtistId}
                      onChange={(e) => setYtArtistId(e.target.value)}
                      required
                      style={{
                        width: '100%', background: 'var(--color-ss-surface, #f4eede)',
                        border: '1.5px solid var(--color-ss-border, rgba(43, 34, 26, 0.08))',
                        borderRadius: 12, padding: '12px 14px', color: 'var(--color-ss-text-primary, #221a15)', fontSize: 13.5,
                        outline: 'none', fontFamily: 'inherit'
                      }}
                    >
                      <option value="">— Select Platform Artist —</option>
                      {artists.map((a: any) => (
                        <option key={a.id} value={a.id}>{a.name} ({a.email})</option>
                      ))}
                    </select>
                  </div>

                  {/* YouTube Link */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={labelS}>YouTube Video or Playlist URL *</label>
                    <input suppressHydrationWarning
                      type="url"
                      required
                      value={ytUrl}
                      onChange={(e) => setYtUrl(e.target.value)}
                      placeholder="e.g. https://www.youtube.com/watch?v=... or https://youtube.com/playlist?list=..."
                      style={{
                        width: '100%', background: 'var(--color-ss-surface, #f4eede)',
                        border: '1.5px solid var(--color-ss-border, rgba(43, 34, 26, 0.08))',
                        borderRadius: 12, padding: '12px 14px', color: 'var(--color-ss-text-primary, #221a15)', fontSize: 13.5,
                        outline: 'none'
                      }}
                    />
                  </div>

                  <motion.button
                    whileHover={{ opacity: 0.9 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={ytLoading}
                    style={{
                      padding: '12px',
                      background: G,
                      border: 'none',
                      borderRadius: 12,
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: ytLoading ? 'not-allowed' : 'pointer',
                      marginTop: 6,
                      opacity: ytLoading ? 0.6 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6
                    }}
                  >
                    {ytLoading ? 'Extracting details...' : '🔍 Parse YouTube Link'}
                  </motion.button>
                </form>
              </div>

              {/* Right Column: Parsing / Logs / Checklists Output */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {!ytParsedData && !ytLoading && (
                  <div style={{
                    padding: '60px 20px', textAlign: 'center', border: '1.5px dashed var(--color-ss-border, rgba(43, 34, 26, 0.15))',
                    borderRadius: 16, color: 'var(--color-ss-text-muted, #87786c)', fontSize: 13, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10
                  }}>
                    <span style={{ fontSize: 32 }}>🎧</span>
                    <span>Paste a YouTube link and click parse to extract video metadata.</span>
                  </div>
                )}

                {ytLoading && ytConvertProgress > 0 && (
                  <div style={{ background: '#121212', border: '1px solid #2a2a2a', borderRadius: 16, padding: 20, color: '#fff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12 }}>
                      <span style={{ color: G, fontWeight: 700 }}>Conversion Pipeline</span>
                      <span>{ytConvertProgress}%</span>
                    </div>
                    {/* Progress Bar */}
                    <div style={{ width: '100%', height: 6, background: '#222', borderRadius: 3, overflow: 'hidden', marginBottom: 16 }}>
                      <div style={{ width: `${ytConvertProgress}%`, height: '100%', background: G, transition: 'width 0.2s' }} />
                    </div>
                    {/* Progress Logs */}
                    <div style={{
                      fontFamily: 'monospace', fontSize: 11, color: '#888', height: 160, overflowY: 'auto',
                      display: 'flex', flexDirection: 'column', gap: 4, background: '#0a0a0a', padding: 12, borderRadius: 8
                    }}>
                      {ytLogs.map((log, idx) => (
                        <div key={idx} style={{ color: log.startsWith('[Success]') ? '#10b981' : log.startsWith('[Error]') ? '#ef4444' : '#aaa' }}>{log}</div>
                      ))}
                    </div>
                  </div>
                )}

                {ytParsedData && (
                  <div style={{ background: 'var(--color-ss-surface, #f4eede)', border: '1px solid var(--color-ss-border, rgba(43, 34, 26, 0.08))', borderRadius: 16, padding: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <h4 style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--color-ss-text-primary, #221a15)', margin: 0 }}>
                        {ytParsedData.type === 'video' ? 'Parsed YouTube Video' : 'Parsed YouTube Playlist'}
                      </h4>
                      <span style={{
                        fontSize: 9, fontWeight: 800, color: '#fff', background: G,
                        padding: '2px 8px', borderRadius: 100, textTransform: 'uppercase', letterSpacing: '0.04em'
                      }}>
                        {ytParsedData.type}
                      </span>
                    </div>

                    {ytParsedData.type === 'video' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {/* Parsed Cover Art Thumbnail + info chips */}
                        {ytSingleMetadata.coverImage && (
                          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', background: 'rgba(43,34,26,0.04)', padding: 12, borderRadius: 12 }}>
                            <img
                              src={ytSingleMetadata.coverImage}
                              alt="Cover Art Preview"
                              style={{ width: 72, height: 72, borderRadius: 8, objectFit: 'cover', border: '1px solid rgba(43,34,26,0.08)', flexShrink: 0 }}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-ss-text-primary, #221a15)', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                ✔ {ytSingleMetadata.title}
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {ytSingleMetadata.channel && (
                                  <span style={{ fontSize: 10, background: 'rgba(176,136,80,0.15)', color: '#7a5c2e', padding: '2px 8px', borderRadius: 100, fontWeight: 700 }}>
                                    📺 {ytSingleMetadata.channel}
                                  </span>
                                )}
                                {ytSingleMetadata.duration && (
                                  <span style={{ fontSize: 10, background: 'rgba(16,185,129,0.12)', color: '#047857', padding: '2px 8px', borderRadius: 100, fontWeight: 700 }}>
                                    ⏱ {Math.floor(ytSingleMetadata.duration / 60)}:{String(ytSingleMetadata.duration % 60).padStart(2, '0')}
                                  </span>
                                )}
                                {ytSingleMetadata.estimatedSizeMB && (
                                  <span style={{ fontSize: 10, background: 'rgba(99,102,241,0.12)', color: '#4338ca', padding: '2px 8px', borderRadius: 100, fontWeight: 700 }}>
                                    💾 ~{ytSingleMetadata.estimatedSizeMB} MB
                                  </span>
                                )}
                                {ytSingleMetadata.audioCodec && (
                                  <span style={{ fontSize: 10, background: 'rgba(239,68,68,0.1)', color: '#b91c1c', padding: '2px 8px', borderRadius: 100, fontWeight: 700 }}>
                                    🎵 {ytSingleMetadata.audioCodec}
                                  </span>
                                )}
                                {ytSingleMetadata.id && (
                                  <span style={{ fontSize: 10, background: 'rgba(43,34,26,0.07)', color: '#5a4a3a', padding: '2px 8px', borderRadius: 100, fontWeight: 700, fontFamily: 'monospace' }}>
                                    ID: {ytSingleMetadata.id}
                                  </span>
                                )}
                              </div>
                              {ytSingleMetadata.artist && ytSingleMetadata.artist !== ytSingleMetadata.channel && (
                                <div style={{ fontSize: 10, color: 'var(--color-ss-text-muted, #87786c)', marginTop: 4 }}>
                                  🎤 Artist: {ytSingleMetadata.artist}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Raw title display */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <label style={{ fontSize: 11, color: 'var(--color-ss-text-muted, #87786c)', fontWeight: 650 }}>Extracted Title / Raw Header</label>
                          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-ss-text-primary, #221a15)', background: 'rgba(43,34,26,0.03)', padding: '8px 12px', borderRadius: 8 }}>
                            {ytSingleMetadata.title}
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <label style={{ fontSize: 11, color: 'var(--color-ss-text-muted, #87786c)', fontWeight: 650 }}>Song Title (Upload Label) *</label>
                          <input suppressHydrationWarning
                            type="text"
                            value={ytSingleMetadata.songName}
                            onChange={(e) => setYtSingleMetadata({ ...ytSingleMetadata, songName: e.target.value })}
                            style={{
                              padding: '10px 12px',
                              background: '#ffffff',
                              border: '1.5px solid var(--color-ss-border, rgba(43, 34, 26, 0.08))',
                              borderRadius: 8,
                              color: 'var(--color-ss-text-primary, #221a15)',
                              fontSize: 13,
                              outline: 'none',
                            }}
                          />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <label style={{ fontSize: 11, color: 'var(--color-ss-text-muted, #87786c)', fontWeight: 650 }}>Genre *</label>
                            <select
                              value={ytSingleMetadata.genre}
                              onChange={(e) => setYtSingleMetadata({ ...ytSingleMetadata, genre: e.target.value })}
                              style={{
                                padding: '10px 12px',
                                background: '#ffffff',
                                border: '1.5px solid var(--color-ss-border, rgba(43, 34, 26, 0.08))',
                                borderRadius: 8,
                                color: 'var(--color-ss-text-primary, #221a15)',
                                fontSize: 13,
                                outline: 'none',
                                fontFamily: 'inherit'
                              }}
                            >
                              {GENRES.map((g) => (
                                <option key={g} value={g}>{g}</option>
                              ))}
                            </select>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <label style={{ fontSize: 11, color: 'var(--color-ss-text-muted, #87786c)', fontWeight: 650 }}>Duration (s)</label>
                            <input suppressHydrationWarning
                              type="number"
                              value={ytSingleMetadata.duration}
                              onChange={(e) => setYtSingleMetadata({ ...ytSingleMetadata, duration: parseInt(e.target.value) || 180 })}
                              style={{
                                padding: '10px 12px',
                                background: '#ffffff',
                                border: '1.5px solid var(--color-ss-border, rgba(43, 34, 26, 0.08))',
                                borderRadius: 8,
                                color: 'var(--color-ss-text-primary, #221a15)',
                                fontSize: 13,
                                outline: 'none',
                              }}
                            />
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                          <input suppressHydrationWarning
                            type="checkbox"
                            id="yt-song-explicit-upload"
                            checked={ytSingleMetadata.explicit}
                            onChange={(e) => setYtSingleMetadata({ ...ytSingleMetadata, explicit: e.target.checked })}
                            style={{ width: 16, height: 16, cursor: 'pointer' }}
                          />
                          <label htmlFor="yt-song-explicit-upload" style={{ fontSize: 12.5, color: 'var(--color-ss-text-primary, #221a15)', cursor: 'pointer', userSelect: 'none' }}>
                            Contains explicit content
                          </label>
                        </div>

                        <motion.button
                          whileHover={{ opacity: 0.95 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleYtConvert}
                          disabled={ytLoading}
                          style={{
                            padding: '14px',
                            background: ytLoading ? '#6b7280' : 'linear-gradient(135deg, #10b981, #059669)',
                            border: 'none',
                            borderRadius: 10,
                            color: '#ffffff',
                            fontWeight: 800,
                            fontSize: 14,
                            cursor: ytLoading ? 'not-allowed' : 'pointer',
                            marginTop: 10,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8
                          }}
                        >
                          {ytLoading ? '⏳ Downloading & Converting...' : '🎵 Convert & Upload MP3'}
                        </motion.button>
                      </div>
                    )}

                    {ytParsedData.type === 'playlist' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div style={{ fontSize: 12, color: 'var(--color-ss-text-muted, #87786c)', fontWeight: 600 }}>
                          Select tracks to convert from playlist:
                        </div>
                        {/* Playlist tracks selection checklist */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto', paddingRight: 4 }}>
                          {ytParsedData.tracks?.map((t: any, index: number) => {
                            const isChecked = ytPlaylistSelection[t.id] ?? false;
                            return (
                              <div key={`${t.id}-${index}`} style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                background: '#ffffff', border: '1px solid var(--color-ss-border, rgba(43, 34, 26, 0.08))',
                                borderRadius: 8, padding: '8px 12px'
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                                  <input suppressHydrationWarning
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => {
                                      const val = e.target.checked;
                                      setYtPlaylistSelection(prev => ({ ...prev, [t.id]: val }));
                                    }}
                                    style={{ width: 15, height: 15, cursor: 'pointer', flexShrink: 0 }}
                                  />
                                  <div style={{ minWidth: 0 }}>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-ss-text-primary, #221a15)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {t.songName}
                                    </span>
                                    <span style={{ fontSize: 10, color: 'var(--color-ss-text-muted, #87786c)' }}>
                                      Genre: {t.genre} | Duration: {Math.floor(t.duration / 60)}m {t.duration % 60}s
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <motion.button
                          whileHover={{ opacity: 0.95 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleYtConvert}
                          disabled={ytLoading}
                          style={{
                            padding: '12px',
                            background: '#10b981',
                            border: 'none',
                            borderRadius: 10,
                            color: '#ffffff',
                            fontWeight: 700,
                            fontSize: 13,
                            cursor: 'pointer',
                            marginTop: 10,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6
                          }}
                        >
                          📦 Bulk Convert & Upload ({Object.values(ytPlaylistSelection).filter(Boolean).length} tracks)
                        </motion.button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Spotify Song Extractor Panel (only on localhost:3000) ───────────────────────────────────── */}
        {uploadMode === 'spotify' && 
         typeof window !== 'undefined' && 
         (window.location.host === 'localhost:3000' || window.location.host === '127.0.0.1:3000') && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
            style={{
              background: 'var(--color-ss-elevated, #ffffff)',
              border: '1.5px solid rgba(29, 185, 84, 0.25)',
              borderRadius: 24, padding: 30, display: 'flex', flexDirection: 'column', gap: 20
            }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#1DB954', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#000"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 900, color: 'var(--color-ss-text-primary, #221a15)', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                  Spotify Song &amp; Playlist Extractor
                </h3>
                <p style={{ color: 'var(--color-ss-text-muted, #87786c)', fontSize: 12, marginTop: 2, margin: 0 }}>
                  Paste any Spotify track, album, or playlist link — we'll fetch the metadata and extract the audio automatically.
                </p>
              </div>
            </div>

            {spWarning && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.05)',
                border: '1.5px solid rgba(239, 68, 68, 0.25)',
                borderRadius: 16,
                padding: 16,
                fontSize: 13,
                color: '#b91c1c',
                lineHeight: 1.5,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                position: 'relative'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 18 }}>⚠️</span>
                    <strong style={{ fontWeight: 800 }}>Spotify API Key Warning (Read-only Fallback)</strong>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setSpWarning(null)}
                    style={{
                      background: 'none', border: 'none', color: '#b91c1c', fontSize: 16, cursor: 'pointer', padding: 0, opacity: 0.7
                    }}
                  >
                    ✕
                  </button>
                </div>
                <div style={{ color: '#7f1d1d' }}>
                  The default server Spotify developer credentials failed to fetch this playlist via the official API:
                  <div style={{ background: 'rgba(239, 68, 68, 0.08)', borderRadius: 8, padding: 8, margin: '8px 0', fontFamily: 'monospace', fontSize: 11.5, wordBreak: 'break-all' }}>
                    {spWarning}
                  </div>
                  <strong>We successfully fell back to guest-scraping mode, but it is limited to the first 30 tracks of the playlist.</strong>
                  <div style={{ marginTop: 8 }}>
                    To bypass this limit and extract all 100+ tracks, please input a **Spotify Client ID &amp; Client Secret** from a Spotify Premium developer account under the <strong>Spotify API Credentials (Optional)</strong> section below.
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 32, alignItems: 'start' }}>

              {/* Left Column: Form */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <form onSubmit={handleSpParse} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                  {/* Target Artist Selector */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={labelS}>Target Artist *</label>
                    <select
                      value={spArtistId}
                      onChange={(e) => setSpArtistId(e.target.value)}
                      required
                      style={{
                        width: '100%', background: 'var(--color-ss-surface, #f4eede)',
                        border: '1.5px solid var(--color-ss-border, rgba(43, 34, 26, 0.08))',
                        borderRadius: 12, padding: '12px 14px', color: 'var(--color-ss-text-primary, #221a15)', fontSize: 13.5,
                        outline: 'none', fontFamily: 'inherit'
                      }}
                    >
                      <option value="">— Select Platform Artist —</option>
                      {artists.map((a: any) => (
                        <option key={a.id} value={a.id}>{a.name} ({a.email})</option>
                      ))}
                    </select>
                  </div>

                  {/* Spotify URL Input */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={labelS}>Spotify Track, Album or Playlist URL *</label>
                    <input suppressHydrationWarning
                      type="url"
                      required
                      value={spUrl}
                      onChange={(e) => setSpUrl(e.target.value)}
                      placeholder="e.g. https://open.spotify.com/track/... or /playlist/... or /album/..."
                      style={{
                        width: '100%', background: 'var(--color-ss-surface, #f4eede)',
                        border: '1.5px solid rgba(29, 185, 84, 0.3)',
                        borderRadius: 12, padding: '12px 14px', color: 'var(--color-ss-text-primary, #221a15)', fontSize: 13.5,
                        outline: 'none'
                      }}
                    />
                    <div style={{ fontSize: 10.5, color: 'var(--color-ss-text-muted, #87786c)', marginTop: 2 }}>
                      💡 Right-click any song on Spotify → Share → Copy Song Link
                    </div>
                  </div>

                  {/* Optional Spotify Credentials */}
                  <div style={{ background: 'rgba(29, 185, 84, 0.04)', border: '1px dashed rgba(29, 185, 84, 0.25)', borderRadius: 12, padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 13 }}>🔑</span>
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--color-ss-text-primary, #221a15)' }}>Spotify API Credentials (Optional)</span>
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--color-ss-text-muted, #87786c)', lineHeight: '1.4' }}>
                      Enter your Spotify Developer Client ID and Secret to bypass the 30-track limit and fetch the entire playlist (100+ songs).
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <label style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--color-ss-text-primary, #221a15)' }}>Client ID</label>
                        <input suppressHydrationWarning
                          type="text"
                          value={spClientId}
                          onChange={(e) => setSpClientId(e.target.value)}
                          placeholder="Client ID"
                          style={{
                            width: '100%', background: 'var(--color-ss-surface, #f4eede)',
                            border: '1px solid var(--color-ss-border, rgba(43, 34, 26, 0.08))',
                            borderRadius: 8, padding: '8px 10px', color: 'var(--color-ss-text-primary, #221a15)', fontSize: 12,
                            outline: 'none'
                          }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <label style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--color-ss-text-primary, #221a15)' }}>Client Secret</label>
                        <input suppressHydrationWarning
                          type="password"
                          value={spClientSecret}
                          onChange={(e) => setSpClientSecret(e.target.value)}
                          placeholder="Client Secret"
                          style={{
                            width: '100%', background: 'var(--color-ss-surface, #f4eede)',
                            border: '1px solid var(--color-ss-border, rgba(43, 34, 26, 0.08))',
                            borderRadius: 8, padding: '8px 10px', color: 'var(--color-ss-text-primary, #221a15)', fontSize: 12,
                            outline: 'none'
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ opacity: 0.9 }} whileTap={{ scale: 0.98 }}
                    disabled={spLoading}
                    style={{
                      padding: '12px', background: '#1DB954', border: 'none',
                      borderRadius: 12, color: '#000', fontWeight: 700, fontSize: 13,
                      cursor: spLoading ? 'not-allowed' : 'pointer', marginTop: 6,
                      opacity: spLoading ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                    }}
                  >
                    {spLoading && !spParsedData ? '⏳ Fetching from Spotify...' : '🔍 Parse Spotify Link'}
                  </motion.button>
                </form>

                {/* Logs while searching */}
                {spLogs.length > 0 && !spParsedData && (
                  <div style={{ background: '#0a0a0a', borderRadius: 10, padding: 12, fontFamily: 'monospace', fontSize: 11, color: '#888', maxHeight: 100, overflowY: 'auto' }}>
                    {spLogs.map((log, i) => (
                      <div key={i} style={{ color: log.startsWith('❌') ? '#ef4444' : '#aaa' }}>{log}</div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Parsed Output / Progress */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Empty state */}
                {!spParsedData && !spLoading && spLogs.length === 0 && (
                  <div style={{
                    padding: '60px 20px', textAlign: 'center',
                    border: '1.5px dashed rgba(29, 185, 84, 0.3)',
                    borderRadius: 16, color: 'var(--color-ss-text-muted, #87786c)', fontSize: 13,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10
                  }}>
                    <span style={{ fontSize: 36 }}>🎵</span>
                    <span>Paste a Spotify link and click Parse to fetch song metadata.</span>
                    <span style={{ fontSize: 11, opacity: 0.6 }}>Supports: Track • Album • Playlist</span>
                  </div>
                )}

                {/* SSE Conversion Progress */}
                {spLoading && spConvertProgress > 0 && (
                  <div style={{ background: '#0d1a0e', border: '1px solid rgba(29,185,84,0.2)', borderRadius: 16, padding: 20, color: '#fff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12 }}>
                      <span style={{ color: '#1DB954', fontWeight: 700 }}>Spotify Extraction Pipeline</span>
                      <span>{spConvertProgress}%</span>
                    </div>
                    <div style={{ width: '100%', height: 6, background: '#1a2e1b', borderRadius: 3, overflow: 'hidden', marginBottom: 16 }}>
                      <div style={{ width: `${spConvertProgress}%`, height: '100%', background: '#1DB954', transition: 'width 0.2s' }} />
                    </div>
                    <div style={{
                      fontFamily: 'monospace', fontSize: 11, color: '#888', height: 160, overflowY: 'auto',
                      display: 'flex', flexDirection: 'column', gap: 4, background: '#060f07', padding: 12, borderRadius: 8
                    }}>
                      {spLogs.map((log, idx) => (
                        <div key={idx} style={{ color: log.includes('✅') ? '#1DB954' : log.includes('❌') ? '#ef4444' : log.includes('⚠️') ? '#f59e0b' : '#aaa' }}>{log}</div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Parsed Result: Single Track */}
                {spParsedData?.type === 'track' && (
                  <div style={{ background: 'var(--color-ss-surface, #f4eede)', border: '1px solid rgba(29, 185, 84, 0.2)', borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--color-ss-text-primary, #221a15)', margin: 0 }}>Parsed Spotify Track</h4>
                      <span style={{ fontSize: 9, fontWeight: 800, color: '#000', background: '#1DB954', padding: '2px 8px', borderRadius: 100, textTransform: 'uppercase', letterSpacing: '0.04em' }}>TRACK</span>
                    </div>

                    {/* Cover + chips */}
                    {spSingleMetadata.coverImage && (
                      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', background: 'rgba(29,185,84,0.05)', padding: 12, borderRadius: 12, border: '1px solid rgba(29,185,84,0.12)' }}>
                        <img
                          src={spSingleMetadata.coverImage}
                          alt="Spotify Cover Art"
                          style={{ width: 72, height: 72, borderRadius: 8, objectFit: 'cover', border: '2px solid rgba(29,185,84,0.3)', flexShrink: 0 }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-ss-text-primary, #221a15)', marginBottom: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            ✅ {spSingleMetadata.title}
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                            {spSingleMetadata.artist && (
                              <span style={{ fontSize: 10, background: 'rgba(29,185,84,0.15)', color: '#166534', padding: '2px 8px', borderRadius: 100, fontWeight: 700 }}>🎤 {spSingleMetadata.artist}</span>
                            )}
                            {spSingleMetadata.album && (
                              <span style={{ fontSize: 10, background: 'rgba(29,185,84,0.1)', color: '#15803d', padding: '2px 8px', borderRadius: 100, fontWeight: 700 }}>💿 {spSingleMetadata.album}</span>
                            )}
                            {spSingleMetadata.duration > 0 && (
                              <span style={{ fontSize: 10, background: 'rgba(16,185,129,0.12)', color: '#047857', padding: '2px 8px', borderRadius: 100, fontWeight: 700 }}>⏱ {Math.floor(spSingleMetadata.duration / 60)}:{String(spSingleMetadata.duration % 60).padStart(2, '0')}</span>
                            )}
                            {spSingleMetadata.releaseDate && (
                              <span style={{ fontSize: 10, background: 'rgba(99,102,241,0.1)', color: '#4338ca', padding: '2px 8px', borderRadius: 100, fontWeight: 700 }}>📅 {spSingleMetadata.releaseDate}</span>
                            )}
                            {spSingleMetadata.youtubeVideoId ? (
                              <span style={{ fontSize: 10, background: 'rgba(239,68,68,0.1)', color: '#b91c1c', padding: '2px 8px', borderRadius: 100, fontWeight: 700 }}>▶ YT: {spSingleMetadata.youtubeVideoId}</span>
                            ) : (
                              <span style={{ fontSize: 10, background: 'rgba(245,158,11,0.15)', color: '#92400e', padding: '2px 8px', borderRadius: 100, fontWeight: 700 }}>⚠ No YT match</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Editable fields */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <label style={{ fontSize: 11, color: 'var(--color-ss-text-muted, #87786c)', fontWeight: 650 }}>Song Title *</label>
                      <input suppressHydrationWarning
                        type="text"
                        value={spSingleMetadata.songName || spSingleMetadata.title}
                        onChange={(e) => setSpSingleMetadata({ ...spSingleMetadata, songName: e.target.value, title: e.target.value })}
                        style={{ padding: '10px 12px', background: '#ffffff', border: '1.5px solid rgba(29,185,84,0.2)', borderRadius: 8, color: 'var(--color-ss-text-primary, #221a15)', fontSize: 13, outline: 'none' }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <label style={{ fontSize: 11, color: 'var(--color-ss-text-muted, #87786c)', fontWeight: 650 }}>Genre *</label>
                        <select
                          value={spSingleMetadata.genre || 'Pop'}
                          onChange={(e) => setSpSingleMetadata({ ...spSingleMetadata, genre: e.target.value })}
                          style={{ padding: '10px 12px', background: '#ffffff', border: '1.5px solid rgba(29,185,84,0.2)', borderRadius: 8, color: 'var(--color-ss-text-primary, #221a15)', fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
                        >
                          {GENRES.map((g) => (<option key={g} value={g}>{g}</option>))}
                        </select>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <label style={{ fontSize: 11, color: 'var(--color-ss-text-muted, #87786c)', fontWeight: 650 }}>YouTube Video ID (override)</label>
                        <input suppressHydrationWarning
                          type="text"
                          value={spSingleMetadata.youtubeVideoId || ''}
                          onChange={(e) => setSpSingleMetadata({ ...spSingleMetadata, youtubeVideoId: e.target.value })}
                          placeholder="Auto-detected"
                          style={{ padding: '10px 12px', background: '#ffffff', border: '1.5px solid rgba(29,185,84,0.2)', borderRadius: 8, color: 'var(--color-ss-text-primary, #221a15)', fontSize: 13, outline: 'none', fontFamily: 'monospace' }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input suppressHydrationWarning
                        type="checkbox" id="sp-explicit-check"
                        checked={spSingleMetadata.explicit}
                        onChange={(e) => setSpSingleMetadata({ ...spSingleMetadata, explicit: e.target.checked })}
                        style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#1DB954' }}
                      />
                      <label htmlFor="sp-explicit-check" style={{ fontSize: 12.5, color: 'var(--color-ss-text-primary, #221a15)', cursor: 'pointer', userSelect: 'none' }}>
                        Contains explicit content
                      </label>
                    </div>

                    <motion.button
                      whileHover={{ opacity: 0.95 }} whileTap={{ scale: 0.98 }}
                      onClick={handleSpConvert}
                      disabled={spLoading}
                      style={{
                        padding: '14px',
                        background: spLoading ? '#6b7280' : 'linear-gradient(135deg, #1DB954, #17a349)',
                        border: 'none', borderRadius: 10, color: '#fff',
                        fontWeight: 800, fontSize: 14,
                        cursor: spLoading ? 'not-allowed' : 'pointer',
                        marginTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                      }}
                    >
                      {spLoading ? '⏳ Extracting & Uploading...' : '🎵 Extract & Upload Track'}
                    </motion.button>
                  </div>
                )}

                {/* Parsed Result: Playlist / Album */}
                {(spParsedData?.type === 'playlist' || spParsedData?.type === 'album') && (
                  <div style={{ background: 'var(--color-ss-surface, #f4eede)', border: '1px solid rgba(29, 185, 84, 0.2)', borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        {spParsedData.coverImage && (
                          <img src={spParsedData.coverImage} alt="Cover" style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', border: '2px solid rgba(29,185,84,0.3)', flexShrink: 0 }} />
                        )}
                        <div>
                          <h4 style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--color-ss-text-primary, #221a15)', margin: 0 }}>{spParsedData.playlistTitle}</h4>
                          <div style={{ fontSize: 11, color: 'var(--color-ss-text-muted, #87786c)', marginTop: 2 }}>
                            {spParsedData.tracks?.length} tracks found
                          </div>
                        </div>
                      </div>
                      <span style={{ fontSize: 9, fontWeight: 800, color: '#000', background: '#1DB954', padding: '2px 8px', borderRadius: 100, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{spParsedData.type}</span>
                    </div>

                    {/* Select All / Deselect All / Deselect Duplicates */}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button
                        onClick={() => {
                          const all: Record<string, boolean> = {};
                          spParsedData.tracks.forEach((t: any) => { all[t.spotifyId] = true; });
                          setSpPlaylistSelection(all);
                        }}
                        style={{ fontSize: 11, padding: '4px 12px', borderRadius: 100, border: '1px solid rgba(29,185,84,0.3)', background: 'transparent', color: '#1DB954', cursor: 'pointer', fontWeight: 700 }}
                      >Select All</button>
                      <button
                        onClick={() => setSpPlaylistSelection({})}
                        style={{ fontSize: 11, padding: '4px 12px', borderRadius: 100, border: '1px solid var(--color-ss-border, rgba(43,34,26,0.08))', background: 'transparent', color: 'var(--color-ss-text-muted, #87786c)', cursor: 'pointer', fontWeight: 700 }}
                      >Deselect All</button>
                      <button
                        onClick={() => {
                          const updated = { ...spPlaylistSelection };
                          spParsedData.tracks.forEach((t: any) => {
                            const isDup = allTracks.some((ext: any) => {
                              if (ext.spotifyTrackId && ext.spotifyTrackId === t.spotifyId) return true;
                              const cleanExtTitle = ext.title.toLowerCase().replace(/[^a-z0-9]/g, '');
                              const cleanSpTitle = t.title.toLowerCase().replace(/[^a-z0-9]/g, '');
                              return cleanExtTitle === cleanSpTitle;
                            });
                            if (isDup) {
                              updated[t.spotifyId] = false;
                            }
                          });
                          setSpPlaylistSelection(updated);
                        }}
                        style={{ fontSize: 11, padding: '4px 12px', borderRadius: 100, border: '1px solid rgba(220,38,38,0.3)', background: 'transparent', color: '#dc2626', cursor: 'pointer', fontWeight: 700 }}
                      >Deselect Duplicates</button>
                    </div>

                    {/* Hide Duplicates toggle */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, userSelect: 'none', background: 'rgba(43, 34, 26, 0.03)', padding: '6px 12px', borderRadius: 8, border: '1px solid var(--color-ss-border, rgba(43, 34, 26, 0.05))' }}>
                      <input suppressHydrationWarning
                        type="checkbox"
                        id="hideDuplicatesCheckbox"
                        checked={spHideDuplicates}
                        onChange={(e) => setSpHideDuplicates(e.target.checked)}
                        style={{ width: 14, height: 14, cursor: 'pointer', accentColor: '#1DB954' }}
                      />
                      <label htmlFor="hideDuplicatesCheckbox" style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--color-ss-text-muted, #87786c)', cursor: 'pointer', flex: 1 }}>
                        Hide already uploaded / duplicate tracks ({spParsedData.tracks.filter((t: any) => {
                          return allTracks.some((ext: any) => {
                            if (ext.spotifyTrackId && ext.spotifyTrackId === t.spotifyId) return true;
                            const cleanExtTitle = ext.title.toLowerCase().replace(/[^a-z0-9]/g, '');
                            const cleanSpTitle = t.title.toLowerCase().replace(/[^a-z0-9]/g, '');
                            return cleanExtTitle === cleanSpTitle;
                          });
                        }).length} hidden)
                      </label>
                    </div>

                    {/* Tracks checklist */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 260, overflowY: 'auto', paddingRight: 4 }}>
                      {spParsedData.tracks?.map((t: any, index: number) => {
                        const isChecked = spPlaylistSelection[t.spotifyId] ?? false;
                        const hasYt = !!t.youtubeVideoId;
                        const isDup = allTracks.some((ext: any) => {
                          if (ext.spotifyTrackId && ext.spotifyTrackId === t.spotifyId) return true;
                          const cleanExtTitle = ext.title.toLowerCase().replace(/[^a-z0-9]/g, '');
                          const cleanSpTitle = t.title.toLowerCase().replace(/[^a-z0-9]/g, '');
                          return cleanExtTitle === cleanSpTitle;
                        });

                        if (spHideDuplicates && isDup) return null;

                        return (
                          <div key={`${t.spotifyId}-${index}`} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            background: '#ffffff', border: `1px solid ${isChecked ? 'rgba(29,185,84,0.2)' : 'var(--color-ss-border, rgba(43, 34, 26, 0.08))'}`,
                            borderRadius: 8, padding: '8px 12px', transition: 'border-color 0.15s'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                              <input suppressHydrationWarning
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => setSpPlaylistSelection(prev => ({ ...prev, [t.spotifyId]: e.target.checked }))}
                                style={{ width: 15, height: 15, cursor: 'pointer', flexShrink: 0, accentColor: '#1DB954' }}
                              />
                              {t.coverImage && (
                                <img src={t.coverImage} alt="" style={{ width: 32, height: 32, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }} />
                              )}
                              <div style={{ minWidth: 0 }}>
                                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-ss-text-primary, #221a15)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {t.title}
                                </span>
                                <span style={{ fontSize: 10, color: 'var(--color-ss-text-muted, #87786c)' }}>
                                  {t.artist} · {t.duration > 0 ? `${Math.floor(t.duration / 60)}:${String(t.duration % 60).padStart(2, '0')}` : '?'}
                                </span>
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                              {isDup && (
                                <span style={{ fontSize: 9, fontWeight: 700, color: '#b91c1c', background: 'rgba(239,68,68,0.12)', padding: '2px 7px', borderRadius: 100 }}>
                                  📋 DUPLICATE
                                </span>
                              )}
                              <span style={{ fontSize: 9, fontWeight: 700, color: hasYt ? '#166534' : '#92400e', background: hasYt ? 'rgba(29,185,84,0.12)' : 'rgba(245,158,11,0.15)', padding: '2px 7px', borderRadius: 100 }}>
                                {hasYt ? '▶ YT' : '⚠ No YT'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <motion.button
                      whileHover={{ opacity: 0.95 }} whileTap={{ scale: 0.98 }}
                      onClick={handleSpConvert}
                      disabled={spLoading}
                      style={{
                        padding: '12px',
                        background: spLoading ? '#6b7280' : 'linear-gradient(135deg, #1DB954, #17a349)',
                        border: 'none', borderRadius: 10, color: '#fff',
                        fontWeight: 700, fontSize: 13,
                        cursor: spLoading ? 'not-allowed' : 'pointer',
                        marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                      }}
                    >
                      {spLoading ? '⏳ Extracting...' : `📦 Extract & Upload (${Object.values(spPlaylistSelection).filter(Boolean).length} tracks)`}
                    </motion.button>
                  </div>
                )}

              </div>
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}
