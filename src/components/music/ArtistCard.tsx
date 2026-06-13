'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, UserCheck, UserPlus } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Artist } from '@/types';
import { usePlayerStore } from '@/store/playerStore';
import { useAuthStore } from '@/store/authStore';
import { useMusicStore } from '@/store/musicStore';
import { mockTracks, formatFollowers } from '@/lib/mockData';
import { cn } from '@/lib/utils';

interface ArtistCardProps {
  artist: Artist;
}

export default function ArtistCard({ artist }: ArtistCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayerStore();
  const { user, toggleFollowArtist } = useAuthStore();
  const { allTracks } = useMusicStore();

  const artistTracks = allTracks.filter(t => t.artistId === artist.id && (t.status === 'approved' || !t.status));
  const isFollowed = user?.followedArtists.includes(artist.id);
  const isCurrentArtist = artistTracks.some(t => t.id === currentTrack?.id);

  const handlePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isCurrentArtist) {
      togglePlay();
    } else if (artistTracks.length > 0) {
      playTrack(artistTracks[0], artistTracks.slice(1));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="music-card bg-white/5 hover:bg-white/10 rounded-xl p-3 text-center cursor-pointer group transition-colors"
    >
      <Link href={`/artist/${artist.id}`}>
        <div className="relative mb-3">
          <div className="relative aspect-square rounded-full overflow-hidden mx-auto">
            {artist.image ? (
              <Image
                src={artist.image}
                alt={artist.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 180px"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center">
                <span style={{ fontSize: 24 }}>🎤</span>
              </div>
            )}
          </div>

          {/* Play overlay */}
          <motion.button
            onClick={handlePlay}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: isHovered ? 1 : 0, scale: isHovered ? 1 : 0.8 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-1 right-1 w-10 h-10 rounded-full bg-ss-primary flex items-center justify-center shadow-glow-green hover:scale-110 transition-transform"
          >
            {isCurrentArtist && isPlaying ? (
              <Pause size={18} fill="black" color="black" />
            ) : (
              <Play size={18} fill="black" color="black" className="translate-x-0.5" />
            )}
          </motion.button>

          {/* Verified badge */}
          {artist.verified && (
            <div className="absolute top-1 right-1 w-5 h-5 bg-ss-secondary rounded-full flex items-center justify-center">
              <span className="text-white text-xs">✓</span>
            </div>
          )}
        </div>

        <p className="text-sm font-semibold text-white truncate mb-0.5">{artist.name}</p>
        <p className="text-xs text-ss-text-muted mb-2 capitalize">{artist.genres[0]}</p>
      </Link>

      <button
        onClick={(e) => { e.stopPropagation(); toggleFollowArtist(artist.id); }}
        className={cn(
          'text-xs font-medium px-3 py-1 rounded-full border transition-colors',
          isFollowed
            ? 'border-white/30 text-white hover:border-white/50'
            : 'border-white/20 text-ss-text-muted hover:text-white hover:border-white/40'
        )}
      >
        {isFollowed ? 'Following' : 'Follow'}
      </button>
    </motion.div>
  );
}
