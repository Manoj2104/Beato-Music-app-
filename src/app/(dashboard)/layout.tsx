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

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { syncFromServer } = useRealtimeStore();
  const { addNotification } = useNotificationStore();
  const { showQueue, showLyrics, currentTrack, isPlaying, toggleQueue, toggleLyrics } = usePlayerStore();
  const { user, token, initializeSession } = useAuthStore();
  const { fetchTracks } = useMusicStore();

  const [showNowPlaying, setShowNowPlaying] = useState(false);

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
      document.cookie = `beato-token=${token}; path=/; max-age=604800; SameSite=Lax`;
      document.cookie = `beato-role=${user.role}; path=/; max-age=604800; SameSite=Lax`;
    }
  }, [user, token]);

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

  return (
    <div className={`app-layout ${!currentTrack ? 'no-player' : ''}`} style={{
      ['--layout-cols' as any]: showRightPanel ? '280px 1fr 350px' : '280px 1fr',
    }}>
      <Sidebar />
      <main className="app-main" id="main-content">
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
