/**
 * Utility to access Cloudflare bindings in Next.js API routes
 * Use this in all API routes to get access to D1, KV, AI, and other bindings
 */

import { getRequestContext } from '@cloudflare/next-on-pages';

export interface Env {
  DB: D1Database;
  MEMORY: KVNamespace;
  AI: any;
  OPENAI_API_KEY: { get: () => Promise<string> };
  GOOGLE_API_KEY: { get: () => Promise<string> };
  CLOUDFLARE_ACCOUNT_ID: { get: () => Promise<string> };
  CLOUDFLARE_API_TOKEN: { get: () => Promise<string> };
  ADMIN_API_KEY: { get: () => Promise<string> };
}

/**
 * Get Cloudflare bindings from the request context
 * @returns Env object with all Cloudflare bindings
 */
export function getEnv(): Env {
  try {
    const { env } = getRequestContext();
    return env as Env;
  } catch (error) {
    // In development, return a mock env
    console.warn('Failed to get Cloudflare bindings - may be in development mode');
    throw new Error('Cloudflare bindings not available');
  }
}
