import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'crypto';

// ─── Super Admin guard ────────────────────────────────────────────────────────
async function requireSuperAdmin(request: NextRequest): Promise<boolean> {
  try {
    const { requireAdmin } = await import('@/lib/rbac');
    const check = await requireAdmin(request);
    if (!check.authorized) return false;
    // Further restrict to super admin only
    const user = (check as any).user;
    if (!user) return false;
    return user.role === 'SUPER_ADMIN' || user.role === 'super_admin';
  } catch {
    return false;
  }
}

// ─── Persistent data via db.getAdsConfig / db.saveAdsConfig ──────────────────
function readAdsDb(): any {
  try {
    const stored = db.getAdsConfig();
    if (stored) {
      if (stored._fullAdsData) return stored._fullAdsData;
      if (stored._adsData) return stored._adsData;
    }
    return getDefaults();
  } catch {
    return getDefaults();
  }
}

function writeAdsDb(data: any) {
  try {
    const current = db.getAdsConfig() || {};
    db.saveAdsConfig({ ...current, _fullAdsData: data, _adsData: data });
  } catch {}
}

function getDefaults() {
  return {
    campaigns: [],
    ads: [],
    advertisers: [],
    approvalQueue: [],
    adsenseConfig: {
      enabled: false, publisherId: '', clientId: '', clientSecret: '',
      apiKey: '', refreshToken: '', sandboxMode: true, autoSync: true, status: 'disconnected', lastSync: null,
    },
    settings: {
      defaultCurrency: 'USD', taxRate: 18, platformCommission: 30, revenueShare: 70,
      autoApproval: false, defaultFrequency: 3, maxAdsPerHour: 8,
      maxAudioAds: 2, maxBannerAds: 4, gdprEnabled: true, coppaEnabled: true,
      ccpaEnabled: true, adBlockDetection: true, cookieConsent: true,
    },
    placementStates: {},
    targetingConfig: {
      ageMin: 13, ageMax: 65, countries: ['IN'], languages: ['en'],
      interests: [], deviceTypes: ['mobile', 'desktop', 'tablet'],
      osTypes: ['android', 'ios', 'windows', 'macos'],
      onlyFreeUsers: true, excludePremium: true,
    },
    logs: [],
    revenueData: {},
  };
}

function addLog(data: any, action: string, detail: string, level: 'info' | 'success' | 'warning' | 'error' = 'info') {
  const log = { id: 'log-' + Date.now() + '-' + crypto.randomBytes(3).toString('hex'), action, detail, timestamp: new Date().toISOString(), level };
  data.logs = [log, ...(data.logs || [])].slice(0, 200); // keep last 200
}

// ─── GET ──────────────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const ok = await requireSuperAdmin(request);
  if (!ok) return NextResponse.json({ error: 'Forbidden — Super Admin only' }, { status: 403 });

  const data = readAdsDb();
  // Inject homepage sections data so Placement Manager arranger knows home sections
  const homeData = db.getHomepageData();
  data.homeLayoutOrder = homeData.homeLayoutOrder || [];
  data.customSections = homeData.customSections || {};
  return NextResponse.json({ success: true, data });
}

// ─── POST ─────────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const ok = await requireSuperAdmin(request);
  if (!ok) return NextResponse.json({ error: 'Forbidden — Super Admin only' }, { status: 403 });

  try {
    const body = await request.json();
    const { action, payload } = body as { action: string; payload: any };
    const data = readAdsDb();

    // ── AdSense config ─────────────────────────────────────────────────────
    if (action === 'update_adsense') {
      data.adsenseConfig = { ...data.adsenseConfig, ...payload };
      addLog(data, 'AdSense Updated', `Status: ${data.adsenseConfig.status || 'updated'}`);
      writeAdsDb(data);
      return NextResponse.json({ success: true, adsenseConfig: data.adsenseConfig });
    }

    // ── Settings ───────────────────────────────────────────────────────────
    if (action === 'update_settings') {
      data.settings = { ...data.settings, ...payload };
      addLog(data, 'Settings Updated', 'Global ad settings changed');
      writeAdsDb(data);
      return NextResponse.json({ success: true, settings: data.settings });
    }

    // ── Placements ─────────────────────────────────────────────────────────
    if (action === 'update_placements') {
      data.placementStates = { ...data.placementStates, ...(payload.placementStates || {}) };
      if (payload.adMappings) {
        data.adMappings = { ...(data.adMappings || {}), ...payload.adMappings };
      }
      if (payload.settings) {
        data.settings = { ...(data.settings || {}), ...payload.settings };
      }
      if (payload.adOrder) {
        data.adOrder = payload.adOrder;
      }
      if (payload.sectionAds) {
        data.sectionAds = payload.sectionAds;
      }
      const enabled = Object.entries(data.placementStates).filter(([, v]) => v).map(([k]) => k).join(', ');
      addLog(data, 'Placements & Settings Updated', 'Ad slots, mappings, styling, and section-specific ad layout configuration saved to database');
      writeAdsDb(data);
      return NextResponse.json({ success: true });
    }

    // ── Targeting ──────────────────────────────────────────────────────────
    if (action === 'update_targeting') {
      data.targetingConfig = { ...data.targetingConfig, ...(payload.targetingConfig || {}) };
      addLog(data, 'Targeting Updated', `Countries: ${data.targetingConfig.countries?.join(', ')}`);
      writeAdsDb(data);
      return NextResponse.json({ success: true });
    }

    // ── Campaigns ──────────────────────────────────────────────────────────
    if (action === 'create_campaign') {
      const campaign = {
        id: 'cmp-' + Date.now(),
        ...payload,
        createdAt: new Date().toISOString(),
      };
      data.campaigns = [...(data.campaigns || []), campaign];
      addLog(data, 'Campaign Created', `"${campaign.name}" by ${campaign.advertiser || 'Unknown'}`, 'success');
      writeAdsDb(data);
      return NextResponse.json({ success: true, campaign });
    }

    if (action === 'update_campaign') {
      data.campaigns = (data.campaigns || []).map((c: any) => c.id === payload.id ? { ...c, ...payload } : c);
      addLog(data, 'Campaign Updated', `Campaign id ${payload.id} → status: ${payload.status || 'updated'}`);
      writeAdsDb(data);
      return NextResponse.json({ success: true });
    }

    if (action === 'delete_campaign') {
      const camp = (data.campaigns || []).find((c: any) => c.id === payload.id);
      data.campaigns = (data.campaigns || []).filter((c: any) => c.id !== payload.id);
      addLog(data, 'Campaign Deleted', `"${camp?.name || payload.id}" removed`, 'warning');
      writeAdsDb(data);
      return NextResponse.json({ success: true });
    }

    // ── Ads ────────────────────────────────────────────────────────────────
    if (action === 'create_ad') {
      const ad = {
        id: 'ad-' + Date.now(),
        ...payload,
        impressions: 0, clicks: 0,
        createdAt: new Date().toISOString(),
      };
      data.ads = [...(data.ads || []), ad];
      addLog(data, 'Ad Created', `"${ad.name}" (${ad.type}) → placement: ${ad.placement || 'none'}`, 'success');
      writeAdsDb(data);
      return NextResponse.json({ success: true, ad });
    }

    if (action === 'update_ad') {
      data.ads = (data.ads || []).map((a: any) => a.id === payload.id ? { ...a, ...payload } : a);
      addLog(data, 'Ad Updated', `Ad ${payload.id} → ${payload.status || 'updated'}`);
      writeAdsDb(data);
      return NextResponse.json({ success: true });
    }

    if (action === 'delete_ad') {
      const ad = (data.ads || []).find((a: any) => a.id === payload.id);
      data.ads = (data.ads || []).filter((a: any) => a.id !== payload.id);
      addLog(data, 'Ad Deleted', `"${ad?.name || payload.id}" removed`, 'warning');
      writeAdsDb(data);
      return NextResponse.json({ success: true });
    }

    // ── Advertisers ────────────────────────────────────────────────────────
    if (action === 'create_advertiser') {
      const advertiser = {
        id: 'adv-' + Date.now(),
        ...payload,
        status: 'pending',
        totalSpent: 0,
        activeCampaigns: 0,
        joinedAt: new Date().toISOString(),
      };
      data.advertisers = [...(data.advertisers || []), advertiser];
      addLog(data, 'Advertiser Added', `${advertiser.name} (${advertiser.email})`, 'success');
      writeAdsDb(data);
      return NextResponse.json({ success: true, advertiser });
    }

    if (action === 'update_advertiser') {
      data.advertisers = (data.advertisers || []).map((a: any) => a.id === payload.id ? { ...a, ...payload } : a);
      writeAdsDb(data);
      return NextResponse.json({ success: true });
    }

    if (action === 'delete_advertiser') {
      data.advertisers = (data.advertisers || []).filter((a: any) => a.id !== payload.id);
      writeAdsDb(data);
      return NextResponse.json({ success: true });
    }

    // ── Approval queue ─────────────────────────────────────────────────────
    if (action === 'submit_for_approval') {
      const item = {
        id: 'apq-' + Date.now(),
        ...payload,
        status: 'pending',
        submittedAt: new Date().toISOString(),
      };
      data.approvalQueue = [...(data.approvalQueue || []), item];
      addLog(data, 'Ad Submitted', `"${item.adName}" submitted by ${item.advertiser}`, 'info');
      writeAdsDb(data);
      return NextResponse.json({ success: true });
    }

    if (action === 'approve_ad') {
      data.approvalQueue = (data.approvalQueue || []).map((a: any) =>
        a.id === payload.id ? { ...a, status: 'approved', reviewedAt: new Date().toISOString() } : a
      );
      addLog(data, 'Ad Approved', `"${payload.adName}" approved`, 'success');
      writeAdsDb(data);
      return NextResponse.json({ success: true });
    }

    if (action === 'reject_ad') {
      data.approvalQueue = (data.approvalQueue || []).map((a: any) =>
        a.id === payload.id ? { ...a, status: 'rejected', notes: payload.notes || '', reviewedAt: new Date().toISOString() } : a
      );
      addLog(data, 'Ad Rejected', `"${payload.adName}": ${payload.notes || 'No reason given'}`, 'warning');
      writeAdsDb(data);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (e: any) {
    console.error('[ads API error]', e);
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 });
  }
}
