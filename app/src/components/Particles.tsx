'use client';

import { useEffect, useState } from 'react';
import { useTheme } from './ThemeProvider';

// Pre-seeded deterministic values (no Math.random on render — prevents hydration mismatch)
const STAR_DATA = Array.from({ length: 22 }, (_, i) => ({
  size: 1.5 + ((i * 1.13) % 3.5),
  left: (i * 4.7 + 2) % 100,
  top: (i * 7.3 + 5) % 90,
  duration: 3.5 + (i * 0.61 % 4),
  delay: -(i * 0.53 % 6),
  // Cycle through 3 aurora colors
  colorIdx: i % 3,
}));

const FIREFLY_DATA = Array.from({ length: 18 }, (_, i) => ({
  size: 3 + ((i * 1.7) % 5),       // 3–8px dot
  left: (i * 5.4 + 3) % 96,
  startY: 30 + (i * 3.7 % 55),     // start in lower 85% of screen
  duration: 6 + (i * 0.9 % 8),     // 6–14s float up
  delay: -(i * 0.8 % 10),
  drift: (i % 2 === 0 ? 1 : -1) * (8 + (i * 1.2 % 20)), // left/right drift
  colorIdx: i % 2,                  // gold or green
}));

export default function Particles() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Aurora color palette for winter stars
  const AURORA_COLORS = [
    'var(--color-primary-light)',   // indigo
    'var(--color-accent)',          // cyan
    'var(--color-highlight)',       // lavender
  ];

  // Firefly colors for summer
  const FIREFLY_COLORS = [
    '#FCD34D',  // warm gold
    '#6EE7B7',  // mint green
  ];

  return (
    <div className="particles-container" aria-hidden="true">
      {theme === 'winter' ? (
        /* ── Winter: subtle twinkling aurora stars ── */
        STAR_DATA.map((p, i) => (
          <div
            key={`star-${i}`}
            style={{
              position: 'absolute',
              left: `${p.left}vw`,
              top: `${p.top}vh`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              borderRadius: '50%',
              background: AURORA_COLORS[p.colorIdx],
              opacity: 0,
              boxShadow: `0 0 ${p.size * 2}px ${p.size}px ${AURORA_COLORS[p.colorIdx]}`,
              animation: `starTwinkle ${p.duration}s ${p.delay}s ease-in-out infinite`,
            }}
          />
        ))
      ) : (
        /* ── Summer: floating firefly bokeh dots ── */
        FIREFLY_DATA.map((p, i) => (
          <div
            key={`firefly-${i}`}
            style={{
              position: 'absolute',
              left: `${p.left}vw`,
              top: `${p.startY}vh`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              borderRadius: '50%',
              background: FIREFLY_COLORS[p.colorIdx],
              opacity: 0,
              boxShadow: `0 0 ${p.size * 3}px ${p.size * 1.5}px ${FIREFLY_COLORS[p.colorIdx]}40`,
              animation: `fireflyFloat ${p.duration}s ${p.delay}s ease-in-out infinite`,
              '--drift': `${p.drift}vw`,
            } as React.CSSProperties}
          />
        ))
      )}

      <style>{`
        @keyframes starTwinkle {
          0%, 100% { opacity: 0; transform: scale(0.6); }
          40%, 60% { opacity: 0.7; transform: scale(1); }
        }

        @keyframes fireflyFloat {
          0%   { opacity: 0;   transform: translate(0, 0) scale(0.8); }
          15%  { opacity: 0.8; transform: translate(calc(var(--drift) * 0.3), -8vh) scale(1); }
          50%  { opacity: 0.6; transform: translate(var(--drift), -28vh) scale(0.9); }
          85%  { opacity: 0.3; transform: translate(calc(var(--drift) * 0.6), -48vh) scale(0.7); }
          100% { opacity: 0;   transform: translate(calc(var(--drift) * 0.2), -60vh) scale(0.5); }
        }
      `}</style>
    </div>
  );
}
