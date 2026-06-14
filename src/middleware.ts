import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJWT } from '@/lib/jwt';

// Configuration: define protected paths
const ARTIST_ROUTES = ['/artist', '/artist/dashboard', '/artist/upload', '/artist/analytics', '/artist/revenue', '/artist/register'];
const ADMIN_ROUTES = ['/admin', '/admin/dashboard', '/admin/panel'];

function addCorsHeaders(request: NextRequest, res: NextResponse): NextResponse {
  const origin = request.headers.get('origin') || '*';
  res.headers.set('Access-Control-Allow-Origin', origin);
  res.headers.set('Access-Control-Allow-Credentials', 'true');
  res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-CSRF-Token, Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version');
  return res;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Handle Preflight OPTIONS requests for API
  if (request.method === 'OPTIONS' && pathname.startsWith('/api/')) {
    const response = new NextResponse(null, { status: 204 });
    return addCorsHeaders(request, response);
  }

  // Retrieve token from cookies or Authorization header
  let token = request.cookies.get('beato-token')?.value;
  if (!token) {
    const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  let userRole: string | undefined = undefined;
  let isAuthenticated = false;

  if (token) {
    const decoded = await verifyJWT(token);
    if (decoded) {
      userRole = decoded.role;
      isAuthenticated = true;
    }
  }

  // 2. Handle API Route Protection
  if (pathname.startsWith('/api/')) {
    // Admin API Routes
    if (pathname.startsWith('/api/admin/')) {
      if (!isAuthenticated) {
        return addCorsHeaders(request, NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 }));
      }
      if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
        return addCorsHeaders(request, NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 }));
      }
    }

    if (pathname.startsWith('/api/upload/') || pathname === '/api/upload-song') {
      if (!isAuthenticated) {
        return addCorsHeaders(request, NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 }));
      }
      if (userRole !== 'ARTIST' && userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
        return addCorsHeaders(request, NextResponse.json({ error: 'Forbidden: Insufficient privileges' }, { status: 403 }));
      }
    }
    const response = NextResponse.next();
    return addCorsHeaders(request, response);
  }

  // Detect Mobile User Agent
  const userAgent = request.headers.get('user-agent') || '';
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

  // 2. Redirect Rules for Authenticated Users
  if (isAuthenticated) {
    // If logged in, prevent going to landing, login, register, or root root redirection path
    if (pathname === '/' || pathname === '/landing' || pathname === '/login' || pathname === '/register') {
      return NextResponse.redirect(new URL('/home', request.url));
    }
  } else {
    // 3. Redirect Rules for Unauthenticated Users
    // Protect core dashboard pages
    const protectedRoutes = ['/home', '/library', '/search', '/settings', '/playlist', '/album'];
    const isProtected = protectedRoutes.some(route => pathname === route || pathname.startsWith(route + '/'));
    
    if (isProtected) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Handle root path redirect
    if (pathname === '/') {
      if (isMobile) {
        return NextResponse.redirect(new URL('/login', request.url));
      } else {
        return NextResponse.redirect(new URL('/landing', request.url));
      }
    }

    // Handle landing page redirection on mobile
    if (pathname === '/landing' && isMobile) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // 4. Role-based Page Route Protection for Authenticated Users
  // Check Artist routes (protect only management routes, exclude public profiles /artist/[id] and apply page)
  const PROTECTED_ARTIST_SUBROUTES = ['/artist/dashboard', '/artist/upload', '/artist/analytics', '/artist/revenue', '/artist/register'];
  const isArtistRoute = pathname === '/artist' || PROTECTED_ARTIST_SUBROUTES.some(route => pathname === route || pathname.startsWith(route + '/'));
  
  if (isArtistRoute) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    // Allow ARTIST, ADMIN, and SUPER_ADMIN
    if (userRole !== 'ARTIST' && userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/403', request.url));
    }
  }

  // Check Admin routes
  const isAdminRoute = pathname.startsWith('/admin/') || pathname === '/admin';
  if (isAdminRoute) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    // Allow ADMIN and SUPER_ADMIN
    if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/403', request.url));
    }
  }

  return NextResponse.next();
}

// Next.js Middleware matcher configuration
export const config = {
  matcher: [
    '/',
    '/landing',
    '/login',
    '/register',
    '/home',
    '/library',
    '/search',
    '/settings',
    '/playlist/:path*',
    '/album/:path*',
    '/artist/:path*',
    '/admin/:path*',
    '/api/:path*',
  ],
};
