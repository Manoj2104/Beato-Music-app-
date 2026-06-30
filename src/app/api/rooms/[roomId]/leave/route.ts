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

    const updatedRoom = roomDb.leaveRoom(roomId, decoded.userId);

    if (!updatedRoom) {
      return NextResponse.json({ error: 'Room not found or inactive' }, { status: 404 });
    }

    // Broadcast room participant update
    if (socketManager) {
      socketManager.emit('PLAYLIST_UPDATED', { roomId, action: 'leave', userId: decoded.userId });
    }

    return NextResponse.json({ success: true, room: updatedRoom });
  } catch (error: any) {
    console.error('Leave room API error:', error);
    return NextResponse.json({ error: error.message || 'Failed to leave room' }, { status: 500 });
  }
}
