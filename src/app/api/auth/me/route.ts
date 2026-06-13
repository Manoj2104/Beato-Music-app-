import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT, signJWT } from '@/lib/jwt';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('beato-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = await verifyJWT(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid or expired session token' }, { status: 401 });
    }

    const user = db.getUserById(decoded.userId);
    if (!user) {
      return NextResponse.json({ error: 'User account not found' }, { status: 404 });
    }

    if (!user.isActive) {
      return NextResponse.json({ error: 'Account has been suspended' }, { status: 403 });
    }

    const userPayload = {
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
      likedSongs: user.likedSongs,
      savedAlbums: user.savedAlbums,
      followedArtists: user.followedArtists,
      playlists: user.playlists,
      preferences: user.preferences,
      stats: user.stats,
      verified: user.verified,
      verificationRequest: user.verificationRequest,
    };

    const response = NextResponse.json({
      success: true,
      user: userPayload,
    });

    if (user.role !== decoded.role) {
      const payload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      };

      const newToken = await signJWT(payload, '1h');
      const newRefresh = await signJWT(payload, '7d');

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

      response.cookies.set('beato-role', user.role, {
        secure: request.nextUrl.protocol === 'https:',
        sameSite: 'lax',
        path: '/',
        maxAge: 604800,
      });
    }

    return response;
  } catch (error) {
    console.error('Session verify error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
