'use client';

import { ReactNode, useEffect, useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import PlayerBar from '@/components/layout/PlayerBar';
import MobileNav from '@/components/layout/MobileNav';
import MobileDrawer from '@/components/layout/MobileDrawer';
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

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { syncFromServer } = useRealtimeStore();
  const { addNotification } = useNotificationStore();
  const { showQueue, showLyrics, currentTrack, isPlaying, toggleQueue, toggleLyrics } = usePlayerStore();
  const { user, token, initializeSession } = useAuthStore();
  const { fetchTracks } = useMusicStore();
  const isOnline = useNetworkStatus();
  const pathname = usePathname();

  const [showNowPlaying, setShowNowPlaying] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Automatically show Now Playing panel when a track starts playing
  useEffect(() => {
    if (isPlaying && currentTrack) {
      setShowNowPlaying(true);
    }
  }, [isPlaying, currentTrack?.id]);

  const showRightPanel = (showQueue || showLyrics || (showNowPlaying && !showQueue && !showLyrics)) && !!currentTrack;

  useEffect(() => {
    initializeSession();
    fetchTracks();
  }, []);

  useEffect(() => {
    if (user && token && typeof document !== 'undefined') {
      document.cookie = `beato-token=${token}; path=/; max-age=31536000; SameSite=Lax`;
      document.cookie = `beato-role=${user.role}; path=/; max-age=31536000; SameSite=Lax`;
    }
  }, [user, token]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
    syncFromServer();
    const realtimePoll = setInterval(syncFromServer, 15000);

    // Wire socket notifications
    if (socketManager) {
      const unsubNewSong = socketManager.on('NEW_SONG', (track) => {
        addNotification({ type: 'upload_complete', message: `🎵 New track: "${track.title}" by ${track.artistName}`, trackTitle: track.title });
      });
      const unsubNotif = socketManager.on('NOTIFICATION', (n) => {
        addNotification(n);
      });
      return () => {
        clearInterval(realtimePoll);
        unsubNewSong(); unsubNotif();
      };
    }
    return () => clearInterval(realtimePoll);
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
      ['--layout-cols' as any]: showRightPanel ? '280px 1fr 350px' : '280px 1fr',
    }}>
      {isMobile && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 'env(safe-area-inset-top, 24px)',
          background: isScrolled ? '#080808' : 'transparent',
          zIndex: 9999,
          pointerEvents: 'none',
          transition: 'background 0.25s ease-in-out',
        }} />
      )}
      <Sidebar />
      <main className="app-main" id="main-content" style={{ 
        position: 'relative', 
        overflow: isRouteBlocked ? 'hidden' : 'auto' 
      }}>
        {isRouteBlocked && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(10, 10, 10, 0.65)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '24px',
            zIndex: 999,
            color: '#fff',
            fontFamily: 'Outfit, sans-serif'
          }}>
            <WifiOff size={64} color="#ef4444" style={{ marginBottom: 20, opacity: 0.8 }} />
            <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 10 }}>You're Currently Offline</h2>
            <p style={{ fontSize: 14, color: '#a3a3a3', maxWidth: 360, lineHeight: 1.6, marginBottom: 28 }}>
              Connect to the internet to browse and stream millions of songs.
            </p>
            <Link href="/downloads" style={{ textDecoration: 'none' }}>
              <button style={{
                background: '#1db954',
                color: '#000',
                border: 'none',
                borderRadius: 30,
                padding: '12px 32px',
                fontSize: 14,
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(29, 185, 84, 0.4)',
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
      <PlayerBar />
      <MobileNav />
      <MobileDrawer />
    </div>
  );
}
