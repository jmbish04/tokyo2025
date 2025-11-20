/**
 * Tokyo 2025 Travel Companion Worker
 * Main entry point for Cloudflare Workers
 */

export interface Env {
  DB: D1Database;
  MEMORY: KVNamespace;
  AI: any;
  ASSETS: Fetcher;
  // Secrets Store bindings
  OPENAI_API_KEY: { get: () => Promise<string> };
  GOOGLE_API_KEY: { get: () => Promise<string> };
  CLOUDFLARE_ACCOUNT_ID: { get: () => Promise<string> };
  CLOUDFLARE_API_TOKEN: { get: () => Promise<string> };
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Handle static assets
    if (url.pathname.startsWith('/public/')) {
      try {
        return await env.ASSETS.fetch(request);
      } catch (e) {
        return new Response('Asset not found', { status: 404 });
      }
    }

    // Make env available to API routes via global
    // This allows Next.js API routes to access Cloudflare bindings
    (globalThis as any).env = env;

    // Health check endpoint
    if (url.pathname === '/health') {
      return new Response(
        JSON.stringify({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          services: {
            d1: !!env.DB,
            kv: !!env.MEMORY,
            ai: !!env.AI,
          }
        }),
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Default: try to serve from assets (Next.js pages and static files)
    try {
      return await env.ASSETS.fetch(request);
    } catch (e) {
      // If asset not found, return 404
      return new Response('Not Found', {
        status: 404,
        headers: { 'Content-Type': 'text/plain' },
      });
    }
  },
};
