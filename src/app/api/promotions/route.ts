import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const DB_FILE = path.join(process.cwd(), 'data', 'beato_db.json');

function readRawDb() {
  if (!fs.existsSync(DB_FILE)) return { promotions: [], homeLayoutOrder: [] };
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    return { promotions: [], homeLayoutOrder: [] };
  }
}

const DEFAULT_LAYOUT_ORDER = [
  "quick_access",
  "liked_songs",
  "promotions_hero",
  "made_for_you",
  "featured_artist",
  "new_music",
  "live_events",
  "trending_now",
  "your_taste",
  "recently_played",
  "mood_playlists",
  "daily_mixes"
];

export async function GET(req: NextRequest) {
  try {
    const dbData = readRawDb();
    
    // Filter active promotions for the client
    const allPromos = dbData.promotions || [];
    const activePromos = allPromos.filter((p: any) => p.status === 'active');
    
    const layoutOrder = dbData.homeLayoutOrder || DEFAULT_LAYOUT_ORDER;

    return NextResponse.json({
      success: true,
      promotions: activePromos,
      homeLayoutOrder: layoutOrder,
      customSections: dbData.customSections || {},
      activeTheme: dbData.activeTheme || null,
      activePreset: dbData.activePreset || null,
      events: dbData.events || []
    });
  } catch (e: any) {
    console.error('Public Promotions GET error:', e);
    return NextResponse.json({ error: 'Failed retrieving homepage layout' }, { status: 500 });
  }
}
