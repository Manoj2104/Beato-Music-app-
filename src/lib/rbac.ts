import { NextRequest } from 'next/server';
import { UserRole } from '@/types';
import { verifyJWT } from '@/lib/jwt';

export interface AuthenticatedUser {
  role: UserRole;
  token: string;
  userId?: string;
  email?: string;
  name?: string;
}

const ROLE_HIERARCHY: Record<UserRole, number> = {
  USER: 1,
  ARTIST: 2,
  ADMIN: 3,
  SUPER_ADMIN: 4,
};

/**
 * Extracts and returns the authenticated user's role and token from cookies after verifying cryptographically
 */
export async function getAuthUser(request: NextRequest): Promise<AuthenticatedUser | null> {
  let token = request.cookies.get('beato-token')?.value;

  if (!token) {
    const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (!token) {
    return null;
  }

  const decoded = await verifyJWT(token);
  if (!decoded) {
    return null;
  }

  return {
    role: decoded.role as UserRole,
    token: token,
    userId: decoded.userId,
    email: decoded.email,
    name: decoded.name,
  };
}

/**
 * Verifies if the user's role satisfies the required role permission hierarchy
 */
export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Standard request validator checking for specific permissions
 */
export async function validateRBAC(request: NextRequest, requiredRole: UserRole) {
  const user = await getAuthUser(request);
  
  if (!user) {
    return { authorized: false, status: 401, message: 'Unauthorized: Missing or invalid token' };
  }

  if (!hasRole(user.role, requiredRole)) {
    return { authorized: false, status: 403, message: `Forbidden: Requires ${requiredRole} role` };
  }

  return { authorized: true, user };
}

// Named helper guards matching request validations (returns Promise)
export function requireUser(request: NextRequest) {
  return validateRBAC(request, 'USER');
}

export function requireArtist(request: NextRequest) {
  return validateRBAC(request, 'ARTIST');
}

export function requireAdmin(request: NextRequest) {
  return validateRBAC(request, 'ADMIN');
}

export function requireSuperAdmin(request: NextRequest) {
  return validateRBAC(request, 'SUPER_ADMIN');
}
