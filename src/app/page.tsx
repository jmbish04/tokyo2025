'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  venues?: Venue[];
}

interface Venue {
  id: number;
  name: string;
  category: string;
  district: string;
  description: string;
  map_url: string;
  rating: number;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Welcome to Tokyo 2025! I\'m your AI travel companion. Ask me about food markets, luxury shopping, hidden spots, or anything Tokyo-related!',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json() as { response: string; venues?: any[] };
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        venues: data.venues,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json() as { url?: string };
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Image uploaded successfully! URL: ${data.url}`,
        },
      ]);
    } catch (error) {
      console.error('Upload error:', error);
    }
  };

  return (
    <div className="container">
      <header className="header">
        <h1>Tokyo 2025 Travel Companion</h1>
        <p>Discover the best of Tokyo with AI-powered recommendations</p>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link
            href="/chat"
            style={{
              display: 'inline-block',
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, var(--accent), var(--accent-hover))',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '700',
              boxShadow: '0 4px 12px rgba(255, 64, 129, 0.3)',
              transition: 'transform 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            🤖 Advanced AI Chat (Multi-Model)
          </Link>
          <Link
            href="/seed"
            style={{
              display: 'inline-block',
              padding: '0.75rem 1.5rem',
              background: 'var(--bg-tertiary)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontWeight: '600',
              border: '1px solid var(--border)',
              transition: 'transform 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.background = 'var(--accent)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.background = 'var(--bg-tertiary)';
            }}
          >
            🌱 Manage Venues
          </Link>
          <Link
            href="/logs"
            style={{
              display: 'inline-block',
              padding: '0.75rem 1.5rem',
              background: 'var(--bg-tertiary)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontWeight: '600',
              border: '1px solid var(--border)',
              transition: 'transform 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.background = 'var(--accent)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.background = 'var(--bg-tertiary)';
            }}
          >
            📊 System Logs & Monitoring
          </Link>
        </div>
      </header>

      <div className="chat-container">
        {messages.map((msg, idx) => (
          <div key={idx}>
            <div className={`message ${msg.role}`}>
              {msg.content}
            </div>
            {msg.venues && msg.venues.length > 0 && (
              <div>
                {msg.venues.map((venue) => (
                  <div key={venue.id} className="venue-card">
                    <h3>{venue.name}</h3>
                    <span className="category">{venue.category}</span>
                    <div className="district">{venue.district}</div>
                    <p>{venue.description}</p>
                    <div className="rating">⭐ {venue.rating}/5.0</div>
                    <a href={venue.map_url} target="_blank" rel="noopener noreferrer">
                      View on Map
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="input-container">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about Tokyo restaurants, shopping, nightlife..."
          disabled={loading}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Sending...' : 'Send'}
        </button>
      </form>

      <div className="file-upload">
        <label htmlFor="file-input">
          Upload a photo for AI analysis
          <input
            id="file-input"
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
          />
        </label>
      </div>
    </div>
  );
}
