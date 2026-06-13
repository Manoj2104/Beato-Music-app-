import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

const DEFAULT_PLAN_PRICES: Record<string, number> = {
  free: 0, student: 4.99, premium: 9.99, family: 15.99, creator: 19.99,
};

export async function GET(request: NextRequest) {
  const rbacCheck = await requireAdmin(request);
  if (!rbacCheck.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const allUsers = db.getUsers();
    const allDbTracks = db.getTracks();

    // 1. Calculate active browsing users from globalSessions map
    const globalSessions = (global as any).globalSessions as Map<string, number> || new Map();
    const cutoff = Date.now() - 40000; // 40s inactivity cutoff
    let activeNowUsers = 0;

    for (const [sessId, lastSeen] of globalSessions.entries()) {
      if (lastSeen > cutoff) {
        activeNowUsers++;
      } else {
        globalSessions.delete(sessId);
      }
    }

    // 2. Calculate live streams (currently playing tracks) from activeSessions map
    const activeSessions = (global as any).activeSessions as Map<string, Map<string, number>> || new Map();
    const activeTrackSessions = (global as any).activeTrackSessions as Map<string, Map<string, number>> || new Map();
    let liveStreamsCount = 0;
    const liveTrackListeners: Record<string, number> = {};

    for (const [_, sessionMap] of activeSessions.entries()) {
      for (const [sessId, lastSeen] of sessionMap.entries()) {
        if (lastSeen > cutoff) {
          liveStreamsCount++;
        } else {
          sessionMap.delete(sessId);
        }
      }
    }

    for (const [trackId, sessionMap] of activeTrackSessions.entries()) {
      let count = 0;
      for (const [sessId, lastSeen] of sessionMap.entries()) {
        if (lastSeen > cutoff) {
          count++;
        } else {
          sessionMap.delete(sessId);
        }
      }
      liveTrackListeners[trackId] = count;
    }

    // Calculate real numbers (no fake baselines!)
    const totalUsersCount = allUsers.length;

    // Find all active artists in the database (must exist and have isActive === true)
    const activeArtistIds = new Set(
      allUsers
        .filter(u => u.role === 'ARTIST' && u.isActive === true)
        .map(u => u.id)
    );

    const activeArtistsCount = activeArtistIds.size;
    const activeSongsCount = allDbTracks.filter((t) => activeArtistIds.has(t.artistId)).length;
    const totalPlays = allDbTracks.reduce((sum, t) => sum + (t.plays || 0), 0);

    // Revenue calculations matching global currency rate
    const planPrices = db.getPlanPrices();
    const currency = db.getGlobalCurrency();
    const rate = currency === 'INR' ? 83 : 1;
    const symbol = currency === 'INR' ? '₹' : '$';

    const paidUsers = allUsers.filter((u: any) => {
      const plan = (u.subscription || 'free').toLowerCase();
      const price = planPrices[plan] !== undefined ? planPrices[plan] : (DEFAULT_PLAN_PRICES[plan] || 0);
      return price > 0 && u.paymentMethod !== 'Admin Plan';
    });

    const mrr = paidUsers.reduce((s: number, u: any) => {
      const plan = (u.subscription || 'free').toLowerCase();
      const price = planPrices[plan] !== undefined ? planPrices[plan] : (DEFAULT_PLAN_PRICES[plan] || 0);
      return s + price;
    }, 0) * rate;

    const payoutStreams = db.getPayoutStreams();
    const adRevenueUsd = payoutStreams.filter(s => !s.isPremium).reduce((s, str) => {
      const mult = str.country === 'US' ? 1.25 : str.country === 'GB' ? 1.15 : str.country === 'IN' ? 0.85 : 1.0;
      return s + (0.0025 * mult);
    }, 0);
    const adRevenue = adRevenueUsd * rate;
    const monthlyRevenue = Math.round((mrr + adRevenue) * 100) / 100;

    // Build historical charts
    // 3. Weekly Streams (last 7 days)
    const streamData = [];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0);
      const nextDay = new Date(d); nextDay.setDate(nextDay.getDate() + 1);
      const dayStreams = payoutStreams.filter(s => {
        const t = new Date(s.timestamp).getTime();
        return t >= d.getTime() && t < nextDay.getTime();
      });
      const streamsCount = dayStreams.length;
      const dayRevUsd = dayStreams.reduce((s, str) => {
        const mult = str.country === 'US' ? 1.25 : str.country === 'GB' ? 1.15 : str.country === 'IN' ? 0.85 : 1.0;
        const r = str.isPremium ? 0.0075 : 0.0025;
        return s + (r * mult);
      }, 0);
      streamData.push({
        day: days[d.getDay()],
        streams: streamsCount,
        revenue: Math.round(dayRevUsd * rate * 100) / 100
      });
    }

    // 4. Monthly Growth (last 6 months)
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const mStart = new Date(); mStart.setMonth(mStart.getMonth() - i); mStart.setDate(1); mStart.setHours(0, 0, 0, 0);
      const mEnd = new Date(mStart); mEnd.setMonth(mEnd.getMonth() + 1);
      
      const monthUsers = allUsers.filter(u => {
        const t = new Date(u.createdAt).getTime();
        return t >= mStart.getTime() && t < mEnd.getTime();
      }).length;

      const monthStreams = payoutStreams.filter(s => {
        const t = new Date(s.timestamp).getTime();
        return t >= mStart.getTime() && t < mEnd.getTime();
      });

      const monthStreamCount = monthStreams.length;
      const monthRevUsd = monthStreams.reduce((s, str) => {
        const mult = str.country === 'US' ? 1.25 : str.country === 'GB' ? 1.15 : str.country === 'IN' ? 0.85 : 1.0;
        const r = str.isPremium ? 0.0075 : 0.0025;
        return s + (r * mult);
      }, 0);

      const monthTxns = db.getTransactions().filter(t => t.status === 'completed' && t.dateTs >= mStart.getTime() && t.dateTs < mEnd.getTime());
      const subRevUsd = monthTxns.reduce((s, t) => s + t.amount, 0);

      monthlyData.push({
        month: mStart.toLocaleString('en-US', { month: 'short' }),
        users: monthUsers,
        streams: monthStreamCount,
        revenue: Math.round((subRevUsd + monthRevUsd) * rate * 100) / 100
      });
    }

    // 5. Genre Breakdown
    const genreCounts: Record<string, number> = {};
    let totalStreamsForGenres = 0;
    payoutStreams.forEach(s => {
      const track = allDbTracks.find(t => t.id === s.trackId);
      const genre = track?.genre || 'Other';
      genreCounts[genre] = (genreCounts[genre] || 0) + 1;
      totalStreamsForGenres++;
    });

    const genreData = Object.entries(genreCounts).map(([name, count]) => ({
      name,
      value: totalStreamsForGenres > 0 ? Math.round((count / totalStreamsForGenres) * 100) : 0,
      color: name === 'Pop' ? '#34d399' : name === 'Hip-Hop' ? '#f59e0b' : name === 'Electronic' ? '#06b6d4' : name === 'Rock' ? '#ef4444' : name === 'R&B' ? '#10b981' : '#6b7280'
    }));

    if (genreData.length === 0) {
      genreData.push({ name: 'No Streams', value: 100, color: '#6b7280' });
    }

    // 6. Top Performing Artists
    const artistList = allUsers.filter(u => u.role === 'ARTIST' && u.isActive);
    const artistPlays: Record<string, number> = {};
    allDbTracks.forEach(t => {
      artistPlays[t.artistId] = (artistPlays[t.artistId] || 0) + (t.plays || 0);
    });

    const topArtists = artistList.map(a => ({
      id: a.id,
      name: a.name,
      image: a.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
      monthlyListeners: artistPlays[a.id] || 0,
      followers: a.followers || 0
    })).sort((a, b) => b.monthlyListeners - a.monthlyListeners).slice(0, 5);

    return NextResponse.json({
      success: true,
      stats: {
        activeNow: activeNowUsers,
        liveStreams: liveStreamsCount,
        totalPlays,
        totalSongs: activeSongsCount,
        activeArtists: activeArtistsCount,
        totalUsers: totalUsersCount,
        monthlyRevenue,
        currencySymbol: symbol,
        streamData,
        monthlyData,
        genreData,
        topArtists,
        liveTrackListeners,
      }
    });
  } catch (err: any) {
    console.error('Fetch live-stats error:', err);
    return NextResponse.json({ error: 'Failed to fetch live stats' }, { status: 500 });
  }
}
