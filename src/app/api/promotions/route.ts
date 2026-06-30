import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // ⚡ Uses in-memory cached db — no extra disk reads on repeat requests
    const homeData = db.getHomepageData();

    return NextResponse.json({
      success: true,
      promotions: homeData.promotions,
      homeLayoutOrder: homeData.homeLayoutOrder,
      customSections: homeData.customSections,
      activeTheme: homeData.activeTheme,
      activePreset: homeData.activePreset,
      events: homeData.events,
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (e: any) {
    console.error('Public Promotions GET error:', e);
    return NextResponse.json({ error: 'Failed retrieving homepage layout' }, { status: 500 });
  }
}
