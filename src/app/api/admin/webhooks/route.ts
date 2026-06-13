import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/rbac';
import { db, WebhookEntity, WebhookLogEntity, AuditLogEntity } from '@/lib/db';
import crypto from 'crypto';

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
    const webhooks = db.getWebhooks();
    const logs = db.getWebhookLogs();
    return NextResponse.json({
      success: true,
      webhooks,
      logs,
    });
  } catch (err: any) {
    console.error('Webhooks GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch webhooks' }, { status: 500 });
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
    const { action, id, url, description, events, status } = body;
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';

    if (action === 'create') {
      if (!url || !events || !events.length) {
        return NextResponse.json({ error: 'Webhook URL and events are required' }, { status: 400 });
      }

      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return NextResponse.json({ error: 'Invalid URL. Must start with http:// or https://' }, { status: 400 });
      }

      const signingSecret = `whsec_${crypto.randomBytes(16).toString('hex')}`;
      const newWebhook: WebhookEntity = {
        id: `wh-${Date.now()}`,
        url,
        description: description || '',
        events,
        status: status || 'active',
        signingSecret,
        createdAt: new Date().toISOString(),
      };

      db.saveWebhook(newWebhook);

      db.addGeneralAuditLog({
        id: `audit-${Date.now()}`,
        userId: rbacCheck.user?.userId || 'admin-user-1',
        userName: rbacCheck.user?.name || 'Platform Moderator',
        action: 'webhook_created',
        target: url,
        ipAddress: ip,
        location: 'Internal',
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        result: 'success',
        category: 'Admin Actions',
        severity: 'low',
      });

      return NextResponse.json({
        success: true,
        message: 'Webhook configuration saved successfully.',
        webhook: newWebhook,
      });
    }

    if (action === 'toggle') {
      if (!id) {
        return NextResponse.json({ error: 'Webhook ID is required' }, { status: 400 });
      }
      const webhooks = db.getWebhooks();
      const webhook = webhooks.find(w => w.id === id);
      if (!webhook) {
        return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
      }

      webhook.status = webhook.status === 'active' ? 'inactive' : 'active';
      db.saveWebhook(webhook);

      db.addGeneralAuditLog({
        id: `audit-${Date.now()}`,
        userId: rbacCheck.user?.userId || 'admin-user-1',
        userName: rbacCheck.user?.name || 'Platform Moderator',
        action: 'webhook_toggled',
        target: `${webhook.url} (${webhook.status})`,
        ipAddress: ip,
        location: 'Internal',
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        result: 'success',
        category: 'Admin Actions',
        severity: 'low',
      });

      return NextResponse.json({
        success: true,
        message: `Webhook ${webhook.status === 'active' ? 'activated' : 'deactivated'} successfully.`,
        webhook,
      });
    }

    if (action === 'delete') {
      if (!id) {
        return NextResponse.json({ error: 'Webhook ID is required' }, { status: 400 });
      }
      
      const existing = db.getWebhooks().find(w => w.id === id);
      const targetUrl = existing ? existing.url : id;

      const success = db.deleteWebhook(id);
      if (!success) {
        return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
      }

      db.addGeneralAuditLog({
        id: `audit-${Date.now()}`,
        userId: rbacCheck.user?.userId || 'admin-user-1',
        userName: rbacCheck.user?.name || 'Platform Moderator',
        action: 'webhook_deleted',
        target: targetUrl,
        ipAddress: ip,
        location: 'Internal',
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        result: 'success',
        category: 'Admin Actions',
        severity: 'low',
      });

      return NextResponse.json({
        success: true,
        message: 'Webhook configuration deleted successfully.',
      });
    }

    if (action === 'test') {
      if (!id) {
        return NextResponse.json({ error: 'Webhook ID is required' }, { status: 400 });
      }
      const webhooks = db.getWebhooks();
      const webhook = webhooks.find(w => w.id === id);
      if (!webhook) {
        return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
      }

      // Simulate a webhook delivery!
      const event = (webhook.events && webhook.events.length > 0) ? webhook.events[Math.floor(Math.random() * webhook.events.length)] : 'track.created';
      
      const isSuccess = Math.random() > 0.15; // 85% success rate
      const statusText = isSuccess ? 'OK' : 'Internal Server Error';
      const statusCode = isSuccess ? 200 : 500;
      const responseBody = isSuccess 
        ? JSON.stringify({ success: true, message: 'Received' }) 
        : 'Error: Webhook endpoint timed out after 3000ms';
      const durationMs = Math.floor(Math.random() * 400) + 50;

      let payloadObj = {
        event,
        timestamp: new Date().toISOString(),
        id: `evt_${crypto.randomBytes(8).toString('hex')}`,
        data: {} as any
      };

      if (event === 'track.created') {
        payloadObj.data = { id: 'track-99', title: 'Cyberpunk Symphony', artist: 'Cipher Nova', genre: 'Synthwave', duration: 184 };
      } else if (event === 'playlist.updated') {
        payloadObj.data = { id: 'playlist-42', name: 'Workout Power Mix', trackCount: 24 };
      } else {
        payloadObj.data = { message: 'This is a test webhook payload from Beato Enterprise' };
      }

      const newLog: WebhookLogEntity = {
        id: `whlog-${Date.now()}`,
        webhookId: webhook.id,
        webhookUrl: webhook.url,
        event,
        status: statusCode,
        statusText,
        payload: JSON.stringify(payloadObj),
        response: responseBody,
        timestamp: new Date().toISOString(),
        durationMs,
      };

      db.addWebhookLog(newLog);

      db.addGeneralAuditLog({
        id: `audit-${Date.now()}`,
        userId: rbacCheck.user?.userId || 'admin-user-1',
        userName: rbacCheck.user?.name || 'Platform Moderator',
        action: 'webhook_tested',
        target: `${webhook.url} (${event})`,
        ipAddress: ip,
        location: 'Internal',
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        result: isSuccess ? 'success' : 'failure',
        category: 'Admin Actions',
        severity: isSuccess ? 'low' : 'medium',
      });
      
      return NextResponse.json({
        success: true,
        message: `Test delivery simulated. Status: ${statusCode} ${statusText}`,
        log: newLog,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    console.error('Webhooks POST error:', err);
    return NextResponse.json({ error: 'Failed to manage webhook' }, { status: 500 });
  }
}
