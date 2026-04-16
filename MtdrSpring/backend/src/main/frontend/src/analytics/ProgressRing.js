import React, { useEffect, useState } from 'react';

// Color stops based on progress percentage — matches reference image style
function getGradientColors(percent) {
  if (percent <= 25)  return { start: '#3b82f6', end: '#6366f1' }; // blue → indigo
  if (percent <= 50)  return { start: '#22d3ee', end: '#a855f7' }; // cyan → purple
  if (percent <= 75)  return { start: '#22c55e', end: '#ec4899' }; // green → pink
  return               { start: '#C74634',  end: '#F1B13F' };      // red → amber (100%)
}

function ProgressRing({ percent = 0, size = 160, stroke = 14 }) {
  const [animatedPercent, setAnimatedPercent] = useState(0);

  useEffect(() => {
    setAnimatedPercent(0);
    const t = setTimeout(() => setAnimatedPercent(percent), 120);
    return () => clearTimeout(t);
  }, [percent]);

  const radius      = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset      = circumference - (animatedPercent / 100) * circumference;
  const { start, end } = getGradientColors(percent);

  // Dot position at the tip of the arc
  const angle = (2 * Math.PI * animatedPercent) / 100 - Math.PI / 2;
  const dotX  = size / 2 + radius * Math.cos(angle);
  const dotY  = size / 2 + radius * Math.sin(angle);
  const gradId = `ring-grad-${Math.round(percent)}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%"   stopColor={start} />
              <stop offset="100%" stopColor={end}   />
            </linearGradient>
          </defs>

          {/* Background track */}
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none"
            stroke="rgba(30,50,36,0.08)"
            strokeWidth={stroke}
          />

          {/* Progress arc with gradient */}
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
          />

          {/* Glowing dot at the tip */}
          {animatedPercent > 2 && animatedPercent < 100 && (
            <>
              {/* Glow */}
              <circle cx={dotX} cy={dotY} r={stroke * 0.85} fill={end} opacity="0.25"
                style={{ transition: 'all 1.3s cubic-bezier(0.4,0,0.2,1)' }} />
              {/* Dot */}
              <circle cx={dotX} cy={dotY} r={stroke * 0.55} fill={end}
                style={{ transition: 'all 1.3s cubic-bezier(0.4,0,0.2,1)' }} />
            </>
          )}
        </svg>

        {/* Center text */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 2,
        }}>
          <span style={{
            fontSize: size * 0.215,
            fontWeight: 900,
            color: '#1E3224',
            lineHeight: 1,
            letterSpacing: '-1px',
          }}>
            {Math.round(animatedPercent)}%
          </span>
          <span style={{
            fontSize: size * 0.09,
            fontWeight: 800,
            color: 'rgba(30,50,36,0.45)',
            letterSpacing: '1px',
            textTransform: 'uppercase',
          }}>
            Done
          </span>
        </div>
      </div>
    </div>
  );
}

export default ProgressRing;