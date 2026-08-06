// 將 CSV 格式的開銷資料轉成可在 Supabase SQL Editor 執行的 INSERT SQL。
//
// CSV 欄位（第一行必須是標題列，欄位順序不拘，但名稱要完全一致）：
//   date          必填  西元日期，格式 YYYY-MM-DD（例如 2026-06-27）
//   store_name    必填  店家名稱
//   item_name     必填  品項名稱
//   amount_nzd    選填  紐幣金額（數字，可留空）
//   amount_twd    選填  台幣金額（數字，可留空）
//   category      必填  food / transport / accommodation / learning / leisure / shopping / other
//   note          選填  備註
//
// 規則：amount_nzd、amount_twd 至少要填一個，兩個都填代表這筆有實際換算的
// 台幣金額（例如收據/信用卡帳單上的金額），比之後用歷史匯率概算更準確。
//
// 用法：
//   node scripts/import_expenses_csv.mjs [CSV 路徑]
// 預設讀取 data/expenses.csv，若不存在則印出提示訊息。
//
// 輸出：data/seed_expenses_from_csv.sql
//   （執行前請先跑過 data/migration_currency_and_rates.sql，確保
//    expenses 表已經有 amount_twd 欄位。）

import fs from 'fs';
import path from 'path';

const CATEGORIES = ['food', 'transport', 'accommodation', 'learning', 'leisure', 'shopping', 'other'];

const csvPath = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(process.cwd(), 'data/expenses.csv');

if (!fs.existsSync(csvPath)) {
  console.error(`找不到 CSV 檔案：${csvPath}`);
  console.error('請先建立 data/expenses.csv（可參考 data/expenses_template.csv 的欄位格式），或用參數指定路徑：');
  console.error('  node scripts/import_expenses_csv.mjs path/to/your.csv');
  process.exit(1);
}

// 簡易 CSV parser：支援雙引號包住的欄位與逗號/換行轉義，不依賴額外套件。
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && next === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ''));
}

function sqlString(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function sqlNumberOrNull(value) {
  const trimmed = String(value ?? '').trim();
  if (trimmed === '') return 'NULL';
  const num = Number(trimmed);
  if (Number.isNaN(num)) {
    throw new Error(`無法解析的數字："${value}"`);
  }
  return String(num);
}

const raw = fs.readFileSync(csvPath, 'utf-8');
const rows = parseCSV(raw);

if (rows.length < 2) {
  console.error('CSV 沒有資料列（至少要有標題列 + 1 筆資料）。');
  process.exit(1);
}

const header = rows[0].map((h) => h.trim());
const requiredCols = ['date', 'store_name', 'item_name', 'category'];
for (const col of requiredCols) {
  if (!header.includes(col)) {
    console.error(`CSV 缺少必要欄位："${col}"，目前的欄位是：${header.join(', ')}`);
    process.exit(1);
  }
}

const idx = (name) => header.indexOf(name);
const dataRows = rows.slice(1);

const values = [];
const errors = [];

dataRows.forEach((cols, i) => {
  const lineNo = i + 2; // +1 for header, +1 for 1-indexed
  try {
    const date = cols[idx('date')]?.trim();
    const storeName = cols[idx('store_name')]?.trim();
    const itemName = cols[idx('item_name')]?.trim();
    const category = cols[idx('category')]?.trim();
    const amountNzdRaw = idx('amount_nzd') >= 0 ? cols[idx('amount_nzd')] : '';
    const amountTwdRaw = idx('amount_twd') >= 0 ? cols[idx('amount_twd')] : '';
    const note = idx('note') >= 0 ? cols[idx('note')]?.trim() : '';

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new Error(`日期格式錯誤（應為 YYYY-MM-DD）："${date}"`);
    }
    if (!storeName) throw new Error('store_name 不可為空');
    if (!itemName) throw new Error('item_name 不可為空');
    if (!CATEGORIES.includes(category)) {
      throw new Error(`category 必須是其中之一：${CATEGORIES.join(', ')}，目前是 "${category}"`);
    }

    const amountNzd = sqlNumberOrNull(amountNzdRaw);
    const amountTwd = sqlNumberOrNull(amountTwdRaw);
    if (amountNzd === 'NULL' && amountTwd === 'NULL') {
      throw new Error('amount_nzd 與 amount_twd 至少要填一個');
    }

    values.push(
      `  (v_trip_id, ${sqlString(date)}, ${sqlString(storeName)}, ${sqlString(itemName)}, ${amountNzd}, ${amountTwd}, ${sqlString(category)}, ${note ? sqlString(note) : 'NULL'})`
    );
  } catch (err) {
    errors.push(`第 ${lineNo} 行：${err.message}`);
  }
});

if (errors.length > 0) {
  console.error(`發現 ${errors.length} 筆錯誤，請修正 CSV 後再重跑：`);
  errors.forEach((e) => console.error('  - ' + e));
  process.exit(1);
}

let sql = `-- 由 scripts/import_expenses_csv.mjs 從 ${path.relative(process.cwd(), csvPath)} 產生\n`;
sql += `-- 執行前請先確認已經跑過 data/migration_currency_and_rates.sql\n\n`;
sql += `DO $$\nDECLARE\n  v_trip_id uuid;\nBEGIN\n`;
sql += `  SELECT id INTO v_trip_id FROM trips WHERE name LIKE '%紐西蘭%' LIMIT 1;\n\n`;
sql += `  INSERT INTO expenses (trip_id, date, store_name, item_name, amount_nzd, amount_twd, category, note) VALUES\n`;
sql += values.join(',\n');
sql += `;\nEND $$;\n`;

const outPath = path.join(process.cwd(), 'data/seed_expenses_from_csv.sql');
fs.writeFileSync(outPath, sql);

console.log(`成功解析 ${values.length} 筆支出，已寫入：${outPath}`);
console.log('請在 Supabase SQL Editor 執行該檔案以完成匯入。');
