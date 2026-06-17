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

    // Map each user to include aggregate track count if they are an artist
    const users = allUsers.map((u) => {
      const tracksCount = allTracks.filter((t) => t.artistId === u.id && t.status === 'approved').length;
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        avatar: u.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
        country: u.country || 'IN',
        plan: u.subscription || 'free',
        joinedAt: u.createdAt ? u.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
        isActive: u.isActive !== false,
        tracksCount,
        verificationRequest: u.verificationRequest,
      };
    });

    return NextResponse.json({
      success: true,
      users,
    });
  } catch (err: any) {
    console.error('Fetch admin users error:', err);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
