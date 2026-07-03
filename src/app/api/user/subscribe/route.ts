import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/rbac';
import { db } from '@/lib/db';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  const rbacCheck = await requireUser(request);
  if (!rbacCheck.authorized || !rbacCheck.user) {
    return NextResponse.json(
      { error: rbacCheck.message || 'Unauthorized' },
      { status: rbacCheck.status || 401 }
    );
  }

  try {
    const body = await request.json();
    const userId = rbacCheck.user.userId!;
    const { planId, paymentMethod, billingCycle, amount } = body;

    if (!planId || !paymentMethod || !billingCycle || amount === undefined) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const dbUser = db.getUserById(userId);
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 1. Update user subscription status in DB
    const success = db.updateUser(userId, {
      subscription: planId,
      paymentMethod,
      billingCycle,
    });

    if (!success) {
      return NextResponse.json({ error: 'Failed to update user profile' }, { status: 500 });
    }

    // 2. Generate a new completed transaction in DB if amount > 0
    if (amount > 0) {
      const invoiceId = `INV-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      const txId = `TXN-${Math.floor(100000 + Math.random() * 900000)}`;
      const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      
      const newTx = {
        id: txId,
        userId,
        user: dbUser.name,
        email: dbUser.email,
        avatar: dbUser.avatar || undefined,
        amount: Number(amount),
        plan: planId,
        method: paymentMethod,
        date,
        dateTs: Date.now(),
        status: 'completed' as const,
        currency: db.getGlobalCurrency() || 'USD',
        invoiceId,
        country: dbUser.country || 'IN',
        risk: 'low' as const,
        billingCycle: billingCycle === 'Annual' ? 'Annual' : 'Monthly',
        planLabel: planId.charAt(0).toUpperCase() + planId.slice(1),
      };

      db.saveTransaction(newTx);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully subscribed to Beato ${planId.charAt(0).toUpperCase() + planId.slice(1)}! 💎`
    });

  } catch (error: any) {
    console.error('Subscription API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
