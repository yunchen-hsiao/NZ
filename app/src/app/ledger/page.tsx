'use client';

import { useState, useEffect } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend
} from 'recharts';
import { createClient } from '../../lib/supabase/client';
import AddExpenseModal from '../../components/AddExpenseModal';

const CATEGORY_COLORS = {
  food: '#86EFAC',
  transport: '#FCA5A5',
  accommodation: '#A5B4FC',
  learning: '#67E8F9',
  leisure: '#F9A8D4',
  clothing: '#C4B5FD',
  other: '#94A3B8',
};

const CATEGORY_LABELS = {
  food: '飲食',
  transport: '交通',
  accommodation: '住宿',
  learning: '學習/體驗',
  leisure: '娛樂',
  clothing: '購物',
  other: '其他',
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

  const totalExpense = expenses.reduce((sum, e) => sum + e.amount_nzd, 0);

  // Group by Date -> store_name
  const groupedExpenses = expenses.reduce((acc, curr) => {
    if (!acc[curr.date]) acc[curr.date] = {};
    if (!acc[curr.date][curr.store_name]) acc[curr.date][curr.store_name] = [];
    acc[curr.date][curr.store_name].push(curr);
    return acc;
  }, {} as Record<string, Record<string, typeof expenses>>);

  // Chart Data
  const chartData = (
    Object.entries(
      expenses.reduce((acc, curr) => {
        acc[curr.category] = (acc[curr.category] || 0) + curr.amount_nzd;
        return acc;
      }, {} as Record<string, number>)
    ) as [string, number][]
  ).map(([name, value]) => ({
    name: CATEGORY_LABELS[name as keyof typeof CATEGORY_LABELS] || name,
    value: isConverted ? value * exchangeRate : value,
    key: name,
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
        <div className="spinner" style={{ margin: '0 auto' }} />
        <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>載入記帳資料中...</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '96px 24px 48px', animation: 'fadeIn 0.5s ease' }}>

      {/* ── Header ── */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginBottom: '48px',
          gap: '24px',
        }}
      >
        <div>
          {/* Badge */}
          <div style={{ marginBottom: '12px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                borderRadius: '9999px',
                border: '1px solid var(--border-strong)',
                background: 'var(--bg-surface)',
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--color-accent)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              ✦ 旅途記帳
            </span>
          </div>
          <h1 style={{ fontSize: '32px', marginBottom: '6px', letterSpacing: '-0.02em' }}>
            記帳與分析
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            追蹤每一筆旅途開銷，不放過任何一塊錢
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '32px', flexWrap: 'wrap' }}>
          {/* Exchange Rate Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label className="form-label">自訂匯率 (NZD → TWD)</label>
            <div style={{ position: 'relative' }}>
              <input
                type="number"
                className="form-input"
                placeholder="輸入匯率 (留空顯示紐幣)"
                value={exchangeRateStr}
                onChange={(e) => setExchangeRateStr(e.target.value)}
                style={{ width: '210px' }}
              />
              {isConverted && (
                <span
                  style={{
                    position: 'absolute', right: '12px', top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '11px', color: 'var(--color-accent)', fontWeight: 700,
                    letterSpacing: '0.05em',
                  }}
                >
                  已轉換
                </span>
              )}
            </div>
          </div>

          {/* Total */}
          <div
            className="aurora-glass"
            style={{
              padding: '16px 24px',
              borderRadius: 'var(--radius-lg)',
              textAlign: 'right',
              minWidth: '160px',
            }}
          >
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              總花費 ({isConverted ? 'TWD' : 'NZD'})
            </div>
            <div
              className="stat-number"
              style={{ fontSize: '32px', marginBottom: 0, marginTop: '4px' }}
            >
              {currencySymbol}{formatAmount(totalExpense)}
            </div>
          </div>
        </div>
      </div>

      {/* ── Dashboard Grid ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px',
          marginBottom: '48px',
        }}
      >
        {/* Chart Card */}
        <div className="aurora-glass card" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '18px', margin: 0 }}>分類佔比</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Recharts
            </span>
          </div>
          <div style={{ height: '240px', width: '100%' }}>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CATEGORY_COLORS[entry.key as keyof typeof CATEGORY_COLORS] || CATEGORY_COLORS.other}
                        opacity={0.85}
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    formatter={(value) => {
                      const numVal = typeof value === 'number' ? value : 0;
                      return [
                        `${currencySymbol}${isConverted ? Math.round(numVal).toLocaleString() : numVal.toFixed(2)}`,
                        '金額',
                      ] as [string, string];
                    }}
                    contentStyle={{
                      borderRadius: '10px',
                      border: '1px solid var(--glass-border)',
                      boxShadow: 'var(--shadow-md)',
                      backgroundColor: 'var(--bg-elevated)',
                      color: 'var(--text-primary)',
                    }}
                  />
                  <Legend
                    layout="vertical"
                    verticalAlign="middle"
                    align="right"
                    wrapperStyle={{ fontSize: '12px', color: 'var(--text-secondary)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                暫無資料
              </div>
            )}
          </div>
        </div>

        {/* Scan / Add Card */}
        <div className="aurora-glass card" style={{ padding: '28px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '18px', margin: 0 }}>新增記帳</h3>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => { setEditingExpense(null); setIsAddModalOpen(true); }}
            >
              手動新增
            </button>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px', lineHeight: 1.6 }}>
            上傳超市或餐廳的收據照片，AI 將自動辨識日期、店家與金額，幫你快速記帳。
          </p>

          {/* Drop Zone */}
          <div
            onClick={handleScanClick}
            style={{
              flex: 1,
              border: `1.5px dashed ${isScanning ? 'var(--color-primary)' : 'var(--border-strong)'}`,
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              cursor: 'pointer',
              background: isScanning ? 'rgba(99,102,241,0.06)' : 'var(--bg-surface)',
              transition: 'all var(--transition-med)',
              position: 'relative',
              overflow: 'hidden',
              minHeight: '160px',
            }}
          >
            {isScanning ? (
              <>
                <div className="spinner" />
                <span style={{ color: 'var(--color-primary-light)', fontWeight: 500, fontSize: '14px' }}>
                  AI 辨識中...
                </span>
              </>
            ) : (
              <>  
                <div style={{ fontSize: '32px', opacity: 0.5, display: 'flex', justifyContent: 'center' }}>
                  {/* Upload icon */}
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ color: 'var(--text-muted)' }}>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                <div style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '14px' }}>
                  點擊上傳或拖曳照片
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  支援 JPG、PNG、HEIC
                </div>
              </>
            )}

            {/* Animated border glow */}
            {!isScanning && (
              <div
                style={{
                  position: 'absolute', inset: 0,
                  boxShadow: 'inset 0 0 0 1px var(--glow-primary)',
                  borderRadius: 'inherit',
                  animation: 'glowPulse 2.5s ease-in-out infinite',
                  pointerEvents: 'none',
                  opacity: 0.4,
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* ── Expense List ── */}
      <div style={{ marginBottom: '32px' }}>
        <div className="section-header">
          <h3 className="section-title">明細清單</h3>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => { setEditingExpense(null); setIsAddModalOpen(true); }}
          >
            + 新增
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>
        {Object.keys(groupedExpenses)
          .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
          .map(date => (
            <div key={date}>
              {/* Date Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  paddingBottom: '12px',
                  marginBottom: '16px',
                  borderBottom: '1px solid var(--glass-border)',
                }}
              >
                <div
                  style={{
                    width: '4px',
                    height: '20px',
                    background: 'linear-gradient(180deg, var(--color-primary), var(--color-accent))',
                    borderRadius: '2px',
                    flexShrink: 0,
                    boxShadow: '0 0 8px var(--glow-primary)',
                  }}
                />
                <span
                  style={{
                    fontSize: '17px',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {date}
                </span>

                {/* Day subtotal */}
                <span style={{ marginLeft: 'auto', fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>
                  {currencySymbol}{formatAmount(
                    Object.values(groupedExpenses[date])
                      .flat()
                      .reduce((s: number, e: any) => s + e.amount_nzd, 0)
                  )}
                </span>
              </div>

              {/* Shops for that date */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingLeft: '16px' }}>
                {Object.keys(groupedExpenses[date]).map(shop => (
                  <div key={shop} className="aurora-glass card" style={{ padding: '18px 22px' }}>
                    {/* Shop name */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '14px',
                      }}
                    >
                      <div style={{ fontWeight: 600, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {/* Store SVG icon */}
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ color: 'var(--color-primary-light)', flexShrink: 0 }}>
                          <path d="M3 9l1-6h16l1 6" />
                          <path d="M3 9a2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0" />
                          <path d="M5 9v12h14V9" />
                          <path d="M9 21v-6h6v6" />
                        </svg>
                        {shop}
                      </div>
                    </div>

                    {/* Line items */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {groupedExpenses[date][shop].map((exp: any) => (
                        <div
                          key={exp.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '8px 0',
                            borderBottom: '1px solid var(--glass-border)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span className={`badge badge-${exp.category}`}>
                              {CATEGORY_LABELS[exp.category as keyof typeof CATEGORY_LABELS] || exp.category}
                            </span>
                            <div>
                              <span style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500 }}>
                                {exp.item_name}
                              </span>
                              {exp.note && (
                                <span
                                  style={{
                                    display: 'block',
                                    fontSize: '12px',
                                    color: 'var(--text-muted)',
                                    marginTop: '2px',
                                  }}
                                >
                                  {exp.note}
                                </span>
                              )}
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div
                              style={{
                                fontWeight: 700,
                                fontFamily: 'Inter, monospace',
                                fontSize: '15px',
                                color: 'var(--text-primary)',
                              }}
                            >
                              {currencySymbol}{formatAmount(exp.amount_nzd)}
                            </div>
                            <button
                              className="btn btn-ghost btn-sm"
                              style={{ padding: '4px 10px', fontSize: '12px' }}
                              onClick={() => { setEditingExpense(exp); setIsAddModalOpen(true); }}
                            >
                              編輯
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Shop subtotal */}
                    <div
                      style={{
                        marginTop: '12px',
                        paddingTop: '10px',
                        textAlign: 'right',
                        fontSize: '13px',
                        color: 'var(--text-muted)',
                      }}
                    >
                      店家小計：
                      <span style={{ fontWeight: 700, color: 'var(--color-primary-light)', marginLeft: '4px' }}>
                        {currencySymbol}{formatAmount(
                          groupedExpenses[date][shop].reduce((sum: number, e: any) => sum + e.amount_nzd, 0)
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

        {expenses.length === 0 && !loading && (
          <div
            className="aurora-glass"
            style={{
              textAlign: 'center',
              color: 'var(--text-muted)',
              padding: '64px 0',
              borderRadius: 'var(--radius-xl)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px', opacity: 0.35 }}>
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 12V22H4V12" />
                <path d="M22 7H2v5h20V7z" />
                <path d="M12 22V7" />
                <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
                <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
              </svg>
            </div>
            <p style={{ fontSize: '16px', color: 'var(--text-secondary)', fontWeight: 500 }}>
              還沒有任何記帳紀錄
            </p>
          </div>
        )}
      </div>

      <AddExpenseModal
        isOpen={isAddModalOpen}
        onClose={() => { setIsAddModalOpen(false); setEditingExpense(null); }}
        onSuccess={handleAddSuccess}
        tripId={tripId}
        initialData={editingExpense}
      />
    </div>
  );
}
