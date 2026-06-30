import { NextRequest, NextResponse } from 'next/server';
import { roomDb } from '@/lib/roomDb';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const room = roomDb.getRoom(roomId);
    
    if (!room) {
      return NextResponse.json({ error: 'Room not found or inactive' }, { status: 404 });
    }

    return NextResponse.json({ success: true, room });
  } catch (error: any) {
    console.error('Fetch room detail API error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch room details' }, { status: 500 });
  }
}
