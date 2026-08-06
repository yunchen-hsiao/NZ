# 🥝 紐西蘭旅行記錄網站 — 詳細設計計畫

## 一、專案定位

- **目的**：記錄你和你妹在紐西蘭的生活（第一次：2026/6/26–7/28，後續旅程預留）
- **受眾**：半公開，主要供家人朋友瀏覽；你和你妹有管理員權限
- **部署**：Vercel（連接 GitHub Repo，免費自動部署）
- **語言**：繁體中文（主要內容）+ 英文 UI 標籤與按鈕

---

## 二、技術架構

| 層次 | 技術 |
|---|---|
| 前端框架 | **Next.js 15** (App Router) |
| 樣式 | **Vanilla CSS** + CSS Variables（支援冬/夏主題切換） |
| 地圖 | **Leaflet.js** + OpenStreetMap（免費） |
| 後端 / 資料庫 | **Supabase**（PostgreSQL + Auth） |
| 圖片儲存 | **Cloudinary**（免費 25GB，存原始圖片，支援下載） |
| OCR 收據辨識 | **Tesseract.js**（瀏覽器端本地執行，完全免費） |
| 圖表 | **Recharts**（React 圖表庫） |
| 部署 | **Vercel**（連接 GitHub 自動部署） |

---

## 三、頁面結構（導覽列）

```
首頁（/）  →  地圖（/map）  →  記帳（/ledger）  →  相冊（/gallery）
```

---

## 四、各頁面詳細說明

### 1. 首頁（Hero Section）

- **封面動畫**：冬天主題的雪花飄落粒子動畫（切換夏天主題時，改為陽光輻射動畫）
- **數字統計展示**：
  - 旅程天數（33 天）
  - 造訪城市數
  - 上傳照片數
  - 總花費（NZD）
- **快速入口卡片**：地圖頁 / 記帳頁 / 相冊
- **主題切換按鈕**（右上角）：❄️ 冬 / ☀️ 夏，切換時有流光過場動畫
- **匯率設定**（小工具）：可輸入當前 NZD→TWD 匯率，全站套用

---

### 2. 地圖頁（/map）

#### 兩層式互動地圖

**第一層：全紐西蘭地圖**
- 底圖：Leaflet.js + OpenStreetMap（衛星圖或清爽地圖樣式）
- **旅程軌跡**：折線連接各城市，不同旅次用不同顏色
  - Trip 1：藍色路線（2026/6–7）
  - Trip 2：橙色路線（預留，未啟用時隱藏）
- **左上角圖層切換開關**：可切換顯示/隱藏各次旅程的軌跡，以及篩選顯示的地點類型（住宿 / 景點 / 餐廳）
- **城市大標記**（點可點選）：Auckland、Rotorua、Taupo、Christchurch、Tekapo、Mt.Cook、Wanaka、Queenstown 等

**第二層：點選城市後放大**
- 地圖平滑縮放至該城市區域
- 顯示**所有地點標記**，依類型用不同圖示區分：
  - 🏠 住宿（如：Haka House Christchurch）
  - 📍 景點（如：基督城植物園、大教堂）
  - 🍽️ 餐廳（如：Seoul Tiger、牛肉河粉店）
  - 📌 其他
- 點選任一標記 → **彈出側欄** (Slide-in Sidebar) 顯示：
  - 地點名稱 + 類型標籤 + 日期
  - 照片輪播（多張，可下載原始檔）
  - 文字說明

> [!NOTE]
> **餐飲照片歸屬規則**：在住宿地點自煮的午餐/晚餐照片 → 掛在該天的住宿標記底下；外食的餐廳照片 → 掛在對應餐廳的標記底下。

#### 景點管理（管理員登入後可見）
- 新增地點（在地圖上點擊選定位置，選擇類型）
- 上傳照片（多張）+ 輸入說明文字 + 選擇日期
- 修改 / 刪除地點

---

### 3. 記帳頁（/ledger）

#### 旅次切換標籤
- 標籤切換：**Trip 1 | Trip 2（預留）**
- 每個旅次的資料獨立儲存

#### 子功能區塊

**A. 新增支出表單**

| 欄位 | 說明 |
|---|---|
| 日期 | 日期選擇器 |
| 店家名稱 | 文字輸入（如：Countdown、New World、餐廳名） |
| 商品名稱 | 文字輸入 |
| 金額（NZD） | 數字輸入 |
| 類別 | 下拉選單：食品 / 衣服 / 住宿 / 交通 / 學習 / 玩樂 |
| 備註 | 選填文字 |

**B. 收據 OCR 上傳（Tesseract.js）**
- 點擊「📷 拍照 / 上傳收據」按鈕
- 手機瀏覽器會調用相機（可即時拍照）
- Tesseract.js 本地辨識後，顯示辨識結果供確認
- 右側顯示原始圖片，左側可對照確認/修改各欄位
- 確認後一鍵儲存到資料庫

**C. 明細列表**
- 按**日期 + 店家**雙層分組顯示（同一天同一家店的項目收攏在一起）
- 篩選：日期範圍 / 店家 / 類別
- 可點選個別記錄進行修改 / 刪除

**D. 分析面板**
- **總計資訊欄**：總花費 NZD、折合台幣（套用首頁設定的匯率）
- **圓餅圖**：各類別（食品/衣服/住宿/交通/學習/玩樂）支出比例
- **商品比較圖**：同一商品（如：牛奶）在不同日期、不同店家的價格變化折線圖
  - 可搜尋商品名稱，動態顯示該商品的購買歷史與最低/最高價格標記

---

### 4. 相冊頁（/gallery）

- 所有景點照片的**瀑布流 / Grid 展示**
- 每張照片卡片顯示：縮圖 + 日期 + 地點（城市 + 景點名）
- 篩選：依城市、依日期範圍
- 點選照片 → 燈箱（Lightbox）全螢幕查看
- 燈箱內有**下載原始檔**按鈕（從 Cloudinary 下載高解析度）

---

## 五、身份驗證機制

- 使用 **Supabase Auth**（Email + 密碼）
- **訪客模式（無登入）**：可瀏覽所有內容，完全看不到任何編輯/上傳入口
- **管理員模式（你和你妹登入後）**：出現所有新增/修改/刪除功能
- **登入入口**：記帳頁的「上傳明細」區塊，點擊上傳按鈕時若未登入則觸發登入彈窗；地圖頁的「新增景點」按鈕同樣如此。訪客完全看不到這些按鈕的存在。
- **帳號管理**：只有你（管理員）持有 Supabase 帳號設定權限；你妹以獨立的 email 帳號登入網頁即可上傳，不需要接觸 Supabase 後台
- Row Level Security (RLS) 設定在 Supabase 端確保安全

---

## 六、主題設計系統

### 冬天主題（預設）
- 底色：`#FAFCFF`（雪白）
- 主色：`#4ECDC4`（冰藍綠）/ `#2D7DD2`（冰藍）
- 強調色：`#B8E0F7`（淡藍冰）
- 動畫：雪花飄落粒子效果（CSS + JS）

### 夏天主題（切換後）
- 底色：`#FFFBF0`（溫暖白）
- 主色：`#7CB85F`（草地綠）/ `#F4A261`（陽光橙）
- 強調色：`#FFD166`（向日葵黃）
- 動畫：光暈陽光輻射效果

### 切換動畫
- 全頁面 CSS 變數切換，搭配漸層流光過場（`clip-path` 或 `backdrop-filter` 動畫）

### 字型
- 標題：[Noto Serif TC](https://fonts.google.com/noto/specimen/Noto+Serif+TC)（典雅繁中）
- 內文：[Noto Sans TC](https://fonts.google.com/noto/specimen/Noto+Sans+TC)（清晰易讀）
- 數字/英文：[Inter](https://fonts.google.com/specimen/Inter)

---

## 七、資料庫結構（Supabase）

### `trips`（旅次）
| 欄位 | 類型 |
|---|---|
| id | UUID |
| name | text（如：紐西蘭第一次 2026） |
| start_date | date |
| end_date | date |
| color | text（路線顏色 hex） |
| created_at | timestamp |

### `cities`（城市）
| 欄位 | 類型 |
|---|---|
| id | UUID |
| trip_id | UUID (FK) |
| name | text |
| lat | float |
| lng | float |
| order | integer（軌跡順序） |

### `spots`（地點，統一模型）
| 欄位 | 類型 | 說明 |
|---|---|---|
| id | UUID | |
| city_id | UUID (FK) | 所屬城市 |
| type | enum | `accommodation` / `attraction` / `restaurant` / `other` |
| name | text | 地點名稱（如：Haka House、基督城植物園、Seoul Tiger） |
| lat | float | 緯度 |
| lng | float | 經度 |
| visited_date | date | 到訪日期 |
| description | text | 文字說明 |
| stay_nights | integer | 僅住宿類型使用，記錄住了幾晚 |

### `photos`（照片）
| 欄位 | 類型 |
|---|---|
| id | UUID |
| spot_id | UUID (FK) |
| cloudinary_url | text（顯示用 URL） |
| cloudinary_public_id | text（用於刪除） |
| original_url | text（下載用高解析度 URL） |
| caption | text |
| created_at | timestamp |

### `expenses`（支出）
| 欄位 | 類型 |
|---|---|
| id | UUID |
| trip_id | UUID (FK) |
| date | date |
| store_name | text |
| item_name | text |
| amount_nzd | decimal |
| category | enum（food/shopping/accommodation/transport/learning/leisure） |
| note | text |
| created_at | timestamp |

---

## 八、響應式設計（RWD）

| 裝置 | 說明 |
|---|---|
| 手機（< 768px） | 地圖全螢幕，側欄從底部滑入；記帳表單單欄排列 |
| 平板（768–1024px） | 地圖 60% + 側欄 40% 並排 |
| 電腦（> 1024px） | 完整雙欄或三欄佈局 |

---

## 九、開發優先順序

1. ✅ 初始化 Next.js 專案 + Supabase 連接 + 基礎路由
2. ✅ 設計系統（CSS Variables + 冬/夏主題切換）
3. ✅ Supabase Auth 登入（管理員模式）
4. ✅ 地圖頁（全圖 + 城市軌跡 + 景點標記 + 側欄）
5. ✅ 相冊頁（Cloudinary 圖片展示 + 燈箱 + 下載）
6. ✅ 記帳頁（新增/列表/刪除 + OCR）
7. ✅ 分析面板（Recharts 圖表）
8. ✅ 首頁（Hero + 統計數字動畫）
9. ✅ RWD 調整 + 部署 Vercel

---

## 十、已確認決策紀錄

| 問題 | 決定 |
|---|---|
| Supabase 專案 | 全新建立，執行時會提供建立步驟 |
| Cloudinary 帳號 | 全新建立，執行時會提供註冊與設定 API Key 的步驟 |
| 行程.md 初始匯入 | ✅ 自動匯入城市與景點座標作為初始資料，之後可在網頁前端進行修改/新增/刪除 |
| 相冊頁照片來源 | 與地圖頁**共用同一份照片**（照片掛在景點下），相冊為統一展示介面 |
| 帳號管理方式 | 只有你接觸 Supabase 後台；你妹透過網頁 email 登入即可上傳，不需要任何後台權限 |
