import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

interface Env {
  MEMORY: KVNamespace;
  DB: D1Database;
}

interface MemoryEntry {
  message: string;
  response: string;
  venues?: number[];
  timestamp: string;
}

// GET - Retrieve recent chat history
export async function GET(request: NextRequest) {
  try {
    const env = process.env as unknown as Env;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    // Get recent entries from D1
    const { results } = await env.DB.prepare(
      'SELECT query, response, image_url, created_at FROM logs ORDER BY created_at DESC LIMIT ?'
    ).bind(limit).all();

    return NextResponse.json({
      history: results,
      count: results.length,
    });

  } catch (error) {
    console.error('Memory retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve memory', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST - Store a memory entry
export async function POST(request: NextRequest) {
  try {
    const { message, response, venues } = await request.json();

    if (!message || !response) {
      return NextResponse.json(
        { error: 'Message and response are required' },
        { status: 400 }
      );
    }

    const env = process.env as unknown as Env;

    // Store in KV for quick access
    const memoryKey = `chat:${Date.now()}`;
    const memoryEntry: MemoryEntry = {
      message,
      response,
      venues,
      timestamp: new Date().toISOString(),
    };

    await env.MEMORY.put(memoryKey, JSON.stringify(memoryEntry), {
      expirationTtl: 86400, // 24 hours
    });

    // Also log to D1 for long-term storage
    await env.DB.prepare(
      'INSERT INTO logs (user_id, query, response) VALUES (?, ?, ?)'
    ).bind('anonymous', message, response).run();

    return NextResponse.json({
      success: true,
      key: memoryKey,
    });

  } catch (error) {
    console.error('Memory storage error:', error);
    return NextResponse.json(
      { error: 'Failed to store memory', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE - Clear memory
export async function DELETE(request: NextRequest) {
  try {
    const env = process.env as unknown as Env;
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (key) {
      // Delete specific key
      await env.MEMORY.delete(key);
    } else {
      // Note: KV doesn't have a "delete all" operation
      // In production, you'd list and delete keys with a prefix
      return NextResponse.json({
        message: 'Provide a key parameter to delete a specific memory',
      });
    }

    return NextResponse.json({
      success: true,
      deleted: key,
    });

  } catch (error) {
    console.error('Memory deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete memory', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
