'use client';

import { useState, useMemo, useEffect } from 'react';
import { useDownloadStore } from '@/store/downloadStore';
import { usePlayerStore } from '@/store/playerStore';
import { useAuthStore } from '@/store/authStore';
import { 
  Play, 
  Pause, 
  Trash2, 
  Download, 
  Music, 
  Search, 
  X, 
  Clock, 
  Sparkles,
  Volume2,
  Camera
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDuration } from '@/lib/mockData';
import TopBar from '@/components/layout/TopBar';
import toast from 'react-hot-toast';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

export default function DownloadsPage() {
  const router = useRouter();
  const isOnline = useNetworkStatus();
  const { downloadedTracks, removeDownloadedTrack } = useDownloadStore();
  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayerStore();
  const { user, setMobileDrawerOpen } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [hoveredTrackId, setHoveredTrackId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [downloadOverCellular, setDownloadOverCellular] = useState(false);
  const [downloadQuality, setDownloadQuality] = useState<'standard' | 'high' | 'very_high'>('very_high');

  const handleRemoveAllDownloads = async () => {
    if (confirm("Are you sure you want to delete all offline downloads? This cannot be undone.")) {
      const trackIds = downloadedTracks.map(t => t.id);
      for (const id of trackIds) {
        await removeDownloadedTrack(id);
      }
      toast.success("All offline downloads removed!");
    }
  };

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const el = document.querySelector('.app-main');
    if (!el) return;
    const handler = () => {
      setScrolled(el.scrollTop > 5);
    };
    el.addEventListener('scroll', handler, { passive: true });
    handler(); // initial check
    return () => el.removeEventListener('scroll', handler);
  }, []);

  const handlePlayAll = () => {
    if (downloadedTracks.length > 0) {
      playTrack(downloadedTracks[0], downloadedTracks);
    }
  };

  // Extract unique genres dynamically for filtering
  const genres = useMemo(() => {
    const list = new Set<string>();
    downloadedTracks.forEach(t => {
      if (t.genre) list.add(t.genre);
    });
    return ['All', ...Array.from(list)];
  }, [downloadedTracks]);

  // Filter tracks by search query and selected genre
  const filteredTracks = useMemo(() => {
    return downloadedTracks.filter(track => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        track.title.toLowerCase().includes(query) || 
        track.artistName.toLowerCase().includes(query) ||
        (track.albumName && track.albumName.toLowerCase().includes(query));
      
      const matchesGenre = selectedGenre === 'All' || track.genre === selectedGenre;
      
      return matchesSearch && matchesGenre;
    });
  }, [downloadedTracks, searchQuery, selectedGenre]);

  const handleTrackClick = (track: any) => {
    if (currentTrack?.id === track.id) {
      togglePlay();
    } else {
      playTrack(track, downloadedTracks);
    }
  };

  // Stagger animation variants for track rows
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.04
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        type: 'spring' as const, 
        stiffness: 260, 
        damping: 22 
      } 
    }
  };

  const beatoSizeMB = downloadedTracks.length * 8.4;
  const freeSpaceGB = 42.4;
  const otherFilesGB = 18.2;
  const totalSpaceGB = 64;
  const beatoSizeGB = beatoSizeMB / 1024;
  
  const beatoPercent = (beatoSizeGB / totalSpaceGB) * 100;
  const otherPercent = (otherFilesGB / totalSpaceGB) * 100;
  const freePercent = (freeSpaceGB / totalSpaceGB) * 100;

  return (
    <div className="library-themed-container" style={{ 
      minHeight: '100%', 
      background: 'var(--color-ss-bg, #fbf9f5)', 
      padding: isMobile ? '0 16px 32px' : '0px 0px 100px',
      position: 'relative'
    }}>
      {/* Universal TopBar component - Only rendered on Desktop */}
      {!isMobile && <TopBar />}

      {/* Dynamic Keyframes Injection */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes visualizer1 {
          0%, 100% { height: 30%; }
          50% { height: 90%; }
        }
        @keyframes visualizer2 {
          0%, 100% { height: 80%; }
          50% { height: 35%; }
        }
        @keyframes visualizer3 {
          0%, 100% { height: 50%; }
          50% { height: 95%; }
        }
      ` }} />

      {/* Sticky Top Bar on Mobile */}
      {isMobile && downloadedTracks.length > 0 && (
        <div style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: scrolled ? 'rgba(251, 249, 245, 0.85)' : 'var(--color-ss-bg, #fbf9f5)',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
          borderBottom: scrolled ? '1px solid var(--color-ss-border, rgba(43, 34, 26, 0.08))' : '1px solid transparent',
          paddingTop: 'calc(var(--sat, 0px) + 20px)',
          paddingBottom: '16px',
          margin: '0 -16px 16px -16px',
          paddingLeft: '16px',
          paddingRight: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          transition: 'background-color 0.25s, border-color 0.25s, backdrop-filter 0.25s',
        }}>
          {/* 1. Header Row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* User Profile Avatar */}
            <div
              onClick={() => setMobileDrawerOpen(true)}
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'var(--color-ss-primary, #b08850)',
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
            <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 24, fontWeight: 900, color: 'var(--color-ss-text-primary, #221a15)', margin: 0 }}>
              Downloads
            </h1>
            <Camera size={22} color="var(--color-ss-text-primary, #221a15)" style={{ cursor: 'pointer', marginLeft: 'auto' }} />
          </div>

          {/* 2. Search Bar Input (Mobile View) */}
          <div style={{ position: 'relative', width: '100%' }}>
            <Search 
              size={18} 
              color="#525252" 
              style={{ 
                position: 'absolute', 
                left: 16, 
                top: '50%', 
                transform: 'translateY(-50%)',
                pointerEvents: 'none'
              }} 
            />
            <input
              type="text"
              placeholder="What do you want to listen to offline?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                background: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '12px 40px 12px 44px',
                fontSize: '14px',
                color: '#000',
                outline: 'none',
                fontFamily: 'inherit',
                transition: 'all 0.2s ease',
                boxSizing: 'border-box'
              }}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: 16,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#000',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px'
                }}
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* 3. Dynamic Filter Pills Row (Mobile View) */}
          <div style={{ 
            display: 'flex', 
            gap: '8px', 
            overflowX: 'auto', 
            scrollbarWidth: 'none',
            paddingBottom: '2px',
            flexWrap: 'nowrap'
          }}>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handlePlayAll}
              style={{
                background: '#b08850',
                color: '#000',
                border: 'none',
                borderRadius: '100px',
                padding: '7px 18px',
                fontSize: '13px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 12px rgba(176, 136, 80, 0.2)'
              }}
            >
              <Play size={12} fill="black" /> Play All
            </motion.button>

            {genres.map(genre => (
              <motion.button
                key={genre}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setSelectedGenre(genre)}
                style={{
                  background: selectedGenre === genre ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)',
                  color: '#fff',
                  border: '1px solid ' + (selectedGenre === genre ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)'),
                  borderRadius: '100px',
                  padding: '7px 18px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                }}
              >
                {genre}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div style={{
        padding: isMobile ? '0' : '30px 24px 0', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: isMobile ? '16px' : '24px',
        position: 'relative',
        zIndex: 1
      }}>
        
        {/* Immersive Top Gradient Glows - Desktop only */}
        {!isMobile && (
          <>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '240px',
              background: 'linear-gradient(180deg, rgba(176, 136, 80, 0.14) 0%, rgba(176, 136, 80, 0.02) 60%, rgba(0, 0, 0, 0) 100%)',
              pointerEvents: 'none',
              zIndex: 0,
            }} />
            <div style={{
              position: 'absolute',
              top: '-120px',
              left: '10%',
              width: '350px',
              height: '350px',
              background: 'radial-gradient(circle, rgba(176, 136, 80, 0.18) 0%, rgba(176, 136, 80, 0.03) 60%, transparent 100%)',
              filter: 'blur(80px)',
              pointerEvents: 'none',
              zIndex: 0,
            }} />
          </>
        )}

        {/* Normal Flow Header */}
        {(!isMobile || downloadedTracks.length === 0) && (
          <>
            {isMobile ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4, paddingTop: 'calc(var(--sat, 0px) + 20px)' }}>
                {/* User Profile Avatar */}
                <div
                  onClick={() => setMobileDrawerOpen(true)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: '#b08850',
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
                <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 24, fontWeight: 900, color: '#fff', margin: 0 }}>
                  Downloads
                </h1>
                <Camera size={22} color="#fff" style={{ cursor: 'pointer', marginLeft: 'auto' }} />
              </div>
            ) : (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                gap: '16px', 
                position: 'relative', 
                zIndex: 2,
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                paddingBottom: '16px',
                marginTop: '4px'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 800, fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em', color: '#fff' }}>
                      Offline Downloads
                    </h2>
                    <span style={{ 
                      background: 'rgba(176, 136, 80, 0.15)', 
                      color: '#b08850', 
                      fontSize: '11px', 
                      fontWeight: 700, 
                      padding: '2px 8px', 
                      borderRadius: '100px',
                      border: '1px solid rgba(176, 136, 80, 0.2)'
                    }}>
                      {downloadedTracks.length} tracks
                    </span>
                  </div>
                  <p style={{ margin: '4px 0 0 0', color: 'rgba(255, 255, 255, 0.45)', fontSize: '13px', fontWeight: 500 }}>
                    High-fidelity audio saved locally for offline listening.
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {/* Empty State vs Loaded Content */}
        {downloadedTracks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '24px',
              textAlign: 'center',
              padding: '80px 20px',
              background: 'rgba(255, 255, 255, 0.02)',
              backdropFilter: 'blur(16px)',
              borderRadius: '24px',
              border: '1px solid rgba(176, 136, 80, 0.2)',
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5), inset 0 0 20px rgba(176, 136, 80, 0.05)',
              marginTop: '10px',
              position: 'relative',
              zIndex: 2
            }}
          >
            <div
              style={{
                width: '70px',
                height: '70px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(176, 136, 80, 0.2) 0%, rgba(176, 136, 80, 0.05) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#b08850',
                boxShadow: '0 8px 24px rgba(176, 136, 80, 0.15)',
                border: '1px solid rgba(176, 136, 80, 0.3)'
              }}
            >
              <Download size={32} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800, fontFamily: 'Outfit, sans-serif', color: 'var(--color-ss-text-primary, #221a15)' }}>No downloaded music</h3>
              <p style={{ margin: '8px 0 0 0', color: 'var(--color-ss-text-muted, #87786c)', maxWidth: '340px', fontSize: '13.5px', lineHeight: 1.6 }}>
                Add songs to your library offline by tapping the download icon on any song page or playback drawer.
              </p>
            </div>
            {isOnline ? (
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => router.push('/home')}
                style={{
                  background: '#b08850',
                  color: '#000',
                  border: 'none',
                  borderRadius: '100px',
                  padding: '12px 28px',
                  fontSize: '13.5px',
                  fontWeight: 900,
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
              >
                Browse Premium Tracks
              </motion.button>
            ) : (
              <p style={{ 
                margin: 0, 
                color: '#b08850', 
                fontSize: '13px', 
                fontWeight: 700,
                background: 'rgba(176, 136, 80, 0.1)',
                padding: '8px 18px',
                borderRadius: '20px',
                border: '1px solid rgba(176, 136, 80, 0.2)'
              }}>
                📶 Connect to the internet to download tracks
              </p>
            )}
          </motion.div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '20px', position: 'relative', zIndex: 2 }}>
            
            {/* Desktop Only: Search Bar & Filter Pills (Rendered in sticky top bar on mobile) */}
            {!isMobile && (
              <>
                {/* 2. Search Bar Input */}
                <div style={{ position: 'relative', width: '100%' }}>
                  <Search 
                    size={18} 
                    color="#737373" 
                    style={{ 
                      position: 'absolute', 
                      left: 16, 
                      top: '50%', 
                      transform: 'translateY(-50%)',
                      pointerEvents: 'none'
                    }} 
                  />
                  <input
                    type="text"
                    placeholder="Filter downloads..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: 100,
                      padding: '10px 16px 10px 42px',
                      fontSize: '14px',
                      color: '#fff',
                      outline: 'none',
                      fontFamily: 'inherit',
                      transition: 'all 0.2s ease',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(176, 136, 80, 0.4)';
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                    }}
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      style={{
                        position: 'absolute',
                        right: 16,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: 'rgba(255,255,255,0.4)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '4px'
                      }}
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>

                {/* 3. Dynamic Filter Pills Row */}
                <div style={{ 
                  display: 'flex', 
                  gap: '8px', 
                  overflowX: 'auto', 
                  scrollbarWidth: 'none',
                  paddingBottom: '2px',
                  flexWrap: 'nowrap'
                }}>
                  {/* Play All Button */}
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handlePlayAll}
                    style={{
                      background: '#b08850',
                      color: '#000',
                      border: 'none',
                      borderRadius: '100px',
                      padding: '7px 18px',
                      fontSize: '13px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      whiteSpace: 'nowrap',
                      boxShadow: '0 4px 12px rgba(176, 136, 80, 0.2)'
                    }}
                  >
                    <Play size={12} fill="black" /> Play All
                  </motion.button>

                  {genres.map(genre => (
                    <motion.button
                      key={genre}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setSelectedGenre(genre)}
                      style={{
                        background: selectedGenre === genre ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)',
                        color: '#fff',
                        border: '1px solid ' + (selectedGenre === genre ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)'),
                        borderRadius: '100px',
                        padding: '7px 18px',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {genre}
                    </motion.button>
                  ))}
                </div>
              </>
            )}

            {/* Table Headers - Desktop only */}
            {!isMobile && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0 20px 8px 20px',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.4)',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginTop: '8px'
              }}>
                <div style={{ width: '30px', textAlign: 'center' }}>#</div>
                <div style={{ flex: 2, paddingLeft: '16px' }}>Title</div>
                <div style={{ flex: 1, display: 'block' }} className="hidden md:block">Album</div>
                <div style={{ width: '70px', display: 'flex', justifyContent: 'flex-end', paddingRight: '24px' }}>
                  <Clock size={14} />
                </div>
                <div style={{ width: '40px' }}></div>
              </div>
            )}

            {/* Premium Track List Grid */}
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="show"
              style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: isMobile ? '4px' : '0' }}
            >
              {filteredTracks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.4)' }}>
                  <Music size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>No tracks match search filters.</p>
                </div>
              ) : (
                filteredTracks.map((track, idx) => {
                  const isCurrent = currentTrack?.id === track.id;
                  const isHovered = hoveredTrackId === track.id;

                  return (
                    <motion.div
                      key={track.id}
                      variants={itemVariants}
                      whileTap={{ scale: 0.993 }}
                      onMouseEnter={() => setHoveredTrackId(track.id)}
                      onMouseLeave={() => setHoveredTrackId(null)}
                      onClick={() => handleTrackClick(track)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: isMobile ? '10px 14px' : '10px 20px',
                        background: isCurrent ? 'rgba(176, 136, 80, 0.05)' : 'rgba(255, 255, 255, 0.01)',
                        border: '1px solid ' + (isCurrent ? 'rgba(176, 136, 80, 0.2)' : 'rgba(255,255,255,0.03)'),
                        borderRadius: '12px',
                        cursor: 'pointer',
                        gap: '14px',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: isCurrent ? '0 4px 15px rgba(176, 136, 80, 0.05)' : 'none',
                        position: 'relative'
                      }}
                    >
                      {/* Left Side Glow for active song */}
                      {isCurrent && (
                        <div style={{
                          position: 'absolute',
                          left: 0,
                          top: '20%',
                          bottom: '20%',
                          width: '3px',
                          background: '#b08850',
                          borderRadius: '0 4px 4px 0',
                          boxShadow: '0 0 10px #b08850'
                        }} />
                      )}

                      {/* Index / Play / Pause Controls */}
                      <div style={{ 
                        width: '24px', 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center',
                        color: isCurrent ? '#b08850' : 'rgba(255,255,255,0.4)', 
                        fontSize: '14px', 
                        fontWeight: 700 
                      }}>
                        {isHovered ? (
                          isCurrent && isPlaying ? (
                            <Pause size={14} fill="#b08850" color="#b08850" />
                          ) : (
                            <Play size={14} fill={isCurrent ? '#b08850' : 'white'} color={isCurrent ? '#b08850' : 'white'} />
                          )
                        ) : (
                          isCurrent && isPlaying ? (
                            /* Premium Mini Visualizer Bars */
                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '14px', width: '12px' }}>
                              <div className="visualizer-bar" style={{ width: '2px', background: '#b08850', height: '40%', animation: 'visualizer1 0.8s ease-in-out infinite' }} />
                              <div className="visualizer-bar" style={{ width: '2px', background: '#b08850', height: '80%', animation: 'visualizer2 0.6s ease-in-out infinite' }} />
                              <div className="visualizer-bar" style={{ width: '2px', background: '#b08850', height: '60%', animation: 'visualizer3 0.7s ease-in-out infinite' }} />
                            </div>
                          ) : (
                            isCurrent ? (
                              <Volume2 size={16} color="#b08850" />
                            ) : (
                              idx + 1
                            )
                          ))}
                      </div>

                      {/* Album Cover Art */}
                      <div
                        style={{
                          width: '46px',
                          height: '46px',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          background: '#181818',
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1px solid rgba(255,255,255,0.06)',
                          boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                        }}
                      >
                        {track.coverImage ? (
                          <img src={track.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <Music size={20} color="rgba(255,255,255,0.3)" />
                        )}
                      </div>

                      {/* Song Title & Artist info */}
                      <div style={{ flex: 2, minWidth: 0, paddingLeft: '2px' }}>
                        <p
                          style={{
                            margin: 0,
                            fontSize: '15px',
                            fontWeight: 700,
                            color: isCurrent ? '#b08850' : '#fff',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            letterSpacing: '-0.01em'
                          }}
                        >
                          {track.title}
                        </p>
                        <p
                          style={{
                            margin: '3px 0 0 0',
                            fontSize: '13px',
                            color: isCurrent ? 'rgba(176, 136, 80, 0.7)' : 'rgba(255,255,255,0.5)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontWeight: 500
                          }}
                        >
                          {track.artistName}
                        </p>
                      </div>

                      {/* Album Name */}
                      <div
                        className="hidden md:block"
                        style={{
                          flex: 1,
                          color: 'rgba(255,255,255,0.5)',
                          fontSize: '14px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontWeight: 500
                        }}
                      >
                        {track.albumName || 'Single'}
                      </div>

                      {/* Track Duration */}
                      <div style={{ 
                        width: '60px', 
                        textAlign: 'right', 
                        color: 'rgba(255,255,255,0.5)', 
                        fontSize: '13px', 
                        fontWeight: 600,
                        fontVariantNumeric: 'tabular-nums',
                      }}>
                        {formatDuration(track.duration || 0)}
                      </div>

                      {/* Action buttons (e.g. Delete) */}
                      <div style={{ display: 'flex', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <motion.button
                          whileHover={{ scale: 1.1, backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            if (confirm(`Remove "${track.title}" from offline downloads?`)) {
                              removeDownloadedTrack(track.id);
                            }
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'rgba(255,255,255,0.3)',
                            cursor: 'pointer',
                            padding: '8px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'color 0.2s, background 0.2s',
                          }}
                        >
                          <Trash2 size={16} />
                        </motion.button>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </motion.div>
          </div>
        )}

        {/* Discover something new */}
        {isOnline && (
          <div style={{ 
            marginTop: isMobile ? '24px' : '36px', 
            marginBottom: '20px',
            paddingBottom: '20px'
          }}>
            <h2 style={{ 
              fontFamily: 'Outfit, sans-serif', 
              color: 'var(--color-ss-text-primary, #221a15)', 
              fontSize: isMobile ? '18px' : '22px', 
              fontWeight: 850, 
              marginBottom: '16px'
            }}>
              Discover something new
            </h2>
            <div style={{ 
              display: 'flex', 
              gap: '12px', 
              overflowX: 'auto', 
              paddingBottom: '8px',
              scrollbarWidth: 'none',
              WebkitOverflowScrolling: 'touch'
            }}>
              {[
                { tag: '#tamil dance', image: 'https://images.unsplash.com/photo-1519834785169-98be25ec3f84?w=200&auto=format&fit=crop&q=80' },
                { tag: '#tamil pop', image: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=200&auto=format&fit=crop&q=80' },
                { tag: '#clean groove', image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200&auto=format&fit=crop&q=80' },
                { tag: '#acoustic vibes', image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=200&auto=format&fit=crop&q=80' }
              ].map(item => (
                <motion.div 
                  key={item.tag} 
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }} 
                  onClick={() => router.push('/search?q=' + encodeURIComponent(item.tag.replace('#', '')))}
                  style={{ 
                    width: '110px', 
                    height: '165px', 
                    borderRadius: '12px', 
                    overflow: 'hidden', 
                    position: 'relative', 
                    flexShrink: 0, 
                    cursor: 'pointer', 
                    boxShadow: 'none',
                    border: '1px solid var(--color-ss-border, rgba(43, 34, 26, 0.08))'
                  }}
                >
                  <img src={item.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0) 100%)' }} />
                  <span className="discover-tag" style={{ 
                    position: 'absolute', 
                    bottom: '12px', 
                    left: '10px', 
                    right: '10px', 
                    color: '#fff', 
                    fontSize: '11.5px', 
                    fontWeight: 800, 
                    fontFamily: 'Inter, sans-serif', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis', 
                    whiteSpace: 'nowrap' 
                  }}>
                    {item.tag}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Storage & Preferences Section */}
        <div style={{ 
          marginTop: isMobile ? '24px' : '36px', 
          marginBottom: '40px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <h2 style={{ 
            fontFamily: 'Outfit, sans-serif', 
            color: 'var(--color-ss-text-primary, #221a15)', 
            fontSize: isMobile ? '18px' : '22px', 
            fontWeight: 850, 
            marginBottom: '4px'
          }}>
            Storage & Preferences
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: '16px'
          }}>
            {/* Storage Usage Card */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '16px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              boxShadow: 'none',
              backdropFilter: 'blur(12px)'
            }}>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Storage Space</p>
              
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                  <span style={{ color: '#fff', fontSize: '15px', fontWeight: 700 }}>Local Device Storage</span>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: 500 }}>
                    {((beatoSizeGB + otherFilesGB) / totalSpaceGB * 100).toFixed(0)}% Used of {totalSpaceGB} GB
                  </span>
                </div>
                
                {/* Visual Storage Bar */}
                <div style={{
                  height: '8px',
                  borderRadius: '100px',
                  background: 'rgba(255,255,255,0.1)',
                  display: 'flex',
                  overflow: 'hidden',
                  width: '100%'
                }}>
                  {/* Beato Storage (Green) */}
                  <div style={{
                    width: `${Math.max(beatoPercent, 1.5)}%`,
                    background: '#b08850',
                    height: '100%',
                    transition: 'width 0.3s ease'
                  }} />
                  {/* Other Files (Gray) */}
                  <div style={{
                    width: `${otherPercent}%`,
                    background: 'rgba(255, 255, 255, 0.3)',
                    height: '100%'
                  }} />
                </div>
              </div>
              
              {/* Storage Legend */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12.5px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#b08850' }} />
                    <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>Beato Music</span>
                  </div>
                  <span style={{ color: '#fff', fontWeight: 600 }}>{beatoSizeMB >= 1024 ? `${(beatoSizeMB/1024).toFixed(2)} GB` : `${beatoSizeMB.toFixed(1)} MB`}</span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12.5px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.3)' }} />
                    <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>Other Apps / Files</span>
                  </div>
                  <span style={{ color: '#fff', fontWeight: 600 }}>{otherFilesGB} GB</span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12.5px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.08)' }} />
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>Free Space</span>
                  </div>
                  <span style={{ color: '#fff', fontWeight: 600 }}>{freeSpaceGB.toFixed(1)} GB</span>
                </div>
              </div>
            </div>
            
            {/* Download Preferences Card */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '16px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '16px',
              boxShadow: 'none',
              backdropFilter: 'blur(12px)'
            }}>
              {/* Option 1: Cellular Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ color: '#fff', fontSize: '14.5px', fontWeight: 700, margin: 0 }}>Download over Cellular</p>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11.5px', margin: '2px 0 0 0', lineHeight: 1.3 }}>Use mobile network to download songs offline</p>
                </div>
                
                <div 
                  onClick={() => {
                    setDownloadOverCellular(prev => {
                      const next = !prev;
                      toast.success(next ? "Cellular downloads enabled!" : "Cellular downloads disabled!");
                      return next;
                    });
                  }}
                  style={{
                    width: '42px',
                    height: '24px',
                    borderRadius: '100px',
                    background: downloadOverCellular ? '#b08850' : 'rgba(255, 255, 255, 0.1)',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '2px'
                  }}
                >
                  <motion.div 
                    layout
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: '#fff',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                      x: downloadOverCellular ? '18px' : '0px'
                    }}
                  />
                </div>
              </div>
              
              {/* Option 2: Quality Selector */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ color: '#fff', fontSize: '14.5px', fontWeight: 700, margin: 0 }}>Audio Quality</p>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11.5px', margin: '2px 0 0 0', lineHeight: 1.3 }}>Choose default audio quality for downloads</p>
                </div>
                
                <button
                  onClick={() => {
                    setDownloadQuality(current => {
                      const next = current === 'standard' ? 'high' : current === 'high' ? 'very_high' : 'standard';
                      toast.success(`Download quality set to ${next === 'standard' ? 'Standard' : next === 'high' ? 'High' : 'Very High'}!`);
                      return next;
                    });
                  }}
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '100px',
                    padding: '6px 14px',
                    color: '#b08850',
                    fontSize: '12.5px',
                    fontWeight: 750,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                  }}
                >
                  {downloadQuality === 'standard' ? 'Standard' : downloadQuality === 'high' ? 'High' : 'Very High'}
                </button>
              </div>
              
              {/* Option 3: Remove All Downloads */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                borderTop: '1px solid rgba(255,255,255,0.05)',
                paddingTop: '14px',
                marginTop: '4px'
              }}>
                <div>
                  <p style={{ color: '#fff', fontSize: '14.5px', fontWeight: 700, margin: 0 }}>Remove All Downloads</p>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11.5px', margin: '2px 0 0 0', lineHeight: 1.3 }}>Delete all offline tracks to free up space</p>
                </div>
                
                <button
                  disabled={downloadedTracks.length === 0}
                  onClick={handleRemoveAllDownloads}
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    borderRadius: '100px',
                    padding: '8px 16px',
                    color: downloadedTracks.length === 0 ? 'rgba(255,255,255,0.2)' : '#ef4444',
                    fontSize: '12.5px',
                    fontWeight: 750,
                    cursor: downloadedTracks.length === 0 ? 'default' : 'pointer',
                    transition: 'all 0.2s',
                    opacity: downloadedTracks.length === 0 ? 0.5 : 1
                  }}
                  onMouseEnter={e => {
                    if (downloadedTracks.length > 0) {
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.18)';
                      e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.35)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (downloadedTracks.length > 0) {
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                      e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.2)';
                    }
                  }}
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
