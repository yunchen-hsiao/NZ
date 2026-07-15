'use client';

import dynamic from 'next/dynamic';

// Disable SSR for MapComponent because Leaflet needs window object
const MapComponent = dynamic(() => import('../../components/MapComponent'), {
  ssr: false,
  loading: () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%' }}>
      <div className="spinner"></div>
      <span style={{ marginLeft: '12px', color: 'var(--text-secondary)' }}>載入地圖中...</span>
    </div>
  ),
});

export default function MapPage() {
  return (
    <div style={{ height: '100vh', width: '100%', position: 'relative', paddingTop: '64px' }}>
      <MapComponent />
    </div>
  );
}
