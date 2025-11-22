import { NextRequest, NextResponse } from 'next/server';
import { getEnv } from '@/lib/cloudflare';

export const runtime = 'edge';

interface Venue {
  id: number;
  name: string;
  category: string;
  district: string;
  description: string;
  map_url: string;
  rating: number;
}

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json() as { message: string };

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Get Cloudflare bindings
    const env = getEnv();

    // Query D1 for relevant venues based on the message
    let venues: Venue[] = [];

    try {
      // Search for venues matching keywords in the message
      const lowerMessage = message.toLowerCase();
      let query = 'SELECT * FROM venues WHERE 1=1';

      // Add filters based on common keywords
      if (lowerMessage.includes('food') || lowerMessage.includes('market') || lowerMessage.includes('seafood')) {
        query += " AND (category LIKE '%Market%' OR category LIKE '%Food%' OR category LIKE '%Seafood%')";
      }
      if (lowerMessage.includes('shopping') || lowerMessage.includes('luxury')) {
        query += " AND (category LIKE '%Shopping%' OR category LIKE '%Luxury%')";
      }
      if (lowerMessage.includes('bar') || lowerMessage.includes('nightlife') || lowerMessage.includes('drink')) {
        query += " AND (category LIKE '%Bar%' OR category LIKE '%Nightlife%')";
      }

      query += ' LIMIT 3';

      const { results } = await env.DB.prepare(query).all();
      venues = results as unknown as Venue[];
    } catch (dbError) {
      console.error('Database query error:', dbError);
      // Continue without venues if DB fails
    }

    // Build context from venues
    let venueContext = '';
    if (venues.length > 0) {
      venueContext = '\n\nRelevant Tokyo venues:\n' +
        venues.map(v => `- ${v.name} (${v.category}) in ${v.district}: ${v.description} (Rating: ${v.rating}/5)`).join('\n');
    }

    // Prepare AI prompt with context
    const systemPrompt = `You are a knowledgeable Tokyo travel assistant for 2025.
You help travelers discover the best food markets, luxury shopping, hidden bars, and cultural experiences in Tokyo.
Be friendly, concise, and provide specific recommendations when possible.${venueContext}`;

    const fullPrompt = `${systemPrompt}\n\nUser: ${message}\n\nAssistant:`;

    // Call Cloudflare AI
    let aiResponse = '';
    try {
      const aiResult = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
        prompt: fullPrompt,
        max_tokens: 512,
      });

      aiResponse = aiResult.response || 'I can help you explore Tokyo! What are you interested in?';
    } catch (aiError) {
      console.error('AI error:', aiError);
      aiResponse = `Based on your interest in Tokyo, I'd recommend checking out these great spots! ${venues.length > 0 ? 'See the venue cards below for details.' : 'Ask me about food markets, shopping, or nightlife!'}`;
    }

    // Log interaction to D1
    try {
      await env.DB.prepare(
        'INSERT INTO logs (user_id, query, response) VALUES (?, ?, ?)'
      ).bind('anonymous', message, aiResponse).run();
    } catch (logError) {
      console.error('Logging error:', logError);
      // Continue even if logging fails
    }

    // Store in KV for short-term memory
    try {
      const memoryKey = `chat:${Date.now()}`;
      await env.MEMORY.put(memoryKey, JSON.stringify({
        message,
        response: aiResponse,
        venues: venues.map(v => v.id),
        timestamp: new Date().toISOString(),
      }), {
        expirationTtl: 86400, // 24 hours
      });
    } catch (kvError) {
      console.error('KV error:', kvError);
      // Continue even if KV fails
    }

    return NextResponse.json({
      response: aiResponse,
      venues: venues,
    });

  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
