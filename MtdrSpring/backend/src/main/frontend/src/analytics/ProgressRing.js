import React, { useEffect, useState } from 'react';

// Color stops based on progress percentage — updated to cold-to-warm gradient
function getGradientColors(percent) {
  if (percent <= 25) return { start: '#3B82F6', end: '#6366F1' }; // azul → índigo
  if (percent <= 50) return { start: '#4F46E5', end: '#A855F7' }; // índigo → morado
  if (percent <= 75) return { start: '#7C3AED', end: '#D946EF' }; // morado → magenta
  return               { start: '#C026D3', end: '#EF4444' };      // magenta → rojo
}

function ProgressRing({ percent = 0, size = 160, stroke = 14 }) {
  const [animatedPercent, setAnimatedPercent] = useState(0);

  useEffect(() => {
    setAnimatedPercent(0);
    const t = setTimeout(() => setAnimatedPercent(percent), 120);
    return () => clearTimeout(t);
  }, [percent]);

  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedPercent / 100) * circumference;
  const { start, end } = getGradientColors(percent);

  const progressDegrees = (animatedPercent / 100) * 360;
  const showDot = percent > 0;
  const gradId = `ring-grad-${Math.round(percent)}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size}>
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={start} />
              <stop offset="100%" stopColor={end} />
            </linearGradient>
          </defs>

          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none"
            stroke="rgba(30,50,36,0.08)"
            strokeWidth={stroke}
          />

          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ transition: 'stroke-dashoffset 1.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
          />

          {showDot && (
            <g
              style={{
                transform: `rotate(${progressDegrees}deg)`,
                transformBox: 'view-box',
                transformOrigin: 'center',
                transition: 'transform 1.3s cubic-bezier(0.4,0,0.2,1)',
              }}
            >
              <circle
                cx={size / 2}
                cy={size / 2 - radius}
                r={stroke * 0.85}
                fill={end}
                opacity="0.25"
              />
              <circle
                cx={size / 2}
                cy={size / 2 - radius}
                r={stroke * 0.55}
                fill={end}
              />
            </g>
          )}
        </svg>

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
            letterSpacing: 0,
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
