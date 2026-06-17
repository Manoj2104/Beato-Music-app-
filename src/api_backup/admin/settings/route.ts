import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/rbac';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/admin/settings — returns platformSettings + messagingConfig + automationRules
export async function GET(request: NextRequest) {
  const rbacCheck = await requireAdmin(request);
  if (!rbacCheck.authorized) {
    return NextResponse.json({ error: rbacCheck.message || 'Forbidden' }, { status: rbacCheck.status || 403 });
  }

  const platformSettings = db.getPlatformSettings();
  const messagingConfig = db.getMessagingConfig();
  const automationRules = db.getAutomationRules();

  // Redact sensitive fields for security — show dots if value exists, empty string if not set
  const safeConfig = {
    ...messagingConfig,
    email: { ...messagingConfig.email, pass: messagingConfig.email.pass ? '••••••••••••••••' : '' },
    whatsapp: { ...messagingConfig.whatsapp, accessToken: messagingConfig.whatsapp.accessToken ? '••••••••••••••••' : '' },
    sms: { ...messagingConfig.sms, authToken: messagingConfig.sms.authToken ? '••••••••••••••••' : '' },
  };

  return NextResponse.json({ platformSettings, messagingConfig: safeConfig, automationRules });
}

// POST /api/admin/settings — saves settings
export async function POST(request: NextRequest) {
  const rbacCheck = await requireAdmin(request);
  if (!rbacCheck.authorized) {
    return NextResponse.json({ error: rbacCheck.message || 'Forbidden' }, { status: rbacCheck.status || 403 });
  }

  const body = await request.json();
  const { type, data } = body;

  if (type === 'platformSettings') {
    const saved = db.savePlatformSettings(data);
    return NextResponse.json({ success: true, platformSettings: saved });
  }

  if (type === 'messagingConfig') {
    // Merge with existing to preserve sensitive fields if redacted placeholder is sent
    const existing = db.getMessagingConfig();
    const merged = {
      ...existing,
      ...data,
      email: {
        ...existing.email,
        ...data.email,
        pass: data.email?.pass && data.email.pass !== '••••••••••••••••' ? data.email.pass : existing.email.pass,
      },
      whatsapp: {
        ...existing.whatsapp,
        ...data.whatsapp,
        accessToken: data.whatsapp?.accessToken && data.whatsapp.accessToken !== '••••••••••••••••' ? data.whatsapp.accessToken : existing.whatsapp.accessToken,
      },
      sms: {
        ...existing.sms,
        ...data.sms,
        authToken: data.sms?.authToken && data.sms.authToken !== '••••••••••••••••' ? data.sms.authToken : existing.sms.authToken,
      },
    };
    const saved = db.saveMessagingConfig(merged);
    return NextResponse.json({ success: true, messagingConfig: saved });
  }

  if (type === 'automationRule') {
    const saved = db.saveAutomationRule(data);
    return NextResponse.json({ success: true, rule: saved });
  }

  if (type === 'deleteAutomationRule') {
    const ok = db.deleteAutomationRule(data.id);
    return NextResponse.json({ success: ok });
  }

  return NextResponse.json({ error: 'Unknown settings type' }, { status: 400 });
}
