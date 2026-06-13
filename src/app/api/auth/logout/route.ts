import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });

  // Clear all auth cookies
  response.cookies.delete('beato-token');
  response.cookies.delete('beato-refresh-token');
  response.cookies.delete('beato-role');

  return response;
}
