// 雙幣別（NZD / TWD）記帳的共用計算與顯示邏輯。
//
// 規則（對應使用者需求）：
// - 一筆支出如果「紐幣、台幣都有記錄」→ 計算總額時算作台幣（因為那通常是
//   實際刷卡/收據上的真實台幣金額，比用當天歷史匯率概算更準確）。
// - 一筆支出如果「只有紐幣」→ 計算總額時算作紐幣。
// - 一筆支出如果「只有台幣」（例如出發前在台灣就付掉的機票、裝備）→ 算作台幣。
// - 個別項目顯示時，有記錄的幣別都會顯示出來（例如 "NZ$25.75 + NT$466"）。
// - 使用者可以切換成「全部換算成台幣」模式：這時只有紐幣的項目會用當天的
//   歷史匯率（exchange_rates 表）概算成台幣，並在數字前加 "≈" 表示是估算值；
//   本來就有台幣紀錄的項目則直接採用真實金額，不會被覆蓋。

import type { Expense, ExchangeRate } from './types';

// 大部分計算只需要日期 + 兩個金額欄位，讓呼叫端可以只 select 需要的欄位
// （例如首頁只需要算總花費，不需要抓 store_name/item_name/category 等）。
type ExpenseAmountFields = Pick<Expense, 'date' | 'amount_nzd' | 'amount_twd'>;

export interface SplitTotal {
  /** 只有紐幣紀錄的支出加總（NZD） */
  nzd: number;
  /** 有台幣紀錄的支出加總（TWD，不論該筆是否也有紐幣紀錄） */
  twd: number;
}

/** 把 exchange_rates 查詢結果轉成 `date -> rate` 的 Map，方便查找。 */
export function buildRateMap(rates: ExchangeRate[]): Map<string, number> {
  return new Map(rates.map((r) => [r.date, r.nzd_to_twd]));
}

/**
 * 查詢某天的 NZD -> TWD 匯率。若當天沒有資料（例如記帳日期在已抓取的匯率
 * 範圍之外），改用時間上最接近的已知匯率概算，避免因為缺一天資料就整筆無法顯示。
 */
export function lookupRate(date: string, rateMap: Map<string, number>): number | null {
  if (rateMap.size === 0) return null;
  const exact = rateMap.get(date);
  if (exact !== undefined) return exact;

  let closestDate: string | null = null;
  let closestDiff = Infinity;
  const target = new Date(date).getTime();
  for (const key of rateMap.keys()) {
    const diff = Math.abs(new Date(key).getTime() - target);
    if (diff < closestDiff) {
      closestDiff = diff;
      closestDate = key;
    }
  }
  return closestDate ? rateMap.get(closestDate) ?? null : null;
}

/**
 * 把單筆支出換算成台幣。
 * - 有 amount_twd：直接採用（真實金額，非估算）。
 * - 只有 amount_nzd：用當天（或最接近日期）的歷史匯率概算。
 * - 兩者都沒有：回傳 0（理論上不會發生，資料庫有 CHECK constraint 保證）。
 */
export function convertExpenseToTwd(
  expense: ExpenseAmountFields,
  rateMap: Map<string, number>
): { amount: number; isEstimated: boolean } {
  if (expense.amount_twd !== null) {
    return { amount: expense.amount_twd, isEstimated: false };
  }
  if (expense.amount_nzd !== null) {
    const rate = lookupRate(expense.date, rateMap);
    if (rate !== null) {
      return { amount: expense.amount_nzd * rate, isEstimated: true };
    }
  }
  // 沒有任何可用的歷史匯率（exchange_rates 還沒抓完，或完全沒有資料）。
  // 回傳 0 而不是誤植紐幣數字，避免顯示出一個看起來合理但單位錯誤的金額；
  // 呼叫端應該確保 exchange_rates 已載入完成才顯示「顯示為台幣」的結果。
  return { amount: 0, isEstimated: false };
}

/** 把一組支出換算成單一台幣總額（供「顯示為台幣」模式使用）。 */
export function sumAsTwd(expenses: ExpenseAmountFields[], rateMap: Map<string, number>): number {
  return expenses.reduce((sum, e) => sum + convertExpenseToTwd(e, rateMap).amount, 0);
}

/** 依照「有台幣就算台幣，只有紐幣才算紐幣」規則，把一組支出拆成兩個小計。 */
export function splitTotal(expenses: ExpenseAmountFields[]): SplitTotal {
  return expenses.reduce(
    (acc, e) => {
      if (e.amount_twd !== null) {
        acc.twd += e.amount_twd;
      } else if (e.amount_nzd !== null) {
        acc.nzd += e.amount_nzd;
      }
      return acc;
    },
    { nzd: 0, twd: 0 }
  );
}

export function formatNZD(amount: number): string {
  return `NZ$${amount.toFixed(2)}`;
}

export function formatTWD(amount: number, estimated = false): string {
  return `${estimated ? '≈' : ''}NT$${Math.round(amount).toLocaleString()}`;
}

/** 單筆支出的顯示字串，例如 "NZ$25.75 + NT$466" / "NZ$12.00" / "NT$500"。 */
export function formatExpenseAmount(expense: Pick<Expense, 'amount_nzd' | 'amount_twd'>): string {
  const parts: string[] = [];
  if (expense.amount_nzd !== null) parts.push(formatNZD(expense.amount_nzd));
  if (expense.amount_twd !== null) parts.push(formatTWD(expense.amount_twd));
  return parts.join(' / ') || '—';
}

/** 一組支出的小計顯示字串（日期小計、店家小計、總花費皆可用）。 */
export function formatSplitTotal(totals: SplitTotal): string {
  const parts: string[] = [];
  if (totals.nzd > 0) parts.push(formatNZD(totals.nzd));
  if (totals.twd > 0) parts.push(formatTWD(totals.twd));
  return parts.join(' + ') || formatNZD(0);
}

// ---------------------------------------------------------------------------
// 行前預付 vs 旅途中在地消費
// ---------------------------------------------------------------------------
// 資料上的判斷依據：出發前在台灣就付掉的項目（機票、簽證、學費、預訂住宿、
// 預訂行程）只會有台幣金額，不會有紐幣金額；而旅途中在紐西蘭的消費一定會有
// 紐幣金額（可能同時附上刷卡的真實台幣金額）。
//
// 這個拆分很重要：預付項目金額大、又全部集中在同一天（出發前），如果跟日常
// 消費混在一起，日均花費和每日趨勢都會失真，分類佔比也會被學費之類的大額
// 項目吃掉。

/** 這筆是否為出發前就付掉的預付項目（只有台幣金額、沒有紐幣金額）。 */
export function isPrepaid(expense: Pick<Expense, 'amount_nzd' | 'amount_twd'>): boolean {
  return expense.amount_nzd === null && expense.amount_twd !== null;
}

/** 把支出拆成「行前預付」與「旅途中在地消費」兩組。 */
export function partitionByPrepaid<T extends Pick<Expense, 'amount_nzd' | 'amount_twd'>>(
  expenses: T[]
): { prepaid: T[]; onsite: T[] } {
  const prepaid: T[] = [];
  const onsite: T[] = [];
  for (const e of expenses) {
    if (isPrepaid(e)) prepaid.push(e);
    else onsite.push(e);
  }
  return { prepaid, onsite };
}

export interface DailyTotal {
  date: string;
  /** 當天換算成台幣的總額 */
  twd: number;
  /** 只有紐幣紀錄的當天小計（NZD），用於 tooltip 顯示原始幣別 */
  nzd: number;
  /** 當天是否有任何一筆是用歷史匯率概算出來的 */
  isEstimated: boolean;
}

/**
 * 依日期彙總成每日花費（日期升冪），供趨勢圖使用。
 * 金額一律換算成台幣，因為混合幣別無法直接比較大小。
 */
export function buildDailyTotals(
  expenses: ExpenseAmountFields[],
  rateMap: Map<string, number>
): DailyTotal[] {
  const byDate = new Map<string, DailyTotal>();
  for (const e of expenses) {
    const { amount, isEstimated } = convertExpenseToTwd(e, rateMap);
    const entry = byDate.get(e.date) ?? { date: e.date, twd: 0, nzd: 0, isEstimated: false };
    entry.twd += amount;
    if (e.amount_twd === null && e.amount_nzd !== null) entry.nzd += e.amount_nzd;
    entry.isEstimated = entry.isEstimated || isEstimated;
    byDate.set(e.date, entry);
  }
  return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * 平均每日花費（台幣）。分母是「實際有消費紀錄的天數」而不是整段旅程天數，
 * 避免還沒發生的日期把平均值稀釋掉。
 */
export function averageDailyTwd(dailyTotals: DailyTotal[]): number {
  if (dailyTotals.length === 0) return 0;
  const sum = dailyTotals.reduce((acc, d) => acc + d.twd, 0);
  return sum / dailyTotals.length;
}
