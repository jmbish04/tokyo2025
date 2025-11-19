import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

interface Env {
  DB: D1Database;
}

/**
 * GET /api/logs - Fetch logs based on filters
 */
export async function GET(request: NextRequest) {
  try {
    const env = (globalThis as any).env as Env;

    if (!env.DB) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
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
