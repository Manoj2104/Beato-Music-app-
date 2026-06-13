'use client';

import { useState, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, ChevronRight, Heart, Music, Sparkles, TrendingUp, Clock, Headphones, Star, Search, X, Plus, Check, Bell } from 'lucide-react';
import Link from 'next/link';
import TrackCard from '@/components/music/TrackCard';
import TopBar from '@/components/layout/TopBar';
import { mockAlbums, mockArtists, mockPlaylists, mockTracks } from '@/lib/mockData';
import { usePlayerStore } from '@/store/playerStore';
import { useAuthStore } from '@/store/authStore';
import { useMusicStore, trackGradient, GENRE_COLORS } from '@/store/musicStore';
import { usePlaylistStore } from '@/store/playlistStore';
import { search, SearchResult } from '@/lib/search';
import toast from 'react-hot-toast';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

const GREEN = 'var(--color-ss-primary, #1db954)';

const greet = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const quickItems = [
  { id: 'liked', label: 'Liked Songs', gradient: 'linear-gradient(135deg, #064e3b, #10b981)', icon: '♥' },
  { id: 'discover', label: 'Discover Weekly', gradient: 'linear-gradient(135deg, #022c22, #34d399)', icon: '✦' },
  { id: 'daily1', label: 'Daily Mix 1', gradient: 'linear-gradient(135deg, #0f2d1a, #84cc16)', icon: '★' },
  { id: 'midnight', label: 'Midnight Vibes', gradient: 'linear-gradient(135deg, #022c22, #0d5c3a)', icon: '🌙' },
  { id: 'workout', label: 'Workout Energy', gradient: 'linear-gradient(135deg, #10b981, #a3e635)', icon: '⚡' },
  { id: 'chill', label: 'Chill Lounge', gradient: 'linear-gradient(135deg, #065f46, #22c55e)', icon: '🌊' },
];

function AlbumCardInline({ track, onPlay, isPlaying, isActive, cardStyle = 'classic', cardSize = 'md', customImage, cardShape = 'default', cardWidth, cardHeight, isMobile = false }: {
  track: typeof mockTracks[0]; onPlay: () => void; isPlaying: boolean; isActive: boolean;
  cardStyle?: string; cardSize?: string; customImage?: string;
  cardShape?: string; cardWidth?: number; cardHeight?: number;
  isMobile?: boolean;
}) {
  const [hov, setHov] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [track.coverImage, customImage]);

  const isBanner = cardShape.startsWith('rectangle_banner');
  const isCircle = cardShape === 'circle';
  const isSquare = cardShape === 'square';

  const rawImage = customImage || track.coverImage;
  const displayImage = !imgError && rawImage && rawImage !== 'undefined' && rawImage !== 'null' ? rawImage : null;

  // Custom wrapper styles based on cardStyle
  let wrapperStyle: React.CSSProperties = {
    cursor: 'pointer',
    position: 'relative',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    display: 'flex',
    flexDirection: isBanner ? 'row' : 'column',
    alignItems: isBanner ? 'center' : 'stretch',
    gap: isBanner ? 12 : 0,
    boxSizing: 'border-box',
    width: cardWidth ? cardWidth : '100%',
    height: cardHeight ? cardHeight : 'auto',
    marginRight: 0,
    marginLeft: 0,
  };

  let imageContainerStyle: React.CSSProperties = {
    position: 'relative',
    borderRadius: isCircle ? '50%' : (cardStyle === 'retro' ? 8 : 12),
    overflow: 'hidden',
    marginBottom: isBanner ? 0 : (cardStyle === 'glass' || cardStyle === 'neo' || cardStyle === 'retro' || cardStyle === 'gradient' ? 8 : 10),
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    transition: 'all 0.3s ease',
    width: isBanner ? (cardHeight ? cardHeight : 80) : '100%',
    height: isBanner ? (cardHeight ? cardHeight : 80) : undefined,
    flexShrink: 0,
  };

  const defaultPadding = isMobile 
    ? '4px' 
    : (cardSize === 'xs' ? '6px' : cardSize === 'sm' ? '8px' : '12px');
    
  const retroPadding = isMobile 
    ? '4px' 
    : (cardSize === 'xs' ? '5px' : cardSize === 'sm' ? '7px' : '10px');

  if (cardStyle === 'glass') {
    wrapperStyle = {
      ...wrapperStyle,
      background: 'rgba(255, 255, 255, 0.03)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255, 255, 255, 0.06)',
      padding: defaultPadding,
      borderRadius: '16px',
      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      transform: hov ? 'translateY(-6px)' : 'none',
    };
    imageContainerStyle.boxShadow = 'none';
  } else if (cardStyle === 'neo') {
    wrapperStyle = {
      ...wrapperStyle,
      background: 'rgba(29, 185, 84, 0.02)',
      border: `1px solid var(--theme-primary, ${GREEN})30`,
      padding: defaultPadding,
      borderRadius: '16px',
      boxShadow: hov ? `0 0 16px var(--theme-primary, ${GREEN})30` : 'none',
      transform: hov ? 'translateY(-6px)' : 'none',
    };
    imageContainerStyle.border = hov ? `1px solid var(--theme-primary, ${GREEN})` : `1px solid var(--theme-primary, ${GREEN})20`;
  } else if (cardStyle === 'retro') {
    wrapperStyle = {
      ...wrapperStyle,
      background: '#0e021a',
      border: '2px solid #ff007f',
      padding: retroPadding,
      borderRadius: '8px',
      boxShadow: hov ? '5px 5px 0px #00ffff' : '2px 2px 0px #00ffff',
      transform: hov ? 'translate(-3px, -3px)' : 'none',
    };
    imageContainerStyle.borderRadius = 6;
  } else if (cardStyle === 'gradient') {
    wrapperStyle = {
      ...wrapperStyle,
      background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.01) 100%)',
      border: '1px solid rgba(255,255,255,0.08)',
      padding: defaultPadding,
      borderRadius: '16px',
      transform: hov ? 'scale(1.03)' : 'none',
    };
  } else {
    // classic
    wrapperStyle = {
      ...wrapperStyle,
      transform: hov ? 'translateY(-4px)' : 'none',
    };
  }

  if (isSquare) {
    wrapperStyle = {
      ...wrapperStyle,
      background: 'transparent',
      border: 'none',
      padding: 0,
      borderRadius: 0,
      boxShadow: 'none',
    };
    imageContainerStyle = {
      ...imageContainerStyle,
      borderRadius: '0px',
      boxShadow: 'none',
      border: 'none',
      marginBottom: 8,
    };
  }

  // Adjust text sizing based on cardSize
  const titleSize = cardSize === 'xs' ? 12 : cardSize === 'sm' ? 13 : 14;
  const artistSize = cardSize === 'xs' ? 10 : cardSize === 'sm' ? 11 : 12;

  return (
    <div style={wrapperStyle} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} onClick={onPlay}>
      <div style={imageContainerStyle}>
        <div style={{ width: '100%', height: isBanner ? '100%' : undefined, paddingBottom: isBanner ? undefined : '100%', background: displayImage ? 'none' : trackGradient(track.id), position: 'relative' }}>
          {displayImage ? (
            <img src={displayImage} alt="" onError={() => setImgError(true)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: cardSize === 'xs' ? 18 : cardSize === 'sm' ? 22 : 28 }}>🎵</span>
            </div>
          )}
        </div>
        <AnimatePresence>
          {hov && (
            <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
              onClick={e => { e.stopPropagation(); onPlay(); }}
              style={{
                position: 'absolute',
                bottom: cardSize === 'xs' ? 4 : cardSize === 'sm' ? 6 : 10,
                right: cardSize === 'xs' ? 4 : cardSize === 'sm' ? 6 : 10,
                width: cardSize === 'xs' ? 24 : cardSize === 'sm' ? 32 : 44,
                height: cardSize === 'xs' ? 24 : cardSize === 'sm' ? 32 : 44,
                borderRadius: '50%',
                background: GREEN,
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(29, 185, 84,0.5)',
                zIndex: 10
              }}>
              {isActive && isPlaying ? (
                <Pause size={cardSize === 'xs' ? 10 : cardSize === 'sm' ? 14 : 18} fill="black" color="black" />
              ) : (
                <Play size={cardSize === 'xs' ? 10 : cardSize === 'sm' ? 14 : 18} fill="black" color="black" />
              )}
            </motion.button>
          )}
        </AnimatePresence>
      </div>
      <div style={{ flex: 1, paddingRight: isBanner ? 12 : 0, minWidth: 0 }}>
        <p style={{ color: '#fff', fontSize: titleSize, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>{track.title}</p>
        <Link href={`/artist/${track.artistId}`} onClick={e => e.stopPropagation()} style={{ textDecoration: 'none', width: '100%', display: 'block' }}>
          <p style={{ color: '#737373', fontSize: artistSize, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.textDecoration = 'underline'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#737373'; e.currentTarget.style.textDecoration = 'none'; }}>
            {track.artistName}
          </p>
        </Link>
      </div>
    </div>
  );
}

// Custom Immersive Ad Component
function AdCard({ config, isMobile }: { config: any; isMobile: boolean }) {
  const [isMuted, setIsMuted] = useState(true);
  
  const bgImg = config.customImage || 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400&auto=format&fit=crop&q=80';
  const videoUrl = config.customVideo;
  const isVideo = config.mediaType === 'video' && videoUrl;
  
  return (
    <div style={{
      width: '100%',
      borderRadius: '8px',
      overflow: 'hidden',
      background: '#242424',
      marginBottom: '20px',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{
        position: 'relative',
        width: '100%',
        height: isMobile ? '220px' : '300px',
        backgroundColor: '#121212'
      }}>
        {isVideo ? (
          <video src={videoUrl} autoPlay loop muted={isMuted} playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        ) : (
          <img src={bgImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        )}

        <div style={{ position: 'absolute', top: '12px', left: '12px', fontSize: '11px', fontWeight: 'bold', color: '#fff', zIndex: 5, textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
          Advertisement
        </div>

        <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '8px', zIndex: 5 }}>
          {isVideo && (
            <button onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }} style={{ background: 'rgba(0, 0, 0, 0.6)', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: 'none', color: '#fff', outline: 'none' }} title={isMuted ? "Unmute" : "Mute"}>
              {isMuted ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M9 9v6a3 3 0 0 0 3 3h1.586l4.707 4.707A1 1 0 0 0 20 22V4a1 1 0 0 0-1.707-.707L13.586 8H12a3 3 0 0 0-3 3z"></path></svg> : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"></path><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>}
            </button>
          )}
          <button style={{ background: 'rgba(0, 0, 0, 0.6)', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: 'none', color: '#fff', outline: 'none' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
          </button>
        </div>
      </div>

      <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#242424', gap: '12px' }}>
        <p style={{ margin: 0, color: '#fff', fontSize: '13px', fontWeight: '700', fontFamily: 'Circular, Inter, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {config.title || 'Mashooqa - Cocktail 2'}
        </p>
        <a href={config.targetUrl || '#'} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
          <button style={{ background: '#fff', color: '#000', border: 'none', borderRadius: '20px', padding: '8px 16px', fontSize: '12px', fontWeight: '800', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'transform 0.15s' }}>
            {config.buttonText || 'Listen now'}
          </button>
        </a>
      </div>
    </div>
  );
}


function Section({ title, subtitle, link, linkText = 'Show all', children, style }: { title: string; subtitle?: string; link?: string; linkText?: string; children: ReactNode; style?: React.CSSProperties }) {
  const displayTitle = title.replace(/^[^\w\s]+\s*/, '');
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    setIsMobile(window.innerWidth <= 768);
  }, []);
  return (
    <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      style={{ marginBottom: 12, ...style }}>
      {(title || subtitle || link) && (
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {subtitle && <p style={{ color: '#a3a3a3', fontSize: 13, marginBottom: 4 }}>{subtitle}</p>}
            {title && <h2 style={{ fontFamily: 'Circular, Inter, Outfit, sans-serif', color: '#fff', fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>{displayTitle}</h2>}
          </div>
          {link && (
            <Link href={link} style={{ color: 'rgba(255,255,255,0.4)', fontSize: isMobile ? 12 : 14, fontWeight: 700, textDecoration: 'none', marginBottom: 4 }}
              onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}>
              {linkText}
            </Link>
          )}
        </div>
      )}
      {children}
    </motion.section>
  );
}

export default function HomePage() {
  const isOnline = useNetworkStatus();
  const [mounted, setMounted] = useState(false);
  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayerStore();
  const { user, toggleSavePlaylist, toggleLikeSong, setMobileDrawerOpen } = useAuthStore();
  const [isMobile, setIsMobile] = useState(false);
  const [hasShownToast, setHasShownToast] = useState(false);
  const [showMobileNotificationDropdown, setShowMobileNotificationDropdown] = useState(false);
  const { getAllTracks, getForYouTracks, uploadedTracks, recentlyPlayed, genreScores, activeArtistIds, fetchTracks } = useMusicStore();
  const { customPlaylists } = usePlaylistStore();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const approvedUploadedTracks = uploadedTracks.filter(t => t.status === 'approved');



  const [promotions, setPromotions] = useState<any[]>([]);
  const [homeLayoutOrder, setHomeLayoutOrder] = useState<string[]>([]);
  const [customSections, setCustomSections] = useState<Record<string, any>>({});
  const [activeTheme, setActiveTheme] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [events, setEvents] = useState<any[]>([]);

  // Custom interactive section states (Zepto Style)
  const [activeDealsTab, setActiveDealsTab] = useState<Record<string, string>>({});
  const [activeHubFilter, setActiveHubFilter] = useState<Record<string, string>>({});
  const [spotlightSlideIndex, setSpotlightSlideIndex] = useState<Record<string, number>>({});
  const [cartTracks, setCartTracks] = useState<any[]>([]);

  useEffect(() => {
    setMounted(true);
    fetchTracks();

    const fetchPromos = async () => {
      try {
        const res = await fetch('/api/promotions');
        const payload = await res.json();
        if (payload.success) {
          setPromotions(payload.promotions || []);
          setHomeLayoutOrder(payload.homeLayoutOrder || []);
          setCustomSections(payload.customSections || {});
          setActiveTheme(payload.activeTheme || null);
          setEvents(payload.events || []);
        }
      } catch (e) {
        console.error('Failed fetching homepage layout', e);
      }
    };
    fetchPromos();
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    if (isOnline) {
      fetchTracks();
      const fetchPromos = async () => {
        try {
          const res = await fetch('/api/promotions');
          const payload = await res.json();
          if (payload.success) {
            setPromotions(payload.promotions || []);
            setHomeLayoutOrder(payload.homeLayoutOrder || []);
            setCustomSections(payload.customSections || {});
            setActiveTheme(payload.activeTheme || null);
            setEvents(payload.events || []);
          }
        } catch (e) {
          console.error('Failed fetching homepage layout', e);
        }
      };
      fetchPromos();
      toast.success('Back online! Syncing latest music... ⚡', { id: 'online-sync' });
    }
  }, [isOnline, mounted]);

  // Auto-slider disabled — manual swipe/tap only


  // Real-time data
  const allTracks = getAllTracks();
  const forYouTracks = getForYouTracks();
  const likedSongIds = user?.likedSongs ?? [];
  const likedTracks = allTracks.filter(t => likedSongIds.includes(t.id));
  const newTracks = [...approvedUploadedTracks, ...allTracks.filter(t => !approvedUploadedTracks.some(ut => ut.id === t.id))].slice(0, 8);
  const trendingTracks = [...allTracks].sort((a, b) => b.plays - a.plays).slice(0, 8);
  const recentTracks = recentlyPlayed.length > 0 ? recentlyPlayed.slice(0, 6) : allTracks.slice(0, 6);
  const topGenres = Object.entries(genreScores).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const hasPersonalization = topGenres.length > 0;

  const activeArtistIdsList = activeArtistIds || ['artist-1', 'artist-2', 'artist-3', 'artist-4', 'artist-5', 'artist-6'];
  const activeArtists = mockArtists.filter(a => activeArtistIdsList.includes(a.id));
  const featuredArtist = activeArtists[0] || mockArtists[0];

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (!val.trim()) {
      setSearchResults(null);
      return;
    }
    const activeAlbums = mockAlbums.filter(al => activeArtistIdsList.includes(al.artistId));
    const res = search(val, {
      tracks: allTracks,
      artists: activeArtists,
      albums: activeAlbums,
      playlists: mockPlaylists
    });
    setSearchResults(res);
  };

  const renderQuickAccessGrid = (tracksToRender: typeof allTracks, maxItems = 6, configObj: any = null) => {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: 8 }}>
        {tracksToRender.slice(0, maxItems).map(track => {
          const isCurrent = currentTrack?.id === track.id;
          const imgUrl = configObj?.customImage || track.coverImage || trackGradient(track.id);
          const isUrl = imgUrl.startsWith('http') || imgUrl.startsWith('data:') || imgUrl.startsWith('/');
          return (
            <motion.div key={track.id} whileHover={{ scale: 1.02 }} onClick={() => playTrack(track, tracksToRender)}
              style={{ display: 'flex', alignItems: 'center', borderRadius: 4, overflow: 'hidden', background: '#2a2a2a', cursor: 'pointer', position: 'relative', transition: 'background 0.15s', height: 56, minWidth: 0 }}
              onMouseEnter={e => (e.currentTarget.style.background = '#3e3e3e')}
              onMouseLeave={e => (e.currentTarget.style.background = '#2a2a2a')}>
              <div style={{ width: 56, height: 56, backgroundImage: isUrl ? `url(${imgUrl})` : 'none', backgroundColor: isUrl ? 'transparent' : undefined, background: isUrl ? undefined : imgUrl, backgroundSize: 'cover', backgroundPosition: 'center', flexShrink: 0 }} />
              <span style={{ color: '#fff', fontSize: 13, fontWeight: 700, padding: '0 12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0, fontFamily: 'Circular, Inter, sans-serif' }}>{track.title}</span>
              {isCurrent && isPlaying && (
                <div style={{ marginRight: 12, display: 'flex', alignItems: 'flex-end', gap: 2 }}>
                  {[1, 2, 3].map(i => (
                    <div key={i} style={{ width: 2, background: GREEN, borderRadius: 1, height: `${4 + i * 3}px`, animation: `waveform ${0.6 + i * 0.15}s ease-in-out infinite` }} />
                  ))}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    );
  };

  const renderSectionTracks = (tracksToRender: typeof allTracks, configObj: any = null) => {
    const cStyle = configObj?.cardStyle || 'classic';
    const cSize = configObj?.cardSize || 'md';
    const isBanner = configObj?.cardShape?.includes('banner');
    
    if (isMobile) {
      // Adjusted widths to enable "peek" design (cards cut off at the edge)
      const itemWidth = isBanner ? 260 : (cSize === 'xs' ? 115 : cSize === 'sm' ? 135 : 160);
      return (
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 10, scrollbarWidth: 'none', msOverflowStyle: 'none' }} className="no-scrollbar">
          {tracksToRender.map(track => (
            <div key={track.id} style={{ width: itemWidth, flexShrink: 0, marginRight: 0 }}>
              <AlbumCardInline track={track} onPlay={() => playTrack(track, tracksToRender)} isPlaying={isPlaying} isActive={currentTrack?.id === track.id} cardStyle={cStyle} cardSize={cSize} customImage={configObj?.customImage} cardShape={configObj?.cardShape} cardWidth={configObj?.cardWidth} cardHeight={configObj?.cardHeight} isMobile={isMobile} />
            </div>
          ))}
        </div>
      );
    }

    const minW = configObj?.cardWidth ? configObj.cardWidth : (cSize === 'xs' ? 100 : cSize === 'sm' ? 140 : cSize === 'lg' ? 240 : 180);
    const cols = isBanner ? (cSize === 'lg' ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)') : `repeat(auto-fill, minmax(${minW}px, 1fr))`;
    const limit = isBanner ? (cSize === 'lg' ? 4 : 6) : (cSize === 'xs' ? 10 : cSize === 'sm' ? 8 : cSize === 'lg' ? 4 : 6);
    
    return (
      <div style={{ display: 'grid', gridTemplateColumns: cols, gap: 16 }}>
        {tracksToRender.slice(0, limit).map(track => (
          <AlbumCardInline key={track.id} track={track} onPlay={() => playTrack(track, tracksToRender)} isPlaying={isPlaying} isActive={currentTrack?.id === track.id} cardStyle={cStyle} cardSize={cSize} customImage={configObj?.customImage} cardShape={configObj?.cardShape} cardWidth={configObj?.cardWidth} cardHeight={configObj?.cardHeight} isMobile={isMobile} />
        ))}
      </div>
    );
  };

  const renderLiveEventsSection = (configObj?: any, noWrapper = false) => {
    if (events.length === 0) return null;
    
    const sortedEvents = [...events].sort((a, b) => {
      const da = new Date(a.date).getTime();
      const db = new Date(b.date).getTime();
      if (isNaN(da) && isNaN(db)) return 0;
      if (isNaN(da)) return 1;
      if (isNaN(db)) return -1;
      return da - db;
    });
    const rawLayout = configObj?.layout || 'grid';
    const layout = rawLayout.split('_')[0];
    const cSize = configObj?.cardSize || 'md';
    
    const renderCard = (event: any) => {
      const artist = mockArtists.find(a => a.id === event.artistId);
      const artistName = artist ? artist.name : 'Independent Artist';
      const artistAvatar = artist ? artist.image : '';
      
      return (
        <motion.div
          key={event.id}
          whileHover={{ y: -4, boxShadow: '0 12px 30px rgba(0,0,0,0.4)' }}
          style={{
            background: 'var(--theme-card, #121212)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 16,
            padding: cSize === 'xs' ? '12px' : cSize === 'sm' ? '16px' : '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            position: 'relative',
            overflow: 'hidden',
            width: '100%'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ff0055', animation: 'pulse 1.5s infinite' }} />
              <span style={{ fontSize: 10, color: '#ff0055', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>LIVE SHOW</span>
            </div>
            <span style={{ fontSize: 12.5, color: GREEN, fontWeight: 800 }}>{event.price || 'Free'}</span>
          </div>

          <div>
            <h3 style={{ color: '#fff', fontSize: cSize === 'xs' ? 14 : 15.5, fontWeight: 800, margin: '0 0 4px 0', fontFamily: 'Outfit, sans-serif' }}>{event.name}</h3>
            <p style={{ color: '#a3a3a3', fontSize: 11.5, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>📍 {event.location}</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: 10 }}>
            <div style={{ fontSize: 16 }}>📅</div>
            <div>
              <div style={{ color: '#fff', fontSize: 11.5, fontWeight: 700 }}>{event.date}</div>
              <div style={{ color: '#737373', fontSize: 10.5 }}>{event.time || '8:00 PM'}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', backgroundImage: artistAvatar ? `url(${artistAvatar})` : 'none', backgroundColor: artistAvatar ? 'transparent' : 'rgba(50,50,50,1)', backgroundSize: 'cover', backgroundPosition: 'center' }} />
              <span style={{ color: '#a3a3a3', fontSize: 11, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 100 }}>{artistName}</span>
            </div>

            <button
              type="button"
              onClick={async (e) => {
                e.stopPropagation();
                e.preventDefault();
                try {
                  const res = await fetch('/api/events/buy', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      eventId: event.id,
                      buyerName: user?.name || 'Anonymous Fan',
                      ticketsCount: 1
                    })
                  });
                  const data = await res.json();
                  if (data.success) {
                    toast.success(`🎫 ${data.message}`);
                  } else {
                    toast.error(data.error || 'Failed to book ticket');
                  }
                } catch (err) {
                  toast.success(`🎫 Ticket booked successfully for ${event.name}!`);
                }
              }}
              style={{
                background: GREEN,
                color: '#000',
                border: 'none',
                borderRadius: 20,
                padding: '5px 12px',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              Get Tickets
            </button>
          </div>
        </motion.div>
      );
    };

    let contentNode = null;
    if (layout === 'carousel' || layout === 'slider' || layout === 'rect') {
      const itemWidth = isMobile
        ? (cSize === 'xs' ? 140 : cSize === 'sm' ? 170 : 200)
        : (cSize === 'xs' ? 200 : cSize === 'sm' ? 240 : 280);
      contentNode = (
        <div style={{ display: 'flex', gap: isMobile ? 10 : 16, overflowX: 'auto', paddingBottom: 10, scrollbarWidth: 'none', msOverflowStyle: 'none' }} className="no-scrollbar">
          {sortedEvents.map(event => (
            <div key={event.id} style={{ width: itemWidth, flexShrink: 0, marginRight: isMobile ? 0 : undefined }}>
              {renderCard(event)}
            </div>
          ))}
        </div>
      );
    } else if (layout === 'list') {
      contentNode = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sortedEvents.map(event => {
            const artist = mockArtists.find(a => a.id === event.artistId);
            const artistName = artist ? artist.name : 'Independent Artist';
            const artistAvatar = artist ? artist.image : '';
            return (
              <div key={event.id} style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                alignItems: isMobile ? 'stretch' : 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.04)',
                borderRadius: 12,
                gap: isMobile ? 12 : 16
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundImage: artistAvatar ? `url(${artistAvatar})` : 'none', backgroundColor: artistAvatar ? 'transparent' : 'rgba(50,50,50,1)', backgroundSize: 'cover', backgroundPosition: 'center', flexShrink: 0 }} />
                  <div>
                    <h4 style={{ color: '#fff', fontSize: 14, fontWeight: 700, margin: 0 }}>{event.name}</h4>
                    <p style={{ color: '#737373', fontSize: 11.5, margin: '2px 0 0 0' }}>
                      {artistName} • 📍 {event.location}
                    </p>
                    <p style={{ color: '#a3a3a3', fontSize: 10.5, margin: '2px 0 0 0' }}>
                      📅 {event.date} at {event.time || '8:00 PM'}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: isMobile ? 'space-between' : 'flex-end', gap: 16 }}>
                  <span style={{ fontSize: 13, color: GREEN, fontWeight: 800 }}>{event.price || 'Free'}</span>
                  <button
                    type="button"
                    onClick={async (e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      try {
                        const res = await fetch('/api/events/buy', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            eventId: event.id,
                            buyerName: user?.name || 'Anonymous Fan',
                            ticketsCount: 1
                          })
                        });
                        const data = await res.json();
                        if (data.success) {
                          toast.success(`🎫 ${data.message}`);
                        } else {
                          toast.error(data.error || 'Failed to book ticket');
                        }
                      } catch (err) {
                        toast.success(`🎫 Ticket booked successfully for ${event.name}!`);
                      }
                    }}
                    style={{ background: GREEN, color: '#000', border: 'none', borderRadius: 20, padding: '5px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer', width: isMobile ? 'auto' : 'initial' }}
                  >
                    Get Tickets
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      );
    } else if (layout === 'hero') {
      const event = sortedEvents[0];
      if (!event) return null;
      const artist = mockArtists.find(a => a.id === event.artistId);
      const artistName = artist ? artist.name : 'Independent Artist';
      const artistAvatar = artist ? artist.image : '';

      contentNode = (
        <motion.div
          key={event.id}
          whileHover={{ scale: 1.01 }}
          style={{
            borderRadius: 16,
            overflow: 'hidden',
            position: 'relative',
            height: isMobile ? 'auto' : 220,
            border: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'linear-gradient(135deg, #1e0b36 0%, #080312 100%)',
            cursor: 'pointer',
            width: '100%',
            padding: isMobile ? '20px' : '0'
          }}
        >
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0.65) 100%)', zIndex: 1 }} />
          {artistAvatar && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
              <img src={artistAvatar} alt={event.name} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.25, filter: 'blur(2px)' }} />
            </div>
          )}
          
          <div style={{
            position: 'relative',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'stretch' : 'center',
            padding: isMobile ? '0' : '0 28px',
            zIndex: 2,
            height: '100%',
            gap: isMobile ? 16 : 0
          }}>
            <div style={{ maxWidth: isMobile ? '100%' : '65%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ff0055', animation: 'pulse 1.5s infinite' }} />
                <span style={{ color: '#ff0055', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  FEATURED LIVE SHOW
                </span>
              </div>
              <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: isMobile ? 20 : 24, fontWeight: 950, color: '#fff', marginBottom: 4 }}>
                {event.name}
              </h2>
              <p style={{ color: '#aaa', fontSize: 12.5, marginBottom: 14 }}>
                👤 {artistName} • 📍 {event.location}
              </p>
              <button
                type="button"
                onClick={async (e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  try {
                    const res = await fetch('/api/events/buy', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        eventId: event.id,
                        buyerName: user?.name || 'Anonymous Fan',
                        ticketsCount: 1
                      })
                    });
                    const data = await res.json();
                    if (data.success) {
                      toast.success(`🎫 ${data.message}`);
                    } else {
                      toast.error(data.error || 'Failed to book ticket');
                    }
                  } catch (err) {
                    toast.success(`🎫 Ticket booked successfully for ${event.name}!`);
                  }
                }}
                style={{
                  padding: '8px 20px',
                  borderRadius: 100,
                  background: GREEN,
                  border: 'none',
                  color: '#000',
                  fontWeight: 700,
                  fontSize: 11.5,
                  cursor: 'pointer',
                  fontFamily: 'Outfit, sans-serif',
                  transition: 'transform 0.15s',
                  width: isMobile ? '100%' : 'auto'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                Get Tickets • {event.price || 'Free'}
              </button>
            </div>
            
            <div style={{
              marginLeft: isMobile ? '0' : 'auto',
              display: 'flex',
              flexDirection: isMobile ? 'row' : 'column',
              alignItems: 'center',
              gap: 10,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              padding: isMobile ? '10px 14px' : '16px 20px',
              borderRadius: 14,
              justifyContent: isMobile ? 'center' : 'flex-start'
            }}>
              <span style={{ fontSize: isMobile ? 18 : 24 }}>📅</span>
              <div style={{ textAlign: isMobile ? 'left' : 'center' }}>
                <div style={{ color: '#fff', fontSize: 12.5, fontWeight: 700 }}>{event.date}</div>
                <div style={{ color: '#a3a3a3', fontSize: 11 }}>{event.time || '8:00 PM'}</div>
              </div>
            </div>
          </div>
        </motion.div>
      );
    } else {
      const minW = cSize === 'xs' ? 200 : cSize === 'sm' ? 240 : 280;
      contentNode = (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${minW}px, 1fr))`, gap: 16 }}>
          {sortedEvents.map(event => renderCard(event))}
        </div>
      );
    }

    if (noWrapper) return contentNode;

    return (
      <Section key="live_events" title="🔴 Live Concerts & Events" subtitle="Catch your favorite artists live in action!">
        {contentNode}
      </Section>
    );
  };

  const renderHomeSection = (sectionId: string) => {
    const config = customSections[sectionId];
    if (config) {
      if (!isMobile && config.hiddenOnLaptop) return null;
      if (isMobile && config.hiddenOnMobile) return null;
    }
    const isQuickAccess = sectionId === 'quick_access' || 
                          sectionId.startsWith('sec_quick_access') || 
                          sectionId.includes('quick_access') ||
                          (config && (config.type === 'quick_access' || config.type === 'quick'));

    if (isQuickAccess) {
      const defaultTitle = mounted ? greet() : 'Good evening';
      const displayTitle = (!config?.title || config.title === 'Quick Access Greeting' || config.title === 'Quick Access') 
        ? defaultTitle 
        : config.title;

      interface QuickAccessItem {
        id: string;
        label: string;
        href: string;
        gradient?: string;
        icon?: string;
        coverImage?: string | null;
        playlistId?: string;
      }

      // Construct default items
      const DEFAULT_QUICK_ITEMS: QuickAccessItem[] = [
        { id: 'liked', label: 'Liked Songs', gradient: 'linear-gradient(135deg, #4338ca, #60a5fa)', icon: '♥', href: '/library?tab=liked' },
        { id: 'discover', label: 'Discover Weekly', gradient: 'linear-gradient(135deg, #1e3a5f, #7c3aed)', icon: '✦', href: '/playlist/playlist-2', playlistId: 'playlist-2' },
        { id: 'daily1', label: 'Daily Mix 1', gradient: 'linear-gradient(135deg, #5b21b6, #be185d)', icon: '★', href: '/playlist/playlist-3', playlistId: 'playlist-3' },
        { id: 'midnight', label: 'Midnight Vibes', gradient: 'linear-gradient(135deg, #1e3a5f, #1e40af)', icon: '🌙', href: '/playlist/playlist-4', playlistId: 'playlist-4' },
        { id: 'workout', label: 'Workout Energy', gradient: 'linear-gradient(135deg, #92400e, #dc2626)', icon: '⚡', href: '/playlist/playlist-5', playlistId: 'playlist-5' },
        { id: 'chill', label: 'Chill Lounge', gradient: 'linear-gradient(135deg, #065f46, #0e7490)', icon: '🌊', href: '/playlist/playlist-6', playlistId: 'playlist-6' },
      ];

      // Get user's saved/custom playlists
      const userCustomPlaylists = customPlaylists.filter(p => p.ownerId === user?.id || user?.playlists?.includes(p.id));
      const userSavedMockPlaylists = mockPlaylists.filter(p => user?.playlists?.includes(p.id) && p.id !== 'playlist-1');

      // Map user playlists to item format
      const mappedUserPlaylists: QuickAccessItem[] = [...userCustomPlaylists, ...userSavedMockPlaylists].map(playlist => {
        const isUrl = playlist.coverImage && playlist.coverImage !== 'undefined' && playlist.coverImage !== 'null';
        let gradient = playlist.gradientCss || 'linear-gradient(135deg, #1e3a5f, #0ea5e9)';
        
        let fallbackImg = '';
        if (!isUrl) {
          const firstTrackId = playlist.tracks?.[0];
          if (firstTrackId) {
            const firstTrack = allTracks.find((t: any) => t.id === firstTrackId);
            if (firstTrack && firstTrack.coverImage) {
              fallbackImg = firstTrack.coverImage;
            }
          }
        }

        return {
          id: playlist.id,
          label: playlist.title,
          href: `/playlist/${playlist.id}`,
          coverImage: isUrl ? playlist.coverImage : (fallbackImg || null),
          gradient: isUrl || fallbackImg ? undefined : gradient,
          icon: isUrl || fallbackImg ? undefined : '🎶',
          playlistId: playlist.id
        };
      });

      // Combine items: Liked Songs -> User Saved Playlists -> Default Playlists (no duplicates)
      const combinedItems = [
        DEFAULT_QUICK_ITEMS[0],
        ...mappedUserPlaylists,
        ...DEFAULT_QUICK_ITEMS.slice(1).filter(defItem => 
          !mappedUserPlaylists.some(userItem => userItem.playlistId === defItem.playlistId)
        )
      ];

      // Always slice to the first 6 items for the home page layout
      const itemsToRender = combinedItems.slice(0, 6);

      return (
        <div key={sectionId} style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 26, fontWeight: 900, color: '#fff' }}>
              {displayTitle}{user ? `, ${user.name}` : ''}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {hasPersonalization && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 100, background: 'rgba(29, 185, 84,0.12)', border: '1px solid rgba(29, 185, 84,0.2)' }}>
                  <Sparkles size={12} color={GREEN} />
                  <span style={{ color: GREEN, fontSize: 11, fontWeight: 700 }}>Personalized</span>
                </div>
              )}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: 8 }}>
            {itemsToRender.map((item) => {
              let tracks: typeof mockTracks = [];
              let playlistObj: any = null;
              
              if (item.id === 'liked') {
                tracks = likedTracks;
              } else {
                playlistObj = customPlaylists.find(p => p.id === item.id) || 
                              mockPlaylists.find(p => p.id === item.id);
                if (playlistObj) {
                  tracks = playlistObj.tracks.map((tid: string) => 
                    allTracks.find(t => t.id === tid) || mockTracks.find(t => t.id === tid)
                  ).filter((t: any): t is typeof mockTracks[0] => !!t);
                }
              }

              const isCurrent = tracks.length > 0 && tracks.some(t => t.id === currentTrack?.id);
              const isSaved = playlistObj ? (user?.playlists || []).includes(playlistObj.id) : false;
              const hasImg = !!item.coverImage;

              return (
                <Link key={item.id} href={item.href} style={{ textDecoration: 'none', display: 'block', width: '100%', minWidth: 0 }}>
                  <motion.div whileHover={{ scale: 1.02 }}
                    style={{ display: 'flex', alignItems: 'center', borderRadius: 4, overflow: 'hidden', background: '#2a2a2a', cursor: 'pointer', position: 'relative', transition: 'background 0.15s', height: 56, minWidth: 0 }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#3e3e3e')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#2a2a2a')}>
                    <div style={{ 
                      width: 56, 
                      height: 56, 
                      backgroundImage: hasImg ? `url(${item.coverImage})` : 'none',
                      backgroundColor: hasImg ? 'transparent' : undefined,
                      background: hasImg ? undefined : item.gradient,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontSize: 20, 
                      flexShrink: 0 
                    }}>
                      {!hasImg && item.icon}
                    </div>
                    <span style={{ color: '#fff', fontSize: 13, fontWeight: 700, padding: '0 12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0, fontFamily: 'Circular, Inter, sans-serif' }}>{item.label}</span>
                    {isCurrent && (
                      <div style={{ marginRight: 12, display: 'flex', alignItems: 'flex-end', gap: 2 }}>
                        {[1, 2, 3].map(i => (
                          <div key={i} style={{ width: 2, background: GREEN, borderRadius: 1, height: `${4 + i * 3}px`, animation: `waveform ${0.6 + i * 0.15}s ease-in-out infinite` }} />
                        ))}
                      </div>
                    )}
                    {!isMobile && playlistObj && playlistObj.id !== 'playlist-1' && (
                      <button
                        onClick={e => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleSavePlaylist(playlistObj.id);
                        }}
                        style={{
                          marginRight: 12,
                          background: 'none',
                          border: 'none',
                          color: isSaved ? GREEN : 'rgba(255,255,255,0.4)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: 6,
                          borderRadius: '50%',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.color = '#fff';
                          e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.color = isSaved ? GREEN : 'rgba(255,255,255,0.4)';
                          e.currentTarget.style.background = 'none';
                        }}
                      >
                        {isSaved ? <Check size={14} strokeWidth={3} /> : <Plus size={14} strokeWidth={2.5} />}
                      </button>
                    )}
                  </motion.div>
                </Link>
              );
            })}
          </div>
          {combinedItems.length > 6 && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
              <Link href="/library" style={{ textDecoration: 'none' }}>
                <button 
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#fff',
                    borderRadius: 20,
                    padding: '8px 24px',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.14)';
                    e.currentTarget.style.transform = 'scale(1.02)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                    e.currentTarget.style.transform = 'none';
                  }}
                >
                  View More
                </button>
              </Link>
            </div>
          )}
        </div>
      );
    }

    let typeToRender = sectionId;
    const isLikedBanner = config?.type === 'liked_songs_banner' || 
                          sectionId.includes('liked_songs_banner') ||
                          (config?.contentSource === 'liked' && (config?.layout === 'banner' || config?.title?.includes('Banner'))) ||
                          (config?.type === 'liked_songs' && (config?.layout === 'banner' || config?.title?.includes('Banner')));
    if (isLikedBanner) {
      typeToRender = 'liked_songs_banner';
    }

    switch (typeToRender) {
      case 'live_events':
        return renderLiveEventsSection();

      case 'liked_songs_banner':
        if (likedTracks.length === 0) return null;
        return (
          <motion.div key="liked_songs" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            style={{ marginBottom: 32, borderRadius: 18, padding: '20px 24px', background: 'linear-gradient(135deg, rgba(67,56,202,0.3), rgba(96,165,250,0.15))', border: '1px solid rgba(67,56,202,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 52, height: 52, borderRadius: 10, background: 'linear-gradient(135deg, #4338ca, #60a5fa)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Heart size={22} color="white" fill="white" />
              </div>
              <div>
                <p style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>Liked Songs</p>
                <p style={{ color: '#a3a3a3', fontSize: 13 }}>{likedTracks.length} song{likedTracks.length !== 1 ? 's' : ''} you love</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button onClick={() => { if (likedTracks.length) playTrack(likedTracks[0], likedTracks.slice(1)); }}
                style={{ width: 44, height: 44, borderRadius: '50%', background: GREEN, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(29, 185, 84,0.4)' }}>
                <Play size={18} fill="black" color="black" />
              </button>
              <Link href="/library?tab=liked" style={{ color: '#737373', fontSize: 13, textDecoration: 'none' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={e => (e.currentTarget.style.color = '#737373')}>View all →</Link>
            </div>
          </motion.div>
        );

      case 'promotions_hero': {
        if (promotions.length === 0 && !isMobile) return null;
        const promosToRender = promotions.length > 0 ? promotions : [{
          id: 'mock-ad',
          title: 'Midnight Cascade',
          description: 'Experience the ultimate deep house collection curated by Beato.',
          image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&auto=format&fit=crop&q=80',
          type: 'playlist',
          targetId: 'playlist-1'
        }];
        return (
          <div key="promotions_hero" style={{ marginBottom: 32, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {promosToRender.map((promo) => {
              if (isMobile) {
                return (
                  <div
                    key={promo.id}
                    style={{
                      borderRadius: 16,
                      overflow: 'hidden',
                      background: '#121212',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      flexDirection: 'column',
                      width: '100%',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                      position: 'relative'
                    }}
                  >
                    <div style={{ position: 'relative', width: '100%', aspectRatio: '1.7 / 1', overflow: 'hidden' }}>
                      <img
                        src={promo.image || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&auto=format&fit=crop&q=80'}
                        alt={promo.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <div style={{
                        position: 'absolute',
                        top: 12,
                        left: 12,
                        background: 'rgba(0, 0, 0, 0.6)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        padding: '4px 8px',
                        borderRadius: 4,
                        fontSize: 10,
                        fontWeight: 700,
                        color: '#fff',
                        letterSpacing: '0.05em'
                      }}>
                        Featured Campaign
                      </div>
                      <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(0, 0, 0, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12 }}>
                          🔊
                        </div>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(0, 0, 0, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 'bold' }}>
                          ⋮
                        </div>
                      </div>
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '16px 20px',
                      background: '#121212',
                    }}>
                      <div style={{ minWidth: 0, flex: 1, marginRight: 16 }}>
                        <h3 style={{
                          color: '#fff',
                          fontSize: 16,
                          fontWeight: 800,
                          margin: 0,
                          fontFamily: 'Outfit, sans-serif'
                        }}>
                          {promo.title}
                        </h3>
                        <p style={{
                          color: '#a3a3a3',
                          fontSize: 12,
                          margin: '4px 0 0 0',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {promo.description}
                        </p>
                      </div>
                      <Link href={`/playlist/${promo.targetId || 'playlist-1'}`}>
                        <button style={{
                          background: '#fff',
                          color: '#000',
                          border: 'none',
                          borderRadius: 30,
                          padding: '10px 22px',
                          fontSize: 13,
                          fontWeight: 800,
                          cursor: 'pointer',
                          fontFamily: 'Outfit, sans-serif',
                          flexShrink: 0,
                          boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
                        }}>
                          Listen Now
                        </button>
                      </Link>
                    </div>
                  </div>
                );
              }

              let targetPath = '/';
              if (promo.type === 'playlist') {
                targetPath = `/playlist/${promo.targetId || 'playlist-1'}`;
              } else if (promo.type === 'album') {
                targetPath = `/album/${promo.targetId || 'album-1'}`;
              } else if (promo.targetId) {
                targetPath = promo.targetId.startsWith('/') ? promo.targetId : `/playlist/${promo.targetId}`;
              }

              return (
                <motion.div
                  key={promo.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    borderRadius: 18,
                    overflow: 'hidden',
                    position: 'relative',
                    height: 180,
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    background: '#121212',
                    cursor: 'pointer'
                  }}
                >
                  {promo.image && (
                    <div style={{ position: 'absolute', inset: 0 }}>
                      <img src={promo.image} alt={promo.title} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }} />
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0.55) 100%)' }} />
                    </div>
                  )}
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', padding: '0 28px', zIndex: 2 }}>
                    <div style={{ maxWidth: '65%' }}>
                      <span style={{ color: GREEN, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 6 }}>
                        🔥 Special Promotion • {promo.type}
                      </span>
                      <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 22, fontWeight: 950, color: '#fff', marginBottom: 4 }}>
                        {promo.title}
                      </h2>
                      <p style={{ color: '#aaa', fontSize: 12, marginBottom: 14, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {promo.description}
                      </p>
                      <Link href={targetPath}>
                        <button style={{ padding: '8px 20px', borderRadius: 100, background: GREEN, border: 'none', color: '#000', fontWeight: 700, fontSize: 11, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>
                          Explore Feature
                        </button>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        );
      }

      case 'made_for_you': {
        const config = customSections[sectionId];
        return (
          <Section
            key="made_for_you"
            title={`${hasPersonalization ? '🤖 ' : '🎵 '}${hasPersonalization ? 'Made For You' : 'Picked For You'}`}
            subtitle={hasPersonalization ? `Based on your love of ${topGenres.map(([g]) => g).slice(0, 2).join(' & ')}` : 'AI-curated based on your taste'}
            link="/library">
            {config?.layout === 'minimal_quick_access' ? renderQuickAccessGrid(forYouTracks, 6, config) : renderSectionTracks(forYouTracks, config)}
          </Section>
        );
      }

      case 'featured_artist':
        return (
          <Section key="featured_artist" title="🎤 Featured Artist">
            <div style={{ borderRadius: 18, overflow: 'hidden', position: 'relative', height: 220, cursor: 'pointer' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #0d3a1a, #1a1a3a, #2d0f3d)' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 100%)' }} />
              {/* Animated orbs */}
              <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(29, 185, 84,0.15)', filter: 'blur(40px)' }} />
              <div style={{ position: 'absolute', bottom: -40, right: 100, width: 160, height: 160, borderRadius: '50%', background: 'rgba(16, 185, 129,0.15)', filter: 'blur(40px)' }} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', padding: '0 32px' }}>
                <div>
                  <span style={{ color: GREEN, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 8 }}>🎵 Featured Artist</span>
                  <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 40, fontWeight: 900, color: '#fff', marginBottom: 6 }}>{featuredArtist.name}</h2>
                  <p style={{ color: '#a3a3a3', fontSize: 13, marginBottom: 18 }}>
                    {featuredArtist.genres.join(' · ')} · {(featuredArtist.monthlyListeners / 1_000_000).toFixed(1)}M monthly listeners
                  </p>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => { const tracks = allTracks.filter(t => t.artistId === featuredArtist.id); if (tracks.length) playTrack(tracks[0], tracks.slice(1)); }}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 22px', borderRadius: 100, background: GREEN, border: 'none', color: '#000', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>
                      <Play size={16} fill="black" /> Play
                    </button>
                    <Link href={`/artist/${featuredArtist.id}`}>
                      <button style={{ padding: '10px 22px', borderRadius: 100, background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                        View Artist
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </Section>
        );

      case 'new_music': {
        const config = customSections[sectionId];
        return (
          <Section key="new_music" title="🆕 New Music" subtitle={approvedUploadedTracks.length > 0 ? `Including ${approvedUploadedTracks.length} newly uploaded track${approvedUploadedTracks.length > 1 ? 's' : ''}` : 'Fresh drops this week'} link="/search">
            {renderSectionTracks(newTracks, config)}
          </Section>
        );
      }

      case 'trending_now':
        return (
          <Section key="trending_now" title="🔥 Trending Now" subtitle="Most streamed this week">
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
              {!isMobile && (
                <div style={{ display: 'grid', gridTemplateColumns: '20px 44px 1fr 1fr 90px', gap: 12, padding: '10px 14px 8px', color: '#525252', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <span>#</span><span /><span>Title</span><span>Album</span><span style={{ textAlign: 'right' }}>Duration</span>
                </div>
              )}
              {trendingTracks.slice(0, 6).map((track, i) => (
                <TrackCard key={track.id} track={track} index={i} queue={trendingTracks} />
              ))}
            </div>
          </Section>
        );

      case 'your_taste':
        if (!hasPersonalization) return null;
        return (
          <Section key="your_taste" title="🎯 Your Taste" subtitle="Genres you've been exploring">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {topGenres.map(([genre, score]) => (
                <div key={genre} style={{ padding: '18px 20px', borderRadius: 14, background: `linear-gradient(135deg, ${GENRE_COLORS[genre] || '#1db954'}25, ${GENRE_COLORS[genre] || '#1db954'}10)`, border: `1px solid ${GENRE_COLORS[genre] || '#1db954'}30`, cursor: 'pointer' }}>
                  <p style={{ color: '#fff', fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{genre}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: GENRE_COLORS[genre] || GREEN, width: `${Math.min(100, (score / (topGenres[0][1] || 1)) * 100)}%`, borderRadius: 2 }} />
                    </div>
                    <span style={{ color: '#737373', fontSize: 11 }}>{score} plays</span>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        );

      case 'recently_played': {
        const config = customSections[sectionId];
        return (
          <Section key="recently_played" title="⏱ Recently Played" link="/library">
            {config?.layout === 'minimal_quick_access' ? renderQuickAccessGrid(recentTracks, 6, config) : renderSectionTracks(recentTracks, config)}
          </Section>
        );
      }

      case 'mood_playlists':
        return (
          <Section key="mood_playlists" title="😌 Mood Playlists" subtitle="Music for every moment">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {[
                { mood: 'Happy', emoji: '😊', gradient: 'linear-gradient(135deg, #d97706, #f59e0b)', songs: 45 },
                { mood: 'Chill', emoji: '😌', gradient: 'linear-gradient(135deg, #0e7490, #06b6d4)', songs: 41 },
                { mood: 'Energetic', emoji: '⚡', gradient: 'linear-gradient(135deg, #b91c1c, #f97316)', songs: 56 },
                { mood: 'Romantic', emoji: '💖', gradient: 'linear-gradient(135deg, #9d174d, #34d399)', songs: 28 },
                { mood: 'Focus', emoji: '🎯', gradient: 'linear-gradient(135deg, #065f46, #1db954)', songs: 37 },
                { mood: 'Sad', emoji: '😢', gradient: 'linear-gradient(135deg, #1e3a5f, #6366f1)', songs: 32 },
              ].map(item => {
                const tracks = mockTracks.slice(0, 4);
                return (
                  <motion.div key={item.mood} whileHover={{ scale: 1.02 }}
                    onClick={() => { if (tracks.length) playTrack(tracks[0], tracks.slice(1)); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', borderRadius: 14, background: item.gradient, cursor: 'pointer' }}>
                    <span style={{ fontSize: 32 }}>{item.emoji}</span>
                    <div>
                      <p style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>{item.mood}</p>
                      <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>{item.songs} songs</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </Section>
        );

      case 'daily_mixes':
        return (
          <Section key="daily_mixes" title="🎵 Your Daily Mixes" subtitle="Personalized for you">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { title: 'Daily Mix 1', desc: 'Aurora Nightfall, Nyx & Prometheus and more', gradient: 'linear-gradient(135deg, #4c1d95, #7c3aed)', emoji: '🌃' },
                { title: 'Daily Mix 2', desc: 'Selene Ray, Cipher Nova and more', gradient: 'linear-gradient(135deg, #831843, #34d399)', emoji: '🌸' },
                { title: 'Daily Mix 3', desc: 'The Velvet Echoes, Marco Santos and more', gradient: 'linear-gradient(135deg, #78350f, #f59e0b)', emoji: '🎸' },
                { title: 'Daily Mix 4', desc: 'Based on your recent plays', gradient: 'linear-gradient(135deg, #064e3b, #10b981)', emoji: '🌊' },
              ].map((mix, i) => {
                const tracks = mockTracks.slice(i * 3, i * 3 + 3);
                return (
                  <motion.div key={mix.title} whileHover={{ scale: 1.01 }}
                    onClick={() => { if (tracks.length) playTrack(tracks[0], tracks.slice(1)); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', borderRadius: 14, background: mix.gradient, cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.15)' }} />
                    <span style={{ fontSize: 28, position: 'relative', zIndex: 1 }}>{mix.emoji}</span>
                    <div style={{ position: 'relative', zIndex: 1, flex: 1, minWidth: 0 }}>
                      <p style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>{mix.title}</p>
                      <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mix.desc}</p>
                    </div>
                    <Play size={20} color="rgba(255,255,255,0.8)" fill="rgba(255,255,255,0.8)" style={{ position: 'relative', zIndex: 1, flexShrink: 0 }} />
                  </motion.div>
                );
              })}
            </div>
          </Section>
        );

      default:
        if (sectionId.startsWith('promo_')) {
          const promoId = sectionId.replace('promo_', '');
          const promo = promotions.find((p: any) => p.id === promoId);
          if (!promo) return null;

          let targetPath = '/';
          if (promo.type === 'playlist') {
            targetPath = `/playlist/${promo.targetId || 'playlist-1'}`;
          } else if (promo.type === 'album') {
            targetPath = `/album/${promo.targetId || 'album-1'}`;
          } else if (promo.targetId) {
            targetPath = promo.targetId.startsWith('/') ? promo.targetId : `/playlist/${promo.targetId}`;
          }

          return (
            <motion.div
              key={sectionId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                borderRadius: 18,
                overflow: 'hidden',
                position: 'relative',
                height: 180,
                border: '1px solid rgba(255, 255, 255, 0.08)',
                background: '#121212',
                cursor: 'pointer',
                marginBottom: 32
              }}
            >
              {promo.image && (
                <div style={{ position: 'absolute', inset: 0 }}>
                  <img src={promo.image} alt={promo.title} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0.55) 100%)' }} />
                </div>
              )}
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', padding: '0 28px', zIndex: 2 }}>
                <div style={{ maxWidth: '65%' }}>
                  <span style={{ color: GREEN, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 6 }}>
                    🔥 Special Promotion • {promo.type}
                  </span>
                  <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 22, fontWeight: 950, color: '#fff', marginBottom: 4 }}>
                    {promo.title}
                  </h2>
                  <p style={{ color: '#aaa', fontSize: 12, marginBottom: 14, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {promo.description}
                  </p>
                  <Link href={targetPath}>
                    <button style={{ padding: '8px 20px', borderRadius: 100, background: GREEN, border: 'none', color: '#000', fontWeight: 700, fontSize: 11, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>
                      Explore Feature
                    </button>
                  </Link>
                </div>
              </div>
            </motion.div>
          );
        }

        const config = customSections[sectionId];
        if (config) {
          // Audience segment guard
          if (config.audience && config.audience !== 'all') {
            const sub = user?.subscription || 'free';
            if (config.audience === 'premium' && sub === 'free') return null;
            if (config.audience === 'free' && sub !== 'free') return null;
          }

          // Schedule calendar dates guard
          const now = new Date();
          if (config.startDate && new Date(config.startDate) > now) return null;
          if (config.endDate && new Date(config.endDate) < now) return null;

          const isLiveEvents = config.type === 'ticket_sales' || config.type === 'live_event_cta' || config.type === 'live_events' || sectionId.includes('live_event') || sectionId.includes('ticket_sales');

          if (isLiveEvents) {
            // ── Background styles ──
            const bgType = config.background?.type || config.bgStyle;
            const bgVal = config.background?.value || '';

            const hasBackground = bgType && bgType !== 'none' && bgType !== 'default';
            const defaultPadding = hasBackground ? '24px' : '0';
            const defaultMarginBottom = hasBackground ? 40 : 8;

            let containerStyle: React.CSSProperties = {
              marginBottom: defaultMarginBottom,
              borderRadius: 18,
              transition: 'all 0.3s ease',
              padding: config.padding === 'none' ? '0' : config.padding === 'sm' ? '12px' : config.padding === 'lg' ? '32px' : defaultPadding,
              position: 'relative',
              overflow: hasBackground ? 'hidden' : 'visible'
            };

            if (bgType === 'gradient' || bgType === 'gradient_emerald' || bgType === 'gradient_purple') {
              containerStyle.background = 'linear-gradient(180deg, rgba(29, 185, 84, 0.08) 0%, rgba(0,0,0,0) 100%)';
              containerStyle.border = '1px solid rgba(29, 185, 84, 0.08)';
              if (bgType === 'gradient_emerald') containerStyle.border = '1px solid rgba(16,185,129,0.15)';
              if (bgType === 'gradient_purple') containerStyle.border = '1px solid rgba(16, 185, 129,0.15)';
            } else if (bgType === 'solid') {
              containerStyle.background = bgVal || 'var(--theme-card, #1e1e1e)';
            } else if (bgType === 'glass' || bgType === 'glassmorphism') {
              containerStyle.background = bgVal || 'rgba(255,255,255,0.03)';
              containerStyle.backdropFilter = 'blur(12px)';
              containerStyle.border = '1px solid rgba(255,255,255,0.06)';
            } else if (bgType === 'neon_glow') {
              containerStyle.background = 'rgba(29, 185, 84,0.03)';
              containerStyle.border = `1px solid var(--theme-primary, #1db954)25`;
              containerStyle.boxShadow = '0 0 30px rgba(29, 185, 84,0.08)';
            }

            // ── Border Styles ──
            const borderStyle = config.borderStyle;
            const borderColorVal = config.borderColor || 'var(--theme-primary, #1db954)';

            if (borderStyle === 'solid' || borderStyle === 'primary') {
              containerStyle.border = `1px solid ${borderColorVal}`;
            } else if (borderStyle === 'neon') {
              containerStyle.border = `1px solid ${borderColorVal}`;
              containerStyle.boxShadow = `0 0 15px ${borderColorVal}33`;
            }

            // ── Animation Variants ──
            const animationType = config.animation || 'none';
            const variants = {
              none: { opacity: 1, y: 0 },
              fade: { opacity: [0, 1], transition: { duration: 0.5 } },
              'slide-up': { opacity: [0, 1], y: [20, 0], transition: { duration: 0.5 } },
              scale: { opacity: [0, 1], scale: [0.95, 1], transition: { duration: 0.5 } },
              pulse: { scale: [1, 1.01, 1], transition: { duration: 3, repeat: Infinity } },
              glow: { boxShadow: [`0 0 0px ${borderColorVal}00`, `0 0 20px ${borderColorVal}44`, `0 0 0px ${borderColorVal}00`], transition: { duration: 3, repeat: Infinity } }
            };

            const isVideoBg = bgType === 'video';
            const isImageBg = bgType === 'image';
            let isYouTube = false;
            let youtubeId = '';
            if (isVideoBg && bgVal) {
              const match = bgVal.match(/(?:youtu\.be\/|youtube\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|(?:embed|v|vi|user)\/))([^?&"'>]+)/);
              if (match) {
                isYouTube = true;
                youtubeId = match[1];
              }
            }

            const backdrop = (
              <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0, borderRadius: 18 }}>
                {isImageBg && bgVal && (
                  <>
                    <img src={bgVal} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.85) 100%)' }} />
                  </>
                )}
                {isVideoBg && bgVal && (
                  <>
                    {isYouTube ? (
                      <iframe
                        src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${youtubeId}&showinfo=0&rel=0`}
                        style={{ width: '100%', height: '100%', border: 'none', transform: 'scale(1.35)' }}
                      />
                    ) : (
                      <video autoPlay loop muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }}>
                        <source src={bgVal} />
                      </video>
                    )}
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.85) 100%)' }} />
                  </>
                )}
              </div>
            );

            return (
              <motion.div
                key={sectionId}
                initial={animationType !== 'none' && animationType !== 'pulse' && animationType !== 'glow' ? { opacity: 0 } : false}
                animate={animationType !== 'none' ? (animationType as any) : undefined}
                variants={variants}
                style={containerStyle}
              >
                {backdrop}
                {!isVideoBg && bgType !== 'image' && hasBackground && (
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(255,255,255,0.01), rgba(255,255,255,0.02))', zIndex: 0 }} />
                )}
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <Section title={config.title || "🔴 Live Concerts & Events"} subtitle={config.subtitle || "Catch your favorite artists live!"}>
                    {renderLiveEventsSection(config, true)}
                  </Section>
                </div>
              </motion.div>
            );
          }

          let tracks: typeof mockTracks = [];
          let subtitleText = config.subtitle || '';
          let linkPath = '';
          let linkText = 'Show all';
          let autoPlId = 'playlist-2';

          if (config.layout === 'genre_tiles') {
            linkPath = '/search';
            linkText = 'View more';
          }

          if (config.autoPlaylist) {
            const recentTrackIds = recentTracks.map(t => t.id);
            if (recentTrackIds.length > 0) {
              let bestPlaylistId = '';
              let maxMatch = 0;
              mockPlaylists.forEach(pl => {
                if (pl.id === 'playlist-1') return; // Skip Liked Songs
                const matchCount = pl.tracks.filter(tid => recentTrackIds.includes(tid)).length;
                if (matchCount > maxMatch) {
                  maxMatch = matchCount;
                  bestPlaylistId = pl.id;
                }
              });
              if (bestPlaylistId) {
                autoPlId = bestPlaylistId;
              } else {
                const topGenre = user?.stats?.topGenres?.[0] || 'Pop';
                const genreLower = topGenre.toLowerCase();
                if (genreLower.includes('electronic') || genreLower.includes('synth')) {
                  autoPlId = 'playlist-3';
                } else if (genreLower.includes('pop') || genreLower.includes('dance')) {
                  autoPlId = 'playlist-2';
                } else if (genreLower.includes('chill') || genreLower.includes('ambient') || genreLower.includes('lofi')) {
                  autoPlId = 'playlist-6';
                } else if (genreLower.includes('focus') || genreLower.includes('study') || genreLower.includes('instrumental')) {
                  autoPlId = 'playlist-7';
                } else if (genreLower.includes('rock') || genreLower.includes('metal')) {
                  autoPlId = 'playlist-4';
                } else if (genreLower.includes('jazz') || genreLower.includes('bossa')) {
                  autoPlId = 'playlist-6';
                }
              }
            }
          }

          // Resolve tracks based on content source
          const source = config.contentSource || config.type;
          
          if (source === 'trending' || config.type === 'trending_songs' || config.type === 'top_charts') {
            tracks = trendingTracks;
            if (!subtitleText) subtitleText = 'Most streamed this week';
          } else if (source === 'new_releases' || config.type === 'new_releases') {
            tracks = newTracks;
            if (!subtitleText) subtitleText = 'Fresh drops this week';
          } else if (source === 'recommended' || source === 'made_for_you' || config.type === 'rec_songs' || config.type === 'ai_recommendations') {
            tracks = forYouTracks;
            if (!subtitleText) subtitleText = 'AI-curated based on your taste';
          } else if (source === 'recently_played' || config.type === 'recently_played' || config.type === 'continue_listening') {
            tracks = recentTracks;
            if (!subtitleText) subtitleText = 'Pick up where you left off';
          } else if (source === 'liked' || config.type === 'liked_songs') {
            tracks = likedTracks;
            if (!subtitleText) subtitleText = 'Songs you love';
          } else if (source === 'playlist' || config.type === 'playlist_showcase' || config.layout === 'playlist_showcase') {
            const targetPlId = config.autoPlaylist ? autoPlId : (config.targetPlaylistId || config.targetId || 'playlist-2');
            const playlist = customPlaylists.find(p => p.id === targetPlId) || mockPlaylists.find(p => p.id === targetPlId);
            if (playlist) {
              tracks = playlist.tracks.map((tid: string) => 
                allTracks.find(t => t.id === tid) || mockTracks.find(t => t.id === tid)
              ).filter((t: any): t is typeof mockTracks[0] => !!t);
              linkPath = `/playlist/${targetPlId}`;
              if (!subtitleText) subtitleText = `Playlist • ${playlist.title}`;
            }
          } else if (source === 'album') {
            const album = mockAlbums.find(a => a.id === config.targetId);
            if (album) {
              tracks = allTracks.filter(t => t.albumId === config.targetId || album.tracks.includes(t.id));
              if (tracks.length === 0) {
                tracks = album.tracks.map((tid: string) => 
                  allTracks.find(t => t.id === tid) || mockTracks.find(t => t.id === tid)
                ).filter((t: any): t is typeof mockTracks[0] => !!t);
              }
              linkPath = `/album/${config.targetId}`;
              if (!subtitleText) subtitleText = `Album • ${album.title}`;
            }
          } else if (source === 'artist_spotlight' || config.type === 'artist_spotlight' || config.type === 'featured_artist') {
            const targetArtistId = config.targetId || featuredArtist.id;
            tracks = allTracks.filter(t => t.artistId === targetArtistId);
            if (tracks.length === 0) {
              tracks = mockTracks.filter(t => t.artistId === targetArtistId);
            }
            if (tracks.length === 0) tracks = allTracks.slice(0, 5);
            const artist = mockArtists.find(a => a.id === targetArtistId) || featuredArtist;
            if (!subtitleText) subtitleText = `Spotlight on ${artist.name}`;
          } else if (source === 'genre' || config.type === 'genre_collection') {
            const targetGenre = (config.genre || 'pop').toLowerCase();
            tracks = allTracks.filter(t => (t.genre || '').toLowerCase() === targetGenre);
            if (tracks.length === 0) tracks = allTracks.slice(0, 5);
            if (!subtitleText) subtitleText = `Best of ${config.genre || 'genres'}`;
          } else if (source === 'mood' || config.type === 'mood_collection') {
            const targetMood = (config.mood || 'chill').toLowerCase();
            tracks = allTracks.filter(t => {
              const genreLower = (t.genre || '').toLowerCase();
              if (targetMood === 'happy') return ['pop', 'edm', 'dance'].includes(genreLower);
              if (targetMood === 'chill' || targetMood === 'relaxed') return ['ambient', 'lofi', 'chill', 'acoustic'].includes(genreLower);
              if (targetMood === 'energetic' || targetMood === 'workout') return ['techno', 'house', 'rock', 'metal'].includes(genreLower);
              if (targetMood === 'sad' || targetMood === 'romantic') return ['ballad', 'r&b', 'classical', 'soul'].includes(genreLower);
              return true;
            });
            if (tracks.length === 0) tracks = allTracks.slice(0, 5);
            if (!subtitleText) subtitleText = `${config.mood || 'Mood'} playlist`;
          } else if (config.songIds) {
            tracks = config.songIds
              .map((id: string) => allTracks.find((t: any) => t.id === id) || mockTracks.find((t: any) => t.id === id))
              .filter((t: any): t is typeof mockTracks[0] => !!t);
          } else {
            tracks = allTracks.slice(0, 5);
          }

          const NEW_INTERACTIVE_LAYOUTS = [
            'hero_auto_slider', 'category_quick_tiles', 'flash_deals_countdown',
            'new_launches_spotlight', 'featured_brands_row', 'top_chart_billboard',
            'artist_follow_cards', 'free_deals_grid', 'promo_red_block', 'fresh_picks_circles'
          ];
          const isNewInteractiveLayout = NEW_INTERACTIVE_LAYOUTS.includes(config.layout || '');
          const isHeroSection = !isNewInteractiveLayout && (config.type === 'hero_banner' || config.type === 'premium_promo' || config.type === 'subscription_cta' || (config.layout || '').startsWith('hero'));
          const isSpotlightSection = !isNewInteractiveLayout && (config.type === 'artist_spotlight' || config.type === 'featured_artist' || (config.layout || '').startsWith('magazine'));

          if (tracks.length === 0 && !isHeroSection && !isSpotlightSection && !isNewInteractiveLayout) return null;

          // ── Background styles ──
          const bgType = config.background?.type || config.bgStyle;
          const bgVal = config.background?.value || '';

          const hasBackground = bgType && bgType !== 'none' && bgType !== 'default';
          const defaultPadding = hasBackground ? '24px' : '0';
          const defaultMarginBottom = hasBackground ? 40 : 8;

          let containerStyle: React.CSSProperties = {
            marginBottom: defaultMarginBottom,
            borderRadius: 18,
            transition: 'all 0.3s ease',
            padding: config.padding === 'none' ? '0' : config.padding === 'sm' ? '12px' : config.padding === 'lg' ? '32px' : defaultPadding,
            position: 'relative',
            overflow: hasBackground ? 'hidden' : 'visible'
          };

          if (bgType === 'gradient' || bgType === 'gradient_emerald' || bgType === 'gradient_purple') {
            containerStyle.background = 'linear-gradient(180deg, rgba(29, 185, 84, 0.08) 0%, rgba(0,0,0,0) 100%)';
            containerStyle.border = '1px solid rgba(29, 185, 84, 0.08)';
            if (bgType === 'gradient_emerald') containerStyle.border = '1px solid rgba(16,185,129,0.15)';
            if (bgType === 'gradient_purple') containerStyle.border = '1px solid rgba(16, 185, 129,0.15)';
          } else if (bgType === 'solid') {
            containerStyle.background = bgVal || 'var(--theme-card, #1e1e1e)';
          } else if (bgType === 'glass' || bgType === 'glassmorphism') {
            containerStyle.background = bgVal || 'rgba(255,255,255,0.03)';
            containerStyle.backdropFilter = 'blur(12px)';
            containerStyle.border = '1px solid rgba(255,255,255,0.06)';
          } else if (bgType === 'neon_glow') {
            containerStyle.background = 'rgba(29, 185, 84,0.03)';
            containerStyle.border = `1px solid var(--theme-primary, ${GREEN})25`;
            containerStyle.boxShadow = '0 0 30px rgba(29, 185, 84,0.08)';
          }

          // ── Border Styles ──
          const borderStyle = config.borderStyle;
          const borderColorVal = config.borderColor || 'var(--theme-primary, #1db954)';

          if (borderStyle === 'solid' || borderStyle === 'primary') {
            containerStyle.border = `1px solid ${borderColorVal}`;
          } else if (borderStyle === 'neon') {
            containerStyle.border = `1px solid ${borderColorVal}`;
            containerStyle.boxShadow = `0 0 15px ${borderColorVal}33`;
          }

          // ── Animation Variants ──
          const animationType = config.animation || 'none';
          const variants = {
            none: { opacity: 1, y: 0 },
            fade: { opacity: [0, 1], transition: { duration: 0.5 } },
            'slide-up': { opacity: [0, 1], y: [20, 0], transition: { duration: 0.5 } },
            scale: { opacity: [0, 1], scale: [0.95, 1], transition: { duration: 0.5 } },
            pulse: { scale: [1, 1.01, 1], transition: { duration: 3, repeat: Infinity } },
            glow: { boxShadow: [`0 0 0px ${borderColorVal}00`, `0 0 20px ${borderColorVal}44`, `0 0 0px ${borderColorVal}00`], transition: { duration: 3, repeat: Infinity } }
          };

          // Special Video & Image Background backdrop resolution
          const isVideoBg = bgType === 'video';
          const isImageBg = bgType === 'image';
          let isYouTube = false;
          let youtubeId = '';
          if (isVideoBg && bgVal) {
            const match = bgVal.match(/(?:youtu\.be\/|youtube\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|(?:embed|v|vi|user)\/))([^?&"'>]+)/);
            if (match) {
              isYouTube = true;
              youtubeId = match[1];
            }
          }

          const backdrop = (
            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0, borderRadius: 18 }}>
              {isImageBg && bgVal && (
                <>
                  <img src={bgVal} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.85) 100%)' }} />
                </>
              )}
              {isVideoBg && bgVal && (
                <>
                  {isYouTube ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${youtubeId}&showinfo=0&rel=0`}
                      style={{ width: '100%', height: '100%', border: 'none', transform: 'scale(1.35)' }}
                    />
                  ) : (
                    <video autoPlay loop muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }}>
                      <source src={bgVal} />
                    </video>
                  )}
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.85) 100%)' }} />
                </>
              )}
            </div>
          );

          // ── Hero Section Render (if config is hero / spotlight) ──
          if (isHeroSection) {
            return (
              <motion.div
                key={sectionId}
                initial={animationType !== 'none' && animationType !== 'pulse' && animationType !== 'glow' ? { opacity: 0 } : false}
                animate={animationType !== 'none' ? (animationType as any) : undefined}
                variants={variants}
                style={{ ...containerStyle, height: 260, cursor: 'pointer' }}
              >
                {backdrop}
                {!isVideoBg && bgType !== 'image' && (
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, var(--theme-surface, #111111), var(--theme-card, #1e1e1e))', zIndex: 0 }} />
                )}

                <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', padding: '0 24px' }}>
                  <span style={{ color: 'var(--theme-primary, #1db954)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', display: 'block', marginBottom: 8 }}>
                    {config.subtitle || 'Beato Special'}
                  </span>
                  <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 32, fontWeight: 950, color: 'var(--theme-text, #fff)', marginBottom: 8, lineHeight: 1.2 }}>
                    {config.title}
                  </h1>
                  <p style={{ color: 'var(--theme-text-muted, #737373)', fontSize: 13, marginBottom: 20, maxWidth: '600px' }}>
                    Experience audio in high definition and discover personalized recommendations.
                  </p>
                  <div>
                    <button onClick={() => { if (tracks.length) playTrack(tracks[0], tracks.slice(1)); }}
                      style={{ padding: '10px 24px', borderRadius: 100, background: 'var(--theme-primary, #1db954)', border: 'none', color: '#000', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Play size={14} fill="black" /> Listen Now
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          }

          if (isSpotlightSection) {
            return (
              <motion.div
                key={sectionId}
                initial={animationType !== 'none' && animationType !== 'pulse' && animationType !== 'glow' ? { opacity: 0 } : false}
                animate={animationType !== 'none' ? (animationType as any) : undefined}
                variants={variants}
                style={{ ...containerStyle, height: 220 }}
              >
                {backdrop}
                {!isVideoBg && bgType !== 'image' && (
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(29, 185, 84,0.05), rgba(16, 185, 129,0.05))', zIndex: 0 }} />
                )}
                <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', height: '100%', padding: '0 24px' }}>
                  <div>
                    <span style={{ color: 'var(--theme-primary, #1db954)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 8 }}>
                      🎤 Spotlight
                    </span>
                    <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 36, fontWeight: 900, color: 'var(--theme-text, #fff)', marginBottom: 6 }}>{config.title}</h2>
                    {subtitleText && <p style={{ color: 'var(--theme-text-muted, #737373)', fontSize: 13, marginBottom: 18 }}>{subtitleText}</p>}
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button onClick={() => { if (tracks.length) playTrack(tracks[0], tracks.slice(1)); }}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 22px', borderRadius: 100, background: 'var(--theme-primary, #1db954)', border: 'none', color: '#000', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                        <Play size={14} fill="black" /> Play
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          }

          const renderLayout = () => {
            const rawLayout = config.layout || 'grid';
            const layout = rawLayout.split('_')[0];
            const cStyle = config.cardStyle || 'classic';
            const cSize = config.cardSize || 'md';

            if (rawLayout === 'playlist_showcase' || config.type === 'playlist_showcase') {
              const targetPlId = config.autoPlaylist ? autoPlId : (config.targetPlaylistId || config.targetId || 'playlist-2');
              const pl = customPlaylists.find(p => p.id === targetPlId) || mockPlaylists.find(p => p.id === targetPlId) || mockPlaylists[0];
              const plName = config.title || (config.autoPlaylist ? 'Analyzing your taste...' : pl?.title || 'Featured Playlist');
              const plCover = config.customImage || pl?.coverImage || 'https://misc.scdn.co/liked-songs/liked-songs-640.png';
              const plTracks = pl ? pl.tracks.map((tid: string) => 
                allTracks.find(t => t.id === tid) || mockTracks.find(t => t.id === tid)
              ).filter((t: any): t is typeof mockTracks[0] => !!t) : [];
              
              return (
                <div key={sectionId} style={{ marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <Link 
                      href={`/playlist/${targetPlId}`} 
                      onClick={(e) => {
                        if (plTracks.length > 0) {
                          playTrack(plTracks[0], plTracks.slice(1));
                          toast.success(`Playing ${plName}!`);
                        }
                      }}
                      style={{ textDecoration: 'none', display: 'block' }}
                    >
                      <motion.div 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        style={{ 
                          width: isMobile ? 56 : 68, 
                          height: isMobile ? 56 : 68, 
                          borderRadius: 10, 
                          overflow: 'hidden', 
                          flexShrink: 0, 
                          boxShadow: '0 8px 20px rgba(0,0,0,0.5)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          background: '#121212',
                          cursor: 'pointer'
                        }}
                      >
                        <img src={plCover} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </motion.div>
                    </Link>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                      <span style={{ 
                        fontSize: isMobile ? 9.5 : 11, 
                        color: 'var(--theme-text-muted, #737373)', 
                        fontWeight: 800, 
                        textTransform: 'uppercase', 
                        letterSpacing: '0.08em',
                        fontFamily: 'Inter, sans-serif'
                      }}>
                        MORE LIKE
                      </span>
                      <h2 style={{ 
                        fontSize: isMobile ? 21 : 28, 
                        color: 'var(--theme-text, #fff)', 
                        fontWeight: 950, 
                        fontFamily: 'Outfit, sans-serif', 
                        margin: '2px 0 0 0',
                        letterSpacing: '-0.02em',
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        whiteSpace: 'nowrap' 
                      }}>
                        {plName}
                      </h2>
                    </div>
                  </div>
                  
                  {plTracks.length === 0 ? (
                    <div style={{ padding: '20px 0', color: 'var(--theme-text-muted, #737373)', fontSize: 13 }}>No tracks in this playlist</div>
                  ) : (
                    renderSectionTracks(plTracks, config)
                  )}
                </div>
              );
            }

            if (rawLayout === 'story') {
              const list = tracks.slice(0, isMobile ? 5 : 7);
              return (
                <div style={{ display: 'flex', gap: isMobile ? 10 : 16, overflowX: 'auto', paddingBottom: 10, scrollbarWidth: 'none', msOverflowStyle: 'none' }} className="no-scrollbar">
                  {list.map((track) => {
                    const isCurrent = currentTrack?.id === track.id;
                    const coverImg = config.customImage || track.coverImage || `https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c6b?w=200&h=200&fit=crop`;
                    const size = isMobile ? 64 : 80;
                    return (
                      <motion.div
                        key={track.id}
                        whileHover={{ scale: 1.05 }}
                        onClick={() => playTrack(track, tracks)}
                        style={{ flexShrink: 0, width: isMobile ? 70 : 90, display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', marginRight: isMobile ? 0 : undefined }}
                      >
                        <div style={{
                          width: size,
                          height: size,
                          borderRadius: '50%',
                          padding: 3,
                          background: isCurrent ? 'var(--theme-primary, #1db954)' : 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: isCurrent ? '2px solid #000' : 'none'
                        }}>
                          <div style={{ width: '100%', height: '100%', borderRadius: '50%', border: '2px solid #000', overflow: 'hidden' }}>
                            <img src={coverImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        </div>
                        <span style={{
                          fontSize: isMobile ? 11 : 12,
                          color: isCurrent ? 'var(--theme-primary, #1db954)' : '#fff',
                          fontWeight: 700,
                          marginTop: 6,
                          width: '100%',
                          textAlign: 'center',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {track.title}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              );
            }

            if (rawLayout === 'story_tiktok') {
              const list = tracks.slice(0, isMobile ? 3 : 5);
              return (
                <div style={{ display: 'flex', gap: isMobile ? 10 : 16, overflowX: 'auto', paddingBottom: 10, scrollbarWidth: 'none', msOverflowStyle: 'none' }} className="no-scrollbar">
                  {list.map((track) => {
                    const isCurrent = currentTrack?.id === track.id;
                    const coverImg = config.customImage || track.coverImage || `https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c6b?w=200&h=300&fit=crop`;
                    const width = isMobile ? 140 : 180;
                    const height = isMobile ? 220 : 280;
                    return (
                      <motion.div
                        key={track.id}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => playTrack(track, tracks)}
                        style={{
                          flexShrink: 0,
                          width: width,
                          height: height,
                          borderRadius: 16,
                          backgroundImage: `url(${coverImg})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          position: 'relative',
                          overflow: 'hidden',
                          cursor: 'pointer',
                          border: isCurrent ? '2px solid var(--theme-primary, #1db954)' : '1px solid rgba(255,255,255,0.08)',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                          marginRight: isMobile ? 0 : undefined
                        }}
                      >
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)', zIndex: 1 }} />
                        
                        <div style={{ position: 'absolute', right: 10, bottom: isMobile ? 40 : 50, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, zIndex: 2 }}>
                          <div style={{ width: 26, height: 26, borderRadius: '50%', border: '1px solid #fff', overflow: 'hidden', background: '#333' }}>
                            <img src={coverImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                          <span style={{ fontSize: isMobile ? 14 : 16 }}>❤️</span>
                          <span style={{ fontSize: isMobile ? 14 : 16 }}>💬</span>
                          <span style={{ fontSize: isMobile ? 14 : 16 }}>📤</span>
                        </div>

                        <div style={{
                          position: 'absolute',
                          right: 10,
                          bottom: 10,
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          background: '#111',
                          border: '2px dashed #444',
                          zIndex: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          animation: isCurrent && isPlaying ? 'spin 3s linear infinite' : 'none'
                        }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--theme-primary, #1db954)' }} />
                        </div>

                        <div style={{ position: 'absolute', bottom: 10, left: 10, right: 35, zIndex: 2 }}>
                          <div style={{ fontSize: isMobile ? 12 : 14, fontWeight: 900, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>@{track.artistName}</div>
                          <div style={{ fontSize: isMobile ? 10 : 11, color: '#ddd', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>🎵 {track.title}</div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              );
            }

            if (rawLayout === 'carousel_coverflow') {
              const list = tracks.slice(0, 3);
              if (list.length < 3) return renderSectionTracks(tracks, config);
              return (
                <div style={{ display: 'flex', gap: 0, overflowX: 'auto', padding: '16px 0', alignItems: 'center', justifyContent: 'center', scrollbarWidth: 'none', msOverflowStyle: 'none' }} className="no-scrollbar">
                  {list.map((track, i) => {
                    const isCenter = i === 1;
                    const isCurrent = currentTrack?.id === track.id;
                    const coverImg = config.customImage || track.coverImage || `https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c6b?w=300&h=300&fit=crop`;
                    const centerSize = isMobile ? 110 : 160;
                    const sideSize = isMobile ? 85 : 120;
                    return (
                      <motion.div
                        key={track.id}
                        whileHover={{ scale: isCenter ? 1.15 : 0.9 }}
                        onClick={() => playTrack(track, tracks)}
                        style={{
                          flexShrink: 0,
                          width: isCenter ? centerSize : sideSize,
                          height: isCenter ? centerSize : sideSize,
                          margin: isMobile ? '0 -12px' : '0 -20px',
                          zIndex: isCenter ? 3 : 1,
                          transition: 'all 0.3s ease',
                          transform: isCenter ? 'scale(1.1)' : `scale(0.85) perspective(100px) rotateY(${i === 0 ? '8deg' : '-8deg'})`,
                          borderRadius: 12,
                          overflow: 'hidden',
                          cursor: 'pointer',
                          boxShadow: isCenter ? '0 12px 28px rgba(0,0,0,0.6)' : '0 6px 14px rgba(0,0,0,0.4)',
                          border: isCenter ? '2px solid var(--theme-primary, #1db954)' : '1px solid rgba(255,255,255,0.06)'
                        }}
                      >
                        <img src={coverImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </motion.div>
                    );
                  })}
                </div>
              );
            }

            if (rawLayout === 'grid_apple') {
              const list = tracks.slice(0, isMobile ? 4 : 8);
              return (
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: isMobile ? 12 : 20, marginBottom: 16 }}>
                  {list.map((track) => {
                    const isCurrent = currentTrack?.id === track.id;
                    const coverImg = config.customImage || track.coverImage || `https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c6b?w=200&h=200&fit=crop`;
                    return (
                      <motion.div
                        key={track.id}
                        whileHover={{ y: -4 }}
                        onClick={() => playTrack(track, tracks)}
                        style={{
                          background: 'rgba(255,255,255,0.02)',
                          borderRadius: 12,
                          padding: 10,
                          border: isCurrent ? '1.5px solid var(--theme-primary, #1db954)' : '1px solid rgba(255,255,255,0.04)',
                          boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ width: '100%', paddingTop: '100%', position: 'relative', borderRadius: 8, overflow: 'hidden' }}>
                          <img src={coverImg} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div style={{ fontSize: isMobile ? 12 : 14, fontWeight: 700, color: isCurrent ? 'var(--theme-primary, #1db954)' : '#fff', marginTop: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.title}</div>
                        <div style={{ fontSize: isMobile ? 10 : 11, color: 'var(--theme-text-muted, #737373)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.artistName}</div>
                      </motion.div>
                    );
                  })}
                </div>
              );
            }

            if (rawLayout === 'grid_retro' || rawLayout === 'magazine_retro') {
              const list = tracks.slice(0, isMobile ? 4 : 8);
              return (
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: isMobile ? 12 : 20, marginBottom: 16 }}>
                  {list.map((track, i) => {
                    const isCurrent = currentTrack?.id === track.id;
                    const coverImg = config.customImage || track.coverImage || `https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c6b?w=200&h=200&fit=crop`;
                    const colors = ['#ff007f', '#00f0ff'];
                    const outlineColor = colors[i % colors.length];
                    return (
                      <motion.div
                        key={track.id}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => playTrack(track, tracks)}
                        style={{
                          background: '#0b0410',
                          border: `2px solid ${isCurrent ? 'var(--theme-primary, #1db954)' : outlineColor}`,
                          padding: 8,
                          borderRadius: 4,
                          boxShadow: `4px 4px 0px ${outlineColor === '#ff007f' ? '#00f0ff' : '#ff007f'}`,
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ width: '100%', paddingTop: '100%', position: 'relative', border: '1px solid rgba(255,255,255,0.1)' }}>
                          <img src={coverImg} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div style={{ fontSize: isMobile ? 11.5 : 13, fontWeight: 900, color: '#00f0ff', fontFamily: 'monospace', marginTop: 8, textShadow: '1px 1px 0px #ff007f', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.title.toUpperCase()}</div>
                        <div style={{ fontSize: isMobile ? 9 : 10, color: '#fff', opacity: 0.8, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.artistName}</div>
                      </motion.div>
                    );
                  })}
                </div>
              );
            }

            if (rawLayout === 'list_billboard') {
              const list = tracks.slice(0, isMobile ? 3 : 5);
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                  {list.map((track, i) => {
                    const isCurrent = currentTrack?.id === track.id;
                    const coverImg = config.customImage || track.coverImage || `https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c6b?w=200&h=200&fit=crop`;
                    const rankColors = ['#ffd700', '#c0c0c0', '#cd7f32'];
                    const rankColor = rankColors[i] || '#a3a3a3';
                    return (
                      <motion.div
                        key={track.id}
                        whileHover={{ x: 6, background: 'rgba(255,255,255,0.04)' }}
                        onClick={() => playTrack(track, tracks)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 16,
                          padding: '8px 16px',
                          background: isCurrent ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
                          border: isCurrent ? '1px solid var(--theme-primary, #1db954)30' : '1px solid rgba(255,255,255,0.03)',
                          borderRadius: 10,
                          cursor: 'pointer'
                        }}
                      >
                        <span style={{ fontSize: isMobile ? 16 : 20, fontWeight: 950, color: rankColor, width: 24, textAlign: 'center', fontFamily: 'Outfit, sans-serif' }}>{i + 1}</span>
                        <span style={{ fontSize: 10, color: 'var(--theme-primary, #1db954)' }}>▲</span>
                        <img src={coverImg} alt="" style={{ width: isMobile ? 32 : 44, height: isMobile ? 32 : 44, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: isMobile ? 13 : 15, fontWeight: 800, color: isCurrent ? 'var(--theme-primary, #1db954)' : '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.title}</div>
                          <div style={{ fontSize: isMobile ? 11 : 12, color: 'var(--theme-text-muted, #737373)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>{track.artistName}</div>
                        </div>
                        <span style={{ fontSize: isMobile ? 11 : 12, color: 'var(--theme-text-muted, #737373)', fontWeight: 700 }}>{(4.2 - i * 0.9).toFixed(1)}M plays</span>
                      </motion.div>
                    );
                  })}
                </div>
              );
            }

            if (rawLayout === 'hero_countdown') {
              const track = tracks[0] || mockTracks[0];
              const isCurrent = currentTrack?.id === track.id;
              const coverImg = config.customImage || track.coverImage;
              return (
                <div style={{
                  background: 'linear-gradient(135deg, #1f1235 0%, #0c0617 100%)',
                  borderRadius: 16,
                  border: isCurrent ? '1.5px solid var(--theme-primary, #1db954)' : '1px solid rgba(16, 185, 129, 0.3)',
                  padding: isMobile ? 16 : 24,
                  display: 'flex',
                  alignItems: 'center',
                  gap: isMobile ? 12 : 24,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                  marginBottom: 20,
                  cursor: 'pointer'
                }}
                onClick={() => playTrack(track, tracks)}
                >
                  <img src={coverImg} alt="" style={{ width: isMobile ? 56 : 90, height: isMobile ? 56 : 90, borderRadius: 10, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: isMobile ? 9 : 11, fontWeight: 900, color: '#10b981', letterSpacing: '0.08em' }}>NEW RELEASE COUNTDOWN</div>
                    <div style={{ fontSize: isMobile ? 14 : 20, fontWeight: 900, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 4 }}>{track.title}</div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                      {['02d', '14h', '35m', '18s'].map((t, idx) => (
                        <div key={idx} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 6, padding: isMobile ? '4px 8px' : '6px 12px', fontSize: isMobile ? 10 : 12, fontFamily: 'monospace', color: '#10b981', fontWeight: 800 }}>{t}</div>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); playTrack(track, tracks); }}
                    style={{
                      background: '#10b981',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 100,
                      padding: isMobile ? '8px 16px' : '10px 24px',
                      fontSize: isMobile ? 12 : 13,
                      fontWeight: 800,
                      whiteSpace: 'nowrap',
                      cursor: 'pointer'
                    }}
                  >
                    {isCurrent && isPlaying ? 'Playing' : 'Pre-save'}
                  </button>
                </div>
              );
            }

            if (rawLayout === 'magazine') {
              const list = tracks.slice(0, 3);
              if (list.length < 3) return renderSectionTracks(tracks, config);
              const t1 = list[0];
              const t2 = list[1];
              const t3 = list[2];
              return (
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1.2fr 1fr' : '1.5fr 1fr', gap: isMobile ? 12 : 20, marginBottom: 16 }}>
                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    onClick={() => playTrack(t1, tracks)}
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 12, padding: 12, display: 'flex', flexDirection: 'column', cursor: 'pointer' }}
                  >
                    <img src={config.customImage || t1.coverImage} alt="" style={{ width: '100%', height: isMobile ? 90 : 150, objectFit: 'cover', borderRadius: 8 }} />
                    <span style={{ fontSize: isMobile ? 14 : 18, fontWeight: 900, fontFamily: 'serif', color: '#fff', marginTop: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{t1.title}</span>
                    <span style={{ fontSize: isMobile ? 11 : 12, color: 'var(--theme-text-muted, #737373)', marginTop: 6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.4 }}>Specially featured editorial layout showing track highlight. Discover more about the artist and album details now.</span>
                  </motion.div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[t2, t3].map((track, idx) => (
                      <motion.div
                        key={track.id}
                        whileHover={{ x: 4, background: 'rgba(255,255,255,0.02)' }}
                        onClick={() => playTrack(track, tracks)}
                        style={{ display: 'flex', gap: 12, alignItems: 'center', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: 10, padding: 10, cursor: 'pointer' }}
                      >
                        <img src={track.coverImage} alt="" style={{ width: isMobile ? 36 : 50, height: isMobile ? 36 : 50, borderRadius: 6, objectFit: 'cover' }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: isMobile ? 12 : 14, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.title}</div>
                          <div style={{ fontSize: isMobile ? 10 : 12, color: 'var(--theme-text-muted, #737373)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>{track.artistName}</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              );
            }

            if (rawLayout === 'magazine_interview') {
              const artist = mockArtists[0] || { name: 'Sadhana', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150' };
              return (
                <div style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.04)',
                  borderRadius: 16,
                  padding: isMobile ? 14 : 20,
                  display: 'flex',
                  alignItems: 'center',
                  gap: isMobile ? 12 : 20,
                  marginBottom: 16
                }}>
                  <img src={artist.image} alt="" style={{ width: isMobile ? 50 : 70, height: isMobile ? 50 : 70, borderRadius: '50%', objectFit: 'cover', border: '2px solid #fff', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0, position: 'relative', background: 'var(--theme-card, #181818)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px 12px 12px 0px', padding: '12px 16px' }}>
                    <div style={{ position: 'absolute', left: -6, bottom: 0, width: 0, height: 0, borderTop: '6px solid transparent', borderRight: '6px solid var(--theme-card, #181818)', borderBottom: '0px solid transparent' }} />
                    <div style={{ fontSize: isMobile ? 13 : 15, fontStyle: 'italic', color: '#e5e7eb', lineHeight: 1.4 }}>"I make songs for the quiet dreamers of the night..."</div>
                    <div style={{ fontSize: isMobile ? 11 : 12, fontWeight: 800, color: 'var(--theme-primary, #1db954)', marginTop: 6, textAlign: 'right' }}>— {artist.name}</div>
                  </div>
                </div>
              );
            }

            if (rawLayout === 'bento_asymmetric') {
              const list = tracks.slice(0, 3);
              if (list.length < 3) return renderSectionTracks(tracks, config);
              const t1 = list[0];
              const t2 = list[1];
              const t3 = list[2];
              return (
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1.1fr 1fr' : '2fr 1.2fr 1fr', gap: isMobile ? 10 : 16, marginBottom: 16 }}>
                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    onClick={() => playTrack(t1, tracks)}
                    style={{
                      gridRow: isMobile ? 'span 2' : 'span 1',
                      background: 'rgba(255,255,255,0.03)',
                      backdropFilter: 'blur(10px)',
                      border: '1.5px solid rgba(255,255,255,0.05)',
                      borderRadius: 14,
                      padding: 12,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ fontSize: isMobile ? 10 : 11, color: '#fff', opacity: 0.6, fontWeight: 800 }}>FEATURED</div>
                    <img src={config.customImage || t1.coverImage} alt="" style={{ width: '100%', height: isMobile ? 70 : 100, objectFit: 'cover', borderRadius: 8, margin: '10px 0' }} />
                    <div style={{ fontSize: isMobile ? 13 : 15, fontWeight: 900, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t1.title}</div>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    onClick={() => playTrack(t2, tracks)}
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      backdropFilter: 'blur(10px)',
                      border: '1.5px solid rgba(255,255,255,0.05)',
                      borderRadius: 14,
                      padding: 12,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      cursor: 'pointer'
                    }}
                  >
                    <img src={t2.coverImage} alt="" style={{ width: isMobile ? 32 : 44, height: isMobile ? 32 : 44, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: isMobile ? 12 : 14, fontWeight: 850, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t2.title}</div>
                    </div>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    onClick={() => playTrack(t3, tracks)}
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      backdropFilter: 'blur(10px)',
                      border: '1.5px solid rgba(255,255,255,0.05)',
                      borderRadius: 14,
                      padding: 12,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <span style={{ fontSize: isMobile ? 20 : 24 }}>🔥</span>
                    <span style={{ fontSize: isMobile ? 11 : 12, fontWeight: 800, color: '#fff', marginTop: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%', textAlign: 'center' }}>{t3.title}</span>
                  </motion.div>
                </div>
              );
            }

            if (rawLayout === 'genre_tiles') {
              const effectiveGenres = config.genresList || 'Pop Hits, EDM, Hip-Hop, Lo-Fi, Rock, Acoustic, R&B, Jazz';
              if (effectiveGenres && effectiveGenres.trim().length > 0) {
                const genres = effectiveGenres.split(',');
                const genresToDisplay = isMobile ? genres.slice(0, 2) : genres;
                const colors = [
                  'linear-gradient(135deg, #e91429, #b91c1c)',
                  'linear-gradient(135deg, #006450, #047857)',
                  'linear-gradient(135deg, #8a2be2, #4c1d95)',
                  'linear-gradient(135deg, #2d55e2, #1e3a8a)',
                  'linear-gradient(135deg, #b91c1c, #db2777)',
                ];
                const defaultImages = [
                  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop&q=80',
                  'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=200&auto=format&fit=crop&q=80',
                  'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=200&auto=format&fit=crop&q=80',
                  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200&auto=format&fit=crop&q=80',
                  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&auto=format&fit=crop&q=80',
                ];

                return (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
                    gap: isMobile ? 12 : 16,
                    marginBottom: 16
                  }}>
                    {genresToDisplay.map((genre: string, i: number) => {
                      const cleanGenre = genre.trim();
                      const cardColor = colors[i % colors.length];
                      const cardImage = defaultImages[i % defaultImages.length];

                      return (
                        <motion.div
                          key={i}
                          whileHover={{ scale: 1.03 }}
                          onClick={() => {
                            const cleanName = cleanGenre.toLowerCase();
                            const matches = allTracks.filter(t => 
                              (t.genre || '').toLowerCase().includes(cleanName) || 
                              t.title.toLowerCase().includes(cleanName) ||
                              t.artistName.toLowerCase().includes(cleanName)
                            );
                            const queue = matches.length > 0 ? matches : allTracks;
                            playTrack(queue[0], queue);
                            toast.success(`Playing ${cleanGenre} mix!`);
                          }}
                          style={{
                            position: 'relative',
                            borderRadius: 12,
                            background: cardColor,
                            height: isMobile ? 100 : 130,
                            overflow: 'hidden',
                            cursor: 'pointer',
                            padding: '16px',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                            border: '1px solid rgba(255,255,255,0.08)'
                          }}
                        >
                          <span style={{
                            fontSize: isMobile ? 15 : 18,
                            fontWeight: 850,
                            color: '#fff',
                            fontFamily: 'Outfit, sans-serif',
                            letterSpacing: '-0.02em',
                            lineHeight: 1.2,
                            display: 'block'
                          }}>
                            {cleanGenre}
                          </span>
                          <img
                            src={cardImage}
                            alt=""
                            style={{
                              position: 'absolute',
                              bottom: '-10px',
                              right: '-12px',
                              width: isMobile ? 60 : 75,
                              height: isMobile ? 60 : 75,
                              transform: 'rotate(25deg)',
                              borderRadius: 6,
                              objectFit: 'cover',
                              boxShadow: '0 4px 10px rgba(0,0,0,0.4)'
                            }}
                          />
                        </motion.div>
                      );
                    })}
                  </div>
                );
              } else {
                const colors = [
                  'linear-gradient(135deg, #e91429, #b91c1c)',
                  'linear-gradient(135deg, #006450, #047857)',
                  'linear-gradient(135deg, #8a2be2, #4c1d95)',
                  'linear-gradient(135deg, #2d55e2, #1e3a8a)',
                  'linear-gradient(135deg, #b91c1c, #db2777)',
                ];
                return (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
                    gap: isMobile ? 12 : 16,
                    marginBottom: 16
                  }}>
                    {tracks.map((track, i) => {
                      const cardColor = colors[i % colors.length];
                      const coverImg = config.customImage || track.coverImage || `https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c6b?w=200&h=200&fit=crop`;
                      return (
                        <motion.div
                          key={track.id}
                          whileHover={{ scale: 1.03 }}
                          onClick={() => playTrack(track, tracks)}
                          style={{
                            position: 'relative',
                            borderRadius: 12,
                            background: cardColor,
                            height: isMobile ? 100 : 130,
                            overflow: 'hidden',
                            cursor: 'pointer',
                            padding: '16px',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                            border: '1px solid rgba(255,255,255,0.08)'
                          }}
                        >
                          <span style={{
                            fontSize: isMobile ? 13 : 16,
                            fontWeight: 850,
                            color: '#fff',
                            fontFamily: 'Outfit, sans-serif',
                            letterSpacing: '-0.02em',
                            lineHeight: 1.2,
                            display: 'block',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            width: '70%'
                          }}>
                            {track.title}
                          </span>
                          <span style={{
                            fontSize: isMobile ? 9.5 : 11,
                            color: 'rgba(255,255,255,0.75)',
                            display: 'block',
                            marginTop: 4,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            width: '70%'
                          }}>
                            {track.artistName}
                          </span>
                          <img
                            src={coverImg}
                            alt=""
                            style={{
                              position: 'absolute',
                              bottom: '-10px',
                              right: '-12px',
                              width: isMobile ? 60 : 75,
                              height: isMobile ? 60 : 75,
                              transform: 'rotate(25deg)',
                              borderRadius: 6,
                              objectFit: 'cover',
                              boxShadow: '0 4px 10px rgba(0,0,0,0.4)'
                            }}
                          />
                        </motion.div>
                      );
                    })}
                  </div>
                );
              }
            }

            if (rawLayout === 'ad_break_banner') {
              return <AdCard config={config} isMobile={isMobile} />;
            }

            if (rawLayout === 'grid_deals') {
              const mainTrack = tracks[0] || mockTracks[0];
              const gridTracks = tracks.slice(1, 5);
              while (gridTracks.length < 4) {
                gridTracks.push(mockTracks[gridTracks.length % mockTracks.length]);
              }

              const badges = ['Free Stream', 'HQ Audio', 'Offline Play', 'Exclusive'];
              const cardTitles = [
                'Chill Melodies',
                'Energy Boost',
                'Focus Lofi',
                'Trending Hits'
              ];

              const gradients = [
                'linear-gradient(135deg, rgba(29, 185, 84, 0.06) 0%, rgba(15, 23, 18, 0.85) 100%)',
                'linear-gradient(135deg, rgba(29, 185, 84, 0.06) 0%, rgba(15, 23, 18, 0.85) 100%)',
                'linear-gradient(135deg, rgba(29, 185, 84, 0.06) 0%, rgba(15, 23, 18, 0.85) 100%)',
                'linear-gradient(135deg, rgba(29, 185, 84, 0.06) 0%, rgba(15, 23, 18, 0.85) 100%)'
              ];
              const borders = [
                '1px solid rgba(29, 185, 84, 0.18)',
                '1px solid rgba(29, 185, 84, 0.18)',
                '1px solid rgba(29, 185, 84, 0.18)',
                '1px solid rgba(29, 185, 84, 0.18)'
              ];
              const badgeBackgrounds = [
                'rgba(29, 185, 84, 0.12)',
                'rgba(29, 185, 84, 0.12)',
                'rgba(29, 185, 84, 0.12)',
                'rgba(29, 185, 84, 0.12)'
              ];
              const badgeColors = [
                '#1db954',
                '#1db954',
                '#1db954',
                '#1db954'
              ];
              const badgeBorders = [
                '1px solid rgba(29, 185, 84, 0.25)',
                '1px solid rgba(29, 185, 84, 0.25)',
                '1px solid rgba(29, 185, 84, 0.25)',
                '1px solid rgba(29, 185, 84, 0.25)'
              ];

              return (
                <div key={sectionId} style={{ marginBottom: 32 }}>
                  {/* 1. Header Banner */}
                  <div style={{
                    borderRadius: 16,
                    background: 'linear-gradient(135deg, #0b1c10 0%, #050a06 100%)',
                    padding: isMobile ? '12px' : '20px',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                    border: '1px solid rgba(29, 185, 84, 0.25)',
                    boxShadow: '0 8px 32px 0 rgba(29, 185, 84, 0.15)'
                  }}>
                    <div style={{ position: 'absolute', top: -20, left: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(29, 185, 84, 0.18)', filter: 'blur(35px)' }} />
                    <div style={{ position: 'absolute', bottom: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(29, 185, 84, 0.22)', filter: 'blur(35px)' }} />
                    
                    <div style={{ textAlign: 'center', zIndex: 1 }}>
                      <span style={{ color: GREEN, fontSize: isMobile ? 8.5 : 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                        {config.subtitle || "BEATO SPECIALS"}
                      </span>
                      <h2 style={{
                        fontFamily: 'Outfit, sans-serif',
                        fontSize: isMobile ? 18 : 26,
                        fontWeight: 950,
                        margin: '4px 0 0 0',
                        background: 'linear-gradient(45deg, #1db954 20%, #34d399 50%, #81f5a2 80%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        letterSpacing: '0.03em'
                      }}>
                        {config.title || "SELF CARE DAYS"}
                      </h2>
                    </div>
                  </div>

                  {/* 2. Main Grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1.2fr 1fr 1fr' : '1.5fr 1fr 1fr',
                    gap: isMobile ? 8 : 14,
                    alignItems: 'stretch'
                  }}>
                    {/* Left Card: Steal Deals */}
                    <div style={{
                      gridRow: 'span 2',
                      background: 'linear-gradient(135deg, rgba(29, 185, 84, 0.08) 0%, rgba(15, 23, 18, 0.85) 100%)',
                      border: '1.5px solid rgba(29, 185, 84, 0.2)',
                      borderRadius: 14,
                      padding: isMobile ? 10 : 16,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      position: 'relative',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
                      backdropFilter: 'blur(8px)'
                    }}
                    onClick={() => playTrack(mainTrack, tracks)}
                    >
                      <div style={{
                        background: 'linear-gradient(90deg, #1db954, #128c3e)',
                        padding: '4px 8px',
                        borderRadius: 6,
                        fontSize: isMobile ? 9 : 11,
                        fontWeight: 900,
                        color: '#fff',
                        alignSelf: 'flex-start',
                        letterSpacing: '0.05em',
                        marginBottom: 10,
                        boxShadow: '0 0 12px rgba(29, 185, 84, 0.4)'
                      }}>
                        STEAL DEALS
                      </div>
                      
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', margin: '10px 0' }}>
                        <div style={{ position: 'relative', width: isMobile ? 64 : 100, height: isMobile ? 64 : 100, borderRadius: 12, overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.6)' }}>
                          <img src={mainTrack.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div style={{ color: '#fff', fontSize: isMobile ? 12 : 15, fontWeight: 900, fontFamily: 'Outfit, sans-serif', marginTop: 10, textAlign: 'center', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {mainTrack.title}
                        </div>
                        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: isMobile ? 10 : 12, marginTop: 2, textAlign: 'center', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {mainTrack.artistName || 'Various Artists'}
                        </div>
                      </div>

                      <button style={{
                        background: '#1db954',
                        border: 'none',
                        color: '#000',
                        padding: isMobile ? '6px 10px' : '8px 16px',
                        borderRadius: 20,
                        fontSize: isMobile ? 9.5 : 11,
                        fontWeight: 900,
                        textAlign: 'center',
                        width: '100%',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(29, 185, 84, 0.3)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        Listen Free
                      </button>
                    </div>

                    {/* Right 2x2 Grid */}
                    {gridTracks.map((track, i) => {
                      const prevTrack = mockTracks[(i + 2) % mockTracks.length];
                      return (
                        <div key={track.id} style={{
                          background: gradients[i],
                          border: borders[i],
                          borderRadius: 14,
                          padding: isMobile ? 8 : 12,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          height: isMobile ? 120 : 160,
                          cursor: 'pointer',
                          position: 'relative',
                          boxShadow: '0 6px 20px rgba(0, 0, 0, 0.2)'
                        }}
                        onClick={() => playTrack(track, tracks)}
                        >
                          <div style={{ fontSize: isMobile ? 11 : 14, fontWeight: 800, fontFamily: 'Outfit, sans-serif', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {cardTitles[i]}
                          </div>

                          {/* Overlapping cover images in center */}
                          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin: isMobile ? '4px 0' : '8px 0', height: isMobile ? 34 : 44 }}>
                            <img src={track.coverImage} alt="" style={{ width: isMobile ? 30 : 40, height: isMobile ? 30 : 40, borderRadius: 6, objectFit: 'cover', transform: 'rotate(-6deg) translateX(4px)', border: '1.5px solid #121214', boxShadow: '0 4px 10px rgba(0,0,0,0.5)', zIndex: 1 }} />
                            <img src={prevTrack.coverImage} alt="" style={{ width: isMobile ? 30 : 40, height: isMobile ? 30 : 40, borderRadius: 6, objectFit: 'cover', transform: 'rotate(6deg) translateX(-4px)', border: '1.5px solid #121214', boxShadow: '0 4px 10px rgba(0,0,0,0.5)', zIndex: 2 }} />
                          </div>

                          <div style={{
                            background: badgeBackgrounds[i],
                            color: badgeColors[i],
                            border: badgeBorders[i],
                            padding: '3px 6px',
                            borderRadius: 20,
                            fontSize: isMobile ? 7.5 : 9.5,
                            fontWeight: 800,
                            textAlign: 'center',
                            alignSelf: 'stretch',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {badges[i]}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* 3. Bottom Banner Strip */}
                  <div style={{
                    background: 'linear-gradient(90deg, #0d381e 0%, #1db954 100%)',
                    borderRadius: 14,
                    padding: isMobile ? '8px 14px' : '12px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: 14,
                    border: '1px dashed rgba(29, 185, 84, 0.4)',
                    boxShadow: '0 8px 24px rgba(29, 185, 84, 0.2)'
                  }}>
                    <span style={{ color: '#fff', fontSize: isMobile ? 10 : 13, fontWeight: 800, letterSpacing: '0.01em', fontFamily: 'Outfit, sans-serif' }}>
                      🔥 Buy 2 Months of Premium & get 1 Month Free! T&C Apply *
                    </span>
                    <button style={{
                      background: '#fff',
                      color: '#000',
                      border: 'none',
                      borderRadius: 20,
                      padding: isMobile ? '6px 12px' : '8px 16px',
                      fontSize: isMobile ? 9.5 : 11.5,
                      fontWeight: 900,
                      cursor: 'pointer',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.25)'
                    }}>
                      Claim Offer
                    </button>
                  </div>
                </div>
              );
            }

            if (rawLayout === 'music_summer_store') {
              const gridTracks = tracks.slice(0, 6);
              while (gridTracks.length < 6) {
                gridTracks.push(mockTracks[gridTracks.length % mockTracks.length]);
              }
              const storeTitles = [
                'Poolside Beats',
                'Night Drive',
                'Chill Ambient',
                'Workout Power',
                'Festival Anthems',
                'Acoustic Sunsets'
              ];
              const storeSubtitles = [
                'Ice-Cold Beats',
                'Midnight Cruise',
                'Soothing Sounds',
                'High Energy',
                'Main Stage',
                'Warm Acoustics'
              ];
              const accentColors = [
                '#1db954', '#10b981', '#10b981', '#ef4444', '#f59e0b', '#34d399'
              ];
              const gradFroms = [
                'rgba(29, 185, 84,0.12)', 'rgba(16, 185, 129,0.12)', 'rgba(16, 185, 129,0.12)',
                'rgba(239,68,68,0.12)', 'rgba(245,158,11,0.12)', 'rgba(52, 211, 153,0.12)'
              ];
              const cardEmojis = ['🏖️', '🌙', '📚', '💪', '🎪', '🎸'];

              return (
                <div key={sectionId} style={{ marginBottom: 32 }}>
                  {/* 1. Header Banner — premium glass style */}
                  <div style={{
                    borderRadius: 20,
                    background: 'linear-gradient(135deg, #051a0c 0%, #0a1410 50%, #060e07 100%)',
                    padding: isMobile ? '16px 14px' : '22px 28px',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 14,
                    border: '1px solid rgba(29, 185, 84, 0.3)',
                    boxShadow: '0 8px 40px rgba(29, 185, 84, 0.18), inset 0 1px 0 rgba(255,255,255,0.04)'
                  }}>
                    <div style={{ position: 'absolute', top: -40, left: -40, width: 140, height: 140, borderRadius: '50%', background: 'rgba(29, 185, 84, 0.15)', filter: 'blur(50px)', pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', bottom: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(29, 185, 84, 0.2)', filter: 'blur(45px)', pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', top: '30%', right: '25%', width: 60, height: 60, borderRadius: '50%', background: 'rgba(30,215,96,0.08)', filter: 'blur(20px)', pointerEvents: 'none' }} />
                    
                    <div style={{ zIndex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: GREEN, boxShadow: `0 0 8px ${GREEN}` }} />
                        <span style={{ color: GREEN, fontSize: isMobile ? 9 : 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                          {config.subtitle || 'BEATO STORE'}
                        </span>
                      </div>
                      <h2 style={{
                        fontFamily: 'Outfit, sans-serif',
                        fontSize: isMobile ? 20 : 28,
                        fontWeight: 950,
                        margin: 0,
                        background: 'linear-gradient(90deg, #fff 0%, #b3f0c8 50%, #1db954 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        letterSpacing: '-0.01em'
                      }}>
                        {config.title || 'SUMMER VIBE STORE'}
                      </h2>
                    </div>
                    <div style={{
                      zIndex: 1,
                      background: GREEN,
                      color: '#000',
                      border: 'none',
                      borderRadius: 20,
                      padding: isMobile ? '6px 14px' : '8px 18px',
                      fontSize: isMobile ? 10 : 12,
                      fontWeight: 900,
                      letterSpacing: '0.02em',
                      cursor: 'pointer',
                      boxShadow: '0 4px 16px rgba(29, 185, 84,0.4)',
                      whiteSpace: 'nowrap',
                      flexShrink: 0
                    }}>
                      Shop All
                    </div>
                  </div>

                  {/* 2. Grid — premium glass cards */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
                    gap: isMobile ? 10 : 14
                  }}>
                    {gridTracks.map((track, i) => {
                      const accent = accentColors[i % accentColors.length];
                      const gradFrom = gradFroms[i % gradFroms.length];
                      const coverImg = track.coverImage || '';
                      const emoji = cardEmojis[i % cardEmojis.length];
                      return (
                        <motion.div
                          key={`${track.id}-${i}`}
                          whileHover={{ scale: 1.03, y: -6 }}
                          onClick={() => playTrack(track, tracks)}
                          style={{
                            background: `linear-gradient(145deg, ${gradFrom} 0%, rgba(8,8,8,0.92) 100%)`,
                            border: `1px solid ${accent}35`,
                            borderRadius: 18,
                            padding: isMobile ? 12 : 16,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            height: isMobile ? 140 : 168,
                            cursor: 'pointer',
                            position: 'relative',
                            overflow: 'hidden',
                            backdropFilter: 'blur(8px)',
                            boxShadow: `0 8px 28px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)`,
                            transition: 'box-shadow 0.3s ease'
                          }}
                          onMouseEnter={e => (e.currentTarget.style.boxShadow = `0 12px 36px rgba(0,0,0,0.5), 0 0 0 1px ${accent}50, inset 0 1px 0 rgba(255,255,255,0.06)`)}
                          onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)')}
                        >
                          {/* Accent glow orb */}
                          <div style={{ position: 'absolute', top: -20, right: -20, width: 70, height: 70, borderRadius: '50%', background: `${accent}20`, filter: 'blur(25px)', pointerEvents: 'none' }} />
                          
                          <div style={{ zIndex: 1 }}>
                            <div style={{ fontSize: isMobile ? 18 : 22, marginBottom: 6 }}>{emoji}</div>
                            <div style={{ fontSize: isMobile ? 13 : 15.5, fontWeight: 900, fontFamily: 'Outfit, sans-serif', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {storeTitles[i]}
                            </div>
                            <div style={{ fontSize: isMobile ? 10 : 11.5, color: 'rgba(255,255,255,0.45)', marginTop: 3 }}>
                              {storeSubtitles[i]}
                            </div>
                          </div>

                          {/* Tilted Cover Art */}
                          <div style={{
                            position: 'absolute',
                            bottom: '-14px',
                            right: '-14px',
                            width: isMobile ? 60 : 76,
                            height: isMobile ? 60 : 76,
                            transform: 'rotate(-15deg)',
                            borderRadius: 12,
                            overflow: 'hidden',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                            border: `2px solid ${accent}30`,
                          }}>
                            {coverImg ? (
                              <img src={coverImg} alt="" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, ${accent}40, #000)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{emoji}</div>
                            )}
                          </div>

                          {/* Listen badge */}
                          <div style={{
                            background: `${accent}18`,
                            backdropFilter: 'blur(4px)',
                            color: accent,
                            border: `1px solid ${accent}30`,
                            padding: '4px 10px',
                            borderRadius: 20,
                            fontSize: isMobile ? 8.5 : 10,
                            fontWeight: 800,
                            alignSelf: 'flex-start',
                            zIndex: 1,
                            letterSpacing: '0.03em'
                          }}>
                            Listen Now ➔
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              );
            }

            if (rawLayout === 'music_hubs') {
              const hubTracks = tracks.slice(0, 6);
              while (hubTracks.length < 6) {
                hubTracks.push(mockTracks[hubTracks.length % mockTracks.length]);
              }
              const hubNames = ['Hip Hop', 'EDM Party', 'Lo-Fi Chill', 'Pop Hits', 'Rock Anthems', 'Acoustic'];
              const icons = ['🎧', '⚡', '📚', '🎤', '🎸', '🎻'];
              const activeHub = activeHubFilter[sectionId] || 'Hip Hop';

              // Filter tracks based on activeHub
              const filteredHubTracks = tracks.filter((track, i) => {
                const genre = (track.genre || '').toLowerCase();
                if (activeHub === 'Hip Hop') return genre.includes('hip') || genre.includes('rap') || track.title.toLowerCase().includes('starboy') || i % 2 === 0;
                if (activeHub === 'EDM Party') return genre.includes('electro') || genre.includes('dance') || genre.includes('edm') || track.plays > 10000;
                if (activeHub === 'Lo-Fi Chill') return genre.includes('lofi') || genre.includes('chill') || genre.includes('ambient');
                if (activeHub === 'Pop Hits') return genre.includes('pop');
                if (activeHub === 'Rock Anthems') return genre.includes('rock') || genre.includes('metal');
                if (activeHub === 'Acoustic') return genre.includes('acoustic') || genre.includes('folk');
                return true;
              }).slice(0, 6);

              // Ensure we have some tracks to render
              const displayHubTracks = filteredHubTracks.length > 0 ? filteredHubTracks : tracks.slice(0, 6);

              return (
                <div key={sectionId} style={{ marginBottom: 32 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div>
                      <span style={{ color: GREEN, fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        {config.subtitle || "POPULAR HUBS"}
                      </span>
                      <h3 style={{ margin: '2px 0 0 0', color: '#fff', fontSize: isMobile ? 17 : 22, fontFamily: 'Outfit, sans-serif', fontWeight: 800 }}>
                        {config.title || "Explore Music Mood Hubs"}
                      </h3>
                    </div>
                  </div>

                  {/* Circular Icons */}
                  <div style={{
                    display: 'flex',
                    gap: isMobile ? 10 : 20,
                    overflowX: 'auto',
                    paddingBottom: 12,
                    marginBottom: 16,
                    scrollbarWidth: 'none'
                  }} className="no-scrollbar">
                    {hubNames.map((hub, i) => {
                      const isActive = activeHub === hub;
                      const track = hubTracks[i];
                      return (
                        <div key={`${hub}-${i}`} style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          cursor: 'pointer',
                          flexShrink: 0,
                          marginRight: isMobile ? 0 : undefined
                        }}
                        onClick={() => {
                          setActiveHubFilter(prev => ({ ...prev, [sectionId]: hub }));
                          toast.success(`Filtered by ${hub}!`);
                        }}
                        >
                          <div style={{
                            width: isMobile ? 64 : 80,
                            height: isMobile ? 64 : 80,
                            borderRadius: '50%',
                            background: isActive 
                              ? 'linear-gradient(135deg, rgba(29, 185, 84, 0.35) 0%, rgba(15, 23, 18, 0.9) 100%)'
                              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(15, 23, 18, 0.9) 100%)',
                            border: isActive 
                              ? `2px solid ${GREEN}` 
                              : '2px solid rgba(255, 255, 255, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: isMobile ? 26 : 32,
                            boxShadow: isActive ? `0 0 16px ${GREEN}40` : '0 6px 16px rgba(0,0,0,0.3)',
                            marginBottom: 8,
                            position: 'relative',
                            transition: 'all 0.25s ease'
                          }}>
                            {track.coverImage ? (<img src={track.coverImage} alt="" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', opacity: 0.25 }} />) : null}
                            <span style={{ zIndex: 1, transform: isActive ? 'scale(1.15)' : 'none', transition: 'transform 0.2s' }}>{icons[i]}</span>
                          </div>
                          <span style={{ 
                            color: isActive ? '#fff' : 'rgba(255,255,255,0.6)', 
                            fontSize: isMobile ? 11 : 13, 
                            fontWeight: isActive ? 800 : 600, 
                            fontFamily: 'Outfit, sans-serif',
                            position: 'relative'
                          }}>
                            {hub}
                            {isActive && (
                              <motion.div layoutId={`activeHubIndicator-${sectionId}`} style={{ position: 'absolute', bottom: -6, left: '20%', right: '20%', height: 2, background: GREEN, borderRadius: 1 }} />
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Filtered Track slider below circular filters */}
                  <div style={{
                    display: 'flex',
                    gap: isMobile ? 10 : 14,
                    overflowX: 'auto',
                    paddingBottom: 8,
                    scrollbarWidth: 'none'
                  }} className="no-scrollbar">
                    {displayHubTracks.map((track) => {
                      const isCurrent = currentTrack?.id === track.id;
                      return (
                        <div key={`${track.id}-hub-item`} style={{
                          background: 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(10,10,10,0.95) 100%)',
                          border: '1px solid rgba(255,255,255,0.05)',
                          borderRadius: 12,
                          padding: 10,
                          width: isMobile ? 110 : 140,
                          display: 'flex',
                          flexDirection: 'column',
                          flexShrink: 0,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          marginRight: isMobile ? 0 : undefined
                        }}
                        onClick={() => playTrack(track, displayHubTracks)}
                        >
                          <div style={{ width: '100%', aspectRatio: '1', borderRadius: 8, overflow: 'hidden', marginBottom: 8, position: 'relative' }}>
                            <img src={track.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            {isCurrent && isPlaying && (
                              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ fontSize: 20 }}>🔊</span>
                              </div>
                            )}
                          </div>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#fff', fontSize: isMobile ? 11 : 12.5, fontWeight: 700, fontFamily: 'Outfit, sans-serif' }}>
                            {track.title}
                          </div>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'rgba(255,255,255,0.4)', fontSize: isMobile ? 9 : 10.5, marginTop: 2 }}>
                            {track.artistName}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }

            if (rawLayout === 'new_launches_slider') {
              const slideIndex = spotlightSlideIndex[sectionId] || 0;
              const slides = [
                {
                  title: 'JBL x Beato: Sonic Wave',
                  subtitle: 'FEATURED HARDWARE COLLAB',
                  desc: 'Experience pure bass and high-definition wireless playback with the new JBL Sonic Wave Headset, customized for Beato HD. Claim No Cost EMI starting today!',
                  badge: 'NEW HARDWARE',
                  image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=80',
                  actionText: 'Explore Gear',
                  themeColor: '#1db954',
                  gradient: 'linear-gradient(135deg, #0d381e 0%, #060a08 100%)',
                  border: '1.5px solid rgba(29, 185, 84, 0.4)'
                },
                {
                  title: "Abel's Midnight Odyssey",
                  subtitle: 'EXCLUSIVE DOLBY RELEASE',
                  desc: 'Get exclusive access to the brand new album, remastered fully in 360 Reality Audio and Dolby Atmos. Available only on Beato Premium tiers.',
                  badge: 'ALBUM DROP',
                  image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80',
                  actionText: 'Listen Exclusive',
                  themeColor: '#10b981',
                  gradient: 'linear-gradient(135deg, #2e1065 0%, #090514 100%)',
                  border: '1.5px solid rgba(16, 185, 129, 0.4)'
                },
                {
                  title: 'Sennheiser Studio: Pure Sound',
                  subtitle: 'PARTNER SPOTLIGHT',
                  desc: 'Crafted for audiophiles. Stream 100% lossless FLAC tracks optimized specifically for Sennheiser HD studio monitors. Pure, uncompressed acoustic luxury.',
                  badge: 'STUDIO HD',
                  image: 'https://images.unsplash.com/photo-1484755560693-a4074577af3a?w=500&auto=format&fit=crop&q=80',
                  actionText: 'Activate Lossless',
                  themeColor: '#10b981',
                  gradient: 'linear-gradient(135deg, #1e3a8a 0%, #030712 100%)',
                  border: '1.5px solid rgba(16, 185, 129, 0.4)'
                }
              ];
              const cur = slides[slideIndex];

              const nextSlide = (e: any) => {
                e.stopPropagation();
                setSpotlightSlideIndex(prev => ({
                  ...prev,
                  [sectionId]: (slideIndex + 1) % slides.length
                }));
              };

              const prevSlide = (e: any) => {
                e.stopPropagation();
                setSpotlightSlideIndex(prev => ({
                  ...prev,
                  [sectionId]: (slideIndex - 1 + slides.length) % slides.length
                }));
              };

              return (
                <div key={sectionId} style={{ marginBottom: 32 }}>
                  <div style={{
                    background: cur.gradient,
                    border: cur.border,
                    borderRadius: 16,
                    padding: isMobile ? 14 : 24,
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    alignItems: 'center',
                    gap: isMobile ? 12 : 24,
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                    transition: 'all 0.4s ease'
                  }}>
                    {/* Background bubble glow */}
                    <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: `${cur.themeColor}1a`, filter: 'blur(40px)', zIndex: 0 }} />

                    {/* Left navigation arrow */}
                    <button onClick={prevSlide} style={{
                      position: 'absolute',
                      left: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: 'rgba(0,0,0,0.6)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff',
                      cursor: 'pointer',
                      zIndex: 10,
                      display: isMobile ? 'none' : 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 16
                    }}>‹</button>

                    {/* Right navigation arrow */}
                    <button onClick={nextSlide} style={{
                      position: 'absolute',
                      right: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: 'rgba(0,0,0,0.6)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff',
                      cursor: 'pointer',
                      zIndex: 10,
                      display: isMobile ? 'none' : 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 16
                    }}>›</button>

                    {/* Image Showcase */}
                    <div style={{
                      position: 'relative',
                      width: isMobile ? '100%' : '240px',
                      height: isMobile ? '160px' : '180px',
                      borderRadius: 12,
                      overflow: 'hidden',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                      flexShrink: 0,
                      zIndex: 1
                    }}>
                      <img src={cur.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{
                        position: 'absolute',
                        top: 10,
                        left: 10,
                        background: cur.themeColor,
                        padding: '4px 8px',
                        borderRadius: 6,
                        color: cur.themeColor === '#1db954' ? '#000' : '#fff',
                        fontSize: 9,
                        fontWeight: 900,
                        letterSpacing: '0.05em',
                        boxShadow: `0 0 12px ${cur.themeColor}80`
                      }}>
                        {cur.badge}
                      </div>
                    </div>

                    {/* Content Section */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', width: '100%', zIndex: 1 }}>
                      <div>
                        <span style={{ color: cur.themeColor, fontSize: 9.5, fontWeight: 950, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                          {cur.subtitle}
                        </span>
                        <h2 style={{ color: '#fff', fontSize: isMobile ? 20 : 24, fontFamily: 'Outfit, sans-serif', fontWeight: 950, margin: '4px 0' }}>
                          {cur.title}
                        </h2>
                        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: isMobile ? 11 : 13, margin: '0 0 16px 0', lineHeight: 1.4 }}>
                          {cur.desc}
                        </p>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <button 
                          onClick={() => {
                            if (slideIndex === 1) {
                              playTrack(tracks[0] || mockTracks[0], tracks);
                            } else {
                              toast.success(`Redirecting to ${cur.title} page!`);
                            }
                          }}
                          style={{
                            background: cur.themeColor,
                            border: 'none',
                            color: cur.themeColor === '#1db954' ? '#000' : '#fff',
                            padding: '8px 20px',
                            borderRadius: 24,
                            fontSize: isMobile ? 11 : 12.5,
                            fontWeight: 900,
                            cursor: 'pointer',
                            boxShadow: `0 4px 14px ${cur.themeColor}40`,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            transition: 'transform 0.15s'
                          }}
                          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
                          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                        >
                          ▶ {cur.actionText}
                        </button>
                        
                        {/* Dot indicators */}
                        <div style={{ display: 'flex', gap: 6 }}>
                          {slides.map((_, i) => (
                            <div 
                              key={i} 
                              onClick={() => setSpotlightSlideIndex(prev => ({ ...prev, [sectionId]: i }))}
                              style={{ 
                                width: i === slideIndex ? 20 : 6, 
                                height: 6, 
                                borderRadius: 3, 
                                background: i === slideIndex ? cur.themeColor : 'rgba(255,255,255,0.2)',
                                cursor: 'pointer',
                                transition: 'all 0.25s ease'
                              }} 
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            if (rawLayout === 'brand_artist_collabs') {
              const gridTracks = tracks.slice(0, 4);
              while (gridTracks.length < 4) {
                gridTracks.push(mockTracks[gridTracks.length % mockTracks.length]);
              }
              const brandNames = ['Bose Sound', 'Sony Audio', 'Sennheiser', 'Pioneer DJ'];
              const brandDiscounts = ['Up to 30% Off Gear', 'Exclusive Tiers', '40% Off Studio FLAC', 'DJ Deck Bundles'];
              const brandIcons = ['🔊', '📻', '🎧', '🎚️'];
              const brandBorders = ['rgba(29, 185, 84, 0.35)', 'rgba(16, 185, 129, 0.35)', 'rgba(16, 185, 129, 0.35)', 'rgba(52, 211, 153, 0.35)'];
              const textColors = ['#1db954', '#10b981', '#10b981', '#34d399'];
              const brandGrads = [
                'linear-gradient(145deg, rgba(29, 185, 84,0.08) 0%, rgba(6,6,6,0.95) 100%)',
                'linear-gradient(145deg, rgba(16, 185, 129,0.08) 0%, rgba(6,6,6,0.95) 100%)',
                'linear-gradient(145deg, rgba(16, 185, 129,0.08) 0%, rgba(6,6,6,0.95) 100%)',
                'linear-gradient(145deg, rgba(52, 211, 153,0.08) 0%, rgba(6,6,6,0.95) 100%)'
              ];

              return (
                <div key={sectionId} style={{ marginBottom: 32 }}>
                  {/* Premium section header */}
                  <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: GREEN, boxShadow: `0 0 8px ${GREEN}` }} />
                        <span style={{ color: GREEN, fontSize: isMobile ? 9 : 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                          {config.subtitle || 'TOP AUDIO BRANDS'}
                        </span>
                      </div>
                      <h3 style={{ margin: 0, color: '#fff', fontSize: isMobile ? 18 : 22, fontFamily: 'Outfit, sans-serif', fontWeight: 900, letterSpacing: '-0.01em' }}>
                        {config.title || 'Brand Partner Stores'}
                      </h3>
                    </div>
                    <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: isMobile ? 11 : 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', marginLeft: 12 }}>See all →</span>
                  </div>

                  {/* 2x2 Grid of partner audio brands — glassmorphic premium */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: isMobile ? 10 : 14,
                    marginBottom: 14
                  }}>
                    {gridTracks.map((track, i) => {
                      const accent = textColors[i % textColors.length];
                      const coverImg = track.coverImage || '';
                      return (
                        <motion.div
                          key={`${track.id}-collab-${i}`}
                          whileHover={{ scale: 1.02, y: -3 }}
                          style={{
                            background: brandGrads[i % brandGrads.length],
                            border: `1.5px solid ${brandBorders[i % brandBorders.length]}`,
                            borderRadius: 16,
                            padding: isMobile ? 12 : 18,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                            backdropFilter: 'blur(8px)',
                            boxShadow: `0 8px 24px rgba(0,0,0,0.3)`,
                            transition: 'box-shadow 0.25s ease'
                          }}
                          onMouseEnter={e => (e.currentTarget.style.boxShadow = `0 12px 32px rgba(0,0,0,0.4), 0 0 0 1px ${accent}40`)}
                          onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)')}
                          onClick={() => {
                            playTrack(track, tracks);
                            toast.success(`Exploring ${brandNames[i]} collection!`);
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 14, flex: 1, minWidth: 0 }}>
                            <div style={{
                              width: isMobile ? 36 : 44,
                              height: isMobile ? 36 : 44,
                              borderRadius: 12,
                              background: `${accent}18`,
                              border: `1px solid ${accent}30`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: isMobile ? 18 : 22,
                              flexShrink: 0
                            }}>
                              {brandIcons[i]}
                            </div>
                            <div style={{ overflow: 'hidden', minWidth: 0 }}>
                              <h4 style={{ color: '#fff', fontSize: isMobile ? 13 : 15, fontFamily: 'Outfit, sans-serif', fontWeight: 900, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {brandNames[i]}
                              </h4>
                              <span style={{ color: accent, fontSize: isMobile ? 9.5 : 11, fontWeight: 800, display: 'block', marginTop: 3 }}>
                                {brandDiscounts[i]}
                              </span>
                            </div>
                          </div>
                          <div style={{
                            width: isMobile ? 40 : 50,
                            height: isMobile ? 40 : 50,
                            borderRadius: 12,
                            overflow: 'hidden',
                            boxShadow: `0 4px 14px rgba(0,0,0,0.5)`,
                            flexShrink: 0,
                            border: `1px solid ${accent}25`,
                            background: `linear-gradient(135deg, ${accent}20, #000)`
                          }}>
                            {coverImg ? (
                              <img src={coverImg} alt="" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{brandIcons[i]}</div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Wide Featured Brand Partner Card (Zepto Ambrane Style) */}
                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    style={{
                      background: 'linear-gradient(90deg, #111 0%, #1e1e1e 50%, #0d381e 100%)',
                      border: '1.5px solid rgba(29, 185, 84, 0.35)',
                      borderRadius: 16,
                      padding: isMobile ? 12 : 20,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
                    }}
                    onClick={() => {
                      playTrack(gridTracks[0], gridTracks);
                      toast.success('Beato Pro Earbuds details loaded!');
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
                      <div style={{
                        width: isMobile ? 50 : 64,
                        height: isMobile ? 50 : 64,
                        borderRadius: 12,
                        background: 'linear-gradient(135deg, #1db954 0%, #0a0a0a 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <Headphones size={isMobile ? 22 : 30} color="#000" />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <span style={{
                          background: 'rgba(29, 185, 84, 0.15)',
                          color: '#1db954',
                          fontSize: 9,
                          fontWeight: 900,
                          padding: '2px 6px',
                          borderRadius: 4,
                          letterSpacing: '0.05em'
                        }}>
                          FEATURED BRAND
                        </span>
                        <h4 style={{ color: '#fff', fontSize: isMobile ? 14 : 17, fontWeight: 900, margin: '4px 0 0 0', fontFamily: 'Outfit, sans-serif' }}>
                          Beato Pro Studio Earbuds
                        </h4>
                        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: isMobile ? 10 : 12 }}>
                          Up to 60% Off for Premium Members
                        </span>
                      </div>
                    </div>
                    <button style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: '#1db954',
                      border: 'none',
                      color: '#000',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: 16,
                      fontWeight: 800,
                      flexShrink: 0,
                      marginLeft: 12
                    }}>
                      ➔
                    </button>
                  </motion.div>
                </div>
              );
            }

            if (rawLayout === 'mood_mania_grid') {
              const gridTracks = tracks.slice(0, 3);
              while (gridTracks.length < 3) {
                gridTracks.push(mockTracks[gridTracks.length % mockTracks.length]);
              }
              const categoryNames = ['Fresh Hits & Pop', 'Deep Bass & EDM', 'Acoustic & Lo-Fi'];
              const detailsText = ['Starting at 120 BPM', 'HQ Dolby Atmos', '100% Chill Vibes'];
              const prices = ['FREE STREAM', 'HQ AUDIO', 'FREE STREAM'];
              const iconBackgrounds = ['#e11d48', '#2563eb', '#059669'];
              const moodEmojis = ['🔥', '⚡', '🌿'];
              const moodGrads = [
                'linear-gradient(145deg, rgba(225,29,72,0.15) 0%, rgba(8,8,8,0.9) 100%)',
                'linear-gradient(145deg, rgba(37,99,235,0.15) 0%, rgba(8,8,8,0.9) 100%)',
                'linear-gradient(145deg, rgba(5,150,105,0.15) 0%, rgba(8,8,8,0.9) 100%)'
              ];

              return (
                <div key={sectionId} style={{ marginBottom: 32 }}>
                  {/* Premium header panel */}
                  <div style={{
                    background: 'linear-gradient(135deg, #1a0510 0%, #0e0508 50%, #000 100%)',
                    border: '1.5px solid rgba(239, 68, 68, 0.35)',
                    borderRadius: 20,
                    padding: isMobile ? '14px 12px' : '22px 20px',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(239,68,68,0.1)'
                  }}>
                    {/* Decorative glow orbs */}
                    <div style={{ position: 'absolute', top: -40, left: -40, width: 140, height: 140, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.2)', filter: 'blur(50px)', pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', bottom: -30, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.12)', filter: 'blur(35px)', pointerEvents: 'none' }} />

                    <div style={{ textAlign: 'center', marginBottom: 16, position: 'relative', zIndex: 1 }}>
                      <span style={{
                        background: 'rgba(239,68,68,0.12)',
                        color: '#ef4444',
                        border: '1px solid rgba(239,68,68,0.3)',
                        fontSize: isMobile ? 9 : 10,
                        fontWeight: 900,
                        textTransform: 'uppercase',
                        letterSpacing: '0.15em',
                        padding: '4px 10px',
                        borderRadius: 20,
                        display: 'inline-block'
                      }}>
                        🎭 BEAT MANIA
                      </span>
                      <h3 style={{
                        margin: '8px 0 0 0',
                        color: '#fff',
                        fontSize: isMobile ? 18 : 26,
                        fontFamily: 'Outfit, sans-serif',
                        fontWeight: 950,
                        letterSpacing: '-0.01em'
                      }}>
                        {config.title || 'Music Mania'}
                      </h3>
                      <p style={{ margin: '4px 0 0 0', color: 'rgba(255,255,255,0.4)', fontSize: isMobile ? 10 : 12 }}>Up to 50% Off Premium</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: isMobile ? 8 : 12, position: 'relative', zIndex: 1 }}>
                      {gridTracks.map((track, i) => {
                        const accent = iconBackgrounds[i];
                        const coverImg = track.coverImage || '';
                        return (
                          <motion.div
                            key={`${track.id}-mania-${i}`}
                            whileHover={{ scale: 1.04, y: -4 }}
                            style={{
                              background: moodGrads[i],
                              border: `1px solid ${accent}30`,
                              borderRadius: 16,
                              padding: isMobile ? 10 : 16,
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              textAlign: 'center',
                              height: isMobile ? 132 : 164,
                              cursor: 'pointer',
                              position: 'relative',
                              overflow: 'hidden',
                              backdropFilter: 'blur(8px)',
                              boxShadow: `0 6px 20px rgba(0,0,0,0.4)`,
                              transition: 'box-shadow 0.25s ease'
                            }}
                            onMouseEnter={e => (e.currentTarget.style.boxShadow = `0 10px 28px rgba(0,0,0,0.5), 0 0 0 1px ${accent}50`)}
                            onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.4)')}
                            onClick={() => playTrack(track, tracks)}
                          >
                            <div style={{ zIndex: 1 }}>
                              <div style={{ fontSize: isMobile ? 20 : 24, marginBottom: 4 }}>{moodEmojis[i]}</div>
                              <div style={{ fontSize: isMobile ? 10.5 : 13, fontWeight: 900, fontFamily: 'Outfit, sans-serif', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
                                {categoryNames[i]}
                              </div>
                              <div style={{ fontSize: isMobile ? 8 : 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                                {detailsText[i]}
                              </div>
                            </div>

                            {/* Circle image with fallback */}
                            <div style={{
                              width: isMobile ? 40 : 52,
                              height: isMobile ? 40 : 52,
                              borderRadius: '50%',
                              overflow: 'hidden',
                              margin: '6px 0',
                              border: `2px solid ${accent}60`,
                              boxShadow: `0 0 14px ${accent}40`,
                              zIndex: 1,
                              flexShrink: 0,
                              background: `linear-gradient(135deg, ${accent}30, #000)`
                            }}>
                              {coverImg ? (
                                <img src={coverImg} alt="" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{moodEmojis[i]}</div>
                              )}
                            </div>

                            <span style={{
                              color: accent,
                              fontSize: isMobile ? 9 : 11,
                              fontWeight: 900,
                              letterSpacing: '0.04em',
                              zIndex: 1,
                              background: `${accent}15`,
                              padding: '2px 8px',
                              borderRadius: 10,
                              border: `1px solid ${accent}30`
                            }}>
                              {prices[i]}
                            </span>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            }

            if (rawLayout === 'deals_pricing_slider') {
              const sliderTracks = tracks.slice(0, 6);
              while (sliderTracks.length < 6) {
                sliderTracks.push(mockTracks[sliderTracks.length % mockTracks.length]);
              }
              const dealsTabs = ['All Deals', 'Free Hits', 'Premium Singles', 'Podcast Packs'];
              const currentDealsTab = activeDealsTab[sectionId] || 'All Deals';

              // Filter tracks based on deals tab selection
              const filteredDealsTracks = tracks.filter((track, idx) => {
                if (currentDealsTab === 'Free Hits') return idx % 2 === 0;
                if (currentDealsTab === 'Premium Singles') return idx % 2 !== 0;
                if (currentDealsTab === 'Podcast Packs') return idx >= 3;
                return true;
              }).slice(0, 6);

              const displayDealsTracks = filteredDealsTracks.length > 0 ? filteredDealsTracks : tracks.slice(0, 6);

              const prices = ['₹0', 'Free', '₹0', 'Premium', '₹0', 'Free'];
              const originalPrices = ['~~₹199~~', '~~₹99~~', '~~₹149~~', '~~₹299~~', '~~₹199~~', '~~₹99~~'];
              const discounts = ['100% OFF', 'FREE', '100% OFF', 'EXCLUSIVE', '100% OFF', 'FREE'];

              return (
                <div key={sectionId} style={{ marginBottom: 32 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 14 }}>
                    <span style={{ color: GREEN, fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      DEALS STARTING AT ₹0
                    </span>
                    <h3 style={{ margin: '2px 0 6px 0', color: '#fff', fontSize: isMobile ? 17 : 22, fontFamily: 'Outfit, sans-serif', fontWeight: 800 }}>
                      {config.title || "Claim Premium Tracks & Singles"}
                    </h3>
                    
                    {/* Horizontal Tab Chips */}
                    <div style={{
                      display: 'flex',
                      gap: 8,
                      overflowX: 'auto',
                      padding: '4px 0',
                      scrollbarWidth: 'none'
                    }} className="no-scrollbar">
                      {dealsTabs.map(tab => {
                        const isActive = currentDealsTab === tab;
                        return (
                          <button
                            key={tab}
                            onClick={() => {
                              setActiveDealsTab(prev => ({ ...prev, [sectionId]: tab }));
                              toast.success(`Showing ${tab}!`);
                            }}
                            style={{
                              background: isActive ? '#1db954' : 'rgba(255,255,255,0.06)',
                              color: isActive ? '#000' : '#fff',
                              border: isActive ? '1px solid #1db954' : '1px solid rgba(255,255,255,0.1)',
                              borderRadius: 20,
                              padding: '5px 12px',
                              fontSize: isMobile ? 11 : 12,
                              fontWeight: 800,
                              fontFamily: 'Outfit, sans-serif',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                              transition: 'all 0.2s'
                            }}
                          >
                            {tab}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: isMobile ? 10 : 16,
                    overflowX: 'auto',
                    paddingBottom: 12,
                    scrollbarWidth: 'none'
                  }} className="no-scrollbar">
                    {displayDealsTracks.map((track, i) => {
                      const isLiked = likedSongIds.includes(track.id);
                      const isInCart = cartTracks.some(ct => ct.id === track.id);
                      
                      return (
                        <div key={`${track.id}-deal-${i}`} style={{
                          background: 'linear-gradient(135deg, rgba(29, 185, 84,0.04) 0%, rgba(15,15,15,0.95) 100%)',
                          border: '1px solid rgba(29, 185, 84,0.15)',
                          borderRadius: 16,
                          padding: isMobile ? 10 : 14,
                          width: isMobile ? 125 : 155,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          flexShrink: 0,
                          cursor: 'pointer',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                          position: 'relative',
                          marginRight: isMobile ? 0 : undefined
                        }}
                        onClick={() => playTrack(track, displayDealsTracks)}
                        >
                          {/* Image card wrapper */}
                          <div style={{ position: 'relative', width: '100%', aspectRatio: '1', borderRadius: 12, overflow: 'hidden', marginBottom: 8 }}>
                            {track.coverImage ? (<img src={track.coverImage} alt="" onError={e => { const p = (e.target as HTMLImageElement).parentElement; if (p) p.style.background = 'linear-gradient(135deg, rgba(29, 185, 84,0.15), #000)'; (e.target as HTMLImageElement).style.display = 'none'; }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />) : null}
                            
                            {/* Heart/Like Button on top-right of image */}
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  await toggleLikeSong(track.id);
                                  toast.success(isLiked ? 'Removed from Liked Songs' : 'Added to Liked Songs');
                                } catch (err) {
                                  console.error(err);
                                }
                              }}
                              style={{
                                position: 'absolute',
                                top: 6,
                                right: 6,
                                background: 'rgba(0,0,0,0.6)',
                                border: 'none',
                                borderRadius: '50%',
                                width: 24,
                                height: 24,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                zIndex: 5
                              }}
                            >
                              <Heart size={12} color={isLiked ? '#ef4444' : '#fff'} fill={isLiked ? '#ef4444' : 'none'} />
                            </button>

                            {/* Discount tag on top-left */}
                            <div style={{
                              position: 'absolute',
                              top: 6,
                              left: 6,
                              background: '#ff007f',
                              color: '#fff',
                              fontSize: 8,
                              fontWeight: 900,
                              padding: '2px 5px',
                              borderRadius: 4,
                              fontFamily: 'Outfit, sans-serif'
                            }}>
                              {discounts[i % discounts.length]}
                            </div>

                            {/* PLUS button on bottom-right of image (overlapping corner) */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isInCart) {
                                  setCartTracks(prev => prev.filter(ct => ct.id !== track.id));
                                  toast.success('Removed track from cart!');
                                } else {
                                  setCartTracks(prev => [...prev, track]);
                                  toast.success('Added track to cart! Check the cart bar at the bottom.', {
                                    icon: '🛒'
                                  });
                                }
                              }}
                              style={{
                                position: 'absolute',
                                bottom: -2,
                                right: -2,
                                width: 30,
                                height: 30,
                                borderRadius: '50%',
                                background: isInCart ? '#ef4444' : '#1db954', // green or red matching cart
                                border: '2.5px solid #121212', // dark border to look separate
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                fontSize: isInCart ? 10 : 15,
                                fontWeight: 900,
                                zIndex: 5,
                                boxShadow: '0 4px 10px rgba(0,0,0,0.5)'
                              }}
                            >
                              {isInCart ? '✕' : '+'}
                            </button>
                          </div>

                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            <div style={{ color: '#fff', fontSize: isMobile ? 11.5 : 13.5, fontWeight: 900, fontFamily: 'Outfit, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {track.title}
                            </div>
                            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: isMobile ? 9.5 : 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>
                              {track.artistName}
                            </div>
                          </div>

                          {/* Pricing labels */}
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 8 }}>
                            <span style={{ color: GREEN, fontSize: isMobile ? 13 : 15, fontWeight: 950, fontFamily: 'Outfit, sans-serif' }}>
                              {prices[i % prices.length]}
                            </span>
                            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: isMobile ? 9.5 : 11, textDecoration: 'line-through' }}>
                              {originalPrices[i % originalPrices.length]}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }

             if (rawLayout === 'hashtag_slides') {
              if (config.hashtags && config.hashtags.trim().length > 0) {
                const tags = config.hashtags.split(',');
                const defaultImages = [
                  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&auto=format&fit=crop&q=80',
                  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80',
                  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&auto=format&fit=crop&q=80',
                  'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=300&auto=format&fit=crop&q=80',
                  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80',
                ];

                return (
                  <div style={{
                    display: 'flex',
                    gap: isMobile ? 10 : 16,
                    overflowX: 'auto',
                    paddingBottom: 10,
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none'
                  }} className="no-scrollbar">
                    {tags.map((tag: string, i: number) => {
                      const cleanTag = tag.trim();
                      const cardImage = defaultImages[i % defaultImages.length];

                      return (
                        <motion.div
                          key={i}
                          whileHover={{ scale: 1.03, y: -4 }}
                          onClick={() => {
                            const tagQuery = cleanTag.replace('#', '').trim().toLowerCase();
                            const matches = allTracks.filter(t => 
                              (t.genre || '').toLowerCase().includes(tagQuery) || 
                              t.title.toLowerCase().includes(tagQuery) ||
                              t.artistName.toLowerCase().includes(tagQuery)
                            );
                            const queue = matches.length > 0 ? matches : allTracks;
                            playTrack(queue[0], queue);
                            toast.success(`Playing ${cleanTag} mix!`);
                          }}
                          style={{
                            width: isMobile ? 135 : 160,
                            height: isMobile ? 180 : 220,
                            borderRadius: 12,
                            backgroundImage: `url(${cardImage})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            position: 'relative',
                            overflow: 'hidden',
                            flexShrink: 0,
                            cursor: 'pointer',
                            padding: '16px',
                            display: 'flex',
                            alignItems: 'flex-end',
                            boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            marginRight: isMobile ? 0 : undefined
                          }}
                        >
                          <div style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)',
                            zIndex: 0
                          }} />
                          <span style={{
                            position: 'relative',
                            zIndex: 1,
                            fontSize: isMobile ? 12 : 14,
                            fontWeight: 850,
                            color: '#fff',
                            fontFamily: 'Outfit, sans-serif',
                            letterSpacing: '-0.02em',
                            lineHeight: 1.2
                          }}>
                            {cleanTag}
                          </span>
                        </motion.div>
                      );
                    })}
                  </div>
                );
              } else {
                return (
                  <div style={{
                    display: 'flex',
                    gap: isMobile ? 10 : 16,
                    overflowX: 'auto',
                    paddingBottom: 10,
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none'
                  }} className="no-scrollbar">
                    {tracks.map((track) => {
                      const coverImg = config.customImage || track.coverImage || `https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c6b?w=300&h=300&fit=crop`;
                      return (
                        <motion.div
                          key={track.id}
                          whileHover={{ scale: 1.03, y: -4 }}
                          onClick={() => playTrack(track, tracks)}
                          style={{
                            width: isMobile ? 120 : 160,
                            height: isMobile ? 170 : 220,
                            borderRadius: 12,
                            backgroundImage: `url(${coverImg})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            position: 'relative',
                            overflow: 'hidden',
                            flexShrink: 0,
                            cursor: 'pointer',
                            padding: '16px',
                            display: 'flex',
                            alignItems: 'flex-end',
                            boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            marginRight: isMobile ? 0 : undefined
                          }}
                        >
                          <div style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)',
                            zIndex: 0
                          }} />
                          <span style={{
                            position: 'relative',
                            zIndex: 1,
                            fontSize: isMobile ? 12 : 14,
                            fontWeight: 850,
                            color: '#fff',
                            fontFamily: 'Outfit, sans-serif',
                            letterSpacing: '-0.02em',
                            lineHeight: 1.2,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            width: '90%'
                          }}
                        >
                          {track.title.replace(/^#/, '')}
                        </span>
                        </motion.div>
                      );
                    })}
                  </div>
                );
              }
            }

            if (layout === 'list') {
              return (
                <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.04)' }}>
                  {!isMobile && (
                    <div style={{ display: 'grid', gridTemplateColumns: '20px 44px 1fr 1fr 90px', gap: 12, padding: '10px 14px 8px', color: 'var(--theme-text-muted, #525252)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <span>#</span><span /><span>Title</span><span>Album</span><span style={{ textAlign: 'right' }}>Duration</span>
                    </div>
                  )}
                  {tracks.map((track, i) => (
                    <TrackCard key={track.id} track={track} index={i} queue={tracks} />
                  ))}
                </div>
              );
            }

            if (layout === 'carousel' || layout === 'slider' || layout === 'rect') {
              const isBanner = config.cardShape?.includes('banner');
              const defaultW = isMobile
                ? (isBanner ? 260 : (cSize === 'xs' ? 115 : cSize === 'sm' ? 135 : 160))
                : (cSize === 'xs' ? 120 : cSize === 'sm' ? 150 : cSize === 'lg' ? 240 : 180);
              const itemWidth = config.cardWidth ? config.cardWidth : defaultW;
              return (
                <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 10, scrollbarWidth: 'none', msOverflowStyle: 'none' }} className="no-scrollbar">
                  {tracks.map(track => (
                    <div key={track.id} style={{ width: itemWidth, flexShrink: 0, marginRight: 0 }}>
                      <AlbumCardInline track={track} onPlay={() => playTrack(track, tracks)} isPlaying={isPlaying} isActive={currentTrack?.id === track.id} cardStyle={cStyle} cardSize={cSize} customImage={config.customImage} cardShape={config.cardShape} cardWidth={config.cardWidth} cardHeight={config.cardHeight} isMobile={isMobile} />
                    </div>
                  ))}
                </div>
              );
            }

            if (rawLayout === 'minimal_quick_access') {
              const cols = isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)';
              const limit = 6;
              return (
                <div style={{ display: 'grid', gridTemplateColumns: cols, gap: 8 }}>
                  {tracks.slice(0, limit).map(track => {
                    const isCurrent = currentTrack?.id === track.id;
                    const imgUrl = config.customImage || track.coverImage || trackGradient(track.id);
                    const isUrl = imgUrl.startsWith('http') || imgUrl.startsWith('data:') || imgUrl.startsWith('/');
                    return (
                      <motion.div key={track.id} whileHover={{ scale: 1.02 }} onClick={() => playTrack(track, tracks)}
                        style={{ display: 'flex', alignItems: 'center', borderRadius: 4, overflow: 'hidden', background: '#2a2a2a', cursor: 'pointer', position: 'relative', transition: 'background 0.15s', height: 56, minWidth: 0 }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#3e3e3e')}
                        onMouseLeave={e => (e.currentTarget.style.background = '#2a2a2a')}>
                        <div style={{ width: 56, height: 56, backgroundImage: isUrl ? `url(${imgUrl})` : 'none', backgroundColor: isUrl ? 'transparent' : undefined, background: isUrl ? undefined : imgUrl, backgroundSize: 'cover', backgroundPosition: 'center', flexShrink: 0 }} />
                        <span style={{ color: '#fff', fontSize: 13, fontWeight: 700, padding: '0 12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0, fontFamily: 'Circular, Inter, sans-serif' }}>{track.title}</span>
                        {isCurrent && isPlaying && (
                          <div style={{ marginRight: 12, display: 'flex', alignItems: 'flex-end', gap: 2 }}>
                            {[1, 2, 3].map(i => (
                              <div key={i} style={{ width: 2, background: GREEN, borderRadius: 1, height: `${4 + i * 3}px`, animation: `waveform ${0.6 + i * 0.15}s ease-in-out infinite` }} />
                            ))}
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              );
            }

            if (layout === 'minimal') {
              return renderSectionTracks(tracks, config);
            }

            if (layout === 'bento') {
              if (isMobile) {
                return renderSectionTracks(tracks, config);
              }
              return (
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 14 }}>
                  <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid rgba(255,255,255,0.05)', gridColumn: 'span 1' }}>
                    <div>
                      <h3 style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 6 }}>{config.title}</h3>
                      <p style={{ color: 'var(--theme-text-muted, #737373)', fontSize: 12 }}>Handpicked featured selection</p>
                    </div>
                    {tracks[0] && (
                      <div style={{ marginTop: 20 }}>
                        <AlbumCardInline track={tracks[0]} onPlay={() => playTrack(tracks[0], tracks)} isPlaying={isPlaying} isActive={currentTrack?.id === tracks[0].id} cardStyle={cStyle} cardSize={cSize} customImage={config.customImage} cardShape={config.cardShape} cardWidth={config.cardWidth} cardHeight={config.cardHeight} isMobile={isMobile} />
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14, gridColumn: 'span 2' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      {tracks.slice(1, 5).map(track => (
                        <div key={track.id} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 12, padding: 12, border: '1px solid rgba(255,255,255,0.04)' }}>
                          <AlbumCardInline track={track} onPlay={() => playTrack(track, tracks)} isPlaying={isPlaying} isActive={currentTrack?.id === track.id} cardStyle={cStyle} cardSize={cSize} customImage={config.customImage} cardShape={config.cardShape} cardWidth={config.cardWidth} cardHeight={config.cardHeight} isMobile={isMobile} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            }

            if (layout === 'timeline') {
              return (
                <div style={{ display: 'flex', flexDirection: 'column', paddingLeft: isMobile ? 12 : 24, borderLeft: '2px dashed rgba(255,255,255,0.15)', position: 'relative', marginLeft: isMobile ? 6 : 12, gap: 24 }}>
                  {tracks.map((track, i) => {
                    const isActive = currentTrack?.id === track.id;
                    const isPl = isPlaying && isActive;
                    return (
                      <div key={track.id} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{
                          position: 'absolute',
                          left: isMobile ? -19 : -31,
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          background: isActive ? 'var(--theme-primary, #1db954)' : 'rgba(255,255,255,0.2)',
                          boxShadow: isActive ? '0 0 10px var(--theme-primary, #1db954)' : 'none',
                          border: '2px solid #000',
                          transition: 'all 0.3s'
                        }} />

                        <div style={{ color: 'var(--theme-primary, #1db954)', fontSize: 11, fontWeight: 700, minWidth: 44 }}>
                          {track.year || '2024'}
                        </div>

                        <div
                          onClick={() => playTrack(track, tracks)}
                          style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            padding: '12px 16px',
                            background: isActive ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
                            borderRadius: 12,
                            border: `1px solid ${isActive ? 'var(--theme-primary, #1db954)30' : 'rgba(255,255,255,0.05)'}`,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                            e.currentTarget.style.transform = 'translateX(4px)';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background = isActive ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)';
                            e.currentTarget.style.transform = 'none';
                          }}
                        >
                          <div style={{ width: 40, height: 40, borderRadius: 6, overflow: 'hidden', background: trackGradient(track.id), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: 18 }}>🎵</span>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ color: '#fff', fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {track.title}
                            </div>
                            <div style={{ color: 'var(--theme-text-muted, #737373)', fontSize: 11, marginTop: 2 }}>
                              {track.artistName} • {track.albumName}
                            </div>
                          </div>
                          <button
                            onClick={e => { e.stopPropagation(); if (isActive) { togglePlay(); } else { playTrack(track, tracks); } }}
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              background: 'rgba(255,255,255,0.1)',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--theme-primary, #1db954)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                          >
                            {isPl ? <Pause size={14} color="black" fill="black" /> : <Play size={14} color="white" fill="white" />}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            }

            // ── 1. AUTO HERO SLIDER (Zepto top banner) ──
            if (rawLayout === 'hero_auto_slider') {
              const hasCustomBanners = config.banners && config.banners.length > 0;
              const slides = hasCustomBanners 
                ? config.banners 
                : tracks.slice(0, 5);
              
              if (!hasCustomBanners) {
                while (slides.length < 3) slides.push(mockTracks[slides.length % mockTracks.length]);
              }
              
              const idx = spotlightSlideIndex[sectionId] || 0;
              const safeIdx = slides.length > 0 ? idx % slides.length : 0;
              const cur = slides[safeIdx];
              
              if (!cur) return null;

              const isCustom = hasCustomBanners;
              const title = isCustom ? cur.title : cur.title;
              const subtitle = isCustom ? cur.subtitle : (config.subtitle || 'NOW TRENDING');
              const desc = isCustom ? '' : cur.artistName;
              const coverImg = isCustom ? cur.imageUrl : (config.customImage || cur.coverImage || '');
              const buttonText = isCustom ? (cur.buttonText || 'Play Now') : 'Play Now';
              const targetUrl = isCustom ? (cur.targetUrl || '#') : '#';

              const heroGrads = [
                'linear-gradient(135deg, #05160e 0%, #0d381e 60%, #030d07 100%)',
                'linear-gradient(135deg, #10061e 0%, #290d4a 60%, #080210 100%)',
                'linear-gradient(135deg, #030a1c 0%, #091c42 60%, #020510 100%)',
                'linear-gradient(135deg, #1f0505 0%, #4a0d0d 60%, #0e0202 100%)',
                'linear-gradient(135deg, #1c1103 0%, #351f05 60%, #0e0801 100%)',
              ];
              const glowColors = [
                'rgba(29, 185, 84,0.5)',
                'rgba(168,85,247,0.5)',
                'rgba(16, 185, 129,0.5)',
                'rgba(239,68,68,0.5)',
                'rgba(245,158,11,0.5)',
              ];
              const accentColors = [
                '#1db954',
                '#a855f7',
                '#10b981',
                '#ef4444',
                '#f59e0b',
              ];
              const badgeLabels = [
                'BEATO ORIGINALS',
                'TRENDING NOW',
                'NEW RELEASES',
                'HOT PICKS',
                'EXCLUSIVE',
              ];

              const setIdx = (n: number) => setSpotlightSlideIndex(prev => ({ ...prev, [sectionId]: n }));

              const handleAction = (e: React.MouseEvent) => {
                e.stopPropagation();
                if (isCustom) {
                  if (targetUrl && targetUrl !== '#') {
                    if (targetUrl.startsWith('http') || targetUrl.startsWith('/')) {
                      window.open(targetUrl, '_blank');
                    } else {
                      const trackToPlay = mockTracks.find(t => t.id === targetUrl) || tracks.find(t => t.id === targetUrl);
                      if (trackToPlay) {
                        playTrack(trackToPlay, [trackToPlay]);
                      } else {
                        playTrack(mockTracks[0], mockTracks);
                        toast.success('Streaming Beato FM!');
                      }
                    }
                  } else {
                    playTrack(mockTracks[0], mockTracks);
                    toast.success('Streaming Beato FM!');
                  }
                } else {
                  playTrack(cur, slides);
                }
              };

              const accent = accentColors[safeIdx % accentColors.length];
              const glow = glowColors[safeIdx % glowColors.length];
              const heroBg = heroGrads[safeIdx % heroGrads.length];
              const badge = subtitle || badgeLabels[safeIdx % badgeLabels.length];
              const desc2 = desc || 'Discover the latest trending tracks and curated playlists.';

              // ── MOBILE: Peek Carousel Slider ──
              if (isMobile) {
                const peekId = `peek-slider-${sectionId}`;
                const cardW = `calc(100vw - 64px)`; // visible card width (leaves 32px peek on each side)

                const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
                  (e.currentTarget as any)._touchStartX = e.touches[0].clientX;
                };
                const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>, currentI: number, total: number) => {
                  const startX = (e.currentTarget as any)._touchStartX ?? 0;
                  const dx = e.changedTouches[0].clientX - startX;
                  if (Math.abs(dx) < 30) return;
                  if (dx < 0) setSpotlightSlideIndex(prev => ({ ...prev, [sectionId]: (currentI + 1) % total }));
                  else setSpotlightSlideIndex(prev => ({ ...prev, [sectionId]: (currentI - 1 + total) % total }));
                };

                return (
                  <div key={sectionId} style={{ marginTop: 28, marginBottom: 36 }}>
                    {/* Section title & spacing for mobile */}
                    <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 14, paddingLeft: 4 }}>
                      <span style={{ color: GREEN, fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
                        {config.subtitle || 'SPOTLIGHT'}
                      </span>
                      <h3 style={{ margin: 0, color: '#fff', fontSize: 17, fontFamily: 'Outfit, sans-serif', fontWeight: 800 }}>
                        {config.title || 'Beato Spotlight'}
                      </h3>
                    </div>

                    {/* ── Peek track — horizontally scrolls to active card ── */}
                    <div
                      id={peekId}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        paddingLeft: 20,
                        paddingRight: 20,
                        overflowX: 'visible',
                        position: 'relative',
                        touchAction: 'pan-x',
                      }}
                      onTouchStart={handleTouchStart}
                      onTouchEnd={e => handleTouchEnd(e, safeIdx, slides.length)}
                    >
                      {slides.map((slide: any, i: number) => {
                        const isActive = i === safeIdx;
                        const slideAccent = accentColors[i % accentColors.length];
                        const slideGlow = glowColors[i % glowColors.length];
                        const slideHeroBg = heroGrads[i % heroGrads.length];
                        const slCoverImg = slide.imageUrl || slide.coverImage || '';
                        const slTitle = slide.title || '';
                        const slArtist = slide.artistName || desc2;
                        const slBadge = (slide.subtitle) || badgeLabels[i % badgeLabels.length];

                        return (
                          <div
                            key={i}
                            onClick={() => {
                              if (!isActive) {
                                setSpotlightSlideIndex(prev => ({ ...prev, [sectionId]: i }));
                              } else {
                                handleAction({ stopPropagation: () => {} } as any);
                              }
                            }}
                            style={{
                              flexShrink: 0,
                              width: cardW,
                              height: isActive ? 210 : 190,
                              borderRadius: 22,
                              overflow: 'hidden',
                              position: 'relative',
                              background: slideHeroBg,
                              boxShadow: isActive
                                ? `0 12px 40px rgba(0,0,0,0.65), 0 0 0 1.5px ${slideAccent}35`
                                : `0 6px 20px rgba(0,0,0,0.35)`,
                              cursor: 'pointer',
                              WebkitTapHighlightColor: 'transparent',
                              transform: isActive ? 'scale(1)' : 'scale(0.94)',
                              opacity: isActive ? 1 : 0.65,
                              transition: 'all 0.38s cubic-bezier(0.34,1.2,0.64,1)',
                              display: 'none', // hide all non-adjacent
                            }}
                          >
                            {/* Show only active and neighbours */}
                            {null}
                          </div>
                        );
                      })}
                    </div>

                    {/* ── Rendered visible slides: prev, active, next ── */}
                    <div style={{ position: 'relative', overflow: 'hidden' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 14,
                          transform: `translateX(calc(-${safeIdx} * (100vw - 50px) + 20px))`,
                          transition: 'transform 0.42s cubic-bezier(0.4, 0, 0.2, 1)',
                          paddingLeft: 20,
                          willChange: 'transform',
                        }}
                        onTouchStart={handleTouchStart}
                        onTouchEnd={e => handleTouchEnd(e, safeIdx, slides.length)}
                      >
                        {slides.map((slide: any, i: number) => {
                          const isActive = i === safeIdx;
                          const slideAccent = accentColors[i % accentColors.length];
                          const slideGlow = glowColors[i % glowColors.length];
                          const slideHeroBg = heroGrads[i % heroGrads.length];
                          const slCoverImg = slide.imageUrl || slide.coverImage || (config.customImage) || '';
                          const slTitle = slide.title || '';
                          const slArtist = slide.artistName || desc2;
                          const slBadge = slide.subtitle || badgeLabels[i % badgeLabels.length];
                          const slButtonText = slide.buttonText || 'Play Now';

                          return (
                            <div
                              key={i}
                              onClick={() => {
                                if (!isActive) {
                                  setSpotlightSlideIndex(prev => ({ ...prev, [sectionId]: i }));
                                } else {
                                  if (!isCustom) playTrack(slide, slides);
                                }
                              }}
                              style={{
                                flexShrink: 0,
                                width: 'calc(100vw - 60px)',
                                height: 205,
                                borderRadius: 22,
                                overflow: 'hidden',
                                position: 'relative',
                                background: slideHeroBg,
                                boxShadow: isActive
                                  ? `0 14px 44px rgba(0,0,0,0.7), 0 0 0 1.5px ${slideAccent}40`
                                  : `0 4px 16px rgba(0,0,0,0.3)`,
                                cursor: 'pointer',
                                WebkitTapHighlightColor: 'transparent',
                                transform: isActive ? 'scale(1)' : 'scale(0.93)',
                                opacity: isActive ? 1 : 0.6,
                                transition: 'transform 0.42s cubic-bezier(0.4,0,0.2,1), opacity 0.42s, box-shadow 0.42s',
                              }}
                            >
                              {/* Full bleed image — max brightness like ref img */}
                              {slCoverImg && (
                                <img
                                  src={slCoverImg}
                                  alt={slTitle}
                                  onError={e => (e.target as HTMLImageElement).style.display = 'none'}
                                  style={{
                                    position: 'absolute', inset: 0,
                                    width: '100%', height: '100%',
                                    objectFit: 'cover',
                                    objectPosition: 'center top',
                                    display: 'block', zIndex: 0,
                                    filter: isActive ? 'brightness(1.22) saturate(1.25) contrast(1.05)' : 'brightness(0.65) saturate(0.8)',
                                    transition: 'filter 0.42s',
                                  }}
                                />
                              )}

                              {/* Overlay — ONLY a strong bottom-up scrim so image shines through */}
                              <div style={{
                                position: 'absolute', inset: 0, zIndex: 1,
                                background: 'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.55) 30%, rgba(0,0,0,0.08) 60%, rgba(0,0,0,0) 100%)',
                                pointerEvents: 'none',
                              }} />

                              {/* Badge — TOP LEFT like ref img */}
                              <div style={{
                                position: 'absolute', top: 14, left: 14, zIndex: 5,
                                opacity: isActive ? 1 : 0,
                                transform: isActive ? 'translateY(0)' : 'translateY(-6px)',
                                transition: 'opacity 0.3s 0.05s, transform 0.3s 0.05s',
                                pointerEvents: isActive ? 'auto' : 'none',
                              }}>
                                <span style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 5,
                                  background: 'rgba(0,0,0,0.45)',
                                  color: '#fff',
                                  border: '1px solid rgba(255,255,255,0.3)',
                                  fontSize: 8.5, fontWeight: 800, textTransform: 'uppercase',
                                  letterSpacing: '0.12em', padding: '5px 11px',
                                  borderRadius: 20, backdropFilter: 'blur(12px)',
                                }}>
                                  <span style={{
                                    width: 5, height: 5, borderRadius: '50%',
                                    background: slideAccent, display: 'inline-block',
                                    boxShadow: `0 0 6px ${slideAccent}`,
                                    flexShrink: 0,
                                  }} />
                                  {slBadge}
                                </span>
                              </div>

                              {/* THREE-DOT button — TOP RIGHT like ref img */}
                              <button
                                onClick={e => e.stopPropagation()}
                                style={{
                                  position: 'absolute', top: 12, right: 12, zIndex: 5,
                                  width: 32, height: 32, borderRadius: '50%',
                                  background: 'rgba(0,0,0,0.4)',
                                  backdropFilter: 'blur(10px)',
                                  border: '1px solid rgba(255,255,255,0.22)',
                                  color: '#fff', fontSize: 18, cursor: 'pointer',
                                  display: isActive ? 'flex' : 'none',
                                  alignItems: 'center', justifyContent: 'center',
                                  lineHeight: 1,
                                  opacity: isActive ? 1 : 0,
                                  transition: 'opacity 0.3s',
                                }}>⋮</button>

                              {/* Bottom content — title + artist + CTA pinned to bottom like ref img */}
                              <div style={{
                                position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 4,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-start',
                                padding: '0 16px 16px 18px',
                                opacity: isActive ? 1 : 0,
                                transform: isActive ? 'translateY(0)' : 'translateY(8px)',
                                transition: 'opacity 0.35s 0.05s, transform 0.35s 0.05s',
                                pointerEvents: isActive ? 'auto' : 'none',
                              }}>
                                {/* Title */}
                                <h2 style={{
                                  fontFamily: 'Outfit, Inter, sans-serif',
                                  fontSize: 21, fontWeight: 950,
                                  color: '#fff', margin: '0 0 3px 0',
                                  lineHeight: 1.2, letterSpacing: '-0.02em',
                                  textShadow: '0 2px 12px rgba(0,0,0,0.9)',
                                  overflow: 'hidden', display: '-webkit-box',
                                  WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                                  width: '80%',
                                } as React.CSSProperties}>{slTitle}</h2>

                                {/* Artist — small caps like ref img "SPONSORED BY" style */}
                                <p style={{
                                  color: 'rgba(255,255,255,0.7)', fontSize: 10,
                                  margin: '0 0 12px 0', fontWeight: 700,
                                  textTransform: 'uppercase', letterSpacing: '0.08em',
                                  textShadow: '0 1px 6px rgba(0,0,0,0.9)',
                                  overflow: 'hidden', display: '-webkit-box',
                                  WebkitLineClamp: 1, WebkitBoxOrient: 'vertical',
                                } as React.CSSProperties}>{slArtist}</p>

                                {/* CTA row — Play button left, Save right */}
                                <div style={{ display: 'flex', gap: 10, alignItems: 'center', width: '100%' }}>
                                  <button
                                    onClick={e => { e.stopPropagation(); if (!isCustom) playTrack(slide, slides); }}
                                    style={{
                                      background: slideAccent, color: '#000', border: 'none',
                                      borderRadius: 22, padding: '9px 20px',
                                      fontSize: 12.5, fontWeight: 900, cursor: 'pointer',
                                      boxShadow: `0 4px 18px ${slideAccent}70`,
                                      display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
                                    }}>
                                    <Play size={13} fill="black" />
                                    {slButtonText}
                                  </button>
                                  <button style={{
                                    background: 'rgba(255,255,255,0.18)', color: '#fff',
                                    border: '1.5px solid rgba(255,255,255,0.4)',
                                    borderRadius: 22, padding: '9px 16px',
                                    fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
                                    backdropFilter: 'blur(12px)', flexShrink: 0,
                                  }}>Save</button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Pill dots */}
                    <div style={{
                      display: 'flex', justifyContent: 'center',
                      alignItems: 'center', gap: 6, marginTop: 12,
                    }}>
                      {slides.map((_: any, i: number) => (
                        <div
                          key={i}
                          onClick={() => setSpotlightSlideIndex(prev => ({ ...prev, [sectionId]: i }))}
                          style={{
                            width: i === safeIdx ? 22 : 7, height: 7, borderRadius: 4,
                            background: i === safeIdx ? accentColors[safeIdx % accentColors.length] : 'rgba(255,255,255,0.22)',
                            transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
                            cursor: 'pointer',
                            boxShadow: i === safeIdx ? `0 0 8px ${accentColors[safeIdx % accentColors.length]}90` : 'none',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                );
              }





              // ── DESKTOP: Keep existing premium 3D design ──
              return (
                <div key={sectionId} style={{ marginBottom: 32 }}>
                  <div style={{ borderRadius: 24, overflow: 'hidden', position: 'relative', height: 280, background: heroBg, cursor: 'pointer', border: `1px solid ${accent}15`, boxShadow: '0 12px 40px rgba(0,0,0,0.5)' }}
                    onClick={handleAction}>
                    <div style={{ position: 'absolute', right: '10%', top: '50%', transform: 'translateY(-50%)', width: 280, height: 280, borderRadius: '50%', background: `radial-gradient(circle, ${glow} 0%, rgba(0,0,0,0) 70%)`, filter: 'blur(35px)', zIndex: 1, pointerEvents: 'none' }} />
                    <button onClick={e => { e.stopPropagation(); setIdx((safeIdx - 1 + slides.length) % slides.length); }} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(10px)', color: '#fff', fontSize: 18, cursor: 'pointer', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&#8249;</button>
                    <button onClick={e => { e.stopPropagation(); setIdx((safeIdx + 1) % slides.length); }} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(10px)', color: '#fff', fontSize: 18, cursor: 'pointer', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&#8250;</button>
                    <div style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'space-between', padding: '0 60px 0 50px', position: 'relative', zIndex: 2 }}>
                      <div style={{ flex: 1, paddingRight: 30, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', marginBottom: 10 }}>
                          <span style={{ background: `${accent}18`, color: accent, border: `1.5px solid ${accent}40`, fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', padding: '3px 12px', borderRadius: 20, boxShadow: `0 2px 8px ${accent}15` }}>{badge}</span>
                        </div>
                        <h2 style={{ fontFamily: 'Outfit,sans-serif', fontSize: 36, fontWeight: 950, color: '#fff', margin: '0 0 8px 0', lineHeight: 1.1, textShadow: '0 2px 16px rgba(0,0,0,0.6)' }}>{title}</h2>
                        {desc2 && <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14, margin: '0 0 20px 0', fontWeight: 500 }}>{desc2}</p>}
                        <div style={{ display: 'flex', gap: 10 }}>
                          <button onClick={handleAction} style={{ background: accent, color: '#000', border: 'none', borderRadius: 24, padding: '11px 28px', fontSize: 14, fontWeight: 900, cursor: 'pointer', boxShadow: `0 6px 20px ${accent}45`, display: 'flex', alignItems: 'center', gap: 6 }}><Play size={14} fill="black" /> {buttonText}</button>
                          <button style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 24, padding: '11px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer', backdropFilter: 'blur(10px)' }}>Save</button>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 2 }}>
                        <div style={{ width: 170, height: 170, borderRadius: 16, overflow: 'hidden', boxShadow: `0 20px 45px rgba(0,0,0,0.8), 0 0 25px ${accent}30`, border: '1.5px solid rgba(255,255,255,0.15)', transform: 'rotate(8deg) translateY(-5px)', transition: 'transform 0.5s ease', background: '#121212', position: 'relative' }}>
                          {coverImg && <img src={coverImg} alt="" onError={e => (e.target as HTMLImageElement).style.display = 'none'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 50%, rgba(0,0,0,0.3) 100%)', pointerEvents: 'none' }} />
                        </div>
                      </div>
                    </div>
                    <div style={{ position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6, zIndex: 3 }}>
                      {slides.map((_: any, i: number) => <div key={i} onClick={e => { e.stopPropagation(); setIdx(i); }} style={{ width: i === safeIdx ? 24 : 7, height: 7, borderRadius: 4, background: i === safeIdx ? accent : 'rgba(255,255,255,0.3)', transition: 'all 0.3s', cursor: 'pointer' }} />)}
                    </div>
                  </div>
                </div>
              );
            }

            // ── 2. CATEGORY QUICK TILES (Zepto category pills) ──
            if (rawLayout === 'category_quick_tiles') {
              const cats = [
                { label: 'Pop Hits', emoji: '🎤', color: '#34d399', bg: 'rgba(52, 211, 153,0.12)' },
                { label: 'EDM', emoji: '⚡', color: '#10b981', bg: 'rgba(16, 185, 129,0.12)' },
                { label: 'Hip-Hop', emoji: '🎧', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
                { label: 'Lo-Fi', emoji: '☕', color: '#10b981', bg: 'rgba(16, 185, 129,0.12)' },
                { label: 'Rock', emoji: '🎸', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
                { label: 'Acoustic', emoji: '🌿', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
                { label: 'R&B', emoji: '💜', color: '#a855f7', bg: 'rgba(168,85,247,0.12)' },
                { label: 'Jazz', emoji: '🎷', color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
                { label: 'Trending', emoji: '🔥', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
                { label: 'New', emoji: '✨', color: GREEN, bg: 'rgba(29, 185, 84,0.12)' },
              ];
              return (
                <div key={sectionId} style={{ marginBottom: 28 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <h3 style={{ color: '#fff', fontSize: isMobile ? 17 : 20, fontWeight: 900, fontFamily: 'Outfit,sans-serif', margin: 0 }}>{config.title || 'Browse Categories'}</h3>
                    <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, cursor: 'pointer' }}>See all</span>
                  </div>
                  <div style={{ display: 'flex', gap: isMobile ? 10 : 14, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'none' }} className="no-scrollbar">
                    {cats.map((c, i) => {
                      const tileTrack = tracks[i % Math.max(tracks.length, 1)] || mockTracks[i % mockTracks.length];
                      return (
                        <motion.div key={c.label} whileHover={{ scale: 1.06, y: -4 }} onClick={() => { playTrack(tileTrack, tracks); toast.success(`Playing ${c.label}!`); }} style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer', minWidth: isMobile ? 64 : 80, marginRight: isMobile ? 0 : undefined }}>
                          <div style={{ width: isMobile ? 58 : 72, height: isMobile ? 58 : 72, borderRadius: '50%', background: c.bg, border: `2px solid ${c.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isMobile ? 24 : 30, boxShadow: `0 4px 16px ${c.color}25`, transition: 'all 0.2s' }}>
                            {c.emoji}
                          </div>
                          <span style={{ color: '#fff', fontSize: isMobile ? 10.5 : 12, fontWeight: 700, textAlign: 'center', whiteSpace: 'nowrap' }}>{c.label}</span>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              );
            }

            // ── 3. FLASH DEALS COUNTDOWN (Blinkit limited-time) ──
            if (rawLayout === 'flash_deals_countdown') {
              const dealTracks = tracks.slice(0, 5);
              while (dealTracks.length < 5) dealTracks.push(mockTracks[dealTracks.length % mockTracks.length]);
              const discounts = ['FREE', '50% OFF', '100% OFF', '0', 'EXCLUSIVE'];
              const timeUnits = ['01:45:22', '00:32:10', '03:12:44', '00:58:30', '02:20:00'];
              const accs = ['#ef4444', '#f59e0b', GREEN, '#10b981', '#a855f7'];
              return (
                <div key={sectionId} style={{ marginBottom: 32 }}>
                  <div style={{ background: 'linear-gradient(90deg,#7f0000 0%,#1a0000 100%)', borderRadius: '16px 16px 0 0', padding: isMobile ? '12px 14px' : '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1.5px solid rgba(239,68,68,0.4)', borderBottom: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: isMobile ? 16 : 20 }}>⚡</span>
                      <div>
                        <div style={{ color: '#fff', fontSize: isMobile ? 14 : 18, fontWeight: 950, fontFamily: 'Outfit,sans-serif' }}>{config.title || 'Flash Deals'}</div>
                        <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: isMobile ? 10 : 11 }}>Limited time — grab before it&apos;s gone!</div>
                      </div>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, padding: '4px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: '#ef4444', fontSize: 10, fontWeight: 900 }}>ENDS IN</span>
                      <span style={{ color: '#fff', fontSize: isMobile ? 13 : 15, fontWeight: 900, fontFamily: 'monospace' }}>04:30:00</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: isMobile ? 10 : 14, overflowX: 'auto', padding: `14px ${isMobile ? 10 : 14}px 8px`, scrollbarWidth: 'none', background: 'rgba(80,0,0,0.08)', borderRadius: '0 0 16px 16px', border: '1.5px solid rgba(239,68,68,0.15)', borderTop: 'none' }} className="no-scrollbar">
                    {dealTracks.map((track, i) => {
                      const acc = accs[i % accs.length];
                      const coverImg = track.coverImage || '';
                      return (
                        <motion.div key={`${track.id}-flash-${i}`} whileHover={{ scale: 1.04, y: -4 }} onClick={() => playTrack(track, dealTracks)} style={{ flexShrink: 0, width: isMobile ? 120 : 148, background: 'rgba(10,10,10,0.9)', border: `1px solid ${acc}30`, borderRadius: 14, overflow: 'hidden', cursor: 'pointer', boxShadow: '0 6px 20px rgba(0,0,0,0.4)', marginRight: isMobile ? 0 : undefined }}>
                          <div style={{ position: 'relative', width: '100%', paddingTop: '100%', background: `linear-gradient(135deg,${acc}20,#000)` }}>
                            {coverImg && <img src={coverImg} alt="" onError={e => (e.target as HTMLImageElement).style.display = 'none'} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
                            <div style={{ position: 'absolute', top: 6, left: 6, background: acc, color: acc === GREEN ? '#000' : '#fff', fontSize: 8.5, fontWeight: 900, padding: '2px 7px', borderRadius: 6 }}>{discounts[i]}</div>
                            <div style={{ position: 'absolute', bottom: 6, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', borderRadius: 6, padding: '2px 8px', whiteSpace: 'nowrap' }}>
                              <span style={{ color: acc, fontSize: 9, fontWeight: 900, fontFamily: 'monospace' }}>⏱ {timeUnits[i]}</span>
                            </div>
                          </div>
                          <div style={{ padding: isMobile ? '8px 8px' : '10px 12px' }}>
                            <div style={{ color: '#fff', fontSize: isMobile ? 11 : 12.5, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'Outfit,sans-serif' }}>{track.title}</div>
                            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: isMobile ? 9 : 10, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.artistName}</div>
                            <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span style={{ color: acc, fontWeight: 950, fontSize: isMobile ? 13 : 15 }}>FREE</span>
                              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, textDecoration: 'line-through' }}>&#8377;199</span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              );
            }

            // ── 4. NEW LAUNCHES SPOTLIGHT (Flipkart new launches) ──
            if (rawLayout === 'new_launches_spotlight') {
              const launchTracks = tracks.slice(0, 6);
              while (launchTracks.length < 4) launchTracks.push(mockTracks[launchTracks.length % mockTracks.length]);
              const launchBadges = ['JUST DROPPED', 'PRE-SAVE', 'EXCLUSIVE', 'ALBUM', 'SINGLE', 'EP'];
              const launchColors = ['#1db954', '#10b981', '#10b981', '#f59e0b', '#34d399', '#10b981'];
              return (
                <div key={sectionId} style={{ marginBottom: 32 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 10px #ef4444' }} />
                        <span style={{ color: '#ef4444', fontSize: isMobile ? 10 : 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>LIVE NOW</span>
                      </div>
                      <h3 style={{ margin: 0, color: '#fff', fontSize: isMobile ? 18 : 22, fontWeight: 950, fontFamily: 'Outfit,sans-serif' }}>{config.title || 'New Launches'}</h3>
                    </div>
                    <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, cursor: 'pointer' }}>View all</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.8fr 1fr', gap: 14 }}>
                    <motion.div whileHover={{ scale: 1.01 }} onClick={() => playTrack(launchTracks[0], launchTracks)} style={{ borderRadius: 18, overflow: 'hidden', position: 'relative', height: isMobile ? 200 : 240, cursor: 'pointer', background: 'linear-gradient(135deg,#0a1f0d,#000)' }}>
                      {launchTracks[0].coverImage && <img src={launchTracks[0].coverImage} alt="" onError={e => (e.target as HTMLImageElement).style.display = 'none'} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }} />}
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(0,0,0,0.9) 0%,rgba(0,0,0,0.1) 60%)' }} />
                      <div style={{ position: 'absolute', top: 12, left: 12, background: launchColors[0], color: '#000', fontSize: 9, fontWeight: 900, padding: '3px 10px', borderRadius: 20 }}>{launchBadges[0]}</div>
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px 18px' }}>
                        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, margin: '0 0 4px 0' }}>{launchTracks[0].artistName}</p>
                        <h3 style={{ color: '#fff', fontSize: isMobile ? 16 : 20, fontWeight: 900, margin: '0 0 12px 0', fontFamily: 'Outfit,sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{launchTracks[0].title}</h3>
                        <button style={{ background: GREEN, color: '#000', border: 'none', borderRadius: 20, padding: '7px 18px', fontSize: 12, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}><Play size={12} fill="black" /> Play Now</button>
                      </div>
                    </motion.div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {launchTracks.slice(1, 4).map((track, i) => {
                        const acc = launchColors[(i + 1) % launchColors.length];
                        const coverImg = track.coverImage || '';
                        return (
                          <motion.div key={track.id} whileHover={{ x: 4 }} onClick={() => playTrack(track, launchTracks)} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '10px 12px', cursor: 'pointer', transition: 'border-color 0.2s' }}
                            onMouseEnter={e => (e.currentTarget.style.borderColor = `${acc}40`)}
                            onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)')}>
                            <div style={{ width: 44, height: 44, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: `linear-gradient(135deg,${acc}30,#000)` }}>
                              {coverImg && <img src={coverImg} alt="" onError={e => (e.target as HTMLImageElement).style.display = 'none'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ color: '#fff', fontSize: 13, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.title}</div>
                              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10.5, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.artistName}</div>
                            </div>
                            <div style={{ background: `${acc}18`, color: acc, fontSize: 8.5, fontWeight: 900, padding: '2px 8px', borderRadius: 10, whiteSpace: 'nowrap', border: `1px solid ${acc}30` }}>{launchBadges[i + 1]}</div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            }

            // ── 5. FEATURED BRANDS ROW (Flipkart brand logos) ──
            if (rawLayout === 'featured_brands_row') {
              const brandList = [
                { name: 'Spotify', sub: '30 Days Free', emoji: '🎵', color: '#1db954' },
                { name: 'Apple Music', sub: '3 Months Free', emoji: '🎶', color: '#fc3c44' },
                { name: 'YouTube', sub: 'Premium Trial', emoji: '▶', color: '#ff0000' },
                { name: 'Amazon', sub: 'Prime Music', emoji: '🔊', color: '#ff9900' },
                { name: 'Tidal', sub: 'HiFi Quality', emoji: '🌊', color: '#00b4ff' },
                { name: 'Deezer', sub: '90 Days Trial', emoji: '🎧', color: '#a238ff' },
              ];
              const featTrack = tracks[0] || mockTracks[0];
              return (
                <div key={sectionId} style={{ marginBottom: 32 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <h3 style={{ margin: 0, color: '#fff', fontSize: isMobile ? 17 : 21, fontWeight: 900, fontFamily: 'Outfit,sans-serif' }}>{config.title || 'Featured Brands'}</h3>
                    <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, cursor: 'pointer' }}>See all</span>
                  </div>
                  <div style={{ display: 'flex', gap: isMobile ? 10 : 14, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 14 }} className="no-scrollbar">
                    {brandList.map((b, i) => {
                      const t = tracks[i % Math.max(tracks.length, 1)] || mockTracks[i % mockTracks.length];
                      return (
                        <motion.div key={b.name} whileHover={{ scale: 1.05, y: -3 }} onClick={() => { playTrack(t, tracks); toast.success(`${b.name} selected!`); }} style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, cursor: 'pointer', marginRight: isMobile ? 0 : undefined }}>
                          <div style={{ width: isMobile ? 64 : 80, height: isMobile ? 64 : 80, borderRadius: 20, background: `${b.color}12`, border: `1.5px solid ${b.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isMobile ? 28 : 34, boxShadow: `0 4px 16px ${b.color}20`, transition: 'all 0.2s' }}>
                            {b.emoji}
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ color: '#fff', fontSize: isMobile ? 11.5 : 13, fontWeight: 800 }}>{b.name}</div>
                            <div style={{ color: b.color, fontSize: isMobile ? 9 : 10.5, fontWeight: 700, marginTop: 2 }}>{b.sub}</div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                  <motion.div whileHover={{ scale: 1.01 }} onClick={() => playTrack(featTrack, tracks)} style={{ borderRadius: 16, background: 'linear-gradient(90deg,#111 0%,#1e1e1e 40%,#0d3820 100%)', border: '1.5px solid rgba(29, 185, 84,0.3)', padding: isMobile ? '14px 16px' : '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', boxShadow: '0 8px 28px rgba(0,0,0,0.4)', overflow: 'hidden', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(29, 185, 84,0.1)', filter: 'blur(30px)' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, zIndex: 1 }}>
                      <div style={{ width: isMobile ? 44 : 56, height: isMobile ? 44 : 56, borderRadius: 14, background: 'linear-gradient(135deg,#1db954,#0d3820)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Headphones size={isMobile ? 20 : 26} color="#000" />
                      </div>
                      <div>
                        <div style={{ background: 'rgba(29, 185, 84,0.15)', color: GREEN, fontSize: 9, fontWeight: 900, padding: '2px 8px', borderRadius: 4, display: 'inline-block', marginBottom: 4 }}>FEATURED PARTNER</div>
                        <h4 style={{ color: '#fff', fontSize: isMobile ? 14 : 17, fontWeight: 900, margin: 0, fontFamily: 'Outfit,sans-serif' }}>Beato Pro Studio Earbuds</h4>
                        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: isMobile ? 10 : 12 }}>Up to 60% Off for Premium Members</span>
                      </div>
                    </div>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: GREEN, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18, fontWeight: 900, flexShrink: 0, boxShadow: '0 4px 12px rgba(29, 185, 84,0.4)' }}>&#8594;</div>
                  </motion.div>
                </div>
              );
            }

            // ── 6. TOP CHART BILLBOARD (ranked list) ──
            if (rawLayout === 'top_chart_billboard') {
              const chartTracks = tracks.slice(0, 8);
              while (chartTracks.length < 5) chartTracks.push(mockTracks[chartTracks.length % mockTracks.length]);
              const rankColors = ['#ffd700', '#c0c0c0', '#cd7f32', '#a3a3a3', '#a3a3a3', '#a3a3a3', '#a3a3a3', '#a3a3a3'];
              const trends = ['+2', 'NEW', '-1', '+5', '+1', 'NEW', '-2', '+3'];
              const trendColors = [GREEN, '#ef4444', '#ef4444', GREEN, GREEN, '#ef4444', '#ef4444', GREEN];
              return (
                <div key={sectionId} style={{ marginBottom: 32 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div>
                      <span style={{ color: GREEN, fontSize: isMobile ? 9 : 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', display: 'block', marginBottom: 4 }}>&#128202; {config.subtitle || 'WEEKLY UPDATE'}</span>
                      <h3 style={{ margin: 0, color: '#fff', fontSize: isMobile ? 18 : 22, fontWeight: 950, fontFamily: 'Outfit,sans-serif' }}>{config.title || 'Top Charts'}</h3>
                    </div>
                    <div style={{ background: 'rgba(29, 185, 84,0.1)', border: '1px solid rgba(29, 185, 84,0.2)', borderRadius: 10, padding: '6px 14px', fontSize: isMobile ? 10 : 12, color: GREEN, fontWeight: 800 }}>This Week</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
                    {chartTracks.map((track, i) => {
                      const isCurr = currentTrack?.id === track.id;
                      const coverImg = track.coverImage || '';
                      return (
                        <motion.div key={track.id} whileHover={{ background: 'rgba(255,255,255,0.05)' } as any} onClick={() => playTrack(track, chartTracks)} style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 14, padding: isMobile ? '10px 12px' : '12px 18px', cursor: 'pointer', borderBottom: i < chartTracks.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', transition: 'background 0.2s' }}>
                          <div style={{ width: 28, textAlign: 'center' }}>
                            <span style={{ fontSize: isMobile ? 16 : 20, fontWeight: 950, color: rankColors[i], fontFamily: 'Outfit,sans-serif', lineHeight: 1 }}>{i + 1}</span>
                          </div>
                          <div style={{ fontSize: isMobile ? 9 : 10, color: trendColors[i], fontWeight: 900, width: 28, textAlign: 'center' }}>{trends[i]}</div>
                          <div style={{ width: isMobile ? 38 : 44, height: isMobile ? 38 : 44, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: 'linear-gradient(135deg,rgba(29, 185, 84,0.2),#000)' }}>
                            {coverImg && <img src={coverImg} alt="" onError={e => (e.target as HTMLImageElement).style.display = 'none'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ color: isCurr ? GREEN : '#fff', fontSize: isMobile ? 12.5 : 14, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.title}</div>
                            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: isMobile ? 10 : 11.5, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.artistName}</div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>{(4.5 - i * 0.5).toFixed(1)}M</span>
                            {isCurr && isPlaying && <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2 }}>{[1, 2, 3].map(n => <div key={n} style={{ width: 2, background: GREEN, borderRadius: 1, height: `${4 + n * 3}px`, animation: `waveform ${0.6 + n * 0.15}s ease-in-out infinite` }} />)}</div>}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              );
            }

            // ── 7. ARTIST FOLLOW CARDS (Swiggy restaurant card style) ──
            if (rawLayout === 'artist_follow_cards') {
              const artistTracks = tracks.slice(0, 6);
              while (artistTracks.length < 4) artistTracks.push(mockTracks[artistTracks.length % mockTracks.length]);
              const tagGroups = [['Pop', 'EDM'], ['Hip-Hop', 'R&B'], ['Rock', 'Alt'], ['Jazz', 'Soul'], ['Lo-Fi', 'Chill'], ['Orch', 'Class']];
              const ratings = ['4.8★', '4.6★', '4.9★', '4.5★', '4.7★', '4.4★'];
              const followCounts = ['2.1M', '850K', '3.4M', '620K', '1.8M', '450K'];
              const artistAccents = [GREEN, '#10b981', '#10b981', '#34d399', '#f59e0b', '#10b981'];
              return (
                <div key={sectionId} style={{ marginBottom: 32 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div>
                      <span style={{ color: GREEN, fontSize: isMobile ? 9 : 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 4 }}>{config.subtitle || 'ARTISTS FOR YOU'}</span>
                      <h3 style={{ margin: 0, color: '#fff', fontSize: isMobile ? 18 : 22, fontWeight: 950, fontFamily: 'Outfit,sans-serif' }}>{config.title || 'Follow Artists'}</h3>
                    </div>
                    <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, cursor: 'pointer' }}>See all</span>
                  </div>
                  <div style={{ display: 'flex', gap: isMobile ? 10 : 16, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 8 }} className="no-scrollbar">
                    {artistTracks.map((track, i) => {
                      const coverImg = track.coverImage || '';
                      const accent = artistAccents[i % artistAccents.length];
                      return (
                        <motion.div key={`${track.id}-artist-${i}`} whileHover={{ y: -6 }} style={{ flexShrink: 0, width: isMobile ? 148 : 180, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, overflow: 'hidden', cursor: 'pointer', boxShadow: '0 6px 20px rgba(0,0,0,0.3)', transition: 'all 0.3s ease', marginRight: isMobile ? 0 : undefined }}>
                          <div style={{ height: isMobile ? 80 : 100, background: `linear-gradient(135deg,${accent}30,#000)`, position: 'relative', overflow: 'hidden' }}>
                            {coverImg && <img src={coverImg} alt="" onError={e => (e.target as HTMLImageElement).style.display = 'none'} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }} />}
                            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,transparent 40%,rgba(0,0,0,0.6) 100%)' }} />
                            <div style={{ position: 'absolute', top: 8, right: 8, background: `${accent}20`, border: `1px solid ${accent}40`, borderRadius: 6, padding: '2px 8px', color: accent, fontSize: 9, fontWeight: 900 }}>{ratings[i]}</div>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'center', marginTop: -24, position: 'relative', zIndex: 1 }}>
                            <div style={{ width: 48, height: 48, borderRadius: '50%', border: '3px solid #000', overflow: 'hidden', background: `linear-gradient(135deg,${accent}40,#000)`, boxShadow: `0 0 0 2px ${accent}40` }}>
                              {coverImg && <img src={coverImg} alt="" onError={e => (e.target as HTMLImageElement).style.display = 'none'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                            </div>
                          </div>
                          <div style={{ padding: isMobile ? '8px 12px 12px' : '10px 14px 14px', textAlign: 'center' }}>
                            <div style={{ color: '#fff', fontSize: isMobile ? 12.5 : 14, fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'Outfit,sans-serif' }}>{track.artistName || track.title}</div>
                            <div style={{ display: 'flex', gap: 4, justifyContent: 'center', margin: '6px 0' }}>
                              {tagGroups[i % tagGroups.length].map(tag => <span key={tag} style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', fontSize: 9, padding: '2px 7px', borderRadius: 10 }}>{tag}</span>)}
                            </div>
                            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, marginBottom: 10 }}>{followCounts[i]} followers</div>
                            <button onClick={() => { playTrack(track, artistTracks); toast.success('Following artist!'); }} style={{ width: '100%', background: accent, color: accent === GREEN ? '#000' : '#fff', border: 'none', borderRadius: 10, padding: '7px 0', fontSize: isMobile ? 11 : 12, fontWeight: 900, cursor: 'pointer', boxShadow: `0 4px 12px ${accent}40`, transition: 'transform 0.15s' }}
                              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
                              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                              Follow + Play
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              );
            }

            // ── 8. FREE DEALS GRID (Blinkit ₹9 deals style) ──
            if (rawLayout === 'free_deals_grid') {
              const dealGrid = tracks.slice(0, 8);
              while (dealGrid.length < 6) dealGrid.push(mockTracks[dealGrid.length % mockTracks.length]);
              const offerBadges = ['100% OFF', 'FREE', '100% OFF', 'FREE', '100% OFF', 'FREE', '100% OFF', 'FREE'];
              const ogPrices = ['&#8377;199', '&#8377;149', '&#8377;249', '&#8377;99', '&#8377;199', '&#8377;149', '&#8377;99', '&#8377;249'];
              return (
                <div key={sectionId} style={{ marginBottom: 32 }}>
                  <div style={{ background: 'linear-gradient(90deg,#0a2010 0%,#050a06 100%)', borderRadius: '16px 16px 0 0', padding: isMobile ? '10px 14px' : '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid rgba(29, 185, 84,0.3)', borderBottom: 'none' }}>
                    <div>
                      <div style={{ color: GREEN, fontSize: isMobile ? 9 : 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 3 }}>DEALS STARTING AT &#8377;0</div>
                      <div style={{ color: '#fff', fontSize: isMobile ? 15 : 18, fontWeight: 900, fontFamily: 'Outfit,sans-serif' }}>{config.title || 'Claim Premium Tracks'}</div>
                    </div>
                    <div style={{ background: GREEN, color: '#000', fontSize: isMobile ? 10 : 12, fontWeight: 900, padding: isMobile ? '6px 12px' : '8px 16px', borderRadius: 20, cursor: 'pointer', whiteSpace: 'nowrap' }}>Claim All</div>
                  </div>
                  <div style={{ background: 'rgba(5,20,8,0.6)', border: '1px solid rgba(29, 185, 84,0.15)', borderTop: 'none', borderRadius: '0 0 16px 16px', padding: isMobile ? '12px 10px' : '14px 14px', backdropFilter: 'blur(4px)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(4, minmax(0, 1fr))' : 'repeat(8, minmax(0, 1fr))', gap: isMobile ? 8 : 12 }}>
                      {dealGrid.map((track, i) => {
                        const coverImg = track.coverImage || '';
                        return (
                          <motion.div key={`${track.id}-free-${i}`} whileHover={{ scale: 1.05, y: -3 }} onClick={() => playTrack(track, dealGrid)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer', minWidth: 0 }}>
                            <div style={{ position: 'relative', width: '100%', paddingTop: '100%', borderRadius: 10, overflow: 'hidden', background: 'linear-gradient(135deg,rgba(29, 185, 84,0.15),#000)' }}>
                              {coverImg && <img src={coverImg} alt="" onError={e => (e.target as HTMLImageElement).style.display = 'none'} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
                              <div style={{ position: 'absolute', top: 3, left: 3, background: '#ff007f', color: '#fff', fontSize: isMobile ? 7 : 8, fontWeight: 900, padding: '1px 4px', borderRadius: 4 }}>{offerBadges[i]}</div>
                            </div>
                            <div style={{ textAlign: 'center', width: '100%' }}>
                              <div style={{ color: GREEN, fontSize: isMobile ? 11 : 13, fontWeight: 950 }}>FREE</div>
                              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: isMobile ? 8 : 9, textDecoration: 'line-through' }} dangerouslySetInnerHTML={{ __html: ogPrices[i] }} />
                              <div style={{ color: '#fff', fontSize: isMobile ? 9 : 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>{track.title}</div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            }

            // ── 9. PROMO RED BLOCK (Blinkit Meat Mania style) ──
            if (rawLayout === 'promo_red_block') {
              const promoTracks = tracks.slice(0, 3);
              while (promoTracks.length < 3) promoTracks.push(mockTracks[promoTracks.length % mockTracks.length]);
              const promoNames = ['Bass Drop', 'Weekend Remix', 'Night Anthem'];
              const promoSubs = ['Heavy Bass Tracks', 'Top DJ Remixes', 'Late Night Vibes'];
              const promoEmojis = ['🔊', '🎛️', '🌙'];
              const promoAccents = ['#ef4444', '#f59e0b', '#10b981'];
              return (
                <div key={sectionId} style={{ marginBottom: 32 }}>
                  <div style={{ borderRadius: 20, background: 'linear-gradient(130deg,#7f0000 0%,#3d0000 40%,#1a0000 100%)', border: '1.5px solid rgba(239,68,68,0.4)', padding: isMobile ? '16px 12px' : '22px 20px', position: 'relative', overflow: 'hidden', boxShadow: '0 12px 40px rgba(239,68,68,0.2)' }}>
                    <div style={{ position: 'absolute', top: -50, left: -50, width: 160, height: 160, borderRadius: '50%', background: 'rgba(239,68,68,0.2)', filter: 'blur(50px)', pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', bottom: -30, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(239,68,68,0.15)', filter: 'blur(40px)', pointerEvents: 'none' }} />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, position: 'relative', zIndex: 1 }}>
                      <div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 20, padding: '4px 12px', marginBottom: 8 }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444' }} />
                          <span style={{ color: '#ef4444', fontSize: isMobile ? 9 : 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em' }}>HOT RIGHT NOW</span>
                        </div>
                        <h3 style={{ margin: 0, color: '#fff', fontSize: isMobile ? 20 : 26, fontWeight: 950, fontFamily: 'Outfit,sans-serif', lineHeight: 1.1 }}>{config.title || 'Music Mania'}</h3>
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: isMobile ? 11 : 13, margin: '6px 0 0 0' }}>Up to 100% OFF Premium Tracks</p>
                      </div>
                      <div style={{ textAlign: 'center', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 14px' }}>
                        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase' }}>Today Only</div>
                        <div style={{ color: '#fff', fontSize: isMobile ? 20 : 26, fontWeight: 950, fontFamily: 'monospace' }}>50%</div>
                        <div style={{ color: '#ef4444', fontSize: 9, fontWeight: 900 }}>OFF</div>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: isMobile ? 8 : 12, position: 'relative', zIndex: 1 }}>
                      {promoTracks.map((track, i) => {
                        const acc = promoAccents[i];
                        const coverImg = track.coverImage || '';
                        return (
                          <motion.div key={`${track.id}-promo-${i}`} whileHover={{ scale: 1.04, y: -3 }} onClick={() => playTrack(track, promoTracks)} style={{ background: 'rgba(0,0,0,0.5)', border: `1px solid ${acc}30`, borderRadius: 14, padding: isMobile ? 10 : 14, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', cursor: 'pointer', backdropFilter: 'blur(8px)' }}>
                            <div style={{ width: isMobile ? 44 : 56, height: isMobile ? 44 : 56, borderRadius: 12, overflow: 'hidden', marginBottom: 8, border: `2px solid ${acc}50`, background: `linear-gradient(135deg,${acc}30,#000)`, boxShadow: `0 0 16px ${acc}30` }}>
                              {coverImg ? <img src={coverImg} alt="" onError={e => (e.target as HTMLImageElement).style.display = 'none'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{promoEmojis[i]}</div>}
                            </div>
                            <div style={{ color: '#fff', fontSize: isMobile ? 11 : 13, fontWeight: 900, fontFamily: 'Outfit,sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>{promoNames[i]}</div>
                            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: isMobile ? 9 : 10, marginTop: 2 }}>{promoSubs[i]}</div>
                            <div style={{ marginTop: 8, color: acc, fontSize: isMobile ? 10 : 12, fontWeight: 900, background: `${acc}15`, border: `1px solid ${acc}30`, borderRadius: 8, padding: '2px 10px' }}>Claim Free</div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            }

            // ── 10. FRESH PICKS CIRCLES (Zepto produce circles) ──
            if (rawLayout === 'fresh_picks_circles') {
              const freshItems = [
                { label: 'Trending', emoji: '🔥', color: '#ef4444', shine: 'rgba(239,68,68,0.3)' },
                { label: 'Chill', emoji: '❄️', color: '#10b981', shine: 'rgba(16, 185, 129,0.3)' },
                { label: 'Romantic', emoji: '💕', color: '#34d399', shine: 'rgba(52, 211, 153,0.3)' },
                { label: 'Workout', emoji: '💪', color: '#f59e0b', shine: 'rgba(245,158,11,0.3)' },
                { label: 'Party', emoji: '🎉', color: '#a855f7', shine: 'rgba(168,85,247,0.3)' },
                { label: 'Focus', emoji: '🎯', color: '#10b981', shine: 'rgba(16,185,129,0.3)' },
                { label: 'New', emoji: '✨', color: GREEN, shine: 'rgba(29, 185, 84,0.3)' },
                { label: 'Top 50', emoji: '🏆', color: '#ffd700', shine: 'rgba(255,215,0,0.3)' },
              ];
              return (
                <div key={sectionId} style={{ marginBottom: 32 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <h3 style={{ margin: 0, color: '#fff', fontSize: isMobile ? 17 : 21, fontWeight: 950, fontFamily: 'Outfit,sans-serif', letterSpacing: '-0.01em' }}>{config.title || 'Fresh Picks For You'}</h3>
                    <span style={{ color: GREEN, fontSize: isMobile ? 11 : 13, fontWeight: 800, cursor: 'pointer' }}>See all</span>
                  </div>
                  <div style={{ display: 'flex', gap: isMobile ? 10 : 22, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 8 }} className="no-scrollbar">
                    {freshItems.map((item, i) => {
                      const t = tracks[i % Math.max(tracks.length, 1)] || mockTracks[i % mockTracks.length];
                      const coverImg = t.coverImage || '';
                      return (
                        <motion.div key={item.label} whileHover={{ scale: 1.08, y: -5 }} onClick={() => { playTrack(t, tracks); toast.success(`Playing ${item.label}!`); }} style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer', marginRight: isMobile ? 0 : undefined }}>
                          <div style={{ width: isMobile ? 72 : 90, height: isMobile ? 72 : 90, borderRadius: '50%', background: `radial-gradient(circle at 35% 30%, ${item.shine}, ${item.color}20 60%, rgba(0,0,0,0.6) 100%)`, border: `2.5px solid ${item.color}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', boxShadow: `0 8px 20px rgba(0,0,0,0.4), 0 0 0 1px ${item.color}20` }}>
                            {coverImg && <img src={coverImg} alt="" onError={e => (e.target as HTMLImageElement).style.display = 'none'} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.3, borderRadius: '50%' }} />}
                            <div style={{ position: 'absolute', top: 5, left: 10, width: isMobile ? 22 : 28, height: isMobile ? 10 : 13, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', transform: 'rotate(-20deg)', filter: 'blur(2px)' }} />
                            <span style={{ fontSize: isMobile ? 26 : 32, position: 'relative', zIndex: 1 }}>{item.emoji}</span>
                          </div>
                          <span style={{ color: '#fff', fontSize: isMobile ? 11 : 12.5, fontWeight: 800, textAlign: 'center', letterSpacing: '-0.01em' }}>{item.label}</span>
                        </motion.div>
                      );
                    })}
                  </div>
                  <div style={{ marginTop: 16, background: 'linear-gradient(90deg,#062412 0%,#1db954 100%)', borderRadius: 12, padding: isMobile ? '10px 16px' : '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px dashed rgba(29, 185, 84,0.5)', boxShadow: '0 4px 20px rgba(29, 185, 84,0.15)' }}>
                    <span style={{ color: '#fff', fontSize: isMobile ? 11 : 13, fontWeight: 800, fontFamily: 'Outfit,sans-serif' }}>&#127925; Get 3 Months Premium FREE with any plan upgrade! T&amp;C Apply</span>
                    <button style={{ background: '#fff', color: '#000', border: 'none', borderRadius: 20, padding: isMobile ? '5px 12px' : '7px 16px', fontSize: isMobile ? 10 : 12, fontWeight: 900, cursor: 'pointer', flexShrink: 0, boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>Upgrade</button>
                  </div>
                </div>
              );
            }

            return renderSectionTracks(tracks, config);

          };

          // Zepto-style self-headed layouts render their own section title internally.
          // Pass empty strings to the outer <Section> wrapper to avoid double headers.
          const SELF_HEADED_LAYOUTS = [
            'grid_deals', 'music_summer_store', 'music_hubs', 'new_launches_slider',
            'brand_artist_collabs', 'mood_mania_grid', 'deals_pricing_slider',
            'hero_auto_slider', 'category_quick_tiles', 'flash_deals_countdown',
            'new_launches_spotlight', 'featured_brands_row', 'top_chart_billboard',
            'artist_follow_cards', 'free_deals_grid', 'promo_red_block', 'fresh_picks_circles'
          ];
          const isSelfHeaded = SELF_HEADED_LAYOUTS.includes(config.layout || '') || config.type === 'playlist_showcase' || config.layout === 'playlist_showcase';

          return (
            <motion.div
              key={sectionId}
              initial={animationType !== 'none' && animationType !== 'pulse' && animationType !== 'glow' ? { opacity: 0 } : false}
              animate={animationType !== 'none' ? (animationType as any) : undefined}
              variants={variants}
              style={containerStyle}
            >
              {backdrop}
              <div style={{ position: 'relative', zIndex: 1 }}>
                <Section
                  title={isSelfHeaded ? '' : config.title}
                  subtitle={isSelfHeaded ? '' : subtitleText}
                  link={linkPath || undefined}
                  linkText={linkText}
                  style={{ marginBottom: 0 }}
                >
                  {renderLayout()}
                </Section>
              </div>
            </motion.div>
          );
        }
        return null;
    }
  };

  const DEFAULT_LAYOUT_ORDER = [
    "quick_access",
    "liked_songs",
    "promotions_hero",
    "made_for_you",
    "featured_artist",
    "new_music",
    "live_events",
    "trending_now",
    "your_taste",
    "recently_played",
    "mood_playlists",
    "daily_mixes"
  ];

  const layoutToRender = homeLayoutOrder.length > 0 ? homeLayoutOrder : DEFAULT_LAYOUT_ORDER;

  const pageBg = activeTheme ? activeTheme.background : '#0a0a0a';
  const headerGradient = activeTheme ? activeTheme.gradient : 'linear-gradient(180deg, rgba(29, 185, 84,0.08) 0%, rgba(10,10,10,0) 100%)';

  if (!mounted) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #1a1a1a', borderTopColor: GREEN, animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <div className="homepage-themed" style={{ minHeight: '100%', paddingBottom: 32, background: pageBg, transition: 'background 0.5s ease' }}>
      
      {/* Dynamic Theme Injector */}
      <style>{`
        :root {
          --theme-primary: ${activeTheme?.primary || '#1db954'};
          --theme-primary-glow: ${activeTheme?.primaryGlow || 'rgba(29, 185, 84,0.15)'};
          --theme-bg: ${activeTheme?.background || '#0a0a0a'};
          --theme-card: ${activeTheme?.card || '#181818'};
          --theme-surface: ${activeTheme?.surface || '#111111'};
          --theme-text: ${activeTheme?.text || '#ffffff'};
          --theme-text-muted: ${activeTheme?.textMuted || '#737373'};
          --theme-font: ${activeTheme?.font || 'Inter, sans-serif'};
        }
        
        .homepage-themed {
          font-family: var(--theme-font), sans-serif !important;
          background-color: var(--theme-bg) !important;
          color: var(--theme-text) !important;
        }

        .homepage-themed h1, 
        .homepage-themed h2, 
        .homepage-themed h3 {
          color: var(--theme-text) !important;
        }
      `}</style>

      {/* ── Hero Gradient header with TopBar ── */}
      <div style={{ position: 'sticky', top: isMobile ? 'calc(-1 * env(safe-area-inset-top, 24px))' : 0, zIndex: 50, background: isMobile ? '#0a0a0a' : headerGradient, paddingTop: isMobile ? 'calc(env(safe-area-inset-top, 24px) + 12px)' : '20px', paddingRight: isMobile ? '16px' : '24px', paddingBottom: isMobile ? '12px' : '24px', paddingLeft: isMobile ? '16px' : '24px' }}>
        {isMobile ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            {/* User Profile Avatar */}
            <div
              onClick={() => setMobileDrawerOpen(true)}
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: '#1db954', // Green circle like screenshot
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: 14,
                fontFamily: 'Outfit, sans-serif',
                cursor: 'pointer'
              }}
            >
              {user?.name ? user.name[0].toUpperCase() : 'M'}
            </div>
            
            {/* Category Chips */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', position: 'relative' }}>
              {['All', 'Music', 'Podcasts'].map((chip) => {
                const active = chip === 'All';
                return (
                  <button
                    key={chip}
                    style={{
                      background: active ? '#1db954' : 'rgba(255,255,255,0.1)',
                      color: active ? '#000' : '#fff',
                      border: 'none',
                      borderRadius: 20,
                      padding: '6px 16px',
                      fontSize: 12.5,
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontFamily: 'Inter, sans-serif'
                    }}
                  >
                    {chip}
                  </button>
                );
              })}

              {/* Notification logo next to Podcasts */}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <button
                  onClick={() => setShowMobileNotificationDropdown(prev => !prev)}
                  style={{
                    background: showMobileNotificationDropdown ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '50%',
                    width: 32,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'background 0.2s'
                  }}
                >
                  <Bell size={15} />
                  {approvedUploadedTracks.length > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: 1,
                      right: 1,
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: '#ef4444',
                      border: '1px solid #121212',
                      boxShadow: '0 0 8px #ef4444'
                    }} />
                  )}
                </button>

                {showMobileNotificationDropdown && (
                  <>
                    <div
                      onClick={() => setShowMobileNotificationDropdown(false)}
                      style={{ position: 'fixed', inset: 0, zIndex: 999 }}
                    />
                    <div style={{
                      position: 'absolute',
                      top: 40,
                      right: 0,
                      zIndex: 1000,
                      width: 290,
                      background: 'rgba(20, 20, 20, 0.95)',
                      backdropFilter: 'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: 14,
                      padding: 16,
                      boxShadow: '0 12px 36px rgba(0,0,0,0.6)',
                      color: '#fff',
                      animation: 'fadeIn 0.18s ease-out',
                      transformOrigin: 'top right'
                    }}>
                      {/* Triangle Arrow */}
                      <div style={{
                        position: 'absolute',
                        top: -6,
                        right: 12,
                        width: 10,
                        height: 10,
                        background: 'rgba(20, 20, 20, 0.95)',
                        borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
                        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                        transform: 'rotate(45deg)'
                      }} />

                      {approvedUploadedTracks.length > 0 ? (
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <span style={{ fontSize: 16 }}>🎵</span>
                            <span style={{ fontWeight: 800, fontSize: 13, color: '#1db954', letterSpacing: '0.02em' }}>New Artist Tracks</span>
                          </div>
                          <p style={{ fontSize: 12, margin: 0, color: '#e5e7eb', lineHeight: '1.5', fontFamily: 'Inter, sans-serif' }}>
                            New artist tracks added:{' '}
                            <span style={{ color: '#fff', fontWeight: 600 }}>
                              {approvedUploadedTracks.slice(0, 3).map(t => t.title).join(', ')}
                              {approvedUploadedTracks.length > 3 ? `...and ${approvedUploadedTracks.length - 3} more` : ''}
                            </span>{' '}
                            — just uploaded by artists
                          </p>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '8px 0' }}>
                          <span style={{ fontSize: 18, color: '#737373' }}>🔕</span>
                          <p style={{ fontSize: 12, margin: 0, color: '#a3a3a3', fontWeight: 500 }}>
                            No new notifications
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          <TopBar transparent showSearch />
        )}
      </div>

      <div style={{ padding: isMobile ? '0 16px' : '0 24px' }}>
        {/* Offline Banner Card */}
        {!isOnline && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1.5px dashed rgba(239, 68, 68, 0.3)',
            borderRadius: 16,
            padding: '20px',
            marginBottom: 24,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: 12,
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
          }}>
            <span style={{ fontSize: 32 }}>📶</span>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#ef4444' }}>You're Currently Offline</h3>
              <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#a3a3a3', lineHeight: '1.4' }}>
                Connect to the internet to browse and stream millions of songs.
              </p>
            </div>
            <Link
              href="/downloads"
              style={{
                background: '#1db954',
                color: '#000',
                textDecoration: 'none',
                borderRadius: 24,
                padding: '10px 20px',
                fontSize: 13,
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginTop: 4,
                boxShadow: '0 4px 12px rgba(29, 185, 84, 0.2)',
                transition: 'transform 0.2s'
              }}
            >
              Go to Downloads to enjoy offline music 🎵
            </Link>
          </div>
        )}

        {/* ── Uploaded Tracks Alert ── */}
        {!isMobile && approvedUploadedTracks.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            style={{ marginBottom: 24, padding: '14px 20px', borderRadius: 14, background: 'rgba(29, 185, 84,0.08)', border: '1px solid rgba(29, 185, 84,0.2)', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <Star size={16} color={GREEN} style={{ marginTop: 2, flexShrink: 0 }} />
            <p style={{ color: '#fff', fontSize: 13, fontWeight: 600, lineHeight: '1.4' }}>
              🎵 New artist tracks added! <span style={{ color: GREEN }}>{approvedUploadedTracks.slice(0, 3).map(t => t.title).join(', ')}{approvedUploadedTracks.length > 3 ? `...and ${approvedUploadedTracks.length - 3} more` : ''}</span> — just uploaded by artists
            </p>
          </motion.div>
        )}

        {/* Dynamic sections rendered in sequenced order */}
        {layoutToRender.map(sectionId => renderHomeSection(sectionId))}
      </div>

      {/* Floating Cart Bar (Zepto Style) */}
      <AnimatePresence>
        {cartTracks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 100, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 100, x: '-50%' }}
            style={{
              position: 'fixed',
              bottom: 80, // Sit above the global audio player
              left: '50%',
              zIndex: 9999,
              width: '90%',
              maxWidth: 480,
              background: '#121212',
              border: '1.5px solid rgba(29, 185, 84, 0.4)',
              boxShadow: '0 8px 32px rgba(29, 185, 84, 0.25)',
              borderRadius: 16,
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                background: 'rgba(29, 185, 84, 0.15)',
                color: '#1db954',
                padding: '6px 10px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 900,
                fontFamily: 'Outfit, sans-serif'
              }}>
                {cartTracks.length} ITEM{cartTracks.length > 1 ? 'S' : ''}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ color: '#fff', fontSize: 13, fontWeight: 800, fontFamily: 'Outfit, sans-serif' }}>
                  Unlock extra ₹50 OFF!
                </span>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>
                  Added to your Beato cart
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                onClick={() => {
                  setCartTracks([]);
                  toast.success('Successfully claimed premium vibes! Enjoy your tracks.', {
                    icon: '🎉',
                    style: {
                      background: '#0a0a0a',
                      color: '#fff',
                      border: '1px solid rgba(29, 185, 84, 0.5)'
                    }
                  });
                }}
                style={{
                  background: '#1db954', // Green cart button like screenshot
                  color: '#fff',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 900,
                  fontFamily: 'Outfit, sans-serif',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(29,185,84,0.3)',
                  transition: 'transform 0.15s'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                Claim Deal ➔
              </button>
              <button
                onClick={() => setCartTracks([])}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: 'none',
                  color: 'rgba(255,255,255,0.4)',
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: 11
                }}
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
