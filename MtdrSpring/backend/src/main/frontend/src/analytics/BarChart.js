import React, { useEffect, useState } from 'react';

const COLORS = ['#C74634', '#F1B13F', '#4C825C', '#2b2dbf', '#1E3224', '#e07b39'];

function BarChart({ data = [], title = '', unit = '', color }) {
  const [animated, setAnimated] = useState(false);
  const max = Math.max(...data.map(d => d.value), 1);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 150);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {title && (
        <div style={{
          fontSize: 11, fontWeight: 900, letterSpacing: '0.8px',
          color: 'rgba(30,50,36,0.55)', textTransform: 'uppercase',
        }}>
          {title}
        </div>
      )}
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 10,
        height: 140,
        borderBottom: '2px solid rgba(30,50,36,0.10)',
        paddingBottom: 6,
        paddingTop: 8,
      }}>
        {data.map((d, i) => {
          const heightPct = animated ? (d.value / max) * 100 : 0;
          const barColor = color || COLORS[i % COLORS.length];
          return (
            <div
              key={d.label}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                height: '100%',
                justifyContent: 'flex-end',
              }}
            >
              {/* Value label on top */}
              <span style={{
                fontSize: 11, fontWeight: 900, color: barColor,
                opacity: animated ? 1 : 0,
                transition: 'opacity 0.4s ease 0.8s',
              }}>
                {d.value}{unit}
              </span>
              {/* Bar */}
              <div style={{
                width: '70%',
                height: `${heightPct}%`,
                background: barColor,
                borderRadius: '6px 6px 0 0',
                transition: 'height 1s cubic-bezier(0.4, 0, 0.2, 1)',
                minHeight: d.value > 0 ? 4 : 0,
                position: 'relative',
                cursor: 'default',
              }}
                title={`${d.label}: ${d.value}${unit}`}
              />
            </div>
          );
        })}
      </div>
      {/* X axis labels */}
      <div style={{ display: 'flex', gap: 10 }}>
        {data.map(d => (
          <div key={d.label} style={{
            flex: 1, textAlign: 'center',
            fontSize: 10, fontWeight: 800,
            color: 'rgba(30,50,36,0.55)',
            letterSpacing: '0.3px',
            whiteSpace: 'nowrap', overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {d.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export default BarChart;