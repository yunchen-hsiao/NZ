// 共用資料型別，對應 Supabase 資料表結構。
// 用來取代專案中原本大量使用的 `any`，讓 TypeScript 能real抓出欄位打錯字或誤用的問題。

export type SpotType = 'accommodation' | 'attraction' | 'restaurant' | 'other';

export type ExpenseCategory =
  | 'food'
  | 'transport'
  | 'accommodation'
  | 'learning'
  | 'leisure'
  | 'shopping'
  | 'other';

export interface Trip {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  created_at?: string;
}

export interface City {
  id: string;
  trip_id: string;
  name: string;
  order: number;
  lat: number;
  lng: number;
}

export interface Spot {
  id: string;
  city_id: string;
  type: SpotType;
  name: string;
  visited_date: string;
  description: string | null;
  lat: number;
  lng: number;
}

export interface Photo {
  id: string;
  spot_id: string;
  cloudinary_url: string;
  cloudinary_public_id: string;
  original_url: string | null;
  caption: string | null;
  created_at?: string;
  // 部分查詢會用 `select('*, spots(id, name, visited_date)')` 帶出關聯的 spot 資訊
  spots?: Pick<Spot, 'id' | 'name' | 'visited_date'> | null;
}

export interface Expense {
  id: string;
  trip_id: string;
  date: string;
  store_name: string;
  item_name: string;
  // 至少會有一個不是 null（由資料庫的 CHECK constraint 保證，
  // 見 data/migration_currency_and_rates.sql）。
  // - 只填 amount_nzd：代表這筆錢是用紐幣支付、沒有換算成台幣的紀錄。
  // - 只填 amount_twd：代表這筆是用台幣支付（例如台灣先刷卡的機票、裝備）。
  // - 兩者都填：代表這筆紐幣消費有實際換算/刷卡的台幣金額紀錄，
  //   計算總額時會優先採用這個「真實台幣金額」而不是用匯率換算。
  amount_nzd: number | null;
  amount_twd: number | null;
  category: ExpenseCategory;
  note: string | null;
}

// 每日 NZD -> TWD 歷史匯率，對應 `exchange_rates` 資料表。
// 由 scripts/fetch_exchange_rates.mjs 產生 seed SQL 匯入，
// 用於把只記錄紐幣金額的支出換算成台幣總計。
export interface ExchangeRate {
  date: string;
  nzd_to_twd: number;
  source?: string | null;
}
