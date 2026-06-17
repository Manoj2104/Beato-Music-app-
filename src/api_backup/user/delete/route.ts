import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/rbac';
import { db } from '@/lib/db';
import { logSecurityEvent } from '@/lib/audit';

export async function POST(request: NextRequest) {
  const authUser = await getAuthUser(request);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized: Not authenticated' }, { status: 401 });
  }

  try {
    const token = authUser.token;
    const allUsers = db.getUsers();
    
    // Find user matching this token in sessions
    const session = db.getSession(token);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const userId = session.userId;
    const targetUser = db.getUserById(userId);
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isArtist = targetUser.role === 'ARTIST';

    // 1. Delete tracks if they are an artist
    let tracksDeleted = 0;
    if (isArtist) {
      const allTracks = db.getTracks();
      const artistTracks = allTracks.filter(t => t.artistId === userId);
      artistTracks.forEach(t => {
        db.deleteTrack(t.id);
      });
      tracksDeleted = artistTracks.length;
    }

    // 2. Delete user session
    db.deleteSession(token);

    // 3. Delete user account
    db.deleteUser(userId);

    // 4. Log event
    logSecurityEvent(
      userId,
      targetUser.name,
      'ROLE_CHANGE',
      `User self-deleted their account. Deleted ${tracksDeleted} tracks.`
    );

    // 5. Clear cookie
    const response = NextResponse.json({
      success: true,
      message: 'Account successfully deleted.',
    });
    
    response.cookies.set('beato-token', '', {
      path: '/',
      maxAge: 0,
      httpOnly: true,
      secure: request.nextUrl.protocol === 'https:',
      sameSite: 'lax',
    });

    return response;
  } catch (err: any) {
    console.error('Self-delete account api error:', err);
    return NextResponse.json(
      { error: 'Server error deleting account.' },
      { status: 500 }
    );
  }
}
