'use client';

import { useState, useEffect, useRef } from 'react';
import { useChat } from '@ai-sdk/react';
import Link from 'next/link';
import { getAllModels, getModelConfig, type ModelConfig, AI_MODELS } from '@/lib/ai-config';
import { WeatherCard } from '@/components/generative/weather-card';
import { SubwayMap } from '@/components/generative/subway-map';
import { AttractionCard } from '@/components/generative/attraction-card';
import { ImageUpload } from '@/components/image-upload';
import { format } from 'date-fns';

interface Chat {
  id: string;
  title: string;
  model: string;
  created_at: string;
  updated_at: string;
  message_count?: number;
}

export default function ChatPage() {
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedModel, setSelectedModel] = useState('workers-ai-reasoning');
  const [showSidebar, setShowSidebar] = useState(true);
  const [loadingChats, setLoadingChats] = useState(true);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading, reload, stop } = useChat({
    api: '/api/ai-chat',
    body: {
      chatId: currentChatId,
      model: selectedModel,
    },
    onFinish: () => {
      // Refresh chat list to update timestamps
      loadChats();
    },
  });

  // Load chats on mount
  useEffect(() => {
    loadChats();
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadChats = async () => {
    setLoadingChats(true);
    try {
      const response = await fetch('/api/chats?withCount=true');
      const data = await response.json() as { chats?: any[] };
      setChats(data.chats || []);
    } catch (error) {
      console.error('Failed to load chats:', error);
    } finally {
      setLoadingChats(false);
    }
  };

  const createNewChat = async () => {
    const title = `New Chat ${new Date().toLocaleString()}`;
    try {
      const response = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, model: selectedModel }),
      });
      const data = await response.json() as { chat: { id: string } };
      setCurrentChatId(data.chat.id);
      await loadChats();
    } catch (error) {
      console.error('Failed to create chat:', error);
    }
  };

  const deleteChat = async (chatId: string) => {
    if (!confirm('Delete this conversation?')) return;

    try {
      await fetch(`/api/chats?chatId=${chatId}`, { method: 'DELETE' });
      if (currentChatId === chatId) {
        setCurrentChatId(null);
      }
      await loadChats();
    } catch (error) {
      console.error('Failed to delete chat:', error);
    }
  };

  const loadChat = async (chatId: string) => {
    setCurrentChatId(chatId);
    // Messages will be loaded automatically by useChat
  };

  const handleImageAnalysis = (imageUrl: string, imageId: string, analysis?: string) => {
    // Create a message with the image analysis
    if (analysis) {
      const imageMessage = `[Image uploaded: ${imageUrl}]\n\nAI Analysis:\n${analysis}`;
      handleInputChange({ target: { value: imageMessage } } as any);
    }
    setShowImageUpload(false);
  };

  const models = getAllModels();
  
  // Create a reverse lookup map for efficient model key finding
  const modelIdToKey = Object.fromEntries(
    Object.entries(AI_MODELS).map(([key, model]) => [model.id, key])
  );

  // Render generative UI components based on tool calls
  const renderMessage = (content: string) => {
    // Simple parsing of tool calls in the content
    // In production, you'd parse structured data from AI SDK
    return content;
  };

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
    }}>
      {/* Sidebar */}
      {showSidebar && (
        <div style={{
          width: '300px',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-secondary)',
        }}>
          {/* Sidebar Header */}
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
            <Link href="/" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '0.875rem', display: 'block', marginBottom: '1rem' }}>
              ← Back to Home
            </Link>
            <button
              onClick={createNewChat}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'var(--accent)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              ➕ New Chat
            </button>
          </div>

          {/* Chat List */}
          <div style={{ flex: 1, overflow: 'auto', padding: '0.5rem' }}>
            {loadingChats && (
              <div className="loading" style={{ padding: '2rem 0' }}>
                <div className="spinner"></div>
              </div>
            )}

            {!loadingChats && chats.length === 0 && (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                No conversations yet. Start a new chat!
              </div>
            )}

            {chats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => loadChat(chat.id)}
                style={{
                  padding: '0.75rem',
                  marginBottom: '0.5rem',
                  background: currentChatId === chat.id ? 'var(--bg-tertiary)' : 'transparent',
                  border: `1px solid ${currentChatId === chat.id ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  if (currentChatId !== chat.id) {
                    e.currentTarget.style.background = 'var(--bg-tertiary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentChatId !== chat.id) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <div style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem', paddingRight: '1.5rem' }}>
                  {chat.title}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {chat.message_count} messages · {format(new Date(chat.updated_at), 'MMM d')}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteChat(chat.id);
                  }}
                  style={{
                    position: 'absolute',
                    top: '0.5rem',
                    right: '0.5rem',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    padding: '0.25rem',
                  }}
                  title="Delete chat"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Top Bar */}
        <div style={{
          padding: '1rem',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          background: 'var(--bg-secondary)',
        }}>
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            style={{
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              padding: '0.5rem',
              cursor: 'pointer',
              fontSize: '1.2rem',
            }}
            title={showSidebar ? 'Hide sidebar' : 'Show sidebar'}
          >
            {showSidebar ? '⬅️' : '➡️'}
          </button>

          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: '1.25rem' }}>🤖 Tokyo AI Assistant</h1>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Powered by {getModelConfig(selectedModel).name}
            </p>
          </div>

          {/* Model Selector */}
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            style={{
              padding: '0.5rem 1rem',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            <optgroup label="🚀 Workers AI (Default - Free)">
              {models.filter(m => m.provider === 'workers-ai').map(m => (
                <option key={m.id} value={modelIdToKey[m.id]}>
                  {m.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="🔵 OpenAI">
              {models.filter(m => m.provider === 'openai').map(m => (
                <option key={m.id} value={modelIdToKey[m.id]}>
                  {m.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="🔴 Google Gemini">
              {models.filter(m => m.provider === 'gemini').map(m => (
                <option key={m.id} value={modelIdToKey[m.id]}>
                  {m.name}
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* Messages Area */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '1.5rem',
        }}>
          {messages.length === 0 && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              textAlign: 'center',
              color: 'var(--text-secondary)',
            }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🗼</div>
              <h2 style={{ margin: '0 0 0.5rem 0' }}>Welcome to Tokyo AI Assistant!</h2>
              <p style={{ maxWidth: '500px', lineHeight: 1.6 }}>
                Ask me about Tokyo attractions, restaurants, transportation, weather, or anything else!
                I can provide real-time information with interactive cards.
              </p>
              <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <button onClick={() => handleInputChange({ target: { value: "What's the weather in Tokyo today?" } } as any)} style={{ padding: '0.5rem 1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer' }}>
                  ☀️ Weather
                </button>
                <button onClick={() => handleInputChange({ target: { value: "How do I get from Shibuya to Ginza?" } } as any)} style={{ padding: '0.5rem 1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer' }}>
                  🚇 Subway
                </button>
                <button onClick={() => handleInputChange({ target: { value: "Best sushi restaurants in Tokyo?" } } as any)} style={{ padding: '0.5rem 1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer' }}>
                  🍣 Restaurants
                </button>
              </div>
            </div>
          )}

          {messages.map((message, idx) => (
            <div
              key={idx}
              style={{
                marginBottom: '1.5rem',
                display: 'flex',
                gap: '1rem',
                alignItems: 'flex-start',
              }}
            >
              {/* Avatar */}
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: message.role === 'user' ? 'var(--accent)' : 'var(--bg-tertiary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
                flexShrink: 0,
              }}>
                {message.role === 'user' ? '👤' : '🤖'}
              </div>

              {/* Message Content */}
              <div style={{ flex: 1 }}>
                <div style={{
                  background: message.role === 'user' ? 'var(--bg-secondary)' : 'transparent',
                  padding: message.role === 'user' ? '1rem' : '0',
                  borderRadius: '12px',
                  border: message.role === 'user' ? '1px solid var(--border)' : 'none',
                }}>
                  <div style={{
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.6,
                    fontSize: '0.9375rem',
                  }}>
                    {message.content}
                  </div>
                </div>

                {/* Tool results would be rendered here in production */}
              </div>
            </div>
          ))}

          {isLoading && (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'var(--bg-tertiary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
              }}>
                🤖
              </div>
              <div className="loading">
                <div className="spinner"></div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!currentChatId) {
              createNewChat().then(() => handleSubmit(e));
            } else {
              handleSubmit(e);
            }
          }}
          style={{
            padding: '1rem',
            borderTop: '1px solid var(--border)',
            background: 'var(--bg-secondary)',
          }}
        >
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setShowImageUpload(!showImageUpload)}
                style={{
                  padding: '0.5rem 1rem',
                  background: showImageUpload ? 'var(--accent)' : 'var(--bg-tertiary)',
                  color: showImageUpload ? 'white' : 'var(--text-primary)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                }}
              >
                📸 {showImageUpload ? 'Hide' : 'Upload Image'}
              </button>
            </div>

            {showImageUpload && (
              <div style={{ marginBottom: '1rem' }}>
                <ImageUpload
                  onImageUploaded={handleImageAnalysis}
                  showAnalysis={true}
                  analysisModel={selectedModel.startsWith('gemini') ? 'gemini-1.5-pro' : 'gpt-4-turbo'}
                  analysisPrompt="Analyze this image in the context of Tokyo travel. What do you see? Is this a restaurant, attraction, or specific location? Provide helpful details for a traveler."
                />
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
              <textarea
                value={input}
                onChange={handleInputChange}
                placeholder="Ask me anything about Tokyo..."
                rows={3}
                style={{
                  flex: 1,
                  padding: '1rem',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  color: 'var(--text-primary)',
                  fontSize: '0.9375rem',
                  resize: 'none',
                  outline: 'none',
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    e.currentTarget.form?.requestSubmit();
                  }
                }}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                style={{
                  padding: '1rem 2rem',
                  background: isLoading || !input.trim() ? 'var(--border)' : 'var(--accent)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: 'bold',
                  cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
                  fontSize: '0.9375rem',
                }}
              >
                {isLoading ? 'Thinking...' : 'Send'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
