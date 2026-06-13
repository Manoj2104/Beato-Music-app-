import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Track } from '@/types';
import { socketManager } from '@/lib/socket';

// ─── Genre Color Map ───────────────────────────────
export const GENRE_COLORS: Record<string, string> = {
  'Indie Electronic': '#10b981',
  'Dream Pop': '#34d399',
  'Synth Wave': '#14b8a6',
  'Hip-Hop': '#84cc16',
  'Electronic': '#059669',
  'Future Bass': '#22c55e',
  'Pop': '#1db954',
  'R&B': '#4d7c0f',
  'Dance Pop': '#a3e635',
  'Indie Rock': '#4f6357',
  'Alternative': '#6b8e23',
  'Ambient': '#0f766e',
  'Techno': '#022c22',
  'Jazz': '#16a34a',
  'Classical': '#15803d',
  'default': '#1db954',
};

// ─── Album art gradient generator ─────────────────
export function trackGradient(trackId: string): string {
  const colors = [
    ['#1db954', '#064e3b'],
    ['#10b981', '#064e3b'],
    ['#34d399', '#022c22'],
    ['#84cc16', '#14532d'],
    ['#a3e635', '#0f5132'],
    ['#059669', '#022c22'],
    ['#06b6d4', '#0f766e'],
    ['#22c55e', '#14532d'],
  ];
  const idx = trackId.charCodeAt(trackId.length - 1) % colors.length;
  return `linear-gradient(135deg, ${colors[idx][0]}, ${colors[idx][1]})`;
}

export interface UploadedTrack extends Track {
  uploadedBy: string;
  uploadedAt: string;
  file?: string; // base64 or blob URL
  isNew?: boolean;
  status?: 'pending' | 'approved' | 'rejected';
}

interface MusicStore {
  // All database-backed tracks
  allTracks: Track[];
  uploadedTracks: UploadedTrack[];
  recentlyPlayed: Track[];
  listeningHistory: { trackId: string; timestamp: number; genre: string }[];
  activeArtistIds: string[];

  // Genre preference scores (computed from history)
  genreScores: Record<string, number>;

  // Actions
  uploadTrack: (track: UploadedTrack) => void;
  removeUploadedTrack: (trackId: string) => void;
  approveTrack: (trackId: string) => void;
  rejectTrack: (trackId: string) => void;
  syncTrackStatus: (trackId: string, status: 'approved' | 'rejected' | 'pending') => void;
  fetchTracks: () => Promise<void>;
  addToRecentlyPlayed: (track: Track) => void;
  recordListen: (track: Track) => void;
  getAllTracks: () => Track[];
  getForYouTracks: () => Track[];
  getTrendingTracks: () => Track[];
}

export const useMusicStore = create<MusicStore>()(
  persist(
    (set, get) => ({
      allTracks: [],
      uploadedTracks: [],
      recentlyPlayed: [],
      listeningHistory: [],
      genreScores: {},
      activeArtistIds: ['artist-1', 'artist-2', 'artist-3', 'artist-4', 'artist-5', 'artist-6'],

      uploadTrack: (track) =>
        set((state) => ({
          uploadedTracks: [{ ...track, status: 'pending', isNew: true }, ...state.uploadedTracks],
          allTracks: [{ ...track, status: 'pending' }, ...state.allTracks],
        })),

      removeUploadedTrack: (trackId) =>
        set((state) => ({
          uploadedTracks: state.uploadedTracks.filter((t) => t.id !== trackId),
          allTracks: state.allTracks.filter((t) => t.id !== trackId),
        })),

      approveTrack: (trackId) =>
        set((state) => {
          // Emit socket event for other tabs to update in real-time
          if (typeof window !== 'undefined' && socketManager) {
            socketManager.emit('TRACK_STATUS_UPDATE', { trackId, status: 'approved' });
          }
          return {
            uploadedTracks: state.uploadedTracks.map((t) =>
              t.id === trackId ? { ...t, status: 'approved' } : t
            ),
            allTracks: state.allTracks.map((t) =>
              t.id === trackId ? { ...t, status: 'approved' } : t
            ),
          };
        }),

      rejectTrack: (trackId) =>
        set((state) => {
          // Emit socket event for other tabs to update in real-time
          if (typeof window !== 'undefined' && socketManager) {
            socketManager.emit('TRACK_STATUS_UPDATE', { trackId, status: 'rejected' });
          }
          return {
            uploadedTracks: state.uploadedTracks.map((t) =>
              t.id === trackId ? { ...t, status: 'rejected' } : t
            ),
            allTracks: state.allTracks.map((t) =>
              t.id === trackId ? { ...t, status: 'rejected' } : t
            ),
          };
        }),

      syncTrackStatus: (trackId, status) =>
        set((state) => ({
          uploadedTracks: state.uploadedTracks.map((t) =>
            t.id === trackId ? { ...t, status } : t
          ),
          allTracks: state.allTracks.map((t) =>
            t.id === trackId ? { ...t, status } : t
          ),
        })),

      fetchTracks: async () => {
        try {
          // Resolve absolute URL for native/APK (static export) mode
          const isLocalFile = typeof window !== 'undefined' && (
            window.location.protocol === 'file:' || 
            window.location.protocol.startsWith('capacitor') || 
            (window.location.hostname === 'localhost' && window.location.port !== '3000' && window.location.port !== '3001')
          );
          const customApiUrl = typeof window !== 'undefined' ? window.localStorage.getItem('beato_api_url') : null;
          const apiBase = (isLocalFile || customApiUrl)
            ? (customApiUrl || 'http://192.168.1.7:3000').replace(/\/$/, '')
            : '';
          const res = await fetch(`${apiBase}/api/tracks?t=${Date.now()}`, { cache: 'no-store' });
          const data = await res.json();
          if (data.success) {
          const dbTracks = data.tracks.filter((t: Track) => t.status !== 'rejected');
            set({
              allTracks: data.tracks,
              uploadedTracks: dbTracks,
              activeArtistIds: data.activeArtistIds || [],
            });
          }
        } catch (e) {
          console.error('Failed to fetch tracks from server:', e);
        }
      },

      addToRecentlyPlayed: (track) =>
        set((state) => ({
          recentlyPlayed: [
            track,
            ...state.recentlyPlayed.filter((t) => t.id !== track.id).slice(0, 49),
          ],
        })),

      recordListen: (track) =>
        set((state) => {
          // Increment plays in allTracks and uploadedTracks
          const allTracks = state.allTracks.map((t) =>
            t.id === track.id ? { ...t, plays: (t.plays || 0) + 1 } : t
          );
          const uploadedTracks = state.uploadedTracks.map((t) =>
            t.id === track.id ? { ...t, plays: (t.plays || 0) + 1 } : t
          );

          // Update genre scores
          const scores = { ...state.genreScores };
          scores[track.genre] = (scores[track.genre] || 0) + 1;
          // Update history
          const history = [
            { trackId: track.id, timestamp: Date.now(), genre: track.genre },
            ...state.listeningHistory.slice(0, 499),
          ];
          return { allTracks, uploadedTracks, genreScores: scores, listeningHistory: history };
        }),

      getAllTracks: () => {
        const { uploadedTracks, allTracks, activeArtistIds } = get();
        // Merge, keeping uploaded at top
        const baseIds = new Set(allTracks.map((t) => t.id));
        const extras = uploadedTracks.filter((t) => !baseIds.has(t.id));
        const merged = [...extras, ...allTracks];
        return merged.filter((t) => {
          const status = t.status || (t.id.startsWith('track-uploaded') ? 'pending' : 'approved');
          const isApproved = status === 'approved';
          if (!isApproved) return false;
          
          // Verify that the artist of the track is active/exists
          if (activeArtistIds && activeArtistIds.length > 0) {
            return activeArtistIds.includes(t.artistId);
          }
          return true;
        });
      },

      getForYouTracks: () => {
        const { genreScores } = get();
        const all = get().getAllTracks();
        // Sort by genre score
        return [...all].sort((a, b) => {
          const sa = genreScores[a.genre] || 0;
          const sb = genreScores[b.genre] || 0;
          return sb - sa;
        }).slice(0, 20);
      },

      getTrendingTracks: () => {
        return get().getAllTracks().sort((a, b) => b.plays - a.plays).slice(0, 20);
      },
    }),
    {
      name: 'beato-music',
      partialize: (state) => ({
        uploadedTracks: state.uploadedTracks,
        recentlyPlayed: state.recentlyPlayed,
        listeningHistory: state.listeningHistory,
        genreScores: state.genreScores,
        activeArtistIds: state.activeArtistIds,
      }),
    }
  )
);

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === 'beato-music') {
      useMusicStore.persist.rehydrate();
    }
  });
}
