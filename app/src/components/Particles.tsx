'use client';

import { useEffect, useState } from 'react';
import { useTheme } from './ThemeProvider';

export default function Particles() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="particles-container">
      {theme === 'winter' ? (
        // Snowflakes
        Array.from({ length: 30 }).map((_, i) => {
          const size = Math.random() * 1.5 + 0.5; // 0.5 to 2.0 em
          const left = Math.random() * 100; // 0 to 100 vw
          const animationDuration = Math.random() * 5 + 5; // 5s to 10s
          const animationDelay = Math.random() * -10; // Negative delay to start immediately at different positions

          return (
            <div
              key={`snow-${i}`}
              className="snowflake"
              style={{
                left: `${left}vw`,
                fontSize: `${size}em`,
                animationDuration: `${animationDuration}s`,
                animationDelay: `${animationDelay}s`,
              }}
            >
              ❄
            </div>
          );
        })
      ) : (
        // Summer Sun Rays
        Array.from({ length: 8 }).map((_, i) => {
          const width = Math.random() * 10 + 5; // 5 to 15 vw
          const left = (i / 8) * 100 + Math.random() * 5; 
          const animationDuration = Math.random() * 4 + 4;
          const animationDelay = Math.random() * -5;

          return (
            <div
              key={`sun-${i}`}
              className="sun-ray"
              style={{
                left: `${left}vw`,
                width: `${width}vw`,
                height: '150vh',
                animationDuration: `${animationDuration}s`,
                animationDelay: `${animationDelay}s`,
              }}
            />
          );
        })
      )}
    </div>
  );
}
