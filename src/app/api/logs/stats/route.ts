import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

interface Env {
  DB: D1Database;
}

/**
 * GET /api/logs/stats - Get log statistics for dashboard
 */
export async function GET(request: NextRequest) {
  try {
    const env = (globalThis as any).env as Env;

    if (!env.DB) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    // Get stats for last 24 hours
    const timeFilter = "datetime('now', '-24 hours')";

    // Total requests
    const { results: totalRequestsResult } = await env.DB
      .prepare(`SELECT COUNT(*) as count FROM api_logs WHERE timestamp >= ${timeFilter}`)
      .all();

    const totalRequests = totalRequestsResult[0]?.count || 0;

    // Error count
    const { results: errorCountResult } = await env.DB
      .prepare(`SELECT COUNT(*) as count FROM api_logs WHERE timestamp >= ${timeFilter} AND status_code >= 400`)
      .all();

    const errorCount = errorCountResult[0]?.count || 0;

    // Error rate
    const errorRate = totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0;

    // Average response time
    const { results: avgResponseResult } = await env.DB
      .prepare(`SELECT AVG(duration_ms) as avg_duration FROM api_logs WHERE timestamp >= ${timeFilter}`)
      .all();

    const avgResponseTime = avgResponseResult[0]?.avg_duration || 0;

    // Total AI tokens
    const { results: aiTokensResult } = await env.DB
      .prepare(`SELECT SUM(total_tokens) as total_tokens FROM ai_logs WHERE timestamp >= ${timeFilter}`)
      .all();

    const totalAITokens = aiTokensResult[0]?.total_tokens || 0;

    // Top endpoints by request count
    const { results: topEndpoints } = await env.DB
      .prepare(`
        SELECT endpoint, COUNT(*) as count
        FROM api_logs
        WHERE timestamp >= ${timeFilter}
        GROUP BY endpoint
        ORDER BY count DESC
        LIMIT 5
      `)
      .all();

    // Recent errors
    const { results: recentErrors } = await env.DB
      .prepare(`
        SELECT error_type, COUNT(*) as count
        FROM error_logs
        WHERE timestamp >= ${timeFilter}
        GROUP BY error_type
        ORDER BY count DESC
        LIMIT 5
      `)
      .all();

    return NextResponse.json({
      totalRequests,
      errorCount,
      errorRate,
      avgResponseTime,
      totalAITokens,
      topEndpoints,
      recentErrors,
    });
  } catch (error) {
    console.error('Fetch stats error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch stats',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
