import { nanoid } from 'nanoid';

interface Env {
  DB: D1Database;
}

export interface Chat {
  id: string;
  user_id: string;
  title: string;
  model: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  chat_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  model?: string;
  created_at: string;
}

/**
 * Create a new chat conversation
 */
export async function createChat(db: D1Database, title: string, model: string = 'workers-ai-reasoning', userId: string = 'anonymous'): Promise<Chat> {
  const id = nanoid();
  const now = new Date().toISOString();

  await db.prepare(
    'INSERT INTO chats (id, user_id, title, model, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(id, userId, title, model, now, now).run();

  return {
    id,
    user_id: userId,
    title,
    model,
    created_at: now,
    updated_at: now,
  };
}

/**
 * Get all chats for a user
 */
export async function getChats(db: D1Database, userId: string = 'anonymous', limit: number = 50): Promise<Chat[]> {
  const { results } = await db.prepare(
    'SELECT * FROM chats WHERE user_id = ? ORDER BY updated_at DESC LIMIT ?'
  ).bind(userId, limit).all();

  return results as unknown as Chat[];
}

/**
 * Get a specific chat
 */
export async function getChat(db: D1Database, chatId: string): Promise<Chat | null> {
  const chat = await db.prepare(
    'SELECT * FROM chats WHERE id = ?'
  ).bind(chatId).first();

  return chat as Chat | null;
}

/**
 * Update chat metadata
 */
export async function updateChat(db: D1Database, chatId: string, updates: Partial<Pick<Chat, 'title' | 'model'>>): Promise<void> {
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.title !== undefined) {
    fields.push('title = ?');
    values.push(updates.title);
  }

  if (updates.model !== undefined) {
    fields.push('model = ?');
    values.push(updates.model);
  }

  fields.push('updated_at = ?');
  values.push(new Date().toISOString());

  values.push(chatId);

  await db.prepare(
    `UPDATE chats SET ${fields.join(', ')} WHERE id = ?`
  ).bind(...values).run();
}

/**
 * Delete a chat and all its messages
 */
export async function deleteChat(db: D1Database, chatId: string): Promise<void> {
  await db.prepare('DELETE FROM chats WHERE id = ?').bind(chatId).run();
}

/**
 * Add a message to a chat
 */
export async function addMessage(
  db: D1Database,
  chatId: string,
  role: 'user' | 'assistant' | 'system',
  content: string,
  model?: string
): Promise<Message> {
  const id = nanoid();
  const now = new Date().toISOString();

  await db.prepare(
    'INSERT INTO messages (id, chat_id, role, content, model, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(id, chatId, role, content, model || null, now).run();

  // Update chat's updated_at timestamp
  await db.prepare(
    'UPDATE chats SET updated_at = ? WHERE id = ?'
  ).bind(now, chatId).run();

  return {
    id,
    chat_id: chatId,
    role,
    content,
    model,
    created_at: now,
  };
}

/**
 * Get all messages for a chat
 */
export async function getMessages(db: D1Database, chatId: string): Promise<Message[]> {
  const { results } = await db.prepare(
    'SELECT * FROM messages WHERE chat_id = ? ORDER BY created_at ASC'
  ).bind(chatId).all();

  return results as unknown as Message[];
}

/**
 * Delete a specific message
 */
export async function deleteMessage(db: D1Database, messageId: string): Promise<void> {
  await db.prepare('DELETE FROM messages WHERE id = ?').bind(messageId).run();
}

/**
 * Get recent chats with message count
 */
export async function getChatsWithMessageCount(db: D1Database, userId: string = 'anonymous', limit: number = 50): Promise<(Chat & { message_count: number })[]> {
  const { results } = await db.prepare(`
    SELECT
      c.*,
      COUNT(m.id) as message_count
    FROM chats c
    LEFT JOIN messages m ON c.id = m.chat_id
    WHERE c.user_id = ?
    GROUP BY c.id
    ORDER BY c.updated_at DESC
    LIMIT ?
  `).bind(userId, limit).all();

  return results as unknown as (Chat & { message_count: number })[];
}
