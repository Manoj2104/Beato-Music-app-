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
    const { text } = body;

    if (!text || text.trim() === '') {
      return NextResponse.json({ error: 'Message text cannot be empty' }, { status: 400 });
    }

    const updatedRoom = roomDb.addChatMessage(
      roomId,
      decoded.userId,
      decoded.name,
      undefined, // Avatar can be resolved dynamically
      text
    );

    if (!updatedRoom) {
      return NextResponse.json({ error: 'Room not found or inactive' }, { status: 404 });
    }

    const latestMessage = updatedRoom.chatHistory[updatedRoom.chatHistory.length - 1];

    // Broadcast chat message via socket
    if (socketManager) {
      socketManager.emit('PLAYLIST_UPDATED', {
        roomId,
        action: 'chat',
        message: latestMessage
      });
    }

    return NextResponse.json({ success: true, room: updatedRoom });
  } catch (error: any) {
    console.error('Add chat message API error:', error);
    return NextResponse.json({ error: error.message || 'Failed to send message' }, { status: 500 });
  }
}
