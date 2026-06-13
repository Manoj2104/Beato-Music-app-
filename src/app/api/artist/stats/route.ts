import { NextRequest, NextResponse } from 'next/server';
import { requireArtist } from '@/lib/rbac';
import { db } from '@/lib/db';
import { verifyJWT } from '@/lib/jwt';

export async function GET(request: NextRequest) {
  // Validate RBAC - artist role or higher is required
  const rbacCheck = await requireArtist(request);
  if (!rbacCheck.authorized || !rbacCheck.user) {
    return NextResponse.json(
      { error: rbacCheck.message || 'Unauthorized' },
      { status: rbacCheck.status || 401 }
    );
  }

  try {
    const token = request.cookies.get('beato-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = await verifyJWT(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid session token' }, { status: 401 });
    }

    const artistId = decoded.userId;

    // Retrieve all registered users to check their followed artists list
    const allUsers = db.getUsers();
    
    // Count how many users have this artist's ID in their followedArtists list
    const followersCount = allUsers.filter(u => 
      u.followedArtists && u.followedArtists.includes(artistId)
    ).length;

    return NextResponse.json({
      success: true,
      followersCount,
    });
  } catch (error: any) {
    console.error('Error fetching artist stats:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
