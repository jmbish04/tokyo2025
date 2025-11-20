import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

interface Env {
  DB: D1Database;
  ADMIN_API_KEY?: { get: () => Promise<string> };
}

/**
 * Simple admin authentication check
 * Returns true if authenticated, false otherwise
 */
async function isAuthenticated(request: NextRequest, env: Env): Promise<boolean> {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }

  const providedKey = authHeader.substring(7); // Remove 'Bearer ' prefix

  // Check against ADMIN_API_KEY if configured
  if (env.ADMIN_API_KEY) {
    try {
      const adminKey = await env.ADMIN_API_KEY.get();
      return providedKey === adminKey;
    } catch (err) {
      console.error('[AUTH] Failed to get ADMIN_API_KEY:', err);
      return false;
    }
  }

  // If no ADMIN_API_KEY configured, deny access (secure by default)
  console.warn('[AUTH] ADMIN_API_KEY not configured - denying access');
  return false;
}

/**
 * GET /api/venues - Get recent venues
 * Query params: limit (default 10), district, category
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const district = searchParams.get('district');
    const category = searchParams.get('category');

    const env = (globalThis as any).env as Env;

    if (!env.DB) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    let query = 'SELECT * FROM venues WHERE 1=1';
    const params: any[] = [];

    if (district) {
      query += ' AND district = ?';
      params.push(district);
    }

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    query += ' ORDER BY id DESC LIMIT ?';
    params.push(limit);

    const stmt = env.DB.prepare(query);
    const { results } = await stmt.bind(...params).all();

    return NextResponse.json({
      venues: results,
      count: results.length,
    });

  } catch (error) {
    console.error('Get venues error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch venues', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/venues - Add a manual venue
 * Body: { name, category, district, description, map_url?, rating? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, category, district, description, map_url, rating } = body;

    if (!name || !category || !district || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: name, category, district, description' },
        { status: 400 }
      );
    }

    const env = (globalThis as any).env as Env;

    if (!env.DB) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    // Check for duplicates
    const existing = await env.DB.prepare(
      'SELECT id FROM venues WHERE name = ? AND district = ?'
    ).bind(name, district).first();

    if (existing) {
      return NextResponse.json(
        { error: 'Venue already exists with this name in this district' },
        { status: 409 }
      );
    }

    // Generate map URL if not provided
    const finalMapUrl = map_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ' ' + district)}`;
    const finalRating = rating !== undefined ? rating : 0;

    // Insert venue
    const result = await env.DB.prepare(
      'INSERT INTO venues (name, category, district, description, map_url, rating) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(name, category, district, description, finalMapUrl, finalRating).run();

    // Get the inserted venue
    const newVenue = await env.DB.prepare(
      'SELECT * FROM venues WHERE id = last_insert_rowid()'
    ).first();

    return NextResponse.json({
      success: true,
      message: 'Venue added successfully',
      venue: newVenue,
    });

  } catch (error) {
    console.error('Add venue error:', error);
    return NextResponse.json(
      { error: 'Failed to add venue', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/venues?id=123 - Delete a venue
 * Requires admin authentication via Authorization: Bearer <ADMIN_API_KEY> header
 */
export async function DELETE(request: NextRequest) {
  try {
    const env = (globalThis as any).env as Env;

    if (!env.DB) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    // Authenticate admin user
    const authenticated = await isAuthenticated(request, env);
    if (!authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Venue ID required' }, { status: 400 });
    }

    await env.DB.prepare('DELETE FROM venues WHERE id = ?').bind(id).run();

    return NextResponse.json({
      success: true,
      message: 'Venue deleted successfully',
    });

  } catch (error) {
    console.error('Delete venue error:', error);
    return NextResponse.json(
      { error: 'Failed to delete venue', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
