import { create } from 'zustand';
import { Track } from '@/types';

interface RealtimeStore {
  liveListeners: Record<string, number>;
  trendingTrackIds: string[];
  activeUsers: number;
  newReleases: Track[];
  isSimulating: boolean;
  updateListenerCount: (trackId: string, count: number) => void;
  setTrending: (trackIds: string[]) => void;
  addNewRelease: (track: Track) => void;
  setActiveUsers: (count: number) => void;
  syncFromServer: () => Promise<void>;
  startSimulation: (trackIds: string[]) => void;
  stopSimulation: () => void;
}

let _intervalIds: ReturnType<typeof setInterval>[] = [];

export const useRealtimeStore = create<RealtimeStore>()((set, get) => ({
  liveListeners: {},
  trendingTrackIds: [],
  activeUsers: 0,
  newReleases: [],
  isSimulating: false,

  updateListenerCount: (trackId, count) =>
    set(state => ({ liveListeners: { ...state.liveListeners, [trackId]: count } })),

  setTrending: (trackIds) => set({ trendingTrackIds: trackIds }),

  addNewRelease: (track) =>
    set(state => ({ newReleases: [track, ...state.newReleases].slice(0, 20) })),

  setActiveUsers: (count) => set({ activeUsers: count }),

  syncFromServer: async () => {
    try {
      const res = await fetch(`/api/realtime/stats?t=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      if (!data.success || !data.stats) return;

      set({
        activeUsers: Number(data.stats.activeNow || 0),
        trendingTrackIds: (data.stats.topTracks || []).map((track: Track) => track.id).filter(Boolean),
        liveListeners: data.stats.liveTrackListeners || {},
      });
    } catch (error) {
      console.error('Failed to sync realtime data:', error);
    }
  },

  startSimulation: (trackIds) => {
    if (get().isSimulating || trackIds.length === 0) return;
    set({ isSimulating: true });

    // Deprecated compatibility hook: use server-sourced counts instead of fake drift.
    const initial: Record<string, number> = {};
    trackIds.forEach(id => { initial[id] = get().liveListeners[id] ?? 0; });
    set({ liveListeners: initial });
    get().syncFromServer();
    const serverInterval = setInterval(() => get().syncFromServer(), 15000);
    _intervalIds = [serverInterval];
  },

  stopSimulation: () => {
    _intervalIds.forEach(clearInterval);
    _intervalIds = [];
    set({ isSimulating: false });
  },
}));
