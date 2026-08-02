# NZ Travel Journal — 問題盤點與改善計畫 (Implementation Plan)

> 產生時間：2026-08-02（最後更新：修復實作完成後）
> 範圍：整個 repo（`app/` Next.js 專案、`data/`、`scripts/`、README、git 狀態）
> 方法：閱讀所有原始碼、設定檔、SQL seed、README，並執行 `npm run lint`、`npm run build`、`git status`/`git diff` 驗證。

狀態圖例：`[ ]` 待處理　`[x]` 已完成　`[-]` 決議不處理 / 需使用者確認

> **本輪修復結果**：`npm run lint` 與 `npm run build` 皆已通過（0 error / 0 warning）。詳見第五節「本輪自動修復範圍總結」。

---

## 一、安全性相關 (Security)

### 1.1 `ledger` 頁面缺少登入檢查 — 🔴 高優先
- **問題**：`app/src/app/ledger/page.tsx` 的「手動新增」「+ 新增」「編輯」按鈕永遠顯示，沒有比對 `session`。
- **對比**：`gallery/page.tsx` 與 `MapComponent.tsx` 都有讀取 `supabase.auth.getSession()` 並只在登入時顯示寫入操作按鈕，`ledger` 頁面沒有做一樣的事。
- **風險**：訪客會看到可以操作的按鈕，填完表單送出才發現被 RLS 擋下，體驗不一致，也可能誤導使用者以為此頁沒有權限保護。
- **修復方向**：在 `ledger/page.tsx` 加入 `session` state 與 `getSession()`/`onAuthStateChange` 訂閱，未登入時隱藏新增/編輯按鈕（比照 `gallery` 頁面的既有模式）。
- **狀態**：`[x]` 已完成 — `ledger/page.tsx` 新增 `session` state，「手動新增」「+ 新增」「編輯」三個按鈕都改成 `{session && (...)}` 條件渲染。

### 1.2 README 提及的資料庫 schema / RLS 建置文件不存在 — 🟠 中優先
- **問題**：README 寫「請參考 `.agents/skills/` 或是過去生成的 `supabase_setup_guide.md`」，但整個 repo 搜尋不到 `supabase_setup_guide.md`，也沒有任何 `CREATE TABLE` / `CREATE POLICY` 的 SQL 檔案。`data/` 下只有兩份 seed data（`seed_itinerary.sql`、`seed_expenses.sql`）。
- **風險**：資料庫結構與 RLS 政策完全沒有落地成可重現的檔案，換一台機器或新協作者無法重建環境，也無法驗證 RLS 是否真的照文件設定執行。
- **修復方向**：需使用者提供目前 Supabase 專案的實際 schema/RLS 設定（或授權透過 Supabase CLI/MCP 匯出），才能補上對應 SQL 檔案。**此項需要使用者確認資訊來源，本次不在自動修復範圍內。**
- **狀態**：`[-]`（需使用者提供資料庫現況才能處理）

### 1.3 `data/` 整個目錄被 `.gitignore` 排除，導致 README 步驟失效 — 🟠 中優先
- **問題**：根目錄 `.gitignore` 有一行 `data`，導致 `data/seed_itinerary.sql`、`data/seed_expenses.sql` 都沒有進版本控制（`git ls-files data` 為空）。但 README 的「資料庫初始化」步驟要求執行這兩份檔案。
- **風險**：新協作者 clone 下來後找不到這兩份檔案，README 步驟無法照做。
- **修復方向**：確認這兩份 seed SQL 是否含敏感資料（目前看過內容，僅為公開的行程/開銷紀錄，不含金鑰或個資），若無敏感資訊建議從 `.gitignore` 中移除 `data` 這一行、將 seed 檔案加入版本控制；`implementation_plan1.md`/`implementation_plan2.md` 屬設計文件，可一併決定是否保留於版控。**此項變更 `.gitignore` 範圍，需使用者確認是否要公開這些旅遊/花費紀錄。**
- **狀態**：`[-]`（需使用者確認是否要將 `data/` 納入版控）

### 1.4 Cloudinary Secret 使用方式 — 🟢 觀察，暫無需修復
- **問題**：`.env.local` 中的 `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` 目前程式碼完全沒有引用（走的是前端 unsigned upload preset 直傳），沒有洩漏風險，但要留意：未來若要做簽名上傳、刪除雲端圖片等操作，必須透過 server-side API route 使用這兩個 secret，不能被打包進前端 bundle。
- **狀態**：`[-]`（無需修復，僅記錄提醒）

---

## 二、程式碼品質 (Lint / Build)

執行 `npm run lint` 結果：**23 個 error、6 個 warning**。`npm run build` 可以成功（tsc 型別檢查未擋下這些問題，因為多屬 ESLint 規則）。

### 2.1 大量使用 `any`（`@typescript-eslint/no-explicit-any`，約 15 處）— 🟠 中優先
- **位置**：`ledger/page.tsx`、`gallery/page.tsx`、`AddExpenseModal.tsx`、`MapComponent.tsx`、`SpotFormModal.tsx`、`UploadPhotoModal.tsx` 的 state（`expenses`, `photos`, `spots`, `initialData`, `session` 等）。
- **風險**：型別保護完全失效，欄位打錯字或存取不存在屬性都不會被 TS 抓到。
- **修復方向**：新增共用型別檔（如 `src/lib/types.ts`），定義 `Trip`、`City`、`Spot`、`Photo`、`Expense` 對應 Supabase 資料表欄位，取代所有 `any`。
- **狀態**：`[x]` 已完成 — 新增 `app/src/lib/types.ts`（`Trip`/`City`/`Spot`/`Photo`/`Expense`/`SpotType`/`ExpenseCategory`），並在 `ledger/page.tsx`、`gallery/page.tsx`、`AddExpenseModal.tsx`、`MapComponent.tsx`、`SpotFormModal.tsx`、`UploadPhotoModal.tsx` 全面套用，移除所有 `any`。`Session` 型別改用 `@supabase/supabase-js` 匯出的 `Session`。

### 2.2 `react-hooks/set-state-in-effect`（6 處）— 🟡 低優先（新規則，不影響現行為）
- **位置**：`Particles.tsx`、`ThemeProvider.tsx`、`MapComponent.tsx`、`ledger/page.tsx`、`AddExpenseModal.tsx`、`UploadPhotoModal.tsx`。
- **問題**：在 `useEffect` 內直接同步呼叫 `setState` 觸發資料抓取/初始化，屬新版 React ESLint 規則認定的反模式（可能造成連鎖渲染）。
- **修復方向**：多數情況此規則是提醒用途，可透過 `useEffect` 內用 `startTransition`、或改為在事件回調中呼叫、或使用 `useEffectEvent`/保留現狀但改寫成規則接受的模式。針對本專案，採用最小改動：維持 fetch-on-mount 邏輯但用規則建議的寫法包裝（例如把資料抓取邏輯移出、只在 effect 內呼叫非 setState 的啟動函式）。
- **狀態**：`[x]` 已完成，採用兩種修法：
  1. **資料抓取類**（`ledger`、`gallery`、`MapComponent`）：把 `fetchExpenses`/`fetchPhotos`/`loadData` 改寫成回傳 `supabase...then(...)` 的形式，`setState` 都發生在非同步 `.then()` callback 裡而非 effect body 同步執行，符合規則本身的判定邏輯，不需要 disable 註解。
  2. **無法避免的同步 setState**（`ThemeProvider` 讀 `localStorage`、`Particles` 的 mounted-gate）：這兩處官方文件本身承認「無 props/state 可在 render 期間推導」是有效例外，改為在確切呼叫 `setState` 的那一行加上 `eslint-disable-next-line react-hooks/set-state-in-effect` 並附上理由註解（放在 `useEffect(() => {` 那一行會被 ESLint 判定為 unused directive，需精確對齊觸發行）。
  3. `AddExpenseModal`、`UploadPhotoModal` 原本用 `useEffect` 把 `initialData`/`isOpen` 同步進 state，改為讓父元件（`ledger/page.tsx`、`gallery/page.tsx`）透過 `key` 或條件渲染來重新掛載元件，直接用 `useState` 的初始值取代 reset-effect，徹底移除該 effect。

### 2.3 `react-hooks/exhaustive-deps`（2 處）— 🟡 低優先
- **位置**：`ledger/page.tsx`（`fetchExpenses`）、`MapComponent.tsx`（`loadData`、`supabase.auth`）。
- **修復方向**：使用 `useCallback` 包裝函式並補上依賴，或視情況加註解說明為何刻意省略。
- **狀態**：`[x]` 已完成 — `fetchExpenses`、`fetchPhotos`、`loadData` 都改用 `useCallback` 包裝並正確填入依賴陣列（`[]`），呼叫端 effect 的依賴陣列也補上對應函式。

### 2.4 `@next/next/no-img-element`（2 處）— 🟡 低優先
- **位置**：`MapComponent.tsx`（側欄照片）、`gallery/page.tsx`（瀑布流、燈箱）。
- **問題**：使用原生 `<img>` 而非 `next/image`，影響 LCP 與流量成本；部分已用 `eslint-disable` 註解直接跳過。
- **修復方向**：改用 `next/image`，需要在 `next.config.ts` 設定 Cloudinary 網域白名單（`images.remotePatterns`）。
- **狀態**：`[x]` 部分完成：
  - `next.config.ts` 已加入 `images.remotePatterns`，允許 `res.cloudinary.com`。
  - `MapComponent.tsx` 側欄照片、`gallery/page.tsx` 燈箱大圖都已改用 `next/image`。
  - `gallery/page.tsx` 瀑布流縮圖**刻意保留** `<img>`：因為 masonry 排版需要利用每張照片原本、且互不相同的長寬比才能產生錯落效果，而 `photos` 資料表沒有存寬高，`next/image` 需要固定 `width`/`height` 或搭配已知比例的 `fill` 容器，兩者都會強制裁切照片、破壞瀑布流視覺。已在程式碼中加註解說明並保留 `eslint-disable-next-line @next/next/no-img-element`。

### 2.5 未使用的變數/程式碼 — 🟢 低優先，容易處理
- `page.tsx` 的 `IconNZ` 函式定義但沒被使用。
- `UploadPhotoModal.tsx` 的 catch 區塊有一個沒被使用的 `error` 變數（第 27 行附近，`no-unused-vars` warning）。
- **狀態**：`[x]` 已完成 — 移除 `IconNZ` 函式；`UploadPhotoModal.tsx` 的 `catch (err: any)` 改為 `catch (err)` 並用 `err instanceof Error` 做型別窄化，同時把上傳失敗訊息的處理方式與 `SpotFormModal.tsx` 對齊。

---

## 三、依賴與架構 (Dependencies / Architecture)

### 3.1 `tesseract.js` 套件已安裝但完全沒被使用 — 🟢 低優先
- **問題**：`ledger/page.tsx` 的「AI 掃描收據」功能目前只是 `setTimeout` 假動畫 + `alert()`，並未真正 import 或呼叫 `tesseract.js`。
- **修復方向**：這是計畫中的功能尚未落地，非 bug。本次僅記錄，**不在本輪自動修復範圍**（涉及新功能開發，需另行規劃）。若短期不開發，可考慮先從 `package.json` 移除以減少依賴體積，之後真正要做 OCR 時再裝回來。
- **狀態**：`[-]`（留待使用者決定：先移除依賴，或保留待後續開發）

### 3.2 `cloudinary`（server SDK）套件已安裝但沒被使用 — 🟢 低優先
- **問題**：目前上傳流程都是前端直接 `fetch` Cloudinary REST API（unsigned upload），沒有 import `cloudinary` npm 套件。
- **修復方向**：同上，若無 server-side 圖片操作（簽名上傳、刪除等）需求可移除；若有規劃則保留。
- **狀態**：`[-]`（留待使用者決定）

### 3.3 `page.module.css` 是未使用的模板殘留檔 — 🟢 低優先，直接處理
- **問題**：`app/src/app/page.module.css`（141 行）為 `create-next-app` 預設模板殘留，全站無任何檔案 import 它。
- **修復方向**：直接刪除。
- **狀態**：`[x]` 已完成 — 已刪除 `app/src/app/page.module.css`。

### 3.4 `components/ui/Button.tsx`、`Card.tsx` 未被任何頁面引用 — 🟡 中優先
- **問題**：全站按鈕/卡片都是直接寫 className 字串（`btn btn-primary` 等）或大量 inline style，這兩個封裝元件形同虛設；只有 `Sidebar.tsx` 被實際使用（`MapComponent.tsx`）。
- **修復方向**：兩個選項——(a) 移除未使用元件，或 (b) 改寫現有頁面套用它們。考量目前专案風格（大量 inline style 直接寫在頁面），且改用元件涉及大範圍重構、風險較高，本輪採用**移除**以降低誤導後續開發者的風險，待未來重構樣式系統時可重新設計。
- **狀態**：`[x]` 已完成 — 已刪除 `app/src/components/ui/Button.tsx`、`Card.tsx`；`Sidebar.tsx` 因為實際被 `MapComponent.tsx` 使用，維持不變。

### 3.5 大量 inline style 散落在頁面元件 — 🟡 中優先，本輪不做大範圍重構
- **問題**：`ledger/page.tsx`（541 行）、`page.tsx`、`gallery/page.tsx` 等大量把版面樣式寫在 JSX `style={{...}}`，與專案聲稱的「Vanilla CSS」慣例不完全一致，可讀性與可重用性較差。
- **修復方向**：這是設計慣例層級的問題，牽動範圍大，**本輪不處理**，僅記錄供未來重構參考。
- **狀態**：`[-]`（記錄，不在本輪範圍）

---

## 四、內容一致性 (Content / Data)

### 4.1 README 對應的目錄結構與實際略有差異 — 🟢 低優先
- README「專案結構」章節基本符合實際，只是缺少對 `implementation_plan*.md`、`.agents/` 技能目錄的說明。非阻塞問題，本輪不修改 README（避免與尚待確認的 3.1/3.2/1.2/1.3 項目衝突）。
- **狀態**：`[-]`（暫緩，待其他決議項目確定後一併更新 README）

### 4.2 目前 working tree 有未 commit 的變更 — 🟢 提醒
- `git status` 顯示 `gallery/page.tsx`、`ledger/page.tsx` 有修改（移除了頁首「badge」小標籤），尚未 commit。
- **修復方向**：本輪修復會疊加在這些既有變更之上，待所有修復完成後再一起檢視是否要 commit。
- **狀態**：`[-]`（等待使用者確認 commit 時機）

---

## 五、本輪自動修復範圍總結

已於本輪實作階段完成：

1. `[x]` `ledger/page.tsx` 加上 session 登入檢查，隱藏未登入時的新增/編輯按鈕
2. `[x]` 建立共用型別定義（`app/src/lib/types.ts`），取代專案中的 `any`
3. `[x]` 修正 `react-hooks/set-state-in-effect` 與 `exhaustive-deps` 相關寫法
4. `[x]` 移除 `page.module.css`、未使用的 `ui/Button.tsx`/`ui/Card.tsx`、未使用的 `IconNZ`、`UploadPhotoModal.tsx` 未使用的 catch 變數
5. `[x]` 將可行的 `<img>` 改為 `next/image`（已設定 Cloudinary 遠端圖片白名單），並保留一處刻意不改（瀑布流縮圖，理由見 2.4）
6. `[x]` 跑 `npm run lint`（0 error / 0 warning）與 `npm run build`（編譯成功）驗證並回填此文件狀態

驗證結果：
```
npm run lint   → 0 errors, 0 warnings
npm run build  → Compiled successfully, TypeScript 檢查通過，7 個路由全部產生成功
```

修改的檔案清單：
- 新增：`app/src/lib/types.ts`
- 修改：`app/src/app/ledger/page.tsx`、`app/src/app/gallery/page.tsx`、`app/src/app/page.tsx`、`app/next.config.ts`
- 修改：`app/src/components/AddExpenseModal.tsx`、`app/src/components/UploadPhotoModal.tsx`、`app/src/components/MapComponent.tsx`、`app/src/components/SpotFormModal.tsx`、`app/src/components/ThemeProvider.tsx`、`app/src/components/Particles.tsx`
- 刪除：`app/src/app/page.module.css`、`app/src/components/ui/Button.tsx`、`app/src/components/ui/Card.tsx`

不在本輪範圍（需使用者決策或另行規劃，維持 `[-]`）：

- 1.2 補齊資料庫 schema/RLS SQL 文件
- 1.3 是否將 `data/` 納入版控
- 3.1 / 3.2 是否移除 `tesseract.js`、`cloudinary` 依賴
- 3.5 inline style 大範圍重構
- 4.1 README 更新（待上述項目確認後一併處理）
- 4.2 是否 commit 本次與先前既有的變更
