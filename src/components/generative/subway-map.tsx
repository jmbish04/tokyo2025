'use client';

interface SubwayMapProps {
  from?: string;
  to?: string;
  lines?: string[];
  duration?: string;
  transfers?: number;
}

export function SubwayMap({ from, to, lines = [], duration, transfers = 0 }: SubwayMapProps) {
  const lineColors: Record<string, string> = {
    'Ginza': '#ff9500',
    'Marunouchi': '#f62e36',
    'Hibiya': '#b5b5ac',
    'Tozai': '#009bbf',
    'Chiyoda': '#00bb85',
    'Yurakucho': '#c1a470',
    'Hanzomon': '#8f76d6',
    'Namboku': '#00ada9',
    'Fukutoshin': '#9c5e31',
    'JR Yamanote': '#9acd32',
    'JR Chuo': '#ff6600',
  };

  return (
    <div style={{
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      padding: '1.5rem',
      margin: '1rem 0',
      maxWidth: '500px',
      animation: 'fadeIn 0.3s ease-out'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <div style={{ fontSize: '1.5rem' }}>🚇</div>
        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Tokyo Metro Route</h3>
      </div>

      {/* Route visualization */}
      <div style={{ position: 'relative', padding: '1rem 0' }}>
        {/* From station */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
          <div style={{
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            background: 'var(--success)',
            border: '3px solid var(--bg-primary)',
            boxShadow: '0 0 0 2px var(--success)',
            flexShrink: 0
          }}></div>
          <div>
            <div style={{ fontWeight: 'bold' }}>{from || 'Start Station'}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Departure</div>
          </div>
        </div>

        {/* Lines */}
        {lines.length > 0 && (
          <div style={{
            marginLeft: '0.5rem',
            marginBottom: '1.5rem',
            paddingLeft: '1rem',
            borderLeft: '4px solid var(--accent)'
          }}>
            {lines.map((line, idx) => (
              <div key={idx} style={{
                display: 'inline-block',
                background: lineColors[line] || 'var(--accent)',
                color: 'white',
                padding: '0.25rem 0.75rem',
                borderRadius: '12px',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                margin: '0.25rem 0.25rem 0.25rem 0',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}>
                {line}
              </div>
            ))}
            {transfers > 0 && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                🔄 {transfers} transfer{transfers > 1 ? 's' : ''}
              </div>
            )}
          </div>
        )}

        {/* To station */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            background: 'var(--accent)',
            border: '3px solid var(--bg-primary)',
            boxShadow: '0 0 0 2px var(--accent)',
            flexShrink: 0
          }}></div>
          <div>
            <div style={{ fontWeight: 'bold' }}>{to || 'Destination Station'}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Arrival</div>
          </div>
        </div>
      </div>

      {/* Duration */}
      {duration && (
        <div style={{
          background: 'var(--bg-tertiary)',
          padding: '0.75rem',
          borderRadius: '8px',
          marginTop: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '0.875rem' }}>Estimated Duration</span>
          <span style={{ fontWeight: 'bold', color: 'var(--accent)' }}>⏱️ {duration}</span>
        </div>
      )}
    </div>
  );
}
