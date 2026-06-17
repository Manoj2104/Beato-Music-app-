import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Track } from '@/types';
import { socketManager } from '@/lib/socket';

// ─── Genre Color Map ───────────────────────────────
export const GENRE_COLORS: Record<string, string> = {
  'Indie Electronic': '#a68a64',
  'Dream Pop': '#b89d7c',
  'Synth Wave': '#8c6c44',
  'Hip-Hop': '#b08850',
  'Electronic': '#937041',
  'Future Bass': '#7a5a30',
  'Pop': '#b08850',
  'R&B': '#4d3f35',
  'Dance Pop': '#ebdcb9',
  'Indie Rock': '#87786c',
  'Alternative': '#a18b76',
  'Ambient': '#c8bdad',
  'Techno': '#221a15',
  'Jazz': '#b08850',
  'Classical': '#8c6c44',
  'default': '#b08850',
};

// ─── Album art gradient generator ─────────────────
export function trackGradient(trackId: string): string {
  const colors = [
    ['#b08850', '#4d3f35'], // Gold to Espresso
    ['#ebdcb9', '#8c6c44'], // Cream to Latte
    ['#d4b285', '#221a15'], // Soft gold to Chocolate
    ['#f4eede', '#b08850'], // Warm latte to Gold
    ['#c8bdad', '#4d3f35'], // Sandstone to Espresso
    ['#ebdcb9', '#b08850'], // Cream to Gold
    ['#8c6c44', '#221a15'], // Latte to Chocolate
    ['#b08850', '#8c6c44'], // Gold to Latte
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
        // ⚡ Throttle: skip if already loaded & fetched < 20s ago
        if (typeof window !== 'undefined') {
          const now = Date.now();
          const existing = get().allTracks;
          const lastFetch = (window as any).__beatoLastTracksFetch ?? 0;
          if (existing.length > 0 && now - lastFetch < 20000) {
            return;
          }
          (window as any).__beatoLastTracksFetch = now;
        }
        try {
          // Resolve absolute URL for native/APK (static export) mode
          const isLocalFile = typeof window !== 'undefined' && (
            window.location.protocol === 'file:' || 
            window.location.protocol.startsWith('capacitor') || 
            (window.location.hostname === 'localhost' && window.location.port !== '3000' && window.location.port !== '3001')
          );
          const customApiUrl = typeof window !== 'undefined' ? window.localStorage.getItem('beato_api_url') : null;
          const apiBase = (isLocalFile || customApiUrl)
            ? (customApiUrl || 'https://beato-music-app.vercel.app').replace(/\/$/, '')
            : '';
          const res = await fetch(`${apiBase}/api/tracks`, { cache: 'no-store' });
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
