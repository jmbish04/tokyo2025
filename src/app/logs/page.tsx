'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type LogType = 'app' | 'api' | 'error' | 'ai' | 'performance';
type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';
type TimeRange = '1h' | '6h' | '24h' | '7d' | '30d';

export default function LogsPage() {
  const [logType, setLogType] = useState<LogType>('app');
  const [logLevel, setLogLevel] = useState<LogLevel | 'all'>('all');
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [endpoint, setEndpoint] = useState('');
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        logType,
        timeRange,
        limit: '50',
      });

      if (logLevel !== 'all') params.append('level', logLevel);
      if (endpoint) params.append('endpoint', endpoint);

      const response = await fetch(`/api/logs?${params}`);
      const data = await response.json() as { logs?: any[] };
      setLogs(data.logs || []);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/logs/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [logType, logLevel, timeRange, endpoint]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchLogs();
        fetchStats();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, logType, logLevel, timeRange, endpoint]);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'debug': return '#6b7280';
      case 'info': return '#3b82f6';
      case 'warn': return '#f59e0b';
      case 'error': return '#ef4444';
      case 'fatal': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Header */}
      <header style={{
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
        padding: '1rem 2rem',
      }}>
        <div style={{ maxWidth: '1600px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Link href="/" style={{ textDecoration: 'none', color: 'var(--text-primary)' }}>
              <h1 style={{ margin: 0, fontSize: '1.5rem' }}>🗼 Tokyo 2025</h1>
            </Link>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              System Logs & Monitoring
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              Auto-refresh (5s)
            </label>
            <Link href="/chat" style={{
              padding: '0.5rem 1rem',
              background: 'var(--accent)',
              color: 'white',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '0.875rem',
            }}>
              ← Back to Chat
            </Link>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: '1600px', margin: '2rem auto', padding: '0 2rem' }}>
        {/* Stats Dashboard */}
        {stats && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem',
          }}>
            <div style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '1rem',
            }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Total Requests
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                {stats.totalRequests || 0}
              </div>
            </div>
            <div style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '1rem',
            }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Error Rate
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: stats.errorRate > 5 ? '#ef4444' : '#10b981' }}>
                {stats.errorRate ? `${stats.errorRate.toFixed(2)}%` : '0%'}
              </div>
            </div>
            <div style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '1rem',
            }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Avg Response Time
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                {stats.avgResponseTime ? `${stats.avgResponseTime.toFixed(0)}ms` : 'N/A'}
              </div>
            </div>
            <div style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '1rem',
            }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                AI Tokens Used
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                {stats.totalAITokens ? stats.totalAITokens.toLocaleString() : '0'}
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '1.5rem',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                Log Type
              </label>
              <select
                value={logType}
                onChange={(e) => setLogType(e.target.value as LogType)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                }}
              >
                <option value="app">Application Logs</option>
                <option value="api">API Requests</option>
                <option value="error">Errors</option>
                <option value="ai">AI Interactions</option>
                <option value="performance">Performance Metrics</option>
              </select>
            </div>

            {logType === 'app' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                  Level
                </label>
                <select
                  value={logLevel}
                  onChange={(e) => setLogLevel(e.target.value as LogLevel | 'all')}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                  }}
                >
                  <option value="all">All Levels</option>
                  <option value="debug">Debug</option>
                  <option value="info">Info</option>
                  <option value="warn">Warning</option>
                  <option value="error">Error</option>
                  <option value="fatal">Fatal</option>
                </select>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                Time Range
              </label>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as TimeRange)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                }}
              >
                <option value="1h">Last Hour</option>
                <option value="6h">Last 6 Hours</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                Filter by Endpoint
              </label>
              <input
                type="text"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                placeholder="/api/chat"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
          </div>

          <button
            onClick={() => {
              fetchLogs();
              fetchStats();
            }}
            disabled={loading}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1.5rem',
              background: loading ? 'var(--border)' : 'var(--accent)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: '500',
            }}
          >
            {loading ? 'Loading...' : '🔄 Refresh Logs'}
          </button>
        </div>

        {/* Logs Table */}
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '1rem',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <h2 style={{ margin: 0, fontSize: '1.125rem' }}>
              {logType.charAt(0).toUpperCase() + logType.slice(1)} Logs
            </h2>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              {logs.length} entries
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            {logs.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No logs found for the selected filters
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-tertiary)' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Timestamp</th>
                    {logType === 'app' && <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Level</th>}
                    {logType === 'app' && <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Message</th>}
                    {logType === 'api' && <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Method</th>}
                    {logType === 'api' && <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Endpoint</th>}
                    {logType === 'api' && <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Status</th>}
                    {logType === 'api' && <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Duration</th>}
                    {logType === 'error' && <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Error Type</th>}
                    {logType === 'error' && <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Message</th>}
                    {logType === 'ai' && <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Model</th>}
                    {logType === 'ai' && <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Tokens</th>}
                    {logType === 'performance' && <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Metric</th>}
                    {logType === 'performance' && <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Value</th>}
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, idx) => (
                    <tr key={log.id || idx} style={{
                      borderBottom: '1px solid var(--border)'
                    }}>
                      <td style={{ padding: '0.75rem', whiteSpace: 'nowrap' }}>
                        {formatDate(log.timestamp)}
                      </td>
                      {logType === 'app' && (
                        <>
                          <td style={{ padding: '0.75rem' }}>
                            <span style={{
                              padding: '0.25rem 0.5rem',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              background: getLevelColor(log.level) + '20',
                              color: getLevelColor(log.level),
                            }}>
                              {log.level.toUpperCase()}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem' }}>{log.message}</td>
                        </>
                      )}
                      {logType === 'api' && (
                        <>
                          <td style={{ padding: '0.75rem', fontWeight: '600' }}>{log.method}</td>
                          <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.8125rem' }}>{log.endpoint}</td>
                          <td style={{ padding: '0.75rem' }}>
                            <span style={{
                              color: log.status_code >= 400 ? '#ef4444' : '#10b981',
                              fontWeight: '600',
                            }}>
                              {log.status_code}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem' }}>{log.duration_ms}ms</td>
                        </>
                      )}
                      {logType === 'error' && (
                        <>
                          <td style={{ padding: '0.75rem', fontWeight: '600', color: '#ef4444' }}>{log.error_type}</td>
                          <td style={{ padding: '0.75rem' }}>{log.error_message}</td>
                        </>
                      )}
                      {logType === 'ai' && (
                        <>
                          <td style={{ padding: '0.75rem' }}>
                            <div style={{ fontSize: '0.875rem', fontWeight: '600' }}>{log.model}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{log.provider}</div>
                          </td>
                          <td style={{ padding: '0.75rem' }}>{log.total_tokens?.toLocaleString() || 'N/A'}</td>
                        </>
                      )}
                      {logType === 'performance' && (
                        <>
                          <td style={{ padding: '0.75rem', fontWeight: '600' }}>{log.metric_name}</td>
                          <td style={{ padding: '0.75rem' }}>
                            {log.metric_value} {log.metric_unit}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
