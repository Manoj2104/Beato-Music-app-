/**
 * Beato Real-Time Engine
 * Bridges local tab-to-tab broadcasting with Supabase Realtime Channels
 * enabling instant data synchronization across different devices.
 */
import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';

export type SocketEvent =
  | 'NEW_SONG'
  | 'NEW_ALBUM'
  | 'ARTIST_FOLLOWED'
  | 'LIVE_COUNT_UPDATE'
  | 'TRENDING_UPDATE'
  | 'NOTIFICATION'
  | 'PLAY_COUNT_UPDATE'
  | 'USER_JOINED'
  | 'UPLOAD_COMPLETE'
  | 'TRACK_STATUS_UPDATE'
  | 'NEW_COMMENT'
  | 'MERCH_SALE'
  | 'TICKET_SALE'
  | 'PLAYLIST_UPDATED'
  | 'ROLE_PERMISSION_UPDATE';

export interface SocketMessage {
  event: SocketEvent;
  payload: any;
  timestamp: number;
  id: string;
}

export type EventHandler = (payload: any) => void;

class SocketManager {
  private handlers: Map<SocketEvent, EventHandler[]> = new Map();
  private channel: BroadcastChannel | null = null;
  private supabaseClient: SupabaseClient | null = null;
  private supabaseChannel: RealtimeChannel | null = null;
  private initialized = false;
  private intervalIds: ReturnType<typeof setInterval>[] = [];
  private isSimulating = false;

  private init() {
    if (this.initialized) return;
    this.initialized = true;

    if (typeof window !== 'undefined') {
      // 1. Setup local browser tab broadcasting
      try {
        this.channel = new BroadcastChannel('beato-realtime');
        this.channel.onmessage = (event: MessageEvent<SocketMessage>) => {
          this.dispatch(event.data.event, event.data.payload);
        };
      } catch {
        this.channel = null;
      }

      // 2. Setup global cloud broadcasting using Supabase Realtime Channels
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

      if (url && key) {
        try {
          this.supabaseClient = createClient(url, key);
          this.supabaseChannel = this.supabaseClient.channel('beato-realtime', {
            config: {
              broadcast: { self: false } // Don't broadcast to our own client connection
            }
          });

          this.supabaseChannel
            .on('broadcast', { event: '*' }, (response) => {
              const eventName = response.event as SocketEvent;
              this.dispatch(eventName, response.payload);
            })
            .subscribe((status) => {
              if (status === 'SUBSCRIBED') {
                console.log('Successfully connected to Supabase Realtime Channel!');
              }
            });
        } catch (e) {
          console.error('Failed to initialize Supabase Realtime client:', e);
        }
      }
    }
  }

  on(event: SocketEvent, handler: EventHandler): () => void {
    this.init();
    if (!this.handlers.has(event)) this.handlers.set(event, []);
    this.handlers.get(event)!.push(handler);
    return () => this.off(event, handler);
  }

  off(event: SocketEvent, handler: EventHandler): void {
    const handlers = this.handlers.get(event) ?? [];
    this.handlers.set(event, handlers.filter(h => h !== handler));
  }

  emit(event: SocketEvent, payload: any): void {
    this.init();
    const message: SocketMessage = {
      event, payload,
      timestamp: Date.now(),
      id: Math.random().toString(36).slice(2),
    };
    
    // Dispatch locally in the current tab
    this.dispatch(event, payload);
    
    // Broadcast to other tabs in the same browser
    try { 
      this.channel?.postMessage(message); 
    } catch { /* ignore */ }

    // Broadcast to other devices connected to Supabase Cloud
    try {
      this.supabaseChannel?.send({
        type: 'broadcast',
        event,
        payload
      });
    } catch (e) {
      console.error('Failed to broadcast event to Supabase Realtime:', e);
    }
  }

  private dispatch(event: SocketEvent, payload: any): void {
    const handlers = this.handlers.get(event) ?? [];
    handlers.forEach(h => { try { h(payload); } catch { /* ignore */ } });
  }

  startSimulation(tracks: string[]): void {
    if (this.isSimulating) return;
    this.isSimulating = true;

    // Simulate live listener counts
    const liveCounts: Record<string, number> = {};
    tracks.forEach(id => { liveCounts[id] = Math.floor(Math.random() * 5000 + 100); });

    const listenerInterval = setInterval(() => {
      const trackId = tracks[Math.floor(Math.random() * tracks.length)];
      const delta = Math.floor(Math.random() * 40) - 15; // -15 to +25
      liveCounts[trackId] = Math.max(0, (liveCounts[trackId] ?? 100) + delta);
      this.emit('LIVE_COUNT_UPDATE', { trackId, count: liveCounts[trackId] });
    }, 5000);

    // Simulate trending updates
    const trendingInterval = setInterval(() => {
      const shuffled = [...tracks].sort(() => Math.random() - 0.5).slice(0, 10);
      this.emit('TRENDING_UPDATE', { trackIds: shuffled });
    }, 25000);

    // Simulate random notifications
    const notifMessages = [
      { type: 'new_release', message: 'Aurora Nightfall released a new album: "Eclipse Dreams"' },
      { type: 'trending', message: '"Midnight Cascade" is now trending in India 🇮🇳' },
      { type: 'system', message: 'Your Weekly Discover playlist has been updated!' },
      { type: 'new_release', message: 'Cipher Nova dropped a new single: "Binary Pulse"' },
      { type: 'trending', message: '"Stellar Drift" just hit 1M streams! 🎉' },
    ];

    const notifInterval = setInterval(() => {
      const notif = notifMessages[Math.floor(Math.random() * notifMessages.length)];
      this.emit('NOTIFICATION', { ...notif, id: Math.random().toString(36).slice(2), timestamp: Date.now(), read: false });
    }, 45000);

    this.intervalIds = [listenerInterval, trendingInterval, notifInterval];
  }

  stopSimulation(): void {
    this.intervalIds.forEach(clearInterval);
    this.intervalIds = [];
    this.isSimulating = false;
  }

  destroy(): void {
    this.stopSimulation();
    try { this.channel?.close(); } catch { /* ignore */ }
    try { this.supabaseChannel?.unsubscribe(); } catch { /* ignore */ }
  }
}

export const socketManager = typeof window !== 'undefined' ? new SocketManager() : null as unknown as SocketManager;
