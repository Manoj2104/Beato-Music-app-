'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Heart, MoreHorizontal, MoreVertical, Download, Check, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDownloadStore } from '@/store/downloadStore';
import { Track } from '@/types';
import { usePlayerStore } from '@/store/playerStore';
import { useAuthStore } from '@/store/authStore';
import { useMusicStore, trackGradient } from '@/store/musicStore';
import { formatDuration } from '@/lib/mockData';

const GREEN = '#b08850';

interface TrackCardProps {
  track: Track;
  index?: number;
  queue?: Track[];
  showAlbum?: boolean;
  compact?: boolean;
}

export default function TrackCard({ track, index, queue = [], showAlbum = true, compact = false }: TrackCardProps) {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [prevCoverImage, setPrevCoverImage] = useState(track.coverImage);

  if (track.coverImage !== prevCoverImage) {
    setPrevCoverImage(track.coverImage);
    setImgError(false);
  }

  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayerStore();
  const { user, toggleLikeSong } = useAuthStore();
  const { addToRecentlyPlayed, recordListen } = useMusicStore();
  const { downloadTrack, removeDownloadedTrack, downloadedTrackIds, downloadingIds } = useDownloadStore();

  const downloaded = downloadedTrackIds.includes(track.id);
  const downloading = downloadingIds.includes(track.id);

  const handleDownload = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (downloaded) {
      removeDownloadedTrack(track.id);
    } else {
      downloadTrack(track);
    }
  };

  const isCurrentTrack = currentTrack?.id === track.id;
  const isLiked = user?.likedSongs?.includes(track.id) ?? false;
  const displayImage = !imgError && track.coverImage && track.coverImage !== 'undefined' && track.coverImage !== 'null' ? track.coverImage : null;

  const handlePlay = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (isCurrentTrack) { togglePlay(); }
    else {
      playTrack(track, queue);
      addToRecentlyPlayed(track);
      recordListen(track);
    }
  };

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    toggleLikeSong(track.id);
  };

  return (
    <div
      className={`track-card-row ${compact ? 'compact' : ''}`}
      style={{
        background: isCurrentTrack ? 'rgba(176, 136, 80, 0.08)' : 'transparent',
      }}
      onMouseEnter={e => { setIsHovered(true); if (!isCurrentTrack) e.currentTarget.style.background = 'rgba(43, 34, 26, 0.04)'; }}
      onMouseLeave={e => { setIsHovered(false); if (!isCurrentTrack) e.currentTarget.style.background = 'transparent'; }}
      onClick={handlePlay}>

      {/* Index / Play */}
      <div className="track-card-index" style={{ width: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {isHovered ? (
          isCurrentTrack && isPlaying
            ? <Pause size={14} color={GREEN} fill={GREEN} />
            : <Play size={14} color="#221a15" fill="#221a15" />
        ) : (
          isCurrentTrack && isPlaying ? (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 14 }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ width: 2, background: GREEN, borderRadius: 1, height: `${4 + i * 3}px`, animation: `waveform ${0.6 + i * 0.15}s ease-in-out infinite` }} />
              ))}
            </div>
          ) : (
            <span style={{ fontSize: 13, color: isCurrentTrack ? GREEN : '#87786c' }}>{index !== undefined ? index + 1 : '•'}</span>
          )
        )}
      </div>

      {/* Cover art */}
      <div style={{
        width: 40,
        height: 40,
        borderRadius: 10,
        overflow: 'hidden',
        position: 'relative',
        background: displayImage ? 'none' : trackGradient(track.id),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        boxShadow: isCurrentTrack ? `0 0 12px rgba(176, 136, 80, 0.3)` : 'none'
      }}>
        {displayImage ? (
          <img
            src={displayImage}
            alt=""
            onError={() => setImgError(true)}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <span style={{ fontSize: 14 }}>🎵</span>
        )}
      </div>

      {/* Title + Artist */}
      <div style={{ minWidth: 0 }}>
        <p style={{ color: isCurrentTrack ? GREEN : '#221a15', fontSize: 14.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {track.title}
          {track.explicit && <span style={{ marginLeft: 6, fontSize: 9, background: 'rgba(43,34,26,0.08)', color: '#87786c', padding: '1px 5px', borderRadius: 3 }}>E</span>}
        </p>
        <div
          onClick={e => {
            e.preventDefault();
            e.stopPropagation();
            router.push(`/artist/${track.artistId}`);
          }}
          style={{ textDecoration: 'none', cursor: 'pointer' }}
        >
          <p style={{ color: '#87786c', fontSize: 12.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}
            onMouseEnter={e => { e.currentTarget.style.color = '#221a15'; e.currentTarget.style.textDecoration = 'underline'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#87786c'; e.currentTarget.style.textDecoration = 'none'; }}>
            {track.artistName}
          </p>
        </div>
      </div>

      {/* Album */}
      {showAlbum && !compact && (
        <div
          className="track-card-album"
          onClick={e => {
            e.preventDefault();
            e.stopPropagation();
            router.push(`/album/${track.albumId}`);
          }}
          style={{ textDecoration: 'none', cursor: 'pointer' }}
        >
          <p style={{ color: '#87786c', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#221a15'; e.currentTarget.style.textDecoration = 'underline'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#87786c'; e.currentTarget.style.textDecoration = 'none'; }}>
            {track.albumName}
          </p>
        </div>
      )}

      {/* Actions + Duration */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
        <button className="track-card-like" onClick={handleLike} title={isLiked ? 'Remove from Liked Songs' : 'Add to Liked Songs'}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: isLiked ? GREEN : '#87786c', opacity: isHovered || isLiked ? 1 : 0, transition: 'opacity 0.15s, color 0.15s', padding: 0 }}
          onMouseEnter={e => (e.currentTarget.style.color = isLiked ? '#34d399' : '#221a15')}
          onMouseLeave={e => (e.currentTarget.style.color = isLiked ? GREEN : '#87786c')}>
          <Heart size={15} fill={isLiked ? GREEN : 'none'} color={isLiked ? GREEN : 'currentColor'} />
        </button>
        {/* Download Button */}
        <button
          className="track-card-download"
          onClick={handleDownload}
          title={downloaded ? 'Remove download' : downloading ? 'Downloading...' : 'Download for offline'}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            opacity: isHovered || downloaded || downloading ? 1 : 0,
            transition: 'opacity 0.15s',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {downloading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              style={{ display: 'flex' }}
            >
              <Loader2 size={15} color={GREEN} />
            </motion.div>
          ) : downloaded ? (
            <div style={{
              width: 18,
              height: 18,
              borderRadius: '50%',
              background: GREEN,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 6px rgba(176, 136, 80, 0.3)'
            }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          ) : (
            <div style={{
              width: 18,
              height: 18,
              borderRadius: '50%',
              border: '2px solid #87786c',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'border-color 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#221a15'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#87786c'}
            >
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#87786c' }}>
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
          )}
        </button>
        <span className="track-card-duration" style={{ color: '#87786c', fontSize: 12, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
          {formatDuration(track.duration)}
        </span>
        <button className="track-card-more hidden md:block" onClick={e => e.stopPropagation()} title="More options"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#87786c', opacity: isHovered ? 1 : 0, transition: 'opacity 0.15s', padding: 0 }}>
          <MoreHorizontal size={15} />
        </button>
        <button className="track-card-more block md:hidden" onClick={e => e.stopPropagation()} title="More options"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#87786c', opacity: 1, padding: 0 }}>
          <MoreVertical size={18} />
        </button>
      </div>
    </div>
  );
}
