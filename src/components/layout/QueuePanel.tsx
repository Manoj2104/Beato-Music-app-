'use client';

import { motion, Reorder } from 'framer-motion';
import { X, Trash2, Play, GripVertical, Music, Disc, RefreshCw } from 'lucide-react';
import { usePlayerStore } from '@/store/playerStore';
import { formatDuration } from '@/lib/mockData';
import { Track } from '@/types';

interface QueuePanelProps {
  onClose: () => void;
}

export default function QueuePanel({ onClose }: QueuePanelProps) {
  const {
    currentTrack,
    queue,
    isPlaying,
    togglePlay,
    removeFromQueue,
    clearQueue,
    setQueue,
    playTrack
  } = usePlayerStore();

  const handleReorder = (newQueue: Track[]) => {
    setQueue(newQueue);
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
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0 }}>Play Queue</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {queue.length > 0 && (
            <button
              onClick={clearQueue}
              style={{
                background: 'none',
                border: 'none',
                color: '#a3a3a3',
                fontSize: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 8px',
                borderRadius: 4,
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = '#ff4444';
                e.currentTarget.style.background = 'rgba(255, 68, 68, 0.1)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = '#a3a3a3';
                e.currentTarget.style.background = 'none';
              }}
            >
              <Trash2 size={14} />
              Clear Queue
            </button>
          )}
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
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
      }}>
        {/* Now Playing Section */}
        {currentTrack && (
          <div>
            <h4 style={{ fontSize: 13, fontWeight: 600, color: '#a3a3a3', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Now Playing</h4>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.05)',
            }}>
              {/* Cover Art */}
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 6,
                overflow: 'hidden',
                position: 'relative',
                background: `hsl(${(currentTrack.id.charCodeAt(0) * 37) % 360}, 50%, 30%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Disc size={20} color="rgba(255,255,255,0.6)" className={isPlaying ? 'float-animation' : ''} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ color: '#1db954', fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
                  {currentTrack.title}
                </p>
                <p style={{ color: '#a3a3a3', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: '2px 0 0 0' }}>
                  {currentTrack.artistName}
                </p>
              </div>
              <button
                onClick={togglePlay}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#1db954',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 8,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(29, 185, 84, 0.1)'
                }}
              >
                {isPlaying ? (
                  <span style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 12 }}>
                    <span className="waveform-bar" style={{ width: 2, height: 12, animationDelay: '0.1s' }} />
                    <span className="waveform-bar" style={{ width: 2, height: 8, animationDelay: '0.3s' }} />
                    <span className="waveform-bar" style={{ width: 2, height: 14, animationDelay: '0.5s' }} />
                  </span>
                ) : (
                  <Play size={14} fill="#1db954" />
                )}
              </button>
            </div>
          </div>
        )}

        {/* Next Up Section */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h4 style={{ fontSize: 13, fontWeight: 600, color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Next Up ({queue.length})</h4>
          </div>

          {queue.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px 20px',
              textAlign: 'center',
              border: '2px dashed #282828',
              borderRadius: 12,
              color: '#525252'
            }}>
              <Music size={28} style={{ marginBottom: 8 }} />
              <p style={{ fontSize: 13, margin: 0 }}>Queue is empty</p>
              <p style={{ fontSize: 11, color: '#404040', marginTop: 4 }}>Add tracks to play next from search or albums</p>
            </div>
          ) : (
            <Reorder.Group axis="y" values={queue} onReorder={handleReorder} style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {queue.map((track, index) => (
                <Reorder.Item
                  key={track.id}
                  value={track}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '8px 12px',
                    background: '#181818',
                    borderRadius: 8,
                    cursor: 'grab',
                    border: '1px solid transparent',
                    userSelect: 'none'
                  }}
                  whileDrag={{
                    scale: 1.02,
                    borderColor: 'rgba(29, 185, 84, 0.4)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                    cursor: 'grabbing'
                  }}
                >
                  {/* Handle */}
                  <div style={{ color: '#525252', display: 'flex', alignItems: 'center', cursor: 'grab' }}>
                    <GripVertical size={16} />
                  </div>

                  {/* Album Cover Art */}
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 4,
                    overflow: 'hidden',
                    position: 'relative',
                    background: `hsl(${(track.id.charCodeAt(0) * 37) % 360}, 50%, 30%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Disc size={16} color="rgba(255,255,255,0.4)" />
                  </div>

                  {/* Track Meta */}
                  <div style={{ minWidth: 0, flex: 1 }} onClick={() => playTrack(track, queue)}>
                    <p style={{
                      color: '#fff',
                      fontSize: 13,
                      fontWeight: 500,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      margin: 0,
                      cursor: 'pointer'
                    }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#1db954')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#fff')}
                    >
                      {track.title}
                    </p>
                    <p style={{ color: '#a3a3a3', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: '2px 0 0 0' }}>
                      {track.artistName}
                    </p>
                  </div>

                  {/* Duration */}
                  <span style={{ fontSize: 12, color: '#737373', fontVariantNumeric: 'tabular-nums' }}>
                    {formatDuration(track.duration)}
                  </span>

                  {/* Actions */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromQueue(track.id);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#525252',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 6,
                      borderRadius: '50%',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.color = '#ff4444';
                      e.currentTarget.style.background = 'rgba(255, 68, 68, 0.1)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.color = '#525252';
                      e.currentTarget.style.background = 'none';
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </Reorder.Item>
              ))}
            </Reorder.Group>
          )}
        </div>
      </div>
    </div>
  );
}
