'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Heart, MoreHorizontal } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Playlist } from '@/types';
import { usePlayerStore } from '@/store/playerStore';
import { mockTracks } from '@/lib/mockData';
import { cn } from '@/lib/utils';

interface PlaylistCardProps {
  playlist: Playlist;
  variant?: 'grid' | 'list';
}

export default function PlaylistCard({ playlist, variant = 'grid' }: PlaylistCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayerStore();

  const tracks = mockTracks.filter(t => playlist.tracks.includes(t.id));
  const isCurrentPlaylist = tracks.some(t => t.id === currentTrack?.id);

  const handlePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isCurrentPlaylist) {
      togglePlay();
    } else if (tracks.length > 0) {
      playTrack(tracks[0], tracks.slice(1));
    }
  };

  const isLikedSongs = playlist.id === 'playlist-1';

  if (variant === 'list') {
    return (
      <Link href={`/playlist/${playlist.id}`}>
        <div
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="flex items-center gap-3 p-2 rounded-md hover:bg-white/5 group cursor-pointer transition-colors"
        >
          <div className="w-12 h-12 rounded overflow-hidden relative flex-shrink-0">
            {isLikedSongs ? (
              <div className={`w-full h-full bg-gradient-to-br ${playlist.gradient || 'from-indigo-600 to-blue-400'} flex items-center justify-center`}>
                <Heart size={20} className="text-white" />
              </div>
            ) : playlist.coverImage ? (
              <Image src={playlist.coverImage} alt={playlist.title} fill className="object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center">
                <span className="text-sm">🎵</span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn('text-sm font-medium truncate', isCurrentPlaylist ? 'text-ss-primary' : 'text-white')}>
              {playlist.title}
            </p>
            <p className="text-xs text-ss-text-muted truncate">
              Playlist · {playlist.ownerName}
            </p>
          </div>
          <button
            onClick={handlePlay}
            className={cn('opacity-0 group-hover:opacity-100 transition-opacity', isCurrentPlaylist && isPlaying ? 'opacity-100' : '')}
          >
            {isCurrentPlaylist && isPlaying ? <Pause size={18} className="text-ss-primary" fill="currentColor" /> : <Play size={18} className="text-white" fill="currentColor" />}
          </button>
        </div>
      </Link>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="music-card bg-white/5 hover:bg-white/10 rounded-xl p-3 cursor-pointer group transition-colors"
    >
      <Link href={`/playlist/${playlist.id}`}>
        <div className="relative mb-3">
          <div className="relative aspect-square rounded-lg overflow-hidden">
            {isLikedSongs ? (
              <div className={`w-full h-full bg-gradient-to-br ${playlist.gradient || 'from-indigo-600 to-blue-400'} flex items-center justify-center`}>
                <Heart size={40} className="text-white" />
              </div>
            ) : playlist.coverImage ? (
              <Image
                src={playlist.coverImage}
                alt={playlist.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 200px"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center">
                <span style={{ fontSize: 24 }}>🎵</span>
              </div>
            )}
          </div>

          {/* Play overlay */}
          <motion.button
            onClick={handlePlay}
            initial={{ opacity: 0, scale: 0.8, y: 8 }}
            animate={{
              opacity: isHovered ? 1 : 0,
              scale: isHovered ? 1 : 0.8,
              y: isHovered ? 0 : 8
            }}
            transition={{ duration: 0.15 }}
            className="card-play-overlay absolute bottom-2 right-2 w-10 h-10 rounded-full bg-ss-primary flex items-center justify-center shadow-glow-green hover:scale-110 transition-transform"
          >
            {isCurrentPlaylist && isPlaying ? (
              <Pause size={18} fill="black" color="black" />
            ) : (
              <Play size={18} fill="black" color="black" className="translate-x-0.5" />
            )}
          </motion.button>

          {/* Beato badge */}
          {playlist.ownerId === 'beato' && (
            <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/60 rounded-full px-2 py-0.5">
              <div className="w-3 h-3 rounded-full bg-ss-primary" />
              <span className="text-xs text-white font-medium">Beato</span>
            </div>
          )}
        </div>

        <p className="text-sm font-semibold text-white truncate mb-0.5">{playlist.title}</p>
        <p className="text-xs text-ss-text-muted truncate line-clamp-2">{playlist.description}</p>
      </Link>
    </motion.div>
  );
}
