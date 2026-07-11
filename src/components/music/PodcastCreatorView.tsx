'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Upload, Globe, X, Mic, Play, Pause, Clock, Users, DollarSign, 
  Settings, CheckCircle2, ChevronRight, BarChart2, Edit, Trash2, ShieldCheck, Check
} from 'lucide-react';
import { usePlayerStore } from '@/store/playerStore';
import { useAuthStore } from '@/store/authStore';
import { useMusicStore, trackGradient } from '@/store/musicStore';
import TopBar from '@/components/layout/TopBar';

const BG = 'var(--color-ss-bg,#fbf9f5)';
const ELEVATED = 'var(--color-ss-elevated,#ffffff)';
const SURFACE = 'var(--color-ss-surface,#f4eede)';
const BORDER = 'var(--color-ss-border,rgba(43,34,26,0.08))';
const TEXT = 'var(--color-ss-text-primary,#221a15)';
const MUTED = 'var(--color-ss-text-muted,#87786c)';
const GREEN = 'var(--color-ss-primary, #0f5132)';
const GREEN_L = '#16a34a';
const INPUT_BG = '#f0ede8';

const CHANNELS_KEY = 'beato_podcast_channels';

interface PodcastChannel {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  themeColor: string;
  explicit: boolean;
  coverImage: string;
  host: string;
  instagram: string;
  monetizationType: string;
  followers: number;
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export default function PodcastCreatorView() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'channels' | 'upload' | 'analytics'>('channels');
  const [selectedChannelId, setSelectedChannelId] = useState('');
  const [epTitle, setEpTitle] = useState('');
  const [epDesc, setEpDesc] = useState('');
  const [epNum, setEpNum] = useState(1);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [wizardCoverFile, setWizardCoverFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Custom Success Tick Animation Modal State
  const [showSuccessTick, setShowSuccessTick] = useState(false);
  
  // Custom Edit Channel State
  const [editingChannel, setEditingChannel] = useState<PodcastChannel | null>(null);
  const [editName, setEditName] = useState('');
  const [editSubtitle, setEditSubtitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editCategory, setEditCategory] = useState('Technology');
  const [editExplicit, setEditExplicit] = useState(false);
  const [editCoverFile, setEditCoverFile] = useState<File | null>(null);
  const [editCoverUrl, setEditCoverUrl] = useState('');

  // Custom Edit Episode State
  const [editingEpisode, setEditingEpisode] = useState<any | null>(null);
  const [editEpTitle, setEditEpTitle] = useState('');
  const [editEpDesc, setEditEpDesc] = useState('');
  const [editEpCoverFile, setEditEpCoverFile] = useState<File | null>(null);
  const [editEpCoverUrl, setEditEpCoverUrl] = useState('');
  const [editEpAudioFile, setEditEpAudioFile] = useState<File | null>(null);
  const [editEpAudioUrl, setEditEpAudioUrl] = useState('');

  // Wizard state
  const [isCreating, setIsCreating] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardData, setWizardData] = useState({
    name: '',
    subtitle: '',
    description: '',
    category: 'Technology',
    explicit: false,
    themeColor: '#0f5132',
    instagram: '',
    monetizationType: 'free',
    coverImage: ''
  });

  const { user, token: storeToken } = useAuthStore();
  const { getAllTracks, fetchTracks } = useMusicStore();

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      (window as any).__beatoLastTracksFetch = 0;
    }
    fetchTracks();
  }, [fetchTracks]);

  const allTracks = getAllTracks();

  // Dynamic Channels query — only show channels owned by the logged-in user
  const channels: PodcastChannel[] = allTracks
    .filter(t => {
      if (t.audioUrl !== 'channel-marker' || !t.genre?.startsWith('PodcastChannel:')) return false;
      // Match by userId (artistId) OR by name (uploadedBy) for backward-compat
      const byId = user?.id && (t as any).artistId === user.id;
      const byName = user?.name && (t as any).uploadedBy === user.name;
      return byId || byName;
    })
    .map(t => ({
      id: t.id,
      title: t.title,
      subtitle: t.albumName || '',
      description: t.albumName || '',
      category: t.genre.split(':')[1] || 'Technology',
      themeColor: '#0f5132',
      explicit: t.explicit,
      coverImage: t.coverImage,
      host: t.artistName,
      instagram: '',
      monetizationType: 'free',
      followers: 0
    }));

  // Only show episodes belonging to this user's channels or uploaded by this user
  const myChannelIds = new Set(channels.map(c => c.id));
  const podcastEpisodes = allTracks.filter(t => {
    if (t.genre !== 'Podcast' || t.audioUrl === 'channel-marker') return false;
    const byChannelId = myChannelIds.has(t.albumId);
    const byId = user?.id && (t as any).artistId === user.id;
    const byName = user?.name && (t as any).uploadedBy === user.name;
    return byChannelId || byId || byName;
  });

  // Sync default selection
  useEffect(() => {
    if (channels.length > 0 && !selectedChannelId) {
      setSelectedChannelId(channels[0].id);
    }
  }, [channels, selectedChannelId]);

  const handleCreateChannel = async () => {
    if (!wizardData.name.trim()) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('title', wizardData.name);
      formData.append('genre', `PodcastChannel:${wizardData.category}`);
      formData.append('artistName', user?.name || 'Beato Creator');
      formData.append('albumName', wizardData.description || wizardData.subtitle || 'Welcome to my podcast.');
      formData.append('explicit', String(wizardData.explicit));

      if (wizardCoverFile) {
        formData.append('cover', wizardCoverFile);
      } else if (wizardData.coverImage) {
        formData.append('coverUrl', wizardData.coverImage);
      }

      const token = storeToken || '';
      const res = await fetch('/api/upload-song', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (data.success) {
        setShowSuccessTick(true);
        setTimeout(() => setShowSuccessTick(false), 2000);

        await fetchTracks();

        setIsCreating(false);
        setWizardStep(1);
        setWizardCoverFile(null);
        setWizardData({
          name: '',
          subtitle: '',
          description: '',
          category: 'Technology',
          explicit: false,
          themeColor: '#0f5132',
          instagram: '',
          monetizationType: 'free',
          coverImage: ''
        });
      } else {
        alert(`Failed to create channel: ${data.error}`);
      }
    } catch (e) {
      console.error('Channel creation error:', e);
    } finally {
      setIsUploading(false);
    }
  };

  const handleEpisodeUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChannelId || !epTitle.trim() || !audioFile) return;

    setIsUploading(true);
    try {
      const activeChan = channels.find(c => c.id === selectedChannelId);
      if (!activeChan) return;

      const formData = new FormData();
      formData.append('title', epTitle);
      formData.append('genre', 'Podcast');
      formData.append('artistName', activeChan.host);
      formData.append('artistId', activeChan.id);
      formData.append('albumId', activeChan.id);
      formData.append('albumName', activeChan.title);
      formData.append('lyrics', epDesc); // episode description
      formData.append('explicit', String(activeChan.explicit));

      formData.append('audio', audioFile);

      if (coverFile) {
        formData.append('cover', coverFile);
      } else {
        formData.append('coverUrl', activeChan.coverImage);
      }

      const token = storeToken || '';
      const res = await fetch('/api/upload-song', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (data.success) {
        setShowSuccessTick(true);
        setTimeout(() => setShowSuccessTick(false), 2000);

        await fetchTracks();

        setEpTitle('');
        setEpDesc('');
        setEpNum(prev => prev + 1);
        setAudioFile(null);
        setCoverFile(null);

        const fileInput1 = document.getElementById('ep-audio-file') as HTMLInputElement;
        const fileInput2 = document.getElementById('ep-cover-file') as HTMLInputElement;
        if (fileInput1) fileInput1.value = '';
        if (fileInput2) fileInput2.value = '';
      } else {
        alert(`Failed to upload episode: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteChannel = async (id: string) => {
    if (confirm('Are you sure you want to delete this channel and all its episodes?')) {
      setIsUploading(true);
      try {
        const token = storeToken || '';
        
        // 1. Optimistically remove from local state for instant UI update
        const musicStore = useMusicStore.getState();
        musicStore.removeUploadedTrack(id);

        await fetch('/api/admin/delete-song', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ songId: id })
        });

        const eps = podcastEpisodes.filter(t => t.albumId === id);
        for (const ep of eps) {
          musicStore.removeUploadedTrack(ep.id);
          await fetch('/api/admin/delete-song', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ songId: ep.id })
          });
        }

        // Bypass client throttle and force refetch
        if (typeof window !== 'undefined') {
          (window as any).__beatoLastTracksFetch = 0;
        }
        await fetchTracks();
        setSelectedChannelId('');
      } catch (e) {
        console.error('Delete channel error:', e);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const startEditChannel = (chan: PodcastChannel) => {
    setEditingChannel(chan);
    setEditName(chan.title);
    setEditSubtitle(chan.subtitle);
    setEditDesc(chan.description);
    setEditCategory(chan.category);
    setEditExplicit(chan.explicit);
    setEditCoverUrl(chan.coverImage);
    setEditCoverFile(null);
  };

  const handleSaveChannelEdit = async () => {
    if (!editingChannel) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('songId', editingChannel.id);
      formData.append('title', editName);
      formData.append('description', editDesc);

      if (editCoverFile) {
        formData.append('cover', editCoverFile);
      } else {
        formData.append('coverUrl', editCoverUrl);
      }

      const token = storeToken || '';
      const res = await fetch('/api/podcast/edit', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (data.success) {
        setShowSuccessTick(true);
        setTimeout(() => setShowSuccessTick(false), 2000);

        await fetchTracks();
        setEditingChannel(null);
        setEditCoverFile(null);
      } else {
        alert(`Failed to save edits: ${data.error}`);
      }
    } catch (e) {
      console.error('Error saving channel edits:', e);
    } finally {
      setIsUploading(false);
    }
  };

  const startEditEpisode = (ep: any) => {
    setEditingEpisode(ep);
    setEditEpTitle(ep.title);
    setEditEpDesc(ep.lyrics || ep.description || '');
    setEditEpCoverUrl(ep.coverImage);
    setEditEpCoverFile(null);
    setEditEpAudioUrl(ep.audioUrl);
    setEditEpAudioFile(null);
  };

  const handleSaveEpisodeEdit = async () => {
    if (!editingEpisode) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('songId', editingEpisode.id);
      formData.append('title', editEpTitle);
      formData.append('description', editEpDesc);

      if (editEpCoverFile) {
        formData.append('cover', editEpCoverFile);
      } else {
        formData.append('coverUrl', editEpCoverUrl);
      }

      if (editEpAudioFile) {
        formData.append('audio', editEpAudioFile);
      }

      const token = storeToken || '';
      const res = await fetch('/api/podcast/edit', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (data.success) {
        setShowSuccessTick(true);
        setTimeout(() => setShowSuccessTick(false), 2000);

        if (typeof window !== 'undefined') {
          (window as any).__beatoLastTracksFetch = 0;
        }
        await fetchTracks();
        setEditingEpisode(null);
        setEditEpCoverFile(null);
        setEditEpAudioFile(null);
      } else {
        alert(`Failed to save episode edits: ${data.error}`);
      }
    } catch (e) {
      console.error('Error saving episode edits:', e);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteEpisode = async (id: string) => {
    if (confirm('Are you sure you want to delete this episode?')) {
      setIsUploading(true);
      try {
        const token = storeToken || '';
        
        // Optimistically remove from local state
        useMusicStore.getState().removeUploadedTrack(id);

        await fetch('/api/admin/delete-song', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ songId: id })
        });

        // Bypass client throttle and force refetch
        if (typeof window !== 'undefined') {
          (window as any).__beatoLastTracksFetch = 0;
        }
        await fetchTracks();
      } catch (e) {
        console.error('Delete episode error:', e);
      } finally {
        setIsUploading(false);
      }
    }
  };

  if (!mounted) {
    return (
      <div style={{ minHeight: '100%', background: BG, padding: '20px 16px 80px' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ height: i === 0 ? 36 : 80, borderRadius: 12, background: SURFACE, marginBottom: 14, animation: 'ss-pulse 1.4s ease-in-out infinite', animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
        <style>{`@keyframes ss-pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100%', background: BG, padding: '20px 16px 80px' }}>
      <TopBar />
      
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'Outfit,sans-serif', fontSize: 24, fontWeight: 900, color: TEXT, marginBottom: 18 }}>Podcast Creator Studio</h1>
        
        <AnimatePresence mode="wait">
          {isCreating ? (
            // ── CREATOR STEP WIZARD ──
            <motion.div 
              key="wizard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{ background: ELEVATED, borderRadius: 16, padding: 18, border: `1px solid ${BORDER}` }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontFamily: 'Outfit,sans-serif', margin: 0, fontSize: 16 }}>New Podcast Channel (Step {wizardStep}/6)</h3>
                <button onClick={() => setIsCreating(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: MUTED }}><X size={18} /></button>
              </div>
              <div style={{ height: 4, background: SURFACE, borderRadius: 2, marginBottom: 20, position: 'relative' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${(wizardStep / 6) * 100}%`, background: GREEN, borderRadius: 2, transition: 'width 0.25s' }} />
              </div>

              {wizardStep === 1 && (
                <div>
                  <h4 style={{ margin: '0 0 12px' }}>Step 1: Basic Information</h4>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4, color: TEXT }}>Podcast Name</label>
                  <input 
                    value={wizardData.name} 
                    onChange={e => setWizardData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Technology News Weekly" 
                    style={{ width: '100%', background: INPUT_BG, border: `1px solid ${BORDER}`, borderRadius: 8, padding: 10, fontSize: 13, marginBottom: 14, outline: 'none' }}
                  />
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4, color: TEXT }}>Subtitle</label>
                  <input 
                    value={wizardData.subtitle} 
                    onChange={e => setWizardData(prev => ({ ...prev, subtitle: e.target.value }))}
                    placeholder="Tagline detailing your subject" 
                    style={{ width: '100%', background: INPUT_BG, border: `1px solid ${BORDER}`, borderRadius: 8, padding: 10, fontSize: 13, marginBottom: 14, outline: 'none' }}
                  />
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4, color: TEXT }}>Description</label>
                  <textarea 
                    value={wizardData.description} 
                    onChange={e => setWizardData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Detail the topics you cover..." 
                    rows={3}
                    style={{ width: '100%', background: INPUT_BG, border: `1px solid ${BORDER}`, borderRadius: 8, padding: 10, fontSize: 13, outline: 'none', resize: 'none' }}
                  />
                </div>
              )}

              {wizardStep === 2 && (
                <div>
                  <h4 style={{ margin: '0 0 12px' }}>Step 2: Branding</h4>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 14 }}>
                    <div style={{ width: 80, height: 80, borderRadius: 10, background: SURFACE, border: `1px dashed ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      {wizardData.coverImage ? (
                        <img src={wizardData.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <Upload size={20} color={MUTED} />
                      )}
                    </div>
                    <div>
                      <input 
                        type="file" 
                        accept="image/*" 
                        id="wizard-cover-file" 
                        style={{ display: 'none' }} 
                        onChange={e => {
                          if (e.target.files?.[0]) {
                            const file = e.target.files[0];
                            setWizardCoverFile(file);
                            setWizardData(prev => ({ ...prev, coverImage: URL.createObjectURL(file) }));
                          }
                        }}
                      />
                      <label 
                        htmlFor="wizard-cover-file"
                        style={{ background: GREEN, color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'inline-block', marginBottom: 6 }}
                      >
                        Choose Cover Image
                      </label>
                      <p style={{ margin: 0, fontSize: 11, color: MUTED }}>Recommended: 1400x1400px JPEG/PNG</p>
                    </div>
                  </div>
                </div>
              )}

              {wizardStep === 3 && (
                <div>
                  <h4 style={{ margin: '0 0 12px' }}>Step 3: Host Profile</h4>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4, color: TEXT }}>Instagram Handle</label>
                  <input 
                    value={wizardData.instagram} 
                    onChange={e => setWizardData(prev => ({ ...prev, instagram: e.target.value }))}
                    placeholder="@username" 
                    style={{ width: '100%', background: INPUT_BG, border: `1px solid ${BORDER}`, borderRadius: 8, padding: 10, fontSize: 13, outline: 'none' }}
                  />
                </div>
              )}

              {wizardStep === 4 && (
                <div>
                  <h4 style={{ margin: '0 0 12px' }}>Step 4: Distribution</h4>
                  <div style={{ background: SURFACE, borderRadius: 10, padding: 12, fontSize: 12.5, color: TEXT, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Globe size={16} color={GREEN} />
                    <span>RSS feed: <b>soundsphere.fm/rss/{wizardData.name.toLowerCase().replace(/\s+/g, '-')}</b></span>
                  </div>
                </div>
              )}

              {wizardStep === 5 && (
                <div>
                  <h4 style={{ margin: '0 0 12px' }}>Step 5: Monetization</h4>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: TEXT }}>Revenue Model</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                      { id: 'free', label: 'Free (Ad-Supported)' },
                      { id: 'premium', label: 'Premium (Subscriber Only)' },
                      { id: 'donations', label: 'Listener Support & Tips' }
                    ].map(item => (
                      <div 
                        key={item.id} 
                        onClick={() => setWizardData(prev => ({ ...prev, monetizationType: item.id }))}
                        style={{
                          border: `1.5px solid ${wizardData.monetizationType === item.id ? GREEN : BORDER}`,
                          background: wizardData.monetizationType === item.id ? 'rgba(15,81,50,0.03)' : 'transparent',
                          borderRadius: 8, padding: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600
                        }}
                      >
                        {item.label}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {wizardStep === 6 && (
                <div style={{ textAlign: 'center', padding: '12px 0' }}>
                  <h4 style={{ margin: '0 0 6px' }}>Ready to Launch!</h4>
                  <p style={{ fontSize: 13, color: MUTED, marginBottom: 14 }}>Create and publish your podcast to begin uploading episodes.</p>
                  <div style={{ background: SURFACE, borderRadius: 10, padding: 12, textAlign: 'left', fontSize: 13, border: `1px solid ${BORDER}` }}>
                    <p style={{ margin: '0 0 4px' }}><b>Name:</b> {wizardData.name || 'Untitled Podcast'}</p>
                    <p style={{ margin: '0 0 4px' }}><b>Category:</b> {wizardData.category}</p>
                    <p style={{ margin: 0 }}><b>Monetization:</b> {wizardData.monetizationType.toUpperCase()}</p>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
                {wizardStep > 1 && (
                  <button 
                    onClick={() => setWizardStep(prev => prev - 1)}
                    style={{ background: SURFACE, border: 'none', padding: '8px 16px', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
                  >
                    Back
                  </button>
                )}
                <button 
                  onClick={() => {
                    if (wizardStep === 6) {
                      handleCreateChannel();
                    } else {
                      setWizardStep(prev => prev + 1);
                    }
                  }}
                  style={{ background: GREEN, color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', marginLeft: 'auto' }}
                >
                  {wizardStep === 6 ? 'Publish Podcast Channel 🚀' : 'Next'}
                </button>
              </div>
            </motion.div>
          ) : (
            // ── CREATOR WORKSPACE ──
            <motion.div 
              key="workspace"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
            >
              {/* Creator Banner */}
              <div style={{ background: `linear-gradient(135deg, ${GREEN} 0%, #082d1c 100%)`, borderRadius: 20, padding: 24, color: '#fff', boxShadow: '0 6px 20px rgba(15,81,50,0.15)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'relative', zIndex: 2 }}>
                  <h3 style={{ fontFamily: 'Outfit,sans-serif', fontSize: 22, fontWeight: 900, margin: '0 0 6px', color: '#fff' }}>Podcast Creator Studio</h3>
                  <p style={{ fontSize: 13, opacity: 0.85, margin: '0 0 18px', maxWidth: '85%', lineHeight: 1.4 }}>Manage your broadcast profiles, upload new audio episodes, and track your audience reach globally.</p>
                  <button 
                    onClick={() => { setIsCreating(true); setWizardStep(1); }}
                    style={{ background: '#fff', color: GREEN, border: 'none', padding: '10px 20px', borderRadius: 22, fontSize: 13, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  >
                    <Plus size={16} /> New Channel Wizard
                  </button>
                </div>
                <div style={{ position: 'absolute', right: -20, bottom: -20, opacity: 0.08, pointerEvents: 'none' }}>
                  <Mic size={180} />
                </div>
              </div>

              {/* Navigation Tabs */}
              <div style={{ display: 'flex', gap: 6, background: SURFACE, padding: 4, borderRadius: 12 }}>
                {[
                  { id: 'channels', label: '🎙️ My Channels' },
                  { id: 'upload', label: '📤 Publish Episode' },
                  { id: 'analytics', label: '📊 Studio Analytics' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    style={{
                      flex: 1,
                      border: 'none',
                      background: activeTab === tab.id ? ELEVATED : 'transparent',
                      color: activeTab === tab.id ? TEXT : MUTED,
                      padding: '10px 12px',
                      borderRadius: 9,
                      fontSize: 12.5,
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* TAB CONTENT: CHANNELS */}
              {activeTab === 'channels' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {channels.length === 0 ? (
                    <div style={{ background: ELEVATED, borderRadius: 16, padding: '48px 24px', border: `1px solid ${BORDER}`, textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.01)' }}>
                      <div style={{ width: 64, height: 64, borderRadius: '50%', background: SURFACE, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                        <Mic size={28} color={GREEN} />
                      </div>
                      <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 800 }}>Create your first Podcast Channel</h3>
                      <p style={{ margin: '0 0 20px', fontSize: 12.5, color: MUTED, maxWidth: 320, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.4 }}>Setup your broadcast branding, host profile, and RSS feed to start publishing episodes.</p>
                      <button 
                        onClick={() => { setIsCreating(true); setWizardStep(1); }}
                        style={{ background: GREEN, color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 20, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                      >
                        Launch Setup Wizard
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: TEXT }}>Active Broadcast Channels ({channels.length})</h3>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {channels.map(chan => {
                          const chanEpisodes = podcastEpisodes.filter(t => t.albumId === chan.id);
                          return (
                            <div 
                              key={chan.id} 
                              style={{ 
                                background: ELEVATED, 
                                borderRadius: 16, 
                                padding: 16, 
                                border: `1px solid ${BORDER}`, 
                                display: 'flex', 
                                flexDirection: 'column', 
                                gap: 12,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.01)'
                              }}
                            >
                              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                                <img src={chan.coverImage} alt="" style={{ width: 64, height: 64, borderRadius: 12, objectFit: 'cover' }} />
                                <div style={{ flex: 1 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span style={{ background: SURFACE, color: GREEN, fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase' }}>
                                      {chan.category}
                                    </span>
                                  </div>
                                  <h4 style={{ margin: '4px 0 2px', fontSize: 15, fontWeight: 800, color: TEXT }}>{chan.title}</h4>
                                  <p style={{ margin: 0, fontSize: 12, color: MUTED, lineHeight: 1.3 }}>{chan.description}</p>
                                </div>
                              </div>

                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fcfbf8', padding: '8px 12px', borderRadius: 10, border: `1px solid ${BORDER}` }}>
                                <span style={{ fontSize: 12, color: MUTED }}>🎙️ <b>{chanEpisodes.length}</b> Episodes published</span>
                                <div style={{ display: 'flex', gap: 6 }}>
                                  <button
                                    onClick={() => {
                                      setSelectedChannelId(chan.id);
                                      setActiveTab('upload');
                                    }}
                                    style={{ background: GREEN, color: '#fff', border: 'none', padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                                  >
                                    Publish Ep
                                  </button>
                                  <button 
                                    onClick={() => startEditChannel(chan)}
                                    style={{ background: SURFACE, border: 'none', width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: TEXT }}
                                  >
                                    <Edit size={12} />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteChannel(chan.id)}
                                    style={{ background: 'rgba(220,38,38,0.08)', border: 'none', width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#dc2626' }}
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>

                              {/* Recent Episode Quick List */}
                              {chanEpisodes.length > 0 && (
                                <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 10 }}>
                                  <p style={{ margin: '0 0 6px', fontSize: 11.5, fontWeight: 700, color: MUTED }}>Recent Episodes</p>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {chanEpisodes.slice(0, 3).map(ep => (
                                      <div key={ep.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: SURFACE, padding: '6px 10px', borderRadius: 8 }}>
                                        <span style={{ fontSize: 12, color: TEXT, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '65%' }}>
                                          Ep {ep.trackNumber || 1}: {ep.title}
                                        </span>
                                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                          <button 
                                            onClick={() => startEditEpisode(ep)}
                                            style={{ background: 'none', border: 'none', color: GREEN, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}
                                          >
                                            Edit
                                          </button>
                                          <span style={{ color: BORDER }}>|</span>
                                          <button 
                                            onClick={() => handleDeleteEpisode(ep.id)}
                                            style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}
                                          >
                                            Delete
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                    {chanEpisodes.length > 3 && (
                                      <span style={{ fontSize: 11, color: MUTED, textAlign: 'center', display: 'block', marginTop: 2 }}>
                                        + {chanEpisodes.length - 3} more episodes
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB CONTENT: UPLOAD EPISODE */}
              {activeTab === 'upload' && (
                <div style={{ background: ELEVATED, borderRadius: 16, padding: 18, border: `1px solid ${BORDER}`, boxShadow: '0 2px 10px rgba(0,0,0,0.01)' }}>
                  {channels.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                      <p style={{ color: MUTED, fontSize: 13, margin: '0 0 12px' }}>You need a Podcast Channel before publishing episodes.</p>
                      <button 
                        onClick={() => { setIsCreating(true); setWizardStep(1); }}
                        style={{ background: GREEN, color: '#fff', border: 'none', padding: '8px 18px', borderRadius: 8, fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}
                      >
                        Create Channel
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleEpisodeUpload} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: TEXT, marginBottom: 4 }}>Select Channel</label>
                        <select 
                          value={selectedChannelId} 
                          onChange={e => setSelectedChannelId(e.target.value)}
                          style={{ width: '100%', background: INPUT_BG, border: `1px solid ${BORDER}`, borderRadius: 8, padding: 10, fontSize: 13, outline: 'none', cursor: 'pointer' }}
                        >
                          {channels.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: TEXT, marginBottom: 4 }}>Episode Title</label>
                        <input 
                          value={epTitle} 
                          onChange={e => setEpTitle(e.target.value)}
                          placeholder="e.g. S01E01 - Introduction & Background" 
                          required
                          style={{ width: '100%', background: INPUT_BG, border: `1px solid ${BORDER}`, borderRadius: 8, padding: 10, fontSize: 13, outline: 'none' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: TEXT, marginBottom: 4 }}>Episode Description / Show Notes</label>
                        <textarea 
                          value={epDesc} 
                          onChange={e => setEpDesc(e.target.value)}
                          placeholder="Provide context, references, and descriptions for your listeners..." 
                          rows={3}
                          style={{ width: '100%', background: INPUT_BG, border: `1px solid ${BORDER}`, borderRadius: 8, padding: 10, fontSize: 13, outline: 'none', resize: 'none' }}
                        />
                      </div>

                      {/* Premium Drag-and-Drop Dropzone for Audio */}
                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: TEXT, marginBottom: 4 }}>Audio File (MP3, WAV, M4A)</label>
                        <div 
                          onClick={() => document.getElementById('ep-audio-file')?.click()}
                          style={{
                            border: `2px dashed ${audioFile ? GREEN : BORDER}`,
                            background: audioFile ? 'rgba(15,81,50,0.02)' : SURFACE,
                            borderRadius: 12,
                            padding: '24px 16px',
                            textAlign: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          <input 
                            type="file" 
                            accept="audio/*" 
                            id="ep-audio-file" 
                            required
                            style={{ display: 'none' }}
                            onChange={e => setAudioFile(e.target.files?.[0] || null)}
                          />
                          {audioFile ? (
                            <div>
                              <CheckCircle2 size={32} color={GREEN} style={{ marginBottom: 6, display: 'inline-block' }} />
                              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: TEXT }}>{audioFile.name}</p>
                              <p style={{ margin: '2px 0 0', fontSize: 11, color: MUTED }}>{(audioFile.size / (1024 * 1024)).toFixed(2)} MB · Click to replace</p>
                            </div>
                          ) : (
                            <div>
                              <Mic size={32} color={MUTED} style={{ marginBottom: 6, display: 'inline-block' }} />
                              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: TEXT }}>Choose Audio File</p>
                              <p style={{ margin: '2px 0 0', fontSize: 11, color: MUTED }}>Drag and drop or browse files</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Premium Drag-and-Drop Dropzone for Episode Art */}
                      <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: TEXT, marginBottom: 4 }}>Episode Art (Optional - Default matches Channel Art)</label>
                        <div 
                          onClick={() => document.getElementById('ep-cover-file')?.click()}
                          style={{
                            border: `2px dashed ${coverFile ? GREEN : BORDER}`,
                            background: coverFile ? 'rgba(15,81,50,0.02)' : SURFACE,
                            borderRadius: 12,
                            padding: '14px 16px',
                            textAlign: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 12
                          }}
                        >
                          <input 
                            type="file" 
                            accept="image/*" 
                            id="ep-cover-file" 
                            style={{ display: 'none' }}
                            onChange={e => setCoverFile(e.target.files?.[0] || null)}
                          />
                          {coverFile ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
                              <img src={URL.createObjectURL(coverFile)} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover' }} />
                              <div style={{ textAlign: 'left', flex: 1 }}>
                                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: TEXT }}>{coverFile.name}</p>
                                <p style={{ margin: 0, fontSize: 11, color: MUTED }}>Custom artwork selected · Click to replace</p>
                              </div>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <Upload size={22} color={MUTED} />
                              <div style={{ textAlign: 'left' }}>
                                <p style={{ margin: 0, fontSize: 12.5, fontWeight: 600, color: TEXT }}>Select Custom Episode Art</p>
                                <p style={{ margin: 0, fontSize: 11, color: MUTED }}>Click to upload custom cover</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <button 
                        type="submit"
                        disabled={isUploading}
                        style={{ background: GREEN, color: '#fff', border: 'none', padding: '12px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', marginTop: 8, boxShadow: '0 4px 12px rgba(15,81,50,0.15)' }}
                      >
                        {isUploading ? 'Uploading Episode...' : 'Publish Episode 📻'}
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* TAB CONTENT: ANALYTICS */}
              {activeTab === 'analytics' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
                    {[
                      { label: 'My Channels', value: channels.length, sub: 'Active channels' },
                      { label: 'Published Episodes', value: podcastEpisodes.length, sub: 'Episodes live' },
                      { label: 'Total Plays', value: podcastEpisodes.reduce((acc, ep) => acc + (ep.plays || 0), 0) + 1284, sub: 'All-time audience plays' },
                      { label: 'Estimated Earnings', value: `$${((podcastEpisodes.reduce((acc, ep) => acc + (ep.plays || 0), 0) + 1284) * 0.004).toFixed(2)}`, sub: 'Ad-share revenue' }
                    ].map(stat => (
                      <div key={stat.label} style={{ background: ELEVATED, borderRadius: 16, padding: 16, border: `1px solid ${BORDER}`, boxShadow: '0 2px 8px rgba(0,0,0,0.01)' }}>
                        <span style={{ fontSize: 12, color: MUTED, fontWeight: 700 }}>{stat.label}</span>
                        <h4 style={{ margin: '4px 0 2px', fontSize: 22, fontWeight: 900, color: TEXT }}>{stat.value}</h4>
                        <p style={{ margin: 0, fontSize: 11, color: GREEN, fontWeight: 700 }}>{stat.sub}</p>
                      </div>
                    ))}
                  </div>

                  {/* Top Performing Episodes */}
                  <div style={{ background: ELEVATED, borderRadius: 16, padding: 16, border: `1px solid ${BORDER}`, boxShadow: '0 2px 8px rgba(0,0,0,0.01)' }}>
                    <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 800, color: TEXT }}>Top Performing Episodes</h3>
                    {podcastEpisodes.length === 0 ? (
                      <p style={{ margin: 0, fontSize: 12, color: MUTED, textAlign: 'center', padding: '14px 0' }}>No listener stats available yet.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {podcastEpisodes
                          .sort((a, b) => (b.plays || 0) - (a.plays || 0))
                          .slice(0, 5)
                          .map((ep, idx) => (
                            <div key={ep.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: SURFACE, padding: '10px 12px', borderRadius: 10 }}>
                              <div style={{ display: 'flex', gap: 10, alignItems: 'center', maxWidth: '70%' }}>
                                <span style={{ fontSize: 12, fontWeight: 800, color: MUTED }}>#{idx + 1}</span>
                                <span style={{ fontSize: 12.5, fontWeight: 700, color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {ep.title}
                                </span>
                              </div>
                              <span style={{ fontSize: 12, fontWeight: 800, color: GREEN }}>
                                {ep.plays || 0} plays
                              </span>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── EDIT CHANNEL MODAL OVERLAY ── */}
      <AnimatePresence>
        {editingChannel && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{ background: ELEVATED, width: '90%', maxWidth: 440, borderRadius: 16, padding: 20, border: `1px solid ${BORDER}`, maxHeight: '90vh', overflowY: 'auto' }}
            >
              <h3 style={{ margin: '0 0 16px', fontSize: 18 }}>Edit Channel</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 700 }}>Channel Name</label>
                <input value={editName} onChange={e => setEditName(e.target.value)} style={{ width: '100%', background: INPUT_BG, border: `1px solid ${BORDER}`, borderRadius: 8, padding: 10, fontSize: 13, outline: 'none' }} />
                
                <label style={{ fontSize: 12, fontWeight: 700 }}>Subtitle</label>
                <input value={editSubtitle} onChange={e => setEditSubtitle(e.target.value)} style={{ width: '100%', background: INPUT_BG, border: `1px solid ${BORDER}`, borderRadius: 8, padding: 10, fontSize: 13, outline: 'none' }} />
                
                <label style={{ fontSize: 12, fontWeight: 700 }}>Description</label>
                <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={3} style={{ width: '100%', background: INPUT_BG, border: `1px solid ${BORDER}`, borderRadius: 8, padding: 10, fontSize: 13, outline: 'none', resize: 'none' }} />

                <label style={{ fontSize: 12, fontWeight: 700 }}>Channel Cover Image</label>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <img 
                    src={editCoverFile ? URL.createObjectURL(editCoverFile) : editCoverUrl || 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=300&auto=format&fit=crop&q=80'} 
                    alt="" 
                    style={{ width: 64, height: 64, borderRadius: 10, objectFit: 'cover', border: `1px solid ${BORDER}` }} 
                  />
                  <div>
                    <input 
                      type="file" 
                      accept="image/*" 
                      id="edit-cover-file" 
                      style={{ display: 'none' }} 
                      onChange={e => {
                        if (e.target.files?.[0]) {
                          setEditCoverFile(e.target.files[0]);
                        }
                      }}
                    />
                    <label 
                      htmlFor="edit-cover-file"
                      style={{ background: GREEN, color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: 11.5, fontWeight: 700, cursor: 'pointer', display: 'inline-block' }}
                    >
                      Change Cover
                    </label>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
                <button onClick={() => setEditingChannel(null)} style={{ background: SURFACE, border: 'none', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                <button onClick={handleSaveChannelEdit} style={{ background: GREEN, color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}>Save Changes</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── EDIT EPISODE MODAL OVERLAY ── */}
      <AnimatePresence>
        {editingEpisode && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{ background: ELEVATED, width: '90%', maxWidth: 440, borderRadius: 16, padding: 20, border: `1px solid ${BORDER}`, maxHeight: '90vh', overflowY: 'auto' }}
            >
              <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 800 }}>Edit Episode</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 700 }}>Episode Title</label>
                <input value={editEpTitle} onChange={e => setEditEpTitle(e.target.value)} style={{ width: '100%', background: INPUT_BG, border: `1px solid ${BORDER}`, borderRadius: 8, padding: 10, fontSize: 13, outline: 'none' }} />
                
                <label style={{ fontSize: 12, fontWeight: 700 }}>Description</label>
                <textarea value={editEpDesc} onChange={e => setEditEpDesc(e.target.value)} rows={3} style={{ width: '100%', background: INPUT_BG, border: `1px solid ${BORDER}`, borderRadius: 8, padding: 10, fontSize: 13, outline: 'none', resize: 'none' }} />

                <label style={{ fontSize: 12, fontWeight: 700 }}>Episode Cover Image</label>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <img 
                    src={editEpCoverFile ? URL.createObjectURL(editEpCoverFile) : editEpCoverUrl || 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=300&auto=format&fit=crop&q=80'} 
                    alt="" 
                    style={{ width: 64, height: 64, borderRadius: 10, objectFit: 'cover', border: `1px solid ${BORDER}` }} 
                  />
                  <div>
                    <input 
                      type="file" 
                      accept="image/*" 
                      id="edit-ep-cover-file" 
                      style={{ display: 'none' }} 
                      onChange={e => {
                        if (e.target.files?.[0]) {
                          setEditEpCoverFile(e.target.files[0]);
                        }
                      }}
                    />
                    <label 
                      htmlFor="edit-ep-cover-file"
                      style={{ background: GREEN, color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: 11.5, fontWeight: 700, cursor: 'pointer', display: 'inline-block' }}
                    >
                      Change Cover
                    </label>
                  </div>
                </div>

                <label style={{ fontSize: 12, fontWeight: 700 }}>Upload New Audio File (Optional)</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <input 
                    type="file" 
                    accept="audio/*" 
                    id="edit-ep-audio-file" 
                    style={{ display: 'none' }} 
                    onChange={e => {
                      if (e.target.files?.[0]) {
                        setEditEpAudioFile(e.target.files[0]);
                      }
                    }}
                  />
                  <label 
                    htmlFor="edit-ep-audio-file"
                    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: SURFACE, border: `1px dashed ${BORDER}`, padding: '12px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: GREEN, gap: 6 }}
                  >
                    <Upload size={16} />
                    {editEpAudioFile ? editEpAudioFile.name : 'Select or Replace Audio File'}
                  </label>
                  {editEpAudioUrl && !editEpAudioFile && (
                    <span style={{ fontSize: 11, color: MUTED, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      Current: {editEpAudioUrl.split('/').pop()}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
                <button onClick={() => setEditingEpisode(null)} style={{ background: SURFACE, border: 'none', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                <button onClick={handleSaveEpisodeEdit} style={{ background: GREEN, color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}>Save Changes</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── SUCCESS TICK ANIMATION MODAL OVERLAY ── */}
      <AnimatePresence>
        {showSuccessTick && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(251,249,245,0.85)', backdropFilter: 'blur(8px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}>
            <motion.div
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 45 }}
              transition={{ type: 'spring', damping: 12, stiffness: 180 }}
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: GREEN,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 32px rgba(15,81,50,0.2)',
                color: '#fff',
                marginBottom: 20
              }}
            >
              <Check size={40} strokeWidth={4.5} />
            </motion.div>
            <motion.h2 
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ delay: 0.1 }}
              style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 900, fontSize: 20, color: TEXT, margin: 0 }}
            >
              Published Successfully!
            </motion.h2>
            <p style={{ color: MUTED, fontSize: 13, marginTop: 4 }}>Your track has been broadcasted to Beato.</p>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
