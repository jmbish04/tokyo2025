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
  OPENAI_API_KEY?: string;
  GOOGLE_API_KEY?: string;
}

/**
 * Tool definitions for generative UI
 */
const tools = {
  getWeather: tool({
    description: 'Get current weather information for a location in Tokyo or Osaka',
    parameters: z.object({
      location: z.string().describe('The location name (e.g., Tokyo, Ginza, Osaka)'),
    }),
    execute: async ({ location }) => {
      // Fetch weather data
      const response = await fetch(`https://wttr.in/${encodeURIComponent(location)}?format=j1`);
      const data = await response.json();

      return {
        location,
        temperature: parseInt(data.current_condition[0].temp_C),
        condition: data.current_condition[0].weatherDesc[0].value,
        humidity: parseInt(data.current_condition[0].humidity),
        windSpeed: parseInt(data.current_condition[0].windspeedKmph),
        forecast: data.weather[0]?.hourly[0]?.weatherDesc[0]?.value || 'No forecast available',
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
    execute: async ({ query, limit }, { DB }: { DB: D1Database }) => {
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

      const { results } = await (DB as D1Database).prepare(sql)
        .bind(lowerQuery, lowerQuery, lowerQuery, lowerQuery, limit)
        .all();

      return results;
    },
  }),
};

/**
 * POST /api/ai-chat - Streaming chat with tool calling
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      messages,
      model = 'workers-ai-reasoning',
      chatId,
      systemPrompt,
    } = body;

    const env = process.env as unknown as Env;

    if (!env.DB) {
      return new Response('Database not configured', { status: 500 });
    }

    // Get model configuration
    const modelConfig = getModelConfig(model);

    // Get the appropriate AI model instance
    const aiModel = getAIModel(modelConfig.provider, modelConfig.id, env);

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
    const result = await streamText({
      model: aiModel,
      messages: fullMessages,
      tools: {
        getWeather: tools.getWeather,
        getSubwayRoute: tools.getSubwayRoute,
        searchVenues: {
          ...tools.searchVenues,
          execute: async (params) => tools.searchVenues.execute(params, { DB: env.DB }),
        },
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

    const env = process.env as unknown as Env;

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
