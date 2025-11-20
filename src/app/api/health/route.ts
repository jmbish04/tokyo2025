/**
 * Health Check API Route
 * Returns the status of the worker and its connected services
 */

export const runtime = 'edge';

export async function GET(request: Request) {
  // Access Cloudflare bindings from global env
  const env = (globalThis as any).env || {};

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
}
