import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+={}\[\]|\\:;"'<>,.?/~`\-]).{8,}$/;

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, confirmPassword } = await request.json();

    // 1. Validation checks
    if (!name || !email || !password || !confirmPassword) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: 'Invalid email address format' }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: 'Passwords do not match' }, { status: 400 });
    }

    if (!PASSWORD_REGEX.test(password)) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character' },
        { status: 400 }
      );
    }

    // 2. Uniqueness check
    const existingUser = db.getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json({ error: 'An account with this email address already exists' }, { status: 409 });
    }

    // 3. Hashing
    const passwordHash = await bcrypt.hash(password, 10);

    // 4. Save User
    const savedUser = db.saveUser({
      name,
      email: email.toLowerCase().trim(),
      passwordHash,
      role: 'USER',
      isActive: true,
    });

    // 5. Fire automation rules async (non-blocking — does not affect signup response time)
    const ip = (request as any).ip || request.headers.get('x-forwarded-for') || 'unknown';
    import('@/lib/messaging').then(({ fireAutomation }) => {
      fireAutomation('user.signup', { name: savedUser.name, email: savedUser.email, ip }).catch(console.error);
    }).catch(console.error);

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: savedUser.id,
        name: savedUser.name,
        email: savedUser.email,
        role: savedUser.role,
      },
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
