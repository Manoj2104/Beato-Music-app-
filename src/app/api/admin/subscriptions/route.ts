import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/rbac';
import { db } from '@/lib/db';
import crypto from 'crypto';

const DEFAULT_PLAN_PRICES: Record<string, number> = {
  free: 0,
  student: 4.99,
  premium: 9.99,
  family: 15.99,
  creator: 19.99,
};

function recordManualPlanChange(user: any, newPlan: string) {
  const p = newPlan.toLowerCase();
  const txDate = new Date();
  const allTx = db.getTransactions();
  const txSerial = 50000 + allTx.length + 1;
  const invoiceId = `INV-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  
  db.saveTransaction({
    id: `TXN-${txSerial}`,
    userId: user.id,
    user: user.name,
    email: user.email,
    avatar: user.avatar || null,
    amount: 0, // Manual plan upgrades do not generate actual payment revenue
    plan: p,
    method: 'Admin Plan', // Show "Admin Plan" as the payment method for manual overrides
    date: txDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    dateTs: txDate.getTime(),
    status: 'completed',
    currency: 'USD',
    invoiceId,
    country: user.country || 'IN',
    risk: 'low',
    billingCycle: 'Current',
    planLabel: p.charAt(0).toUpperCase() + p.slice(1),
  });
}

export async function GET(request: NextRequest) {
  const rbacCheck = await requireAdmin(request);
  if (!rbacCheck.authorized) {
    return NextResponse.json({ error: rbacCheck.message || 'Forbidden' }, { status: rbacCheck.status || 403 });
  }

  try {
    const users = db.getUsers();

    // Real subscriber counts from the database
    const planCounts: Record<string, number> = {
      free: 0, student: 0, premium: 0, family: 0, creator: 0,
    };
    users.forEach(u => {
      const plan = (u.subscription || 'free').toLowerCase();
      if (plan in planCounts) planCounts[plan]++;
    });

    const totalSubs = users.length;
    const planPrices = db.getPlanPrices();
    const currency = db.getGlobalCurrency();
    const rate = currency === 'INR' ? 83 : 1;
    const symbol = currency === 'INR' ? '₹' : '$';
    
    // Compute MRR excluding users upgraded via "Admin Plan" (since they don't pay real cash)
    const mrr = users.reduce((sum, u) => {
      if (u.paymentMethod === 'Admin Plan') return sum;
      const plan = (u.subscription || 'free').toLowerCase();
      if (plan === 'free') return sum;
      const price = planPrices[plan] !== undefined ? planPrices[plan] : (DEFAULT_PLAN_PRICES[plan] || 0);
      return sum + price;
    }, 0);
    const arpu = totalSubs > 0 ? mrr / totalSubs : 0;

    // Build per-plan details
    const plans = Object.entries(planCounts).map(([name, count]) => {
      const price = planPrices[name] !== undefined ? planPrices[name] : (DEFAULT_PLAN_PRICES[name] || 0);
      // Compute actual revenue by filtering out manual overrides
      const planRevenue = users.filter(u => (u.subscription || 'free').toLowerCase() === name && u.paymentMethod !== 'Admin Plan')
        .reduce((sum, u) => sum + price, 0);

      return {
        name,
        price: Math.round(price * rate * 100) / 100,
        subscribers: count,
        revenue: Math.round(planRevenue * rate * 100) / 100,
        share: totalSubs > 0 ? ((count / totalSubs) * 100).toFixed(1) : '0.0',
      };
    });

    // Recent subscriptions (last 20 users sorted by createdAt)
    const recentSubs = [...users]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 20)
      .map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        plan: u.subscription || 'free',
        role: u.role,
        isActive: u.isActive,
        avatar: u.avatar,
        country: u.country || 'IN',
        joinedAt: new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        billing: u.subscription === 'free' ? '—' : 'Monthly',
        status: u.isActive ? 'active' : 'suspended',
      }));

    return NextResponse.json({
      success: true,
      stats: {
        totalSubs,
        mrr: Math.round(mrr * rate * 100) / 100,
        arpu: Math.round(arpu * rate * 100) / 100,
        churnRate: 2.4, // simulated
      },
      plans,
      recentSubs,
      currency,
      symbol,
    });
  } catch (err: any) {
    console.error('subscriptions stats error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const rbacCheck = await requireAdmin(request);
  if (!rbacCheck.authorized) {
    return NextResponse.json({ error: rbacCheck.message || 'Forbidden' }, { status: rbacCheck.status || 403 });
  }

  try {
    const body = await request.json();
    const { action, userId, plan, planName, newPrice, newFeatures } = body;

    if (action === 'change_plan') {
      if (!userId || !plan) {
        return NextResponse.json({ error: 'userId and plan are required.' }, { status: 400 });
      }
      const validPlans = ['free', 'student', 'premium', 'family', 'creator'];
      if (!validPlans.includes(plan.toLowerCase())) {
        return NextResponse.json({ error: `Invalid plan: ${plan}` }, { status: 400 });
      }
      const user = db.getUserById(userId);
      if (!user) {
        return NextResponse.json({ error: 'User not found.' }, { status: 404 });
      }
      db.updateUser(userId, { subscription: plan.toLowerCase() as any, paymentMethod: 'Admin Plan' });
      recordManualPlanChange(user, plan);
      return NextResponse.json({
        success: true,
        message: `Changed ${user.name}'s plan to ${plan}.`,
      });
    }

    if (action === 'suspend_sub') {
      if (!userId) return NextResponse.json({ error: 'userId required.' }, { status: 400 });
      const user = db.getUserById(userId);
      if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 });
      db.updateUser(userId, { isActive: false });
      return NextResponse.json({ success: true, message: `Suspended ${user.name}'s subscription.` });
    }

    if (action === 'activate_sub') {
      if (!userId) return NextResponse.json({ error: 'userId required.' }, { status: 400 });
      const user = db.getUserById(userId);
      if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 });
      db.updateUser(userId, { isActive: true });
      return NextResponse.json({ success: true, message: `Reactivated ${user.name}'s subscription.` });
    }

    if (action === 'cancel_sub') {
      if (!userId) return NextResponse.json({ error: 'userId required.' }, { status: 400 });
      const user = db.getUserById(userId);
      if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 });
      db.updateUser(userId, { subscription: 'free', paymentMethod: 'Admin Plan' });
      return NextResponse.json({ success: true, message: `Cancelled ${user.name}'s subscription. Downgraded to Free.` });
    }

    if (action === 'grant_trial') {
      if (!userId || !plan) return NextResponse.json({ error: 'userId and plan required.' }, { status: 400 });
      const user = db.getUserById(userId);
      if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 });
      db.updateUser(userId, { subscription: plan.toLowerCase() as any, paymentMethod: 'Admin Plan' });
      recordManualPlanChange(user, plan);
      return NextResponse.json({ success: true, message: `Granted ${user.name} a 30-day trial of ${plan}.` });
    }

    if (action === 'edit_plan_price') {
      if (!plan || newPrice === undefined) {
        return NextResponse.json({ error: 'plan and newPrice are required.' }, { status: 400 });
      }
      
      const currency = db.getGlobalCurrency();
      const rate = currency === 'INR' ? 83 : 1;
      const usdPrice = Number(newPrice) / rate;

      db.updatePlanPrice(plan, usdPrice);
      
      const symbol = currency === 'INR' ? '₹' : '$';
      return NextResponse.json({ success: true, message: `✅ Pricing of ${plan} updated to ${symbol}${newPrice}.` });
    }

    return NextResponse.json({ error: 'Unsupported action.' }, { status: 400 });
  } catch (err: any) {
    console.error('subscriptions POST error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
