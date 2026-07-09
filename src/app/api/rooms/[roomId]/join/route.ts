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

    const room = await roomDb.getRoom(roomId);
    if (!room) {
      return NextResponse.json({ error: 'Room not found or inactive' }, { status: 404 });
    }

    if (room.password && room.password !== password) {
      return NextResponse.json({ error: 'Incorrect password. Access denied.', passwordRequired: true }, { status: 403 });
    }

    const updatedRoom = await roomDb.joinRoom(roomId, {
      id: decoded.userId,
      name: decoded.name,
      avatar: undefined
    });

    if (!updatedRoom) {
      return NextResponse.json({ error: 'Room not found or inactive' }, { status: 404 });
    }

    if (socketManager) {
      socketManager.emit('PLAYLIST_UPDATED', { roomId, action: 'join', userId: decoded.userId, name: decoded.name });
    }

    return NextResponse.json({ success: true, room: updatedRoom });
  } catch (error: any) {
    console.error('Join room API error:', error);
    return NextResponse.json({ error: error.message || 'Failed to join room' }, { status: 500 });
  }
}
