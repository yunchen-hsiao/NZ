'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Image from 'next/image';
import type { Session } from '@supabase/supabase-js';
import { Sidebar } from './ui/Sidebar';
import { SpotFormModal } from './SpotFormModal';
import { createClient } from '../lib/supabase/client';
import type { Spot, Photo, SpotType } from '../lib/types';

// New Zealand bounds to prevent dragging away
const NZ_BOUNDS: L.LatLngBoundsLiteral = [
  [-48.0, 165.0], // South West
  [-33.0, 180.0]  // North East
];
const NZ_CENTER: [number, number] = [-40.9006, 174.8860];

// Custom DivIcons
const createCustomIcon = (emoji: string, colorClass: string) => {
  return L.divIcon({
    html: `<div style="
      background: white; 
      border: 2px solid var(--color-${colorClass});
      border-radius: 50%;
      width: 32px; height: 32px;
      display: flex; align-items: center; justify-content: center;
      font-size: 16px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    ">${emoji}</div>`,
    className: 'custom-spot-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

const ICONS: Record<SpotType, L.DivIcon> = {
  accommodation: createCustomIcon('🏠', 'accommodation'),
  attraction: createCustomIcon('📍', 'attraction'),
  restaurant: createCustomIcon('🍽️', 'restaurant'),
  other: createCustomIcon('📌', 'other'),
};

export default function MapComponent() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<(L.Marker | L.Polyline)[]>([]);

  // State
  const [session, setSession] = useState<Session | null>(null);
  const [spots, setSpots] = useState<Spot[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);

  // Form Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [clickCoords, setClickCoords] = useState<{lat: number, lng: number} | null>(null);

  // Filters
  const [activeFilters, setActiveFilters] = useState({
    accommodation: true,
    attraction: true,
    restaurant: true,
    other: true,
  });

  // Load Data and Session
  const loadData = useCallback(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    Promise.all([
      supabase.from('spots').select('*'),
      supabase.from('photos').select('*'),
    ]).then(([spotsRes, photosRes]) => {
      if (spotsRes.data) setSpots(spotsRes.data);
      if (photosRes.data) setPhotos(photosRes.data);
    });
  }, []);

  // Data fetching on mount (loadData only sets state inside deferred
  // `.then()` callbacks, not synchronously, so this doesn't trip
  // react-hooks/set-state-in-effect).
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Initialize Map
  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return;
    if (mapInstanceRef.current !== null) return; 

    const map = L.map(mapRef.current, {
      maxBounds: NZ_BOUNDS,
      maxBoundsViscosity: 1.0,
      minZoom: 5,
      zoomControl: false, // 停用預設的左上角縮放控制，避免跟自訂面板重疊
    }).setView(NZ_CENTER, 6);
    
    mapInstanceRef.current = map;

    // 將縮放控制移到右下角
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Map Click to Add Spot (only if logged in)
    map.on('click', async (e) => {
      const supabase = createClient();
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (currentSession) {
        setClickCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
        setIsFormOpen(true);
      } else {
        // Not logged in: maybe just log or ignore
        console.log('Not logged in. Cannot add spot.');
      }
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Render Markers when spots or filters change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    spots.forEach(spot => {
      if (!activeFilters[spot.type]) return;

      const marker = L.marker([spot.lat, spot.lng], {
        icon: ICONS[spot.type]
      }).addTo(map);

      marker.on('click', () => {
        setSelectedSpot(spot);
        map.flyTo([spot.lat, spot.lng], 12, { duration: 0.5 });
      });

      markersRef.current.push(marker);
    });

    // Simple Route drawing logic: connect all visible spots by date
    // (A real app would sort by trip and date, here we just sort all by date for simplicity)
    const sortedSpots = [...spots]
      .filter(s => activeFilters[s.type])
      .sort((a, b) => new Date(a.visited_date).getTime() - new Date(b.visited_date).getTime());
    
    const polylineLayer = L.polyline(sortedSpots.map(s => [s.lat, s.lng] as [number, number]), { 
      color: 'var(--color-trip1)', 
      weight: 4, 
      opacity: 0.8 
    });
    
    polylineLayer.addTo(map);
    markersRef.current.push(polylineLayer); // Track to remove later

  }, [spots, activeFilters]);

  const toggleFilter = (type: keyof typeof activeFilters) => {
    setActiveFilters(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const selectedSpotPhotos = selectedSpot ? photos.filter(p => p.spot_id === selectedSpot.id) : [];

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      <div ref={mapRef} style={{ height: '100%', width: '100%', zIndex: 10 }} />

      {/* Layer Control Panel */}
      <div className="aurora-glass" style={{
        position: 'absolute', top: 20, left: 20, zIndex: 20,
        padding: '16px', borderRadius: 'var(--radius-md)',
        width: '200px'
      }}>
        <h4 style={{ margin: '0 0 12px 0', fontSize: '14px' }}>圖層篩選</h4>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
            <input type="checkbox" checked={activeFilters.accommodation} onChange={() => toggleFilter('accommodation')} />
            <span>🏠 住宿</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
            <input type="checkbox" checked={activeFilters.attraction} onChange={() => toggleFilter('attraction')} />
            <span>📍 景點</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
            <input type="checkbox" checked={activeFilters.restaurant} onChange={() => toggleFilter('restaurant')} />
            <span>🍽️ 餐廳</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
            <input type="checkbox" checked={activeFilters.other} onChange={() => toggleFilter('other')} />
            <span>📌 其他</span>
          </label>
        </div>

        {session && (
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>💡 點擊地圖任意處可新增地點</p>
          </div>
        )}
      </div>

      {/* Sidebar for Spot Details */}
      <Sidebar 
        isOpen={!!selectedSpot} 
        onClose={() => setSelectedSpot(null)}
        title={selectedSpot ? selectedSpot.name : ''}
      >
        {selectedSpot && (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <span className={`badge badge-${selectedSpot.type}`}>
                {selectedSpot.type === 'accommodation' ? '🏠 住宿' : 
                 selectedSpot.type === 'attraction' ? '📍 景點' : 
                 selectedSpot.type === 'restaurant' ? '🍽️ 餐廳' : '📌 其他'}
              </span>
              <span style={{ marginLeft: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                日期：{selectedSpot.visited_date}
              </span>
            </div>
            
            <p style={{ color: 'var(--text-primary)', lineHeight: 1.6, marginBottom: '24px', whiteSpace: 'pre-wrap' }}>
              {selectedSpot.description}
            </p>

            {/* Photos */}
            {selectedSpotPhotos.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h4 style={{ margin: 0 }}>📸 照片記錄</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {selectedSpotPhotos.map(photo => (
                    <div key={photo.id} style={{ position: 'relative', aspectRatio: '1', borderRadius: '8px', overflow: 'hidden' }}>
                      <Image
                        src={photo.cloudinary_url}
                        alt=""
                        fill
                        sizes="200px"
                        style={{ objectFit: 'cover' }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ 
                background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '24px',
                textAlign: 'center', border: '1px dashed var(--border-strong)', color: 'var(--text-muted)', fontSize: '13px'
              }}>
                尚無照片
              </div>
            )}
          </div>
        )}
      </Sidebar>

      {/* Add Spot Form Modal */}
      {clickCoords && (
        <SpotFormModal
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setClickCoords(null);
          }}
          lat={clickCoords.lat}
          lng={clickCoords.lng}
          onSuccess={() => {
            loadData(); // Reload data to show new marker
          }}
        />
      )}
    </div>
  );
}
