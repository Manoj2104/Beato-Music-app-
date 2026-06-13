import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Track } from '@/types';
import { saveOfflineAudio, deleteOfflineAudio } from '@/lib/offlineDb';
import toast from 'react-hot-toast';

interface DownloadStore {
  downloadedTracks: Track[];
  downloadedTrackIds: string[];
  downloadingIds: string[];
  
  downloadTrack: (track: Track) => Promise<void>;
  removeDownloadedTrack: (trackId: string) => Promise<void>;
  isDownloaded: (trackId: string) => boolean;
  isDownloading: (trackId: string) => boolean;
}

export const useDownloadStore = create<DownloadStore>()(
  persist(
    (set, get) => ({
      downloadedTracks: [],
      downloadedTrackIds: [],
      downloadingIds: [],

      downloadTrack: async (track) => {
        const { downloadedTrackIds, downloadingIds } = get();
        if (downloadedTrackIds.includes(track.id) || downloadingIds.includes(track.id)) {
          return;
        }

        // Add to downloading
        set((state) => ({ downloadingIds: [...state.downloadingIds, track.id] }));
        
        try {
          let url = track.audioUrl;

          if (url.startsWith('http://') || url.startsWith('https://')) {
            // External URL — route through server proxy to bypass CORS
            const origin = typeof window !== 'undefined' ? window.location.origin : '';
            url = `${origin}/api/proxy-download?url=${encodeURIComponent(url)}`;
          } else if (url.startsWith('/') && typeof window !== 'undefined') {
            // Relative URL — resolve to absolute same-origin URL
            url = `${window.location.origin}${url}`;
          }

          const response = await fetch(url);
          if (!response.ok) throw new Error('Failed to fetch audio stream');
          const blob = await response.blob();
          
          // Save audio binary to IndexedDB
          await saveOfflineAudio(track.id, blob);
          
          // Save metadata
          set((state) => ({
            downloadedTracks: [...state.downloadedTracks, track],
            downloadedTrackIds: [...state.downloadedTrackIds, track.id],
            downloadingIds: state.downloadingIds.filter((id) => id !== track.id),
          }));
          
          toast.success(`"${track.title}" downloaded offline!`);
        } catch (error) {
          console.error(`Failed to download track ${track.id}:`, error);
          set((state) => ({
            downloadingIds: state.downloadingIds.filter((id) => id !== track.id),
          }));
          toast.error(`Failed to download "${track.title}"`);
        }
      },

      removeDownloadedTrack: async (trackId) => {
        try {
          await deleteOfflineAudio(trackId);
          set((state) => ({
            downloadedTracks: state.downloadedTracks.filter((t) => t.id !== trackId),
            downloadedTrackIds: state.downloadedTrackIds.filter((id) => id !== trackId),
          }));
          toast.success('Download removed');
        } catch (error) {
          console.error(`Failed to delete download for ${trackId}:`, error);
          toast.error('Failed to remove download');
        }
      },

      isDownloaded: (trackId) => {
        return get().downloadedTrackIds.includes(trackId);
      },

      isDownloading: (trackId) => {
        return get().downloadingIds.includes(trackId);
      },
    }),
    {
      name: 'beato-downloads',
      partialize: (state) => ({
        downloadedTracks: state.downloadedTracks,
        downloadedTrackIds: state.downloadedTrackIds,
      }),
    }
  )
);
