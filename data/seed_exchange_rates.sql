-- NZD -> TWD 每日歷史匯率
-- 資料來源：fawazahmed0/currency-api (https://github.com/fawazahmed0/exchange-api)
-- 由 scripts/fetch_exchange_rates.mjs 自動產生，請勿手動編輯

INSERT INTO exchange_rates (date, nzd_to_twd, source) VALUES
  ('2026-06-26', 17.96639304, 'fawazahmed0/currency-api'),
  ('2026-06-27', 17.97947801, 'fawazahmed0/currency-api'),
  ('2026-06-28', 17.96233358, 'fawazahmed0/currency-api'),
  ('2026-06-29', 18.00379159, 'fawazahmed0/currency-api'),
  ('2026-06-30', 17.99943562, 'fawazahmed0/currency-api'),
  ('2026-07-01', 18.07031445, 'fawazahmed0/currency-api'),
  ('2026-07-02', 18.08886007, 'fawazahmed0/currency-api'),
  ('2026-07-03', 18.23575694, 'fawazahmed0/currency-api'),
  ('2026-07-04', 18.23331281, 'fawazahmed0/currency-api'),
  ('2026-07-05', 18.23408112, 'fawazahmed0/currency-api'),
  ('2026-07-06', 18.25745188, 'fawazahmed0/currency-api'),
  ('2026-07-07', 18.2821675, 'fawazahmed0/currency-api'),
  ('2026-07-08', 18.25444308, 'fawazahmed0/currency-api'),
  ('2026-07-09', 18.37999926, 'fawazahmed0/currency-api'),
  ('2026-07-10', 18.56904627, 'fawazahmed0/currency-api'),
  ('2026-07-11', 18.48496725, 'fawazahmed0/currency-api'),
  ('2026-07-12', 18.48571857, 'fawazahmed0/currency-api'),
  ('2026-07-13', 18.47050186, 'fawazahmed0/currency-api'),
  ('2026-07-14', 18.63012051, 'fawazahmed0/currency-api'),
  ('2026-07-15', 18.73199921, 'fawazahmed0/currency-api'),
  ('2026-07-16', 18.80408309, 'fawazahmed0/currency-api'),
  ('2026-07-17', 18.85266905, 'fawazahmed0/currency-api'),
  ('2026-07-18', 18.93692277, 'fawazahmed0/currency-api'),
  ('2026-07-19', 18.9413614, 'fawazahmed0/currency-api'),
  ('2026-07-20', 18.97650897, 'fawazahmed0/currency-api'),
  ('2026-07-21', 18.92870787, 'fawazahmed0/currency-api'),
  ('2026-07-22', 18.84178252, 'fawazahmed0/currency-api'),
  ('2026-07-23', 18.77943141, 'fawazahmed0/currency-api'),
  ('2026-07-24', 18.69354168, 'fawazahmed0/currency-api'),
  ('2026-07-25', 18.73138731, 'fawazahmed0/currency-api'),
  ('2026-07-26', 18.72274357, 'fawazahmed0/currency-api'),
  ('2026-07-27', 18.75376648, 'fawazahmed0/currency-api'),
  ('2026-07-28', 18.71158557, 'fawazahmed0/currency-api')
ON CONFLICT (date) DO UPDATE SET nzd_to_twd = EXCLUDED.nzd_to_twd, source = EXCLUDED.source;
