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

    const room = await roomDb.getRoom(roomId);
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    if (room.hostId !== decoded.userId) {
      return NextResponse.json({ error: 'Only the host can lock or unlock the room' }, { status: 403 });
    }

    const body = await request.json();
    const { isLocked } = body;

    const updatedRoom = await roomDb.toggleLock(roomId, !!isLocked);

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
