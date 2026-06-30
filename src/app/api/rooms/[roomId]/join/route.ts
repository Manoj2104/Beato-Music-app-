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

    const body = await request.json().catch(() => ({}));
    const { password } = body;

    const room = roomDb.getRoom(roomId);
    if (!room) {
      return NextResponse.json({ error: 'Room not found or inactive' }, { status: 404 });
    }

    // Check password if configured
    if (room.password && room.password !== password) {
      return NextResponse.json({ error: 'Incorrect password. Access denied.', passwordRequired: true }, { status: 403 });
    }

    const updatedRoom = roomDb.joinRoom(roomId, {
      id: decoded.userId,
      name: decoded.name,
      avatar: undefined // Can be fetched from user entity if needed
    });

    if (!updatedRoom) {
      return NextResponse.json({ error: 'Room not found or inactive' }, { status: 404 });
    }

    // Broadcast room participant update to other devices/tabs
    if (socketManager) {
      socketManager.emit('PLAYLIST_UPDATED', { roomId, action: 'join', userId: decoded.userId, name: decoded.name }); // Reuse PLAYLIST_UPDATED as a generic sync trigger
    }

    return NextResponse.json({ success: true, room: updatedRoom });
  } catch (error: any) {
    console.error('Join room API error:', error);
    return NextResponse.json({ error: error.message || 'Failed to join room' }, { status: 500 });
  }
}
