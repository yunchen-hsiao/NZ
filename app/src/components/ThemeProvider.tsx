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

  useEffect(() => {
    // Check local storage or system preference on mount
    const savedTheme = localStorage.getItem('nz-theme') as Theme | null;
    if (savedTheme) {
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
