'use client';

import { ReactNode, useEffect, useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import PlayerBar from '@/components/layout/PlayerBar';
import MobileNav from '@/components/layout/MobileNav';
import MobileDrawer from '@/components/layout/MobileDrawer';
import CreateOptionsBottomSheet from '@/components/layout/CreateOptionsBottomSheet';
import QueuePanel from '@/components/layout/QueuePanel';
import LyricsPanel from '@/components/layout/LyricsPanel';
import NowPlayingPanel from '@/components/layout/NowPlayingPanel';
import { useRealtimeStore } from '@/store/realtimeStore';
import { useNotificationStore } from '@/store/notificationStore';
import { usePlayerStore } from '@/store/playerStore';
import { useMusicStore } from '@/store/musicStore';
import { socketManager } from '@/lib/socket';
import { useAuthStore } from '@/store/authStore';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { WifiOff } from 'lucide-react';
import { useIsMobile } from '@/hooks/useIsMobile';
import { getRoomUrl } from '@/lib/api';

import AdBanner from '@/components/layout/AdBanner';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { syncFromServer } = useRealtimeStore();
  const { addNotification } = useNotificationStore();
  const { showQueue, showLyrics, currentTrack, isPlaying, toggleQueue, toggleLyrics, setAdsConfig, adsConfig } = usePlayerStore();
  const { user, token, initializeSession } = useAuthStore();
  const { fetchTracks } = useMusicStore();
  const isOnline = useNetworkStatus();
  const pathname = usePathname();

  const [showNowPlaying, setShowNowPlaying] = useState(false);
  const isMobile = useIsMobile(); // ⚡ shared single resize listener
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [activeRoomName, setActiveRoomName] = useState<string | null>(null);
  const [ads, setAds] = useState<any[]>([]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const checkActiveRoom = () => {
      if (typeof window !== 'undefined') {
        const rId = localStorage.getItem('soundsphere-active-room-id');
        const rName = localStorage.getItem('soundsphere-active-room-name');
        setActiveRoomId(rId);
        setActiveRoomName(rName);
      }
    };

    checkActiveRoom();
    window.addEventListener('storage', checkActiveRoom);
    const interval = setInterval(checkActiveRoom, 2000);

    return () => {
      window.removeEventListener('storage', checkActiveRoom);
      clearInterval(interval);
    };
  }, [pathname]);

  // Automatically show Now Playing panel when a track starts playing
  useEffect(() => {
    if (isPlaying && currentTrack) {
      setShowNowPlaying(true);
    }
  }, [isPlaying, currentTrack?.id]);

  const showRightPanel = (showQueue || showLyrics || (showNowPlaying && !showQueue && !showLyrics)) && !!currentTrack;

  const isFreeUser = !user || user.subscription === 'free';
  const showBottomAd = adsConfig?.placements?.player_bottom !== false;

  const resolveActiveAd = (placementId: string, allowedTypes: string[]) => {
    const adMappings = adsConfig?.adMappings || {};
    const mappedAdId = adMappings[placementId];
    if (mappedAdId) {
      const mappedAd = ads.find(a => a.id === mappedAdId);
      if (mappedAd) return mappedAd;
    }
    return ads.find(ad => allowedTypes.includes(ad.type) && ad.placement === placementId);
  };

  const bottomAd = isFreeUser && showBottomAd ? resolveActiveAd('player_bottom', ['banner']) : null;
  const adHeightOffset = bottomAd ? 76 : 0;
  const adTheme = adsConfig?.settings?.adTheme || 'glass';

  useEffect(() => {
    initializeSession(true); // force session reload on layout mount to sync permissions
    fetchTracks();

    // ⚡ Sync tracks state (including deletions/additions) across all active users in real time
    const tracksInterval = setInterval(() => {
      if (typeof window !== 'undefined') {
        (window as any).__beatoLastTracksFetch = 0; // bypass the client throttle
      }
      fetchTracks().catch(console.error);
    }, 1000);
    
    // Fetch active Ads configurations
    fetch('/api/ads')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setAds(data.ads || []);
          if (data.adsConfig) {
            setAdsConfig(data.adsConfig);
          }
        }
      })
      .catch(err => console.error('Failed to load ads configuration:', err));

    return () => {
      clearInterval(tracksInterval);
    };
  }, []);

  useEffect(() => {
    if (user && token && typeof document !== 'undefined') {
      document.cookie = `beato-token=${token}; path=/; max-age=31536000; SameSite=Lax`;
      document.cookie = `beato-role=${user.role}; path=/; max-age=31536000; SameSite=Lax`;
    }
  }, [user, token]);



  useEffect(() => {
    const mainEl = document.getElementById('main-content');
    if (!mainEl) return;

    const handleScroll = () => {
      setIsScrolled(mainEl.scrollTop > 5);
    };

    mainEl.addEventListener('scroll', handleScroll, { passive: true });
    // Run initial check
    handleScroll();

    return () => {
      mainEl.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    // ⚡ Defer by 2s so page content renders first before background polling starts
    const startDelay = setTimeout(() => {
      syncFromServer();
      const realtimePoll = setInterval(syncFromServer, 30000); // ⚡ 30s instead of 15s

      // Wire socket notifications
      if (socketManager) {
        const unsubNewSong = socketManager.on('NEW_SONG', (track) => {
          addNotification({ type: 'upload_complete', message: `🎵 New track: "${track.title}" by ${track.artistName}`, trackTitle: track.title });
        });
        const unsubNotif = socketManager.on('NOTIFICATION', (n) => {
          addNotification(n);
        });
        const unsubPerms = socketManager.on('ROLE_PERMISSION_UPDATE', () => {
          console.log('[Socket] Received ROLE_PERMISSION_UPDATE event! Refreshing session in real time...');
          initializeSession(true);
        });
        // Return cleanup inside the timeout callback — attach to outer ref
        (window as any).__beatoRealtimeCleanup = () => {
          clearInterval(realtimePoll);
          unsubNewSong(); unsubNotif(); unsubPerms();
        };
      } else {
        (window as any).__beatoRealtimeCleanup = () => clearInterval(realtimePoll);
      }
    }, 2000);

    return () => {
      clearTimeout(startDelay);
      if (typeof window !== 'undefined' && (window as any).__beatoRealtimeCleanup) {
        (window as any).__beatoRealtimeCleanup();
      }
    };
  }, [syncFromServer, addNotification]);

  const cleanPath = pathname ? pathname.split('?')[0].split('#')[0].replace(/\.html$/, '').replace(/\/$/, '') : '';
  const isDownloads = cleanPath === '/downloads';
  const isPlaylist = cleanPath.startsWith('/playlist');
  const isAlbum = cleanPath.startsWith('/album');
  const isRoot = cleanPath === '' || cleanPath === '/index' || cleanPath === '/';
  
  const isBypassed = isDownloads || isPlaylist || isAlbum || isRoot;
  const isRouteBlocked = !isOnline && !isBypassed;

  return (
    <div className={`app-layout ${!currentTrack ? 'no-player' : ''}`} style={{
      ['--layout-cols' as any]: showRightPanel ? 'var(--sidebar-width, 280px) 1fr 350px' : 'var(--sidebar-width, 280px) 1fr',
    }}>
      {isMounted && isMobile && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 'var(--sat, 0px)',
          background: isScrolled ? 'var(--color-ss-surface, #f4eede)' : 'transparent',
          zIndex: 9999,
          pointerEvents: 'none',
          transition: 'background 0.2s ease-in-out',
        }} />
      )}
      <Sidebar />
      <main className="app-main" id="main-content" style={{ 
        position: 'relative', 
        overflow: isRouteBlocked ? 'hidden' : 'auto',
        paddingBottom: bottomAd ? (isMobile ? '160px' : '90px') : undefined
      }}>
        {isRouteBlocked && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(251, 249, 245, 0.82)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '24px',
            zIndex: 999,
            color: '#221a15',
            fontFamily: 'Outfit, sans-serif'
          }}>
            <WifiOff size={64} color="#ef4444" style={{ marginBottom: 20, opacity: 0.8 }} />
            <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 10, color: '#221a15' }}>You're Currently Offline</h2>
            <p style={{ fontSize: 14, color: '#87786c', maxWidth: 360, lineHeight: 1.6, marginBottom: 28 }}>
              Connect to the internet to browse and stream millions of songs.
            </p>
            <Link href="/downloads" style={{ textDecoration: 'none' }}>
              <button style={{
                background: 'var(--color-ss-primary, #b08850)',
                color: '#fff',
                border: 'none',
                borderRadius: 30,
                padding: '12px 32px',
                fontSize: 14,
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(176, 136, 80, 0.35)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'none'}
              >
                Go to download page to enjoy offline song
              </button>
            </Link>
          </div>
        )}
        {children}
      </main>
      {showRightPanel && (
        <div className="app-right-panel">
          {showQueue ? (
            <QueuePanel onClose={toggleQueue} />
          ) : showLyrics ? (
            <LyricsPanel onClose={toggleLyrics} />
          ) : (
            <NowPlayingPanel onClose={() => setShowNowPlaying(false)} />
          )}
        </div>
      )}
      {isMounted && bottomAd && (
        <div style={{
          position: 'fixed',
          bottom: isMobile ? (currentTrack ? 144 : 72) : 106,
          left: isMobile ? 12 : 304,
          right: isMobile ? 12 : (showRightPanel ? 374 : 24),
          zIndex: 999
        }}>
          <AdBanner ad={bottomAd} theme={adTheme} style={{ margin: 0, padding: '8px 16px', borderRadius: 10 }} />
        </div>
      )}
      <PlayerBar />
      <MobileNav />
      <MobileDrawer />
      <CreateOptionsBottomSheet />
      {isMounted && activeRoomId && (pathname === '/home' || pathname === '/') && (
        <div style={{
          position: 'fixed',
          bottom: isMobile ? (currentTrack ? 140 + adHeightOffset : 75 + adHeightOffset) : 100 + adHeightOffset,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '90%',
          maxWidth: 400,
          background: 'rgba(21, 128, 61, 0.96)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: 24,
          padding: '8px 16px',
          boxShadow: '0 8px 32px rgba(21, 128, 61, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 9999,
          cursor: 'pointer',
          boxSizing: 'border-box',
          gap: 12
        }}
        onClick={() => {
          if (typeof window !== 'undefined') {
            window.location.href = getRoomUrl(activeRoomId);
          }
        }}
        >
          {/* Left section: Pulse dot and message */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
            <div style={{ position: 'relative', display: 'flex', flexShrink: 0 }}>
              <span className="pulse-green-double" style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: '#ffffff',
                display: 'inline-block',
                animation: 'pulse 1.5s infinite'
              }} />
            </div>
            
            <div style={{ minWidth: 0 }}>
              <p style={{ color: '#ffffff', fontSize: 12.5, fontWeight: 800, margin: 0, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                Your Listening Room is Active 🎧
              </p>
              <p style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: 10.5, fontWeight: 600, margin: '2px 0 0', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                Click to return to: {activeRoomName || 'Room'}
              </p>
            </div>
          </div>

          <span style={{
            background: '#ffffff',
            color: '#15803d',
            fontSize: 10,
            fontWeight: 800,
            padding: '5px 12px',
            borderRadius: 12,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            flexShrink: 0,
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
          }}>
            Open Room
          </span>
        </div>
      )}
    </div>
  );
}
