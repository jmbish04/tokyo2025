'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface SeedStatus {
  status: string;
  configured: {
    database: boolean;
    apiKey: boolean;
  };
  currentVenues: number;
  instructions: any;
  note: string;
}

interface SeedResult {
  success: boolean;
  message: string;
  results: {
    ginza: number;
    osaka: number;
    total: number;
  };
  stats: {
    total: number;
    byCategory: Array<{ category: string; count: number }>;
    byDistrict: Array<{ district: string; count: number }>;
  };
  duration: string;
  errors?: string[];
}

export default function SeedPage() {
  const [status, setStatus] = useState<SeedStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [result, setResult] = useState<SeedResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [selectedAreas, setSelectedAreas] = useState({
    ginza: true,
    osaka: true,
  });
  const [apiKey, setApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/seed');
      const data = await response.json();
      setStatus(data);
      setShowApiKeyInput(!data.configured.apiKey);
    } catch (err) {
      setError('Failed to fetch status');
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    setError(null);
    setResult(null);

    const areas = [];
    if (selectedAreas.ginza) areas.push('ginza');
    if (selectedAreas.osaka) areas.push('osaka');

    if (areas.length === 0) {
      setError('Please select at least one area to seed');
      setSeeding(false);
      return;
    }

    try {
      const body: any = { areas };
      if (apiKey) {
        body.apiKey = apiKey;
      }

      const response = await fetch('/api/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
        // Refresh status to show new venue count
        setTimeout(fetchStatus, 1000);
      } else {
        setError(data.error || 'Seeding failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="container">
      <header className="header">
        <h1>🌱 Venue Seeding</h1>
        <p>Populate your database with real Ginza & Osaka venues</p>
        <Link href="/" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '0.9rem' }}>
          ← Back to Chat
        </Link>
      </header>

      {/* Status Section */}
      <div className="venue-card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>System Status</h2>
        {loading && <div className="loading"><div className="spinner"></div></div>}
        {status && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Database</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: status.configured.database ? 'var(--success)' : 'var(--accent)' }}>
                  {status.configured.database ? '✅ Connected' : '❌ Not configured'}
                </div>
              </div>
              <div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>API Key</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: status.configured.apiKey ? 'var(--success)' : '#ff9800' }}>
                  {status.configured.apiKey ? '✅ Configured' : '⚠️ Not set'}
                </div>
              </div>
              <div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Current Venues</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--accent)' }}>
                  {status.currentVenues}
                </div>
              </div>
            </div>
            {!status.configured.apiKey && (
              <div style={{ background: '#ff9800', color: 'white', padding: '0.75rem', borderRadius: '4px', fontSize: '0.875rem' }}>
                💡 API key not configured. You can enter it below or set it as a secret.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Seeding Controls */}
      <div className="venue-card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>Seed Configuration</h2>

        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Select Areas</h3>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.75rem', background: selectedAreas.ginza ? 'var(--bg-tertiary)' : 'var(--bg-secondary)', borderRadius: '8px', border: `2px solid ${selectedAreas.ginza ? 'var(--accent)' : 'var(--border)'}`, minWidth: '200px' }}>
              <input
                type="checkbox"
                checked={selectedAreas.ginza}
                onChange={(e) => setSelectedAreas({ ...selectedAreas, ginza: e.target.checked })}
                style={{ width: '18px', height: '18px' }}
              />
              <div>
                <div style={{ fontWeight: 'bold' }}>🛍️ Ginza</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Luxury shopping district</div>
              </div>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.75rem', background: selectedAreas.osaka ? 'var(--bg-tertiary)' : 'var(--bg-secondary)', borderRadius: '8px', border: `2px solid ${selectedAreas.osaka ? 'var(--accent)' : 'var(--border)'}`, minWidth: '200px' }}>
              <input
                type="checkbox"
                checked={selectedAreas.osaka}
                onChange={(e) => setSelectedAreas({ ...selectedAreas, osaka: e.target.checked })}
                style={{ width: '18px', height: '18px' }}
              />
              <div>
                <div style={{ fontWeight: 'bold' }}>🍜 Osaka</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Street food & entertainment</div>
              </div>
            </label>
          </div>
        </div>

        {(showApiKeyInput || !status?.configured.apiKey) && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>
              Google Places API Key
              {status?.configured.apiKey && (
                <button
                  onClick={() => setShowApiKeyInput(!showApiKeyInput)}
                  style={{ marginLeft: '1rem', fontSize: '0.75rem', background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: '1px solid var(--border)', padding: '0.25rem 0.75rem', borderRadius: '4px', cursor: 'pointer' }}
                >
                  {showApiKeyInput ? 'Hide' : 'Override'}
                </button>
              )}
            </h3>
            {showApiKeyInput && (
              <>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIzaSyC_your_api_key_here (optional if secret is set)"
                  style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '0.875rem' }}
                />
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                  💡 Get your API key from <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>Google Cloud Console</a>
                </div>
              </>
            )}
          </div>
        )}

        <button
          onClick={handleSeed}
          disabled={seeding || (!status?.configured.apiKey && !apiKey)}
          style={{
            width: '100%',
            padding: '1rem 2rem',
            background: seeding ? 'var(--border)' : 'var(--accent)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            cursor: seeding ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s',
          }}
        >
          {seeding ? '🌱 Seeding in progress...' : '🚀 Start Seeding'}
        </button>

        {seeding && (
          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <div className="loading"><div className="spinner"></div></div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
              Fetching venue data from Google Places API...<br />
              This usually takes 15-30 seconds.
            </p>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="error" style={{ marginBottom: '2rem' }}>
          ❌ {error}
        </div>
      )}

      {/* Results Display */}
      {result && (
        <div className="venue-card" style={{ marginBottom: '2rem', border: '2px solid var(--success)' }}>
          <h2 style={{ marginBottom: '1rem', color: 'var(--success)' }}>✅ Seeding Complete!</h2>

          <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              {result.message}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
              <div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Ginza Venues</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent)' }}>{result.results.ginza}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Osaka Venues</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent)' }}>{result.results.osaka}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Total Added</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--success)' }}>{result.results.total}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Duration</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{result.duration}</div>
              </div>
            </div>
          </div>

          {result.stats && (
            <>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', marginTop: '1.5rem' }}>📊 Database Statistics</h3>
              <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                  Total Venues in Database: {result.stats.total}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px' }}>
                  <h4 style={{ fontSize: '0.875rem', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>By Category</h4>
                  {result.stats.byCategory.slice(0, 5).map((cat, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                      <span>{cat.category}</span>
                      <span style={{ fontWeight: 'bold', color: 'var(--accent)' }}>{cat.count}</span>
                    </div>
                  ))}
                </div>

                <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px' }}>
                  <h4 style={{ fontSize: '0.875rem', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>By District</h4>
                  {result.stats.byDistrict.slice(0, 5).map((dist, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                      <span>{dist.district}</span>
                      <span style={{ fontWeight: 'bold', color: 'var(--accent)' }}>{dist.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <Link href="/" style={{ display: 'inline-block', padding: '0.75rem 2rem', background: 'var(--accent)', color: 'white', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold' }}>
              💬 Try the Chat Assistant
            </Link>
          </div>
        </div>
      )}

      {/* Instructions */}
      {!result && (
        <div className="venue-card" style={{ background: 'var(--bg-secondary)' }}>
          <h2 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>ℹ️ How It Works</h2>
          <ol style={{ paddingLeft: '1.5rem', lineHeight: '1.8' }}>
            <li>Select which areas you want to seed (Ginza, Osaka, or both)</li>
            <li>Enter your Google Places API key (if not already set as a secret)</li>
            <li>Click "Start Seeding" and wait 15-30 seconds</li>
            <li>The system will fetch 10-15 real venues per area from Google Places</li>
            <li>Each venue includes ratings, descriptions, and map links</li>
            <li>Your AI chat assistant will immediately have access to this data!</li>
          </ol>

          <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--bg-tertiary)', borderRadius: '4px', fontSize: '0.875rem' }}>
            <strong>💰 Cost:</strong> ~$1.40 per seeding run (Free tier: $200/month)
          </div>
        </div>
      )}
    </div>
  );
}
