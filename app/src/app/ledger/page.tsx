'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ReferenceLine
} from 'recharts';
import type { Session } from '@supabase/supabase-js';
import { createClient } from '../../lib/supabase/client';
import AddExpenseModal from '../../components/AddExpenseModal';
import type { Expense, ExpenseCategory, ExchangeRate } from '../../lib/types';
import {
  averageDailyTwd,
  buildDailyTotals,
  buildRateMap,
  convertExpenseToTwd,
  formatExpenseAmount,
  formatSplitTotal,
  formatTWD,
  partitionByPrepaid,
  splitTotal,
  sumAsTwd,
} from '../../lib/money';

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  food: '#86EFAC',
  transport: '#FCA5A5',
  accommodation: '#A5B4FC',
  learning: '#67E8F9',
  leisure: '#F9A8D4',
  shopping: '#C4B5FD',
  other: '#94A3B8',
};

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  food: '飲食',
  transport: '交通',
  accommodation: '住宿',
  learning: '學習/體驗',
  leisure: '娛樂',
  shopping: '購物',
  other: '其他',
};

// 花費範圍：行前預付（出發前在台灣付掉的機票/學費/住宿預訂等）與旅途中的
// 在地消費金額量級差很多，分開看才有意義。
type SpendScope = 'all' | 'onsite' | 'prepaid';

const SCOPE_LABELS: Record<SpendScope, string> = {
  all: '全部',
  onsite: '旅途中消費',
  prepaid: '行前預付',
};

type SortOrder = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';

const SORT_LABELS: Record<SortOrder, string> = {
  'date-desc': '日期（新到舊）',
  'date-asc': '日期（舊到新）',
  'amount-desc': '金額（高到低）',
  'amount-asc': '金額（低到高）',
};

export default function LedgerPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [ratesLoaded, setRatesLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  // 「顯示為台幣」開關：關閉時維持「有台幣就算台幣、只有紐幣就算紐幣」的預設拆分顯示；
  // 開啟時全部換算成單一台幣總額（只有紐幣的項目用當天歷史匯率概算）。
  const [showAsTwd, setShowAsTwd] = useState(false);
  // 明細篩選條件
  const [scope, setScope] = useState<SpendScope>('all');
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | 'all'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [keyword, setKeyword] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('date-desc');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [tripId, setTripId] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  // Bumped every time the add/edit modal is opened so it fully remounts with
  // fresh initial state instead of relying on a reset-effect inside it.
  const [modalKey, setModalKey] = useState(0);

  const fetchExpenses = useCallback(() => {
    const supabase = createClient();
    return supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false })
      .then(({ data, error }) => {
        if (data) setExpenses(data);
        if (error) console.error('Error fetching expenses:', error);
        setLoading(false);
      });
  }, []);

  // 每日歷史匯率只需要抓一次（資料本身不會隨著支出增減而改變）。
  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('exchange_rates')
      .select('*')
      .then(({ data, error }) => {
        if (data) setRates(data);
        if (error) console.error('Error fetching exchange rates:', error);
        setRatesLoaded(true);
      });
  }, []);

  const rateMap = useMemo(() => buildRateMap(rates), [rates]);

  // Fetch the trip id once on mount (needed when inserting new expenses).
  // Written as an inline `.then()` chain (same style as Navbar's session
  // check) so the state update happens inside a deferred callback rather
  // than synchronously in the effect body.
  useEffect(() => {
    const supabase = createClient();
    supabase.from('trips').select('id').limit(1).single().then(({ data }) => {
      if (data) setTripId(data.id);
    });
  }, []);

  // Check admin session so write actions (新增/編輯) are only shown to
  // logged-in users, matching the pattern already used on /gallery and /map.
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Data fetching on mount (fetchExpenses only sets state inside its
  // deferred `.then()` callback, not synchronously, so this doesn't trip
  // react-hooks/set-state-in-effect).
  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const openAddModal = () => {
    setEditingExpense(null);
    setModalKey((k) => k + 1);
    setIsAddModalOpen(true);
  };

  const openEditModal = (exp: Expense) => {
    setEditingExpense(exp);
    setModalKey((k) => k + 1);
    setIsAddModalOpen(true);
  };

  const handleAddSuccess = () => {
    setIsAddModalOpen(false);
    setEditingExpense(null);
    fetchExpenses();
  };

  // ── 篩選 ──────────────────────────────────────────────────────────────
  // 所有統計（總額、分類佔比、每日趨勢）都基於篩選後的結果，
  // 這樣切換條件時上方數字與下方明細永遠是一致的。
  const filteredExpenses = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return expenses.filter((e) => {
      if (scope === 'onsite' && e.amount_nzd === null) return false;
      if (scope === 'prepaid' && e.amount_nzd !== null) return false;
      if (categoryFilter !== 'all' && e.category !== categoryFilter) return false;
      if (dateFrom && e.date < dateFrom) return false;
      if (dateTo && e.date > dateTo) return false;
      if (kw) {
        const haystack = `${e.store_name} ${e.item_name} ${e.note ?? ''}`.toLowerCase();
        if (!haystack.includes(kw)) return false;
      }
      return true;
    });
  }, [expenses, scope, categoryFilter, dateFrom, dateTo, keyword]);

  const isFiltering =
    scope !== 'all' || categoryFilter !== 'all' || !!dateFrom || !!dateTo || !!keyword.trim();

  const resetFilters = () => {
    setScope('all');
    setCategoryFilter('all');
    setDateFrom('');
    setDateTo('');
    setKeyword('');
    setSortOrder('date-desc');
  };

  // ── 行前預付 vs 旅途中在地消費 ────────────────────────────────────────
  // 預付項目（機票、學費、住宿預訂）金額大且集中在出發前同一天，
  // 混在一起會讓日均與每日趨勢完全失真，所以拆開統計。
  const { prepaid, onsite } = useMemo(
    () => partitionByPrepaid(filteredExpenses),
    [filteredExpenses]
  );

  const prepaidTwd = useMemo(() => sumAsTwd(prepaid, rateMap), [prepaid, rateMap]);
  const onsiteTwd = useMemo(() => sumAsTwd(onsite, rateMap), [onsite, rateMap]);
  const onsiteSplit = useMemo(() => splitTotal(onsite), [onsite]);

  // 每日趨勢只看在地消費，避免行前預付把單日金額拉成一根遮住其他天的長條。
  const dailyTotals = useMemo(() => buildDailyTotals(onsite, rateMap), [onsite, rateMap]);
  const avgDailyTwd = averageDailyTwd(dailyTotals);
  const maxDaily = dailyTotals.reduce(
    (max, d) => (d.twd > max.twd ? d : max),
    { date: '', twd: 0, nzd: 0, isEstimated: false }
  );

  // Group by Date -> store_name（依排序條件決定日期順序）
  const groupedExpenses = filteredExpenses.reduce((acc, curr) => {
    if (!acc[curr.date]) acc[curr.date] = {};
    if (!acc[curr.date][curr.store_name]) acc[curr.date][curr.store_name] = [];
    acc[curr.date][curr.store_name].push(curr);
    return acc;
  }, {} as Record<string, Record<string, Expense[]>>);

  const sortedDates = Object.keys(groupedExpenses).sort((a, b) => {
    if (sortOrder === 'date-asc') return a.localeCompare(b);
    if (sortOrder === 'date-desc') return b.localeCompare(a);
    // 金額排序：比較該日換算成台幣的總額
    const sumOf = (date: string) =>
      sumAsTwd(Object.values(groupedExpenses[date]).flat(), rateMap);
    return sortOrder === 'amount-desc' ? sumOf(b) - sumOf(a) : sumOf(a) - sumOf(b);
  });

  // 總花費：預設拆分顯示（NZ$xx + NT$xx），開啟「顯示為台幣」後改成單一台幣總額。
  const totalSplit = splitTotal(filteredExpenses);
  const totalAsTwd = sumAsTwd(filteredExpenses, rateMap);
  // 只要有任何一筆是靠歷史匯率概算出來的（而非真實台幣金額），總額就標記為估算值。
  const totalIsEstimated = filteredExpenses.some(
    (e) => e.amount_twd === null && e.amount_nzd !== null
  );

  // Chart Data：一律換算成台幣顯示佔比（金額本身混合幣別無法直接加總比較），
  // 只有紐幣的支出用歷史匯率概算。
  const chartData = Object.entries(
    filteredExpenses.reduce((acc, curr) => {
      const { amount } = convertExpenseToTwd(curr, rateMap);
      acc[curr.category] = (acc[curr.category] || 0) + amount;
      return acc;
    }, {} as Record<ExpenseCategory, number>)
  ).map(([name, value]) => ({
    name: CATEGORY_LABELS[name as ExpenseCategory] || name,
    value,
    key: name,
  }));

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
          <h1 style={{ fontSize: '32px', marginBottom: '6px', letterSpacing: '-0.02em' }}>
            記帳與分析
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            追蹤每一筆旅途開銷，不放過任何一塊錢
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '32px', flexWrap: 'wrap' }}>
          {/* Currency display toggle */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label className="form-label">顯示方式</label>
            <label
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 14px', borderRadius: 'var(--radius-md)',
                border: '1px solid var(--glass-border)', background: 'var(--bg-surface)',
                cursor: 'pointer', fontSize: '13px', color: 'var(--text-secondary)',
                userSelect: 'none',
              }}
            >
              <input
                type="checkbox"
                checked={showAsTwd}
                disabled={!ratesLoaded}
                onChange={(e) => setShowAsTwd(e.target.checked)}
              />
              全部顯示為台幣{!ratesLoaded && '（匯率載入中...）'}
            </label>
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
              {isFiltering ? '篩選後金額' : '總花費'}
            </div>
            <div
              className="stat-number"
              style={{ fontSize: '32px', marginBottom: 0, marginTop: '4px' }}
            >
              {showAsTwd ? formatTWD(totalAsTwd, totalIsEstimated) : formatSplitTotal(totalSplit)}
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
                      return [formatTWD(numVal), '金額'] as [string, string];
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

        {/* 花費結構：行前預付 vs 旅途中消費 */}
        <div className="aurora-glass card" style={{ padding: '28px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '18px', margin: 0 }}>花費結構</h3>
            {session && (
              <button className="btn btn-ghost btn-sm" onClick={openAddModal}>
                手動新增
              </button>
            )}
          </div>

          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px', lineHeight: 1.6 }}>
            機票、學費、住宿預訂等出發前就付掉的費用金額大且集中在同一天，
            拆開後才看得出旅途中實際的花錢速度。
          </p>

          {/* 比例條 */}
          <div
            style={{
              display: 'flex',
              height: '10px',
              borderRadius: '999px',
              overflow: 'hidden',
              background: 'var(--bg-surface)',
              marginBottom: '20px',
            }}
            role="img"
            aria-label={`行前預付 ${formatTWD(prepaidTwd)}，旅途中消費 ${formatTWD(onsiteTwd)}`}
          >
            {prepaidTwd > 0 && (
              <div style={{ width: `${(prepaidTwd / (prepaidTwd + onsiteTwd)) * 100}%`, background: '#A5B4FC' }} />
            )}
            {onsiteTwd > 0 && (
              <div style={{ width: `${(onsiteTwd / (prepaidTwd + onsiteTwd)) * 100}%`, background: '#86EFAC' }} />
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#A5B4FC' }} />
                行前預付
              </div>
              <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'Inter, monospace' }}>
                {formatTWD(prepaidTwd)}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {prepaid.length} 筆
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#86EFAC' }} />
                旅途中消費
              </div>
              <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'Inter, monospace' }}>
                {showAsTwd ? formatTWD(onsiteTwd, true) : formatSplitTotal(onsiteSplit)}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {onsite.length} 筆
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: 'auto',
              paddingTop: '16px',
              borderTop: '1px solid var(--glass-border)',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
            }}
          >
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                平均每日（{dailyTotals.length} 天）
              </div>
              <div style={{ fontSize: '17px', fontWeight: 700, color: 'var(--color-primary-light)', fontFamily: 'Inter, monospace' }}>
                {formatTWD(avgDailyTwd, true)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                最高單日
              </div>
              <div style={{ fontSize: '17px', fontWeight: 700, fontFamily: 'Inter, monospace' }}>
                {maxDaily.date ? formatTWD(maxDaily.twd, true) : '—'}
              </div>
              {maxDaily.date && (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {maxDaily.date}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── 每日花費趨勢 ── */}
      <div className="aurora-glass card" style={{ padding: '28px', marginBottom: '48px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px', flexWrap: 'wrap', gap: '8px' }}>
          <h3 style={{ fontSize: '18px', margin: 0 }}>旅途中每日花費</h3>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            虛線為平均值 {formatTWD(avgDailyTwd, true)}
          </span>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px' }}>
          只包含旅途中的在地消費（已排除行前預付項目），金額統一換算成台幣比較。
        </p>

        <div style={{ height: '260px', width: '100%' }}>
          {dailyTotals.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyTotals} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                  tickFormatter={(d: string) => d.slice(5)}
                  interval="preserveStartEnd"
                  stroke="var(--glass-border)"
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                  tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
                  stroke="var(--glass-border)"
                />
                <RechartsTooltip
                  formatter={(value) => {
                    const numVal = typeof value === 'number' ? value : 0;
                    return [formatTWD(numVal, true), '當日花費'] as [string, string];
                  }}
                  contentStyle={{
                    borderRadius: '10px',
                    border: '1px solid var(--glass-border)',
                    boxShadow: 'var(--shadow-md)',
                    backgroundColor: 'var(--bg-elevated)',
                    color: 'var(--text-primary)',
                  }}
                />
                {avgDailyTwd > 0 && (
                  <ReferenceLine
                    y={avgDailyTwd}
                    stroke="var(--color-accent)"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                  />
                )}
                <Bar dataKey="twd" radius={[4, 4, 0, 0]}>
                  {dailyTotals.map((d) => (
                    <Cell
                      key={d.date}
                      // 超過平均的日子用強調色，一眼看出哪幾天花超過
                      fill={d.twd > avgDailyTwd ? '#FCA5A5' : '#86EFAC'}
                      opacity={0.85}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              沒有符合條件的在地消費
            </div>
          )}
        </div>
      </div>

      {/* ── Expense List ── */}
      <div style={{ marginBottom: '20px' }}>
        <div className="section-header">
          <h3 className="section-title">明細清單</h3>
          {session && (
            <button
              className="btn btn-primary btn-sm"
              onClick={openAddModal}
            >
              + 新增
            </button>
          )}
        </div>
      </div>

      {/* ── 篩選器 ── */}
      <div className="aurora-glass card" style={{ padding: '20px 22px', marginBottom: '28px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '14px',
            alignItems: 'end',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label className="form-label" htmlFor="filter-keyword">關鍵字</label>
            <input
              id="filter-keyword"
              type="search"
              className="form-input"
              placeholder="店家、品項、備註"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label className="form-label" htmlFor="filter-scope">花費範圍</label>
            <select
              id="filter-scope"
              className="form-input"
              value={scope}
              onChange={(e) => setScope(e.target.value as SpendScope)}
            >
              {(Object.keys(SCOPE_LABELS) as SpendScope[]).map((s) => (
                <option key={s} value={s}>{SCOPE_LABELS[s]}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label className="form-label" htmlFor="filter-category">分類</label>
            <select
              id="filter-category"
              className="form-input"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as ExpenseCategory | 'all')}
            >
              <option value="all">全部分類</option>
              {(Object.keys(CATEGORY_LABELS) as ExpenseCategory[]).map((c) => (
                <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label className="form-label" htmlFor="filter-date-from">起始日期</label>
            <input
              id="filter-date-from"
              type="date"
              className="form-input"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label className="form-label" htmlFor="filter-date-to">結束日期</label>
            <input
              id="filter-date-to"
              type="date"
              className="form-input"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label className="form-label" htmlFor="filter-sort">排序</label>
            <select
              id="filter-sort"
              className="form-input"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as SortOrder)}
            >
              {(Object.keys(SORT_LABELS) as SortOrder[]).map((s) => (
                <option key={s} value={s}>{SORT_LABELS[s]}</option>
              ))}
            </select>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            marginTop: '16px',
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            符合條件 <strong style={{ color: 'var(--color-primary-light)' }}>{filteredExpenses.length}</strong> 筆
            {isFiltering && `（共 ${expenses.length} 筆）`}
          </span>
          {isFiltering && (
            <button className="btn btn-ghost btn-sm" onClick={resetFilters}>
              清除篩選
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>
        {sortedDates
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
                  {(() => {
                    const dayExpenses = Object.values(groupedExpenses[date]).flat();
                    return showAsTwd
                      ? formatTWD(sumAsTwd(dayExpenses, rateMap))
                      : formatSplitTotal(splitTotal(dayExpenses));
                  })()}
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
                      {groupedExpenses[date][shop].map((exp: Expense) => (
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
                              {CATEGORY_LABELS[exp.category] || exp.category}
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
                              {showAsTwd
                                ? formatTWD(convertExpenseToTwd(exp, rateMap).amount, convertExpenseToTwd(exp, rateMap).isEstimated)
                                : formatExpenseAmount(exp)}
                            </div>
                            {session && (
                              <button
                                className="btn btn-ghost btn-sm"
                                style={{ padding: '4px 10px', fontSize: '12px' }}
                                onClick={() => openEditModal(exp)}
                              >
                                編輯
                              </button>
                            )}
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
                        {showAsTwd
                          ? formatTWD(sumAsTwd(groupedExpenses[date][shop], rateMap))
                          : formatSplitTotal(splitTotal(groupedExpenses[date][shop]))}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

        {filteredExpenses.length === 0 && !loading && (
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
              {isFiltering ? '沒有符合篩選條件的紀錄' : '還沒有任何記帳紀錄'}
            </p>
            {isFiltering && (
              <button className="btn btn-ghost btn-sm" style={{ marginTop: '16px' }} onClick={resetFilters}>
                清除篩選
              </button>
            )}
          </div>
        )}
      </div>

      <AddExpenseModal
        key={modalKey}
        isOpen={isAddModalOpen}
        onClose={() => { setIsAddModalOpen(false); setEditingExpense(null); }}
        onSuccess={handleAddSuccess}
        tripId={tripId}
        initialData={editingExpense}
      />
    </div>
  );
}
