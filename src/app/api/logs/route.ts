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
 * GET /api/logs - Fetch logs based on filters
 * Requires admin authentication via Authorization: Bearer <ADMIN_API_KEY> header
 */
export async function GET(request: NextRequest) {
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
    const logType = searchParams.get('logType') || 'app';
    const level = searchParams.get('level');
    const endpoint = searchParams.get('endpoint');
    const timeRange = searchParams.get('timeRange') || '24h';
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

    // Calculate time filter
    const timeFilters: Record<string, string> = {
      '1h': "datetime('now', '-1 hour')",
      '6h': "datetime('now', '-6 hours')",
      '24h': "datetime('now', '-24 hours')",
      '7d': "datetime('now', '-7 days')",
      '30d': "datetime('now', '-30 days')",
    };

    const timeFilter = timeFilters[timeRange] || timeFilters['24h'];

    let sql = '';
    const bindings: any[] = [];

    switch (logType) {
      case 'app':
        sql = `SELECT * FROM app_logs WHERE timestamp >= ${timeFilter}`;
        if (level && level !== 'all') {
          sql += ' AND level = ?';
          bindings.push(level);
        }
        if (endpoint) {
          sql += ' AND endpoint LIKE ?';
          bindings.push(`%${endpoint}%`);
        }
        sql += ' ORDER BY timestamp DESC LIMIT ?';
        bindings.push(limit);
        break;

      case 'api':
        sql = `SELECT * FROM api_logs WHERE timestamp >= ${timeFilter}`;
        if (endpoint) {
          sql += ' AND endpoint LIKE ?';
          bindings.push(`%${endpoint}%`);
        }
        sql += ' ORDER BY timestamp DESC LIMIT ?';
        bindings.push(limit);
        break;

      case 'error':
        sql = `SELECT * FROM error_logs WHERE timestamp >= ${timeFilter}`;
        if (endpoint) {
          sql += ' AND endpoint LIKE ?';
          bindings.push(`%${endpoint}%`);
        }
        sql += ' ORDER BY timestamp DESC LIMIT ?';
        bindings.push(limit);
        break;

      case 'ai':
        sql = `SELECT * FROM ai_logs WHERE timestamp >= ${timeFilter} ORDER BY timestamp DESC LIMIT ?`;
        bindings.push(limit);
        break;

      case 'performance':
        sql = `SELECT * FROM performance_metrics WHERE timestamp >= ${timeFilter}`;
        if (endpoint) {
          sql += ' AND endpoint LIKE ?';
          bindings.push(`%${endpoint}%`);
        }
        sql += ' ORDER BY timestamp DESC LIMIT ?';
        bindings.push(limit);
        break;

      default:
        return NextResponse.json({ error: 'Invalid log type' }, { status: 400 });
    }

    const { results } = await env.DB.prepare(sql).bind(...bindings).all();

    return NextResponse.json({ logs: results });
  } catch (error) {
    console.error('Fetch logs error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch logs',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
