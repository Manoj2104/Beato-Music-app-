import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Track } from '@/types';
import { saveOfflineAudio, deleteOfflineAudio } from '@/lib/offlineDb';
import toast from 'react-hot-toast';

interface DownloadStore {
  downloadedTracks: Track[];
  downloadedTrackIds: string[];
  downloadingIds: string[];
  downloadProgress: Record<string, number>;
  
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
      downloadProgress: {},

      downloadTrack: async (track) => {
        const { downloadedTrackIds, downloadingIds } = get();
        if (downloadedTrackIds.includes(track.id) || downloadingIds.includes(track.id)) {
          return;
        }

        // Add to downloading and set initial progress
        set((state) => ({ 
          downloadingIds: [...state.downloadingIds, track.id],
          downloadProgress: { ...state.downloadProgress, [track.id]: 0 }
        }));
        
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
          
          const contentLength = response.headers.get('content-length');
          const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;
          
          const reader = response.body?.getReader();
          if (!reader) {
            // Fallback if reader is not available
            const blob = await response.blob();
            await saveOfflineAudio(track.id, blob);
          } else {
            let receivedLength = 0;
            const chunks = [];
            let lastReportedProgress = 0;
            
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              chunks.push(value);
              receivedLength += value.length;
              
              if (totalBytes > 0) {
                const realProgress = Math.round((receivedLength / totalBytes) * 100);
                if (realProgress > lastReportedProgress) {
                  lastReportedProgress = realProgress;
                  set((state) => ({
                    downloadProgress: { ...state.downloadProgress, [track.id]: Math.min(realProgress, 99) }
                  }));
                }
              } else {
                // No content-length: simulate progress up to 99% based on chunk sizes
                const simulated = Math.min(Math.round((receivedLength / (1024 * 1024 * 3.5)) * 100), 99);
                if (simulated > lastReportedProgress) {
                  lastReportedProgress = simulated;
                  set((state) => ({
                    downloadProgress: { ...state.downloadProgress, [track.id]: simulated }
                  }));
                }
              }
            }
            
            const chunksAll = new Uint8Array(receivedLength);
            let position = 0;
            for (let chunk of chunks) {
              chunksAll.set(chunk, position);
              position += chunk.length;
            }
            const blob = new Blob([chunksAll]);
            await saveOfflineAudio(track.id, blob);
          }
          
          // Complete! Remove from downloading and progress
          set((state) => {
            const nextProgress = { ...state.downloadProgress };
            delete nextProgress[track.id];
            return {
              downloadedTracks: [...state.downloadedTracks, track],
              downloadedTrackIds: [...state.downloadedTrackIds, track.id],
              downloadingIds: state.downloadingIds.filter((id) => id !== track.id),
              downloadProgress: nextProgress,
            };
          });
          
          toast.success(`"${track.title}" downloaded offline!`);
        } catch (error) {
          console.error(`Failed to download track ${track.id}:`, error);
          set((state) => {
            const nextProgress = { ...state.downloadProgress };
            delete nextProgress[track.id];
            return {
              downloadingIds: state.downloadingIds.filter((id) => id !== track.id),
              downloadProgress: nextProgress,
            };
          });
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
