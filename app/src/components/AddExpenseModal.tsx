'use client';

import { useState } from 'react';
import { createClient } from '../lib/supabase/client';
import type { Expense, ExpenseCategory } from '../lib/types';

type AddExpenseModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tripId: string | null;
  initialData?: Expense | null;
};

const CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: 'food', label: '飲食' },
  { value: 'transport', label: '交通' },
  { value: 'accommodation', label: '住宿' },
  { value: 'learning', label: '學習/體驗' },
  { value: 'leisure', label: '娛樂' },
  { value: 'shopping', label: '購物' },
  { value: 'other', label: '其他' }
];

export default function AddExpenseModal({ isOpen, onClose, onSuccess, tripId, initialData }: AddExpenseModalProps) {
  // The parent (ledger page) remounts this component with a fresh `key`
  // whenever it's opened for a new entry or a different expense, so the
  // initial state below can be derived directly from props during the
  // initial render instead of being synced via a `useEffect`.
  const [date, setDate] = useState(initialData?.date ?? new Date().toISOString().split('T')[0]);
  const [storeName, setStoreName] = useState(initialData?.store_name ?? '');
  const [itemName, setItemName] = useState(initialData?.item_name ?? '');
  const [amountNzd, setAmountNzd] = useState(initialData?.amount_nzd?.toString() ?? '');
  const [amountTwd, setAmountTwd] = useState(initialData?.amount_twd?.toString() ?? '');
  const [category, setCategory] = useState<ExpenseCategory>(initialData?.category ?? 'food');
  const [note, setNote] = useState<string>(initialData?.note ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tripId) {
      setError('找不到旅次資料，請稍後再試。');
      return;
    }
    if (!date || !storeName || !itemName) {
      setError('請填寫所有必填欄位。');
      return;
    }
    if (!amountNzd && !amountTwd) {
      setError('紐幣金額與台幣金額至少要填一個。');
      return;
    }

    setIsSubmitting(true);
    setError('');

    const supabase = createClient();
    let saveError = null;

    const payload = {
      date,
      store_name: storeName,
      item_name: itemName,
      amount_nzd: amountNzd ? parseFloat(amountNzd) : null,
      amount_twd: amountTwd ? parseFloat(amountTwd) : null,
      category,
      note
    };

    if (initialData) {
      const { error } = await supabase.from('expenses').update(payload).eq('id', initialData.id);
      saveError = error;
    } else {
      const { error } = await supabase.from('expenses').insert({ trip_id: tripId, ...payload });
      saveError = error;
    }

    setIsSubmitting(false);

    if (saveError) {
      setError('儲存失敗：' + saveError.message);
    } else {
      onSuccess(); // Trigger refetch
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      backdropFilter: 'blur(8px)',
      animation: 'fadeIn 0.3s ease'
    }}>
      <div className="aurora-glass card" style={{ 
        width: '100%', 
        maxWidth: '480px', 
        padding: '32px',
        position: 'relative'
      }}>
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--text-secondary)' }}
        >
          &times;
        </button>
        
        <h2 style={{ fontSize: '24px', marginBottom: '24px', color: 'var(--text-primary)' }}>{initialData ? '編輯支出 ✏️' : '新增支出 💸'}</h2>

        {error && (
          <div style={{ padding: '12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '14px', fontWeight: 600 }}>日期 *</label>
            <input type="date" className="form-input" value={date} onChange={e => setDate(e.target.value)} required />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '14px', fontWeight: 600 }}>分類 *</label>
            <select className="form-input" value={category} onChange={e => setCategory(e.target.value as ExpenseCategory)} required>
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: 600 }}>紐幣金額 (NZD)</label>
              <input type="number" step="0.01" min="0" className="form-input" placeholder="0.00" value={amountNzd} onChange={e => setAmountNzd(e.target.value)} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: 600 }}>台幣金額 (TWD)</label>
              <input type="number" step="1" min="0" className="form-input" placeholder="0" value={amountTwd} onChange={e => setAmountTwd(e.target.value)} />
            </div>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '-8px' }}>
            兩者至少填一個。若這筆有實際刷卡/收據上的台幣金額，建議兩個都填，計算總花費時會直接採用台幣金額。
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '14px', fontWeight: 600 }}>店家名稱 *</label>
            <input type="text" className="form-input" placeholder="例如：Countdown 超市" value={storeName} onChange={e => setStoreName(e.target.value)} required />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '14px', fontWeight: 600 }}>品項名稱 *</label>
            <input type="text" className="form-input" placeholder="例如：買牛奶跟零食" value={itemName} onChange={e => setItemName(e.target.value)} required />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '14px', fontWeight: 600 }}>備註 (選填)</label>
            <input type="text" className="form-input" placeholder="例如：這餐有夠難吃" value={note} onChange={e => setNote(e.target.value)} />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={isSubmitting}
            style={{ marginTop: '12px', width: '100%', padding: '12px', fontSize: '16px' }}
          >
            {isSubmitting ? '儲存中...' : (initialData ? '確認修改' : '確認新增')}
          </button>
        </form>
      </div>
    </div>
  );
}
