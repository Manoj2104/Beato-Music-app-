import { NextRequest, NextResponse } from 'next/server';
import { requireArtist } from '@/lib/rbac';
import { db } from '@/lib/db';
import { verifyJWT } from '@/lib/jwt';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Validate RBAC - artist role or higher is required
  const rbacCheck = await requireArtist(request);
  if (!rbacCheck.authorized || !rbacCheck.user) {
    return NextResponse.json(
      { error: rbacCheck.message || 'Unauthorized' },
      { status: rbacCheck.status || 401 }
    );
  }

  try {
    const token = request.cookies.get('beato-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = await verifyJWT(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid session token' }, { status: 401 });
    }

    const artistId = decoded.userId;

    // Get database entities for this artist
    const allTracks = db.getTracks();
    const artistTracks = allTracks.filter(t => t.artistId === artistId);
    
    const allUsers = db.getUsers();
    const followersCount = allUsers.filter(u => 
      u.followedArtists && u.followedArtists.includes(artistId)
    ).length;

    // 1. Dashboard Metrics
    const totalStreams = artistTracks.reduce((sum, t) => sum + (t.plays || 0), 0);
    
    // Revenue calculations: payout earnings + ticket sales + merch sales
    let payoutArtist = db.getPayoutArtistById(artistId);
    let lifetimeEarnings = payoutArtist?.lifetimeEarnings || 0;
    
    const campaigns = db.getCampaigns().filter(c => c.artistId === artistId);
    const events = db.getEvents().filter(e => e.artistId === artistId);
    const comments = db.getComments().filter(c => c.artistId === artistId);
    const merchItems = db.getMerchItems().filter(m => m.artistId === artistId);
    const merchSalesLog = db.getMerchSalesLogs().filter(m => m.artistId === artistId);
    const collabSplits = db.getCollabSplits().filter(c => c.artistId === artistId);
    const pitches = db.getPitches().filter(p => p.artistId === artistId);
    const soundKits = db.getSoundKits().filter(s => s.artistId === artistId);
    const plannerTasks = db.getPlannerTasks().filter(p => p.artistId === artistId);
    const demos = db.getDemos().filter(d => d.artistId === artistId);
    const contracts = db.getContracts().filter(c => c.artistId === artistId);
    const newsletters = db.getNewsletters().filter(n => n.artistId === artistId);
    const trackLyrics = db.getTrackLyrics().filter(l => l.artistId === artistId);
    const ticketSalesList = db.getTicketSales().filter(t => t.artistId === artistId);
    
    let ticketSales = ticketSalesList[0] || {
      artistId,
      totalRevenue: 0,
      ticketsSold: 0,
      recentSales: []
    };

    // Calculate total revenue from merch & tickets
    const merchRevenue = merchSalesLog.reduce((sum, log) => sum + log.amount, 0);
    const ticketRevenue = ticketSales.totalRevenue;
    const totalRevenue = lifetimeEarnings + merchRevenue + (ticketRevenue / 83); // Normalize ticket INR to USD

    // Profile Views (real database map or default seed)
    const viewsMap = db.getProfileViews();
    const profileViews = viewsMap[artistId] || 0;
    
    // Concurrent listeners calculation based on server activeSessions registry
    // Sessions are registered by PlayerBar heartbeat every 4s while playing
    if (!(global as any).activeSessions) {
      (global as any).activeSessions = new Map<string, Map<string, any>>();
    }
    const activeSessions = (global as any).activeSessions as Map<string, Map<string, any>>;
    const artistMap = activeSessions.get(artistId);
    let concurrentListeners = 0;
    const activeSessionsList: any[] = [];
    if (artistMap) {
      const cutoff = Date.now() - 30000; // 30 second window (heartbeat every 4s)
      for (const [sessId, sessData] of artistMap.entries()) {
        const lastSeen = typeof sessData === 'number' ? sessData : (sessData as any).lastSeen;
        if (lastSeen > cutoff) {
          concurrentListeners++;
          if (typeof sessData === 'object') {
            const track = artistTracks.find(t => t.id === (sessData as any).trackId);
            activeSessionsList.push({
              sessionId: sessId,
              trackTitle: track ? track.title : 'Unknown Track',
              city: (sessData as any).city || 'Chennai',
              country: (sessData as any).country || 'IN',
              lastSeen
            });
          } else {
            activeSessionsList.push({
              sessionId: sessId,
              trackTitle: 'Active Track',
              city: 'Chennai',
              country: 'IN',
              lastSeen
            });
          }
        } else {
          artistMap.delete(sessId);
        }
      }
    }

    // Payout streams filter
    const payoutStreams = db.getPayoutStreams().filter(s => s.artistId === artistId);

    // SPM calculation
    const now = Date.now();
    const fiveMinsAgo = now - 5 * 60 * 1000;
    const recentStreamsCount = payoutStreams.filter(s => new Date(s.timestamp).getTime() > fiveMinsAgo).length;
    const spm = Number((recentStreamsCount / 5).toFixed(1));
    const spmTrend = spm > 0.1 ? 'up' : 'down';

    // Stream Trends for last 7 days
    const streamTrends = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const streamsCount = payoutStreams.filter(s => {
        const sDate = new Date(s.timestamp);
        return sDate.getFullYear() === d.getFullYear() &&
               sDate.getMonth() === d.getMonth() &&
               sDate.getDate() === d.getDate();
      }).length;
      return { date: dateStr, streams: streamsCount };
    });

    // Dynamic city/country counts & geo hotspots from streams
    const cityMap: Record<string, { city: string; country: string; userIds: Set<string>; streams: number }> = {};
    
    payoutStreams.forEach(s => {
      const country = (s.country || 'IN').toUpperCase();
      let city = s.city;
      if (!city) {
        if (country === 'IN') city = 'Chennai';
        else if (country === 'US') city = 'New York';
        else if (country === 'GB' || country === 'UK') city = 'London';
        else if (country === 'BR') city = 'São Paulo';
        else city = 'Unknown City';
      }
      
      const key = `${city}, ${country}`;
      if (!cityMap[key]) {
        cityMap[key] = { city, country, userIds: new Set(), streams: 0 };
      }
      cityMap[key].userIds.add(s.userId);
      cityMap[key].streams++;
    });

    const cityColors = ['#1db954', '#10b981', '#34d399', '#f59e0b', '#06b6d4', '#ef4444'];
    const geoHotspots = Object.values(cityMap).map((item, index) => ({
      city: item.city,
      country: item.country,
      listeners: item.userIds.size,
      streams: item.streams,
      color: cityColors[index % cityColors.length]
    })).sort((a, b) => b.streams - a.streams);

    // Live Activity Feed built from actual database logs
    const timeAgoStr = (timestamp: number) => {
      const diffMs = Date.now() - timestamp;
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${Math.floor(diffHours / 24)}d ago`;
    };

    const streamEvents = payoutStreams.map(s => {
      const user = allUsers.find(u => u.id === s.userId);
      const track = artistTracks.find(t => t.id === s.trackId);
      const timeMs = new Date(s.timestamp).getTime();
      return {
        id: s.id,
        icon: '🎧',
        user: user ? user.name : 'Guest Listener',
        action: 'streamed',
        detail: track ? `"${track.title}"` : 'a track',
        timestamp: timeMs,
        time: timeAgoStr(timeMs)
      };
    });

    const commentEvents = comments.map(c => {
      // Extract real timestamp from ID (format: fc-{timestamp})
      let timeMs = Date.now() - 3600000 * 2; // fallback: 2h ago
      if (c.id && c.id.startsWith('fc-')) {
        const parsed = Number(c.id.replace('fc-', ''));
        if (!isNaN(parsed) && parsed > 1000000000000) timeMs = parsed;
      }
      return {
        id: c.id,
        icon: '💬',
        user: c.user,
        action: 'commented',
        detail: `"${c.text}" on "${c.track}"`,
        timestamp: timeMs,
        time: timeAgoStr(timeMs)
      };
    });

    const merchEvents = merchSalesLog.map(m => {
      // Extract real timestamp from ID (format: msl-{timestamp})
      let timeMs = Date.now() - 3600000 * 3; // fallback: 3h ago
      if (m.id && m.id.startsWith('msl-')) {
        const parsed = Number(m.id.replace('msl-', ''));
        if (!isNaN(parsed) && parsed > 1000000000000) timeMs = parsed;
      }
      return {
        id: m.id,
        icon: '🛍️',
        user: m.buyer,
        action: 'bought',
        detail: `"${m.item}"`,
        timestamp: timeMs,
        time: timeAgoStr(timeMs)
      };
    });

    const ticketEvents = (ticketSales.recentSales || []).map((s: any) => {
      // Extract real timestamp from ID (format: sale-{timestamp})
      let timeMs = Date.now() - 3600000 * 4; // fallback: 4h ago
      if (s.id && s.id.startsWith('sale-')) {
        const parsed = Number(s.id.replace('sale-', ''));
        if (!isNaN(parsed) && parsed > 1000000000000) timeMs = parsed;
      }
      return {
        id: s.id,
        icon: '🎫',
        user: s.buyer,
        action: 'purchased',
        detail: `${s.tickets} ticket(s) for "${s.event}"`,
        timestamp: timeMs,
        time: timeAgoStr(timeMs)
      };
    });

    const liveActivity = [
      ...streamEvents,
      ...commentEvents,
      ...merchEvents,
      ...ticketEvents
    ].sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);

    // Dynamic Achievements
    const uniqueCountries = new Set(payoutStreams.map(s => s.country)).size;
    const getMilestoneUnlockDate = (streams: any[], count: number): string => {
      const sorted = [...streams].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      if (sorted.length >= count) {
        return new Date(sorted[count - 1].timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
      return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const achievements = [
      {
        id: 'ac1',
        title: 'Silver Play Certification',
        desc: 'Passed 10 total streams globally',
        unlocked: totalStreams >= 10,
        val: '10 Streams',
        date: totalStreams >= 10 ? getMilestoneUnlockDate(payoutStreams, 10) : 'Locked'
      },
      {
        id: 'ac2',
        title: 'Gold Record Award',
        desc: 'Passed 50 total streams globally',
        unlocked: totalStreams >= 50,
        val: '50 Streams',
        date: totalStreams >= 50 ? getMilestoneUnlockDate(payoutStreams, 50) : 'Locked'
      },
      {
        id: 'ac3',
        title: 'Platinum Disc Milestone',
        desc: 'Passed 100 total streams globally',
        unlocked: totalStreams >= 100,
        val: '100 Streams',
        date: totalStreams >= 100 ? getMilestoneUnlockDate(payoutStreams, 100) : 'Locked'
      },
      {
        id: 'ac4',
        title: 'Curator Master Badge',
        desc: 'Acquired 2 active followers',
        unlocked: followersCount >= 2,
        val: '2 Followers',
        date: followersCount >= 2 ? 'Unlocked' : 'Locked'
      },
      {
        id: 'ac5',
        title: 'Global Ambassador',
        desc: 'Acquired listens from 2+ unique countries',
        unlocked: uniqueCountries >= 2,
        val: `${uniqueCountries} Countries`,
        date: uniqueCountries >= 2 ? 'Unlocked' : 'Locked'
      }
    ];

    // User ID to Name mapping
    const userMap: Record<string, string> = {};
    const userDetailMap: Record<string, { name: string, age?: number, gender?: string, subscription: string }> = {};
    allUsers.forEach(u => {
      userMap[u.id] = u.name;
      userDetailMap[u.id] = {
        name: u.name,
        age: (u as any).age,
        gender: (u as any).gender,
        subscription: u.subscription || 'free'
      };
    });

    return NextResponse.json({
      success: true,
      userMap,
      userDetailMap,
      metrics: {
        totalStreams,
        followers: followersCount,
        revenue: totalRevenue,
        profileViews,
        concurrentListeners,
        spm,
        spmTrend
      },
      tracks: artistTracks,
      campaigns,
      events,
      comments,
      merchItems,
      merchSalesLog,
      collabSplits,
      pitches,
      soundKits,
      plannerTasks,
      demos,
      contracts,
      newsletters,
      trackLyrics,
      ticketSales,
      geoHotspots,
      activeSessionsList,
      streamTrends,
      liveActivity,
      payoutStreams,
      achievements
    });
  } catch (error: any) {
    console.error('Error fetching artist dashboard details:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const rbacCheck = await requireArtist(request);
  if (!rbacCheck.authorized || !rbacCheck.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const token = request.cookies.get('beato-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = await verifyJWT(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid session token' }, { status: 401 });
    }

    const artistId = decoded.userId;
    const body = await request.json();
    const { action, payload } = body;

    if (!action) {
      return NextResponse.json({ error: 'Action required' }, { status: 400 });
    }

    switch (action) {
      case 'delete_track': {
        const { trackId } = payload;
        const allTracks = db.getTracks();
        const track = allTracks.find(t => t.id === trackId);
        
        if (!track) {
          return NextResponse.json({ error: 'Track not found' }, { status: 404 });
        }
        
        if (track.artistId !== artistId) {
          return NextResponse.json({ error: 'Unauthorized to delete this track' }, { status: 403 });
        }
        
        const success = db.deleteTrack(trackId);
        return NextResponse.json({ success });
      }

      case 'simulate_stream': {
        const { trackId, country } = payload;
        
        // 1. Increment play count on track in DB
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
          }
          require('fs').writeFileSync(
            require('path').join(process.cwd(), 'data', 'beato_db.json'),
            JSON.stringify(dbData, null, 2), 'utf-8'
          );
        }

        // 2. Add Payout Stream record
        const countryCities: Record<string, string[]> = {
          'IN': ['Chennai', 'Mumbai', 'Delhi', 'Kolkata'],
          'US': ['New York', 'Los Angeles', 'Chicago', 'Miami'],
          'GB': ['London', 'Manchester', 'Birmingham'],
          'UK': ['London', 'Manchester', 'Birmingham'],
          'BR': ['São Paulo', 'Rio de Janeiro']
        };
        const cCode = (country || 'IN').toUpperCase();
        const cities = countryCities[cCode] || ['Other City'];
        const city = cities[Math.floor(Math.random() * cities.length)];

        const strId = `STR-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
        const newStream = {
          id: strId,
          trackId,
          artistId,
          userId: `sim-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          country: cCode,
          city,
          isPremium: Math.random() > 0.4,
          timestamp: new Date().toISOString()
        };
        db.addPayoutStream(newStream);

        // 3. Update Artist balance
        const artistEarnings = newStream.isPremium ? 0.0075 : 0.0025;
        const netEarnings = Math.round((artistEarnings * 0.70) * 10000) / 10000;

        let pArtist = db.getPayoutArtistById(artistId);
        if (pArtist) {
          pArtist.lifetimeEarnings = Math.round((pArtist.lifetimeEarnings + netEarnings) * 100) / 100;
          pArtist.availableBalance = Math.round((pArtist.availableBalance + netEarnings) * 100) / 100;
          pArtist.estimatedNextPayout = Math.round((pArtist.estimatedNextPayout + netEarnings) * 100) / 100;
          db.savePayoutArtist(pArtist);
        }

        return NextResponse.json({ success: true, stream: newStream });
      }

      case 'add_campaign': {
        const camp = {
          id: `c-${Date.now()}`,
          artistId,
          name: payload.name,
          track: payload.track,
          budget: Number(payload.budget),
          spent: 0,
          impressions: 0,
          ctr: '0.0%',
          status: 'Active'
        };
        db.saveCampaign(camp);
        return NextResponse.json({ success: true, item: camp });
      }

      case 'add_event': {
        const ev = {
          id: `e-${Date.now()}`,
          artistId,
          name: payload.name,
          date: payload.date,
          time: payload.time || '8:00 PM',
          location: payload.location,
          price: payload.price || 'Free'
        };
        db.saveEvent(ev);
        return NextResponse.json({ success: true, item: ev });
      }

      case 'delete_event': {
        const { eventId } = payload;
        const success = db.deleteEvent(eventId);
        return NextResponse.json({ success });
      }

      case 'reply_comment': {
        const comments = db.getComments().filter(c => c.artistId === artistId);
        const comm = comments.find(c => c.id === payload.commentId);
        if (!comm) {
          return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
        }
        comm.reply = payload.reply;
        db.saveComment(comm);
        return NextResponse.json({ success: true, item: comm });
      }

      case 'add_comment': {
        const comm = {
          id: `fc-${Date.now()}`,
          artistId,
          user: payload.user,
          text: payload.text,
          track: payload.track,
          time: 'Just now',
          reply: ''
        };
        db.saveComment(comm);
        return NextResponse.json({ success: true, item: comm });
      }

      case 'add_merch': {
        const item = {
          id: `m-${Date.now()}`,
          artistId,
          name: payload.name,
          price: Number(payload.price),
          stock: Number(payload.stock),
          sales: 0,
          emoji: payload.emoji || '💿'
        };
        db.saveMerchItem(item);
        return NextResponse.json({ success: true, item: item });
      }

      case 'add_split': {
        const split = {
          id: `cs-${Date.now()}`,
          artistId,
          track: payload.track,
          collaborator: payload.collaborator,
          role: payload.role || 'Co-writer',
          share: Number(payload.share),
          status: 'Pending Collaborator Signature'
        };
        db.saveCollabSplit(split);
        return NextResponse.json({ success: true, item: split });
      }

      case 'sign_split': {
        const splits = db.getCollabSplits().filter(s => s.artistId === artistId);
        const split = splits.find(s => s.id === payload.id);
        if (split) {
          split.status = 'Signed & Sealed';
          db.saveCollabSplit(split);
        }
        return NextResponse.json({ success: true, item: split });
      }

      case 'add_pitch': {
        const pitch = {
          id: `p-${Date.now()}`,
          artistId,
          track: payload.track,
          curator: payload.curator,
          status: 'In Review',
          pitchDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          feedback: 'Sent application to editorial curators. Decision pending.'
        };
        db.savePitch(pitch);
        return NextResponse.json({ success: true, item: pitch });
      }

      case 'add_soundkit': {
        const kit = {
          id: `sk-${Date.now()}`,
          artistId,
          name: payload.name,
          price: Number(payload.price),
          size: payload.size || '120MB',
          downloads: 0,
          emoji: payload.emoji
        };
        db.saveSoundKit(kit);
        return NextResponse.json({ success: true, item: kit });
      }

      case 'add_task': {
        const t = {
          id: `pt-${Date.now()}`,
          artistId,
          task: payload.task,
          category: payload.category,
          done: false
        };
        db.savePlannerTask(t);
        return NextResponse.json({ success: true, item: t });
      }

      case 'toggle_task': {
        const tasks = db.getPlannerTasks().filter(p => p.artistId === artistId);
        const t = tasks.find(x => x.id === payload.id);
        if (t) {
          t.done = !t.done;
          db.savePlannerTask(t);
        }
        return NextResponse.json({ success: true, item: t });
      }

      case 'add_demo': {
        const demo = {
          id: `d-${Date.now()}`,
          artistId,
          title: payload.title,
          duration: payload.duration || '1:30',
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          file: payload.file || 'demo_draft.mp3'
        };
        db.saveDemo(demo);
        return NextResponse.json({ success: true, item: demo });
      }

      case 'delete_demo': {
        db.deleteDemo(payload.id);
        return NextResponse.json({ success: true });
      }

      case 'add_contract': {
        const c = {
          id: `ct-${Date.now()}`,
          artistId,
          title: payload.title,
          type: payload.type,
          party: payload.party,
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          status: 'Pending Signature'
        };
        db.saveContract(c);
        return NextResponse.json({ success: true, item: c });
      }

      case 'send_mail': {
        const mail = {
          id: `nl-${Date.now()}`,
          artistId,
          subject: payload.subject,
          sentTo: '1,420 fans',
          openRate: '0.0%',
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        };
        db.saveNewsletter(mail);
        return NextResponse.json({ success: true, item: mail });
      }

      case 'save_lyrics': {
        const lyrics = {
          trackId: payload.trackId,
          artistId,
          text: payload.text,
          timeline: payload.timeline || []
        };
        db.saveTrackLyrics(lyrics);
        return NextResponse.json({ success: true, item: lyrics });
      }

      case 'add_ticket_sale': {
        const list = db.getTicketSales().filter(t => t.artistId === artistId);
        const sales = list[0] || {
          artistId,
          totalRevenue: 0,
          ticketsSold: 0,
          recentSales: []
        };
        sales.ticketsSold += payload.tickets;
        sales.totalRevenue += payload.amount;
        sales.recentSales.unshift({
          id: `sale-${Date.now()}`,
          buyer: payload.buyer,
          event: payload.event,
          tickets: payload.tickets,
          amount: payload.amount,
          time: 'Just now'
        });
        sales.recentSales = sales.recentSales.slice(0, 5);
        db.saveTicketSales(sales);
        return NextResponse.json({ success: true, item: sales });
      }

      case 'buy_merch': {
        const merchItems = db.getMerchItems().filter(m => m.artistId === artistId);
        const merch = merchItems.find(m => m.id === payload.id);
        if (merch && merch.stock > 0) {
          merch.stock -= 1;
          merch.sales += 1;
          db.saveMerchItem(merch);

          const log = {
            id: `msl-${Date.now()}`,
            artistId,
            buyer: payload.buyer,
            item: merch.name,
            amount: merch.price,
            time: 'Just now'
          };
          db.addMerchSalesLog(log);
          return NextResponse.json({ success: true, item: merch, log });
        }
        return NextResponse.json({ error: 'Out of stock or invalid item' }, { status: 400 });
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error posting dashboard action:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
