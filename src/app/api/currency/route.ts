import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireSuperAdmin } from '@/lib/rbac';

export async function GET() {
  try {
    const currency = db.getGlobalCurrency();
    const symbol = currency === 'INR' ? '₹' : '$';
    return NextResponse.json({ success: true, currency, symbol });
  } catch (err: any) {
    console.error('currency GET error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const rbacCheck = await requireSuperAdmin(request);
  if (!rbacCheck.authorized) {
    return NextResponse.json({ error: rbacCheck.message || 'Forbidden' }, { status: rbacCheck.status || 403 });
  }

  try {
    const body = await request.json();
    const { currency } = body;

    if (!currency || !['USD', 'INR'].includes(currency)) {
      return NextResponse.json({ error: 'Invalid currency. Must be USD or INR.' }, { status: 400 });
    }

    db.updateGlobalCurrency(currency);
    const symbol = currency === 'INR' ? '₹' : '$';

    return NextResponse.json({
      success: true,
      message: `Global currency successfully updated to ${currency}.`,
      currency,
      symbol,
    });
  } catch (err: any) {
    console.error('currency POST error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
