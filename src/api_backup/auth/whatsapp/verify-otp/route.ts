import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { signJWT } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  try {
    const { phone, code } = await request.json();

    if (!phone || !code) {
      return NextResponse.json({ error: 'Phone number and OTP code are required' }, { status: 400 });
    }

    // 1. Fetch OTP record
    const otp = db.getOtp(phone);
    if (!otp) {
      return NextResponse.json({ error: 'No active OTP verification session found for this number' }, { status: 400 });
    }

    // 2. Increment attempts and validate threshold (max 3)
    const attempts = db.incrementOtpAttempts(phone);
    if (attempts > 3) {
      db.deleteOtp(phone);
      return NextResponse.json({ error: 'Maximum verification attempts exceeded. Please request a new OTP.' }, { status: 429 });
    }

    // 3. Expiration Check (5 minutes)
    if (new Date() > new Date(otp.expiresAt)) {
      db.deleteOtp(phone);
      return NextResponse.json({ error: 'OTP has expired. Please request a new one.' }, { status: 400 });
    }

    // 4. Verify code
    if (otp.code !== code.trim()) {
      return NextResponse.json(
        { error: `Incorrect verification code. Attempts remaining: ${3 - attempts}` },
        { status: 401 }
      );
    }

    // 5. Successful Verification -> Find or Create User Account
    let user = db.getUserByPhone(phone);
    if (!user) {
      // Find if email is not pre-registered, otherwise create user placeholder
      user = db.saveUser({
        name: 'WhatsApp Listener',
        email: `whatsapp-${phone.replace(/[^0-9]/g, '')}@beato.io`,
        passwordHash: '', // OTP users bypass standard passwords
        role: 'USER',
        isActive: true,
        phone,
      });
    }

    if (!user.isActive) {
      return NextResponse.json({ error: 'This account has been suspended' }, { status: 403 });
    }

    // 6. Generate JWT Session
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

    // Delete OTP record on success
    db.deleteOtp(phone);

    // 7. Write Secure Cookies
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
      maxAge: maxAgeRefresh,
    });

    return response;
  } catch (error) {
    console.error('OTP verify error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
