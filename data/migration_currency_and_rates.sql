-- ============================================================================
-- Migration: 雙幣別記帳 + 每日匯率表
-- ============================================================================
-- 背景：
--   原本 expenses 只有 amount_nzd 一個金額欄位。現在改成：
--   - amount_nzd：這筆錢的紐幣金額（可為 null）
--   - amount_twd：這筆錢實際換算/刷卡的台幣金額（可為 null，通常來自收據上
--                 銀行實際的換匯結果，跟系統用歷史匯率概算的數字不一定相同）
--   兩者至少要有一個非 null。前端會依照「有哪些欄位」決定顯示方式：
--   - 兩者都有 → 顯示 "NZ$xx + NT$xx"，且計算總額時這筆直接採用 amount_twd
--     （因為那是實際發生的台幣金額，比用當天歷史匯率概算更準確）。
--   - 只有 amount_nzd → 顯示 "NZ$xx"，計算「顯示為台幣」總額時才用
--     exchange_rates 當天的匯率概算。
--   - 只有 amount_twd → 顯示 "NT$xx"（例如出發前在台灣就付清的機票、裝備）。
--
-- 使用方式：此 migration 請先執行「分類 enum 初始化」再執行本檔案：
--   1. 在 SQL Editor 單獨執行以下兩句（每句分開執行，確認成功後再執行下一句）：
--        ALTER TYPE public.expense_category ADD VALUE IF NOT EXISTS 'shopping';
--        ALTER TYPE public.expense_category ADD VALUE IF NOT EXISTS 'other';
--   2. 再執行本檔案，完成欄位調整、既有資料轉換與匯率表建立。
-- PostgreSQL 的 enum 新值必須先提交，之後才能在 UPDATE/INSERT 中使用。
-- 其餘語句已用 IF NOT EXISTS / DO $$ 包裝，可安全重新執行。
-- ============================================================================

-- 1. expenses 資料表調整 --------------------------------------------------

-- 新增 amount_twd 欄位（可為 null）
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS amount_twd numeric(10, 2);

-- 把 amount_nzd 改成可為 null（舊資料原本是 NOT NULL）
ALTER TABLE expenses ALTER COLUMN amount_nzd DROP NOT NULL;

-- 確保至少有一個金額欄位有值，避免出現兩個都是 null 的空紀錄
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'expenses_amount_not_both_null'
  ) THEN
    ALTER TABLE expenses
      ADD CONSTRAINT expenses_amount_not_both_null
      CHECK (amount_nzd IS NOT NULL OR amount_twd IS NOT NULL);
  END IF;
END $$;

COMMENT ON COLUMN expenses.amount_nzd IS '紐幣金額，可為 null（若這筆是純台幣支出）';
COMMENT ON COLUMN expenses.amount_twd IS '實際台幣金額（刷卡/收據上的真實換算結果），可為 null';

-- category 使用 expense_category enum；這兩個新分類必須先在 SQL Editor 分開執行並提交：
-- ALTER TYPE public.expense_category ADD VALUE IF NOT EXISTS 'shopping';
-- ALTER TYPE public.expense_category ADD VALUE IF NOT EXISTS 'other';
-- 以下語句在完整 migration 重跑時也會安全略過已存在的值。
ALTER TYPE public.expense_category ADD VALUE IF NOT EXISTS 'shopping';
ALTER TYPE public.expense_category ADD VALUE IF NOT EXISTS 'other';

-- 將既有資料中的舊分類值同步更新，讓資料庫與前端/CSV 使用同一套分類。
-- 使用 category::text 比對，避免舊 enum 沒有 clothing 時在 WHERE 解析階段失敗。
UPDATE public.expenses SET category = 'shopping' WHERE category::text = 'clothing';

-- 2. exchange_rates 資料表（每日 NZD -> TWD 歷史匯率） ---------------------

CREATE TABLE IF NOT EXISTS exchange_rates (
  date date PRIMARY KEY,
  nzd_to_twd numeric(10, 4) NOT NULL,
  source text,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE exchange_rates IS '每日 NZD -> TWD 歷史匯率，用於把只記錄紐幣金額的支出換算成台幣總計';

ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'exchange_rates' AND policyname = 'exchange_rates_public_read'
  ) THEN
    CREATE POLICY exchange_rates_public_read ON exchange_rates
      FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'exchange_rates' AND policyname = 'exchange_rates_admin_write'
  ) THEN
    CREATE POLICY exchange_rates_admin_write ON exchange_rates
      FOR ALL USING (auth.role() = 'authenticated')
      WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

-- 3. 匯入每日匯率資料 -------------------------------------------------------
-- 執行完上面的 schema 變更後，接著執行 data/seed_exchange_rates.sql
-- （由 scripts/fetch_exchange_rates.mjs 產生，內含實際旅程日期範圍的歷史匯率）。
