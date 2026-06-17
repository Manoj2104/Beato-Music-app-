import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/rbac';
import { db } from '@/lib/db';
import { verifyJWT } from '@/lib/jwt';

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
    const replies = db.getCannedReplies();
    return NextResponse.json({ success: true, replies });
  } catch (err: any) {
    console.error('Fetch canned replies error:', err);
    return NextResponse.json({ error: 'Failed to fetch canned replies' }, { status: 500 });
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

  // Only admins can modify canned replies
  const isAdmin = rbacCheck.user.role === 'ADMIN' || rbacCheck.user.role === 'SUPER_ADMIN';
  if (!isAdmin) {
    return NextResponse.json({ error: 'Access denied: Admin role required' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { action, id, title, text } = body;

    if (action === 'save') {
      if (!title || !text) {
        return NextResponse.json({ error: 'Title and text are required' }, { status: 400 });
      }
      const replyId = id || `CR-${Math.floor(1000 + Math.random() * 9000)}`;
      const saved = db.saveCannedReply({ id: replyId, title, text });
      return NextResponse.json({ success: true, reply: saved });
    }

    if (action === 'delete') {
      if (!id) {
        return NextResponse.json({ error: 'ID is required to delete' }, { status: 400 });
      }
      const deleted = db.deleteCannedReply(id);
      if (!deleted) {
        return NextResponse.json({ error: 'Canned reply not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, message: 'Deleted successfully' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    console.error('Modify canned replies error:', err);
    return NextResponse.json({ error: 'Failed to update canned reply' }, { status: 500 });
  }
}
