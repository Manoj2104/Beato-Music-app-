import { SignJWT, jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || 'beato-super-secure-jwt-secret-key-1234567890'
);

import { UserRole } from '@/types';

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  name: string;
}

/**
 * Signs a JWT with the given payload and expiration duration (e.g. '15m', '7d')
 */
export async function signJWT(payload: JWTPayload, expiration: string): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiration)
    .sign(SECRET_KEY);
}

/**
 * Verifies a JWT and extracts the payload. Returns null if invalid or expired.
 */
export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload as unknown as JWTPayload;
  } catch (error) {
    return null;
  }
}
