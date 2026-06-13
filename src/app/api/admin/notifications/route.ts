import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/rbac';
import { db, AdminNotificationEntity } from '@/lib/db';

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
    const notifications = db.getAdminNotifications();
    const templates = db.getNotificationTemplates();

    // 1. Calculate Sent Today
    const todayStr = new Date().toISOString().split('T')[0];
    const sentToday = notifications.filter(n => n.sentAt && n.sentAt.startsWith(todayStr) && n.status === 'sent').length;

    // 2. Calculate Unsubscribed (users who disabled push or email in preferences)
    const unsubscribed = allUsers.filter(u => {
      const prefs = u.preferences as any;
      return prefs && (prefs.pushNotifs === false || prefs.emailNotifs === false);
    }).length;

    // 3. Calculate Target Audiences
    const audienceSizes = {
      all: allUsers.length,
      premium: allUsers.filter(u => u.subscription === 'premium' || u.subscription === 'family' || u.subscription === 'student').length,
      free: allUsers.filter(u => u.subscription === 'free' || !u.subscription).length,
      artists: allUsers.filter(u => u.role === 'ARTIST').length,
    };

    return NextResponse.json({
      success: true,
      notifications,
      templates,
      stats: {
        sentToday,
        unsubscribed,
        audienceSizes,
      }
    });
  } catch (err: any) {
    console.error('Fetch admin notifications stats error:', err);
    return NextResponse.json({ error: 'Failed to fetch notification data' }, { status: 500 });
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
    const { title, message, audience, type, status, scheduledTime } = body;

    if (!title || !message) {
      return NextResponse.json({ error: 'Title and message are required' }, { status: 400 });
    }

    const allUsers = db.getUsers();
    
    // Determine audience size
    let targetCount = allUsers.length;
    if (audience === 'premium') {
      targetCount = allUsers.filter(u => u.subscription === 'premium' || u.subscription === 'family' || u.subscription === 'student').length;
    } else if (audience === 'free') {
      targetCount = allUsers.filter(u => u.subscription === 'free' || !u.subscription).length;
    } else if (audience === 'artists') {
      targetCount = allUsers.filter(u => u.role === 'ARTIST').length;
    }

    // Determine unsubscribe rates in target audience
    const unsubCount = allUsers.filter(u => {
      const prefs = u.preferences as any;
      if (!prefs) return false;
      if (type === 'push' && prefs.pushNotifs === false) return true;
      if (type === 'email' && prefs.emailNotifs === false) return true;
      return false;
    }).length;

    const deliveredCount = status === 'sent' ? Math.max(0, targetCount - unsubCount) : 0;
    
    // Simulate open/CTR stats
    let openedCount = 0;
    let ctr = 0;
    if (status === 'sent' && deliveredCount > 0) {
      const openRate = 0.25 + Math.random() * 0.25; // 25% - 50%
      openedCount = Math.round(deliveredCount * openRate);
      ctr = Math.round((openedCount / deliveredCount) * 1000) / 10; // e.g. 15.4%
    }

    const newNotif: AdminNotificationEntity = {
      id: `N-${Date.now()}`,
      title,
      message,
      audience,
      type,
      status,
      sentCount: targetCount,
      deliveredCount,
      openedCount,
      ctr,
      sentAt: status === 'sent' ? new Date().toISOString() : '',
      scheduledTime: status === 'scheduled' ? scheduledTime : undefined,
    };

    const saved = db.saveAdminNotification(newNotif);

    return NextResponse.json({
      success: true,
      notification: saved,
    });
  } catch (err: any) {
    console.error('Create admin notification error:', err);
    return NextResponse.json({ error: 'Failed to save broadcast notification' }, { status: 500 });
  }
}
