import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ exists: false });
    }
    const existingUser = db.getUserByEmail(email.toLowerCase().trim());
    return NextResponse.json({ exists: !!existingUser });
  } catch (error) {
    return NextResponse.json({ exists: false });
  }
}
