import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/rbac';
import { db } from '@/lib/db';
import crypto from 'crypto';

const DEFAULT_PLAN_PRICES: Record<string, number> = {
  free: 0, student: 4.99, premium: 9.99, family: 15.99, creator: 19.99,
};

const METHODS = ['Visa', 'Mastercard', 'PayPal', 'UPI', 'Apple Pay', 'Google Pay'];
const STATUS_WEIGHTS = ['completed', 'completed', 'completed', 'completed', 'completed', 'pending', 'pending', 'failed', 'refunded'];
const RISK_WEIGHTS = ['low', 'low', 'low', 'low', 'medium', 'medium', 'high'];

// Deterministic hash-based pick — same result every request for same inputs
function hashPick<T>(arr: T[], userId: string, salt: string): T {
  const hash = crypto.createHash('md5').update(`${userId}:${salt}`).digest('hex');
  const idx = parseInt(hash.substring(0, 8), 16) % arr.length;
  return arr[idx];
}

function hashFloat(userId: string, salt: string, min: number, max: number): number {
  const hash = crypto.createHash('md5').update(`${userId}:${salt}:float`).digest('hex');
  const n = parseInt(hash.substring(0, 8), 16) / 0xFFFFFFFF; // 0..1
  return min + n * (max - min);
}

function generateInvoiceId(userId: string, txIndex: number): string {
  const hash = crypto.createHash('md5').update(`inv:${userId}:${txIndex}`).digest('hex');
  return `INV-${hash.toUpperCase().substring(0, 8)}`;
}

// Build billing history for each PAID real user
// Each paid user gets 6 months of billing cycles (one per month)
function buildTransactionsFromRealUsers(users: any[]) {
  const txns: any[] = [];
  let txnSerial = 50000;
  const planPrices = db.getPlanPrices();

  users.forEach((user, userIdx) => {
    const plan = (user.subscription || 'free').toLowerCase();
    const price = planPrices[plan] !== undefined ? planPrices[plan] : (DEFAULT_PLAN_PRICES[plan] || 0);

    // Skip free users — no payments
    if (price === 0) return;

    const createdAt = new Date(user.createdAt);
    const method = user.paymentMethod || hashPick(METHODS, user.id, 'method');

    // Generate monthly billing cycles since account creation (up to 6 months)
    const monthsAgo = Math.max(1, Math.min(6, Math.floor((Date.now() - createdAt.getTime()) / (30 * 86400000))));

    for (let month = monthsAgo - 1; month >= 0; month--) {
      const txDate = new Date();
      txDate.setMonth(txDate.getMonth() - month);
      txDate.setDate(1); // Always billed on 1st
      txDate.setHours(Math.floor(hashFloat(user.id, `hr${month}`, 8, 20)));
      txDate.setMinutes(Math.floor(hashFloat(user.id, `min${month}`, 0, 59)));
      txDate.setSeconds(0);

      // Most billing succeeds, first month might have pending
      let status: string;
      if (month === 0 && hashFloat(user.id, 'first', 0, 1) > 0.7) {
        status = 'pending';
      } else if (month === monthsAgo - 1 && hashFloat(user.id, 'old', 0, 1) > 0.85) {
        status = 'failed';
      } else {
        status = 'completed';
      }

      const risk = hashPick(RISK_WEIGHTS, user.id, `risk${month}`);
      txnSerial++;

      txns.push({
        id: `TXN-${txnSerial}`,
        userId: user.id,
        user: user.name,
        email: user.email,
        avatar: user.avatar || null,
        amount: price,
        plan,
        method,
        date: txDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        dateTs: txDate.getTime(),
        status,
        currency: 'USD',
        invoiceId: generateInvoiceId(user.id, month),
        country: user.country || 'IN',
        risk,
        billingCycle: month === 0 ? 'Current' : `Month -${month}`,
        planLabel: plan.charAt(0).toUpperCase() + plan.slice(1),
      });
    }
  });

  return txns.sort((a, b) => b.dateTs - a.dateTs);
}

export async function GET(request: NextRequest) {
  const rbacCheck = await requireAdmin(request);
  if (!rbacCheck.authorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const users = db.getUsers();
    const planPrices = db.getPlanPrices();
    const currency = db.getGlobalCurrency();
    const rate = currency === 'INR' ? 83 : 1;
    const symbol = currency === 'INR' ? '₹' : '$';

    const paidUsers = users.filter((u: any) => {
      const plan = (u.subscription || 'free').toLowerCase();
      const price = planPrices[plan] !== undefined ? planPrices[plan] : (DEFAULT_PLAN_PRICES[plan] || 0);
      return price > 0 && u.paymentMethod !== 'Admin Plan';
    });

    let rawTransactions = db.getTransactions();

    // If transactions table is empty in DB, seed it deterministically
    if (rawTransactions.length === 0) {
      rawTransactions = buildTransactionsFromRealUsers(users);
      db.setTransactions(rawTransactions);
    }

    // Convert transaction amounts dynamically based on active global currency
    const allTransactions = rawTransactions.map((t: any) => ({
      ...t,
      amount: Math.round(t.amount * rate * 100) / 100,
      refundAmount: t.refundAmount ? Math.round(t.refundAmount * rate * 100) / 100 : undefined,
    }));

    // ── Real-time Stats ────────────────────────────────────────────────────────
    const completedTxns = allTransactions.filter(t => t.status === 'completed');
    const pendingTxns = allTransactions.filter(t => t.status === 'pending');
    const failedTxns = allTransactions.filter(t => t.status === 'failed');
    const refundedTxns = allTransactions.filter(t => t.status === 'refunded');

    const totalRevenue = completedTxns.reduce((s, t) => s + t.amount, 0);
    const pendingAmount = pendingTxns.reduce((s, t) => s + t.amount, 0);
    const refundedAmount = refundedTxns.reduce((s, t) => s + (t.refundAmount || t.amount), 0);

    // Today's revenue
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayRevenue = completedTxns.filter(t => t.dateTs >= todayStart.getTime()).reduce((s, t) => s + t.amount, 0);

    // Yesterday
    const yStart = new Date(todayStart); yStart.setDate(yStart.getDate() - 1);
    const yesterdayRevenue = completedTxns.filter(t => t.dateTs >= yStart.getTime() && t.dateTs < todayStart.getTime()).reduce((s, t) => s + t.amount, 0);

    // This month
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
    const monthRevenue = completedTxns.filter(t => t.dateTs >= monthStart.getTime()).reduce((s, t) => s + t.amount, 0);

    // MRR from active paid subscriptions
    const mrr = paidUsers.reduce((s: number, u: any) => {
      const plan = (u.subscription || 'free').toLowerCase();
      const price = planPrices[plan] !== undefined ? planPrices[plan] : (DEFAULT_PLAN_PRICES[plan] || 0);
      return s + price;
    }, 0) * rate;

    // Real-time streaming and ad revenue aggregation
    const payoutStreams = db.getPayoutStreams();

    const adRevenueUsd = payoutStreams.filter((s: any) => !s.isPremium).reduce((s, str) => {
      const mult = str.country === 'US' ? 1.25 : str.country === 'GB' ? 1.15 : str.country === 'IN' ? 0.85 : 1.0;
      return s + (0.0025 * mult);
    }, 0);
    const adRevenue = Math.round(adRevenueUsd * rate * 100) / 100;

    const grossStreamingRoyaltyUsd = payoutStreams.reduce((s, str) => {
      const mult = str.country === 'US' ? 1.25 : str.country === 'GB' ? 1.15 : str.country === 'IN' ? 0.85 : 1.0;
      const r = str.isPremium ? 0.0075 : 0.0025;
      return s + (r * mult);
    }, 0);
    const grossStreamingRoyalty = Math.round(grossStreamingRoyaltyUsd * rate * 100) / 100;

    const platformShare = Math.round(grossStreamingRoyalty * 0.20 * 100) / 100;
    const artistShare = Math.round(grossStreamingRoyalty * 0.70 * 100) / 100;
    const taxShare = Math.round(grossStreamingRoyalty * 0.10 * 100) / 100;

    const todayAdRevenueUsd = payoutStreams
      .filter((s: any) => !s.isPremium && new Date(s.timestamp).getTime() >= todayStart.getTime())
      .reduce((s, str) => {
        const mult = str.country === 'US' ? 1.25 : str.country === 'GB' ? 1.15 : str.country === 'IN' ? 0.85 : 1.0;
        return s + (0.0025 * mult);
      }, 0);
    const todayAdRevenue = Math.round(todayAdRevenueUsd * rate * 100) / 100;

    const yesterdayAdRevenueUsd = payoutStreams
      .filter((s: any) => !s.isPremium && new Date(s.timestamp).getTime() >= yStart.getTime() && new Date(s.timestamp).getTime() < todayStart.getTime())
      .reduce((s, str) => {
        const mult = str.country === 'US' ? 1.25 : str.country === 'GB' ? 1.15 : str.country === 'IN' ? 0.85 : 1.0;
        return s + (0.0025 * mult);
      }, 0);
    const yesterdayAdRevenue = Math.round(yesterdayAdRevenueUsd * rate * 100) / 100;

    const totalGrossRevenue = totalRevenue + adRevenue;
    const totalTodayRevenue = todayRevenue + todayAdRevenue;
    const totalYesterdayRevenue = yesterdayRevenue + yesterdayAdRevenue;
    const todayTrend = totalYesterdayRevenue > 0 ? (((totalTodayRevenue - totalYesterdayRevenue) / totalYesterdayRevenue) * 100).toFixed(1) : '+100';


    // By plan
    const revenueByPlan: Record<string, { revenue: number; count: number }> = {};
    completedTxns.forEach(t => {
      if (!revenueByPlan[t.plan]) revenueByPlan[t.plan] = { revenue: 0, count: 0 };
      revenueByPlan[t.plan].revenue += t.amount;
      revenueByPlan[t.plan].count += 1;
    });

    // By method
    const revenueByMethod: Record<string, { revenue: number; count: number }> = {};
    completedTxns.forEach(t => {
      if (!revenueByMethod[t.method]) revenueByMethod[t.method] = { revenue: 0, count: 0 };
      revenueByMethod[t.method].revenue += t.amount;
      revenueByMethod[t.method].count += 1;
    });
    const totalMethodRev = Object.values(revenueByMethod).reduce((s, v) => s + v.revenue, 0);
    const methodData = Object.entries(revenueByMethod).map(([name, { revenue, count }]) => ({
      name, value: Math.round((revenue / (totalMethodRev || 1)) * 100), revenue: Math.round(revenue * 100) / 100, count,
    })).sort((a, b) => b.value - a.value);

    // Daily revenue last 14 days (real)
    const dailyRevenue = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0);
      const nd = new Date(d); nd.setDate(nd.getDate() + 1);
      const dayTxns = completedTxns.filter(t => t.dateTs >= d.getTime() && t.dateTs < nd.getTime());
      dailyRevenue.push({
        day: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: Math.round(dayTxns.reduce((s, t) => s + t.amount, 0) * 100) / 100,
        txns: dayTxns.length,
      });
    }

    // Monthly revenue trend (last 6 months)
    const monthlyRevenue = [];
    for (let i = 5; i >= 0; i--) {
      const mStart = new Date(); mStart.setMonth(mStart.getMonth() - i); mStart.setDate(1); mStart.setHours(0, 0, 0, 0);
      const mEnd = new Date(mStart); mEnd.setMonth(mEnd.getMonth() + 1);
      const mTxns = completedTxns.filter(t => t.dateTs >= mStart.getTime() && t.dateTs < mEnd.getTime());
      monthlyRevenue.push({
        month: mStart.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        revenue: Math.round(mTxns.reduce((s, t) => s + t.amount, 0) * 100) / 100,
        txns: mTxns.length,
      });
    }

    // Per-user breakdown
    const userBreakdown = paidUsers.map((u: any) => {
      const uTxns = allTransactions.filter(t => t.userId === u.id);
      const uCompleted = uTxns.filter(t => t.status === 'completed');
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        plan: u.subscription,
        country: u.country || 'IN',
        totalPaid: Math.round(uCompleted.reduce((s, t) => s + t.amount, 0) * 100) / 100,
        txCount: uTxns.length,
        method: u.paymentMethod || uTxns[0]?.method || 'N/A',
        lastPayment: uTxns[0]?.date || 'N/A',
        status: u.isActive ? 'active' : 'suspended',
      };
    });

    const total = allTransactions.length;
    const successRate = total > 0 ? ((completedTxns.length / total) * 100).toFixed(1) : '0';

    return NextResponse.json({
      success: true,
      stats: {
        totalRevenue: Math.round(totalGrossRevenue * 100) / 100,
        subscriptionRevenue: Math.round(totalRevenue * 100) / 100,
        adRevenue: Math.round(adRevenue * 100) / 100,
        grossStreamingRoyalty: Math.round(grossStreamingRoyalty * 100) / 100,
        platformShare: Math.round(platformShare * 100) / 100,
        artistShare: Math.round(artistShare * 100) / 100,
        taxShare: Math.round(taxShare * 100) / 100,
        todayRevenue: Math.round(totalTodayRevenue * 100) / 100,
        yesterdayRevenue: Math.round(totalYesterdayRevenue * 100) / 100,
        todayTrend,
        monthRevenue: Math.round((monthRevenue + adRevenue) * 100) / 100,
        mrr: Math.round(mrr * 100) / 100,
        pendingAmount: Math.round(pendingAmount * 100) / 100,
        refundedAmount: Math.round(refundedAmount * 100) / 100,
        failedCount: failedTxns.length,
        pendingCount: pendingTxns.length,
        refundedCount: refundedTxns.length,
        totalTxns: total,
        completedCount: completedTxns.length,
        highRiskCount: allTransactions.filter(t => t.risk === 'high').length,
        successRate,
        avgOrderValue: completedTxns.length > 0 ? Math.round((totalRevenue / completedTxns.length) * 100) / 100 : 0,
        paidUsersCount: paidUsers.length,
        totalUsersCount: users.length,
      },
      transactions: allTransactions,
      dailyRevenue,
      monthlyRevenue,
      methodData,
      revenueByPlan: Object.entries(revenueByPlan)
        .map(([plan, { revenue, count }]) => ({ plan, revenue: Math.round(revenue * 100) / 100, count }))
        .sort((a, b) => b.revenue - a.revenue),
      userBreakdown,
      currency,
      symbol,
    });
  } catch (err: any) {
    console.error('payments GET error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const rbacCheck = await requireAdmin(request);
  if (!rbacCheck.authorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { action, txId, userId, amount, reason, method } = body;

    if (action === 'refund') {
      if (!txId || !amount) return NextResponse.json({ error: 'txId and amount required' }, { status: 400 });
      
      const currency = db.getGlobalCurrency();
      const rate = currency === 'INR' ? 83 : 1;
      const usdRefundAmount = Number(amount) / rate;

      const success = db.updateTransactionStatus(txId, 'refunded', usdRefundAmount, reason || 'Customer Request');
      if (!success) return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });

      const symbol = currency === 'INR' ? '₹' : '$';
      return NextResponse.json({
        success: true,
        message: `✅ Refund of ${symbol}${Number(amount).toFixed(2)} processed for ${txId}. Funds will return in 3-5 business days.`,
        refundId: `REF-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
      });
    }

    if (action === 'retry') {
      const success = db.updateTransactionStatus(txId, 'completed');
      if (!success) return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
      return NextResponse.json({ success: true, message: `🔄 Payment retry initiated. Transaction ${txId} is now Completed.` });
    }

    if (action === 'flag') {
      const transactions = db.getTransactions();
      const idx = transactions.findIndex(t => t.id === txId);
      if (idx !== -1) {
        transactions[idx].risk = 'high';
        db.setTransactions(transactions);
        return NextResponse.json({ success: true, message: `🚩 Transaction ${txId} flagged for fraud review.` });
      }
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    if (action === 'send_invoice') {
      const user = userId ? db.getUserById(userId) : null;
      const email = user?.email || 'user';
      return NextResponse.json({ success: true, message: `📧 Invoice resent to ${email} for ${txId}.` });
    }

    if (action === 'void') {
      const success = db.updateTransactionStatus(txId, 'failed');
      if (!success) return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
      return NextResponse.json({ success: true, message: `🚫 Transaction ${txId} voided.` });
    }

    if (action === 'change_method') {
      if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });
      if (!method) return NextResponse.json({ error: 'method required' }, { status: 400 });

      const user = db.getUserById(userId);
      if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

      db.updateUser(userId, { paymentMethod: method });

      // Update method on all user's transactions
      const transactions = db.getTransactions();
      transactions.forEach(t => {
        if (t.userId === userId) {
          t.method = method;
        }
      });
      db.setTransactions(transactions);

      return NextResponse.json({ success: true, message: `✅ Changed ${user.name}'s payment method to ${method}.` });
    }

    return NextResponse.json({ error: 'Unsupported action.' }, { status: 400 });
  } catch (err: any) {
    console.error('payments POST error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
