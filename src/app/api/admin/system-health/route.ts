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
    const services = db.getSystemServices();
    return NextResponse.json({
      success: true,
      services,
    });
  } catch (err: any) {
    console.error('System Health GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch services status' }, { status: 500 });
  }
}

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
    const { name, status } = body;

    if (!name || !status) {
      return NextResponse.json({ error: 'Name and status are required' }, { status: 400 });
    }

    const validStatuses = ['operational', 'degraded', 'down'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }

    const success = db.updateServiceStatus(name, status);
    if (!success) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `System service "${name}" status updated to ${status}.`,
    });
  } catch (err: any) {
    console.error('System Health POST error:', err);
    return NextResponse.json({ error: 'Failed to update service status' }, { status: 500 });
  }
}
