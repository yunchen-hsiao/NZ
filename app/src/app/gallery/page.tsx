'use client';

import { useState, useEffect } from 'react';
import { createClient } from '../../lib/supabase/client';
import UploadPhotoModal from '../../components/UploadPhotoModal';

export default function GalleryPage() {
  const [selectedPhoto, setSelectedPhoto] = useState<any | null>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [session, setSession] = useState<any>(null);

  // Filter state
  const [filterSpotId, setFilterSpotId] = useState<string>('all');
  
  const fetchPhotos = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('photos')
      .select('*, spots(id, name, visited_date)')
      .order('created_at', { ascending: false });
    
    if (data) setPhotos(data);
    if (error) console.error('Error fetching photos:', error);
    setLoading(false);
  };

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      fetchPhotos();
    };
    init();
  }, []);

  const handleUploadSuccess = () => {
    setIsUploadModalOpen(false);
    fetchPhotos();
  };

  // Get unique spots from photos for the filter dropdown
  const uniqueSpots = Array.from(new Set(photos.map(p => p.spots?.id)))
    .filter(Boolean)
    .map(id => {
      const photo = photos.find(p => p.spots?.id === id);
      return photo?.spots;
    });

  const filteredPhotos = filterSpotId === 'all' 
    ? photos 
    : photos.filter(p => p.spots?.id === filterSpotId);

  return (
    <div className="container" style={{ padding: '96px 24px 32px', animation: 'fadeIn 0.5s ease' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '48px', position: 'relative' }}>
        <h1 style={{ fontSize: '36px', marginBottom: '12px', background: 'linear-gradient(135deg, var(--text-primary), var(--color-primary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'inline-block' }}>
          回憶相冊
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '16px', textAlign: 'center' }}>
          北島的地熱與豔陽，南島的冰雪與星空，將每一幀風景收藏於此 🏔️
        </p>
        
        {session && (
          <button 
            className="btn btn-primary" 
            style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)' }}
            onClick={() => setIsUploadModalOpen(true)}
          >
            + 上傳照片
          </button>
        )}
      </div>

      {/* Filter Bar */}
      {photos.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
          <select 
            className="form-input" 
            style={{ width: '250px', background: 'var(--bg-card)' }}
            value={filterSpotId}
            onChange={(e) => setFilterSpotId(e.target.value)}
          >
            <option value="all">所有景點</option>
            {uniqueSpots.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Masonry Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px' }}>
          <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
          載入相片中...
        </div>
      ) : filteredPhotos.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '80px 20px', background: 'var(--bg-card)', borderRadius: '16px' }}>
          暫無相片。點擊右上方上傳照片來豐富你的相冊吧！
        </div>
      ) : (
        <div className="photo-grid">
          {filteredPhotos.map((photo) => (
            <div 
              key={photo.id} 
              className="photo-card" 
              onClick={() => setSelectedPhoto(photo)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.cloudinary_url} alt={photo.caption || '旅行照片'} loading="lazy" />
              <div className="photo-card-overlay">
                <div className="photo-card-info">
                  <h4>{photo.spots?.name || '未知景點'}</h4>
                  <p>{photo.caption || photo.spots?.visited_date}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div className="lightbox-overlay" onClick={() => setSelectedPhoto(null)}>
          <button className="lightbox-close" onClick={() => setSelectedPhoto(null)}>✕</button>
          
          <img 
            src={selectedPhoto.original_url || selectedPhoto.cloudinary_url} 
            alt={selectedPhoto.caption || '旅行照片'} 
            className="lightbox-img" 
            onClick={(e) => e.stopPropagation()} 
          />
          
          <div className="lightbox-controls" onClick={(e) => e.stopPropagation()}>
            <a 
              href={selectedPhoto.original_url || selectedPhoto.cloudinary_url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn btn-primary"
              style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)' }}
            >
              📥 下載原圖
            </a>
          </div>
        </div>
      )}

      <UploadPhotoModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)} 
        onSuccess={handleUploadSuccess} 
      />
    </div>
  );
}
