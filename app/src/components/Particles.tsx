'use client';

import { useEffect, useState } from 'react';
import { useTheme } from './ThemeProvider';

// Pre-seeded deterministic values (no Math.random on render — prevents hydration mismatch)
const SNOWFLAKE_DATA = Array.from({ length: 25 }, (_, i) => ({
  size: 10 + ((i * 1.7) % 12),
  left: (i * 4.3 + 2) % 100,
  delay: -(i * 0.73 % 10),
  duration: 8 + (i * 0.81 % 6),
  drift: (i % 2 === 0 ? 1 : -1) * (5 + (i * 1.3 % 15)),
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

  // This is the standard "mounted" gate used to intentionally render
  // nothing during SSR/hydration and only show particles once running in
  // the browser, avoiding a hydration mismatch. There's no prop/state to
  // derive this from during render — it must happen after mount.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Warm floating dots for summer (no green)
  const FIREFLY_COLORS = [
    '#FCD34D',  // yellow
    '#F59E0B',  // amber
    '#D97706',  // dark amber
  ];

  return (
    <div
      className="particles-container"
      aria-hidden="true"
      style={{ position: 'fixed', inset: 0, zIndex: -1, pointerEvents: 'none', overflow: 'hidden' }}
    >
      {theme === 'winter' ? (
        /* ── Winter: Snowflakes ── */
        SNOWFLAKE_DATA.map((p, i) => (
          <div
            key={`snow-${i}`}
            style={{
              position: 'absolute',
              left: `${p.left}vw`,
              top: '-10vh',
              fontSize: `${p.size}px`,
              color: 'rgba(255, 255, 255, 0.8)',
              textShadow: '0 0 8px rgba(255,255,255,0.4)',
              animation: `snowDrop ${p.duration}s ${p.delay}s linear infinite`,
              '--drift': `${p.drift}vw`,
            } as React.CSSProperties}
          >
            ❄️
          </div>
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
              background: FIREFLY_COLORS[p.colorIdx % 3],
              opacity: 0,
              boxShadow: `0 0 ${p.size * 3}px ${p.size * 1.5}px ${FIREFLY_COLORS[p.colorIdx % 3]}40`,
              animation: `fireflyFloat ${p.duration}s ${p.delay}s ease-in-out infinite`,
              '--drift': `${p.drift}vw`,
            } as React.CSSProperties}
          />
        ))
      )}

      <style>{`
        @keyframes snowDrop {
          0% { transform: translate(0, 0) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translate(var(--drift), 110vh) rotate(360deg); opacity: 0; }
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
