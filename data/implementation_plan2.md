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
| UI 外掛技能 | **ui-ux-pro-max** (自動化高質感設計系統生成) |
| 地圖 | **Leaflet.js** + OpenStreetMap（免費） |
| 後端 / 資料庫 | **Supabase**（PostgreSQL + Auth） |
| 圖片儲存 | **Cloudinary**（免費 25GB，存原始圖片，支援下載） |
| OCR 收據辨識 | **Tesseract.js**（瀏覽器端本地執行，完全免費） |
| 圖表 | **Recharts**（React 圖表庫） |
| 部署 | **Vercel**（連接 GitHub 自動部署） |

---

## 三、主題設計系統 (Aurora UI 極光玻璃風)

導入 **Aurora UI** 視覺風格，以「南極光」為靈感，結合紐西蘭冬/夏雙主題，創造富有生命力的現代介面。

### 1. 核心風格理念
- **動態極光漸層 (Mesh Gradient)**：作為背景或 Hero 區塊基底，提供柔和流動的色彩變化。
- **毛玻璃擬物化 (Glassmorphism)**：使用半透明背景 + 背景模糊 (`backdrop-filter: blur`) 作為主要卡片與浮動面板材質。
- **發光效果 (Luminous glow)**：滑鼠懸停 (Hover) 元素時，帶出符合當前主題的柔和光暈。

### 2. 冬天主題（預設 - 冰雪極光）
- 底色：`#FAFCFF`（雪白）
- 主色：`#2D7DD2`（冰藍） / `#4ECDC4`（極光綠）
- 發光色：`#B8E0F7`（淡藍冰）
- 動畫：極光冷色漸層流動 + 雪花飄落粒子效果

### 3. 夏天主題（切換後 - 暖陽光暈）
- 底色：`#FFFBF0`（溫暖白）
- 主色：`#2E9E5B`（草地綠） / `#F4A261`（陽光橙）
- 發光色：`#FFD166`（向日葵黃）
- 動畫：溫暖夕陽漸層 + 光暈陽光輻射效果

### 4. 字型配置
- 標題：[Noto Serif TC](https://fonts.google.com/noto/specimen/Noto+Serif+TC)（典雅繁中）
- 內文：[Noto Sans TC](https://fonts.google.com/noto/specimen/Noto+Sans+TC)（清晰易讀）
- 數字/英文：[Inter](https://fonts.google.com/specimen/Inter) 或 Fira Code（用於數據儀表板）

---

## 四、各頁面 UI 細節規劃

### 1. 首頁（Hero Section）
- **滿版動態背景**：CSS Mesh Gradient 極光漸層。
- **懸浮數據卡片 (Glassmorphism)**：展示旅程天數、城市數、照片數、總花費。卡片採用半透明毛玻璃材質，滑過時有邊緣發光效果。
- **快速入口**：地圖頁 / 記帳頁 / 相冊的導航卡片。

### 2. 地圖頁（/map）
- **兩層式互動地圖**：Leaflet.js 底圖，限制拖曳範圍於紐西蘭。
- **玻璃風控制面板**：左上角的圖層過濾器使用毛玻璃設計。
- **專屬圖示 (Custom Icons)**：住宿(🏠)、景點(📍)、餐廳(🍽️)、其他(📌)，帶有圓形外框與微陰影。
- **滑出式側邊欄**：點擊地點標記後，平滑滑出帶有景點細節與照片輪播的側邊欄。

### 3. 記帳分析頁（/ledger）
- **Aurora Dashboard**：數據儀表板風格，Recharts 圖表線條帶有螢光感 (Luminous line charts)。
- **收據 OCR 掃描區塊**：帶有脈衝動畫 (Pulse animation) 的上傳按鈕，提示可互動。
- **明細列表**：按日期+店家雙層分組，每一行在 Hover 時會有極光色的細微漸變高亮。

### 4. 相冊頁（/gallery）
- **無縫瀑布流 (Masonry Grid)**：照片不規則錯落排列。
- **Hover 發光特效**：滑鼠移入照片，卡片邊緣會散發符合冬/夏主題的光暈，並微微放大 (Scale 1.05)。
- **燈箱 (Lightbox)**：全螢幕高畫質檢視，提供 Cloudinary 原始檔下載。

---

## 五、資料庫與權限架構 (Supabase)

- **訪客模式**：可瀏覽地圖、相冊、首頁，但看不到編輯按鈕。
- **管理員模式**：透過 Navbar 登入後，可新增/編輯/刪除地點、上傳照片、掃描收據記帳。
- **核心資料表**：`trips` (旅次), `cities` (城市), `spots` (地點), `photos` (照片), `expenses` (支出)。使用 RLS (Row Level Security) 確保只有 authenticated 角色能修改資料。
