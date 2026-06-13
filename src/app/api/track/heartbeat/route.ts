import { NextRequest, NextResponse } from 'next/server';

// Global server-side registry to track active listeners across tabs and devices
// Map of artistId -> Map of sessionId -> lastActiveTimestamp
if (!(global as any).activeSessions) {
  (global as any).activeSessions = new Map<string, Map<string, number>>();
}
if (!(global as any).activeTrackSessions) {
  (global as any).activeTrackSessions = new Map<string, Map<string, number>>();
}

const activeSessions = (global as any).activeSessions as Map<string, Map<string, any>>;
const activeTrackSessions = (global as any).activeTrackSessions as Map<string, Map<string, number>>;

export async function POST(req: NextRequest) {
  try {
    const { artistId, trackId, sessionId, isPlaying, city, country } = await req.json();
    
    if (!artistId || !sessionId) {
      return NextResponse.json({ error: 'artistId and sessionId are required' }, { status: 400 });
    }

    if (!activeSessions.has(artistId)) {
      activeSessions.set(artistId, new Map());
    }

    const artistMap = activeSessions.get(artistId)!;

    if (isPlaying) {
      // Register or refresh active session with location metadata
      artistMap.set(sessionId, {
        lastSeen: Date.now(),
        trackId,
        city: city || 'Chennai',
        country: country || 'IN'
      });
    } else {
      // Paused or stopped, delete active session
      artistMap.delete(sessionId);
    }

    if (trackId) {
      if (!activeTrackSessions.has(trackId)) {
        activeTrackSessions.set(trackId, new Map());
      }

      const trackMap = activeTrackSessions.get(trackId)!;
      if (isPlaying) {
        trackMap.set(sessionId, Date.now());
      } else {
        trackMap.delete(sessionId);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Heartbeat registry error:', err);
    return NextResponse.json({ error: 'Failed to process heartbeat' }, { status: 500 });
  }
}
