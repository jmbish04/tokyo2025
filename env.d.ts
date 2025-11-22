import { D1Database, KVNamespace, AnalyticsEngineDataset, Ai } from '@cloudflare/workers-types';

declare global {
  interface CloudflareEnv {
    DB: D1Database;
    MEMORY: KVNamespace;
    ANALYTICS: AnalyticsEngineDataset;
    AI: Ai;
    OPENAI_API_KEY?: { get: () => Promise<string> };
    GOOGLE_API_KEY?: { get: () => Promise<string> };
    CLOUDFLARE_ACCOUNT_ID?: { get: () => Promise<string> };
    CLOUDFLARE_API_TOKEN?: { get: () => Promise<string> };
    ADMIN_API_KEY?: { get: () => Promise<string> };
    GOOGLE_PLACES_API_KEY?: string;
  }
}

export {};
