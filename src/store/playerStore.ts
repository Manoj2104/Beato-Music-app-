import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Track } from '@/types';
import { socketManager } from '@/lib/socket';

interface PlayerStore {
  currentTrack: Track | null;
  queue: Track[];
  originalQueue: Track[];
  history: Track[];
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  progress: number;
  duration: number;
  shuffle: boolean;
  repeat: 'none' | 'one' | 'all';
  crossfade: number;
  showQueue: boolean;
  showLyrics: boolean;
  sleepTimer: number | null;
  city: string;
  country: string;
  activeDevice: string;
  activeDeviceId: string;
  availableDevices: { id: string; label: string }[];
  
  // Actions
  setCurrentTrack: (track: Track) => void;
  setQueue: (tracks: Track[]) => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (trackId: string) => void;
  playNext: () => void;
  playPrevious: () => void;
  togglePlay: () => void;
  setIsPlaying: (val: boolean) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  setProgress: (progress: number) => void;
  setDuration: (duration: number) => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  setCrossfade: (val: number) => void;
  toggleQueue: () => void;
  toggleLyrics: () => void;
  setSleepTimer: (mins: number | null) => void;
  playTrack: (track: Track, queue?: Track[]) => void;
  clearQueue: () => void;
  setActiveDevice: (device: string) => void;
  setActiveDeviceId: (id: string) => void;
  setAvailableDevices: (devices: { id: string; label: string }[]) => void;
}

let cachedGeo: { city: string; country: string } | null = null;

if (typeof window !== 'undefined') {
  fetch('https://freeipapi.com/api/json')
    .then(res => {
      if (!res.ok) throw new Error('Failed to fetch geolocation on init');
      return res.json();
    })
    .then(geo => {
      cachedGeo = {
        city: geo.cityName || 'Chennai',
        country: geo.countryCode || 'IN'
      };
      usePlayerStore.setState({
        city: cachedGeo.city,
        country: cachedGeo.country
      });
    })
    .catch(() => {
      cachedGeo = { city: 'Chennai', country: 'IN' };
      usePlayerStore.setState({
        city: 'Chennai',
        country: 'IN'
      });
    });
}

export const usePlayerStore = create<PlayerStore>()(
  persist(
    (set, get) => ({
      currentTrack: null,
      queue: [],
      originalQueue: [],
      history: [],
      isPlaying: false,
      volume: 0.8,
      isMuted: false,
      progress: 0,
      duration: 0,
      shuffle: false,
      repeat: 'none',
      crossfade: 5,
      showQueue: false,
      showLyrics: false,
      sleepTimer: null,
      city: 'Chennai',
      country: 'IN',
      activeDevice: 'Web Player',
      activeDeviceId: 'default',
      availableDevices: [],

      setCurrentTrack: (track) => set({ currentTrack: track, progress: 0 }),
      
      setQueue: (tracks) => set({ queue: tracks }),
      
      addToQueue: (track) => set((state) => ({ queue: [...state.queue, track] })),
      
      removeFromQueue: (trackId) =>
         set((state) => ({ queue: state.queue.filter((t) => t.id !== trackId) })),
      
      playNext: () => {
        const { queue, currentTrack, history, shuffle, repeat, originalQueue } = get();
        
        if (queue.length === 0) {
          // If repeat is 'all' and we have an original queue, loop back to the beginning
          if (repeat === 'all' && originalQueue.length > 0) {
            let nextTrack: Track;
            let newQueue: Track[];
            if (shuffle) {
              const randomIdx = Math.floor(Math.random() * originalQueue.length);
              nextTrack = originalQueue[randomIdx];
              newQueue = originalQueue.filter((_, i) => i !== randomIdx);
            } else {
              [nextTrack, ...newQueue] = originalQueue;
            }
            const newHistory = currentTrack ? [currentTrack, ...history.slice(0, 49)] : history;
            set({ currentTrack: nextTrack, queue: newQueue, history: newHistory, progress: 0, isPlaying: true });
            return;
          }
          
          // Otherwise, stop playback at the end
          set({ isPlaying: false, progress: 0 });
          return;
        }

        let nextTrack: Track;
        let newQueue: Track[];
        if (shuffle) {
          const randomIdx = Math.floor(Math.random() * queue.length);
          nextTrack = queue[randomIdx];
          newQueue = queue.filter((_, i) => i !== randomIdx);
        } else {
          [nextTrack, ...newQueue] = queue;
        }
        const newHistory = currentTrack ? [currentTrack, ...history.slice(0, 49)] : history;
        set({ currentTrack: nextTrack, queue: newQueue, history: newHistory, progress: 0, isPlaying: true });
      },
      
      playPrevious: () => {
        const { history, currentTrack, queue } = get();
        if (history.length === 0) {
          set({ progress: 0 });
          return;
        }
        const [prevTrack, ...newHistory] = history;
        const newQueue = currentTrack ? [currentTrack, ...queue] : queue;
        set({ currentTrack: prevTrack, history: newHistory, queue: newQueue, progress: 0, isPlaying: true });
      },
      
      togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
      
      setIsPlaying: (val) => set({ isPlaying: val }),
      
      setVolume: (vol) => set({ volume: vol, isMuted: vol === 0 }),
      
      toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
      
      setProgress: (progress) => set({ progress }),
      
      setDuration: (duration) => set({ duration }),
      
      toggleShuffle: () => set((state) => ({ shuffle: !state.shuffle })),
      
      cycleRepeat: () =>
        set((state) => ({
          repeat: state.repeat === 'none' ? 'all' : state.repeat === 'all' ? 'one' : 'none',
        })),
      
      setCrossfade: (val) => set({ crossfade: val }),
      
      toggleQueue: () => set((state) => ({ showQueue: !state.showQueue })),
      
      toggleLyrics: () => set((state) => ({ showLyrics: !state.showLyrics })),
      
      setSleepTimer: (mins) => set({ sleepTimer: mins }),
      
      playTrack: (track, queue = []) => {
        const { currentTrack, history, city, country, shuffle } = get();
        const newHistory = currentTrack ? [currentTrack, ...history.slice(0, 49)] : history;
        
        // Find index of the clicked track in the playlist/queue context
        const trackIdx = queue.findIndex((t) => t.id === track.id);
        
        let newQueue: Track[];
        if (shuffle) {
          // If shuffle is active, shuffle the remaining tracks in the list
          newQueue = queue.filter((t) => t.id !== track.id).sort(() => Math.random() - 0.5);
        } else if (trackIdx !== -1) {
          // If shuffle is off, the next queue should be the subsequent tracks in the list
          newQueue = queue.slice(trackIdx + 1);
        } else {
          newQueue = queue.filter((t) => t.id !== track.id);
        }

        set({
          currentTrack: track,
          queue: newQueue,
          originalQueue: queue,
          history: newHistory,
          isPlaying: true,
          progress: 0,
        });
        
        // Record play to API for real-time stats (fire-and-forget)
        if (typeof window !== 'undefined' && track.artistId) {
          const isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);
          fetch('/api/track/play', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              trackId: track.id, 
              artistId: track.artistId, 
              duration: track.duration,
              device: isMobile ? 'Mobile App' : 'Web Player',
              city,
              country
            }),
          }).then(() => {
            socketManager?.emit('PLAY_COUNT_UPDATE', { trackId: track.id, artistId: track.artistId });
          }).catch(() => {}); // silent fail
        }
      },
      
      clearQueue: () => set({ queue: [] }),
      setActiveDevice: (device) => set({ activeDevice: device }),
      setActiveDeviceId: (id) => set({ activeDeviceId: id }),
      setAvailableDevices: (devices) => set({ availableDevices: devices }),
    }),
    {
      name: 'beato-player',
      partialize: (state) => ({
        volume: state.volume,
        shuffle: state.shuffle,
        repeat: state.repeat,
        crossfade: state.crossfade,
        activeDevice: state.activeDevice,
        activeDeviceId: state.activeDeviceId,
      }),
    }
  )
);
