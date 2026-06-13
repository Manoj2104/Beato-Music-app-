'use client';

import { ReactNode } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import PlayerBar from '@/components/layout/PlayerBar';
import MobileNav from '@/components/layout/MobileNav';
import MobileDrawer from '@/components/layout/MobileDrawer';
import { usePlayerStore } from '@/store/playerStore';

export default function ArtistLayout({ children }: { children: ReactNode }) {
  const { currentTrack } = usePlayerStore();

  return (
    <div className={`app-layout ${!currentTrack ? 'no-player' : ''}`}>
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

