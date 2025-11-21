/**
 * Next.js Middleware
 * Note: Cloudflare bindings are accessed per-request via getRequestContext()
 * from '@cloudflare/next-on-pages' in each API route, not via middleware
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

export function middleware(request: NextRequest) {
  // Middleware for future use (e.g., auth, logging, etc.)
  // Cloudflare bindings should be accessed in API routes via:
  // import { getRequestContext } from '@cloudflare/next-on-pages';
  // const { env } = getRequestContext();

  return NextResponse.next();
}
