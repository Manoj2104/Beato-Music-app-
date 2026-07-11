'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { 
  Play, Pause, Heart, Share2, Plus, Check, Search, Filter, Volume2, Mic, Radio, 
  Settings, ChevronRight, BarChart2, Users, DollarSign, Clock, HelpCircle, 
  ChevronDown, MessageSquare, AlertCircle, Sparkles, Send, Globe, Upload, Info, 
  ExternalLink, UserCheck, X, ThumbsUp, MoreVertical, Award, ArrowLeft, ArrowUpRight
} from 'lucide-react';
import { usePlayerStore } from '@/store/playerStore';
import { useAuthStore } from '@/store/authStore';
import { useMusicStore } from '@/store/musicStore';

// ─────────────────────────────────────────────────────────────
// Design Tokens - pure white & dark green theme
// ─────────────────────────────────────────────────────────────
const BG = '#ffffff';
const ELEVATED = '#ffffff';
const SURFACE = '#f8f9fa';
const BORDER = '#eaeaea';
const TEXT = '#111111';
const MUTED = '#666666';
const GREEN = '#0f5132';
const GREEN_L = '#16a34a';
const INPUT_BG = '#f8f9fa';

const CHANNELS_KEY = 'beato_podcast_channels';

// ─────────────────────────────────────────────────────────────
// Type Definitions
// ─────────────────────────────────────────────────────────────
interface Episode {
  id: string;
  podcastId: string;
  title: string;
  description: string;
  duration: string;
  durationSeconds: number;
  publishDate: string;
  audioUrl: string;
  thumbnail: string;
  episodeNumber: number;
  seasonNumber: number;
  likes: number;
  commentsCount: number;
  waveform: number[];
}

interface Podcast {
  id: string;
  title: string;
  host: string;
  description: string;
  category: string;
  coverImage: string;
  rating: number;
  followers: number;
  episodesCount: number;
  episodes: Episode[];
  isFollowed: boolean;
}

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

const formatDurationSeconds = (sec: number): string => {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

const PODCAST_CATEGORIES = [
  'All', 'Technology', 'AI', 'Business', 'Finance', 'Education', 
  'Health', 'Sports', 'History', 'Religion', 'Gaming', 'Music', 'Movies', 
  'Lifestyle', 'Travel', 'Food', 'Motivation', 'Programming', 'Science', 
  'Kids', 'News', 'Crime', 'Politics'
];

export default function PodcastsView({ initialSubTab }: { initialSubTab?: 'discover' | 'live' | 'admin' }) {
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedPodcast, setSelectedPodcast] = useState<Podcast | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'discover' | 'live' | 'admin'>('discover');

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);
  
  // Follow State
  const [followedPodcasts, setFollowedPodcasts] = useState<string[]>([]);

  // Live Broadcast State
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([
    { id: '1', user: 'Vignesh', text: 'Live room initialized' }
  ]);
  const [newMsg, setNewMsg] = useState('');
  const [guests, setGuests] = useState<string[]>(['Host']);

  // Episode Player integrations
  const { playTrack, currentTrack, isPlaying } = usePlayerStore();
  const { user } = useAuthStore();
  const { getAllTracks } = useMusicStore();
  const allTracks = getAllTracks();

  // Dynamic Channels query from store tracks (where audioUrl is channel-marker and genre starts with PodcastChannel:)
  const channels: PodcastChannel[] = allTracks
    .filter(t => t.audioUrl === 'channel-marker' && t.genre?.startsWith('PodcastChannel:'))
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

  // Query real episodes
  const podcastEpisodes = allTracks.filter(t => t.genre === 'Podcast' && t.audioUrl !== 'channel-marker');

  const mappedEpisodes: Episode[] = podcastEpisodes.map(t => {
    const chan = channels.find(c => c.id === t.albumId);
    return {
      id: t.id,
      podcastId: t.albumId,
      title: t.title,
      description: t.lyrics || 'No description provided.',
      duration: formatDurationSeconds(t.duration),
      durationSeconds: t.duration,
      publishDate: (t as any).uploadedAt ? new Date((t as any).uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent',
      audioUrl: t.audioUrl,
      thumbnail: t.coverImage || chan?.coverImage || 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=300&auto=format&fit=crop&q=80',
      episodeNumber: t.trackNumber || 1,
      seasonNumber: 1,
      likes: t.plays || 0,
      commentsCount: 0,
      waveform: t.waveform || [10, 20, 30, 45, 55, 30, 25, 40, 20, 10]
    };
  });

  // Map channels + episodes together dynamically
  const podcasts: Podcast[] = channels.map(chan => {
    const channelEpisodes = mappedEpisodes.filter(t => t.podcastId === chan.id);
    return {
      id: chan.id,
      title: chan.title,
      host: chan.host,
      description: chan.description,
      category: chan.category,
      coverImage: chan.coverImage,
      rating: 5.0,
      followers: chan.followers,
      episodesCount: channelEpisodes.length,
      episodes: channelEpisodes,
      isFollowed: followedPodcasts.includes(chan.id)
    };
  });

  // Filter based on selected category chip
  const filteredPodcasts = podcasts.filter(p => 
    activeCategory === 'All' || p.category.toLowerCase() === activeCategory.toLowerCase()
  );

  // Partition episodes: first 2 of each channel go to main feed, others go to slider
  const mainEpisodesList: Episode[] = [];
  const sliderEpisodesList: Episode[] = [];

  filteredPodcasts.forEach(p => {
    mainEpisodesList.push(...p.episodes.slice(0, 2));
    sliderEpisodesList.push(...p.episodes.slice(2));
  });

  const handleFollowToggle = (id: string) => {
    if (followedPodcasts.includes(id)) {
      setFollowedPodcasts(prev => prev.filter(x => x !== id));
    } else {
      setFollowedPodcasts(prev => [...prev, id]);
    }
  };

  const handlePlayEpisode = (episode: Episode) => {
    const pod = podcasts.find(p => p.id === episode.podcastId);
    const trackPayload = {
      id: episode.id,
      title: episode.title,
      artistName: pod?.host || 'Beato Host',
      artistId: episode.podcastId,
      albumId: episode.podcastId,
      albumName: pod?.title || 'Podcast',
      duration: episode.durationSeconds,
      audioUrl: episode.audioUrl,
      coverImage: episode.thumbnail,
      genre: 'Podcast',
      plays: 0,
      lyrics: episode.description,
      uploadedBy: user?.id || 'anonymous',
      uploadedAt: new Date().toISOString(),
      year: new Date().getFullYear(),
      liked: false,
      explicit: false,
      trackNumber: episode.episodeNumber || 1
    } as any;
    playTrack(trackPayload as any, []);
  };

  const handleSendLiveMessage = () => {
    if (!newMsg.trim()) return;
    setChatMessages(prev => [...prev, { id: Date.now().toString(), user: user?.name || 'You', text: newMsg }]);
    setNewMsg('');
  };

  return (
    <div className="podcast-container" style={{ minHeight: '100%', background: BG, paddingBottom: 60 }}>
      <style>{`
        .podcast-container {
          background: #ffffff !important;
        }
        .podcast-thumbnail {
          border-radius: 20px !important;
        }
      `}</style>

      {/* ── Sub Navigator ── */}
      <div style={{ display: 'flex', gap: 14, borderBottom: `1px solid ${BORDER}`, padding: '12px 16px', overflowX: 'auto' }} className="no-scrollbar">
        <button 
          onClick={() => { setSelectedPodcast(null); setActiveSubTab('discover'); }}
          style={{ background: 'none', border: 'none', color: activeSubTab === 'discover' && !selectedPodcast ? GREEN : MUTED, fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}
        >
          <Mic size={15} /> Discover
        </button>
        <button 
          onClick={() => { setSelectedPodcast(null); setActiveSubTab('live'); }}
          style={{ background: 'none', border: 'none', color: activeSubTab === 'live' ? GREEN : MUTED, fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}
        >
          <Radio size={15} /> Live Broadcast
        </button>
        <button 
          onClick={() => { setSelectedPodcast(null); setActiveSubTab('admin'); }}
          style={{ background: 'none', border: 'none', color: activeSubTab === 'admin' ? GREEN : MUTED, fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}
        >
          <Settings size={15} /> Moderation
        </button>
      </div>

      <AnimatePresence mode="wait">
        {selectedPodcast ? (
          // ── PODCAST DETAILS VIEW ──
          <motion.div 
            key="podcast-details"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            style={{ padding: 16 }}
          >
            <button 
              onClick={() => setSelectedPodcast(null)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, background: SURFACE, border: 'none', padding: '6px 12px', borderRadius: 20, cursor: 'pointer', marginBottom: 16, color: TEXT, fontSize: 13, fontWeight: 600 }}
            >
              <ArrowLeft size={16} /> Back to Discover
            </button>

            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 20 }}>
              <img 
                src={selectedPodcast.coverImage} 
                alt="" 
                style={{ width: 130, height: 130, borderRadius: 16, objectFit: 'cover', boxShadow: '0 8px 24px rgba(43,34,26,0.1)' }} 
              />
              <div style={{ flex: 1, minWidth: 200 }}>
                <span style={{ fontSize: 11, background: SURFACE, padding: '3px 8px', borderRadius: 6, fontWeight: 700, color: GREEN }}>{selectedPodcast.category}</span>
                <h1 style={{ fontFamily: 'Outfit,sans-serif', fontSize: 24, fontWeight: 900, color: TEXT, margin: '8px 0 4px' }}>{selectedPodcast.title}</h1>
                <p style={{ color: MUTED, fontSize: 14, margin: 0 }}>Hosted by <b>{selectedPodcast.host}</b></p>
                <p style={{ color: MUTED, fontSize: 13, marginTop: 4 }}>{selectedPodcast.followers.toLocaleString()} followers · {selectedPodcast.episodesCount} episodes</p>
                
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button 
                    onClick={() => handleFollowToggle(selectedPodcast.id)}
                    style={{
                      background: followedPodcasts.includes(selectedPodcast.id) ? SURFACE : GREEN,
                      color: followedPodcasts.includes(selectedPodcast.id) ? TEXT : '#fff',
                      border: 'none', borderRadius: 20, padding: '7px 18px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
                    }}
                  >
                    {followedPodcasts.includes(selectedPodcast.id) ? <UserCheck size={14} /> : <Plus size={14} />}
                    {followedPodcasts.includes(selectedPodcast.id) ? 'Following' : 'Follow'}
                  </button>
                  <button style={{ width: 34, height: 34, borderRadius: '50%', background: SURFACE, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: TEXT, cursor: 'pointer' }}>
                    <Share2 size={15} />
                  </button>
                </div>
              </div>
            </div>

            <div style={{ background: ELEVATED, borderRadius: 14, padding: 14, border: `1px solid ${BORDER}`, marginBottom: 20 }}>
              <h3 style={{ margin: '0 0 6px', fontSize: 14, color: TEXT }}>About</h3>
              <p style={{ color: MUTED, fontSize: 13, lineHeight: 1.4, margin: 0 }}>{selectedPodcast.description}</p>
            </div>

            <h3 style={{ fontFamily: 'Outfit,sans-serif', fontSize: 18, color: TEXT, marginBottom: 12 }}>Episodes</h3>
            {selectedPodcast.episodes.length === 0 ? (
              <p style={{ color: MUTED, fontSize: 13, textAlign: 'center', padding: '24px 0' }}>No episodes published on this channel yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {selectedPodcast.episodes.map(ep => {
                  const isActive = currentTrack?.id === ep.id;
                  return (
                    <div key={ep.id} style={{ background: ELEVATED, borderRadius: 12, padding: 14, border: `1px solid ${BORDER}`, position: 'relative' }}>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <button 
                          onClick={() => handlePlayEpisode(ep)}
                          style={{ width: 36, height: 36, borderRadius: '50%', background: GREEN, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}
                        >
                          {isActive && isPlaying ? <Pause size={15} fill="white" /> : <Play size={15} fill="white" style={{ marginLeft: 2 }} />}
                        </button>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h4 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: isActive ? GREEN : TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ep.title}</h4>
                          <span style={{ fontSize: 11, color: MUTED }}>Ep {ep.episodeNumber} · {ep.duration}</span>
                        </div>
                      </div>
                      <p style={{ color: MUTED, fontSize: 12.5, lineHeight: 1.4, margin: '10px 0 0' }}>{ep.description}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        ) : activeSubTab === 'discover' ? (
          // ── PODCAST HOME (DISCOVER VIEW) ──
          <motion.div 
            key="discover-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Category Chips Scroll */}
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '12px 0 16px' }} className="no-scrollbar">
              {PODCAST_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    background: activeCategory === cat ? GREEN : ELEVATED,
                    color: activeCategory === cat ? '#fff' : TEXT,
                    border: `1px solid ${BORDER}`,
                    borderRadius: 20, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* ── Section: More Episodes Slider ── */}
            {sliderEpisodesList.length > 0 && (
               <div style={{ marginBottom: 28 }}>
                 <h2 style={{ fontFamily: 'Outfit,sans-serif', fontSize: 19, fontWeight: 800, color: TEXT, margin: '14px 0 14px' }}>
                   More Episodes
                 </h2>
                 <div 
                   style={{ 
                     display: 'flex', 
                     gap: 16, 
                     overflowX: 'auto', 
                     paddingBottom: 14, 
                     scrollSnapType: 'x mandatory', 
                     WebkitOverflowScrolling: 'touch' 
                   }} 
                   className="no-scrollbar"
                 >
                   {sliderEpisodesList.map(ep => {
                     const isActive = currentTrack?.id === ep.id;
                     const pod = podcasts.find(p => p.id === ep.podcastId);
                     return (
                       <div 
                         key={ep.id} 
                         style={{ 
                           position: 'relative', 
                           width: 280, 
                           height: 160, 
                           borderRadius: 16, 
                           overflow: 'hidden', 
                           flexShrink: 0, 
                           boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                           cursor: 'pointer',
                           scrollSnapAlign: 'start'
                         }}
                         onClick={() => handlePlayEpisode(ep)}
                       >
                         {/* Background Image */}
                         <img src={ep.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                         
                         {/* Dark Gradient Overlay */}
                         <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.1) 100%)' }} />

                         {/* Play Icon Badge */}
                         <div style={{ 
                           position: 'absolute', 
                           top: 12, 
                           right: 12, 
                           width: 36, 
                           height: 36, 
                           borderRadius: '50%', 
                           background: isActive && isPlaying ? GREEN : 'rgba(255, 255, 255, 0.9)', 
                           display: 'flex', 
                           alignItems: 'center', 
                           justifyContent: 'center',
                           color: isActive && isPlaying ? '#fff' : GREEN,
                           boxShadow: '0 4px 10px rgba(0,0,0,0.15)'
                         }}>
                           {isActive && isPlaying ? <Pause size={16} fill="white" /> : <Play size={16} fill={GREEN} style={{ marginLeft: 2 }} />}
                         </div>

                         {/* Duration Badge */}
                         <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(0,0,0,0.5)', padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, color: '#fff' }}>
                           {ep.duration}
                         </div>

                         {/* Episode Details at Bottom */}
                         <div style={{ position: 'absolute', bottom: 12, left: 12, right: 12, color: '#fff' }}>
                           <p style={{ margin: '0 0 2px', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.8 }}>
                             {pod?.title}
                           </p>
                           <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                             {ep.title}
                           </h4>
                         </div>
                       </div>
                     );
                   })}
                 </div>
               </div>
             )}

            {/* ── Section: Videos You Might Like ── */}
            <h2 style={{ fontFamily: 'Outfit,sans-serif', fontSize: 19, fontWeight: 800, color: TEXT, margin: '14px 0 14px' }}>Videos you might like</h2>
            {mainEpisodesList.length === 0 ? (
              <div style={{ marginBottom: 28 }}>
                <div style={{ background: ELEVATED, border: `1.5px dashed ${BORDER}`, borderRadius: 14, padding: '40px 16px', textAlign: 'center' }}>
                  <span style={{ fontSize: 40, display: 'block', marginBottom: 12 }}>🎙️</span>
                  <h4 style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 700, color: TEXT }}>No podcast episodes uploaded yet</h4>
                  <p style={{ margin: '0 0 16px', fontSize: 12, color: MUTED }}>Go to Podcast Creator in the sidebar to start your channel & upload episodes.</p>
                  <Link href="/podcast/creator">
                    <button 
                      style={{ background: GREEN, color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 20, fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}
                    >
                      Go to Creator Studio
                    </button>
                  </Link>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 26, marginBottom: 32 }}>
                {mainEpisodesList.slice(0, 4).map(ep => {
                  const isActive = currentTrack?.id === ep.id;
                  const pod = podcasts.find(p => p.id === ep.podcastId);
                  return (
                    <div key={ep.id} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div className="podcast-thumbnail" style={{ 
                        position: 'relative', 
                        width: '100%', 
                        paddingBottom: '56.25%', 
                        overflow: 'hidden', 
                        boxShadow: '0 8px 24px rgba(43,34,26,0.08)',
                        background: '#111'
                      }}>
                        <img src={ep.thumbnail} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                        <span style={{ 
                          position: 'absolute', 
                          top: 14, 
                          left: 14, 
                          background: 'rgba(0,0,0,0.55)', 
                          backdropFilter: 'blur(4px)',
                          color: '#fff', 
                          fontSize: 11, 
                          fontWeight: 800, 
                          fontFamily: 'monospace,sans-serif',
                          padding: '4px 10px', 
                          borderRadius: 6 
                        }}>
                          {ep.duration}
                        </span>
                        <button 
                          onClick={() => handlePlayEpisode(ep)}
                          style={{ 
                            position: 'absolute', 
                            bottom: 14, 
                            right: 14, 
                            width: 48, 
                            height: 48, 
                            borderRadius: '50%', 
                            background: GREEN, 
                            border: 'none', 
                            cursor: 'pointer', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            color: '#fff', 
                            boxShadow: '0 6px 16px rgba(0,0,0,0.25)',
                            transition: 'transform 0.2s ease'
                          }}
                        >
                          {isActive && isPlaying ? <Pause size={22} fill="white" /> : <Play size={22} fill="white" style={{ marginLeft: 2 }} />}
                        </button>
                      </div>
                      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                        <div 
                          onClick={() => pod && setSelectedPodcast(pod)}
                          style={{ width: 40, height: 40, borderRadius: '50%', background: SURFACE, overflow: 'hidden', flexShrink: 0, border: `1.5px solid ${BORDER}`, cursor: 'pointer' }}
                        >
                          <img src={pod?.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h4 style={{ margin: '0 0 4px', fontSize: 14.5, fontWeight: 700, color: TEXT, lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', letterSpacing: '-0.01em' }}>
                            {ep.title}
                          </h4>
                          <p style={{ margin: 0, fontSize: 12, fontWeight: 500, color: MUTED }}>
                            {pod?.title} · {ep.publishDate}
                          </p>
                        </div>
                        <button 
                          onClick={() => alert('Options menu')}
                          style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <MoreVertical size={18} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Section: This is for you ── */}
            <div style={{ marginBottom: 28 }}>
              <p style={{ color: MUTED, fontSize: 12, margin: '24px 0 4px', fontWeight: 600 }}>Most streamed this week</p>
              <h2 style={{ fontFamily: 'Outfit,sans-serif', fontSize: 19, fontWeight: 800, color: TEXT, margin: '0 0 14px' }}>This is for you</h2>
              {mainEpisodesList.length === 0 ? (
                <p style={{ color: MUTED, fontSize: 12, margin: '0 0 24px' }}>No episodes available yet.</p>
              ) : (
                <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 12 }} className="no-scrollbar">
                  {mainEpisodesList.map(ep => {
                    const isActive = currentTrack?.id === ep.id;
                    const pod = podcasts.find(p => p.id === ep.podcastId);
                    return (
                      <div 
                        key={`for-you-${ep.id}`}
                        onClick={() => handlePlayEpisode(ep)}
                        style={{ 
                          width: 150, 
                          flexShrink: 0, 
                          cursor: 'pointer', 
                          background: ELEVATED, 
                          border: `1.5px solid ${isActive ? GREEN : BORDER}`, 
                          borderRadius: 16, 
                          padding: 10,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div style={{ position: 'relative', width: 130, height: 130, borderRadius: 10, overflow: 'hidden', marginBottom: 8 }}>
                          <img src={ep.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <div style={{ 
                            position: 'absolute', 
                            bottom: 6, 
                            right: 6, 
                            width: 26, 
                            height: 26, 
                            borderRadius: '50%', 
                            background: GREEN, 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            color: '#fff',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                          }}>
                            {isActive && isPlaying ? <Pause size={12} fill="white" /> : <Play size={12} fill="white" style={{ marginLeft: 1 }} />}
                          </div>
                        </div>
                        <h4 style={{ margin: '0 0 2px', fontSize: 12.5, fontWeight: 700, color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {ep.title}
                        </h4>
                        <p style={{ margin: 0, fontSize: 11, color: MUTED, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {pod?.title || 'Manoj'}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Section: Similar to Your Interests ── */}
            <h2 style={{ fontFamily: 'Outfit,sans-serif', fontSize: 19, fontWeight: 800, color: TEXT, margin: '24px 0 14px' }}>Similar to your interests</h2>
            {filteredPodcasts.length === 0 ? (
              <p style={{ color: MUTED, fontSize: 12, margin: '0 0 24px' }}>Create and register your podcast channel in the Creator Studio to view it here.</p>
            ) : (
              <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 12, marginBottom: 24 }} className="no-scrollbar">
                {filteredPodcasts.map(pod => (
                  <div 
                    key={pod.id} 
                    onClick={() => setSelectedPodcast(pod)}
                    style={{ width: 140, flexShrink: 0, cursor: 'pointer' }}
                  >
                    <img src={pod.coverImage} alt="" style={{ width: 140, height: 140, borderRadius: 16, objectFit: 'cover', boxShadow: '0 6px 16px rgba(0,0,0,0.06)' }} />
                    <h4 style={{ margin: '8px 0 2px', fontSize: 13, fontWeight: 700, color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pod.title}</h4>
                    <p style={{ margin: 0, fontSize: 11, color: MUTED }}>{pod.host}</p>
                  </div>
                ))}
              </div>
            )}

            {/* ── Section: Episodes to try ── */}
            <h2 style={{ fontFamily: 'Outfit,sans-serif', fontSize: 19, fontWeight: 800, color: TEXT, margin: '24px 0 14px' }}>Episodes to try</h2>
            {mainEpisodesList.length < 5 ? (
              <p style={{ color: MUTED, fontSize: 12, margin: '0 0 24px' }}>Additional uploaded episodes will appear here for recommendation.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 26, marginBottom: 20 }}>
                {mainEpisodesList.slice(4, 8).map(ep => {
                  const isActive = currentTrack?.id === ep.id;
                  const pod = podcasts.find(p => p.id === ep.podcastId);
                  return (
                    <div key={ep.id} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div className="podcast-thumbnail" style={{ 
                        position: 'relative', 
                        width: '100%', 
                        paddingBottom: '56.25%', 
                        overflow: 'hidden', 
                        boxShadow: '0 8px 24px rgba(43,34,26,0.08)',
                        background: '#111'
                      }}>
                        <img src={ep.thumbnail} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                        <span style={{ 
                          position: 'absolute', 
                          top: 14, 
                          left: 14, 
                          background: 'rgba(0,0,0,0.55)', 
                          backdropFilter: 'blur(4px)',
                          color: '#fff', 
                          fontSize: 11, 
                          fontWeight: 800, 
                          fontFamily: 'monospace,sans-serif',
                          padding: '4px 10px', 
                          borderRadius: 6 
                        }}>
                          {ep.duration}
                        </span>
                        <button 
                          onClick={() => handlePlayEpisode(ep)}
                          style={{ 
                            position: 'absolute', 
                            bottom: 14, 
                            right: 14, 
                            width: 48, 
                            height: 48, 
                            borderRadius: '50%', 
                            background: GREEN, 
                            border: 'none', 
                            cursor: 'pointer', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            color: '#fff', 
                            boxShadow: '0 6px 16px rgba(0,0,0,0.25)'
                          }}
                        >
                          {isActive && isPlaying ? <Pause size={22} fill="white" /> : <Play size={22} fill="white" style={{ marginLeft: 2 }} />}
                        </button>
                      </div>
                      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                        <div 
                          onClick={() => pod && setSelectedPodcast(pod)}
                          style={{ width: 40, height: 40, borderRadius: '50%', background: SURFACE, overflow: 'hidden', flexShrink: 0, border: `1.5px solid ${BORDER}`, cursor: 'pointer' }}
                        >
                          <img src={pod?.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h4 style={{ margin: '0 0 4px', fontSize: 14.5, fontWeight: 700, color: TEXT, lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', letterSpacing: '-0.01em' }}>
                            {ep.title}
                          </h4>
                          <p style={{ margin: 0, fontSize: 12, fontWeight: 500, color: MUTED }}>
                            {pod?.title} · {ep.publishDate}
                          </p>
                        </div>
                        <button 
                          onClick={() => alert('Options menu')}
                          style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <MoreVertical size={18} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        ) : activeSubTab === 'live' ? (
          // ── LIVE BROADCAST VIEW ──
          <motion.div 
            key="live-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ padding: 16 }}
          >
            {isLiveActive ? (
              // ── ACTIVE LIVE CONSOLE ──
              <div style={{ background: ELEVATED, borderRadius: 16, padding: 16, border: `1px solid ${BORDER}` }}>
                {/* Live Banner */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#dc2626', animation: 'ss-pulse 1s infinite' }} />
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Live streaming</span>
                  </div>
                  <button 
                    onClick={() => setIsLiveActive(false)}
                    style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                  >
                    End Session
                  </button>
                </div>

                {/* Video/Audio visualizer simulation block */}
                <div style={{ height: 140, background: '#111', borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', position: 'relative', marginBottom: 16 }}>
                  <Mic size={36} color={GREEN_L} style={{ marginBottom: 8 }} />
                  <span style={{ fontSize: 13, fontWeight: 700 }}>Creator Broadcast Room</span>
                  <p style={{ margin: 0, fontSize: 11, color: '#999' }}>Audio levels nominal · 0 listeners</p>
                </div>

                {/* Guests list */}
                <div style={{ background: SURFACE, borderRadius: 10, padding: 10, marginBottom: 16 }}>
                  <h4 style={{ margin: '0 0 6px', fontSize: 12, color: TEXT }}>Speakers ({guests.length})</h4>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {guests.map(g => (
                      <span key={g} style={{ background: ELEVATED, padding: '3px 8px', borderRadius: 6, fontSize: 11.5, fontWeight: 700, border: `1px solid ${BORDER}` }}>🎙️ {g}</span>
                    ))}
                  </div>
                </div>

                {/* Chat feed */}
                <div style={{ border: `1px solid ${BORDER}`, borderRadius: 10, height: 180, display: 'flex', flexDirection: 'column', padding: 8, marginBottom: 10 }}>
                  <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {chatMessages.map(msg => (
                      <p key={msg.id} style={{ margin: 0, fontSize: 12, lineHeight: 1.3 }}>
                        <b style={{ color: GREEN }}>{msg.user}:</b> {msg.text}
                      </p>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                    <input 
                      value={newMsg}
                      onChange={e => setNewMsg(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSendLiveMessage()}
                      placeholder="Comment live..."
                      style={{ flex: 1, background: INPUT_BG, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '6px 10px', fontSize: 12, outline: 'none' }}
                    />
                    <button 
                      onClick={handleSendLiveMessage}
                      style={{ background: GREEN, color: '#fff', border: 'none', width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    >
                      <Send size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              // ── START LIVE SETUP ──
              <div style={{ background: ELEVATED, borderRadius: 16, padding: 20, border: `1px solid ${BORDER}`, textAlign: 'center' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(15,81,50,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <Radio size={28} color={GREEN} />
                </div>
                <h3 style={{ fontFamily: 'Outfit,sans-serif', fontSize: 18, fontWeight: 900, color: TEXT, margin: '0 0 6px' }}>Start Live Podcast Room</h3>
                <p style={{ fontSize: 13, color: MUTED, marginBottom: 20, maxWidth: 280, margin: '0 auto 20px' }}>Go live instantly, invite co-hosts, take questions via raised hands, and accept live donations.</p>
                <button 
                  onClick={() => setIsLiveActive(true)}
                  style={{ background: GREEN, color: '#fff', border: 'none', padding: '8px 24px', borderRadius: 20, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                >
                  Go Live Now 🎙️
                </button>
              </div>
            )}
          </motion.div>
        ) : (
          // ── MODERATION & CMS VIEW ──
          <motion.div 
            key="moderation-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ padding: 16 }}
          >
            <div style={{ background: ELEVATED, borderRadius: 14, padding: 16, border: `1px solid ${BORDER}` }}>
              <h3 style={{ fontFamily: 'Outfit,sans-serif', margin: '0 0 12px', fontSize: 16 }}>CMS & Moderator Panel</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { title: 'Verification Requests', badge: '0 pending', desc: 'Verify creator profiles and credentials' },
                  { title: 'Reported Episodes', badge: '0 reports', desc: 'Review explicit content reports' },
                  { title: 'Category Catalog', badge: `${PODCAST_CATEGORIES.length - 1} active`, desc: 'Manage system tags & genres' }
                ].map(item => (
                  <div key={item.title} style={{ padding: '10px 12px', borderRadius: 8, background: SURFACE, border: `1.5px solid ${BORDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 700, color: TEXT }}>{item.title}</h4>
                      <p style={{ margin: 0, fontSize: 11, color: MUTED }}>{item.desc}</p>
                    </div>
                    <span style={{ fontSize: 11, background: '#fff', padding: '3px 8px', borderRadius: 6, fontWeight: 700, color: GREEN }}>{item.badge}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
