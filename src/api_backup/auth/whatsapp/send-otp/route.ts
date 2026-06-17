import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    // Generate random 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Save OTP to simulated database
    db.saveOtp(phone, code, expiry);

    // Mock API dispatch logging (simulating Twilio WhatsApp or Meta Business APIs)
    console.log(`\n==================================================`);
    console.log(`[WHATSAPP SERVICE API sandbox] Sending OTP to ${phone}`);
    console.log(`Code: ${code}`);
    console.log(`Expires in: 5 minutes (at ${expiry.toLocaleTimeString()})`);
    console.log(`==================================================\n`);

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully via WhatsApp',
      // Return code in development sandbox for easy testing
      developmentSandboxCode: code,
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
