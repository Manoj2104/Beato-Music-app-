import fs from 'fs';
import path from 'path';
import { getDbFilePath } from './dbPath';

const DB_FILE = getDbFilePath();

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
  currentTrackPosition?: number; // position in seconds
  isPlaying?: boolean;
  updatedAt: string; // ISO string when playback state changed
  queue: string[]; // array of track IDs
  isCollaborative: boolean; // if anyone can control playback
  isLocked: boolean; // if true, only host can control playback
  password?: string; // password protection
}

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
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to write database file for rooms:', e);
  }
}

export const roomDb = {
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

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let newId = '';
    let isUnique = false;
    while (!isUnique) {
      newId = '';
      for (let i = 0; i < 5; i++) {
        newId += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      isUnique = !rooms.some((r: RoomEntity) => r.id === newId);
    }

    const newRoom: RoomEntity = {
      id: newId,
      name: name || `${hostName}'s Listening Party`,
      description: description || 'Join my real-time sound session on Beato!',
      hostId,
      hostName,
      createdAt: new Date().toISOString(),
      isActive: true,
      participants: [
        {
          userId: hostId,
          name: hostName,
          avatar: hostAvatar,
          role: 'host',
          joinedAt: new Date().toISOString(),
          lastActive: new Date().toISOString()
        }
      ],
      chatHistory: [
        {
          id: `msg-system-${Date.now()}`,
          userId: 'system',
          userName: 'Beato Bot',
          text: `🎵 Room "${name}" created! Share the link with friends to listen together.`,
          timestamp: new Date().toISOString()
        }
      ],
      currentTrackId: undefined,
      currentTrackPosition: 0,
      isPlaying: false,
      updatedAt: new Date().toISOString(),
      queue: [],
      isCollaborative,
      isLocked: false, // default: anyone in room can control
      password // Optional password
    };

    rooms.push(newRoom);
    db.rooms = rooms;
    writeDbRaw(db);
    return newRoom;
  },

  joinRoom(roomId: string, user: { id: string; name: string; avatar?: string }): RoomEntity | null {
    const db = readDbRaw();
    const rooms: RoomEntity[] = db.rooms || [];
    const roomIndex = rooms.findIndex(r => r.id === roomId && r.isActive);
    if (roomIndex === -1) return null;

    const room = rooms[roomIndex];
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
    }

    db.rooms = rooms;
    writeDbRaw(db);
    return room;
  },

  leaveRoom(roomId: string, userId: string): RoomEntity | null {
    const db = readDbRaw();
    const rooms: RoomEntity[] = db.rooms || [];
    const roomIndex = rooms.findIndex(r => r.id === roomId && r.isActive);
    if (roomIndex === -1) return null;

    const room = rooms[roomIndex];
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

    // If host leaves, the session ends immediately for everyone
    if (room.hostId === userId) {
      room.isActive = false;
    } else if (room.participants.length === 0) {
      room.isActive = false;
    }

    db.rooms = rooms;
    writeDbRaw(db);
    return room;
  },

  syncPlayback(
    roomId: string,
    currentTrackId: string | undefined,
    currentTrackPosition: number,
    isPlaying: boolean
  ): RoomEntity | null {
    const db = readDbRaw();
    const rooms: RoomEntity[] = db.rooms || [];
    const roomIndex = rooms.findIndex(r => r.id === roomId && r.isActive);
    if (roomIndex === -1) return null;

    const room = rooms[roomIndex];
    room.currentTrackId = currentTrackId;
    room.currentTrackPosition = currentTrackPosition;
    room.isPlaying = isPlaying;
    room.updatedAt = new Date().toISOString();

    db.rooms = rooms;
    writeDbRaw(db);
    return room;
  },

  addChatMessage(
    roomId: string,
    userId: string,
    userName: string,
    userAvatar: string | undefined,
    text: string
  ): RoomEntity | null {
    const db = readDbRaw();
    const rooms: RoomEntity[] = db.rooms || [];
    const roomIndex = rooms.findIndex(r => r.id === roomId && r.isActive);
    if (roomIndex === -1) return null;

    const room = rooms[roomIndex];
    const newMessage: RoomMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      userId,
      userName,
      userAvatar,
      text,
      timestamp: new Date().toISOString()
    };

    room.chatHistory.push(newMessage);
    // Keep chat history capped to prevent file growth
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
    const roomIndex = rooms.findIndex(r => r.id === roomId && r.isActive);
    if (roomIndex === -1) return null;

    const room = rooms[roomIndex];
    room.queue = queue;

    db.rooms = rooms;
    writeDbRaw(db);
    return room;
  },

  toggleLock(roomId: string, lock: boolean): RoomEntity | null {
    const db = readDbRaw();
    const rooms: RoomEntity[] = db.rooms || [];
    const roomIndex = rooms.findIndex(r => r.id === roomId && r.isActive);
    if (roomIndex === -1) return null;

    rooms[roomIndex].isLocked = lock;
    rooms[roomIndex].updatedAt = new Date().toISOString();

    db.rooms = rooms;
    writeDbRaw(db);
    return rooms[roomIndex];
  },

  cleanupStaleRooms() {
    const db = readDbRaw();
    const rooms: RoomEntity[] = db.rooms || [];
    let changed = false;
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

    rooms.forEach((r: RoomEntity) => {
      if (r.isActive) {
        const roomTime = new Date(r.createdAt).getTime();
        // If room is older than 24h, automatically clean it up
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
  }
};
