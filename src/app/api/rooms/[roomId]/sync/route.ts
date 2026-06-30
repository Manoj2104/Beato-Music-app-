import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/jwt';
import { roomDb } from '@/lib/roomDb';
import { socketManager } from '@/lib/socket';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    
    // Authenticate the request
    const token = request.headers.get('authorization')?.split(' ')[1] || 
                  request.cookies.get('beato-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const decoded = await verifyJWT(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
    }

    const body = await request.json();
    const { currentTrackId, currentTrackPosition, isPlaying } = body;

    const room = roomDb.getRoom(roomId);
    if (!room) {
      return NextResponse.json({ error: 'Room not found or inactive' }, { status: 404 });
    }

    // Enforce lock: only the host can control when room is locked
    if (room.isLocked && room.hostId !== decoded.userId) {
      return NextResponse.json({ error: 'Room is locked. Only the host can control playback.' }, { status: 403 });
    }

    // Allow all joined participants to control playback in real-time

    const updatedRoom = roomDb.syncPlayback(
      roomId,
      currentTrackId,
      currentTrackPosition,
      isPlaying
    );

    // Broadcast playback update to other room listeners via socket
    if (socketManager && updatedRoom) {
      socketManager.emit('PLAYLIST_UPDATED', {
        roomId,
        action: 'sync',
        playback: {
          currentTrackId: updatedRoom.currentTrackId,
          currentTrackPosition: updatedRoom.currentTrackPosition,
          isPlaying: updatedRoom.isPlaying,
          updatedAt: updatedRoom.updatedAt
        }
      });
    }

    return NextResponse.json({ success: true, room: updatedRoom });
  } catch (error: any) {
    console.error('Sync playback API error:', error);
    return NextResponse.json({ error: error.message || 'Failed to sync playback' }, { status: 500 });
  }
}
