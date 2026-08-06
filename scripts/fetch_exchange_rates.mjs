// 抓取旅程期間每一天的 NZD -> TWD 歷史匯率，並產生可直接在 Supabase SQL Editor
// 執行的 seed SQL（沿用專案既有的 seed_*.sql 慣例）。
//
// 資料來源：fawazahmed0/currency-api（免費、無需 API Key、每日更新的匯率快照）
// https://github.com/fawazahmed0/exchange-api
//
// 用法：
//   node scripts/fetch_exchange_rates.mjs [開始日期 YYYY-MM-DD] [結束日期 YYYY-MM-DD]
// 若不帶參數，預設抓取本次紐西蘭行程的日期範圍 (2026-06-26 ~ 2026-07-28)。
//
// 輸出：
//   data/seed_exchange_rates.sql — Supabase 匯入用的 SQL
//   data/exchange_rates.json     — 原始快取資料（方便除錯/重跑不必重新 fetch 已知天數）

import fs from 'fs';
import path from 'path';

const DEFAULT_START = '2026-06-26';
const DEFAULT_END = '2026-07-28';

const startDate = process.argv[2] || DEFAULT_START;
const endDate = process.argv[3] || DEFAULT_END;

const CDN_PRIMARY = (date) =>
  `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${date}/v1/currencies/nzd.min.json`;
const CDN_FALLBACK = (date) =>
  `https://${date}.currency-api.pages.dev/v1/currencies/nzd.min.json`;

function* dateRange(start, end) {
  const cur = new Date(start + 'T00:00:00Z');
  const last = new Date(end + 'T00:00:00Z');
  while (cur <= last) {
    yield cur.toISOString().split('T')[0];
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
}

async function fetchRateForDate(date) {
  for (const buildUrl of [CDN_PRIMARY, CDN_FALLBACK]) {
    try {
      const res = await fetch(buildUrl(date));
      if (!res.ok) continue;
      const json = await res.json();
      const rate = json?.nzd?.twd;
      if (typeof rate === 'number' && rate > 0) {
        return rate;
      }
    } catch {
      // try next fallback
    }
  }
  return null;
}

async function main() {
  console.log(`Fetching NZD → TWD daily rates from ${startDate} to ${endDate}...`);

  const results = [];
  let lastKnownRate = null;

  for (const date of dateRange(startDate, endDate)) {
    let rate = await fetchRateForDate(date);

    if (rate === null) {
      // API 沒有當天資料時（極少見，通常是還沒發布的未來日期），沿用最近一個已知匯率
      if (lastKnownRate !== null) {
        console.warn(`  ${date}: 查無資料，沿用前一個已知匯率 ${lastKnownRate}`);
        rate = lastKnownRate;
      } else {
        console.error(`  ${date}: 查無資料，且沒有前一天的匯率可沿用，略過`);
        continue;
      }
    } else {
      lastKnownRate = rate;
    }

    console.log(`  ${date}: 1 NZD = ${rate.toFixed(4)} TWD`);
    results.push({ date, nzd_to_twd: rate });
  }

  // 寫入 JSON 快取
  const jsonPath = path.join(process.cwd(), 'data/exchange_rates.json');
  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));

  // 產生 SQL（比照 seed_expenses.sql / seed_itinerary.sql 的風格）
  let sql = `-- NZD -> TWD 每日歷史匯率\n-- 資料來源：fawazahmed0/currency-api (https://github.com/fawazahmed0/exchange-api)\n-- 由 scripts/fetch_exchange_rates.mjs 自動產生，請勿手動編輯\n\n`;
  sql += `INSERT INTO exchange_rates (date, nzd_to_twd, source) VALUES\n`;
  sql += results
    .map(
      (r) => `  ('${r.date}', ${r.nzd_to_twd}, 'fawazahmed0/currency-api')`
    )
    .join(',\n');
  sql += `\nON CONFLICT (date) DO UPDATE SET nzd_to_twd = EXCLUDED.nzd_to_twd, source = EXCLUDED.source;\n`;

  const sqlPath = path.join(process.cwd(), 'data/seed_exchange_rates.sql');
  fs.writeFileSync(sqlPath, sql);

  console.log(`\nDone! ${results.length} 天的匯率已寫入：`);
  console.log(`  - ${sqlPath}`);
  console.log(`  - ${jsonPath}`);
}

main();
