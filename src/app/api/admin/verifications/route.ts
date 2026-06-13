import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/admin/verifications — list all artists with pending verification submissions
export async function GET(request: NextRequest) {
  try {
    const allUsers = db.getUsers();
    const artists = allUsers.filter(u => u.role === 'ARTIST');

    const requests = artists.map(artist => {
      const profile = db.getArtistProfile(artist.id);
      const submission = profile?.verificationSubmission;
      if (!submission) return null;
      return {
        artistId: artist.id,
        artistName: profile?.stageName || artist.name,
        email: artist.email,
        avatar: profile?.avatar || artist.avatar || '',
        genre: profile?.primaryGenre || 'Unknown',
        city: profile?.city || '',
        country: profile?.country || '',
        submittedAt: submission.submittedAt,
        level: submission.level,
        status: submission.status,
        notes: submission.notes || '',
        documents: submission.documents || [],
        currentLevel: profile?.verificationLevel || 'none',
      };
    }).filter(Boolean);

    // Sort pending first, then by date
    requests.sort((a: any, b: any) => {
      if (a.status === 'under_review' && b.status !== 'under_review') return -1;
      if (b.status === 'under_review' && a.status !== 'under_review') return 1;
      return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
    });

    return NextResponse.json({ success: true, requests });
  } catch (err) {
    console.error('Admin verifications GET error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/admin/verifications — approve or reject a verification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { artistId, action, level } = body; // action: 'approve' | 'reject'

    if (!artistId || !action) {
      return NextResponse.json({ error: 'artistId and action required' }, { status: 400 });
    }

    const profile = db.getArtistProfile(artistId) || {};
    const submission = profile.verificationSubmission;
    if (!submission) {
      return NextResponse.json({ error: 'No pending verification found' }, { status: 404 });
    }

    const auditLog = profile.auditLog || [];

    if (action === 'approve') {
      const updatedProfile = {
        ...profile,
        verificationLevel: level || submission.level || 'verified_artist',
        verificationApprovedAt: new Date().toISOString(),
        verificationSubmission: { ...submission, status: 'approved' },
        auditLog: [{ id: `al-${Date.now()}`, action: 'verification_approved', details: `Admin approved verification: ${level || submission.level}`, timestamp: new Date().toISOString() }, ...auditLog].slice(0, 50),
      };
      db.saveArtistProfile(artistId, updatedProfile);
      return NextResponse.json({ success: true, message: 'Artist verified successfully' });
    }

    if (action === 'reject') {
      const updatedProfile = {
        ...profile,
        verificationSubmission: { ...submission, status: 'rejected' },
        auditLog: [{ id: `al-${Date.now()}`, action: 'verification_rejected', details: 'Admin rejected verification request', timestamp: new Date().toISOString() }, ...auditLog].slice(0, 50),
      };
      db.saveArtistProfile(artistId, updatedProfile);
      return NextResponse.json({ success: true, message: 'Verification rejected' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    console.error('Admin verifications POST error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
