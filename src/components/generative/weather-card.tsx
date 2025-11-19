'use client';

import { useState, useEffect } from 'react';

interface WeatherCardProps {
  location?: string;
  temperature?: number;
  condition?: string;
  forecast?: string;
  humidity?: number;
  windSpeed?: number;
}

export function WeatherCard({
  location = 'Tokyo',
  temperature,
  condition,
  forecast,
  humidity,
  windSpeed,
}: WeatherCardProps) {
  const [weatherData, setWeatherData] = useState<any>(null);
  const [loading, setLoading] = useState(!temperature);

  useEffect(() => {
    if (!temperature) {
      // Fetch weather data if not provided
      fetch(`/api/weather?location=${encodeURIComponent(location)}`)
        .then(res => res.json())
        .then(data => {
          setWeatherData(data.weather);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [location, temperature]);

  const displayData = temperature
    ? { location, temperature, condition, forecast, humidity, windSpeed }
    : weatherData;

  if (loading) {
    return (
      <div className="weather-widget">
        <div className="loading"><div className="spinner"></div></div>
      </div>
    );
  }

  if (!displayData) return null;

  const getWeatherEmoji = (condition: string = '') => {
    const lower = condition.toLowerCase();
    if (lower.includes('sunny') || lower.includes('clear')) return '☀️';
    if (lower.includes('cloud')) return '☁️';
    if (lower.includes('rain')) return '🌧️';
    if (lower.includes('snow')) return '❄️';
    if (lower.includes('storm')) return '⛈️';
    return '🌤️';
  };

  return (
    <div className="weather-widget" style={{ animation: 'fadeIn 0.3s ease-out', maxWidth: '400px', margin: '1rem 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
        <div className="weather-icon" style={{ fontSize: '3.5rem' }}>
          {getWeatherEmoji(displayData.condition)}
        </div>
        <div className="weather-info" style={{ flex: 1 }}>
          <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.25rem' }}>
            {displayData.location}
          </h3>
          <div className="weather-temp" style={{ fontSize: '2.5rem', fontWeight: 'bold', lineHeight: 1 }}>
            {displayData.temperature}°C
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            {displayData.condition}
          </div>
        </div>
      </div>

      {displayData.forecast && (
        <div style={{
          background: 'var(--bg-tertiary)',
          padding: '0.75rem',
          borderRadius: '8px',
          fontSize: '0.875rem',
          marginBottom: '0.75rem'
        }}>
          {displayData.forecast}
        </div>
      )}

      {(displayData.humidity || displayData.windSpeed) && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.75rem',
          fontSize: '0.875rem'
        }}>
          {displayData.humidity && (
            <div style={{ background: 'var(--bg-secondary)', padding: '0.5rem', borderRadius: '4px' }}>
              <div style={{ color: 'var(--text-secondary)' }}>Humidity</div>
              <div style={{ fontWeight: 'bold' }}>💧 {displayData.humidity}%</div>
            </div>
          )}
          {displayData.windSpeed && (
            <div style={{ background: 'var(--bg-secondary)', padding: '0.5rem', borderRadius: '4px' }}>
              <div style={{ color: 'var(--text-secondary)' }}>Wind</div>
              <div style={{ fontWeight: 'bold' }}>💨 {displayData.windSpeed} km/h</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
