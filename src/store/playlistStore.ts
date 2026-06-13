import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CustomPlaylist {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  ownerId: string;
  ownerName: string;
  tracks: string[];
  totalTracks: number;
  duration: number;
  isPublic: boolean;
  isCollaborative: boolean;
  followers: number;
  createdAt: string;
  updatedAt: string;
  gradientCss?: string;
  tags?: string[];
}

interface PlaylistStore {
  customPlaylists: CustomPlaylist[];
  addPlaylist: (playlist: CustomPlaylist) => void;
  removePlaylist: (id: string) => void;
  addTrackToPlaylist: (playlistId: string, trackId: string) => void;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => void;
  setCustomPlaylists: (playlists: CustomPlaylist[]) => void;
  syncFromCloud: (userId: string) => Promise<void>;
}

export const usePlaylistStore = create<PlaylistStore>()(
  persist(
    (set, get) => ({
      customPlaylists: [],
      
      addPlaylist: (playlist) => {
        set(state => ({ customPlaylists: [playlist, ...state.customPlaylists] }));
        // Sync to cloud in background
        fetch('/api/playlists', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(playlist)
        }).catch(err => console.error('Cloud playlist creation sync failed:', err));
      },

      removePlaylist: (id) => {
        set(state => ({ customPlaylists: state.customPlaylists.filter(p => p.id !== id) }));
        // Sync deletion in background
        fetch(`/api/playlists?id=${encodeURIComponent(id)}`, {
          method: 'DELETE'
        }).catch(err => console.error('Cloud playlist deletion sync failed:', err));
      },

      addTrackToPlaylist: (playlistId, trackId) => {
        const normId = decodeURIComponent(playlistId).replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        let updatedPlaylist: CustomPlaylist | null = null;
        
        set(state => {
          const updatedPlaylists = state.customPlaylists.map(p => {
            const pNorm = p.id.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
            if (pNorm === normId && !p.tracks.includes(trackId)) {
              const tracks = [...p.tracks, trackId];
              updatedPlaylist = { ...p, tracks, totalTracks: tracks.length, updatedAt: new Date().toISOString() };
              return updatedPlaylist;
            }
            return p;
          });
          return { customPlaylists: updatedPlaylists };
        });

        // Sync track addition to database
        if (updatedPlaylist) {
          fetch('/api/playlists', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedPlaylist)
          }).catch(err => console.error('Cloud playlist track-add sync failed:', err));
        }
      },

      removeTrackFromPlaylist: (playlistId, trackId) => {
        const normId = decodeURIComponent(playlistId).replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        let updatedPlaylist: CustomPlaylist | null = null;
        
        set(state => {
          const updatedPlaylists = state.customPlaylists.map(p => {
            const pNorm = p.id.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
            if (pNorm === normId) {
              const tracks = p.tracks.filter(id => id !== trackId);
              updatedPlaylist = { ...p, tracks, totalTracks: tracks.length, updatedAt: new Date().toISOString() };
              return updatedPlaylist;
            }
            return p;
          });
          return { customPlaylists: updatedPlaylists };
        });

        // Sync track removal to database
        if (updatedPlaylist) {
          fetch('/api/playlists', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedPlaylist)
          }).catch(err => console.error('Cloud playlist track-remove sync failed:', err));
        }
      },

      setCustomPlaylists: (playlists) => set({ customPlaylists: playlists }),

      syncFromCloud: async (userId: string) => {
        try {
          const res = await fetch(`/api/playlists?userId=${encodeURIComponent(userId)}`);
          const data = await res.json();
          if (data.success && data.playlists) {
            set({ customPlaylists: data.playlists });
          }
        } catch (err) {
          console.error('Failed to sync playlists from cloud database:', err);
        }
      }
    }),
    {
      name: 'beato-custom-playlists-store',
    }
  )
);
