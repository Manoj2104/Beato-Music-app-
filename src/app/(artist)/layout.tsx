'use client';

import { ReactNode, useState, useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import PlayerBar from '@/components/layout/PlayerBar';
import MobileNav from '@/components/layout/MobileNav';
import MobileDrawer from '@/components/layout/MobileDrawer';
import { usePlayerStore } from '@/store/playerStore';

export default function ArtistLayout({ children }: { children: ReactNode }) {
  const { currentTrack } = usePlayerStore();
  const [isMobile, setIsMobile] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // Find the nearest scrollable .app-main
    const mainEl = document.querySelector('.app-main');
    if (!mainEl) return;

    const handleScroll = () => {
      setIsScrolled(mainEl.scrollTop > 5);
    };

    mainEl.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      mainEl.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div className={`app-layout ${!currentTrack ? 'no-player' : ''}`}>
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
      <main className="app-main">
        {children}
      </main>
      <PlayerBar />
      <MobileNav />
      <MobileDrawer />
    </div>
  );
}
