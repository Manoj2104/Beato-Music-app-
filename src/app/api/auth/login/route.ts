import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { signJWT } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // 1. Find user
    const user = db.getUserByEmail(email);
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // 2. Account active check
    if (!user.isActive) {
      return NextResponse.json({ error: 'This account has been suspended' }, { status: 403 });
    }

    // 3. Compare passwords
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // 4. Generate JWT Access and Refresh Tokens
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    // Access Token (Expires in 365 days)
    const token = await signJWT(payload, '365d');
    // Refresh Token (Expires in 365 days)
    const refreshToken = await signJWT(payload, '365d');

    // 5. Store session in simulated DB
    db.saveSession({
      id: `session-${Date.now()}`,
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 365 * 24 * 3600000).toISOString(),
    });

    // 6. Build cookies response
    const response = NextResponse.json({
      success: true,
      token,
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
      },
    });

    const maxAgeAccess = 31536000; // 365 days
    const maxAgeRefresh = 31536000; // 365 days

    // Set secure HttpOnly cookies
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

    // Role cookie for UI navigation optimization (Lax, not HttpOnly so frontend can read it)
    response.cookies.set('beato-role', user.role, {
      secure: request.nextUrl.protocol === 'https:',
      sameSite: 'lax',
      path: '/',
      maxAge: maxAgeRefresh,
    });

    // Automation: fire login rules (non-blocking)
    const ip = (request as any).ip || request.headers.get('x-forwarded-for') || 'unknown';
    import('@/lib/messaging').then(({ fireAutomation }) => {
      fireAutomation('user.login', { name: user.name, email: user.email, ip, phone: user.phone || '' }).catch(console.error);
    }).catch(console.error);

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
