import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/rbac';
import { sendEmail, sendWhatsApp, sendSMS } from '@/lib/messaging';

export const dynamic = 'force-dynamic';

// POST /api/admin/messaging/test — tests a messaging channel with the saved configuration
export async function POST(request: NextRequest) {
  const rbacCheck = await requireAdmin(request);
  if (!rbacCheck.authorized) {
    return NextResponse.json({ error: rbacCheck.message || 'Forbidden' }, { status: rbacCheck.status || 403 });
  }

  const { channel, to, message, subject } = await request.json();

  if (!channel || !to || !message) {
    return NextResponse.json({ error: 'channel, to, and message are required' }, { status: 400 });
  }

  let result: { success: boolean; error?: string };

  if (channel === 'email') {
    result = await sendEmail({ to, subject: subject || 'Beato Test Email', text: message });
  } else if (channel === 'whatsapp') {
    result = await sendWhatsApp({ to, message });
  } else if (channel === 'sms') {
    result = await sendSMS({ to, message });
  } else {
    return NextResponse.json({ error: 'Invalid channel. Use: email, whatsapp, sms' }, { status: 400 });
  }

  return NextResponse.json(result, { status: result.success ? 200 : 422 });
}
