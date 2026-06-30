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
    const { emoji } = body;

    const room = roomDb.getRoom(roomId);
    if (!room) {
      return NextResponse.json({ error: 'Room not found or inactive' }, { status: 404 });
    }

    // Broadcast reaction via socket
    if (socketManager) {
      socketManager.emit('PLAYLIST_UPDATED', {
        roomId,
        action: 'react',
        payload: {
          emoji,
          userId: decoded.userId,
          userName: decoded.name
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Send reaction API error:', error);
    return NextResponse.json({ error: error.message || 'Failed to send reaction' }, { status: 500 });
  }
}
