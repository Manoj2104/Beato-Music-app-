/**
 * roomDb.ts — Dual-mode Room Database (Supabase with automatic local JSON fallback)
 * Works persistently on Vercel using Supabase, and falls back to local file database
 * if the Supabase table is not found or not configured yet.
 */

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { getDbFilePath } from './dbPath';

const DB_FILE = getDbFilePath();

// --- Supabase Setup ---
let rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
if (rawSupabaseUrl.includes('zizhqtpsamvsbymwxfyps')) {
  rawSupabaseUrl = rawSupabaseUrl.replace('zizhqtpsamvsbymwxfyps', 'zizhqtpsamvsbymwxfyp');
} else {
  const match = rawSupabaseUrl.match(/https:\/\/([a-z0-9]{20})s\.supabase\.co/i);
  if (match) rawSupabaseUrl = `https://${match[1]}.supabase.co`;
}

const supabaseUrl = rawSupabaseUrl;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let supabase: any = null;
if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
  } catch (e) {
    console.error('Failed to initialize Supabase client for rooms:', e);
  }
}

const TABLE = 'jam_rooms';
let supabaseTableExists = true; // Automatically flips to false if PGRST205 is encountered

// --- Local File Database Helpers ---
function readDbRaw(): any {
  if (!fs.existsSync(DB_FILE)) {
    return {};
  }
  try {
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (e) {
    console.error('Failed to read database file for rooms:', e);
    return {};
  }
}

function writeDbRaw(data: any) {
  try {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to write database file for rooms:', e);
  }
}

function shouldUseLocal(): boolean {
  if (process.env.DATABASE_MODE === 'local') return true;
  if (!supabase || !supabaseUrl || !supabaseKey) return true;
  return !supabaseTableExists;
}

// --- Interfaces ---
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

// --- Room Database Implementation ---
export const roomDb = {
  // --- LOCAL IMPLEMENTATIONS ---
  local: {
    getRooms(): RoomEntity[] {
      const db = readDbRaw();
      return db.rooms || [];
    },

    getRoom(roomId: string): RoomEntity | null {
      const rooms = this.getRooms();
      return rooms.find(r => r.id === roomId && r.isActive) || null;
    },

    createRoom(
      name: string,
      description: string,
      hostId: string,
      hostName: string,
      hostAvatar?: string,
      isCollaborative = false,
      password?: string
    ): RoomEntity {
      const db = readDbRaw();
      const rooms = db.rooms || [];
      
      // Deactivate any previous active room hosted by the same user to avoid ghost rooms
      rooms.forEach((r: RoomEntity) => {
        if (r.hostId === hostId) {
          r.isActive = false;
        }
      });

      let newId = generateId();
      while (rooms.some((r: RoomEntity) => r.id === newId)) {
        newId = generateId();
      }

      const now = new Date().toISOString();
      const newRoom: RoomEntity = {
        id: newId,
        name: name || `${hostName}'s Listening Party`,
        description: description || 'Join my real-time sound session on Beato!',
        hostId,
        hostName,
        createdAt: now,
        isActive: true,
        participants: [
          {
            userId: hostId,
            name: hostName,
            avatar: hostAvatar,
            role: 'host',
            joinedAt: now,
            lastActive: now
          }
        ],
        chatHistory: [
          {
            id: `msg-system-${Date.now()}`,
            userId: 'system',
            userName: 'Beato Bot',
            text: `🎵 Room "${name}" created! Share the link with friends to listen together.`,
            timestamp: now
          }
        ],
        currentTrackId: undefined,
        currentTrackPosition: 0,
        isPlaying: false,
        updatedAt: now,
        queue: [],
        isCollaborative,
        isLocked: false,
        password
      };

      rooms.push(newRoom);
      db.rooms = rooms;
      writeDbRaw(db);
      return newRoom;
    },

    joinRoom(roomId: string, user: { id: string; name: string; avatar?: string }): RoomEntity | null {
      const db = readDbRaw();
      const rooms: RoomEntity[] = db.rooms || [];
      const idx = rooms.findIndex(r => r.id === roomId && r.isActive);
      if (idx === -1) return null;

      const room = rooms[idx];
      const existing = room.participants.find(p => p.userId === user.id);
      const nowStr = new Date().toISOString();

      if (existing) {
        existing.lastActive = nowStr;
      } else {
        room.participants.push({
          userId: user.id,
          name: user.name,
          avatar: user.avatar,
          role: room.hostId === user.id ? 'host' : 'guest',
          joinedAt: nowStr,
          lastActive: nowStr
        });
        room.chatHistory.push({
          id: `msg-system-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          userId: 'system',
          userName: 'Beato Bot',
          text: `👋 ${user.name} joined the room!`,
          timestamp: nowStr
        });
        if (room.chatHistory.length > 100) {
          room.chatHistory = room.chatHistory.slice(room.chatHistory.length - 100);
        }
      }

      db.rooms = rooms;
      writeDbRaw(db);
      return room;
    },

    leaveRoom(roomId: string, userId: string): RoomEntity | null {
      const db = readDbRaw();
      const rooms: RoomEntity[] = db.rooms || [];
      const idx = rooms.findIndex(r => r.id === roomId && r.isActive);
      if (idx === -1) return null;

      const room = rooms[idx];
      const participant = room.participants.find(p => p.userId === userId);
      if (!participant) return room;

      room.participants = room.participants.filter(p => p.userId !== userId);
      const nowStr = new Date().toISOString();
      room.chatHistory.push({
        id: `msg-system-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        userId: 'system',
        userName: 'Beato Bot',
        text: `🚪 ${participant.name} left the room.`,
        timestamp: nowStr
      });

      // Only deactivate if ALL participants have left (not just when host leaves)
      // Host re-entering the room should still work
      if (room.participants.length === 0) {
        room.isActive = false;
      }

      db.rooms = rooms;
      writeDbRaw(db);
      return room;
    },

    syncPlayback(roomId: string, currentTrackId: string | undefined, currentTrackPosition: number, isPlaying: boolean): RoomEntity | null {
      const db = readDbRaw();
      const rooms: RoomEntity[] = db.rooms || [];
      const idx = rooms.findIndex(r => r.id === roomId && r.isActive);
      if (idx === -1) return null;

      rooms[idx].currentTrackId = currentTrackId;
      rooms[idx].currentTrackPosition = currentTrackPosition;
      rooms[idx].isPlaying = isPlaying;
      rooms[idx].updatedAt = new Date().toISOString();

      db.rooms = rooms;
      writeDbRaw(db);
      return rooms[idx];
    },

    addChatMessage(roomId: string, userId: string, userName: string, userAvatar: string | undefined, text: string): RoomEntity | null {
      const db = readDbRaw();
      const rooms: RoomEntity[] = db.rooms || [];
      const idx = rooms.findIndex(r => r.id === roomId && r.isActive);
      if (idx === -1) return null;

      const room = rooms[idx];
      room.chatHistory.push({
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        userId,
        userName,
        userAvatar,
        text,
        timestamp: new Date().toISOString()
      });
      if (room.chatHistory.length > 100) {
        room.chatHistory = room.chatHistory.slice(room.chatHistory.length - 100);
      }

      db.rooms = rooms;
      writeDbRaw(db);
      return room;
    },

    updateQueue(roomId: string, queue: string[]): RoomEntity | null {
      const db = readDbRaw();
      const rooms: RoomEntity[] = db.rooms || [];
      const idx = rooms.findIndex(r => r.id === roomId && r.isActive);
      if (idx === -1) return null;

      rooms[idx].queue = queue;
      db.rooms = rooms;
      writeDbRaw(db);
      return rooms[idx];
    },

    toggleLock(roomId: string, lock: boolean): RoomEntity | null {
      const db = readDbRaw();
      const rooms: RoomEntity[] = db.rooms || [];
      const idx = rooms.findIndex(r => r.id === roomId && r.isActive);
      if (idx === -1) return null;

      rooms[idx].isLocked = lock;
      rooms[idx].updatedAt = new Date().toISOString();

      db.rooms = rooms;
      writeDbRaw(db);
      return rooms[idx];
    },

    cleanupStaleRooms() {
      const db = readDbRaw();
      const rooms: RoomEntity[] = db.rooms || [];
      let changed = false;
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

      rooms.forEach((r: RoomEntity) => {
        if (r.isActive) {
          const roomTime = new Date(r.createdAt).getTime();
          if (roomTime < oneDayAgo) {
            r.isActive = false;
            changed = true;
          }
        }
      });

      if (changed) {
        db.rooms = rooms;
        writeDbRaw(db);
      }
    },

    closeRoom(roomId: string): void {
      const db = readDbRaw();
      const rooms: RoomEntity[] = db.rooms || [];
      const idx = rooms.findIndex(r => r.id === roomId);
      if (idx !== -1) {
        rooms[idx].isActive = false;
        rooms[idx].updatedAt = new Date().toISOString();
        db.rooms = rooms;
        writeDbRaw(db);
      }
    },
  },

  // --- DUAL MODE PUBLIC APIS ---
  async getRooms(): Promise<RoomEntity[]> {
    if (shouldUseLocal()) {
      return this.local.getRooms();
    }
    try {
      const { data, error } = await supabase
        .from(TABLE)
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) {
        if (error.code === 'PGRST205' || error.code === '42P01') {
          console.warn('⚠️ Supabase jam_rooms table not found. Falling back to local file database.');
          supabaseTableExists = false;
          return this.local.getRooms();
        }
        throw error;
      }
      return (data || []).map(rowToRoom);
    } catch (e) {
      console.error('getRooms error:', e);
      return this.local.getRooms();
    }
  },

  async getRoom(roomId: string): Promise<RoomEntity | null> {
    if (shouldUseLocal()) {
      return this.local.getRoom(roomId);
    }
    try {
      const { data, error } = await supabase
        .from(TABLE)
        .select('*')
        .eq('id', roomId)
        .eq('is_active', true)
        .single();
      
      if (error) {
        if (error.code === 'PGRST205' || error.code === '42P01') {
          supabaseTableExists = false;
          return this.local.getRoom(roomId);
        }
        return null;
      }
      return data ? rowToRoom(data) : null;
    } catch (e) {
      console.error('getRoom error:', e);
      return this.local.getRoom(roomId);
    }
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
    if (shouldUseLocal()) {
      return this.local.createRoom(name, description, hostId, hostName, hostAvatar, isCollaborative, password);
    }
    try {
      // Deactivate previous active rooms by this host
      await supabase
        .from(TABLE)
        .update({ is_active: false })
        .eq('host_id', hostId)
        .eq('is_active', true);

      let newId = generateId();
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
        if (error.code === 'PGRST205' || error.code === '42P01') {
          supabaseTableExists = false;
          return this.local.createRoom(name, description, hostId, hostName, hostAvatar, isCollaborative, password);
        }
        throw error;
      }
      return rowToRoom(data);
    } catch (e) {
      console.error('createRoom error:', e);
      return this.local.createRoom(name, description, hostId, hostName, hostAvatar, isCollaborative, password);
    }
  },

  async joinRoom(roomId: string, user: { id: string; name: string; avatar?: string }): Promise<RoomEntity | null> {
    if (shouldUseLocal()) {
      return this.local.joinRoom(roomId, user);
    }
    try {
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
        if (updatedChat.length > 100) updatedChat = updatedChat.slice(-100);
      }

      const { data, error } = await supabase
        .from(TABLE)
        .update({ participants: updatedParticipants, chat_history: updatedChat, updated_at: now })
        .eq('id', roomId)
        .select()
        .single();
      
      if (error) {
        if (error.code === 'PGRST205' || error.code === '42P01') {
          supabaseTableExists = false;
          return this.local.joinRoom(roomId, user);
        }
        throw error;
      }
      return rowToRoom(data);
    } catch (e) {
      console.error('joinRoom error:', e);
      return this.local.joinRoom(roomId, user);
    }
  },

  async leaveRoom(roomId: string, userId: string): Promise<RoomEntity | null> {
    if (shouldUseLocal()) {
      return this.local.leaveRoom(roomId, userId);
    }
    try {
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

      const isRoomEmpty = updatedParticipants.length === 0;

      const { data, error } = await supabase
        .from(TABLE)
        .update({
          participants: updatedParticipants,
          chat_history: updatedChat,
          is_active: !isRoomEmpty,  // keep active unless ALL participants left
          updated_at: now,
        })
        .eq('id', roomId)
        .select()
        .single();
      
      if (error) {
        if (error.code === 'PGRST205' || error.code === '42P01') {
          supabaseTableExists = false;
          return this.local.leaveRoom(roomId, userId);
        }
        throw error;
      }
      return rowToRoom(data);
    } catch (e) {
      console.error('leaveRoom error:', e);
      return this.local.leaveRoom(roomId, userId);
    }
  },

  async syncPlayback(
    roomId: string,
    currentTrackId: string | undefined,
    currentTrackPosition: number,
    isPlaying: boolean
  ): Promise<RoomEntity | null> {
    if (shouldUseLocal()) {
      return this.local.syncPlayback(roomId, currentTrackId, currentTrackPosition, isPlaying);
    }
    try {
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
      
      if (error) {
        if (error.code === 'PGRST205' || error.code === '42P01') {
          supabaseTableExists = false;
          return this.local.syncPlayback(roomId, currentTrackId, currentTrackPosition, isPlaying);
        }
        throw error;
      }
      return rowToRoom(data);
    } catch (e) {
      console.error('syncPlayback error:', e);
      return this.local.syncPlayback(roomId, currentTrackId, currentTrackPosition, isPlaying);
    }
  },

  async addChatMessage(
    roomId: string,
    userId: string,
    userName: string,
    userAvatar: string | undefined,
    text: string
  ): Promise<RoomEntity | null> {
    if (shouldUseLocal()) {
      return this.local.addChatMessage(roomId, userId, userName, userAvatar, text);
    }
    try {
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
      
      if (error) {
        if (error.code === 'PGRST205' || error.code === '42P01') {
          supabaseTableExists = false;
          return this.local.addChatMessage(roomId, userId, userName, userAvatar, text);
        }
        throw error;
      }
      return rowToRoom(data);
    } catch (e) {
      console.error('addChatMessage error:', e);
      return this.local.addChatMessage(roomId, userId, userName, userAvatar, text);
    }
  },

  async updateQueue(roomId: string, queue: string[]): Promise<RoomEntity | null> {
    if (shouldUseLocal()) {
      return this.local.updateQueue(roomId, queue);
    }
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from(TABLE)
        .update({ queue, updated_at: now })
        .eq('id', roomId)
        .eq('is_active', true)
        .select()
        .single();
      
      if (error) {
        if (error.code === 'PGRST205' || error.code === '42P01') {
          supabaseTableExists = false;
          return this.local.updateQueue(roomId, queue);
        }
        throw error;
      }
      return rowToRoom(data);
    } catch (e) {
      console.error('updateQueue error:', e);
      return this.local.updateQueue(roomId, queue);
    }
  },

  async toggleLock(roomId: string, lock: boolean): Promise<RoomEntity | null> {
    if (shouldUseLocal()) {
      return this.local.toggleLock(roomId, lock);
    }
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from(TABLE)
        .update({ is_locked: lock, updated_at: now })
        .eq('id', roomId)
        .eq('is_active', true)
        .select()
        .single();
      
      if (error) {
        if (error.code === 'PGRST205' || error.code === '42P01') {
          supabaseTableExists = false;
          return this.local.toggleLock(roomId, lock);
        }
        throw error;
      }
      return rowToRoom(data);
    } catch (e) {
      console.error('toggleLock error:', e);
      return this.local.toggleLock(roomId, lock);
    }
  },

  async cleanupStaleRooms(): Promise<void> {
    if (shouldUseLocal()) {
      this.local.cleanupStaleRooms();
      return;
    }
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { error } = await supabase
        .from(TABLE)
        .update({ is_active: false })
        .eq('is_active', true)
        .lt('created_at', oneDayAgo);
      if (error) {
        if (error.code === 'PGRST205' || error.code === '42P01') {
          supabaseTableExists = false;
          this.local.cleanupStaleRooms();
          return;
        }
        console.error('cleanupStaleRooms error:', error);
      }
    } catch (e) {
      console.error('cleanupStaleRooms error:', e);
      this.local.cleanupStaleRooms();
    }
  },

  async closeRoom(roomId: string): Promise<void> {
    if (shouldUseLocal()) {
      this.local.closeRoom(roomId);
      return;
    }
    try {
      const { error } = await supabase
        .from(TABLE)
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', roomId);
      if (error) {
        if (error.code === 'PGRST205' || error.code === '42P01') {
          supabaseTableExists = false;
          this.local.closeRoom(roomId);
          return;
        }
        throw error;
      }
    } catch (e) {
      console.error('closeRoom error:', e);
      this.local.closeRoom(roomId);
    }
  },
};
