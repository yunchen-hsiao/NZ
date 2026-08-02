# Progress Log — 變更紀錄

> 用途：記錄每次由 AI 協助進行的程式碼修改，方便追蹤「改了什麼、為什麼改、影響哪些檔案」。
> 完整的問題盤點與待辦狀態請見 [`implementation.md`](./implementation.md)；本檔案只記錄實際變更的時間軸。

---

## 2026-08-02 — 全專案問題盤點 + 第一輪修復

### 背景
遍歷整個 `nz-travel` repo（`app/` Next.js 專案、`data/`、`scripts/`、README、git 狀態），列出安全性、程式碼品質、依賴與內容一致性四大類問題，寫成 `implementation.md`，再依優先順序實作可自動修復的部分。

### 變更摘要

**安全性**
- `app/src/app/ledger/page.tsx`：新增 `session` state（`supabase.auth.getSession()` + `onAuthStateChange` 訂閱），「手動新增」「+ 新增」「編輯」三個寫入操作按鈕改成 `{session && (...)}` 條件渲染，行為對齊 `gallery`、`map` 頁面既有的權限顯示邏輯。

**型別安全**
- 新增 `app/src/lib/types.ts`：定義 `Trip`、`City`、`Spot`、`Photo`、`Expense`、`SpotType`、`ExpenseCategory` 型別，對應 Supabase 的 `trips`/`cities`/`spots`/`photos`/`expenses` 資料表。
- 套用至 `ledger/page.tsx`、`gallery/page.tsx`、`AddExpenseModal.tsx`、`MapComponent.tsx`、`SpotFormModal.tsx`、`UploadPhotoModal.tsx`，移除所有 `any`（約 15 處）。
- `session` 相關 state 改用 `@supabase/supabase-js` 匯出的 `Session` 型別。

**React Hooks 規則修正**（`react-hooks/set-state-in-effect`、`react-hooks/exhaustive-deps`）
- `fetchExpenses`（ledger）、`fetchPhotos`（gallery）、`loadData`（MapComponent）改寫為 `useCallback` 包裝、回傳 `supabase...then(...)` 形式，setState 移到非同步 callback 內執行，effect 依賴陣列補齊。
- `AddExpenseModal.tsx`、`UploadPhotoModal.tsx` 原本用 `useEffect` 把 `initialData`/`isOpen` 同步進 state（reset-effect 模式），改為讓父元件（`ledger/page.tsx` 用 `key` prop、`gallery/page.tsx` 改為條件渲染）在開啟時重新掛載元件，直接用 `useState` 初始值取代，徹底移除該 effect。`UploadPhotoModal` 因此拿掉 `isOpen` prop。
- `ThemeProvider.tsx`（讀 `localStorage` 還原主題）、`Particles.tsx`（SSR hydration 用的 mounted-gate）維持同步 `setState`，但這是官方文件承認的有效例外，加上精確對齊觸發行的 `eslint-disable-next-line react-hooks/set-state-in-effect` 註解及理由說明。

**`next/image` 遷移**
- `app/next.config.ts`：新增 `images.remotePatterns`，允許 `res.cloudinary.com`。
- `MapComponent.tsx` 側欄照片、`gallery/page.tsx` 燈箱大圖改用 `next/image`。
- `gallery/page.tsx` 瀑布流縮圖**刻意保留** `<img>`：masonry 排版依賴每張照片原本不同的長寬比，`photos` 資料表未儲存寬高，強制套用 `next/image` 會需要固定尺寸或裁切，破壞版面效果；已加註解說明並保留 `eslint-disable-next-line`。

**死代碼清理**
- 刪除 `app/src/app/page.module.css`（`create-next-app` 模板殘留，未被任何檔案引用）。
- 刪除 `app/src/components/ui/Button.tsx`、`app/src/components/ui/Card.tsx`（未被任何頁面引用；`ui/Sidebar.tsx` 因為有實際使用而保留）。
- 移除 `app/src/app/page.tsx` 中未使用的 `IconNZ` 函式。
- `UploadPhotoModal.tsx` 的 `catch (err: any)` 改為 `catch (err)` + `err instanceof Error` 型別窄化。

### 驗證結果
```
npm run lint   → 0 errors, 0 warnings（修復前：23 errors, 6 warnings）
npm run build  → Compiled successfully, TypeScript 檢查通過，7 個路由全部產生成功
```

### 修改的檔案
| 類型 | 檔案 |
|---|---|
| 新增 | `app/src/lib/types.ts` |
| 新增 | `implementation.md` |
| 修改 | `app/src/app/ledger/page.tsx` |
| 修改 | `app/src/app/gallery/page.tsx` |
| 修改 | `app/src/app/page.tsx` |
| 修改 | `app/next.config.ts` |
| 修改 | `app/src/components/AddExpenseModal.tsx` |
| 修改 | `app/src/components/UploadPhotoModal.tsx` |
| 修改 | `app/src/components/MapComponent.tsx` |
| 修改 | `app/src/components/SpotFormModal.tsx` |
| 修改 | `app/src/components/ThemeProvider.tsx` |
| 修改 | `app/src/components/Particles.tsx` |
| 刪除 | `app/src/app/page.module.css` |
| 刪除 | `app/src/components/ui/Button.tsx` |
| 刪除 | `app/src/components/ui/Card.tsx` |

### 未處理項目（需使用者決策，詳見 `implementation.md` 第五節）
- 補齊資料庫 schema / RLS 的 SQL 檔案（目前 repo 中完全沒有）
- `data/` 目錄目前被 `.gitignore` 排除，是否要納入版控
- `tesseract.js`、`cloudinary`（server SDK）兩個已安裝但未使用的依賴，是否移除
- 大量 inline style 的重構（範圍大，未執行）
- 是否要將本次與先前既有的未 commit 變更一併 commit

---

## 2026-08-02 — README 更新 + 建立本進度紀錄檔

### 變更摘要
- `README.md`：
  - 技術棧章節更新為 Next.js 16（原寫 15），補充 `next/image` 用於讀取 Cloudinary 遠端圖片、`app/src/lib/types.ts` 共用型別定義的說明。
  - 「資料庫初始化」章節加上明確警語：repo 內目前沒有 Schema/RLS 建置 SQL，`data/` 目錄未納入版控，新 clone 專案不會有 seed 檔案；並列出各資料表的欄位結構，供手動建置參考。
  - 「專案結構」章節更新為實際目錄（`app/src/lib/` 內含 `supabase/`、`cloudinary.ts`、`types.ts`；新增 `implementation.md`、`progress.md` 的說明）。
  - 「權限管理」章節補充說明地圖/相冊/記帳三頁的寫入按鈕都已改為登入才顯示。
  - 新增「已知限制」段落，列出 OCR 掃描尚未串接、資料庫腳本待補齊，並連結 `implementation.md`、`progress.md`。
- 新增 `progress.md`（本檔案）：記錄每次修改的變更紀錄時間軸。

### 修改的檔案
| 類型 | 檔案 |
|---|---|
| 修改 | `README.md` |
| 新增 | `progress.md` |
