import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/rbac';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const DB_FILE = path.join(process.cwd(), 'data', 'beato_db.json');

// Helper to read raw JSON database for custom fields
function readRawDb() {
  if (!fs.existsSync(DB_FILE)) return { campaigns: [], promos: [] };
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    return { campaigns: [], promos: [] };
  }
}

// Helper to write raw JSON database
function writeRawDb(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed writing raw marketing DB:', e);
  }
}

const DEFAULT_CAMPAIGNS = [
  { id: 'CMP-001', name: 'Summer Premium Promotion', type: 'email', status: 'active', reach: 284000, clickRate: 8.7, conversion: 3.2, budget: 1500, spend: 1200 },
  { id: 'CMP-002', name: 'Artist Spotlight Series', type: 'push', status: 'active', reach: 192000, clickRate: 12.4, conversion: 4.8, budget: 800, spend: 750 },
  { id: 'CMP-003', name: 'Family Plan Bundle', type: 'banner', status: 'paused', reach: 148000, clickRate: 5.2, conversion: 1.9, budget: 2000, spend: 400 },
  { id: 'CMP-004', name: 'Student Verification Drive', type: 'sms', status: 'completed', reach: 76000, clickRate: 21.3, conversion: 9.1, budget: 500, spend: 500 },
];

const DEFAULT_PROMO_CODES = [
  { id: 'P1', code: 'SUMMER30', discount: 30, type: 'percent', uses: 2840, limit: 5000, expiry: '2026-07-31', status: 'active' },
  { id: 'P2', code: 'STUDENT50', discount: 50, type: 'percent', uses: 1220, limit: 2000, expiry: '2026-12-31', status: 'active' },
  { id: 'P3', code: 'FAMILY20', discount: 20, type: 'percent', uses: 980, limit: 3000, expiry: '2026-08-15', status: 'active' },
  { id: 'P4', code: 'WELCOME5', discount: 5, type: 'fixed', uses: 4100, limit: 10000, expiry: '2026-12-31', status: 'active' },
  { id: 'P5', code: 'CREATOR25', discount: 25, type: 'percent', uses: 340, limit: 500, expiry: '2026-06-30', status: 'paused' },
  { id: 'P6', code: 'BLACKFRI40', discount: 40, type: 'percent', uses: 8900, limit: 9000, expiry: '2025-12-01', status: 'expired' },
  { id: 'P7', code: 'INDIE15', discount: 15, type: 'percent', uses: 220, limit: 1000, expiry: '2026-09-01', status: 'active' },
  { id: 'P8', code: 'REFER10', discount: 10, type: 'fixed', uses: 3360, limit: 0, expiry: 'Ongoing', status: 'active' },
];

export async function GET(req: NextRequest) {
  const rbacCheck = await requireAdmin(req);
  if (!rbacCheck.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const dbData = readRawDb();
    
    // Seed default lists if missing
    let updated = false;
    if (!dbData.campaigns || dbData.campaigns.length === 0) {
      dbData.campaigns = DEFAULT_CAMPAIGNS;
      updated = true;
    }
    if (!dbData.promos || dbData.promos.length === 0) {
      dbData.promos = DEFAULT_PROMO_CODES;
      updated = true;
    }
    if (updated) {
      writeRawDb(dbData);
    }

    const allUsers = db.getUsers();
    const globalCurrency = db.getGlobalCurrency();
    const currencyRate = globalCurrency === 'INR' ? 83 : 1;
    const currencySymbol = globalCurrency === 'INR' ? '₹' : '$';

    // Audience calculation targeting counts
    const targetedCounts = {
      all: allUsers.length,
      premium: allUsers.filter(u => u.subscription && u.subscription !== 'free').length,
      free: allUsers.filter(u => !u.subscription || u.subscription === 'free').length,
      artists: allUsers.filter(u => u.role === 'ARTIST').length,
    };

    // Calculate campaigns dynamically from real-time database data
    const campaigns = (dbData.campaigns || []).map((c: any) => {
      // Determine target segment
      const audience = c.audience || (
        c.id === 'CMP-002' ? 'artists' :
        c.id === 'CMP-003' ? 'premium' :
        c.id === 'CMP-004' ? 'free' :
        'all'
      );

      // Get matching users in segment
      const usersInSegment = allUsers.filter((u: any) => {
        if (audience === 'premium') return u.subscription && u.subscription !== 'free';
        if (audience === 'free') return !u.subscription || u.subscription === 'free';
        if (audience === 'artists') return u.role === 'ARTIST';
        return true; // 'all'
      });

      const reach = usersInSegment.length;

      // Click rate = fraction of active users (total listening time > 0) in segment
      const activeInSegment = usersInSegment.filter((u: any) => (u.stats?.totalListeningTime || 0) > 0).length;
      const clickRateMultiplier = c.type === 'sms' ? 1.4 : c.type === 'push' ? 1.2 : c.type === 'email' ? 0.8 : 0.6;
      let clickRate = usersInSegment.length > 0 ? (activeInSegment / usersInSegment.length) * 100 * clickRateMultiplier : 0;
      clickRate = Number(Math.min(100, Math.max(0, clickRate)).toFixed(1));

      // Conversion rate = system premium ratio * channel conversion multiplier
      const totalPremium = allUsers.filter((u: any) => u.subscription && u.subscription !== 'free').length;
      const systemPremiumRatio = allUsers.length > 0 ? (totalPremium / allUsers.length) : 0;
      const convMultiplier = c.type === 'sms' ? 1.3 : c.type === 'push' ? 1.1 : c.type === 'email' ? 0.9 : 0.7;
      let conversion = systemPremiumRatio * 100 * convMultiplier;
      conversion = Number(Math.min(100, Math.max(0, conversion)).toFixed(1));

      // Spend calculation based on campaign status and budget
      let spend = 0;
      if (c.status === 'completed') spend = c.budget;
      else if (c.status === 'active') spend = Math.round(c.budget * 0.75);
      else if (c.status === 'paused') spend = Math.round(c.budget * 0.2);

      return {
        ...c,
        audience,
        reach,
        clickRate,
        conversion,
        spend
      };
    });

    // Calculate promo codes dynamically from real-time database data
    const promos = (dbData.promos || []).map((p: any) => {
      const code = p.code.toUpperCase().trim();
      let uses = 0;

      if (code === 'STUDENT50') {
        uses = allUsers.filter((u: any) => u.subscription === 'student').length;
      } else if (code === 'FAMILY20') {
        uses = allUsers.filter((u: any) => u.subscription === 'family').length;
      } else if (code === 'CREATOR25') {
        uses = allUsers.filter((u: any) => u.subscription === 'creator').length;
      } else if (code === 'WELCOME5') {
        uses = allUsers.filter((u: any) => u.subscription && u.subscription !== 'free').length;
      } else if (code === 'BLACKFRI40') {
        uses = allUsers.filter((u: any) => u.subscription && u.subscription !== 'free' && u.paymentMethod === 'Visa').length;
      } else if (code === 'INDIE15') {
        uses = allUsers.filter((u: any) => u.followedArtists && u.followedArtists.length > 0).length;
      } else if (code === 'REFER10') {
        uses = allUsers.filter((u: any) => (u.followers || 0) > 0 || (u.following || 0) > 0).length;
      } else if (code === 'MANOJ') {
        uses = allUsers.filter((u: any) => u.name.toLowerCase().includes('manoj') || u.email.toLowerCase().includes('manoj')).length;
      } else {
        uses = p.uses || 0;
      }

      return {
        ...p,
        uses
      };
    });

    // Overall marketing aggregates based on campaigns
    const activeCampaigns = campaigns.filter((c: any) => c.status === 'active');
    const emailsSent = campaigns.reduce((sum: number, c: any) => sum + (c.type === 'email' ? c.reach : 0), 0);
    
    // Average open rate scaled dynamically with click rate
    const avgOpenRate = activeCampaigns.length > 0 
      ? Number(Math.min(100, Math.max(10, (activeCampaigns.reduce((sum: number, c: any) => sum + c.clickRate, 0) / activeCampaigns.length) * 2.2)).toFixed(1))
      : 0;
    const avgClickRate = activeCampaigns.length > 0 
      ? Number((activeCampaigns.reduce((sum: number, c: any) => sum + c.clickRate, 0) / activeCampaigns.length).toFixed(1)) 
      : 0;
    const avgConversionRate = activeCampaigns.length > 0 
      ? Number((activeCampaigns.reduce((sum: number, c: any) => sum + c.conversion, 0) / activeCampaigns.length).toFixed(1)) 
      : 0;

    return NextResponse.json({
      success: true,
      stats: {
        emailsSent,
        openRate: avgOpenRate,
        clickRate: avgClickRate,
        conversionRate: avgConversionRate
      },
      campaigns,
      promos,
      promotions: dbData.promotions || [],
      homeLayoutOrder: dbData.homeLayoutOrder || [],
      customSections: dbData.customSections || {},
      targetedCounts,
      currency: {
        code: globalCurrency,
        rate: currencyRate,
        symbol: currencySymbol
      }
    });
  } catch (e: any) {
    console.error('Marketing API GET error:', e);
    return NextResponse.json({ error: 'Failed retrieving marketing data' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const rbacCheck = await requireAdmin(req);
  if (!rbacCheck.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const dbData = readRawDb();
    const body = await req.json();
    const { action } = body;

    if (action === 'create_campaign') {
      const { name, type, audience, startDate, endDate, copy, budget } = body.campaign;
      if (!name) return NextResponse.json({ error: 'Campaign name is required' }, { status: 400 });

      const newCampaign = {
        id: `CMP-${Date.now()}`,
        name,
        type,
        audience,
        status: 'active',
        reach: 0,
        clickRate: 0,
        conversion: 0,
        budget: Number(budget) || 1000,
        spend: 0,
        startDate,
        endDate,
        copy
      };

      dbData.campaigns = dbData.campaigns || [];
      dbData.campaigns.push(newCampaign);
      writeRawDb(dbData);
      return NextResponse.json({ success: true, campaign: newCampaign });
    }

    if (action === 'create_promo') {
      const { code, discount, type, limit, expiry } = body.promo;
      if (!code) return NextResponse.json({ error: 'Promo code is required' }, { status: 400 });

      const newPromo = {
        id: `P-${Date.now()}`,
        code: code.toUpperCase().trim(),
        discount: Number(discount),
        type,
        uses: 0,
        limit: Number(limit) || 0,
        expiry: expiry || 'Ongoing',
        status: 'active'
      };

      dbData.promos = dbData.promos || [];
      dbData.promos.push(newPromo);
      writeRawDb(dbData);
      return NextResponse.json({ success: true, promo: newPromo });
    }

    if (action === 'toggle_campaign') {
      const { id, status } = body;
      dbData.campaigns = dbData.campaigns || [];
      const idx = dbData.campaigns.findIndex((c: any) => c.id === id);
      if (idx !== -1) {
        dbData.campaigns[idx].status = status;
        writeRawDb(dbData);
        return NextResponse.json({ success: true, campaign: dbData.campaigns[idx] });
      }
      return NextResponse.json({ error: 'Campaign not found' }, { status: 444 });
    }

    if (action === 'toggle_promo') {
      const { id, status } = body;
      dbData.promos = dbData.promos || [];
      const idx = dbData.promos.findIndex((p: any) => p.id === id);
      if (idx !== -1) {
        dbData.promos[idx].status = status;
        writeRawDb(dbData);
        return NextResponse.json({ success: true, promo: dbData.promos[idx] });
      }
      return NextResponse.json({ error: 'Promo code not found' }, { status: 444 });
    }

    if (action === 'delete_promo') {
      const { id } = body;
      dbData.promos = dbData.promos || [];
      const originalLength = dbData.promos.length;
      dbData.promos = dbData.promos.filter((p: any) => p.id !== id);
      if (dbData.promos.length !== originalLength) {
        writeRawDb(dbData);
        return NextResponse.json({ success: true });
      }
      return NextResponse.json({ error: 'Promo not found' }, { status: 444 });
    }

    if (action === 'delete_campaign') {
      const { id } = body;
      dbData.campaigns = dbData.campaigns || [];
      const originalLength = dbData.campaigns.length;
      dbData.campaigns = dbData.campaigns.filter((c: any) => c.id !== id);
      if (dbData.campaigns.length !== originalLength) {
        writeRawDb(dbData);
        return NextResponse.json({ success: true });
      }
      return NextResponse.json({ error: 'Campaign not found' }, { status: 444 });
    }

    if (action === 'create_promotion') {
      const { title, description, image, type, targetId } = body.promotion;
      if (!title) return NextResponse.json({ error: 'Promotion title is required' }, { status: 400 });

      const newPromoId = `PROMO-${Date.now()}`;
      const newPromo = {
        id: newPromoId,
        title,
        description: description || '',
        image: image || '',
        type, // 'banner' | 'playlist' | 'album'
        targetId: targetId || '',
        status: 'active'
      };

      dbData.promotions = dbData.promotions || [];
      dbData.promotions.push(newPromo);

      // Automatically append a specific layout section for this promotion to the homepage sequencer
      dbData.homeLayoutOrder = dbData.homeLayoutOrder || [];
      dbData.homeLayoutOrder.push(`promo_${newPromoId}`);

      writeRawDb(dbData);
      return NextResponse.json({ success: true, promotion: newPromo, homeLayoutOrder: dbData.homeLayoutOrder });
    }

    if (action === 'toggle_promotion') {
      const { id, status } = body;
      dbData.promotions = dbData.promotions || [];
      const idx = dbData.promotions.findIndex((p: any) => p.id === id);
      if (idx !== -1) {
        dbData.promotions[idx].status = status;
        writeRawDb(dbData);
        return NextResponse.json({ success: true, promotion: dbData.promotions[idx] });
      }
      return NextResponse.json({ error: 'Promotion not found' }, { status: 444 });
    }

    if (action === 'delete_promotion') {
      const { id } = body;
      dbData.promotions = dbData.promotions || [];
      const originalLength = dbData.promotions.length;
      dbData.promotions = dbData.promotions.filter((p: any) => p.id !== id);
      if (dbData.promotions.length !== originalLength) {
        writeRawDb(dbData);
        return NextResponse.json({ success: true });
      }
      return NextResponse.json({ error: 'Promotion not found' }, { status: 444 });
    }

    if (action === 'update_layout_order') {
      const { order, customSections } = body;
      if (!Array.isArray(order)) return NextResponse.json({ error: 'Invalid layout order' }, { status: 400 });
      dbData.homeLayoutOrder = order;
      if (customSections) {
        dbData.customSections = customSections;
      }
      writeRawDb(dbData);
      return NextResponse.json({ success: true, homeLayoutOrder: order, customSections: dbData.customSections || {} });
    }

    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
  } catch (e: any) {
    console.error('Marketing API POST error:', e);
    return NextResponse.json({ error: 'Action execution failed' }, { status: 500 });
  }
}
