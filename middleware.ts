/**
 * VigilanteCiudadano - Next.js Edge Middleware for Role-Based Access Control (RBAC)
 * Location: middleware.ts
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionToken } from './utils/authCrypto';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only intercept tactical routes
  if (pathname === '/oficial' || pathname === '/mapa' || pathname === '/policia') {
    const sessionCookie = request.cookies.get('vc_session')?.value;

    // 1. If cookie is present, verify token
    if (sessionCookie) {
      const session = await verifySessionToken(sessionCookie);

      if (session) {
        // Role-Based Routing logic:
        if (pathname === '/oficial' && session.tipo !== 'oficial') {
          // If logged in as operator, redirect to dispatcher command center
          return NextResponse.redirect(new URL('/mapa', request.url));
        }

        if (pathname === '/mapa' && session.tipo !== 'operador') {
          // If logged in as officer, redirect to officer tactical terminal
          return NextResponse.redirect(new URL('/oficial', request.url));
        }

        // If authenticated and on correct route or /policia, allow access
        return NextResponse.next();
      }
    }

    // 2. If cookie is missing or invalid:
    // For /policia (which has no login form), redirect to /oficial to authenticate
    if (pathname === '/policia') {
      return NextResponse.redirect(new URL('/oficial', request.url));
    }

    // For /oficial and /mapa, let them load the page so the user can see and fill the login form
    return NextResponse.next();
  }

  return NextResponse.next();
}

// Ensure middleware runs only on target routes to optimize performance
export const config = {
  matcher: ['/oficial', '/mapa', '/policia'],
};
