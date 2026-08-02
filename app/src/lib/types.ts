// 共用資料型別，對應 Supabase 資料表結構。
// 用來取代專案中原本大量使用的 `any`，讓 TypeScript 能real抓出欄位打錯字或誤用的問題。

export type SpotType = 'accommodation' | 'attraction' | 'restaurant' | 'other';

export type ExpenseCategory =
  | 'food'
  | 'transport'
  | 'accommodation'
  | 'learning'
  | 'leisure'
  | 'clothing'
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
  amount_nzd: number;
  category: ExpenseCategory;
  note: string | null;
}
