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
      <style>{`
        /* Centralized styles to retheme the entire Artist Portal (dashboard, analytics, revenue, upload, register, etc.) */
        
        .artist-panel-container {
          background-color: var(--color-ss-bg, #fbf9f5) !important;
          color: var(--color-ss-text-primary, #221a15) !important;
        }

        /* Override dark backgrounds in child containers */
        .artist-panel-container div[style*="background: #0a0a0a"],
        .artist-panel-container div[style*="background: rgb(10, 10, 10)"],
        .artist-panel-container div[style*="background: #121212"],
        .artist-panel-container div[style*="background: rgb(18, 18, 18)"],
        .artist-panel-container div[style*="background: #1a1a1a"],
        .artist-panel-container div[style*="background: rgb(26, 26, 26)"],
        .artist-panel-container div[style*="background: #0d0d0d"],
        .artist-panel-container div[style*="background: rgb(13, 13, 13)"] {
          background-color: var(--color-ss-bg, #fbf9f5) !important;
        }

        /* Override card layouts (Overview cards, chart containers, grids) */
        .artist-panel-container div[style*="background: rgba(255,255,255,0.04)"],
        .artist-panel-container div[style*="background: rgba(255, 255, 255, 0.04)"],
        .artist-panel-container div[style*="background: rgba(255,255,255,0.05)"],
        .artist-panel-container div[style*="background: rgba(255, 255, 255, 0.05)"],
        .artist-panel-container div[style*="background: rgba(255,255,255,0.06)"],
        .artist-panel-container div[style*="background: rgba(255, 255, 255, 0.06)"],
        .artist-panel-container div[style*="background: rgba(255,255,255,0.03)"],
        .artist-panel-container div[style*="background: rgba(255, 255, 255, 0.03)"],
        .artist-panel-container div[style*="background: rgba(255,255,255,0.02)"],
        .artist-panel-container div[style*="background: rgba(255, 255, 255, 0.02)"] {
          background-color: var(--color-ss-elevated, #ffffff) !important;
          border: 1px solid var(--color-ss-border, rgba(43, 34, 26, 0.08)) !important;
          box-shadow: 0 10px 30px -10px rgba(43, 34, 26, 0.05) !important;
        }

        /* Header titles and dashboard text */
        .artist-panel-container h1,
        .artist-panel-container h2,
        .artist-panel-container h3,
        .artist-panel-container h4,
        .artist-panel-container h5,
        .artist-panel-container h6 {
          color: var(--color-ss-text-primary, #221a15) !important;
          text-shadow: none !important;
        }

        /* Body and general text layers */
        .artist-panel-container p,
        .artist-panel-container span:not(.live-text-gold),
        .artist-panel-container label,
        .artist-panel-container button,
        .artist-panel-container input,
        .artist-panel-container select,
        .artist-panel-container textarea {
          color: var(--color-ss-text-primary, #221a15) !important;
          text-shadow: none !important;
        }

        /* Target muted texts */
        .artist-panel-container p[style*="color: #737373"],
        .artist-panel-container span[style*="color: #737373"],
        .artist-panel-container p[style*="color: rgb(115, 115, 115)"],
        .artist-panel-container span[style*="color: rgb(115, 115, 115)"],
        .artist-panel-container p[style*="color: #a3a3a3"],
        .artist-panel-container span[style*="color: #a3a3a3"],
        .artist-panel-container p[style*="color: rgb(163, 163, 163)"],
        .artist-panel-container span[style*="color: rgb(163, 163, 163)"],
        .artist-panel-container span[style*="color: rgba(255,255,255,0.7)"],
        .artist-panel-container span[style*="color: rgba(255, 255, 255, 0.7)"],
        .artist-panel-container span[style*="color: rgba(255,255,255,0.5)"],
        .artist-panel-container span[style*="color: rgba(255, 255, 255, 0.5)"] {
          color: var(--color-ss-text-muted, #87786c) !important;
        }

        /* Secondary buttons and chips */
        .artist-panel-container button:not(.play-btn-force):not(.text-white-force) {
          color: var(--color-ss-text-primary, #221a15) !important;
          border-color: rgba(43, 34, 26, 0.2) !important;
        }

        /* Active tab / main gold buttons: keep black text contrast */
        .artist-panel-container button[style*="background: #b08850"],
        .artist-panel-container button[style*="background: rgb(176, 136, 80)"],
        .artist-panel-container div[style*="background: #b08850"],
        .artist-panel-container div[style*="background: rgb(176, 136, 80)"] {
          color: #000 !important;
          border: none !important;
        }

        /* Hover states for rows and search grids */
        .artist-panel-container div[style*="background: rgba(255, 255, 255, 0.08)"]:hover,
        .artist-panel-container div[style*="background: rgba(255,255,255,0.08)"]:hover,
        .artist-panel-container div[style*="background: rgba(255, 255, 255, 0.05)"]:hover,
        .artist-panel-container div[style*="background: rgba(255,255,255,0.05)"]:hover {
          background-color: var(--color-ss-surface, #f4eede) !important;
        }

        /* Input control fields */
        .artist-panel-container input,
        .artist-panel-container select,
        .artist-panel-container textarea {
          background-color: var(--color-ss-surface, #f4eede) !important;
          border: 1.5px solid var(--color-ss-border, rgba(43, 34, 26, 0.08)) !important;
          color: var(--color-ss-text-primary, #221a15) !important;
        }

        /* Tabchips text adjustment when inactive */
        .artist-panel-container button[style*="color: rgba(255,255,255,0.75)"],
        .artist-panel-container button[style*="color: rgba(255, 255, 255, 0.75)"],
        .artist-panel-container button[style*="color: rgba(255,255,255,0.6)"],
        .artist-panel-container button[style*="color: rgba(255, 255, 255, 0.6)"] {
          color: var(--color-ss-text-secondary, #4d3f35) !important;
          text-shadow: none !important;
        }

        /* Stat Card Grid items overrides */
        .artist-panel-container .stats-grid > div {
          background: var(--color-ss-elevated, #ffffff) !important;
          border: 1.5px solid var(--color-ss-border, rgba(43, 34, 26, 0.08)) !important;
          box-shadow: 0 4px 12px rgba(43, 34, 26, 0.04) !important;
        }
        .artist-panel-container .stats-grid > div p,
        .artist-panel-container .stats-grid > div span {
          color: var(--color-ss-text-primary, #221a15) !important;
        }
        .artist-panel-container .stats-grid > div div[style*="rotate(25deg)"] {
          background: var(--color-ss-surface, #f4eede) !important;
          box-shadow: 0 2px 6px rgba(43, 34, 26, 0.08) !important;
        }
        .artist-panel-container .stats-grid > div div[style*="rotate(25deg)"] svg {
          color: var(--color-ss-primary, #b08850) !important;
        }

        /* Active now indicator widget card */
        .artist-panel-container .active-now-card {
          background: var(--color-ss-elevated, #ffffff) !important;
          border: 1.5px solid var(--color-ss-border, rgba(43, 34, 26, 0.08)) !important;
        }

        /* Recharts SVG and text overrides */
        .artist-panel-container .recharts-cartesian-grid-horizontal line,
        .artist-panel-container .recharts-cartesian-grid-vertical line {
          stroke: var(--color-ss-border, rgba(43, 34, 26, 0.08)) !important;
        }
        .artist-panel-container .recharts-text {
          fill: var(--color-ss-text-secondary, #4d3f35) !important;
        }
        .artist-panel-container .recharts-tooltip-wrapper .recharts-default-tooltip {
          background-color: var(--color-ss-elevated, #ffffff) !important;
          border: 1px solid var(--color-ss-border, rgba(43, 34, 26, 0.08)) !important;
          border-radius: 8px !important;
          color: var(--color-ss-text-primary, #221a15) !important;
        }
      `}</style>
      {isMobile && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 'var(--sat, 0px)',
          background: isScrolled ? 'var(--color-ss-bg, #fbf9f5)' : 'transparent',
          zIndex: 9999,
          pointerEvents: 'none',
          transition: 'background 0.2s ease-in-out',
        }} />
      )}
      <Sidebar />
      <main className="app-main artist-panel-container">
        {children}
      </main>
      <PlayerBar />
      <MobileNav />
      <MobileDrawer />
    </div>
  );
}
