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

interface Venue {
  id: number;
  name: string;
  category: string;
  district: string;
  description: string;
  map_url: string;
  rating: number;
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

  // Venue preview
  const [recentVenues, setRecentVenues] = useState<Venue[]>([]);
  const [loadingVenues, setLoadingVenues] = useState(false);

  // Manual entry
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualVenue, setManualVenue] = useState({
    name: '',
    category: '',
    district: '',
    description: '',
    map_url: '',
    rating: 0,
  });
  const [addingVenue, setAddingVenue] = useState(false);

  useEffect(() => {
    fetchStatus();
    fetchRecentVenues();
  }, []);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/seed');
      const data = await response.json() as SeedStatus;
      setStatus(data);
      setShowApiKeyInput(!data.configured.apiKey);
    } catch (err) {
      setError('Failed to fetch status');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentVenues = async () => {
    setLoadingVenues(true);
    try {
      const response = await fetch('/api/venues?limit=6');
      const data = await response.json() as { venues?: Venue[] };
      setRecentVenues(data.venues || []);
    } catch (err) {
      console.error('Failed to fetch venues:', err);
    } finally {
      setLoadingVenues(false);
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

      const data = await response.json() as SeedResult & { error?: string };

      if (response.ok) {
        setResult(data);
        setTimeout(() => {
          fetchStatus();
          fetchRecentVenues();
        }, 1000);
      } else {
        setError(data.error || 'Seeding failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setSeeding(false);
    }
  };

  const handleAddVenue = async () => {
    if (!manualVenue.name || !manualVenue.category || !manualVenue.district || !manualVenue.description) {
      setError('Please fill in all required fields (name, category, district, description)');
      return;
    }

    setAddingVenue(true);
    setError(null);

    try {
      const response = await fetch('/api/venues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(manualVenue),
      });

      const data = await response.json() as { venue?: Venue; error?: string };

      if (response.ok) {
        // Reset form
        setManualVenue({
          name: '',
          category: '',
          district: '',
          description: '',
          map_url: '',
          rating: 0,
        });
        setShowManualEntry(false);

        // Refresh
        fetchStatus();
        fetchRecentVenues();

        alert(`✅ ${data.venue?.name} added successfully!`);
      } else {
        setError(data.error || 'Failed to add venue');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setAddingVenue(false);
    }
  };

  const handleDeleteVenue = async (id: number, name: string) => {
    if (!confirm(`Delete ${name}?`)) return;

    try {
      const response = await fetch(`/api/venues?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchStatus();
        fetchRecentVenues();
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  return (
    <div className="container">
      <header className="header">
        <h1>🌱 Venue Management</h1>
        <p>Seed database with real venues or add your own favorites</p>
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
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Total Venues</div>
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

      {/* Tab Selection */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '2px solid var(--border)' }}>
        <button
          onClick={() => { setShowManualEntry(false); setError(null); }}
          style={{
            flex: 1,
            padding: '1rem',
            background: !showManualEntry ? 'var(--bg-tertiary)' : 'transparent',
            border: 'none',
            borderBottom: !showManualEntry ? '2px solid var(--accent)' : 'none',
            color: !showManualEntry ? 'var(--accent)' : 'var(--text-secondary)',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontSize: '1rem',
          }}
        >
          🚀 Auto-Seed from Google
        </button>
        <button
          onClick={() => { setShowManualEntry(true); setError(null); }}
          style={{
            flex: 1,
            padding: '1rem',
            background: showManualEntry ? 'var(--bg-tertiary)' : 'transparent',
            border: 'none',
            borderBottom: showManualEntry ? '2px solid var(--accent)' : 'none',
            color: showManualEntry ? 'var(--accent)' : 'var(--text-secondary)',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontSize: '1rem',
          }}
        >
          ✏️ Add Manually
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error" style={{ marginBottom: '2rem' }}>
          ❌ {error}
        </div>
      )}

      {/* Auto-Seeding Section */}
      {!showManualEntry && (
        <>
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
              {seeding ? '🌱 Seeding in progress...' : '🚀 Start Auto-Seeding'}
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
            </div>
          )}
        </>
      )}

      {/* Manual Entry Section */}
      {showManualEntry && (
        <div className="venue-card" style={{ marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>Add Your Own Venue</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Found a great spot that's not in the database? Add it here!
          </p>

          <div style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Venue Name <span style={{ color: 'var(--accent)' }}>*</span>
              </label>
              <input
                type="text"
                value={manualVenue.name}
                onChange={(e) => setManualVenue({ ...manualVenue, name: e.target.value })}
                placeholder="e.g., Tsukiji Outer Market"
                style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Category <span style={{ color: 'var(--accent)' }}>*</span>
                </label>
                <select
                  value={manualVenue.category}
                  onChange={(e) => setManualVenue({ ...manualVenue, category: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)' }}
                >
                  <option value="">Select category...</option>
                  <option value="Seafood Market">Seafood Market</option>
                  <option value="Shopping Mall">Shopping Mall</option>
                  <option value="Department Store">Department Store</option>
                  <option value="Fashion Boutique">Fashion Boutique</option>
                  <option value="Restaurant">Restaurant</option>
                  <option value="Cafe">Cafe</option>
                  <option value="Bar">Bar</option>
                  <option value="Nightlife">Nightlife</option>
                  <option value="Tourist Attraction">Tourist Attraction</option>
                  <option value="Museum">Museum</option>
                  <option value="Park">Park</option>
                  <option value="Street Food">Street Food</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  District <span style={{ color: 'var(--accent)' }}>*</span>
                </label>
                <input
                  type="text"
                  value={manualVenue.district}
                  onChange={(e) => setManualVenue({ ...manualVenue, district: e.target.value })}
                  placeholder="e.g., Ginza, Shibuya, Dotonbori"
                  style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Description <span style={{ color: 'var(--accent)' }}>*</span>
              </label>
              <textarea
                value={manualVenue.description}
                onChange={(e) => setManualVenue({ ...manualVenue, description: e.target.value })}
                placeholder="Describe what makes this venue special..."
                rows={4}
                style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Google Maps URL <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>(optional)</span>
                </label>
                <input
                  type="url"
                  value={manualVenue.map_url}
                  onChange={(e) => setManualVenue({ ...manualVenue, map_url: e.target.value })}
                  placeholder="https://maps.google.com/..."
                  style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  Rating <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>(0-5)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  value={manualVenue.rating}
                  onChange={(e) => setManualVenue({ ...manualVenue, rating: parseFloat(e.target.value) })}
                  style={{ width: '100%', padding: '0.75rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)' }}
                />
              </div>
            </div>

            <button
              onClick={handleAddVenue}
              disabled={addingVenue}
              style={{
                width: '100%',
                padding: '1rem 2rem',
                background: addingVenue ? 'var(--border)' : 'var(--accent)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                cursor: addingVenue ? 'not-allowed' : 'pointer',
                marginTop: '0.5rem',
              }}
            >
              {addingVenue ? '➕ Adding...' : '➕ Add Venue'}
            </button>
          </div>
        </div>
      )}

      {/* Recent Venues Preview */}
      <div className="venue-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2>📍 Recent Venues</h2>
          <button
            onClick={fetchRecentVenues}
            style={{ padding: '0.5rem 1rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', color: 'var(--text-primary)' }}
          >
            🔄 Refresh
          </button>
        </div>

        {loadingVenues && <div className="loading"><div className="spinner"></div></div>}

        {!loadingVenues && recentVenues.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
            No venues yet. Seed the database or add one manually!
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {recentVenues.map((venue) => (
            <div key={venue.id} className="venue-card" style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
                <button
                  onClick={() => handleDeleteVenue(venue.id, venue.name)}
                  style={{
                    background: '#ff4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '0.25rem 0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                  }}
                  title="Delete venue"
                >
                  🗑️
                </button>
              </div>
              <h3 style={{ marginBottom: '0.5rem', paddingRight: '2rem' }}>{venue.name}</h3>
              <span className="category">{venue.category}</span>
              <div className="district" style={{ marginTop: '0.5rem' }}>{venue.district}</div>
              <p style={{ marginTop: '0.75rem', fontSize: '0.875rem' }}>{venue.description}</p>
              <div className="rating" style={{ marginTop: '0.75rem' }}>⭐ {venue.rating}/5.0</div>
              <a href={venue.map_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: '0.5rem' }}>
                View on Map
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div style={{ marginTop: '2rem', textAlign: 'center', paddingBottom: '2rem' }}>
        <Link href="/" style={{ display: 'inline-block', padding: '0.75rem 2rem', background: 'var(--accent)', color: 'white', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold' }}>
          💬 Try the Chat Assistant
        </Link>
      </div>
    </div>
  );
}
