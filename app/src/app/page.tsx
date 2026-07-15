import Link from 'next/link';
import { createClient } from '../lib/supabase/server';

export default async function Home() {
  const supabase = await createClient();

  // 1. Fetch Trip info (days)
  const { data: trip } = await supabase.from('trips').select('*').limit(1).single();
  
  let days = 33;
  let tripRange = '2026/06/26 - 2026/07/28';
  if (trip && trip.start_date && trip.end_date) {
    const start = new Date(trip.start_date);
    const end = new Date(trip.end_date);
    days = Math.round((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;
    tripRange = `${trip.start_date.replace(/-/g, '/')} - ${trip.end_date.replace(/-/g, '/')}`;
  }

  // 2. Fetch Cities count
  const { count: citiesCount } = await supabase.from('cities').select('*', { count: 'exact', head: true });
  
  // 3. Fetch Spots count (instead of photos for now)
  const { count: spotsCount } = await supabase.from('spots').select('*', { count: 'exact', head: true });

  // 4. Fetch Total Expenses
  const { data: expenses } = await supabase.from('expenses').select('amount_nzd');
  const totalExpense = expenses ? expenses.reduce((sum, e) => sum + e.amount_nzd, 0) : 0;
  
  // Format total expense (e.g. $1,234)
  const formattedExpense = `$${Math.round(totalExpense).toLocaleString()}`;

  return (
    <main className="page-wrapper" style={{ position: 'relative', overflow: 'hidden', minHeight: '100vh' }}>
      {/* ── Aurora Mesh Gradient Background ── */}
      <div className="aurora-bg">
        <div className="aurora-blob aurora-blob-1"></div>
        <div className="aurora-blob aurora-blob-2"></div>
        <div className="aurora-blob aurora-blob-3"></div>
      </div>
      
      {/* ── Main Content ── */}
      <div className="container" style={{ position: 'relative', zIndex: 1, paddingTop: '90px', paddingBottom: '80px' }}>
        
        {/* Hero Section */}
        <div style={{ textAlign: 'center', marginBottom: '80px', animation: 'fadeIn 1s ease-out' }}>
          <h1 className="home-hero-title">{trip?.name || '紐西蘭自助旅行'}</h1>
          <p className="home-hero-subtitle">{tripRange}</p>
        </div>

        {/* Stats Grid (Glassmorphism) */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
          gap: '24px', 
          marginBottom: '80px',
          animation: 'slideUp 0.8s ease-out 0.2s both'
        }}>
          <div className="aurora-glass stat-card">
            <div className="stat-number">{days}</div>
            <div className="stat-label">旅行天數 (Days)</div>
          </div>
          
          <div className="aurora-glass stat-card">
            <div className="stat-number">{citiesCount || 0}</div>
            <div className="stat-label">走訪城市 (Cities)</div>
          </div>

          <div className="aurora-glass stat-card">
            <div className="stat-number">{spotsCount || 0}</div>
            <div className="stat-label">打卡景點 (Spots)</div>
          </div>

          <div className="aurora-glass stat-card">
            <div className="stat-number">{formattedExpense}</div>
            <div className="stat-label">總花費 (NZD)</div>
          </div>
        </div>

        {/* Quick Links Navigation */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '24px',
          animation: 'slideUp 0.8s ease-out 0.4s both'
        }}>
          <Link href="/map" style={{ textDecoration: 'none' }}>
            <div className="aurora-glass card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
              <div style={{ fontSize: '40px' }}>🗺️</div>
              <h3>足跡地圖</h3>
              <p style={{ color: 'var(--text-secondary)', flex: 1 }}>探索我們走過的路線、住宿地點、與必吃美食。點擊標記還能查看當天日記與照片。</p>
              <div style={{ color: 'var(--color-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                打開地圖 <span>→</span>
              </div>
            </div>
          </Link>

          <Link href="/ledger" style={{ textDecoration: 'none' }}>
            <div className="aurora-glass card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
              <div style={{ fontSize: '40px' }}>📊</div>
              <h3>記帳分析</h3>
              <p style={{ color: 'var(--text-secondary)', flex: 1 }}>詳細的開銷明細與圖表分析，並且支援 AI 掃描收據直接記帳，看看錢都花去哪了。</p>
              <div style={{ color: 'var(--color-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                查看帳本 <span>→</span>
              </div>
            </div>
          </Link>

          <Link href="/gallery" style={{ textDecoration: 'none' }}>
            <div className="aurora-glass card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
              <div style={{ fontSize: '40px' }}>📸</div>
              <h3>回憶相冊</h3>
              <p style={{ color: 'var(--text-secondary)', flex: 1 }}>以無縫瀑布流展示高畫質照片，記錄每一刻壯麗的紐西蘭風景，支援原圖下載。</p>
              <div style={{ color: 'var(--color-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                瀏覽照片 <span>→</span>
              </div>
            </div>
          </Link>
        </div>

      </div>
    </main>
  );
}
