import { useEffect, useRef, useMemo } from 'react';
import { X, Mic } from 'lucide-react';
import Link from 'next/link';
import { usePlayerStore } from '@/store/playerStore';
import { useAuthStore } from '@/store/authStore';
import { getLyricsForTrack } from '@/lib/lyrics';

interface LyricsPanelProps {
  onClose: () => void;
}

export default function LyricsPanel({ onClose }: LyricsPanelProps) {
  const { currentTrack, progress, adsConfig } = usePlayerStore();
  const { user } = useAuthStore();
  const showLyricsAd = adsConfig?.placements?.lyricsPanel !== false;
  const isFree = user?.subscription === 'free' && showLyricsAd;
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
    const maxIndex = isFree ? Math.min(lyrics.length, 3) : lyrics.length;
    for (let i = 0; i < maxIndex; i++) {
      if (progress >= lyrics[i].time) {
        index = i;
      } else {
        break;
      }
    }
    return index === -1 ? 0 : index;
  }, [lyrics, progress, isFree]);

  const displayedLyrics = useMemo(() => {
    return isFree ? lyrics.slice(0, 3) : lyrics;
  }, [lyrics, isFree]);

  // Auto-scroll active line to center of lyrics container
  useEffect(() => {
    if (activeIndex === -1 || !containerRef.current || isFree) return;
    const activeEl = containerRef.current.children[activeIndex] as HTMLElement;
    if (!activeEl) return;

    const containerHeight = containerRef.current.clientHeight;
    const itemOffset = activeEl.offsetTop;
    const itemHeight = activeEl.clientHeight;

    containerRef.current.scrollTo({
      top: itemOffset - containerHeight / 2 + itemHeight / 2,
      behavior: 'smooth'
    });
  }, [activeIndex, isFree]);

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
          maskImage: isFree ? 'none' : 'linear-gradient(to bottom, transparent 0%, white 15%, white 85%, transparent 100%)',
          WebkitMaskImage: isFree ? 'none' : 'linear-gradient(to bottom, transparent 0%, white 15%, white 85%, transparent 100%)',
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
          <>
            {displayedLyrics.map((line, index) => {
              const isActive = index === activeIndex;
              return (
                <div
                  key={index}
                  onClick={() => !isFree && handleLineClick(line.time)}
                  style={{
                    fontSize: isActive ? '20px' : '17px',
                    fontWeight: 700,
                    color: isActive ? '#fff' : 'rgba(255,255,255,0.3)',
                    textShadow: isActive ? '0 0 10px rgba(255,255,255,0.2)' : 'none',
                    cursor: isFree ? 'default' : 'pointer',
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
                    if (!isActive && !isFree) e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
                  }}
                  onMouseLeave={e => {
                    if (!isActive && !isFree) e.currentTarget.style.color = 'rgba(255,255,255,0.3)';
                  }}
                >
                  {line.text}
                </div>
              );
            })}

            {isFree && (
              <div style={{
                marginTop: 20,
                padding: '24px 20px',
                background: 'linear-gradient(135deg, rgba(176,136,80,0.12), rgba(0,0,0,0.5))',
                borderRadius: 14,
                border: '1px solid rgba(176,136,80,0.25)',
                textAlign: 'center',
                boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12
              }}>
                <span style={{ fontSize: 24 }}>💎</span>
                <div>
                  <h4 style={{ color: '#fff', fontSize: 15, fontWeight: 800, margin: '0 0 4px 0', fontFamily: 'Outfit, sans-serif' }}>Unlock Full Synced Lyrics</h4>
                  <p style={{ color: '#87786c', fontSize: 11.5, margin: 0, lineHeight: 1.4 }}>Looking for the full song text? Upgrade to Beato Premium for real-time lyrics & ad-free sound.</p>
                </div>
                <Link href="/premium" onClick={onClose} style={{ textDecoration: 'none', width: '100%' }}>
                  <button style={{
                    width: '100%',
                    background: 'var(--color-ss-primary, #b08850)',
                    color: '#000',
                    border: 'none',
                    borderRadius: 10,
                    padding: '10px 0',
                    fontWeight: 900,
                    fontSize: 13,
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(176,136,80,0.3)',
                    fontFamily: 'Outfit, sans-serif'
                  }}>
                    Go Premium
                  </button>
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
