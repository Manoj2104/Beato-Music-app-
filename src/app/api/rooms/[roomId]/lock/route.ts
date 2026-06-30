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

    const room = roomDb.getRoom(roomId);
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Only the host can toggle the lock
    if (room.hostId !== decoded.userId) {
      return NextResponse.json({ error: 'Only the host can lock or unlock the room' }, { status: 403 });
    }

    const body = await request.json();
    const { isLocked } = body;

    const updatedRoom = roomDb.toggleLock(roomId, !!isLocked);

    // Broadcast lock state change to all participants
    if (socketManager && updatedRoom) {
      socketManager.emit('PLAYLIST_UPDATED', {
        roomId,
        action: 'lock',
        isLocked: updatedRoom.isLocked
      });
    }

    return NextResponse.json({ success: true, isLocked: updatedRoom?.isLocked });
  } catch (error: any) {
    console.error('Toggle lock API error:', error);
    return NextResponse.json({ error: error.message || 'Failed to toggle lock' }, { status: 500 });
  }
}
