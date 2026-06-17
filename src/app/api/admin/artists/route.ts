import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/rbac';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const rbacCheck = await requireAdmin(request);
  if (!rbacCheck.authorized) {
    return NextResponse.json(
      { error: rbacCheck.message || 'Forbidden' },
      { status: rbacCheck.status || 403 }
    );
  }

  try {
    const allUsers = db.getUsers();
    const allTracks = db.getTracks();

    // Map each artist user to include their dynamic track counts and aggregate metrics
    const artists = allUsers
      .filter((u) => u.role === 'ARTIST')
      .map((user) => {
        const tracksCount = allTracks.filter((t) => t.artistId === user.id && t.status === 'approved').length;
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
          country: user.country || 'US',
          followers: user.followers || 0,
          isActive: user.isActive !== false, // default true
          createdAt: user.createdAt,
          tracksCount,
        };
      });

    return NextResponse.json({
      success: true,
      artists,
    });
  } catch (err: any) {
    console.error('Fetch admin artists error:', err);
    return NextResponse.json({ error: 'Failed to fetch artists' }, { status: 500 });
  }
}
