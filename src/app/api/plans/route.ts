import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const currency = db.getGlobalCurrency();
    const rate = currency === 'INR' ? 83 : 1;
    const rawPrices = db.getPlanPrices();
    const symbol = currency === 'INR' ? '₹' : '$';

    const prices = Object.fromEntries(
      Object.entries(rawPrices).map(([plan, price]) => [
        plan,
        Math.round(price * rate * 100) / 100,
      ])
    );

    return NextResponse.json({ success: true, prices, currency, symbol });
  } catch (err: any) {
    console.error('plans GET error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
