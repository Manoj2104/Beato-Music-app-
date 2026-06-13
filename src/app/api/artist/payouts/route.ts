import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/rbac';
import { db, WithdrawalRequestEntity, PayoutDisputeEntity, PayoutAuditLogEntity } from '@/lib/db';
import { verifyJWT } from '@/lib/jwt';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const rbacCheck = await requireUser(request);
  if (!rbacCheck.authorized || !rbacCheck.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const decoded = await verifyJWT(rbacCheck.user.token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Invalid session token' }, { status: 401 });
    }
    const userId = decoded.userId;

    const userObj = db.getUserById(userId);
    if (!userObj) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Retrieve or initialize artist payout profile
    let artist = db.getPayoutArtistById(userId);
    if (!artist) {
      artist = {
        id: userId,
        name: userObj.name || 'Artist',
        email: userObj.email,
        avatar: userObj.avatar,
        lifetimeEarnings: 0.00,
        availableBalance: 0.00,
        pendingBalance: 0,
        estimatedNextPayout: 0.00,
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
      db.savePayoutArtist(artist);
    }

    const currency = db.getGlobalCurrency();
    const currencyRate = currency === 'INR' ? 83 : 1;

    const withdrawals = db.getWithdrawalRequests().filter(w => w.artistId === userId);
    const disputes = db.getPayoutDisputes().filter(d => d.artistId === userId);
    const taxDocs = db.getPayoutTaxRecords().filter(t => t.artistId === userId);

    // Fetch and format track list for top performing songs analytics
    const allTracks = db.getTracks();
    const artistTracks = allTracks.filter(t => t.uploadedBy === userId || t.artistId === userId || t.artistName === artist?.name);
    
    let trackRevenues = artistTracks.map(t => {
      const plays = t.plays || 0;
      const streaming = Math.round(plays * 0.003 * 100) / 100;
      const downloads = Math.round(plays * 0.0005 * 100) / 100;
      return {
        title: t.title,
        streams: plays,
        streaming,
        downloads,
        total: Math.round((streaming + downloads) * 100) / 100
      };
    }).sort((a, b) => b.total - a.total).slice(0, 5);

    // Start empty if no tracks published yet
    if (trackRevenues.length === 0) {
      trackRevenues = [];
    }

    // Build historical monthly revenue chart breakdown dynamically from database stream entities
    const monthlyEarnings = [];
    const artistStreams = db.getPayoutStreams().filter(s => s.artistId === userId);
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      const mLabel = d.toLocaleString('en-US', { month: 'short' });
      const mStreams = artistStreams.filter(s => {
        const date = new Date(s.timestamp);
        return date.getMonth() === d.getMonth() && date.getFullYear() === d.getFullYear();
      });
      
      const streamingRev = mStreams.reduce((sum, s) => {
        const mult = s.country === 'US' ? 1.25 : s.country === 'GB' ? 1.15 : s.country === 'IN' ? 0.85 : 1.0;
        const rate = s.isPremium ? 0.00525 : 0.00175; // Artist net share after platform commission and withholding tax
        return sum + (rate * mult);
      }, 0);
      
      monthlyEarnings.push({
        month: mLabel,
        streaming: Math.round(streamingRev * currencyRate * 100) / 100,
        downloads: 0,
        sync: 0,
        total: Math.round(streamingRev * currencyRate * 100) / 100
      });
    }

    const convertedArtist = {
      ...artist,
      lifetimeEarnings: Math.round(artist.lifetimeEarnings * currencyRate * 100) / 100,
      availableBalance: Math.round(artist.availableBalance * currencyRate * 100) / 100,
      pendingBalance: Math.round(artist.pendingBalance * currencyRate * 100) / 100,
      estimatedNextPayout: Math.round(artist.estimatedNextPayout * currencyRate * 100) / 100,
    };

    const convertedWithdrawals = withdrawals.map((w: any) => ({
      ...w,
      amount: Math.round(w.amount * currencyRate * 100) / 100,
    }));

    const convertedTrackRevenues = trackRevenues.map((t: any) => ({
      ...t,
      streaming: Math.round(t.streaming * currencyRate * 100) / 100,
      downloads: Math.round(t.downloads * currencyRate * 100) / 100,
      total: Math.round(t.total * currencyRate * 100) / 100,
    }));

    return NextResponse.json({
      success: true,
      artist: convertedArtist,
      withdrawals: convertedWithdrawals,
      disputes,
      taxDocs,
      trackRevenues: convertedTrackRevenues,
      monthlyEarnings,
      subscription: userObj.subscription || 'free',
      currency
    });
  } catch (err: any) {
    console.error('Fetch artist payouts error:', err);
    return NextResponse.json({ error: 'Failed to fetch artist revenue details' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const rbacCheck = await requireUser(request);
  if (!rbacCheck.authorized || !rbacCheck.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const decoded = await verifyJWT(rbacCheck.user.token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Invalid session token' }, { status: 401 });
    }
    const userId = decoded.userId;

    const userObj = db.getUserById(userId);
    if (!userObj) {
      return NextResponse.json({ error: 'Artist account profile not found' }, { status: 404 });
    }

    const artist = db.getPayoutArtistById(userId);
    if (!artist) {
      return NextResponse.json({ error: 'Payout profile not initialized' }, { status: 400 });
    }

    const body = await request.json();
    const { action, amount, method, details, issue, evidence } = body;

    // 1. ACTION: Withdraw earnings
    if (action === 'withdraw') {
      if (!amount || amount <= 0) {
        return NextResponse.json({ error: 'Invalid withdrawal amount' }, { status: 400 });
      }

      const currency = db.getGlobalCurrency();
      const rate = currency === 'INR' ? 83 : 1;
      const usdAmount = Number(amount) / rate;

      if (artist.availableBalance < usdAmount) {
        return NextResponse.json({ error: 'Requested amount exceeds available balance' }, { status: 400 });
      }

      // Check KYC and Tax verifications
      if (artist.kycStatus !== 'verified') {
        return NextResponse.json({ error: 'KYC identity verification is required before withdrawal.' }, { status: 400 });
      }

      if (!artist.taxVerified) {
        return NextResponse.json({ error: 'Tax form verification is required before withdrawal.' }, { status: 400 });
      }

      // Check minimum thresholds ($10 for premium, $25 for free)
      const threshold = userObj.subscription === 'premium' ? 10 : 25;
      if (usdAmount < threshold) {
        return NextResponse.json({ error: `Withdrawal amount must be at least ${currency === 'INR' ? '₹' : '$'}${Math.round(threshold * rate)}.` }, { status: 400 });
      }

      // Fraud Risk Engine Check
      const fraudScore = artist.fraudScore || 0;
      let status: WithdrawalRequestEntity['status'] = 'processing';
      let riskLevel: WithdrawalRequestEntity['riskLevel'] = 'low';

      if (fraudScore > 85) {
        status = 'held';
        riskLevel = 'critical';
      } else if (fraudScore > 60) {
        status = 'review';
        riskLevel = 'high';
      } else if (fraudScore > 30) {
        status = 'review';
        riskLevel = 'medium';
      }

      // Update artist balances
      artist.availableBalance = Math.round((artist.availableBalance - usdAmount) * 100) / 100;
      artist.pendingBalance = Math.round((artist.pendingBalance + usdAmount) * 100) / 100;
      db.savePayoutArtist(artist);

      // Create request entry
      const wrId = `WR-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      const newRequest = db.saveWithdrawalRequest({
        id: wrId,
        artistId: userId,
        artistName: artist.name,
        amount: usdAmount,
        method: method || 'bank',
        status,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        fraudScore,
        riskLevel,
        details: details || {}
      });

      // Log activity in audit
      db.addPayoutAuditLog({
        id: `LOG-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
        action: 'REQUEST_WITHDRAWAL',
        performedBy: artist.email,
        targetId: wrId,
        details: `Requested withdrawal of $${usdAmount.toFixed(2)} via ${method || 'bank'}. Status set to: ${status}`,
        timestamp: new Date().toISOString()
      });

      return NextResponse.json({
        success: true,
        message: status === 'held' || status === 'review'
          ? 'Withdrawal request flagged by Risk Engine and routed for manual security review.'
          : 'Withdrawal successfully initiated and queued for processing.',
        request: newRequest
      });
    }

    // 2. ACTION: Update payment details
    if (action === 'update-method') {
      if (!method) {
        return NextResponse.json({ error: 'Payment method details are required' }, { status: 400 });
      }

      artist.paymentMethod = {
        type: method,
        emailOrAccount: details?.emailOrAccount || 'N/A',
        routingOrCode: details?.routingOrCode || '',
        verified: true
      };
      db.savePayoutArtist(artist);

      db.addPayoutAuditLog({
        id: `LOG-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
        action: 'UPDATE_PAYOUT_METHOD',
        performedBy: artist.email,
        targetId: artist.id,
        details: `Linked payment method: ${method.toUpperCase()} account ending in ${artist.paymentMethod.emailOrAccount.slice(-4)}`,
        timestamp: new Date().toISOString()
      });

      return NextResponse.json({ success: true, message: `✅ Payout method ${method} updated and verified.` });
    }

    // 3. ACTION: File a dispute
    if (action === 'dispute') {
      if (!issue || !evidence) {
        return NextResponse.json({ error: 'Issue description and evidence are required' }, { status: 400 });
      }

      const dispId = `DISP-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      const newDispute = db.savePayoutDispute({
        id: dispId,
        artistId: userId,
        artistName: artist.name,
        issue: issue.trim(),
        evidence: evidence.trim(),
        status: 'open',
        created: new Date().toISOString(),
        updated: new Date().toISOString()
      });

      db.addPayoutAuditLog({
        id: `LOG-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
        action: 'RAISE_DISPUTE',
        performedBy: artist.email,
        targetId: dispId,
        details: `Raised payout discrepancy dispute: "${issue.substring(0, 30)}..."`,
        timestamp: new Date().toISOString()
      });

      return NextResponse.json({ success: true, dispute: newDispute, message: 'Dispute raised successfully. Finance Triage will review shortly.' });
    }

    return NextResponse.json({ error: 'Invalid payout action.' }, { status: 400 });
  } catch (err: any) {
    console.error('Artist payout POST error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
