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

    // Handle API routes
    if (url.pathname.startsWith('/api/')) {
      // Make env available to API routes via global
      (globalThis as any).env = env;

      // In production, Next.js routes would be handled by the framework
      // For now, return a basic response
      return new Response(
        JSON.stringify({
          message: 'API route',
          path: url.pathname,
          note: 'In production, Next.js will handle these routes'
        }),
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

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

    // Default response for root and other paths
    // In production with Next.js, this would serve the Next.js app
    return new Response(
      `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Tokyo 2025 Travel Companion</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background: #0f0f0f;
            color: #ffffff;
          }
          h1 {
            background: linear-gradient(135deg, #ff4081, #ff6b9d);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          .status {
            background: #1a1a1a;
            padding: 20px;
            border-radius: 8px;
            margin-top: 20px;
          }
          .endpoint {
            background: #252525;
            padding: 10px;
            margin: 10px 0;
            border-radius: 4px;
            font-family: monospace;
          }
        </style>
      </head>
      <body>
        <h1>🗼 Tokyo 2025 Travel Companion</h1>
        <p>Welcome to your AI-powered Tokyo travel assistant!</p>

        <div class="status">
          <h2>Worker Status</h2>
          <p>✅ Cloudflare Worker is running</p>
          <p>✅ D1 Database: ${env.DB ? 'Connected' : 'Not configured'}</p>
          <p>✅ KV Storage: ${env.MEMORY ? 'Connected' : 'Not configured'}</p>
          <p>✅ AI Binding: ${env.AI ? 'Connected' : 'Not configured'}</p>
        </div>

        <div class="status">
          <h2>Available Endpoints</h2>
          <div class="endpoint">GET /health - Health check</div>
          <div class="endpoint">POST /api/chat - Chat with AI assistant</div>
          <div class="endpoint">POST /api/upload - Upload images</div>
          <div class="endpoint">GET /api/memory - Retrieve chat history</div>
          <div class="endpoint">GET /api/weather - Get weather data</div>
        </div>

        <div class="status">
          <h2>Next Steps</h2>
          <p>1. Deploy the Next.js frontend</p>
          <p>2. Run database migrations</p>
          <p>3. Configure Cloudflare bindings</p>
        </div>
      </body>
      </html>
      `,
      {
        headers: { 'Content-Type': 'text/html' },
      }
    );
  },
};
