import { NextRequest, NextResponse } from 'next/server';
import { roomDb } from '@/lib/roomDb';
import { verifyJWT } from '@/lib/jwt';
import { socketManager } from '@/lib/socket';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const room = await roomDb.getRoom(roomId);
    
    if (!room) {
      return NextResponse.json({ error: 'Room not found or inactive' }, { status: 404 });
    }

    return NextResponse.json({ success: true, room });
  } catch (error: any) {
    console.error('Fetch room detail API error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch room details' }, { status: 500 });
  }
}

export async function DELETE(
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
      return NextResponse.json({ error: 'Only the host can close this room' }, { status: 403 });
    }

    await roomDb.closeRoom(roomId);

    if (socketManager) {
      socketManager.emit('PLAYLIST_UPDATED', { roomId, action: 'close' });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete room API error:', error);
    return NextResponse.json({ error: error.message || 'Failed to close room' }, { status: 500 });
  }
}
