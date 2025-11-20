'use client';

interface AttractionCardProps {
  name: string;
  category: string;
  district: string;
  description: string;
  rating?: number;
  mapUrl?: string;
  imageUrl?: string;
  openHours?: string;
  priceRange?: string;
  bestTime?: string;
}

export function AttractionCard({
  name,
  category,
  district,
  description,
  rating = 0,
  mapUrl,
  imageUrl,
  openHours,
  priceRange,
  bestTime,
}: AttractionCardProps) {
  return (
    <div style={{
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      overflow: 'hidden',
      margin: '1rem 0',
      maxWidth: '450px',
      animation: 'fadeIn 0.3s ease-out',
      transition: 'transform 0.2s, box-shadow 0.2s',
    }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.3)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Image */}
      {imageUrl && (
        <div style={{
          width: '100%',
          height: '200px',
          background: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url(${imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          alignItems: 'flex-end',
          padding: '1rem'
        }}>
          <div style={{ color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
            <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.5rem' }}>{name}</h3>
            <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>{district}</div>
          </div>
        </div>
      )}

      <div style={{ padding: '1.25rem' }}>
        {/* Header (if no image) */}
        {!imageUrl && (
          <div style={{ marginBottom: '1rem' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem' }}>{name}</h3>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{district}</div>
          </div>
        )}

        {/* Category and Rating */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
          <span style={{
            background: 'var(--accent)',
            color: 'white',
            padding: '0.25rem 0.75rem',
            borderRadius: '12px',
            fontSize: '0.75rem',
            fontWeight: 'bold'
          }}>
            {category}
          </span>
          {rating > 0 && (
            <span style={{ fontSize: '0.875rem', fontWeight: 'bold', color: 'var(--success)' }}>
              ⭐ {rating.toFixed(1)}
            </span>
          )}
        </div>

        {/* Description */}
        <p style={{ fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--text-primary)', margin: '0 0 1rem 0' }}>
          {description}
        </p>

        {/* Additional Info */}
        {(openHours || priceRange || bestTime) && (
          <div style={{
            background: 'var(--bg-tertiary)',
            padding: '0.75rem',
            borderRadius: '8px',
            marginBottom: '1rem'
          }}>
            {openHours && (
              <div style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>⏰ Hours:</span> {openHours}
              </div>
            )}
            {priceRange && (
              <div style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>💴 Price:</span> {priceRange}
              </div>
            )}
            {bestTime && (
              <div style={{ fontSize: '0.75rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>🕐 Best time:</span> {bestTime}
              </div>
            )}
          </div>
        )}

        {/* Action */}
        {mapUrl && (
          <a
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              background: 'var(--accent)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: 'bold',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--accent-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'var(--accent)'}
          >
            📍 View on Map
          </a>
        )}
      </div>
    </div>
  );
}
