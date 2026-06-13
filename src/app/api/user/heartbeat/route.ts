import { NextRequest, NextResponse } from 'next/server';

if (!(global as any).globalSessions) {
  (global as any).globalSessions = new Map<string, number>();
}
const globalSessions = (global as any).globalSessions as Map<string, number>;

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json();
    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    // Register/refresh the active timestamp for this browsing session
    globalSessions.set(sessionId, Date.now());
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('User heartbeat error:', err);
    return NextResponse.json({ error: 'Failed to record session' }, { status: 500 });
  }
}
