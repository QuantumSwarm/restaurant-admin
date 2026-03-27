// middleware.ts
// Route protection middleware - runs before every request

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that don't require authentication
const publicRoutes = ['/login', '/forgot-password', '/reset-password'];

// Routes only accessible to Super Admin
const superAdminRoutes = ['/admins'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Allow static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Get token from cookie or localStorage (client-side)
  // Note: In middleware, we can't access localStorage, so we'll check cookies
  const token = request.cookies.get('token')?.value;

  // If no token, redirect to login
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verify token and check role (simplified version)
  // In production, you'd decode and verify the JWT here
  try {
    // For now, we'll trust the token exists
    // Full JWT verification would happen here with jsonwebtoken library
    
    // Check if route requires Super Admin (we'll enhance this later)
    if (superAdminRoutes.some((route) => pathname.startsWith(route))) {
      // In a real implementation, decode token and check role
      // For now, this is a placeholder
      // We'll handle role checks on the client side in the layout
    }

    return NextResponse.next();
  } catch (error) {
    // Invalid token, redirect to login
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }
}

// Configure which routes use this middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api).*)',
  ],
};
