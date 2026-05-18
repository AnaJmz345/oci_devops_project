import React, { useEffect, useState } from 'react';

// Distinct colors per member — vivid, accessible palette
const MEMBER_COLORS = [
  '#C74634', // red
  '#F1B13F', // amber
  '#4C825C', // green
  '#2b2dbf', // blue
  '#9b59b6', // purple
  '#e07b39', // orange
  '#16a085', // teal
  '#8e44ad', // violet
];

function BarChart({ data = [], title = '', unit = '' }) {
  const [animated, setAnimated] = useState(false);
  const max = Math.max(...data.map(d => d.value), 1);

  useEffect(() => {
    setAnimated(false);
    const t = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(t);
  }, [data]);

  if (data.length === 0) {
    return (
      <div style={{ fontSize: 13, color: 'rgba(30,50,36,0.40)', fontStyle: 'italic', padding: '20px 0', textAlign: 'center' }}>
        No data yet.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Chart area */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 12,
        height: 150,
        borderBottom: '2px solid rgba(30,50,36,0.10)',
        paddingTop: 24,
        position: 'relative',
      }}>
        {/* Y-axis grid lines */}
        {[25, 50, 75].map(pct => (
          <div key={pct} style={{
            position: 'absolute',
            left: 0, right: 0,
            bottom: `${pct}%`,
            borderTop: '1px dashed rgba(30,50,36,0.07)',
            pointerEvents: 'none',
          }} />
        ))}

        {data.map((d, i) => {
          const color = MEMBER_COLORS[i % MEMBER_COLORS.length];
          const heightPct = animated ? Math.max((d.value / max) * 100, d.value > 0 ? 4 : 0) : 0;
          return (
            <div key={i} style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end',
            }}>
              <span style={{
                fontSize: 11, fontWeight: 900, color,
                opacity: animated ? 1 : 0,
                transition: 'opacity 0.3s ease 0.9s',
                whiteSpace: 'nowrap',
              }}>
                {d.value}{unit}
              </span>
              <div style={{
                width: '65%',
                height: `${heightPct}%`,
                background: color,
                borderRadius: '6px 6px 0 0',
                transition: 'height 0.9s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: `0 4px 14px ${color}44`,
              }} />
            </div>
          );
        })}
      </div>

      {/* X-axis labels with color dots */}
      <div style={{ display: 'flex', gap: 12 }}>
        {data.map((d, i) => {
          const color = MEMBER_COLORS[i % MEMBER_COLORS.length];
          return (
            <div key={i} style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 3,
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
              <span style={{
                fontSize: 10, fontWeight: 800,
                color: 'rgba(30,50,36,0.60)',
                textAlign: 'center',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '100%',
              }}>
                {d.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default BarChart;