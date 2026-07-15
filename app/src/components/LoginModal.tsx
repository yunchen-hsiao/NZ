'use client';

import { useState } from 'react';
import { createClient } from '../lib/supabase/client';

export default function LoginModal({ isOpen, onClose, onLoginSuccess }: { isOpen: boolean, onClose: () => void, onLoginSuccess: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message === 'Invalid login credentials' ? '帳號或密碼錯誤' : error.message);
      setLoading(false);
    } else {
      setLoading(false);
      onLoginSuccess();
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">管理員登入</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleLogin} className="form-group">
            <div style={{ marginBottom: '16px' }}>
              <label className="form-label" style={{ display: 'block', marginBottom: '8px' }}>Email</label>
              <input 
                type="email" 
                className="form-input" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                placeholder="admin@example.com"
              />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label className="form-label" style={{ display: 'block', marginBottom: '8px' }}>密碼</label>
              <input 
                type="password" 
                className="form-input" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                placeholder="••••••••"
              />
            </div>
            
            {error && <p style={{ color: '#DC2626', fontSize: '13px', marginBottom: '16px', fontWeight: 500 }}>{error}</p>}
            
            <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '44px' }} disabled={loading}>
              {loading ? <span className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px', borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }}></span> : '登入'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
