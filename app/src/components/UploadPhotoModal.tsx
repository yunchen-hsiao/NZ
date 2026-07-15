'use client';

import { useState, useEffect } from 'react';
import { createClient } from '../lib/supabase/client';

type UploadPhotoModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export default function UploadPhotoModal({ isOpen, onClose, onSuccess }: UploadPhotoModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [spots, setSpots] = useState<any[]>([]);
  const [spotId, setSpotId] = useState<string>('');
  const [caption, setCaption] = useState('');
  
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  // Fetch spots for dropdown
  useEffect(() => {
    if (isOpen) {
      const fetchSpots = async () => {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('spots')
          .select('id, name, visited_date')
          .order('visited_date', { ascending: false });
        
        if (data) {
          setSpots(data);
          if (data.length > 0) setSpotId(data[0].id);
        }
      };
      fetchSpots();
      
      // Reset form
      setFile(null);
      setPreviewUrl(null);
      setCaption('');
      setError('');
    }
  }, [isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      // Create local preview
      const objectUrl = URL.createObjectURL(selected);
      setPreviewUrl(objectUrl);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !spotId) {
      setError('請選擇照片與所屬景點。');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      // 1. Upload to Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '');

      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      const cloudinaryData = await response.json();

      if (!response.ok) {
        throw new Error(cloudinaryData.error?.message || 'Cloudinary 上傳失敗');
      }

      // 2. Insert into Supabase 'photos'
      const supabase = createClient();
      const { error: dbError } = await supabase.from('photos').insert({
        spot_id: spotId,
        cloudinary_url: cloudinaryData.secure_url,
        cloudinary_public_id: cloudinaryData.public_id,
        original_url: cloudinaryData.secure_url, // For now, they are the same
        caption: caption
      });

      if (dbError) throw dbError;

      // Success
      setIsUploading(false);
      onSuccess();
    } catch (err: any) {
      console.error('Upload Error:', err);
      setError(err.message || '發生錯誤，請稍後再試。');
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      backdropFilter: 'blur(8px)',
      animation: 'fadeIn 0.3s ease'
    }}>
      <div className="aurora-glass card" style={{ 
        width: '100%', 
        maxWidth: '500px', 
        padding: '32px',
        position: 'relative'
      }}>
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--text-secondary)' }}
        >
          &times;
        </button>
        
        <h2 style={{ fontSize: '24px', marginBottom: '24px', color: 'var(--text-primary)' }}>上傳照片 📸</h2>

        {error && (
          <div style={{ padding: '12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* File input and preview */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '14px', fontWeight: 600 }}>選擇照片 *</label>
            {previewUrl ? (
              <div style={{ position: 'relative', width: '100%', height: '200px', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.2)' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button 
                  type="button" 
                  onClick={() => { setFile(null); setPreviewUrl(null); }} 
                  style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer' }}
                >✕</button>
              </div>
            ) : (
              <input type="file" accept="image/*" className="form-input" onChange={handleFileChange} required />
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '14px', fontWeight: 600 }}>關聯景點 *</label>
            <select className="form-input" value={spotId} onChange={e => setSpotId(e.target.value)} required disabled={spots.length === 0}>
              {spots.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.visited_date})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '14px', fontWeight: 600 }}>照片描述 (選填)</label>
            <textarea 
              className="form-input" 
              placeholder="例如：爬了三小時終於看到這個美景..." 
              value={caption} 
              onChange={e => setCaption(e.target.value)}
              style={{ minHeight: '80px', resize: 'vertical' }}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={isUploading || !file}
            style={{ marginTop: '12px', width: '100%', padding: '12px', fontSize: '16px' }}
          >
            {isUploading ? '上傳中... ⏳' : '開始上傳'}
          </button>
        </form>
      </div>
    </div>
  );
}
