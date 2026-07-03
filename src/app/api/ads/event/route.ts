import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { adId, eventType } = await request.json() as { adId: string; eventType: 'impression' | 'click' };

    if (!adId || !['impression', 'click'].includes(eventType)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Load DB configuration
    const stored = db.getAdsConfig();
    if (!stored || !stored._adsData) {
      return NextResponse.json({ error: 'Ads data not configured' }, { status: 404 });
    }

    const adsData = stored._adsData;
    const adIndex = (adsData.ads || []).findIndex((a: any) => a.id === adId);

    if (adIndex === -1) {
      return NextResponse.json({ error: 'Ad not found' }, { status: 404 });
    }

    // Increment values
    if (eventType === 'impression') {
      adsData.ads[adIndex].impressions = (adsData.ads[adIndex].impressions || 0) + 1;
    } else if (eventType === 'click') {
      adsData.ads[adIndex].clicks = (adsData.ads[adIndex].clicks || 0) + 1;
    }

    // Save back to DB
    db.saveAdsConfig({ ...stored, _adsData: adsData });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Failed to log ad event:', err);
    return NextResponse.json({ error: 'Failed to record event' }, { status: 500 });
  }
}
