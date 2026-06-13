import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT, signJWT } from '@/lib/jwt';
import { db } from '@/lib/db';

/**
 * POST /api/auth/refresh-role
 *
 * Re-issues the beato-token JWT using the CURRENT role stored in the DB.
 * This is called after an admin approves an artist application so the middleware
 * immediately recognises the upgraded role without requiring a full re-login.
 */
export async function POST(request: NextRequest) {
  try {
    const oldToken = request.cookies.get('beato-token')?.value;
    if (!oldToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = await verifyJWT(oldToken);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    let upgradeToArtist = false;
    try {
      const body = await request.json();
      upgradeToArtist = !!body.upgradeToArtist;
    } catch (e) {
      // Body might be empty, ignore
    }

    if (upgradeToArtist) {
      db.updateUserRole(decoded.userId, 'ARTIST');
    }

    // Pull the CURRENT role straight from the DB (bypasses stale JWT claim)
    const user = db.getUserById(decoded.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Re-sign with fresh role
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    const newToken = await signJWT(payload, '1h');
    const newRefresh = await signJWT(payload, '7d');

    const response = NextResponse.json({
      success: true,
      role: user.role,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        coverImage: user.coverImage,
        subscription: user.subscription,
        country: user.country,
        followers: user.followers,
        following: user.following,
        likedSongs: user.likedSongs || [],
        savedAlbums: user.savedAlbums || [],
        followedArtists: user.followedArtists || [],
        playlists: user.playlists || [],
        preferences: user.preferences,
        stats: user.stats,
      },
    });

    response.cookies.set('beato-token', newToken, {
      httpOnly: true,
      secure: request.nextUrl.protocol === 'https:',
      sameSite: 'lax',
      path: '/',
      maxAge: 3600,
    });

    response.cookies.set('beato-refresh-token', newRefresh, {
      httpOnly: true,
      secure: request.nextUrl.protocol === 'https:',
      sameSite: 'strict',
      path: '/',
      maxAge: 604800,
    });

    // Also update the readable role cookie
    response.cookies.set('beato-role', user.role, {
      secure: request.nextUrl.protocol === 'https:',
      sameSite: 'lax',
      path: '/',
      maxAge: 604800,
    });

    return response;
  } catch (error) {
    console.error('Refresh-role error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
