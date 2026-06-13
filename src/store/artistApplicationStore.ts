import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ArtistApplication {
  id: string;
  userId: string;
  artistName: string;
  dob?: string;
  bio: string;
  country: string;
  profileImage: string;
  socialLinks: { instagram?: string; twitter?: string; website?: string };
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

interface ArtistApplicationStore {
  applications: ArtistApplication[];
  loading: boolean;
  error: string | null;
  fetchApplications: () => Promise<void>;
  fetchUserApplication: () => Promise<void>;
  submitApplication: (
    userId: string,
    artistName: string,
    dob: string,
    bio: string,
    country: string,
    profileImage: string,
    socialLinks: { instagram?: string; twitter?: string; website?: string }
  ) => Promise<boolean>;
  approveApplication: (appId: string, upgradeUserRole: (userId: string) => void) => Promise<boolean>;
  rejectApplication: (appId: string) => Promise<boolean>;
  getApplicationByUserId: (userId: string) => ArtistApplication | undefined;
}

const INITIAL_APPLICATIONS: ArtistApplication[] = [];

export const useArtistApplicationStore = create<ArtistApplicationStore>()(
  persist(
    (set, get) => ({
      applications: INITIAL_APPLICATIONS,
      loading: false,
      error: null,

      fetchApplications: async () => {
        set({ loading: true, error: null });
        try {
          const res = await fetch('/api/admin/applications');
          const data = await res.json();
          if (data.success) {
            set({ applications: data.applications, loading: false });
          } else {
            set({ error: data.error || 'Failed to fetch applications', loading: false });
          }
        } catch (err) {
          set({ error: 'Network error fetching applications', loading: false });
        }
      },

      fetchUserApplication: async () => {
        set({ loading: true, error: null });
        try {
          const res = await fetch('/api/artist/apply');
          const data = await res.json();
          if (data.success) {
            const userApp = data.application;
            if (userApp) {
              set((state) => ({
                applications: [
                  userApp,
                  ...state.applications.filter((a) => a.id !== userApp.id && a.userId !== userApp.userId)
                ],
                loading: false
              }));
            } else {
              set({ loading: false });
            }
          } else {
            set({ error: data.error || 'Failed to fetch user application', loading: false });
          }
        } catch (err) {
          set({ error: 'Network error fetching user application', loading: false });
        }
      },

      submitApplication: async (userId, artistName, dob, bio, country, profileImage, socialLinks) => {
        set({ loading: true, error: null });
        try {
          const res = await fetch('/api/artist/apply', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, artistName, dob, bio, country, profileImage, socialLinks }),
          });
          const data = await res.json();
          if (data.success && data.application) {
            set((state) => ({
              applications: [
                data.application,
                ...state.applications.filter((a) => a.userId !== userId)
              ],
              loading: false
            }));
            return true;
          } else {
            set({ error: data.error || 'Failed to submit application', loading: false });
            throw new Error(data.error || 'Failed to submit application');
          }
        } catch (err: any) {
          set({ error: err.message || 'Network error submitting application', loading: false });
          throw err;
        }
      },

      approveApplication: async (appId, upgradeUserRole) => {
        const app = get().applications.find((a) => a.id === appId);
        if (!app) {
          set({ error: 'Application not found locally' });
          return false;
        }

        set({ loading: true, error: null });
        try {
          const res = await fetch('/api/admin/approve-artist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: app.userId, artistName: app.artistName, appId, action: 'approve' }),
          });
          const data = await res.json();
          if (data.success) {
            set((state) => ({
              applications: state.applications.map((a) =>
                a.id === appId ? { ...a, status: 'APPROVED' as const } : a
              ),
              loading: false
            }));
            // Upgrade user role in authStore
            upgradeUserRole(app.userId);
            return true;
          } else {
            set({ error: data.error || 'Failed to approve application on server', loading: false });
            throw new Error(data.error || 'Failed to approve application');
          }
        } catch (err: any) {
          set({ error: err.message || 'Network error during approval', loading: false });
          throw err;
        }
      },

      rejectApplication: async (appId) => {
        const app = get().applications.find((a) => a.id === appId);
        if (!app) {
          set({ error: 'Application not found locally' });
          return false;
        }

        set({ loading: true, error: null });
        try {
          const res = await fetch('/api/admin/approve-artist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: app.userId, artistName: app.artistName, appId, action: 'reject' }),
          });
          const data = await res.json();
          if (data.success) {
            set((state) => ({
              applications: state.applications.map((a) =>
                a.id === appId ? { ...a, status: 'REJECTED' as const } : a
              ),
              loading: false
            }));
            return true;
          } else {
            set({ error: data.error || 'Failed to reject application on server', loading: false });
            throw new Error(data.error || 'Failed to reject application');
          }
        } catch (err: any) {
          set({ error: err.message || 'Network error during rejection', loading: false });
          throw err;
        }
      },

      getApplicationByUserId: (userId) => {
        return get().applications.find((a) => a.userId === userId);
      },
    }),
    {
      name: 'beato-artist-applications',
      partialize: (state) => ({ applications: state.applications }),
    }
  )
);
