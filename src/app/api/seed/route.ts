import { NextRequest, NextResponse } from 'next/server';
import { seedDatabase } from '@/scripts/init-seed';

export const runtime = 'edge';

interface Env {
  DB: D1Database;
  GOOGLE_PLACES_API_KEY?: string;
}

/**
 * Admin endpoint to seed the database with real venue data
 * POST /api/seed
 *
 * Body:
 * {
 *   "areas": ["ginza", "osaka"],  // Optional, defaults to both
 *   "apiKey": "your-api-key"       // Optional if set as secret
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { areas, apiKey: bodyApiKey } = body;

    const env = process.env as unknown as Env;

    // Get API key from body, environment variable, or fail
    const apiKey = bodyApiKey || env.GOOGLE_PLACES_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error: 'Google Places API key required',
          message: 'Provide apiKey in request body or set GOOGLE_PLACES_API_KEY secret',
          instructions: 'Run: npx wrangler secret put GOOGLE_PLACES_API_KEY',
        },
        { status: 400 }
      );
    }

    if (!env.DB) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    console.log('🌱 Starting database seeding...');
    const startTime = Date.now();

    const results = await seedDatabase(
      apiKey,
      env.DB,
      areas || ['ginza', 'osaka']
    );

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: results.success,
      message: `Seeded ${results.total} venues in ${(duration / 1000).toFixed(2)}s`,
      results: {
        ginza: results.ginza,
        osaka: results.osaka,
        total: results.total,
      },
      stats: results.stats,
      duration: `${(duration / 1000).toFixed(2)}s`,
      errors: results.errors,
    });

  } catch (error) {
    console.error('Seeding error:', error);
    return NextResponse.json(
      {
        error: 'Seeding failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/seed - Show seeding status and instructions
 */
export async function GET(request: NextRequest) {
  const env = process.env as unknown as Env;

  const hasApiKey = !!env.GOOGLE_PLACES_API_KEY;
  const hasDb = !!env.DB;

  let venueCount = 0;
  if (hasDb) {
    try {
      const result = await env.DB.prepare('SELECT COUNT(*) as count FROM venues').first();
      venueCount = (result?.count as number) || 0;
    } catch (error) {
      console.error('Error counting venues:', error);
    }
  }

  return NextResponse.json({
    status: 'ready',
    configured: {
      database: hasDb,
      apiKey: hasApiKey,
    },
    currentVenues: venueCount,
    instructions: {
      setApiKey: 'npx wrangler secret put GOOGLE_PLACES_API_KEY',
      seedDatabase: 'POST /api/seed with {"areas": ["ginza", "osaka"]}',
      seedGinzaOnly: 'POST /api/seed with {"areas": ["ginza"]}',
      seedOsakaOnly: 'POST /api/seed with {"areas": ["osaka"]}',
    },
    note: hasApiKey
      ? 'API key is configured. POST to this endpoint to start seeding.'
      : 'Set GOOGLE_PLACES_API_KEY secret before seeding.',
  });
}
