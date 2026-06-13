import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/rbac';
import { db, WithdrawalRequestEntity, ArtistPayoutEntity } from '@/lib/db';
import { verifyJWT } from '@/lib/jwt';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const rbacCheck = await requireAdmin(request);
  if (!rbacCheck.authorized || !rbacCheck.user) {
    return NextResponse.json({ error: 'Access denied: Admin role required' }, { status: 403 });
  }

  try {
    const artists = db.getPayoutArtists();
    const withdrawals = db.getWithdrawalRequests();
    const disputes = db.getPayoutDisputes();
    const logs = db.getPayoutAuditLogs();
    const streams = db.getPayoutStreams();

    // ── LIVE METRIC CALCULATIONS ──
    const now = new Date();
    const currentMonthStr = now.toLocaleString('en-US', { month: 'short' });
    const currentYear = now.getFullYear();

    // Completed withdrawals total
    const completedWithdrawals = withdrawals.filter(w => w.status === 'completed');
    
    // Paid this month
    const paidThisMonthVal = completedWithdrawals
      .filter(w => {
        const d = new Date(w.updated);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((s, w) => s + w.amount, 0);

    // Pending Payouts (waiting in processing or review or pending status)
    const pendingPayoutsVal = withdrawals
      .filter(w => ['pending', 'review', 'approved', 'processing'].includes(w.status))
      .reduce((s, w) => s + w.amount, 0);

    // Average Payout
    const avgPayoutVal = completedWithdrawals.length > 0 
      ? Math.round((completedWithdrawals.reduce((s, w) => s + w.amount, 0) / completedWithdrawals.length) * 100) / 100
      : 0;

    // Artists Awaiting (exceeding threshold: default $10 for premium, $25 for free)
    const users = db.getUsers();
    const artistsAwaitingCount = artists.filter(a => {
      const u = users.find(x => x.id === a.id);
      const threshold = u?.subscription === 'premium' ? 10 : 25;
      return a.availableBalance >= threshold;
    }).length;

    // Today's Payouts
    const startOfToday = new Date(); startOfToday.setHours(0,0,0,0);
    const todaysPayoutsVal = completedWithdrawals
      .filter(w => new Date(w.updated).getTime() >= startOfToday.getTime())
      .reduce((s, w) => s + w.amount, 0);

    // Weekly Payouts
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const weeklyPayoutsVal = completedWithdrawals
      .filter(w => new Date(w.updated).getTime() >= sevenDaysAgo)
      .reduce((s, w) => s + w.amount, 0);

    // Failed, Held, Disputed counts
    const failedPaymentsCount = withdrawals.filter(w => w.status === 'failed').length;
    const heldPaymentsCount = withdrawals.filter(w => w.status === 'held').length;
    const disputedCount = disputes.filter(d => d.status === 'open' || d.status === 'investigating').length;
    const processingQueueCount = withdrawals.filter(w => w.status === 'processing' || w.status === 'pending').length;

    // Available Balance remaining on platform
    const revenueAvailableVal = artists.reduce((s, a) => s + a.availableBalance, 0);

    // Real stream counts for gross financials
    // Standard stream is gross $0.0075 premium, $0.0025 free (ad-supported).
    // Platform fee is 20%, Artist is 70%, Tax is 10%.
    const grossRevenueVal = streams.reduce((s, str) => {
      const mult = str.country === 'US' ? 1.25 : str.country === 'GB' ? 1.15 : str.country === 'IN' ? 0.85 : 1.0;
      const rate = str.isPremium ? 0.0075 : 0.0025;
      return s + (rate * mult);
    }, 0);

    const adRevenueVal = streams.filter(str => !str.isPremium).reduce((s, str) => {
      const mult = str.country === 'US' ? 1.25 : str.country === 'GB' ? 1.15 : str.country === 'IN' ? 0.85 : 1.0;
      return s + (0.0025 * mult);
    }, 0);

    const platformRevenueVal = Math.round((grossRevenueVal * 0.20) * 100) / 100;
    const artistRevenueVal = Math.round((grossRevenueVal * 0.70) * 100) / 100;
    const pendingTaxDeductionsVal = Math.round((grossRevenueVal * 0.10) * 100) / 100;

    // Global volume (lifetime completed payouts)
    const globalPayoutVolumeVal = completedWithdrawals.reduce((s, w) => s + w.amount, 0);

    const currency = db.getGlobalCurrency();
    const rate = currency === 'INR' ? 83 : 1;

    // Monthly growth forecast simulation data (last 6 months)
    const monthlyGrowth = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      const mLabel = d.toLocaleString('en-US', { month: 'short' });
      const mWithdrawals = completedWithdrawals.filter(w => {
        const date = new Date(w.updated);
        return date.getMonth() === d.getMonth() && date.getFullYear() === d.getFullYear();
      });
      monthlyGrowth.push({
        month: mLabel,
        amount: Math.round(mWithdrawals.reduce((s, w) => s + w.amount, 0) * rate * 100) / 100
      });
    }

    const convertedArtists = artists.map((a: any) => ({
      ...a,
      lifetimeEarnings: Math.round(a.lifetimeEarnings * rate * 100) / 100,
      availableBalance: Math.round(a.availableBalance * rate * 100) / 100,
      pendingBalance: Math.round(a.pendingBalance * rate * 100) / 100,
      estimatedNextPayout: Math.round(a.estimatedNextPayout * rate * 100) / 100,
    }));

    const convertedWithdrawals = withdrawals.map((w: any) => ({
      ...w,
      amount: Math.round(w.amount * rate * 100) / 100,
    }));

    return NextResponse.json({
      success: true,
      stats: {
        pendingPayouts: Math.round(pendingPayoutsVal * rate * 100) / 100,
        paidThisMonth: Math.round(paidThisMonthVal * rate * 100) / 100,
        avgPayout: Math.round(avgPayoutVal * rate * 100) / 100,
        artistsAwaiting: artistsAwaitingCount,
        todaysPayouts: Math.round(todaysPayoutsVal * rate * 100) / 100,
        weeklyPayouts: Math.round(weeklyPayoutsVal * rate * 100) / 100,
        monthlyPayouts: Math.round(paidThisMonthVal * rate * 100) / 100,
        failedPayments: failedPaymentsCount,
        heldPayments: heldPaymentsCount,
        disputedPayouts: disputedCount,
        processingQueue: processingQueueCount,
        revenueAvailable: Math.round(revenueAvailableVal * rate * 100) / 100,
        platformRevenue: Math.round(platformRevenueVal * rate * 100) / 100,
        artistRevenue: Math.round(artistRevenueVal * rate * 100) / 100,
        pendingTaxDeductions: Math.round(pendingTaxDeductionsVal * rate * 100) / 100,
        globalPayoutVolume: Math.round(globalPayoutVolumeVal * rate * 100) / 100,
        adRevenue: Math.round(adRevenueVal * rate * 100) / 100
      },
      artists: convertedArtists,
      withdrawals: convertedWithdrawals,
      disputes,
      auditLogs: logs,
      monthlyGrowth,
      currency
    });
  } catch (err: any) {
    console.error('Fetch admin payouts error:', err);
    return NextResponse.json({ error: 'Failed to fetch payout metrics' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const rbacCheck = await requireAdmin(request);
  if (!rbacCheck.authorized || !rbacCheck.user) {
    return NextResponse.json({ error: 'Access denied: Admin role required' }, { status: 403 });
  }

  try {
    const decoded = await verifyJWT(rbacCheck.user.token);
    if (!decoded || !decoded.email) {
      return NextResponse.json({ error: 'Invalid session token' }, { status: 401 });
    }
    const adminEmail = decoded.email;
    const body = await request.json();
    const { action, withdrawalId, artistId, amount, reason, ticketIds } = body;

    // 1. ACTION: Approve a withdrawal request
    if (action === 'approve') {
      if (!withdrawalId) return NextResponse.json({ error: 'withdrawalId required' }, { status: 400 });

      const withdrawals = db.getWithdrawalRequests();
      const wr = withdrawals.find(w => w.id === withdrawalId);
      if (!wr) return NextResponse.json({ error: 'Withdrawal request not found' }, { status: 404 });

      if (wr.status === 'completed') {
        return NextResponse.json({ error: 'Withdrawal is already completed' }, { status: 400 });
      }

      // Update status
      wr.status = 'completed';
      wr.updated = new Date().toISOString();
      db.saveWithdrawalRequest(wr);

      // Decrement pendingBalance on the artist
      const artist = db.getPayoutArtistById(wr.artistId);
      if (artist) {
        artist.pendingBalance = Math.max(0, Math.round((artist.pendingBalance - wr.amount) * 100) / 100);
        db.savePayoutArtist(artist);
      }

      // Add audit log
      db.addPayoutAuditLog({
        id: `LOG-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
        action: 'APPROVE_PAYOUT',
        performedBy: adminEmail,
        targetId: wr.id,
        details: `Approved withdrawal of $${wr.amount.toFixed(2)} to artist: ${wr.artistName}`,
        timestamp: new Date().toISOString()
      });

      return NextResponse.json({ success: true, message: `✅ Withdrawal request ${withdrawalId} completed successfully.` });
    }

    // 2. ACTION: Reject/Fail a withdrawal request
    if (action === 'reject') {
      if (!withdrawalId) return NextResponse.json({ error: 'withdrawalId required' }, { status: 400 });

      const withdrawals = db.getWithdrawalRequests();
      const wr = withdrawals.find(w => w.id === withdrawalId);
      if (!wr) return NextResponse.json({ error: 'Withdrawal request not found' }, { status: 404 });

      if (wr.status === 'completed' || wr.status === 'failed') {
        return NextResponse.json({ error: 'Invalid operation: request completed or already failed' }, { status: 400 });
      }

      wr.status = 'failed';
      wr.updated = new Date().toISOString();
      db.saveWithdrawalRequest(wr);

      // Refund availableBalance & decrement pendingBalance
      const artist = db.getPayoutArtistById(wr.artistId);
      if (artist) {
        artist.availableBalance = Math.round((artist.availableBalance + wr.amount) * 100) / 100;
        artist.pendingBalance = Math.max(0, Math.round((artist.pendingBalance - wr.amount) * 100) / 100);
        db.savePayoutArtist(artist);
      }

      db.addPayoutAuditLog({
        id: `LOG-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
        action: 'REJECT_PAYOUT',
        performedBy: adminEmail,
        targetId: wr.id,
        details: `Rejected withdrawal of $${wr.amount.toFixed(2)} for ${wr.artistName}. Reason: ${reason || 'Failed verification'}`,
        timestamp: new Date().toISOString()
      });

      return NextResponse.json({ success: true, message: `❌ Withdrawal request ${withdrawalId} rejected. Funds returned.` });
    }

    // 3. ACTION: Hold a withdrawal request
    if (action === 'hold') {
      if (!withdrawalId) return NextResponse.json({ error: 'withdrawalId required' }, { status: 400 });

      const withdrawals = db.getWithdrawalRequests();
      const wr = withdrawals.find(w => w.id === withdrawalId);
      if (!wr) return NextResponse.json({ error: 'Withdrawal request not found' }, { status: 404 });

      wr.status = 'held';
      wr.updated = new Date().toISOString();
      db.saveWithdrawalRequest(wr);

      db.addPayoutAuditLog({
        id: `LOG-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
        action: 'HOLD_PAYOUT',
        performedBy: adminEmail,
        targetId: wr.id,
        details: `Placed withdrawal request of $${wr.amount.toFixed(2)} for ${wr.artistName} on hold.`,
        timestamp: new Date().toISOString()
      });

      return NextResponse.json({ success: true, message: `⚠️ Withdrawal request ${withdrawalId} put on hold.` });
    }

    // 4. ACTION: Instant payout direct (Admin override)
    if (action === 'pay-now') {
      if (!artistId || !amount) return NextResponse.json({ error: 'artistId and amount required' }, { status: 400 });

      const artist = db.getPayoutArtistById(artistId);
      if (!artist) return NextResponse.json({ error: 'Artist not found' }, { status: 404 });

      const currency = db.getGlobalCurrency();
      const rate = currency === 'INR' ? 83 : 1;
      const usdAmount = Number(amount) / rate;

      if (artist.availableBalance < usdAmount) {
        return NextResponse.json({ error: 'Insufficient artist balance' }, { status: 400 });
      }

      // Deduct available
      artist.availableBalance = Math.round((artist.availableBalance - usdAmount) * 100) / 100;
      db.savePayoutArtist(artist);

      // Save a completed request
      const wrId = `WR-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      db.saveWithdrawalRequest({
        id: wrId,
        artistId: artist.id,
        artistName: artist.name,
        amount: usdAmount,
        method: 'bank',
        status: 'completed',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        fraudScore: artist.fraudScore || 0,
        riskLevel: 'low',
        details: { description: 'Admin Pay Now direct wire' }
      });

      db.addPayoutAuditLog({
        id: `LOG-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
        action: 'PAY_NOW_INSTANT',
        performedBy: adminEmail,
        targetId: artist.id,
        details: `Manually executed direct wire payout of $${usdAmount.toFixed(2)} to artist: ${artist.name}`,
        timestamp: new Date().toISOString()
      });

      const symbol = currency === 'INR' ? '₹' : '$';
      return NextResponse.json({ success: true, message: `✅ Direct payout of ${symbol}${Number(amount).toFixed(2)} completed.` });
    }

    // 5. ACTION: Adjust earnings (Promotional/referral override)
    if (action === 'adjust') {
      if (!artistId || !amount) return NextResponse.json({ error: 'artistId and amount required' }, { status: 400 });

      const artist = db.getPayoutArtistById(artistId);
      if (!artist) return NextResponse.json({ error: 'Artist not found' }, { status: 404 });

      const currency = db.getGlobalCurrency();
      const rate = currency === 'INR' ? 83 : 1;
      const usdAmount = Number(amount) / rate;

      artist.availableBalance = Math.round((artist.availableBalance + usdAmount) * 100) / 100;
      if (usdAmount > 0) {
        artist.lifetimeEarnings = Math.round((artist.lifetimeEarnings + usdAmount) * 100) / 100;
      }
      db.savePayoutArtist(artist);

      db.addPayoutAuditLog({
        id: `LOG-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
        action: 'ADJUST_EARNINGS',
        performedBy: adminEmail,
        targetId: artist.id,
        details: `Adjusted balances for ${artist.name} by $${usdAmount.toFixed(2)}. Reason: ${reason || 'Override Correction'}`,
        timestamp: new Date().toISOString()
      });

      const symbol = currency === 'INR' ? '₹' : '$';
      return NextResponse.json({ success: true, message: `✅ Artist balance adjusted by ${symbol}${Number(amount).toFixed(2)}.` });
    }

    // 6. ACTION: Bulk Resolve multiple requests
    if (action === 'bulk-resolve') {
      if (!Array.isArray(ticketIds) || ticketIds.length === 0) {
        return NextResponse.json({ error: 'ticketIds array required' }, { status: 400 });
      }

      const allWr = db.getWithdrawalRequests();
      let completedCount = 0;

      for (const wrId of ticketIds) {
        const wr = allWr.find(w => w.id === wrId);
        if (wr && wr.status !== 'completed') {
          wr.status = 'completed';
          wr.updated = new Date().toISOString();
          db.saveWithdrawalRequest(wr);

          // Decrement pendingBalance
          const artist = db.getPayoutArtistById(wr.artistId);
          if (artist) {
            artist.pendingBalance = Math.max(0, Math.round((artist.pendingBalance - wr.amount) * 100) / 100);
            db.savePayoutArtist(artist);
          }
          completedCount++;
        }
      }

      db.addPayoutAuditLog({
        id: `LOG-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
        action: 'BULK_RESOLVE',
        performedBy: adminEmail,
        targetId: 'multiple',
        details: `Bulk completed ${completedCount} pending withdrawal requests.`,
        timestamp: new Date().toISOString()
      });

      return NextResponse.json({ success: true, message: `✅ Successfully batch-resolved ${completedCount} withdrawals.` });
    }

    // 7. ACTION: Schedule all Payouts / Run Now simulation
    if (action === 'schedule-all') {
      const allArtists = db.getPayoutArtists();
      const users = db.getUsers();
      let scheduledCount = 0;

      for (const artist of allArtists) {
        const u = users.find(x => x.id === artist.id);
        const threshold = u?.subscription === 'premium' ? 10 : 25;

        // Auto trigger withdrawal for those exceeding minimum thresholds
        if (artist.availableBalance >= threshold) {
          const wAmount = artist.availableBalance;
          artist.pendingBalance = Math.round((artist.pendingBalance + wAmount) * 100) / 100;
          artist.availableBalance = 0;
          db.savePayoutArtist(artist);

          // Create pending withdrawal
          db.saveWithdrawalRequest({
            id: `WR-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
            artistId: artist.id,
            artistName: artist.name,
            amount: wAmount,
            method: artist.paymentMethod?.type || 'bank',
            status: 'processing', // Goes straight into processing
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
            fraudScore: artist.fraudScore || 0,
            riskLevel: artist.fraudScore > 75 ? 'critical' : artist.fraudScore > 50 ? 'high' : 'low',
            details: artist.paymentMethod ? { account: artist.paymentMethod.emailOrAccount } : {}
          });
          scheduledCount++;
        }
      }

      db.addPayoutAuditLog({
        id: `LOG-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
        action: 'BATCH_SCHEDULER_RUN',
        performedBy: adminEmail,
        targetId: 'all',
        details: `Triggered payouts batch run. Scheduled ${scheduledCount} withdrawals automatically.`,
        timestamp: new Date().toISOString()
      });

      return NextResponse.json({ success: true, message: `✅ Scheduler execution completed. Queued ${scheduledCount} payouts.` });
    }

    return NextResponse.json({ error: 'Unsupported action.' }, { status: 400 });
  } catch (err: any) {
    console.error('Modify admin payouts POST error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
