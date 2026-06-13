'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, MoreHorizontal } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Album } from '@/types';
import { usePlayerStore } from '@/store/playerStore';
import { mockTracks } from '@/lib/mockData';
import { cn } from '@/lib/utils';

interface AlbumCardProps {
  album: Album;
  size?: 'sm' | 'md' | 'lg';
}

export default function AlbumCard({ album, size = 'md' }: AlbumCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayerStore();

  const albumTracks = mockTracks.filter(t => t.albumId === album.id);
  const isCurrentAlbum = albumTracks.some(t => t.id === currentTrack?.id);

  const handlePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isCurrentAlbum) {
      togglePlay();
    } else if (albumTracks.length > 0) {
      playTrack(albumTracks[0], albumTracks.slice(1));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="music-card bg-white/5 hover:bg-white/10 rounded-xl p-3 transition-colors cursor-pointer group"
    >
      <Link href={`/album/${album.id}`}>
        <div className="relative mb-3">
          <div className={cn(
            'relative rounded-lg overflow-hidden',
            size === 'sm' ? 'aspect-square' : 'aspect-square'
          )}>
            {album.coverImage ? (
              <Image
                src={album.coverImage}
                alt={album.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 200px"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center">
                <span style={{ fontSize: 24 }}>💿</span>
              </div>
            )}
          </div>

          {/* Play button overlay */}
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
            {isCurrentAlbum && isPlaying ? (
              <Pause size={18} fill="black" color="black" />
            ) : (
              <Play size={18} fill="black" color="black" className="translate-x-0.5" />
            )}
          </motion.button>
        </div>

        <div>
          <p className="text-sm font-semibold text-white truncate mb-0.5">{album.title}</p>
          <p className="text-xs text-ss-text-muted truncate">
            {album.year} · {album.artistName}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}
