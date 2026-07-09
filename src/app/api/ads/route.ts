import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

function getDefaults(): any {
  return {
    campaigns: [],
    ads: [],
    settings: {
      defaultFrequency: 3,
      maxAdsPerHour: 8,
      adTheme: 'glass',
      gdprEnabled: true,
      cookieConsent: true,
    },
    placementStates: {
      homepage_hero: true,
      homepage_middle: true,
      sidebar: true,
      player_bottom: true,
    },
    targetingConfig: {
      onlyFreeUsers: true,
      excludePremium: true,
    }
  };
}

export async function GET(request: NextRequest) {
  try {
    const stored = db.getAdsConfig();
    let adsData = getDefaults();
    if (stored) {
      if (stored._adsData && Array.isArray(stored._adsData.ads) && stored._adsData.ads.length > 0) {
        adsData = stored._adsData;
      } else if (stored._fullAdsData) {
        adsData = stored._fullAdsData;
      } else if (stored._adsData) {
        adsData = stored._adsData;
      }
    }

    // Filter only active ads
    const activeAds = (adsData.ads || []).filter((ad: any) => ad.status === 'active');
    
    // Filter only active campaigns
    const activeCampaignIds = new Set(
      (adsData.campaigns || [])
        .filter((c: any) => c.status === 'active')
        .map((c: any) => c.id)
    );

    // Keep active ads, or ads whose campaigns are active (if campaignId is specified)
    const allowedAds = activeAds.filter((ad: any) => {
      if (!ad.campaignId) return true; // standalone ad
      return activeCampaignIds.has(ad.campaignId);
    });

    // Strip sensitive fields
    const safeAds = allowedAds.map((ad: any) => ({
      id: ad.id,
      name: ad.name,
      type: ad.type,
      placement: ad.placement,
      destinationUrl: ad.destinationUrl,
      imageUrl: ad.imageUrl,
      audioUrl: ad.audioUrl,
      videoUrl: ad.videoUrl,
      headline: ad.headline,
      bodyText: ad.bodyText,
      ctaText: ad.ctaText,
      duration: ad.duration,
      skipAfter: ad.skipAfter,
      priority: ad.priority,
      createdAt: ad.createdAt,
    }));

    // Sort safeAds: use custom adOrder if defined, otherwise newer ads first
    const adOrder = adsData.adOrder || [];
    safeAds.sort((a: any, b: any) => {
      const indexA = adOrder.indexOf(a.id);
      const indexB = adOrder.indexOf(b.id);
      
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;

      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    });

    // Default placements to true if not explicitly disabled
    const defaultPlacements = {
      homepage_hero: true,
      homepage_middle: true,
      sidebar: true,
      player_bottom: true,
      between_songs: true,
      popup: true,
    };
    const placements = { ...defaultPlacements, ...(adsData.placementStates || {}) };

    // Resolve custom mapped audio ad
    let adAudioUrl = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3';
    let adCutoff = 15;
    const mappedAudioAdId = adsData.adMappings?.between_songs;
    if (mappedAudioAdId) {
      const mappedAudioAd = (adsData.ads || []).find((a: any) => a.id === mappedAudioAdId && a.status === 'active');
      if (mappedAudioAd && mappedAudioAd.audioUrl) {
        adAudioUrl = mappedAudioAd.audioUrl;
        adCutoff = mappedAudioAd.duration || 15;
      }
    } else {
      // Fallback: pick the first active audio ad
      const defaultAudioAd = (adsData.ads || []).find((a: any) => a.type === 'audio' && a.status === 'active');
      if (defaultAudioAd && defaultAudioAd.audioUrl) {
        adAudioUrl = defaultAudioAd.audioUrl;
        adCutoff = defaultAudioAd.duration || 15;
      }
    }

    const adsConfig = {
      audioAd: {
        enabled: placements.between_songs !== false,
        frequencyTracks: adsData.settings?.defaultFrequency ?? 3,
        audioUrl: adAudioUrl,
        durationSeconds: adCutoff,
      }
    };

    const visualAd = adsData.visualAd ? {
      id: 'premium-promo-ad',
      name: adsData.visualAd.title || 'Upgrade to Beato Premium',
      type: 'banner',
      headline: adsData.visualAd.title,
      bodyText: adsData.visualAd.description,
      imageUrl: adsData.visualAd.imageUrl,
      destinationUrl: adsData.visualAd.destinationUrl || '/premium',
      ctaText: 'Get Premium'
    } : null;

    // Return safe data for display
    return NextResponse.json({
      success: true,
      ads: safeAds,
      placements,
      adMappings: adsData.adMappings || {},
      sectionAds: adsData.sectionAds || {},
      adsConfig,
      visualAd,
      settings: {
        defaultFrequency: adsData.settings?.defaultFrequency ?? 3,
        adTheme: adsData.settings?.adTheme ?? 'glass',
        maxAdsPerHour: adsData.settings?.maxAdsPerHour ?? 8,
        gdprEnabled: adsData.settings?.gdprEnabled ?? true,
        cookieConsent: adsData.settings?.cookieConsent ?? true,
      }
    });
  } catch (err: any) {
    console.error('Failed to get public ads:', err);
    return NextResponse.json({ error: 'Failed to retrieve ads' }, { status: 500 });
  }
}
