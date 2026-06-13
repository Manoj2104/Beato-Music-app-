import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type NotifType = 'new_release' | 'new_follower' | 'trending' | 'system' | 'upload_complete' | 'like';

export interface AppNotification {
  id: string;
  type: NotifType;
  message: string;
  artistName?: string;
  trackTitle?: string;
  read: boolean;
  timestamp: number;
  avatar?: string;
}

interface NotificationStore {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (n: Omit<AppNotification, 'id' | 'read' | 'timestamp'>) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clearAll: () => void;
}

const INITIAL: AppNotification[] = [
  { id: 'n1', type: 'new_release', message: 'Aurora Nightfall released "Eclipse Dreams"', artistName: 'Aurora Nightfall', read: false, timestamp: Date.now() - 120000 },
  { id: 'n2', type: 'trending', message: '"Midnight Cascade" is trending #1 in India 🇮🇳', trackTitle: 'Midnight Cascade', read: false, timestamp: Date.now() - 300000 },
  { id: 'n3', type: 'system', message: 'Your Discover Weekly has been updated with 30 new tracks!', read: true, timestamp: Date.now() - 3600000 },
  { id: 'n4', type: 'new_follower', message: 'Cipher Nova is now following you', artistName: 'Cipher Nova', read: true, timestamp: Date.now() - 7200000 },
  { id: 'n5', type: 'like', message: 'Your playlist "Chill Vibes" got 12 new likes', read: true, timestamp: Date.now() - 86400000 },
];

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set) => ({
      notifications: INITIAL,
      unreadCount: INITIAL.filter(n => !n.read).length,

      addNotification: (n) => set((state) => {
        const newN: AppNotification = { ...n, id: `n-${Date.now()}`, read: false, timestamp: Date.now() };
        const notifications = [newN, ...state.notifications].slice(0, 50);
        return { notifications, unreadCount: notifications.filter(x => !x.read).length };
      }),

      markRead: (id) => set((state) => {
        const notifications = state.notifications.map(n => n.id === id ? { ...n, read: true } : n);
        return { notifications, unreadCount: notifications.filter(x => !x.read).length };
      }),

      markAllRead: () => set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, read: true })),
        unreadCount: 0,
      })),

      clearAll: () => set({ notifications: [], unreadCount: 0 }),
    }),
    { name: 'beato-notifications' }
  )
);
