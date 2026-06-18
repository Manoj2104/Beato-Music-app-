import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/rbac';
import { db } from '@/lib/db';
import { verifyJWT } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  // Validate RBAC - user or higher is required
  const rbacCheck = await requireUser(request);
  if (!rbacCheck.authorized || !rbacCheck.user) {
    return NextResponse.json(
      { error: rbacCheck.message || 'Unauthorized' },
      { status: rbacCheck.status || 401 }
    );
  }

  try {
    const body = await request.json();
    // Use the already-verified user from rbacCheck (supports both cookie & Authorization header)
    const userId = rbacCheck.user.userId!;

    // Filter updates to allow only specific safe fields
    const updates: any = {};
    if (body.likedSongs !== undefined) updates.likedSongs = body.likedSongs;
    if (body.followedArtists !== undefined) updates.followedArtists = body.followedArtists;
    if (body.savedAlbums !== undefined) updates.savedAlbums = body.savedAlbums;
    if (body.preferences !== undefined) updates.preferences = body.preferences;
    if (body.playlists !== undefined) updates.playlists = body.playlists;
    if (body.name !== undefined) updates.name = body.name;
    if (body.email !== undefined) updates.email = body.email;
    if (body.avatar !== undefined) updates.avatar = body.avatar;
    if (body.coverImage !== undefined) updates.coverImage = body.coverImage;
    if (body.verified !== undefined) updates.verified = body.verified;
    if (body.role !== undefined) updates.role = body.role;
    if (body.verificationRequest !== undefined) updates.verificationRequest = body.verificationRequest;

    const success = db.updateUser(userId, updates);
    if (!success) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
    }

    // Sync artist profile if user is an artist
    const dbUser = db.getUserById(userId);
    if (dbUser && dbUser.role === 'ARTIST') {
      const artistProfile = db.getArtistProfile(userId) || {};
      let changed = false;
      if (updates.coverImage !== undefined) {
        artistProfile.bannerImage = updates.coverImage;
        changed = true;
      }
      if (updates.avatar !== undefined) {
        artistProfile.avatar = updates.avatar;
        changed = true;
      }
      if (updates.name !== undefined) {
        artistProfile.stageName = updates.name;
        changed = true;
      }
      if (changed) {
        db.saveArtistProfile(userId, artistProfile);
      }
    }

    return NextResponse.json({ success: true, message: 'User settings updated.' });
  } catch (error: any) {
    console.error('Error updating user profile in DB:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
