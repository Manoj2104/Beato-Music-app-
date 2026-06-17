'use client';

import { useEffect, useRef, useMemo } from 'react';
import { X, Mic, RefreshCw } from 'lucide-react';
import { usePlayerStore } from '@/store/playerStore';
import { getLyricsForTrack } from '@/lib/lyrics';

interface LyricsPanelProps {
  onClose: () => void;
}

export default function LyricsPanel({ onClose }: LyricsPanelProps) {
  const { currentTrack, progress } = usePlayerStore();
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch the lyrics for the current track
  const lyrics = useMemo(() => {
    if (!currentTrack) return [];
    return getLyricsForTrack(currentTrack.id, currentTrack.title, currentTrack.artistName);
  }, [currentTrack]);

  // Find the index of the active lyric line
  const activeIndex = useMemo(() => {
    if (lyrics.length === 0) return -1;
    let index = -1;
    for (let i = 0; i < lyrics.length; i++) {
      if (progress >= lyrics[i].time) {
        index = i;
      } else {
        break;
      }
    }
    return index === -1 ? 0 : index;
  }, [lyrics, progress]);

  // Auto-scroll active line to center of lyrics container
  useEffect(() => {
    if (activeIndex === -1 || !containerRef.current) return;
    const activeEl = containerRef.current.children[activeIndex] as HTMLElement;
    if (!activeEl) return;

    const containerHeight = containerRef.current.clientHeight;
    const itemOffset = activeEl.offsetTop;
    const itemHeight = activeEl.clientHeight;

    containerRef.current.scrollTo({
      top: itemOffset - containerHeight / 2 + itemHeight / 2,
      behavior: 'smooth'
    });
  }, [activeIndex]);

  const handleLineClick = (time: number) => {
    window.dispatchEvent(new CustomEvent('seek-audio', { detail: time }));
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: '#121212',
      borderLeft: '1px solid #282828',
      borderRadius: '0 12px 12px 0',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        borderBottom: '1px solid #282828'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#b08850' }}>
          <Mic size={18} />
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0 }}>Synced Lyrics</h3>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#a3a3a3',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 4,
            borderRadius: '50%',
            transition: 'background 0.2s, color 0.2s'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.color = '#fff';
            e.currentTarget.style.background = '#282828';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = '#a3a3a3';
            e.currentTarget.style.background = 'none';
          }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Lyrics Box */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '40px 24px',
          scrollBehavior: 'smooth',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          maskImage: 'linear-gradient(to bottom, transparent 0%, white 15%, white 85%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, white 15%, white 85%, transparent 100%)',
        }}
      >
        {lyrics.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#737373',
            textAlign: 'center'
          }}>
            <Mic size={32} style={{ marginBottom: 12 }} />
            <p style={{ margin: 0, fontSize: 14 }}>Lyrics aren't available for this song</p>
          </div>
        ) : (
          lyrics.map((line, index) => {
            const isActive = index === activeIndex;
            return (
              <div
                key={index}
                onClick={() => handleLineClick(line.time)}
                style={{
                  fontSize: isActive ? '20px' : '17px',
                  fontWeight: 700,
                  color: isActive ? '#fff' : 'rgba(255,255,255,0.3)',
                  textShadow: isActive ? '0 0 10px rgba(255,255,255,0.2)' : 'none',
                  cursor: 'pointer',
                  padding: '8px 12px',
                  borderRadius: 8,
                  background: isActive ? 'rgba(255,255,255,0.04)' : 'transparent',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  transformOrigin: 'left center',
                  transform: isActive ? 'scale(1.02)' : 'scale(1)',
                  textAlign: 'left',
                  userSelect: 'none',
                }}
                onMouseEnter={e => {
                  if (!isActive) e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
                }}
                onMouseLeave={e => {
                  if (!isActive) e.currentTarget.style.color = 'rgba(255,255,255,0.3)';
                }}
              >
                {line.text}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
