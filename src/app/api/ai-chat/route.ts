import { StreamingTextResponse, streamText, tool } from 'ai';
import { z } from 'zod';
import { NextRequest } from 'next/server';
import { getAIModel, TOKYO_SYSTEM_PROMPT } from '@/lib/ai-provider';
import { getModelConfig } from '@/lib/ai-config';
import { addMessage, getMessages, createChat } from '@/lib/chat-history';

export const runtime = 'edge';

interface Env {
  DB: D1Database;
  AI: any;
  OPENAI_API_KEY: { get: () => Promise<string> };
  GOOGLE_API_KEY: { get: () => Promise<string> };
}

/**
 * Factory function to create tool definitions with DB access via closure
 */
function createTools(db: D1Database) {
  return {
    getWeather: tool({
      description: 'Get current weather information for a location in Tokyo or Osaka',
      parameters: z.object({
        location: z.string().describe('The location name (e.g., Tokyo, Ginza, Osaka)'),
      }),
      execute: async ({ location }) => {
        // Fetch weather data
        const response = await fetch(`https://wttr.in/${encodeURIComponent(location)}?format=j1`);
        const data = (await response.json()) as {
          current_condition: Array<{
            temp_C: string;
            weatherDesc: Array<{ value: string }>;
            humidity: string;
            windspeedKmph: string;
          }>;
          weather: Array<{
            hourly?: Array<{
              weatherDesc?: Array<{ value: string }>;
            }>;
          }>;
        };

        return {
          location,
          temperature: parseInt(data.current_condition[0].temp_C),
          condition: data.current_condition[0].weatherDesc[0].value,
          humidity: parseInt(data.current_condition[0].humidity),
          windSpeed: parseInt(data.current_condition[0].windspeedKmph),
          forecast: data.weather[0]?.hourly?.[0]?.weatherDesc?.[0]?.value || 'No forecast available',
        };
      },
    }),

    getSubwayRoute: tool({
      description: 'Get subway/metro route information between two Tokyo stations',
      parameters: z.object({
        from: z.string().describe('Starting station name'),
        to: z.string().describe('Destination station name'),
      }),
      execute: async ({ from, to }) => {
        // Simplified subway routing - in production, use Tokyo Metro API
        const tokyoLines: Record<string, string[]> = {
          'Ginza Line': ['Shibuya', 'Omotesando', 'Aoyama-itchome', 'Akasaka-mitsuke', 'Ginza', 'Nihombashi', 'Ueno', 'Asakusa'],
          'Marunouchi Line': ['Shinjuku', 'Yotsuya', 'Ginza', 'Tokyo'],
          'Hibiya Line': ['Naka-Meguro', 'Ebisu', 'Roppongi', 'Ginza', 'Akihabara', 'Ueno'],
          'Chiyoda Line': ['Yoyogi-Uehara', 'Meiji-Jingumae', 'Omotesando', 'Otemachi'],
        };

        // Find connecting lines (simplified)
        const lines: string[] = [];
        for (const [line, stations] of Object.entries(tokyoLines)) {
          if (stations.some(s => s.toLowerCase().includes(from.toLowerCase())) &&
              stations.some(s => s.toLowerCase().includes(to.toLowerCase()))) {
            lines.push(line);
          }
        }

        return {
          from,
          to,
          lines: lines.length > 0 ? lines : ['JR Yamanote'],
          duration: '15-25 min',
          transfers: lines.length > 1 ? 1 : 0,
        };
      },
    }),

    searchVenues: tool({
      description: 'Search for venues, attractions, restaurants in Tokyo/Osaka database',
      parameters: z.object({
        query: z.string().describe('Search query (category, district, or keyword)'),
        limit: z.number().optional().default(3).describe('Number of results to return'),
      }),
      execute: async ({ query, limit }) => {
        const lowerQuery = query.toLowerCase();

        let sql = 'SELECT * FROM venues WHERE ';
        const conditions: string[] = [];

        // Search in multiple fields
        if (lowerQuery) {
          conditions.push(`(
          LOWER(name) LIKE '%' || ? || '%' OR
          LOWER(category) LIKE '%' || ? || '%' OR
          LOWER(district) LIKE '%' || ? || '%' OR
          LOWER(description) LIKE '%' || ? || '%'
        )`);
        }

        sql += conditions.join(' AND ') + ' ORDER BY rating DESC LIMIT ?';

        const { results } = await db.prepare(sql)
          .bind(lowerQuery, lowerQuery, lowerQuery, lowerQuery, limit)
          .all();

        return results;
      },
    }),

    queryLogs: tool({
      description: 'Query application logs to debug issues, find errors, or analyze system behavior. Can filter by level, endpoint, time range, etc.',
      parameters: z.object({
        logType: z.enum(['app', 'api', 'error', 'ai', 'performance']).describe('Type of logs to query'),
        level: z.enum(['debug', 'info', 'warn', 'error', 'fatal']).optional().describe('Log level filter (for app logs)'),
        endpoint: z.string().optional().describe('Filter by specific API endpoint'),
        limit: z.number().optional().default(10).describe('Number of log entries to return (max 50)'),
        timeRange: z.enum(['1h', '6h', '24h', '7d', '30d']).optional().default('24h').describe('Time range for logs'),
      }),
      execute: async ({ logType, level, endpoint, limit, timeRange }) => {
        // Calculate time filter based on range
        const timeFilters: Record<string, string> = {
          '1h': "datetime('now', '-1 hour')",
          '6h': "datetime('now', '-6 hours')",
          '24h': "datetime('now', '-24 hours')",
          '7d': "datetime('now', '-7 days')",
          '30d': "datetime('now', '-30 days')",
        };

        const timeFilter = timeFilters[timeRange || '24h'];
        const maxLimit = Math.min(limit || 10, 50);

        let sql = '';
        let bindings: any[] = [];

        switch (logType) {
          case 'app':
            sql = `SELECT * FROM app_logs WHERE timestamp >= ${timeFilter}`;
            if (level) {
              sql += ' AND level = ?';
              bindings.push(level);
            }
            if (endpoint) {
              sql += ' AND endpoint LIKE ?';
              bindings.push(`%${endpoint}%`);
            }
            sql += ' ORDER BY timestamp DESC LIMIT ?';
            bindings.push(maxLimit);
            break;

          case 'api':
            sql = `SELECT * FROM api_logs WHERE timestamp >= ${timeFilter}`;
            if (endpoint) {
              sql += ' AND endpoint LIKE ?';
              bindings.push(`%${endpoint}%`);
            }
            sql += ' ORDER BY timestamp DESC LIMIT ?';
            bindings.push(maxLimit);
            break;

          case 'error':
            sql = `SELECT * FROM error_logs WHERE timestamp >= ${timeFilter}`;
            if (endpoint) {
              sql += ' AND endpoint LIKE ?';
              bindings.push(`%${endpoint}%`);
            }
            sql += ' ORDER BY timestamp DESC LIMIT ?';
            bindings.push(maxLimit);
            break;

          case 'ai':
            sql = `SELECT * FROM ai_logs WHERE timestamp >= ${timeFilter}`;
            sql += ' ORDER BY timestamp DESC LIMIT ?';
            bindings.push(maxLimit);
            break;

          case 'performance':
            sql = `SELECT * FROM performance_metrics WHERE timestamp >= ${timeFilter}`;
            if (endpoint) {
              sql += ' AND endpoint LIKE ?';
              bindings.push(`%${endpoint}%`);
            }
            sql += ' ORDER BY timestamp DESC LIMIT ?';
            bindings.push(maxLimit);
            break;
        }

        const { results } = await db.prepare(sql).bind(...bindings).all();
        return results;
      },
    }),

    examineTable: tool({
      description: 'Examine D1 database tables - get schema, row counts, and sample data. For security reasons, only predefined operations are allowed.',
      parameters: z.object({
        operation: z.enum(['list_tables', 'table_info', 'row_count', 'sample_data']).describe('Operation to perform'),
        tableName: z.string().optional().describe('Table name (required for table_info, row_count, sample_data)'),
        limit: z.number().optional().default(5).describe('Number of sample rows to return'),
      }),
      execute: async ({ operation, tableName, limit }) => {
        const maxLimit = Math.min(limit || 5, 20);

        // Whitelist of allowed table names to prevent SQL injection
        const allowedTables = [
          'venues', 'chats', 'messages', 'app_logs', 'api_logs',
          'error_logs', 'ai_logs', 'performance_metrics'
        ];

        // Validate table name if provided
        if (tableName && !allowedTables.includes(tableName)) {
          throw new Error(`Table '${tableName}' is not accessible. Allowed tables: ${allowedTables.join(', ')}`);
        }

        switch (operation) {
          case 'list_tables': {
            // Only return allowed tables
            return allowedTables.map(name => ({ name }));
          }

          case 'table_info': {
            if (!tableName) throw new Error('tableName required for table_info');
            // tableName is validated against whitelist above, safe to use
            const { results } = await db
              .prepare(`PRAGMA table_info(${tableName})`)
              .all();
            return results;
          }

          case 'row_count': {
            if (!tableName) throw new Error('tableName required for row_count');
            // tableName is validated against whitelist above, safe to use
            const { results } = await db
              .prepare(`SELECT COUNT(*) as count FROM ${tableName}`)
              .all();
            return results;
          }

          case 'sample_data': {
            if (!tableName) throw new Error('tableName required for sample_data');
            // tableName is validated against whitelist above, safe to use
            const { results } = await db
              .prepare(`SELECT * FROM ${tableName} LIMIT ?`)
              .bind(maxLimit)
              .all();
            return results;
          }

          default:
            throw new Error(`Unknown operation: ${operation}`);
        }
      },
    }),

    getSystemStats: tool({
      description: 'Get system statistics: error rates, API performance, AI usage, database health metrics',
      parameters: z.object({
        metric: z.enum(['error_rate', 'api_performance', 'ai_usage', 'database_stats', 'recent_errors']).describe('Metric to retrieve'),
        timeRange: z.enum(['1h', '6h', '24h', '7d']).optional().default('24h').describe('Time range'),
      }),
      execute: async ({ metric, timeRange }) => {
        const timeFilters: Record<string, string> = {
          '1h': "datetime('now', '-1 hour')",
          '6h': "datetime('now', '-6 hours')",
          '24h': "datetime('now', '-24 hours')",
          '7d': "datetime('now', '-7 days')",
        };

        const timeFilter = timeFilters[timeRange || '24h'];

        switch (metric) {
          case 'error_rate': {
            const { results } = await db
              .prepare(`
              SELECT
                COUNT(*) as total_errors,
                SUM(CASE WHEN resolved = 1 THEN 1 ELSE 0 END) as resolved_errors,
                error_type,
                COUNT(*) as count
              FROM error_logs
              WHERE timestamp >= ${timeFilter}
              GROUP BY error_type
              ORDER BY count DESC
            `)
              .all();
            return results;
          }

          case 'api_performance': {
            const { results } = await db
              .prepare(`
              SELECT
                endpoint,
                COUNT(*) as total_requests,
                AVG(duration_ms) as avg_duration,
                MAX(duration_ms) as max_duration,
                SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) as error_count
              FROM api_logs
              WHERE timestamp >= ${timeFilter}
              GROUP BY endpoint
              ORDER BY total_requests DESC
            `)
              .all();
            return results;
          }

          case 'ai_usage': {
            const { results } = await db
              .prepare(`
              SELECT
                model,
                provider,
                COUNT(*) as total_requests,
                SUM(total_tokens) as total_tokens,
                AVG(duration_ms) as avg_duration
              FROM ai_logs
              WHERE timestamp >= ${timeFilter}
              GROUP BY model, provider
              ORDER BY total_requests DESC
            `)
              .all();
            return results;
          }

          case 'database_stats': {
            const tables = ['venues', 'chats', 'messages', 'app_logs', 'api_logs', 'error_logs', 'ai_logs'];
            const stats = [];
            for (const table of tables) {
              const { results } = await db
                .prepare(`SELECT COUNT(*) as count FROM ${table}`)
                .all();
              stats.push({ table, count: results[0]?.count || 0 });
            }
            return stats;
          }

          case 'recent_errors': {
            const { results } = await db
              .prepare(`
              SELECT * FROM error_logs
              WHERE timestamp >= ${timeFilter}
              ORDER BY timestamp DESC
              LIMIT 10
            `)
              .all();
            return results;
          }

          default:
            throw new Error(`Unknown metric: ${metric}`);
        }
      },
    }),
  };
}

/**
 * POST /api/ai-chat - Streaming chat with tool calling
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      messages: Array<{ role: string; content: string }>;
      model?: string;
      chatId?: string;
      systemPrompt?: string;
    };
    const {
      messages,
      model = 'workers-ai-reasoning',
      chatId,
      systemPrompt,
    } = body;

    const env = (globalThis as any).env as Env;

    if (!env.DB) {
      return new Response('Database not configured', { status: 500 });
    }

    // Get model configuration
    const modelConfig = getModelConfig(model);

    // Get the appropriate AI model instance (now async)
    const aiModel = await getAIModel(modelConfig.provider, modelConfig.id, env);

    // Build messages array with system prompt
    const fullMessages = [
      { role: 'system' as const, content: systemPrompt || TOKYO_SYSTEM_PROMPT },
      ...messages,
    ];

    // Save user message to database if chatId provided
    const lastMessage = messages[messages.length - 1];
    if (chatId && lastMessage?.role === 'user') {
      await addMessage(env.DB, chatId, 'user', lastMessage.content);
    }

    // Handle Workers AI differently (doesn't support AI SDK streaming yet)
    if (modelConfig.provider === 'workers-ai') {
      // Use Workers AI binding directly
      const response = await env.AI.run(modelConfig.id, {
        messages: fullMessages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        stream: true,
      });

      // Convert Workers AI stream to standard format
      const stream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of response) {
              if (chunk.response) {
                controller.enqueue(new TextEncoder().encode(`0:${JSON.stringify(chunk.response)}\n`));
              }
            }
            controller.close();
          } catch (error) {
            controller.error(error);
          }
        },
      });

      // Save assistant response
      if (chatId) {
        // Collect full response for saving
        let fullResponse = '';
        const reader = stream.getReader();
        const saveStream = new ReadableStream({
          async start(controller) {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              const text = new TextDecoder().decode(value);
              fullResponse += text;
              controller.enqueue(value);
            }
            // Save to database
            await addMessage(env.DB, chatId, 'assistant', fullResponse, model);
            controller.close();
          },
        });

        return new StreamingTextResponse(saveStream);
      }

      return new StreamingTextResponse(stream);
    }

    // For OpenAI and Gemini, use AI SDK with tool support
    // NOTE: Admin-only tools (queryLogs, examineTable, getSystemStats) are excluded
    // from public chat for security. These should only be available in admin contexts.
    const tools = createTools(env.DB);
    const result = await streamText({
      model: aiModel,
      messages: fullMessages,
      tools: {
        getWeather: tools.getWeather,
        getSubwayRoute: tools.getSubwayRoute,
        searchVenues: tools.searchVenues,
      },
      maxTokens: modelConfig.maxTokens,
      temperature: 0.7,
      onFinish: async ({ text }) => {
        // Save assistant response to database
        if (chatId && text) {
          await addMessage(env.DB, chatId, 'assistant', text, model);
        }
      },
    });

    return result.toAIStreamResponse();
  } catch (error) {
    console.error('AI Chat error:', error);
    return new Response(
      JSON.stringify({
        error: 'AI chat failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * GET /api/ai-chat - Get chat history
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');

    if (!chatId) {
      return new Response('Chat ID required', { status: 400 });
    }

    const env = (globalThis as any).env as Env;

    if (!env.DB) {
      return new Response('Database not configured', { status: 500 });
    }

    const messages = await getMessages(env.DB, chatId);

    return new Response(JSON.stringify({ messages }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Get chat error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to get chat',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
