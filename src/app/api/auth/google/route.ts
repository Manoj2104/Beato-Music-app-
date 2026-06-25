import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { signJWT } from '@/lib/jwt';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const apiConfig = db.getApiConfig();
    const clientId = apiConfig?.google?.clientId || '';
    return NextResponse.json({ clientId });
  } catch (error) {
    console.error('Failed to get Google Client ID:', error);
    return NextResponse.json({ clientId: '' });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, name, avatar, idToken } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    let finalEmail = email.toLowerCase().trim();
    let finalName = name || finalEmail.split('@')[0];
    let finalAvatar = avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop';

    // 1. Verify Google token if ID Token is provided (production flow)
    if (idToken) {
      try {
        const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
        if (!verifyRes.ok) {
          return NextResponse.json({ error: 'Invalid Google ID Token' }, { status: 401 });
        }
        const verifyData = await verifyRes.json();
        
        // Match verified data
        if (verifyData.email) {
          finalEmail = verifyData.email.toLowerCase().trim();
        }
        if (verifyData.name) {
          finalName = verifyData.name;
        }
        if (verifyData.picture) {
          finalAvatar = verifyData.picture;
        }
      } catch (verifyErr) {
        console.error('Google token verification failed:', verifyErr);
        return NextResponse.json({ error: 'Failed to verify token with Google' }, { status: 401 });
      }
    }

    // 2. Find or create the user in local/Supabase database
    let user = db.getUserByEmail(finalEmail);
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      user = db.saveUser({
        name: finalName,
        email: finalEmail,
        passwordHash: '', // Social logins bypass standard password validation
        role: 'USER',
        isActive: true,
        avatar: finalAvatar,
      });
    }

    if (!user.isActive) {
      return NextResponse.json({ error: 'This account has been suspended' }, { status: 403 });
    }

    // 3. Generate JWT Access and Refresh Tokens
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    const token = await signJWT(payload, '365d');
    const refreshToken = await signJWT(payload, '365d');

    db.saveSession({
      id: `session-${Date.now()}`,
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 365 * 24 * 3600000).toISOString(),
    });

    // 4. Create response and set cookies
    const response = NextResponse.json({
      success: true,
      token,
      isNewUser,
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
        likedSongs: user.likedSongs,
        savedAlbums: user.savedAlbums,
        followedArtists: user.followedArtists,
        playlists: user.playlists,
        preferences: user.preferences,
        stats: user.stats,
        verified: user.verified,
        verificationRequest: user.verificationRequest,
        permissions: db.getUserPermissions(user.id),
      },
    });

    const maxAgeAccess = 31536000; // 365 days
    const maxAgeRefresh = 31536000; // 365 days

    response.cookies.set('beato-token', token, {
      httpOnly: true,
      secure: request.nextUrl.protocol === 'https:',
      sameSite: 'lax',
      path: '/',
      maxAge: maxAgeAccess,
    });

    response.cookies.set('beato-refresh-token', refreshToken, {
      httpOnly: true,
      secure: request.nextUrl.protocol === 'https:',
      sameSite: 'strict',
      path: '/',
      maxAge: maxAgeRefresh,
    });

    response.cookies.set('beato-role', user.role, {
      secure: request.nextUrl.protocol === 'https:',
      sameSite: 'lax',
      path: '/',
      maxAge: maxAgeAccess,
    });

    return response;
  } catch (error: any) {
    console.error('Google Sign-In API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
