import { NextRequest, NextResponse } from 'next/server';
import { roomDb } from '@/lib/roomDb';
import { getDbFilePath } from '@/lib/dbPath';
import fs from 'fs';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const path = getDbFilePath();
    const exists = fs.existsSync(path);
    const rooms = await roomDb.getRooms();
    return NextResponse.json({
      success: true,
      dbPath: path,
      dbExists: exists,
      roomsCount: rooms.length,
      rooms: rooms.map((r: any) => ({ id: r.id, name: r.name, active: r.isActive, hostId: r.hostId, hostName: r.hostName, createdAt: r.createdAt }))
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
