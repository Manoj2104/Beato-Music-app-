'use client';

import { use } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Heart, Share2, MoreHorizontal, Clock, Shuffle, Download } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import TopBar from '@/components/layout/TopBar';
import TrackCard from '@/components/music/TrackCard';
import AlbumCard from '@/components/music/AlbumCard';
import { getAlbumById, getArtistById, mockTracks, mockAlbums, formatDuration } from '@/lib/mockData';
import { usePlayerStore } from '@/store/playerStore';
import { useAuthStore } from '@/store/authStore';

export default function AlbumPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const album = getAlbumById(id);
  const artist = album ? getArtistById(album.artistId) : null;
  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayerStore();
  const { user, toggleSaveAlbum } = useAuthStore();

  if (!album) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-ss-text-muted">Album not found</p>
      </div>
    );
  }

  const tracks = mockTracks.filter(t => t.albumId === album.id);
  const isCurrentAlbum = tracks.some(t => t.id === currentTrack?.id);
  const isSaved = user?.savedAlbums?.includes(album.id);
  const totalDuration = tracks.reduce((sum, t) => sum + t.duration, 0);
  const moreByArtist = mockAlbums.filter(a => a.artistId === album.artistId && a.id !== album.id);

  return (
    <div className="min-h-full pb-8">
      {/* Hero */}
      <div className="relative">
        <div
          className="absolute inset-0 opacity-70"
          style={{ background: 'linear-gradient(180deg, #1a3040 0%, #121212 100%)' }}
        />
        <TopBar transparent />

        <div className="relative px-4 md:px-6 pt-2 pb-8 flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-left">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-40 h-40 md:w-52 md:h-52 rounded-xl overflow-hidden shadow-2xl flex-shrink-0 relative"
          >
            {album.coverImage ? (
              <Image src={album.coverImage} alt={album.title} fill className="object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center">
                <span style={{ fontSize: 48 }}>💿</span>
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 min-w-0 flex flex-col items-center md:items-start"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-white/80 mb-2 capitalize">
              {album.type}
            </p>
            <h1 className="font-display text-3xl md:text-5xl font-black text-white mb-3 leading-tight">
              {album.title}
            </h1>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-3">
              {artist && (
                <>
                  <div className="w-6 h-6 rounded-full overflow-hidden relative">
                    {artist.image ? (
                      <Image src={artist.image} alt={artist.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
                        <span style={{ fontSize: 10 }}>🎤</span>
                      </div>
                    )}
                  </div>
                  <Link href={`/artist/${artist.id}`}>
                    <span className="text-sm font-medium text-white hover:underline">{artist.name}</span>
                  </Link>
                  <span className="text-ss-text-muted">·</span>
                </>
              )}
              <span className="text-sm text-ss-text-muted">{album.year}</span>
              <span className="text-ss-text-muted">·</span>
              <span className="text-sm text-ss-text-muted">{album.totalTracks} songs,</span>
              <span className="text-sm text-ss-text-muted">
                about {Math.floor(totalDuration / 3600)}h {Math.floor((totalDuration % 3600) / 60)}m
              </span>
            </div>

            {album.description && (
              <p className="text-ss-text-secondary text-sm max-w-lg">{album.description}</p>
            )}
          </motion.div>
        </div>
      </div>

      {/* Controls */}
      <div className="px-4 md:px-6 py-4 flex items-center justify-between md:justify-start gap-4 md:gap-5">
        {/* Left icons on mobile, normal order on desktop */}
        <div className="flex items-center gap-3.5 md:gap-5 order-1 md:order-2">
          <button className="text-ss-text-muted hover:text-white transition-colors">
            <Shuffle size={22} />
          </button>

          <button
            onClick={() => toggleSaveAlbum(album.id)}
            className={`transition-colors ${isSaved ? 'text-ss-primary' : 'text-ss-text-muted hover:text-white'}`}
          >
            <Heart size={22} fill={isSaved ? 'currentColor' : 'none'} />
          </button>

          <button className="text-ss-text-muted hover:text-white transition-colors">
            <Download size={20} />
          </button>

          <button className="text-ss-text-muted hover:text-white transition-colors">
            <Share2 size={20} />
          </button>

          <button className="text-ss-text-muted hover:text-white transition-colors">
            <MoreHorizontal size={20} />
          </button>
        </div>

        {/* Play button: right side on mobile, first item on desktop */}
        <div className="order-2 md:order-1 flex-shrink-0">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (isCurrentAlbum) togglePlay();
              else if (tracks.length > 0) playTrack(tracks[0], tracks.slice(1));
            }}
            className="w-14 h-14 rounded-full bg-ss-primary flex items-center justify-center shadow-glow-green hover:scale-105 transition-transform"
          >
            {isCurrentAlbum && isPlaying ? (
              <Pause size={24} fill="black" color="black" />
            ) : (
              <Play size={24} fill="black" color="black" className="translate-x-0.5" />
            )}
          </motion.button>
        </div>
      </div>

      {/* Track list */}
      <div className="px-2 md:px-6 mb-10">
        <div className="track-list-header grid grid-cols-[16px_40px_1fr_80px] items-center gap-3 px-4 py-2 text-xs text-ss-text-muted font-medium uppercase tracking-wider border-b border-white/5 mb-2">
          <span>#</span>
          <span />
          <span>Title</span>
          <div className="flex justify-end"><Clock size={14} /></div>
        </div>

        {tracks.length > 0 ? (
          tracks.map((track, i) => (
            <TrackCard key={track.id} track={track} index={i} queue={tracks} showAlbum={false} />
          ))
        ) : (
          mockTracks.slice(0, 6).map((track, i) => (
            <TrackCard key={track.id} track={track} index={i} queue={mockTracks.slice(0, 6)} showAlbum={false} />
          ))
        )}
      </div>

      {/* More by artist */}
      {moreByArtist.length > 0 && artist && (
        <div className="px-6">
          <div className="flex items-end justify-between mb-4">
            <h2 className="font-display text-xl font-bold text-white">
              More by {artist.name}
            </h2>
            <Link href={`/artist/${artist.id}`} className="text-xs font-semibold text-ss-text-muted hover:text-white uppercase tracking-wider">
              See discography
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {moreByArtist.map((a) => (
              <AlbumCard key={a.id} album={a} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}