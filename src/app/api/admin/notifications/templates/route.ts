import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/rbac';
import { db, NotificationTemplateEntity } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const rbacCheck = await requireAdmin(request);
  if (!rbacCheck.authorized) {
    return NextResponse.json(
      { error: rbacCheck.message || 'Forbidden' },
      { status: rbacCheck.status || 403 }
    );
  }

  try {
    const body = await request.json();
    const { id, name, type, preview } = body;

    if (!name || !type || !preview) {
      return NextResponse.json({ error: 'Name, type, and preview message are required' }, { status: 400 });
    }

    const newTemplate: NotificationTemplateEntity = {
      id: id || `T-${Date.now()}`,
      name,
      type,
      preview,
      createdAt: new Date().toISOString(),
    };

    const saved = db.saveNotificationTemplate(newTemplate);

    return NextResponse.json({
      success: true,
      template: saved,
    });
  } catch (err: any) {
    console.error('Save notification template error:', err);
    return NextResponse.json({ error: 'Failed to save template' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const rbacCheck = await requireAdmin(request);
  if (!rbacCheck.authorized) {
    return NextResponse.json(
      { error: rbacCheck.message || 'Forbidden' },
      { status: rbacCheck.status || 403 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }

    const deleted = db.deleteNotificationTemplate(id);

    if (!deleted) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (err: any) {
    console.error('Delete notification template error:', err);
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
  }
}
