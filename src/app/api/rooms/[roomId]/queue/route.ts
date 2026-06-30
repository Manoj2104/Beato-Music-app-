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
    const { queue } = body; // Array of track IDs

    if (!Array.isArray(queue)) {
      return NextResponse.json({ error: 'Queue must be an array of song IDs' }, { status: 400 });
    }

    const room = roomDb.getRoom(roomId);
    if (!room) {
      return NextResponse.json({ error: 'Room not found or inactive' }, { status: 404 });
    }

    // Verify permission: only host can change queue unless isCollaborative is true
    if (room.hostId !== decoded.userId && !room.isCollaborative) {
      return NextResponse.json({ error: 'Only the host can modify the queue in this room' }, { status: 403 });
    }

    const updatedRoom = roomDb.updateQueue(roomId, queue);

    // Broadcast queue update via socket
    if (socketManager && updatedRoom) {
      socketManager.emit('PLAYLIST_UPDATED', {
        roomId,
        action: 'queue',
        queue: updatedRoom.queue
      });
    }

    return NextResponse.json({ success: true, room: updatedRoom });
  } catch (error: any) {
    console.error('Update queue API error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update queue' }, { status: 500 });
  }
}
