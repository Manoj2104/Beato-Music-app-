import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/jwt';
import { roomDb } from '@/lib/roomDb';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    roomDb.cleanupStaleRooms();
    const rooms = roomDb.getRooms().filter(r => r.isActive);
    return NextResponse.json({ success: true, rooms });
  } catch (error: any) {
    console.error('Fetch rooms API error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch rooms' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
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
    const { name, description, isCollaborative, password } = body;

    const newRoom = roomDb.createRoom(
      name,
      description,
      decoded.userId,
      decoded.name,
      undefined, // Avatar can be resolved dynamically on client or extended
      !!isCollaborative,
      password || undefined
    );

    return NextResponse.json({ success: true, room: newRoom });
  } catch (error: any) {
    console.error('Create room API error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create room' }, { status: 500 });
  }
}
