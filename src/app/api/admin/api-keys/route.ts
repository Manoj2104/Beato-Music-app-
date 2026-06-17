import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/rbac';
import { db, ApiKeyEntity, AuditLogEntity } from '@/lib/db';
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
    const keys = db.getApiKeys();
    
    // Generate some mock metrics for usage charts
    const metrics = {
      totalRequests: 125302,
      errorRate: 0.42,
      p95Latency: 84,
      p99Latency: 210,
      dailyTraffic: [
        { date: 'May 28', requests: 14200, errors: 42 },
        { date: 'May 29', requests: 15600, errors: 51 },
        { date: 'May 30', requests: 18900, errors: 98 },
        { date: 'May 31', requests: 22100, errors: 72 },
        { date: 'Jun 01', requests: 24500, errors: 110 },
        { date: 'Jun 02', requests: 28400, errors: 120 },
        { date: 'Jun 03', requests: 29900, errors: 115 },
      ],
      keyUsageBreakdown: keys.map(k => {
        let reqCount = 0;
        if (k.id === 'key-1') reqCount = 32100;
        else if (k.id === 'key-2') reqCount = 84200;
        else if (k.id === 'key-3') reqCount = 9002;
        else reqCount = Math.floor(Math.random() * 500) + 10;
        return { name: k.name, requests: reqCount };
      })
    };

    return NextResponse.json({
      success: true,
      keys,
      metrics,
    });
  } catch (err: any) {
    console.error('API Keys GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch API keys' }, { status: 500 });
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
    const { action, name, rateLimit, env, perms, id, tier, ipWhitelist, expiresAt } = body;

    if (action === 'create') {
      if (!name || !env || !perms) {
        return NextResponse.json({ error: 'Name, env, and perms are required' }, { status: 400 });
      }

      // Resolve rate limit based on tier if not explicitly specified
      let finalRateLimit = Number(rateLimit);
      if (!finalRateLimit) {
        if (tier === 'Bronze') finalRateLimit = 2000;
        else if (tier === 'Silver') finalRateLimit = 5000;
        else if (tier === 'Gold') finalRateLimit = 10000;
        else finalRateLimit = 1000;
      }

      const randomBytes = crypto.randomBytes(12).toString('hex');
      const generatedKey = `sk_${env === 'prod' ? 'live' : 'dev'}_${randomBytes}`;
      
      let parsedIPs: string[] = [];
      if (Array.isArray(ipWhitelist)) {
        parsedIPs = ipWhitelist;
      } else if (typeof ipWhitelist === 'string') {
        parsedIPs = ipWhitelist
          .split(',')
          .map((ip: string) => ip.trim())
          .filter(Boolean);
      }

      const newKey: ApiKeyEntity = {
        id: `key-${Date.now()}`,
        name,
        key: generatedKey,
        env,
        perms,
        rateLimit: finalRateLimit,
        status: 'active',
        lastUsed: 'Never',
        ipWhitelist: parsedIPs,
        expiresAt: expiresAt || 'Never',
        tier: tier || 'Custom',
        createdAt: new Date().toISOString(),
      };

      db.saveApiKey(newKey);
      
      const ip = request.headers.get('x-forwarded-for') || (request as any).ip || '127.0.0.1';
      db.addGeneralAuditLog({
        id: `audit-${Date.now()}`,
        userId: rbacCheck.user?.userId || 'admin-user-1',
        userName: rbacCheck.user?.name || 'Platform Moderator',
        action: 'api_key_created',
        target: name,
        ipAddress: ip,
        location: 'Internal',
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        result: 'success',
        category: 'Admin Actions',
        severity: 'low',
      });

      return NextResponse.json({
        success: true,
        message: `API Key "${name}" generated successfully.`,
        key: newKey,
      });
    }

    if (action === 'regenerate') {
      if (!id) {
        return NextResponse.json({ error: 'Key ID is required' }, { status: 400 });
      }

      const keys = db.getApiKeys();
      const existingKey = keys.find(k => k.id === id);
      if (!existingKey) {
        return NextResponse.json({ error: 'API key not found' }, { status: 404 });
      }

      const randomBytes = crypto.randomBytes(12).toString('hex');
      const generatedKey = `sk_${existingKey.env === 'prod' ? 'live' : 'dev'}_${randomBytes}`;
      
      existingKey.key = generatedKey;
      existingKey.lastUsed = 'Never'; // Reset last used

      db.saveApiKey(existingKey);
      
      const ip = request.headers.get('x-forwarded-for') || (request as any).ip || '127.0.0.1';
      db.addGeneralAuditLog({
        id: `audit-${Date.now()}`,
        userId: rbacCheck.user?.userId || 'admin-user-1',
        userName: rbacCheck.user?.name || 'Platform Moderator',
        action: 'api_key_rotated',
        target: existingKey.name,
        ipAddress: ip,
        location: 'Internal',
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        result: 'success',
        category: 'Admin Actions',
        severity: 'low',
      });

      return NextResponse.json({
        success: true,
        message: `API Key "${existingKey.name}" regenerated successfully.`,
        key: existingKey,
      });
    }

    if (action === 'revoke') {
      if (!id) {
        return NextResponse.json({ error: 'Key ID is required' }, { status: 400 });
      }

      const existingKey = db.getApiKeys().find(k => k.id === id);
      const keyName = existingKey ? existingKey.name : id;

      const success = db.deleteApiKey(id);
      if (!success) {
        return NextResponse.json({ error: 'API key not found' }, { status: 404 });
      }

      const ip = request.headers.get('x-forwarded-for') || (request as any).ip || '127.0.0.1';
      db.addGeneralAuditLog({
        id: `audit-${Date.now()}`,
        userId: rbacCheck.user?.userId || 'admin-user-1',
        userName: rbacCheck.user?.name || 'Platform Moderator',
        action: 'api_key_revoked',
        target: keyName,
        ipAddress: ip,
        location: 'Internal',
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        result: 'success',
        category: 'Admin Actions',
        severity: 'low',
      });

      return NextResponse.json({
        success: true,
        message: 'API Key revoked successfully.',
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    console.error('API Keys POST error:', err);
    return NextResponse.json({ error: 'Failed to manage API key' }, { status: 500 });
  }
}

