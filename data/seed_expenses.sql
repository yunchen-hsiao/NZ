
-- Insert Expenses
DO $$
DECLARE
  v_trip_id uuid;
BEGIN
  -- 取得剛才建立的旅次 ID
  SELECT id INTO v_trip_id FROM trips WHERE name LIKE '%紐西蘭%' LIMIT 1;

  INSERT INTO expenses (trip_id, date, store_name, item_name, amount_nzd, category, note) VALUES (v_trip_id, '2026-06-27', 'uber', 'uber', 25.75, 'transport', '');
  INSERT INTO expenses (trip_id, date, store_name, item_name, amount_nzd, category, note) VALUES (v_trip_id, '2026-06-28', 'MELBA', 'MELBA', 58.87, 'food', '');
  INSERT INTO expenses (trip_id, date, store_name, item_name, amount_nzd, category, note) VALUES (v_trip_id, '2026-06-28', 'AIR公車', 'AIR公車', 6, 'transport', '');
  INSERT INTO expenses (trip_id, date, store_name, item_name, amount_nzd, category, note) VALUES (v_trip_id, '2026-06-29', '3號公車', '3號公車', 12, 'transport', '');
  INSERT INTO expenses (trip_id, date, store_name, item_name, amount_nzd, category, note) VALUES (v_trip_id, '2026-06-30', '洗衣服', '洗衣服', 6, 'shopping', '');
  INSERT INTO expenses (trip_id, date, store_name, item_name, amount_nzd, category, note) VALUES (v_trip_id, '2026-07-04', '超商', '炒飯', 14, 'food', '');
  INSERT INTO expenses (trip_id, date, store_name, item_name, amount_nzd, category, note) VALUES (v_trip_id, '2026-07-04', '超商', '牛奶', 4.9, 'food', '');
  INSERT INTO expenses (trip_id, date, store_name, item_name, amount_nzd, category, note) VALUES (v_trip_id, '2026-07-04', 'AIR公車', 'AIR公車', 6, 'transport', '');
  INSERT INTO expenses (trip_id, date, store_name, item_name, amount_nzd, category, note) VALUES (v_trip_id, '2026-07-05', 'Taco Bell', 'Taco Bell', 29.99, 'food', '');
  INSERT INTO expenses (trip_id, date, store_name, item_name, amount_nzd, category, note) VALUES (v_trip_id, '2026-07-05', 'AIR公車', 'AIR公車', 6, 'transport', '');
  INSERT INTO expenses (trip_id, date, store_name, item_name, amount_nzd, category, note) VALUES (v_trip_id, '2026-07-05', '洗衣服', '洗衣服', 12, 'shopping', '');
  INSERT INTO expenses (trip_id, date, store_name, item_name, amount_nzd, category, note) VALUES (v_trip_id, '2026-07-05', '8號公車', '8號公車', 6, 'transport', '');
  INSERT INTO expenses (trip_id, date, store_name, item_name, amount_nzd, category, note) VALUES (v_trip_id, '2026-07-06', 'Seoul tiger', '韓式拌飯', 41.8, 'food', '');
  INSERT INTO expenses (trip_id, date, store_name, item_name, amount_nzd, category, note) VALUES (v_trip_id, '2026-07-07', 'Miss Saigon', '牛肉河粉', 33.8, 'food', '');
  INSERT INTO expenses (trip_id, date, store_name, item_name, amount_nzd, category, note) VALUES (v_trip_id, '2026-07-08', '印度料理', '印度料理', 38, 'food', '');
  INSERT INTO expenses (trip_id, date, store_name, item_name, amount_nzd, category, note) VALUES (v_trip_id, '2026-07-09', 'Miss Saigon', '牛肉河粉', 31.8, 'food', '');
  INSERT INTO expenses (trip_id, date, store_name, item_name, amount_nzd, category, note) VALUES (v_trip_id, '2026-07-10', '希臘雞肉捲餅', '希臘雞肉捲餅', 34, 'food', '');
  INSERT INTO expenses (trip_id, date, store_name, item_name, amount_nzd, category, note) VALUES (v_trip_id, '2026-07-11', '洗衣服', '洗衣服', 18, 'shopping', '');
  INSERT INTO expenses (trip_id, date, store_name, item_name, amount_nzd, category, note) VALUES (v_trip_id, '2026-07-11', '烘衣服', '烘衣服', 6, 'shopping', '');
  INSERT INTO expenses (trip_id, date, store_name, item_name, amount_nzd, category, note) VALUES (v_trip_id, '2026-07-13', 'Miss Saigon', '牛肉河粉', 31.8, 'food', '');
  INSERT INTO expenses (trip_id, date, store_name, item_name, amount_nzd, category, note) VALUES (v_trip_id, '2026-07-13', '指甲膠水', '指甲膠水', 4.9, 'leisure', '');
  INSERT INTO expenses (trip_id, date, store_name, item_name, amount_nzd, category, note) VALUES (v_trip_id, '2026-07-13', '亞洲超市', '果凍條 小瓜呆', 14, 'food', '');
  INSERT INTO expenses (trip_id, date, store_name, item_name, amount_nzd, category, note) VALUES (v_trip_id, '2026-07-14', 'sabry souvlaki', '雞肉沙拉飯', 32, 'food', '');
  INSERT INTO expenses (trip_id, date, store_name, item_name, amount_nzd, category, note) VALUES (v_trip_id, '2026-07-15', 'kebab on terrace', '雞肉沙拉飯', 28, 'food', '');
END $$;
