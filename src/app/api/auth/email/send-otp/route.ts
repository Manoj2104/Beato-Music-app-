import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendEmail } from '@/lib/messaging';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email address is required' }, { status: 400 });
    }

    const emailTrimmed = email.toLowerCase().trim();

    // Generate random 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Save OTP to simulated database (reusing the otp table/list with email as key)
    db.saveOtp(emailTrimmed, code, expiry);

    // Try sending email
    const subject = `Beato Verification Code: ${code}`;
    const text = `Hello, your Beato Music verification code is ${code}. It expires in 5 minutes.`;
    const html = `
      <div style="font-family: sans-serif; font-size: 15px; color: #222; line-height: 1.5;">
        <p>Hello,</p>
        <p>Your Beato Music verification code is: <strong>${code}</strong></p>
        <p>This code will expire in 5 minutes. If you did not request this code, you can safely ignore this email.</p>
        <p>Best regards,<br/>Beato Music Team</p>
      </div>
    `;

    console.log(`[Email Auth] Dispatching OTP to ${emailTrimmed}...`);
    const emailResult = await sendEmail({
      to: emailTrimmed,
      subject,
      text,
      html,
    });

    if (emailResult.success) {
      return NextResponse.json({
        success: true,
        message: 'OTP sent successfully via Email',
      });
    } else {
      console.log(`[Email Auth] Email dispatch failed/disabled: ${emailResult.error || 'SMTP Config Incomplete'}. Falling back to sandbox...`);
      
      console.log(`\n==================================================`);
      console.log(`[EMAIL SERVICE API sandbox] Sending OTP to ${emailTrimmed}`);
      console.log(`Code: ${code}`);
      console.log(`Expires in: 5 minutes (at ${expiry.toLocaleTimeString()})`);
      console.log(`NOTE: Email SMTP attempted but failed: ${emailResult.error}`);
      console.log(`==================================================\n`);

      return NextResponse.json({
        success: true,
        message: 'OTP generated in development sandbox mode',
        developmentSandboxCode: code,
        warning: emailResult.error || 'SMTP not configured',
      });
    }
  } catch (error) {
    console.error('Send Email OTP error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
