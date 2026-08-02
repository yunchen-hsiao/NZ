# NZ Travel Journal (紐西蘭自由行旅遊日誌) 🇳🇿

這是一個專為記錄紐西蘭自由行打造的全端動態旅遊日誌網站。專案採用極具質感的「極光玻璃 (Aurora Glassmorphism)」設計語彙，並深度整合了地圖、記帳、相冊與動態資料庫，讓你完美封存旅途中的每一份回憶與每一筆花費。

## ✨ 主要功能 (Features)

- 📊 **首頁儀表板 (Dashboard)**：即時連動資料庫，自動計算旅行天數、走訪城市、打卡景點數與總花費。
- 🗺️ **足跡地圖 (Interactive Map)**：
  - 基於 Leaflet 打造的動態地圖。
  - 將景點分為「住宿、景點、餐廳、其他」，點擊標記即可滑出專屬資訊側欄。
  - 結合真實座標 (Lat/Lng) 重現旅途軌跡。
- 💸 **記帳分析 (Ledger)**：
  - 詳細記錄每一筆開銷（支援綁定至特定日期與店家）。
  - 自動生成消費分類圓餅圖（使用 Recharts）。
  - 支援動態匯率轉換（輸入紐幣對台幣匯率，全站金額一鍵切換）。
  - 管理員專屬「新增支出」極光表單。
- 📸 **回憶相冊 (Gallery)**：
  - 響應式瀑布流 (Masonry) 排版，並支援全螢幕燈箱 (Lightbox) 原圖下載。
  - 透過「下拉選單」依據打卡景點過濾照片。
  - **直接上傳**：管理員可直接在網頁端將照片上傳至 Cloudinary 雲端並寫入資料庫。

## 🛠️ 技術棧 (Tech Stack)

- **框架**: Next.js 16 (App Router)
- **樣式**: Vanilla CSS (純 CSS 實作所有版面與極光玻璃特效，**無** Tailwind CSS)
- **資料庫與驗證**: Supabase (@supabase/supabase-js, @supabase/ssr)
- **圖片儲存**: Cloudinary（前端 unsigned upload 直傳 + `next/image` 讀取遠端圖片）
- **地圖**: Leaflet.js (`react-leaflet`)
- **圖表**: Recharts
- **型別**: TypeScript，共用資料型別定義於 `app/src/lib/types.ts`（對應 Supabase 的 `trips`/`cities`/`spots`/`photos`/`expenses` 資料表）

## 🚀 快速開始 (Getting Started)

### 1. 安裝依賴
請確保你已安裝 Node.js (v18+)，然後在專案根目錄下執行：
```bash
cd app
npm install
```

### 2. 環境變數設定
在 `app` 目錄下建立 `.env.local` 檔案，並填入你的 Supabase 與 Cloudinary 金鑰：
```env
NEXT_PUBLIC_SUPABASE_URL=你的_Supabase_Project_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的_Supabase_Anon_Key

NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=你的_Cloudinary_Cloud_Name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=nz_travel_upload
CLOUDINARY_API_KEY=你的_API_Key
CLOUDINARY_API_SECRET=你的_API_Secret
```

### 3. 資料庫初始化 (Supabase)
> ⚠️ **注意**：目前 repo 中**沒有**現成的 Table Schema / RLS 建置 SQL 檔案，且 `data/` 目錄已被 `.gitignore` 排除、不在版本控制內。若你是全新 clone 這個專案，下方兩份 seed 檔案不會存在，需要自行建立 Schema 後手動整理資料（或向專案維護者索取）。詳細追蹤狀態請見 `implementation.md` 的 1.2 / 1.3 項目。

1. 依照下列資料表結構在 Supabase 建立 Table 與 Row Level Security (RLS)（可參考 `data/implementation_plan1.md`、`data/implementation_plan2.md` 的設計文件，或現有程式碼中 `app/src/lib/types.ts` 定義的欄位）：
   - `trips`（id, name, start_date, end_date）
   - `cities`（id, trip_id, name, order, lat, lng）
   - `spots`（id, city_id, type, name, visited_date, description, lat, lng）
   - `photos`（id, spot_id, cloudinary_url, cloudinary_public_id, original_url, caption）
   - `expenses`（id, trip_id, date, store_name, item_name, amount_nzd, category, note）
   - RLS 政策：所有表格允許 `SELECT`（Public 可讀），`INSERT`/`UPDATE`/`DELETE` 僅限已登入的 Authenticated 使用者。
2. 若你本機有 `data/seed_itinerary.sql` 與 `data/seed_expenses.sql`（非新 clone 情境），可在 Supabase 的 SQL Editor 中執行以匯入預設的行程與記帳資料。

### 4. 啟動開發伺服器
```bash
npm run dev
```
打開瀏覽器前往 [http://localhost:3000](http://localhost:3000) 即可看到你的專屬紐西蘭旅遊日誌！

## 📂 專案結構

```
nz-travel/
├── app/                     # Next.js 16 主程式目錄
│   ├── src/
│   │   ├── app/             # App Router (首頁, /map, /gallery, /ledger)
│   │   ├── components/      # 共用 UI 元件 (MapComponent, Navbar, Modals, ui/Sidebar)
│   │   └── lib/             # Supabase 封裝 (supabase/client.ts, supabase/server.ts)、
│   │                        # Cloudinary 上傳 (cloudinary.ts)、共用型別定義 (types.ts)
│   ├── public/              # 靜態資源與全域 CSS (globals.css)
│   └── package.json
├── data/                    # SQL Seed 檔案（未納入版本控制，見上方注意事項）
├── scripts/                 # Markdown 解析腳本 (將筆記轉為 SQL)
├── implementation.md        # 專案問題盤點與修復計畫（含各項目狀態追蹤）
└── progress.md              # 每次修改的變更紀錄
```

## 🔐 權限管理 (RLS)
此專案嚴格遵守 Supabase 的 Row Level Security (RLS) 政策：
- **訪客 (Public)**：可自由瀏覽首頁、地圖、記帳統計與相冊。
- **管理員 (Authenticated)**：擁有新增、編輯與上傳照片的權限。地圖、相冊、記帳三個頁面的寫入操作按鈕（新增地點、上傳照片、新增/編輯支出）都只在偵測到登入 session 時才會顯示；未登入時完全隱藏，前後端行為一致。

管理員登入帳號請透過 Supabase Auth 後台建立，網站右上角「管理員登入」按鈕使用 Email + 密碼登入。

## 📌 已知限制 (Known Limitations)

- **收據 OCR 掃描**（記帳頁）目前僅為 UI 示意動畫，尚未串接 `tesseract.js` 進行實際文字辨識。
- **資料庫 Schema / RLS 建置腳本**尚未整理成可重現的 SQL 檔案，需依照上方「資料庫初始化」章節手動建立。
- 詳細的問題盤點、修復狀態與後續待辦，請參考：
  - [`implementation.md`](./implementation.md) — 問題清單與各項目的處理狀態
  - [`progress.md`](./progress.md) — 逐次變更紀錄

---
*Safe travels and enjoy your journey in New Zealand!* 🇳🇿🚗✨
