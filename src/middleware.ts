/**
 * Next.js Middleware
 * Sets up Cloudflare bindings to be accessible globally
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
  // Try to get Cloudflare bindings from the request context
  // When running on Cloudflare Workers, bindings are available via getRequestContext
  try {
    // @ts-ignore - getRequestContext is provided by @cloudflare/next-on-pages at runtime
    if (typeof getRequestContext === 'function') {
      // @ts-ignore
      const { env } = getRequestContext();
      (globalThis as any).env = env;
    }
  } catch (e) {
    // In development or if getRequestContext is not available, bindings may already be set
  }

  return NextResponse.next();
}
