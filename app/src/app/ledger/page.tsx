'use client';

import { useState, useEffect } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend
} from 'recharts';
import { createClient } from '../../lib/supabase/client';
import AddExpenseModal from '../../components/AddExpenseModal';

const CATEGORY_COLORS = {
  food: '#16A34A',
  transport: '#EA580C',
  accommodation: '#4F46E5',
  learning: '#0891B2',
  leisure: '#DB2777',
  clothing: '#9333EA',
  other: '#6B7280'
};

const CATEGORY_LABELS = {
  food: '飲食',
  transport: '交通',
  accommodation: '住宿',
  learning: '學習/體驗',
  leisure: '娛樂',
  clothing: '購物',
  other: '其他'
};

export default function LedgerPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [exchangeRateStr, setExchangeRateStr] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [tripId, setTripId] = useState<string | null>(null);

  const fetchExpenses = async () => {
    const supabase = createClient();
    
    let currentTripId = tripId;
    if (!currentTripId) {
      const { data: tripData } = await supabase.from('trips').select('id').limit(1).single();
      if (tripData) {
        currentTripId = tripData.id;
        setTripId(tripData.id);
      }
    }

    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false });
      
    if (data) setExpenses(data);
    if (error) console.error('Error fetching expenses:', error);
    setLoading(false);
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleAddSuccess = () => {
    setIsAddModalOpen(false);
    setEditingExpense(null);
    fetchExpenses();
  };

  // Exchange rate logic
  const exchangeRate = parseFloat(exchangeRateStr);
  const isConverted = !isNaN(exchangeRate) && exchangeRate > 0;
  const currencySymbol = isConverted ? 'NT$' : 'NZ$';

  const formatAmount = (amount: number) => {
    const finalAmount = isConverted ? amount * exchangeRate : amount;
    return isConverted ? Math.round(finalAmount).toLocaleString() : finalAmount.toFixed(2);
  };

  // Group by Date -> store_name
  const groupedExpenses = expenses.reduce((acc, curr) => {
    if (!acc[curr.date]) acc[curr.date] = {};
    if (!acc[curr.date][curr.store_name]) acc[curr.date][curr.store_name] = [];
    acc[curr.date][curr.store_name].push(curr);
    return acc;
  }, {} as Record<string, Record<string, typeof expenses>>);

  // Chart Data preparation
  const chartData = Object.entries(
    expenses.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount_nzd;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ 
    name: CATEGORY_LABELS[name as keyof typeof CATEGORY_LABELS] || name, 
    value: isConverted ? value * exchangeRate : value, 
    key: name 
  }));

  const handleScanClick = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      alert('模擬 OCR 掃描完成！(之後會串接 Tesseract.js 解析收據文字)');
    }, 2000);
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '96px 24px 32px', textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto' }}></div>
        <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>載入記帳資料中...</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '96px 24px 32px', animation: 'fadeIn 0.5s ease' }}>
      
      {/* Header Section */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px', gap: '24px' }}>
        <div>
          <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>記帳與分析</h1>
          <p style={{ color: 'var(--text-secondary)' }}>追蹤每一筆旅途開銷，不放過任何一塊錢 💸</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '32px' }}>
          {/* Exchange Rate Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>自訂匯率 (NZD 對 TWD)</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="number" 
                className="form-input" 
                placeholder="輸入匯率 (留空顯示紐幣)"
                value={exchangeRateStr}
                onChange={(e) => setExchangeRateStr(e.target.value)}
                style={{ width: '200px', background: 'var(--bg-card)' }}
              />
              {isConverted && (
                <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: 'var(--color-primary)', fontWeight: 600 }}>
                  已轉換
                </span>
              )}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>總花費 ({isConverted ? 'TWD' : 'NZD'})</div>
            <div className="stat-number" style={{ fontSize: '36px', color: 'var(--color-primary)' }}>
              {currencySymbol}{formatAmount(expenses.reduce((sum, e) => sum + e.amount_nzd, 0))}
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        
        {/* Chart Card */}
        <div className="aurora-glass card" style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '18px' }}>分類佔比</h3>
          <div style={{ height: '240px', width: '100%' }}>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.key as keyof typeof CATEGORY_COLORS] || CATEGORY_COLORS.other} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    formatter={(value: number) => [`${currencySymbol}${isConverted ? Math.round(value).toLocaleString() : value.toFixed(2)}`, '金額']}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-md)', backgroundColor: 'var(--bg-card)' }}
                  />
                  <Legend layout="vertical" verticalAlign="middle" align="right" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                暫無資料
              </div>
            )}
          </div>
        </div>

        {/* OCR Scan Card */}
        <div className="aurora-glass card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '18px', margin: 0 }}>📷 掃描收據 (OCR)</h3>
            <button 
              className="btn btn-ghost btn-sm" 
              onClick={() => {
                setEditingExpense(null);
                setIsAddModalOpen(true);
              }}
            >手動新增</button>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
            上傳超市或餐廳的收據照片，AI 將自動辨識日期、店家與金額，幫你快速記帳。
          </p>
          
          <div 
            onClick={handleScanClick}
            style={{ 
              flex: 1, 
              border: '2px dashed var(--border-strong)', 
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              cursor: 'pointer',
              background: isScanning ? 'var(--bg-secondary)' : 'transparent',
              transition: 'all var(--transition-med)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {isScanning ? (
              <>
                <div className="spinner"></div>
                <span style={{ color: 'var(--color-primary)', fontWeight: 500, fontSize: '14px' }}>AI 辨識中...</span>
              </>
            ) : (
              <>
                <div style={{ fontSize: '32px' }}>📄</div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>點擊上傳或拖曳照片</div>
              </>
            )}

            {!isScanning && (
              <div style={{
                position: 'absolute', inset: 0, 
                boxShadow: 'inset 0 0 0 2px var(--color-primary-light)',
                borderRadius: 'inherit',
                animation: 'pulse 2s infinite',
                pointerEvents: 'none',
                opacity: 0.3
              }} />
            )}
          </div>
        </div>
      </div>

      {/* Expense List (Grouped by Date and Shop) */}
      <h3 style={{ marginBottom: '24px', fontSize: '20px' }}>明細清單</h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {Object.keys(groupedExpenses).sort((a, b) => new Date(b).getTime() - new Date(a).getTime()).map(date => (
          <div key={date}>
            <div style={{ 
              fontSize: '18px', fontWeight: 700, paddingBottom: '8px', 
              borderBottom: '2px solid var(--border-color)', marginBottom: '16px',
              color: 'var(--color-primary)'
            }}>
              🗓️ {date}
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingLeft: '12px' }}>
              {Object.keys(groupedExpenses[date]).map(shop => (
                <div key={shop} className="aurora-glass card" style={{ padding: '16px 20px' }}>
                  <div style={{ fontWeight: 600, marginBottom: '12px', fontSize: '15px' }}>🏪 {shop}</div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {groupedExpenses[date][shop].map(exp => (
                      <div key={exp.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span className={`badge badge-${exp.category}`}>
                            {CATEGORY_LABELS[exp.category as keyof typeof CATEGORY_LABELS] || exp.category}
                          </span>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500 }}>{exp.item_name}</span>
                            {exp.note && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{exp.note}</span>}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ fontWeight: 600, fontFamily: 'Inter, monospace' }}>
                            {currencySymbol}{formatAmount(exp.amount_nzd)}
                          </div>
                          <button 
                            className="btn btn-ghost btn-sm" 
                            style={{ padding: '4px 8px', fontSize: '12px', minHeight: 'unset', height: 'auto' }}
                            onClick={() => {
                              setEditingExpense(exp);
                              setIsAddModalOpen(true);
                            }}
                          >
                            編輯
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Shop Subtotal */}
                  <div style={{ 
                    marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed var(--border-color)', 
                    textAlign: 'right', fontSize: '13px', color: 'var(--text-muted)'
                  }}>
                    店家小計: <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {currencySymbol}{formatAmount(groupedExpenses[date][shop].reduce((sum, e) => sum + e.amount_nzd, 0))}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {expenses.length === 0 && !loading && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0' }}>
            沒有記帳紀錄
          </div>
        )}
      </div>

      <AddExpenseModal 
        isOpen={isAddModalOpen} 
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingExpense(null);
        }} 
        onSuccess={handleAddSuccess} 
        tripId={tripId} 
        initialData={editingExpense}
      />

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.02); opacity: 0.1; }
          100% { transform: scale(1); opacity: 0.5; }
        }
      `}} />
    </div>
  );
}
