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

    // Fetch credentials from DB config
    const config = db.getMessagingConfig();
    const wa = config?.whatsapp;
    
    let isMetaSent = false;
    let apiError = null;

    if (wa?.provider === 'meta' && wa?.phoneNumberId && wa?.accessToken) {
      try {
        // Strip non-numeric characters for WhatsApp API (e.g. +919876543210 -> 919876543210)
        let cleanPhone = phone.replace(/\D/g, '');
        
        // Auto-append Indian country code if user only typed 10 digits
        if (cleanPhone.length === 10) {
          cleanPhone = '91' + cleanPhone;
        }
        
        const payload = {
          messaging_product: 'whatsapp',
          to: cleanPhone,
          type: 'text',
          text: {
            preview_url: false,
            body: `Your Beato Music verification code is: ${code}. It expires in 5 minutes. Do not share this with anyone.`
          }
        };

        console.log(`[Meta API] Dispatching OTP to ${cleanPhone}...`);
        
        const response = await fetch(`https://graph.facebook.com/v19.0/${wa.phoneNumberId}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${wa.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const data = await response.json();
        
        if (response.ok) {
          console.log(`[Meta API] Successfully sent OTP. Message ID: ${data?.messages?.[0]?.id}`);
          isMetaSent = true;
        } else {
          console.error(`[Meta API] Failed to send OTP:`, data?.error);
          apiError = data?.error?.message || 'Meta API Error';
        }
      } catch (err) {
        console.error(`[Meta API] Exception during dispatch:`, err);
        apiError = String(err);
      }
    } else {
      console.log(`[Meta API] Not configured or disabled. Falling back to sandbox...`);
    }

    if (!isMetaSent) {
      // Mock API dispatch logging (simulating Twilio WhatsApp or Meta Business APIs)
      console.log(`\n==================================================`);
      console.log(`[WHATSAPP SERVICE API sandbox] Sending OTP to ${phone}`);
      console.log(`Code: ${code}`);
      console.log(`Expires in: 5 minutes (at ${expiry.toLocaleTimeString()})`);
      if (apiError) console.log(`NOTE: Meta API attempted but failed: ${apiError}`);
      console.log(`==================================================\n`);
    }

    return NextResponse.json({
      success: true,
      message: isMetaSent ? 'OTP sent successfully via Meta WhatsApp' : 'OTP sent successfully via Sandbox',
      // Return code in development sandbox for easy testing if Meta fails or isn't configured
      developmentSandboxCode: isMetaSent ? undefined : code,
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
