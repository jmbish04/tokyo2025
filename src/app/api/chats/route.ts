import { NextRequest, NextResponse } from 'next/server';
import {
  createChat,
  getChats,
  getChat,
  updateChat,
  deleteChat,
  getChatsWithMessageCount,
} from '@/lib/chat-history';

export const runtime = 'edge';

interface Env {
  DB: D1Database;
}

/**
 * GET /api/chats - List all chats
 *
 * SECURITY WARNING: This endpoint currently lacks proper authentication.
 * Before production use, implement user authentication and ensure users can only
 * access their own chats. Currently defaults to userId='anonymous'.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'anonymous';
    const limit = parseInt(searchParams.get('limit') || '50');
    const withCount = searchParams.get('withCount') === 'true';

    const env = (globalThis as any).env as Env;

    if (!env.DB) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const chats = withCount
      ? await getChatsWithMessageCount(env.DB, userId, limit)
      : await getChats(env.DB, userId, limit);

    return NextResponse.json({ chats });
  } catch (error) {
    console.error('Get chats error:', error);
    return NextResponse.json(
      { error: 'Failed to get chats', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/chats - Create a new chat
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      title: string;
      model?: string;
      userId?: string;
    };
    const { title, model = 'workers-ai-reasoning', userId = 'anonymous' } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const env = (globalThis as any).env as Env;

    if (!env.DB) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const chat = await createChat(env.DB, title, model, userId);

    return NextResponse.json({ chat });
  } catch (error) {
    console.error('Create chat error:', error);
    return NextResponse.json(
      { error: 'Failed to create chat', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/chats - Update a chat
 *
 * SECURITY WARNING: This endpoint currently lacks proper authentication.
 * It verifies userId ownership but defaults to 'anonymous'.
 * Before production use, implement proper user authentication.
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      chatId: string;
      title?: string;
      model?: string;
      userId?: string;
    };
    const { chatId, title, model, userId = 'anonymous' } = body;

    if (!chatId) {
      return NextResponse.json({ error: 'Chat ID is required' }, { status: 400 });
    }

    const env = (globalThis as any).env as Env;

    if (!env.DB) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    // Verify ownership: check that the chat belongs to the requesting user
    const chat = await env.DB.prepare('SELECT user_id FROM chats WHERE id = ?')
      .bind(chatId)
      .first();

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    if (chat.user_id !== userId) {
      return NextResponse.json(
        { error: 'Forbidden - You can only modify your own chats' },
        { status: 403 }
      );
    }

    await updateChat(env.DB, chatId, { title, model });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update chat error:', error);
    return NextResponse.json(
      { error: 'Failed to update chat', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/chats - Delete a chat
 *
 * SECURITY WARNING: This endpoint currently lacks proper authentication.
 * It verifies userId ownership but defaults to 'anonymous'.
 * Before production use, implement proper user authentication.
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');
    const userId = searchParams.get('userId') || 'anonymous';

    if (!chatId) {
      return NextResponse.json({ error: 'Chat ID is required' }, { status: 400 });
    }

    const env = (globalThis as any).env as Env;

    if (!env.DB) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    // Verify ownership: check that the chat belongs to the requesting user
    const chat = await env.DB.prepare('SELECT user_id FROM chats WHERE id = ?')
      .bind(chatId)
      .first();

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    if (chat.user_id !== userId) {
      return NextResponse.json(
        { error: 'Forbidden - You can only delete your own chats' },
        { status: 403 }
      );
    }

    await deleteChat(env.DB, chatId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete chat error:', error);
    return NextResponse.json(
      { error: 'Failed to delete chat', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
