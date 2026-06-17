import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/rbac';
import { db } from '@/lib/db';
import { logSecurityEvent } from '@/lib/audit';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  const rbacCheck = await requireAdmin(request);
  if (!rbacCheck.authorized) {
    return NextResponse.json(
      { error: rbacCheck.message || 'Forbidden' },
      { status: rbacCheck.status || 403 }
    );
  }

  try {
    const { name, email, bio, country, followers, avatar } = await request.json();

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and Email are required parameters.' },
        { status: 400 }
      );
    }

    const lowEmail = email.toLowerCase().trim();
    const existingUser = db.getUsers().find(u => u.email.toLowerCase() === lowEmail);
    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email address already exists.' },
        { status: 400 }
      );
    }

    const adminUser = rbacCheck.user;
    const artistId = `artist-${Date.now()}`;

    // Create a new artist user in the database
    const newUser = {
      id: artistId,
      name,
      email: lowEmail,
      passwordHash: bcrypt.hashSync('password', 10), // default temporary password
      role: 'ARTIST' as const,
      isActive: true,
      createdAt: new Date().toISOString(),
      avatar: avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
      country: country || 'US',
      followers: parseInt(followers) || 0,
      following: 0,
      bio: bio || `${name} is a manually added creator on Beato.`,
      likedSongs: [],
      savedAlbums: [],
      followedArtists: [],
      playlists: [],
    };

    // Save the new artist
    const savedUser = db.saveUser(newUser);

    // If ID was overwritten during save, let's fix it, or adjust
    // Note: db.saveUser generates user-XXX by default, but we can update it immediately:
    if (savedUser.id !== artistId) {
      db.updateUser(savedUser.id, { id: artistId, bio: newUser.bio }); // force the custom artistId
    }

    logSecurityEvent(
      adminUser?.token || 'unknown-token',
      `Admin (${adminUser?.role})`,
      'ADMIN_ACTION',
      `Manually created artist account for "${name}" (${artistId}).`
    );

    return NextResponse.json({
      success: true,
      message: `Artist "${name}" manually created successfully.`,
      artistId,
    });
  } catch (err: any) {
    console.error('Create artist API error:', err);
    return NextResponse.json(
      { error: 'Server error creating manual artist.' },
      { status: 500 }
    );
  }
}
