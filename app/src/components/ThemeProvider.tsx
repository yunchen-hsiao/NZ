'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'winter' | 'summer';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('winter');

  // `localStorage` is only available in the browser, so the saved theme
  // can't be read during the server-rendered pass or as a lazy `useState`
  // initializer without risking a hydration mismatch (SSR always has no
  // saved value). Reading it once after mount and syncing state here is the
  // same category of "browser-only API access" effect the eslint rule
  // itself allows for ref-based DOM measurement.
  useEffect(() => {
    const savedTheme = localStorage.getItem('nz-theme') as Theme | null;
    if (savedTheme) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTheme(savedTheme);
      if (savedTheme === 'summer') {
        document.body.setAttribute('data-theme', 'summer');
      }
    }
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => {
      const newTheme = prev === 'winter' ? 'summer' : 'winter';
      
      // Update DOM
      if (newTheme === 'summer') {
        document.body.setAttribute('data-theme', 'summer');
      } else {
        document.body.removeAttribute('data-theme');
      }
      
      // Save to local storage
      localStorage.setItem('nz-theme', newTheme);
      
      return newTheme;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
