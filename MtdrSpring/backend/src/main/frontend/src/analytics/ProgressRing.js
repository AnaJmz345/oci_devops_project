import React, { useEffect, useState } from 'react';

function ProgressRing({ percent = 0, size = 140, stroke = 12, label = '', color = '#C74634' }) {
  const [animatedPercent, setAnimatedPercent] = useState(0);
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedPercent / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedPercent(percent), 100);
    return () => clearTimeout(timer);
  }, [percent]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(199,70,52,0.12)"
            strokeWidth={stroke}
          />
          {/* Progress arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)' }}
          />
          {/* Dot at the end of the arc */}
          {animatedPercent > 0 && animatedPercent < 100 && (
            <circle
              cx={size / 2 + radius * Math.cos((2 * Math.PI * animatedPercent) / 100 - Math.PI / 2)}
              cy={size / 2 + radius * Math.sin((2 * Math.PI * animatedPercent) / 100 - Math.PI / 2)}
              r={stroke / 2}
              fill={color}
              style={{ transition: 'all 1.2s cubic-bezier(0.4, 0, 0.2, 1)' }}
            />
          )}
        </svg>
        {/* Center content */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{
            fontSize: size * 0.22, fontWeight: 900,
            color: '#1E3224', lineHeight: 1,
            letterSpacing: '-0.5px',
          }}>
            {Math.round(animatedPercent)}%
          </span>
          <span style={{
            fontSize: size * 0.095, fontWeight: 700,
            color: 'rgba(30,50,36,0.5)', marginTop: 2,
            letterSpacing: '0.3px',
          }}>
            DONE
          </span>
        </div>
      </div>
      {label && (
        <span style={{
          fontSize: 12, fontWeight: 800,
          color: 'rgba(30,50,36,0.65)',
          letterSpacing: '0.5px', textAlign: 'center',
        }}>
          {label}
        </span>
      )}
    </div>
  );
}

export default ProgressRing;