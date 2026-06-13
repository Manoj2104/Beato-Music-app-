import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyJWT } from '@/lib/jwt';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { trackId, artistId, duration, device, city, country: reqCountry } = await req.json();
    if (!trackId || !artistId) {
      return NextResponse.json({ error: 'trackId and artistId required' }, { status: 400 });
    }

    // Increment play count on the track in beato_db.json
    const dbData = require('fs').existsSync(
      require('path').join(process.cwd(), 'data', 'beato_db.json')
    ) ? JSON.parse(require('fs').readFileSync(
      require('path').join(process.cwd(), 'data', 'beato_db.json'), 'utf-8'
    )) : null;

    if (dbData) {
      dbData.tracks = dbData.tracks || [];
      let tIdx = dbData.tracks.findIndex((t: any) => t.id === trackId);
      if (tIdx !== -1) {
        dbData.tracks[tIdx].plays = (dbData.tracks[tIdx].plays || 0) + 1;
      } else {
        dbData.tracks.push({
          id: trackId,
          title: trackId.startsWith('track-') ? `Track ${trackId.split('-')[1]}` : trackId,
          artistId: artistId,
          plays: 1,
          status: 'approved',
        });
      }
      require('fs').writeFileSync(
        require('path').join(process.cwd(), 'data', 'beato_db.json'),
        JSON.stringify(dbData, null, 2), 'utf-8'
      );
    }

    // Determine user status for royalty rates
    let isPremium = false;
    let country = 'US';
    let userId = 'anonymous';

    const token = req.cookies.get('beato-token')?.value;
    if (token) {
      try {
        const payload = await verifyJWT(token);
        if (payload?.userId) {
          userId = payload.userId;
          const user = db.getUserById(payload.userId);
          if (user) {
            isPremium = user.subscription !== 'free';
            country = user.country || 'IN';
            
            // Record play history in user stats
            const stats = user.stats || { totalListeningTime: 0, topGenres: [], topArtists: [], topTracks: [], streaksCount: 0, discoverScore: 0 };
            const topArtists = stats.topArtists || [];
            if (!topArtists.includes(artistId)) {
              topArtists.unshift(artistId);
              if (topArtists.length > 20) topArtists.pop();
            }
            const topTracks = stats.topTracks || [];
            if (!topTracks.includes(trackId)) {
              topTracks.unshift(trackId);
              if (topTracks.length > 50) topTracks.pop();
            }
            stats.topArtists = topArtists;
            stats.topTracks = topTracks;
            stats.totalListeningTime = (stats.totalListeningTime || 0) + (duration || 30);
            db.updateUser(payload.userId, { stats });
          }
        }
      } catch {
        // ignore
      }
    }

    // REAL-TIME ENTERPRISE ROYALTY & AD REVENUE ENGINE CALCULATIONS
    const countryMultiplier = country === 'US' ? 1.25 : country === 'GB' ? 1.15 : country === 'IN' ? 0.85 : 1.0;
    
    let grossRoyalty = 0;
    let adRevenue = 0;

    if (isPremium) {
      // Subscription-supported model allocation
      grossRoyalty = 0.0075 * countryMultiplier;
    } else {
      // Ad-supported model: 1 audio ad served per stream play
      // Standard CPM of $2.50 CPM yields $0.0025 gross ad revenue per play
      adRevenue = 0.0025 * countryMultiplier;
      grossRoyalty = adRevenue;
    }
    
    // Spotify-like split: 70% artist payout, 20% platform share, 10% withheld tax
    const artistEarnings = Math.round((grossRoyalty * 0.70) * 10000) / 10000;

    // Retrieve and update Artist payout details
    let pArtist = db.getPayoutArtistById(artistId);
    if (!pArtist) {
      const artistUser = db.getUserById(artistId);
      pArtist = {
        id: artistId,
        name: artistUser?.name || 'Artist',
        email: artistUser?.email || `${artistId}@beato.io`,
        avatar: artistUser?.avatar,
        lifetimeEarnings: 0,
        availableBalance: 0,
        pendingBalance: 0,
        estimatedNextPayout: 0,
        fraudScore: 0,
        kycStatus: 'verified',
        taxVerified: true,
        paymentMethod: {
          type: 'bank',
          emailOrAccount: 'Not Configured',
          routingOrCode: '',
          verified: false
        }
      };
    }

    pArtist.lifetimeEarnings = Math.round((pArtist.lifetimeEarnings + artistEarnings) * 100) / 100;
    pArtist.availableBalance = Math.round((pArtist.availableBalance + artistEarnings) * 100) / 100;
    pArtist.estimatedNextPayout = Math.round((pArtist.estimatedNextPayout + artistEarnings) * 100) / 100;
    db.savePayoutArtist(pArtist);

    // Save Payout Stream Entity
    db.addPayoutStream({
      id: `STR-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
      trackId,
      artistId,
      userId,
      country: reqCountry || country,
      city: city || 'Chennai',
      isPremium,
      timestamp: new Date().toISOString(),
      isFlagged: false,
      adRevenue: adRevenue > 0 ? Math.round(adRevenue * 10000) / 10000 : undefined,
      device: device || 'Web Player'
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Play record error:', err);
    return NextResponse.json({ error: 'Failed to record play' }, { status: 500 });
  }
}
