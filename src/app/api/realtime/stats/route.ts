import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const cutoff = Date.now() - 40000;
  const globalSessions = (global as any).globalSessions as Map<string, number> || new Map();
  const activeTrackSessions = (global as any).activeTrackSessions as Map<string, Map<string, number>> || new Map();

  let activeNow = 0;
  for (const [sessionId, lastSeen] of globalSessions.entries()) {
    if (lastSeen > cutoff) {
      activeNow++;
    } else {
      globalSessions.delete(sessionId);
    }
  }

  const liveTrackListeners: Record<string, number> = {};
  for (const [trackId, sessionMap] of activeTrackSessions.entries()) {
    let count = 0;
    for (const [sessionId, lastSeen] of sessionMap.entries()) {
      if (lastSeen > cutoff) {
        count++;
      } else {
        sessionMap.delete(sessionId);
      }
    }
    liveTrackListeners[trackId] = count;
  }

  const tracks = db.getTracks()
    .filter((track) => track.status === 'approved')
    .sort((a, b) => (b.plays || 0) - (a.plays || 0))
    .slice(0, 10);

  return NextResponse.json({
    success: true,
    stats: {
      activeNow,
      liveTrackListeners,
      topTracks: tracks.map((track) => ({
        id: track.id,
        title: track.title,
        plays: track.plays || 0,
      })),
    },
  });
}
