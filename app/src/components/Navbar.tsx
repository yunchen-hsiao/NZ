'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from './ThemeProvider';
import { useState, useEffect } from 'react';
import { createClient } from '../lib/supabase/client';
import LoginModal from './LoginModal';
import { User } from '@supabase/supabase-js';

export default function Navbar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  
  // Need to recreate client here because it's a client component
  const supabase = createClient();

  useEffect(() => {
    // 檢查目前是否已登入
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // 監聽登入狀態改變
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const navLinks = [
    { name: '首頁', path: '/' },
    { name: '地圖', path: '/map' },
    { name: '記帳', path: '/ledger' },
    { name: '相冊', path: '/gallery' },
  ];

  return (
    <>
      <nav className="navbar">
        <div className="navbar-inner">
          <Link href="/" className="nav-logo">
            <span className="nav-logo-text">NZ Travel</span>
          </Link>
          
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
          
          <div className="nav-actions">
            <button 
              className="theme-toggle" 
              onClick={toggleTheme}
              aria-label="切換主題"
              title={theme === 'winter' ? '切換到夏天' : '切換到冬天'}
            >
              {theme === 'winter' ? '❄️' : '☀️'}
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
