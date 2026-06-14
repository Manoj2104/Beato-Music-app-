import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';
import { socketManager } from '@/lib/socket';
import { Capacitor } from '@capacitor/core';
import { Network } from '@capacitor/network';

const checkIsOffline = async (): Promise<boolean> => {
  if (typeof window === 'undefined') return false;
  if (Capacitor.isNativePlatform()) {
    try {
      const status = await Network.getStatus();
      return !status.connected;
    } catch (e) {
      console.warn('Capacitor Network.getStatus failed:', e);
    }
  }
  return navigator.onLine === false;
};

const DEFAULT_PREFERENCES = {
  autoplay: true,
  crossfade: 0,
  normalize: true,
  quality: 'high' as const,
  downloadQuality: 'high' as const,
  showExplicit: true,
  privateSession: false,
  language: 'en',
  theme: 'dark' as const,
};

const DEFAULT_STATS = {
  totalListeningTime: 0,
  topGenres: [],
  topArtists: [],
  topTracks: [],
  streaksCount: 0,
  discoverScore: 0,
};

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  login: (email: string, password: string, allowMockFallback?: boolean) => Promise<void>;
  loginWithSocial: (provider: string) => Promise<void>;
  signup: (name: string, email: string, password: string, confirmPassword: string) => Promise<void>;
  sendOtp: (phone: string) => Promise<{ success: boolean; message?: string; developmentSandboxCode?: string }>;
  verifyOtp: (phone: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
  initializeSession: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  upgradeToArtist: (userId: string) => void;
  toggleLikeSong: (trackId: string) => void;
  toggleFollowArtist: (artistId: string) => void;
  toggleSaveAlbum: (albumId: string) => void;
  toggleSavePlaylist: (playlistId: string) => void;
  isMobileDrawerOpen: boolean;
  setMobileDrawerOpen: (open: boolean) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      token: null,
      isLoading: false,
      isMobileDrawerOpen: false,
      setMobileDrawerOpen: (open) => set({ isMobileDrawerOpen: open }),

      login: async (email, password, allowMockFallback = false) => {
        set({ isLoading: true });
        try {
          let data;
          let isOk = false;
          try {
            const res = await fetch('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, password }),
            });
            isOk = res.ok;
            const text = await res.text();
            try {
              data = JSON.parse(text);
            } catch (jsonErr: any) {
              console.warn('Failed to parse API login response as JSON:', jsonErr, 'Raw Text:', text);
              const isOffline = await checkIsOffline();
              if (isOffline && allowMockFallback) {
                throw new Error('FALLBACK_TO_MOCK');
              }
              throw new Error(`Invalid server response: ${jsonErr.message}. Content: ${text.slice(0, 80)}`);
            }
          } catch (netErr: any) {
            if (netErr.message === 'FALLBACK_TO_MOCK' || netErr.message === 'Invalid server response. Please try again.') {
              throw netErr;
            }
            console.warn('Network error or offline during API login:', netErr);
            const isOffline = await checkIsOffline();
            if (isOffline && allowMockFallback) {
              throw new Error('FALLBACK_TO_MOCK');
            }
            throw new Error('Network error. Cannot reach API server. Please check connection.');
          }

          if (!isOk) {
            throw new Error(data?.error || 'Invalid credentials');
          }

          // Force-set session cookies on client-side for mobile WebView compatibility
          if (typeof document !== 'undefined' && data.token) {
            document.cookie = `beato-token=${data.token}; path=/; max-age=31536000; SameSite=Lax`;
            if (data.user && data.user.role) {
              document.cookie = `beato-role=${data.user.role}; path=/; max-age=31536000; SameSite=Lax`;
            }
          }

          set({
            user: data.user,
            isAuthenticated: true,
            token: data.token || 'secure-session-active',
          });
        } catch (error: any) {
          if (error.message === 'FALLBACK_TO_MOCK') {
            // Offline/Static build fallback
            // Determine role and user details based on email
            let role: 'USER' | 'ARTIST' | 'ADMIN' | 'SUPER_ADMIN' = 'USER';
            let name = email.split('@')[0];
            name = name.charAt(0).toUpperCase() + name.slice(1);

            if (email.includes('superadmin')) {
              role = 'SUPER_ADMIN';
            } else if (email.includes('admin')) {
              role = 'ADMIN';
            } else if (email.includes('artist')) {
              role = 'ARTIST';
            }

            const mockUser = {
              id: role === 'SUPER_ADMIN' ? 'superadmin-user-1' : role === 'ADMIN' ? 'admin-user-1' : role === 'ARTIST' ? 'artist-user-1' : `mock-user-${Date.now()}`,
              name,
              email,
              role,
              avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
              subscription: 'free' as const,
              country: 'IN',
              joinedAt: new Date().toISOString(),
              followers: 0,
              following: 0,
              likedSongs: [],
              savedAlbums: [],
              followedArtists: [],
              playlists: [],
              preferences: DEFAULT_PREFERENCES,
              stats: DEFAULT_STATS,
            };

            set({
              user: mockUser,
              isAuthenticated: true,
              token: 'mock-session-active',
            });
            return;
          }

          set({ user: null, isAuthenticated: false, token: null });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      loginWithSocial: async (provider) => {
        set({ isLoading: true });
        try {
          const email = 'manoj@beato.io';
          let data;
          let isOk = false;
          try {
            const res = await fetch('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, password: 'password' }),
            });
            isOk = res.ok;
            const text = await res.text();
            data = JSON.parse(text);
          } catch (err) {
            console.warn('Network error or offline during social login, using client fallback');
            throw new Error('FALLBACK_TO_MOCK');
          }

          if (!isOk) {
            throw new Error(data.error || 'Social login failed');
          }

          // Force-set session cookies on client-side for mobile WebView compatibility
          if (typeof document !== 'undefined' && data.token) {
            document.cookie = `beato-token=${data.token}; path=/; max-age=31536000; SameSite=Lax`;
            if (data.user && data.user.role) {
              document.cookie = `beato-role=${data.user.role}; path=/; max-age=31536000; SameSite=Lax`;
            }
          }

          set({
            user: data.user,
            isAuthenticated: true,
            token: data.token || 'secure-session-active',
          });
        } catch (error: any) {
          if (error.message === 'FALLBACK_TO_MOCK') {
            const mockUser = {
              id: 'user-1',
              name: 'Manoj Lastro',
              email: 'manoj@beato.io',
              role: 'USER' as const,
              avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
              subscription: 'free' as const,
              country: 'IN',
              joinedAt: new Date().toISOString(),
              followers: 120,
              following: 80,
              likedSongs: [],
              savedAlbums: [],
              followedArtists: [],
              playlists: [],
              preferences: DEFAULT_PREFERENCES,
              stats: DEFAULT_STATS,
            };
            set({
              user: mockUser,
              isAuthenticated: true,
              token: 'mock-session-active',
            });
            return;
          }
          set({ user: null, isAuthenticated: false, token: null });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      signup: async (name, email, password, confirmPassword) => {
        set({ isLoading: true });
        try {
          try {
            const res = await fetch('/api/auth/signup', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name, email, password, confirmPassword }),
            });

            const data = await res.json();
            if (!res.ok) {
              throw new Error(data.error || 'Signup failed');
            }
          } catch (err: any) {
            console.warn('Network error or offline during signup:', err);
            const isOffline = await checkIsOffline();
            if (isOffline) {
              throw new Error('You are offline. Please check your internet connection.');
            }
            throw new Error(err.message || 'Signup failed. Please try again.');
          }
        } finally {
          set({ isLoading: false });
        }
      },

      sendOtp: async (phone) => {
        set({ isLoading: true });
        try {
          let data;
          let isOk = false;
          try {
            const res = await fetch('/api/auth/whatsapp/send-otp', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ phone }),
            });
            isOk = res.ok;
            const text = await res.text();
            try {
              data = JSON.parse(text);
            } catch (jsonErr) {
              const isOffline = await checkIsOffline();
              if (isOffline) {
                throw new Error('FALLBACK_TO_MOCK');
              }
              throw new Error('Invalid server response. Please try again.');
            }
          } catch (err: any) {
            if (err.message === 'FALLBACK_TO_MOCK' || err.message === 'Invalid server response. Please try again.') {
              throw err;
            }
            console.warn('Network error or offline during sendOtp:', err);
            const isOffline = await checkIsOffline();
            if (isOffline) {
              throw new Error('FALLBACK_TO_MOCK');
            }
            throw new Error('Network error. Cannot reach API server. Please check connection.');
          }

          if (!isOk) {
            throw new Error(data?.error || 'Failed to send OTP');
          }
          return data;
        } catch (error: any) {
          if (error.message === 'FALLBACK_TO_MOCK') {
            return {
              success: true,
              developmentSandboxCode: '123456',
            };
          }
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      verifyOtp: async (phone, code) => {
        set({ isLoading: true });
        try {
          let data;
          let isOk = false;
          try {
            const res = await fetch('/api/auth/whatsapp/verify-otp', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ phone, code }),
            });
            isOk = res.ok;
            const text = await res.text();
            try {
              data = JSON.parse(text);
            } catch (jsonErr) {
              const isOffline = await checkIsOffline();
              if (isOffline) {
                throw new Error('FALLBACK_TO_MOCK');
              }
              throw new Error('Invalid server response. Please try again.');
            }
          } catch (err: any) {
            if (err.message === 'FALLBACK_TO_MOCK' || err.message === 'Invalid server response. Please try again.') {
              throw err;
            }
            console.warn('Network error or offline during verifyOtp:', err);
            const isOffline = await checkIsOffline();
            if (isOffline) {
              throw new Error('FALLBACK_TO_MOCK');
            }
            throw new Error('Network error. Cannot reach API server. Please check connection.');
          }

          if (!isOk) {
            throw new Error(data?.error || 'Invalid verification code');
          }

          // Force-set session cookies on client-side for mobile WebView compatibility
          if (typeof document !== 'undefined' && data.token) {
            document.cookie = `beato-token=${data.token}; path=/; max-age=31536000; SameSite=Lax`;
            if (data.user && data.user.role) {
              document.cookie = `beato-role=${data.user.role}; path=/; max-age=31536000; SameSite=Lax`;
            }
          }

          set({
            user: data.user,
            isAuthenticated: true,
            token: data.token || 'secure-session-active',
          });
        } catch (error: any) {
          if (error.message === 'FALLBACK_TO_MOCK') {
            if (code !== '123456' && code !== '000000') {
              throw new Error('Invalid verification code');
            }

            const mockUser = {
              id: `mock-otp-user-${Date.now()}`,
              name: 'Guest User',
              email: `${phone}@beato-guest.io`,
              role: 'USER' as const,
              phone,
              avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
              subscription: 'free' as const,
              country: 'IN',
              joinedAt: new Date().toISOString(),
              followers: 0,
              following: 0,
              likedSongs: [],
              savedAlbums: [],
              followedArtists: [],
              playlists: [],
              preferences: DEFAULT_PREFERENCES,
              stats: DEFAULT_STATS,
            };

            set({
              user: mockUser,
              isAuthenticated: true,
              token: 'mock-session-active',
            });
            return;
          }

          set({ user: null, isAuthenticated: false, token: null });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await fetch('/api/auth/logout', { method: 'POST' });
        } catch (e) {
          console.error('Logout error:', e);
        } finally {
          set({
            user: null,
            isAuthenticated: false,
            token: null,
            isLoading: false,
          });
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
      },

      initializeSession: async () => {
        try {
          const res = await fetch('/api/auth/me');
          const text = await res.text();
          let data;
          try {
            data = JSON.parse(text);
          } catch (e) {
            // Not a JSON response, keep whatever is in local storage (offline fallback)
            console.warn('API returned non-JSON response in initializeSession, keeping local session.');
            return;
          }

          if (res.ok && data.success) {
            set({
              user: data.user,
              isAuthenticated: true,
              token: data.token || get().token || 'secure-session-active',
            });
          } else {
            // Only clear the session if the server explicitly tells us the user is unauthorized (401 or 403)
            if (res.status === 401 || res.status === 403) {
              set({ user: null, isAuthenticated: false, token: null });
            }
          }
        } catch (e) {
          // Network error or offline: DO NOT clear the session! Just keep whatever is in local storage.
          console.warn('Network error or offline during session init, keeping persisted session:', e);
        }
      },

      updateUser: (updates) =>
        set((state) => {
          const newState: any = {
            user: state.user ? { ...state.user, ...updates } : null,
          };
          if ((updates as any).token) {
            newState.token = (updates as any).token;
          }
          return newState;
        }),

      upgradeToArtist: (userId) => {
        const currentUser = get().user;
        if (!currentUser) return;

        if (currentUser.id === userId || userId === 'user-1' || currentUser.email === 'manoj@beato.io') {
          const updatedUser = { ...currentUser, role: 'ARTIST' as const };
          
          if (typeof document !== 'undefined') {
            document.cookie = `beato-role=ARTIST; path=/; max-age=604800; SameSite=Lax`;
          }

          set({ user: updatedUser });
        }
      },

      toggleLikeSong: async (trackId) => {
        const currentUser = get().user;
        if (!currentUser) return;

        const liked = currentUser.likedSongs.includes(trackId)
          ? currentUser.likedSongs.filter((id) => id !== trackId)
          : [...currentUser.likedSongs, trackId];

        set({ user: { ...currentUser, likedSongs: liked } });

        try {
          await fetch('/api/user/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ likedSongs: liked }),
          });
        } catch (e) {
          console.error('Failed to sync liked songs:', e);
        }
      },

      toggleFollowArtist: async (artistId) => {
        const currentUser = get().user;
        if (!currentUser) return;

        const followed = currentUser.followedArtists.includes(artistId)
          ? currentUser.followedArtists.filter((id) => id !== artistId)
          : [...currentUser.followedArtists, artistId];

        set({ user: { ...currentUser, followedArtists: followed } });

        try {
          await fetch('/api/user/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ followedArtists: followed }),
          });
          
          // Emit socket update to update other tabs and screens in real-time
          if (socketManager) {
            socketManager.emit('ARTIST_FOLLOWED', { artistId });
          }
        } catch (e) {
          console.error('Failed to sync followed artists:', e);
        }
      },

      toggleSaveAlbum: async (albumId) => {
        const currentUser = get().user;
        if (!currentUser) return;

        const saved = currentUser.savedAlbums.includes(albumId)
          ? currentUser.savedAlbums.filter((id) => id !== albumId)
          : [...currentUser.savedAlbums, albumId];

        set({ user: { ...currentUser, savedAlbums: saved } });

        try {
          await fetch('/api/user/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ savedAlbums: saved }),
          });
        } catch (e) {
          console.error('Failed to sync saved albums:', e);
        }
      },

      toggleSavePlaylist: async (playlistId) => {
        const currentUser = get().user;
        if (!currentUser) return;

        const playlists = currentUser.playlists || [];
        const updatedPlaylists = playlists.includes(playlistId)
          ? playlists.filter((id) => id !== playlistId)
          : [...playlists, playlistId];

        set({ user: { ...currentUser, playlists: updatedPlaylists } });

        try {
          await fetch('/api/user/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playlists: updatedPlaylists }),
          });
        } catch (e) {
          console.error('Failed to sync playlists:', e);
        }
      },
    }),
    {
      name: 'beato-auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        token: state.token,
      }),
    }
  )
);

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === 'beato-auth') {
      useAuthStore.persist.rehydrate();
    }
  });
}
