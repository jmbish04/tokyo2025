/**
 * Health Check API Route
 * Returns the status of the worker and its connected services
 */

import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    // Access Cloudflare bindings via getRequestContext
    const { env } = getRequestContext();

    return new Response(
      JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          d1: !!env.DB,
          kv: !!env.MEMORY,
          ai: !!env.AI,
        },
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    // In development, bindings might not be available
    return new Response(
      JSON.stringify({
        status: 'degraded',
        timestamp: new Date().toISOString(),
        note: 'Development mode - bindings not available',
        services: {
          d1: false,
          kv: false,
          ai: false,
        },
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
