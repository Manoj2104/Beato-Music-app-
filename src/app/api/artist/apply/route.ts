import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/rbac';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const rbacCheck = await requireUser(request);
  if (!rbacCheck.authorized || !rbacCheck.user) {
    return NextResponse.json(
      { error: rbacCheck.message || 'Unauthorized' },
      { status: rbacCheck.status || 401 }
    );
  }

  try {
    const userId = rbacCheck.user.userId;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const apps = db.getArtistApplications();
    const userApp = apps.find((a) => a.userId === userId);
    return NextResponse.json({ success: true, application: userApp || null });
  } catch (err) {
    console.error('Artist apply GET error:', err);
    return NextResponse.json({ error: 'Server error retrieving status.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const rbacCheck = await requireUser(request);
  if (!rbacCheck.authorized || !rbacCheck.user) {
    return NextResponse.json(
      { error: rbacCheck.message || 'Unauthorized' },
      { status: rbacCheck.status || 401 }
    );
  }

  try {
    const userId = rbacCheck.user.userId;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const { artistName, dob, bio, country, profileImage, socialLinks } = body;

    if (!artistName) {
      return NextResponse.json({ error: 'Artist Name is required.' }, { status: 400 });
    }
    if (!dob) {
      return NextResponse.json({ error: 'Date of Birth is required.' }, { status: 400 });
    }
    if (!profileImage) {
      return NextResponse.json({ error: 'Profile Photo is required.' }, { status: 400 });
    }

    const app = db.saveArtistApplication({
      id: `app-${Date.now()}`,
      userId,
      artistName,
      dob,
      bio: bio || '',
      country: country || 'IN',
      profileImage,
      socialLinks: socialLinks || {},
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, application: app });
  } catch (err) {
    console.error('Artist apply POST error:', err);
    return NextResponse.json({ error: 'Server error saving application.' }, { status: 500 });
  }
}
