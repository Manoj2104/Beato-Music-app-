import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Track } from '@/types';
import { socketManager } from '@/lib/socket';
import { useAuthStore } from './authStore';
import { useMusicStore } from './musicStore';
import toast from 'react-hot-toast';

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
  songsPlayedCount: number;
  skipTimestamps: number[];
  prevSongTimestamps: number[];
  adsConfig: any;
  
  // Actions
  setCurrentTrack: (track: Track) => void;
  setQueue: (tracks: Track[]) => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (trackId: string) => void;
  playNext: (isManual?: boolean) => void;
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
  setAdsConfig: (config: any) => void;
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
      songsPlayedCount: 0,
      skipTimestamps: [],
      prevSongTimestamps: [],
      adsConfig: null,

      setCurrentTrack: (track) => set({ currentTrack: track, progress: 0 }),
      
      setQueue: (tracks) => set({ queue: tracks }),
      
      addToQueue: (track) => set((state) => ({ queue: [...state.queue, track] })),
      
      removeFromQueue: (trackId) =>
         set((state) => ({ queue: state.queue.filter((t) => t.id !== trackId) })),
      
      playNext: (isManual = false) => {
        const { queue, currentTrack, history, shuffle: stateShuffle, repeat, originalQueue, progress, duration } = get();
        const user = useAuthStore.getState().user;
        const isFree = user?.subscription === 'free';
        const shuffle = isFree ? false : stateShuffle;
        const wasAd = currentTrack?.isAd === true;

        if (isManual && currentTrack && !currentTrack.isAd) {
          const isEarlySkip = progress < 20 || (duration > 0 && (progress / duration) < 0.3);
          if (isEarlySkip) {
            useMusicStore.getState().recordSkip(currentTrack.id);
          }
        }

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

            const adsConfig = get().adsConfig;
            const audioAdEnabled = adsConfig?.audioAd?.enabled ?? true;
            const frequency = adsConfig?.audioAd?.frequencyTracks ?? 3;
            const adAudioUrl = adsConfig?.audioAd?.audioUrl || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3';
            const adCutoff = adsConfig?.audioAd?.durationSeconds ?? 15;

            if (isFree && !wasAd && audioAdEnabled) {
              const newPlayCount = get().songsPlayedCount + 1;
              set({ songsPlayedCount: newPlayCount });
              if (newPlayCount % frequency === 0) {
                const adTrack = {
                  id: 'ad-' + Date.now(),
                  title: 'Sponsored Advertisement',
                  artistId: 'ad-artist',
                  artist_name: 'Beato Sponsor',
                  artistName: 'Beato Sponsor',
                  album_id: 'ad-album',
                  album_name: 'Ad Break',
                  cover_image: 'https://images.unsplash.com/photo-1543536448-d209d2d13a1c?w=400&h=400&fit=crop',
                  coverImage: 'https://images.unsplash.com/photo-1543536448-d209d2d13a1c?w=400&h=400&fit=crop',
                  duration: adCutoff,
                  audio_url: adAudioUrl,
                  audioUrl: adAudioUrl,
                  genre: 'Ad',
                  year: 2026,
                  plays: 0,
                  liked: false,
                  explicit: false,
                  status: 'approved',
                  featured: false,
                  isAd: true
                } as any;
                const newHistory = currentTrack ? [currentTrack, ...history.slice(0, 49)] : history;
                set({ currentTrack: adTrack, queue: [nextTrack, ...newQueue], history: newHistory, progress: 0, isPlaying: true });
                toast.success("Playing Sponsored Ad 📢");
                return;
              }
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

        const adsConfig = get().adsConfig;
        const audioAdEnabled = adsConfig?.audioAd?.enabled ?? true;
        const frequency = adsConfig?.audioAd?.frequencyTracks ?? 3;
        const adAudioUrl = adsConfig?.audioAd?.audioUrl || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3';
        const adCutoff = adsConfig?.audioAd?.durationSeconds ?? 15;

        if (isFree && !wasAd && audioAdEnabled) {
          const newPlayCount = get().songsPlayedCount + 1;
          set({ songsPlayedCount: newPlayCount });
          if (newPlayCount % frequency === 0) {
            const adTrack = {
              id: 'ad-' + Date.now(),
              title: 'Sponsored Advertisement',
              artistId: 'ad-artist',
              artist_name: 'Beato Sponsor',
              artistName: 'Beato Sponsor',
              album_id: 'ad-album',
              album_name: 'Ad Break',
              cover_image: 'https://images.unsplash.com/photo-1543536448-d209d2d13a1c?w=400&h=400&fit=crop',
              coverImage: 'https://images.unsplash.com/photo-1543536448-d209d2d13a1c?w=400&h=400&fit=crop',
              duration: adCutoff,
              audio_url: adAudioUrl,
              audioUrl: adAudioUrl,
              genre: 'Ad',
              year: 2026,
              plays: 0,
              liked: false,
              explicit: false,
              status: 'approved',
              featured: false,
              isAd: true
            } as any;
            const newHistory = currentTrack ? [currentTrack, ...history.slice(0, 49)] : history;
            set({ currentTrack: adTrack, queue: [nextTrack, ...newQueue], history: newHistory, progress: 0, isPlaying: true });
            toast.success("Playing Sponsored Ad 📢");
            return;
          }
        }

        const newHistory = currentTrack ? [currentTrack, ...history.slice(0, 49)] : history;
        set({ currentTrack: nextTrack, queue: newQueue, history: newHistory, progress: 0, isPlaying: true });
      },
      
      playPrevious: () => {
        const user = useAuthStore.getState().user;
        const isFree = user?.subscription === 'free';
        if (isFree) {
          const now = Date.now();
          const oneHourAgo = now - 3600000;
          const { prevSongTimestamps } = get();
          const validPrevSongs = prevSongTimestamps.filter(t => t > oneHourAgo);
          
          if (validPrevSongs.length >= 10) {
            toast.error("You've reached your hourly skip backward limit! Upgrade to Premium for unlimited skip backwards. 💎");
            return;
          }
          set({ prevSongTimestamps: [...validPrevSongs, now] });
        }

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
      
      toggleShuffle: () => {
        const user = useAuthStore.getState().user;
        const isFree = user?.subscription === 'free';
        if (isFree) {
          toast.error("Shuffle mode is disabled for Free users. Upgrade to Premium to toggle Shuffle! 💎");
          return;
        }
        set((state) => ({ shuffle: !state.shuffle }));
      },
      
      cycleRepeat: () =>
        set((state) => ({
          repeat: state.repeat === 'none' ? 'all' : state.repeat === 'all' ? 'one' : 'none',
        })),
      
      setCrossfade: (val) => set({ crossfade: val }),
      
      toggleQueue: () => set((state) => ({ showQueue: !state.showQueue })),
      
      toggleLyrics: () => set((state) => ({ showLyrics: !state.showLyrics })),
      
      setSleepTimer: (mins) => set({ sleepTimer: mins }),
      setAdsConfig: (config) => set({ adsConfig: config }),
      
      playTrack: (track, queue = []) => {
        const { currentTrack, history, city, country, shuffle: stateShuffle, progress, duration } = get();
        const user = useAuthStore.getState().user;
        const isFree = user?.subscription === 'free';
        const shuffle = isFree ? false : stateShuffle;
        const isMobile = typeof window !== 'undefined' && /Mobi|Android|iPhone/i.test(navigator.userAgent);

        if (currentTrack && !currentTrack.isAd) {
          const isEarlySkip = progress < 20 || (duration > 0 && (progress / duration) < 0.3);
          if (isEarlySkip) {
            useMusicStore.getState().recordSkip(currentTrack.id);
          }
        }
        
        let targetTrack = track;
        let finalQueue = queue;

        const newHistory = currentTrack ? [currentTrack, ...history.slice(0, 49)] : history;
        
        // Find index of the clicked track in the playlist/queue context
        const trackIdx = finalQueue.findIndex((t) => t.id === targetTrack.id);
        
        let newQueue: Track[];
        if (shuffle) {
          // If shuffle is active, shuffle the remaining tracks in the list
          newQueue = finalQueue.filter((t) => t.id !== targetTrack.id).sort(() => Math.random() - 0.5);
        } else if (trackIdx !== -1) {
          // If shuffle is off, the next queue should be the subsequent tracks in the list
          newQueue = finalQueue.slice(trackIdx + 1);
        } else {
          newQueue = finalQueue.filter((t) => t.id !== targetTrack.id);
        }

        set({
          currentTrack: targetTrack,
          queue: newQueue,
          originalQueue: finalQueue,
          history: newHistory,
          isPlaying: true,
          progress: 0
        });
        
        // Record play to API for real-time stats (fire-and-forget)
        if (typeof window !== 'undefined' && targetTrack.artistId) {
          fetch('/api/track/play', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              trackId: targetTrack.id, 
              artistId: targetTrack.artistId, 
              duration: targetTrack.duration,
              device: isMobile ? 'Mobile App' : 'Web Player',
              city,
              country
            }),
          }).then(() => {
            socketManager?.emit('PLAY_COUNT_UPDATE', { trackId: targetTrack.id, artistId: targetTrack.artistId });
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
