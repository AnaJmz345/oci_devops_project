import React, { useEffect, useState } from 'react';

// Multi-stop gradient: blue → purple → magenta → red
const GRADIENT_STOPS = [
  { offset: 0.00, color: '#3B82F6' }, // blue
  { offset: 0.35, color: '#7C3AED' }, // purple
  { offset: 0.68, color: '#D946EF' }, // magenta
  { offset: 1.00, color: '#EF4444' }, // red
];

function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  const bigint = parseInt(clean, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
}

function rgbToHex({ r, g, b }) {
  const toHex = (v) => Math.round(v).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function interpolateColor(color1, color2, t) {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);

  return rgbToHex({
    r: lerp(c1.r, c2.r, t),
    g: lerp(c1.g, c2.g, t),
    b: lerp(c1.b, c2.b, t),
  });
}

function getColorAtOffset(offset) {
  const clamped = Math.max(0, Math.min(1, offset));

  for (let i = 0; i < GRADIENT_STOPS.length - 1; i++) {
    const current = GRADIENT_STOPS[i];
    const next = GRADIENT_STOPS[i + 1];

    if (clamped >= current.offset && clamped <= next.offset) {
      const localT =
        (clamped - current.offset) / (next.offset - current.offset);
      return interpolateColor(current.color, next.color, localT);
    }
  }

  return GRADIENT_STOPS[GRADIENT_STOPS.length - 1].color;
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

  // Dot position at the tip of the arc
  const angle = (2 * Math.PI * animatedPercent) / 100 - Math.PI / 2;
  const dotX = size / 2 + radius * Math.cos(angle);
  const dotY = size / 2 + radius * Math.sin(angle);

  const gradId = `ring-grad-${Math.round(percent)}`;

  /**
   * Gradient line in user space:
   * from bottom-left to top-right
   * This makes the gradient visually similar to your reference.
   */
  const gx1 = 0;
  const gy1 = size;
  const gx2 = size;
  const gy2 = 0;

  /**
   * Project the dot position onto the same gradient vector,
   * so the dot color matches the exact visible color of the ring there.
   */
  const vx = gx2 - gx1;
  const vy = gy2 - gy1;
  const wx = dotX - gx1;
  const wy = dotY - gy1;

  const gradientLengthSq = vx * vx + vy * vy;
  const projectedT = gradientLengthSq === 0
    ? 0
    : (wx * vx + wy * vy) / gradientLengthSq;

  const dotColor = getColorAtOffset(projectedT);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <defs>
            <linearGradient
              id={gradId}
              gradientUnits="userSpaceOnUse"
              x1={gx1}
              y1={gy1}
              x2={gx2}
              y2={gy2}
            >
              {GRADIENT_STOPS.map((stop) => (
                <stop
                  key={stop.offset}
                  offset={`${stop.offset * 100}%`}
                  stopColor={stop.color}
                />
              ))}
            </linearGradient>
          </defs>

          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(30,50,36,0.08)"
            strokeWidth={stroke}
          />

          {/* Progress arc with multi-stop gradient */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
          />

          {/* Glowing dot at the tip - now sampled from the same gradient */}
          {animatedPercent > 2 && animatedPercent < 100 && (
            <>
              <circle
                cx={dotX}
                cy={dotY}
                r={stroke * 0.85}
                fill={dotColor}
                opacity="0.25"
                style={{ transition: 'all 1.3s cubic-bezier(0.4,0,0.2,1)' }}
              />
              <circle
                cx={dotX}
                cy={dotY}
                r={stroke * 0.55}
                fill={dotColor}
                style={{ transition: 'all 1.3s cubic-bezier(0.4,0,0.2,1)' }}
              />
            </>
          )}
        </svg>

        {/* Center text */}
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
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