'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from './ThemeProvider';
import { useState, useEffect, useRef } from 'react';
import { createClient } from '../lib/supabase/client';
import LoginModal from './LoginModal';
import { User } from '@supabase/supabase-js';

export default function Navbar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [scrolled, setScrolled] = useState(false);

  const supabaseRef = useRef(createClient());

  useEffect(() => {
    const supabase = supabaseRef.current;

    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    // Scroll listener for navbar style
    const handleScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleLogout = async () => {
    await supabaseRef.current.auth.signOut();
  };

  const navLinks = [
    { name: '首頁', path: '/' },
    { name: '地圖', path: '/map' },
    { name: '記帳', path: '/ledger' },
    { name: '相冊', path: '/gallery' },
  ];

  return (
    <>
      <nav className={`navbar${scrolled ? ' scrolled' : ''}`}>
        <div className="navbar-inner">

          {/* Logo */}
          <Link href="/" className="nav-logo">
            <div className="nav-logo-icon" aria-hidden="true">
              {/* Mountain / NZ kiwi SVG icon */}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 18l4-8 4 5 3-4 4 7H3z" />
                <circle cx="17" cy="7" r="2" fill="currentColor" stroke="none" opacity="0.8" />
              </svg>
            </div>
            <span className="nav-logo-text">NZ Travel</span>
          </Link>

          {/* Navigation Links */}
          <ul className="nav-links">
            {navLinks.map((link) => (
              <li key={link.path}>
                <Link
                  href={link.path}
                  className={`nav-link ${pathname === link.path ? 'active' : ''}`}
                >
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>

          {/* Actions */}
          <div className="nav-actions">
            <button
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label={theme === 'winter' ? '切換到夏天主題' : '切換到冬天主題'}
              title={theme === 'winter' ? '切換到夏天' : '切換到冬天'}
            >
              {theme === 'winter' ? (
                /* Snowflake SVG */
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                  <line x1="12" y1="2" x2="12" y2="22" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                  <line x1="19.07" y1="4.93" x2="4.93" y2="19.07" />
                  <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
                </svg>
              ) : (
                /* Sun SVG */
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="4" />
                  <line x1="12" y1="2" x2="12" y2="5" />
                  <line x1="12" y1="19" x2="12" y2="22" />
                  <line x1="4.22" y1="4.22" x2="6.34" y2="6.34" />
                  <line x1="17.66" y1="17.66" x2="19.78" y2="19.78" />
                  <line x1="2" y1="12" x2="5" y2="12" />
                  <line x1="19" y1="12" x2="22" y2="12" />
                  <line x1="4.22" y1="19.78" x2="6.34" y2="17.66" />
                  <line x1="17.66" y1="6.34" x2="19.78" y2="4.22" />
                </svg>
              )}
            </button>

            {user ? (
              <button className="login-btn logged-in" onClick={handleLogout}>
                登出
              </button>
            ) : (
              <button className="login-btn" onClick={() => setIsLoginModalOpen(true)}>
                管理員登入
              </button>
            )}
          </div>
        </div>
      </nav>

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={() => console.log('Login successful')}
      />
    </>
  );
}
