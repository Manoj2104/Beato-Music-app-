/**
 * roomDb.ts — Supabase-backed Room Database
 * Replaces the local JSON file approach which doesn't work on Vercel (read-only filesystem).
 * All room data is stored in Supabase table: `jam_rooms`
 */

import { createClient } from '@supabase/supabase-js';

let rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
if (rawSupabaseUrl.includes('zizhqtpsamvsbymwxfyps')) {
  rawSupabaseUrl = rawSupabaseUrl.replace('zizhqtpsamvsbymwxfyps', 'zizhqtpsamvsbymwxfyp');
} else {
  const match = rawSupabaseUrl.match(/https:\/\/([a-z0-9]{20})s\.supabase\.co/i);
  if (match) rawSupabaseUrl = `https://${match[1]}.supabase.co`;
}

const supabaseUrl = rawSupabaseUrl;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const TABLE = 'jam_rooms';

export interface RoomParticipant {
  userId: string;
  name: string;
  avatar?: string;
  role: 'host' | 'guest';
  joinedAt: string;
  lastActive: string;
}

export interface RoomMessage {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  timestamp: string;
}

export interface RoomEntity {
  id: string;
  name: string;
  description?: string;
  hostId: string;
  hostName: string;
  createdAt: string;
  isActive: boolean;
  participants: RoomParticipant[];
  chatHistory: RoomMessage[];
  currentTrackId?: string;
  currentTrackPosition?: number;
  isPlaying?: boolean;
  updatedAt: string;
  queue: string[];
  isCollaborative: boolean;
  isLocked: boolean;
  password?: string;
}

// Helper: map Supabase row → RoomEntity
function rowToRoom(row: any): RoomEntity {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    hostId: row.host_id,
    hostName: row.host_name,
    createdAt: row.created_at,
    isActive: row.is_active,
    participants: row.participants || [],
    chatHistory: row.chat_history || [],
    currentTrackId: row.current_track_id,
    currentTrackPosition: row.current_track_position || 0,
    isPlaying: row.is_playing || false,
    updatedAt: row.updated_at,
    queue: row.queue || [],
    isCollaborative: row.is_collaborative || false,
    isLocked: row.is_locked || false,
    password: row.password,
  };
}

// Helper: generate random 5-char room ID
function generateId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = '';
  for (let i = 0; i < 5; i++) id += chars.charAt(Math.floor(Math.random() * chars.length));
  return id;
}

export const roomDb = {
  async getRooms(): Promise<RoomEntity[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    if (error) { console.error('getRooms error:', error); return []; }
    return (data || []).map(rowToRoom);
  },

  async getRoom(roomId: string): Promise<RoomEntity | null> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('id', roomId)
      .eq('is_active', true)
      .single();
    if (error || !data) return null;
    return rowToRoom(data);
  },

  async createRoom(
    name: string,
    description: string,
    hostId: string,
    hostName: string,
    hostAvatar?: string,
    isCollaborative = false,
    password?: string
  ): Promise<RoomEntity> {
    // Deactivate any existing rooms by this host
    await supabase
      .from(TABLE)
      .update({ is_active: false })
      .eq('host_id', hostId)
      .eq('is_active', true);

    // Generate unique ID
    let newId = generateId();
    // Check uniqueness
    const { data: existing } = await supabase.from(TABLE).select('id').eq('id', newId);
    while (existing && existing.length > 0) {
      newId = generateId();
    }

    const now = new Date().toISOString();
    const participants: RoomParticipant[] = [{
      userId: hostId,
      name: hostName,
      avatar: hostAvatar,
      role: 'host',
      joinedAt: now,
      lastActive: now,
    }];
    const chatHistory: RoomMessage[] = [{
      id: `msg-system-${Date.now()}`,
      userId: 'system',
      userName: 'Beato Bot',
      text: `🎵 Room "${name}" created! Share the link with friends to listen together.`,
      timestamp: now,
    }];

    const row = {
      id: newId,
      name: name || `${hostName}'s Listening Party`,
      description: description || 'Join my real-time sound session on Beato!',
      host_id: hostId,
      host_name: hostName,
      created_at: now,
      is_active: true,
      participants,
      chat_history: chatHistory,
      current_track_id: null,
      current_track_position: 0,
      is_playing: false,
      updated_at: now,
      queue: [],
      is_collaborative: isCollaborative,
      is_locked: false,
      password: password || null,
    };

    const { data, error } = await supabase.from(TABLE).insert(row).select().single();
    if (error) {
      console.error('createRoom error:', error);
      throw new Error(error.message);
    }
    return rowToRoom(data);
  },

  async joinRoom(roomId: string, user: { id: string; name: string; avatar?: string }): Promise<RoomEntity | null> {
    const room = await this.getRoom(roomId);
    if (!room) return null;

    const now = new Date().toISOString();
    const existing = room.participants.find(p => p.userId === user.id);
    let updatedParticipants: RoomParticipant[];
    let updatedChat = [...room.chatHistory];

    if (existing) {
      updatedParticipants = room.participants.map(p =>
        p.userId === user.id ? { ...p, lastActive: now } : p
      );
    } else {
      updatedParticipants = [
        ...room.participants,
        { userId: user.id, name: user.name, avatar: user.avatar, role: room.hostId === user.id ? 'host' : 'guest' as const, joinedAt: now, lastActive: now }
      ];
      updatedChat.push({
        id: `msg-system-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        userId: 'system',
        userName: 'Beato Bot',
        text: `👋 ${user.name} joined the room!`,
        timestamp: now,
      });
      // Cap chat history
      if (updatedChat.length > 100) updatedChat = updatedChat.slice(-100);
    }

    const { data, error } = await supabase
      .from(TABLE)
      .update({ participants: updatedParticipants, chat_history: updatedChat, updated_at: now })
      .eq('id', roomId)
      .select()
      .single();
    if (error) { console.error('joinRoom error:', error); return null; }
    return rowToRoom(data);
  },

  async leaveRoom(roomId: string, userId: string): Promise<RoomEntity | null> {
    const room = await this.getRoom(roomId);
    if (!room) return null;

    const participant = room.participants.find(p => p.userId === userId);
    if (!participant) return room;

    const now = new Date().toISOString();
    const updatedParticipants = room.participants.filter(p => p.userId !== userId);
    const updatedChat = [...room.chatHistory, {
      id: `msg-system-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      userId: 'system',
      userName: 'Beato Bot',
      text: `🚪 ${participant.name} left the room.`,
      timestamp: now,
    }];

    // If host leaves, close the room
    const isHostLeaving = room.hostId === userId;
    const isRoomEmpty = updatedParticipants.length === 0;

    const { data, error } = await supabase
      .from(TABLE)
      .update({
        participants: updatedParticipants,
        chat_history: updatedChat,
        is_active: !(isHostLeaving || isRoomEmpty),
        updated_at: now,
      })
      .eq('id', roomId)
      .select()
      .single();
    if (error) { console.error('leaveRoom error:', error); return null; }
    return rowToRoom(data);
  },

  async syncPlayback(
    roomId: string,
    currentTrackId: string | undefined,
    currentTrackPosition: number,
    isPlaying: boolean
  ): Promise<RoomEntity | null> {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from(TABLE)
      .update({
        current_track_id: currentTrackId || null,
        current_track_position: currentTrackPosition,
        is_playing: isPlaying,
        updated_at: now,
      })
      .eq('id', roomId)
      .eq('is_active', true)
      .select()
      .single();
    if (error) { console.error('syncPlayback error:', error); return null; }
    return rowToRoom(data);
  },

  async addChatMessage(
    roomId: string,
    userId: string,
    userName: string,
    userAvatar: string | undefined,
    text: string
  ): Promise<RoomEntity | null> {
    const room = await this.getRoom(roomId);
    if (!room) return null;

    const now = new Date().toISOString();
    const newMsg: RoomMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      userId, userName, userAvatar, text, timestamp: now,
    };

    let updatedChat = [...room.chatHistory, newMsg];
    if (updatedChat.length > 100) updatedChat = updatedChat.slice(-100);

    const { data, error } = await supabase
      .from(TABLE)
      .update({ chat_history: updatedChat, updated_at: now })
      .eq('id', roomId)
      .select()
      .single();
    if (error) { console.error('addChatMessage error:', error); return null; }
    return rowToRoom(data);
  },

  async updateQueue(roomId: string, queue: string[]): Promise<RoomEntity | null> {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from(TABLE)
      .update({ queue, updated_at: now })
      .eq('id', roomId)
      .eq('is_active', true)
      .select()
      .single();
    if (error) { console.error('updateQueue error:', error); return null; }
    return rowToRoom(data);
  },

  async toggleLock(roomId: string, lock: boolean): Promise<RoomEntity | null> {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from(TABLE)
      .update({ is_locked: lock, updated_at: now })
      .eq('id', roomId)
      .eq('is_active', true)
      .select()
      .single();
    if (error) { console.error('toggleLock error:', error); return null; }
    return rowToRoom(data);
  },

  async cleanupStaleRooms(): Promise<void> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { error } = await supabase
      .from(TABLE)
      .update({ is_active: false })
      .eq('is_active', true)
      .lt('created_at', oneDayAgo);
    if (error) console.error('cleanupStaleRooms error:', error);
  },
};
