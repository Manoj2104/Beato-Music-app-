import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

import { getDbFilePath } from '@/lib/dbPath';

export const dynamic = 'force-dynamic';

const DB_FILE = getDbFilePath();

function readRawDb() {
  if (!fs.existsSync(DB_FILE)) return { promotions: [], homeLayoutOrder: [] };
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    return { promotions: [], homeLayoutOrder: [] };
  }
}

export async function GET(req: NextRequest) {
  try {
    const dbData = readRawDb();
    
    // Filter active promotions for the client
    const allPromos = dbData.promotions || [];
    const activePromos = allPromos.filter((p: any) => p.status === 'active');
    
    const layoutOrder = dbData.homeLayoutOrder || [];

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
