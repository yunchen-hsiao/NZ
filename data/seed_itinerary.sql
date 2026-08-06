
-- 為了讓變數跨行作用，使用 DO Block
DO $$
DECLARE
  v_trip_id uuid;
  v_city_aukland uuid;
  v_city_rotorua uuid;
  v_city_taupo uuid;
  v_city_christchurch uuid;
  v_city_tekapo uuid;
  v_city_mtcook uuid;
  v_city_tarras uuid;
  v_city_wanaka uuid;
  v_city_queenstown uuid;
BEGIN
  -- 1. Insert Trip
  INSERT INTO trips (name, start_date, end_date) 
  VALUES ('2026 紐西蘭自由行', '2026-06-26', '2026-07-28') 
  RETURNING id INTO v_trip_id;

  INSERT INTO cities (trip_id, name, "order", lat, lng) VALUES (v_trip_id, 'Aukland', 1, -36.8485, 174.7633) RETURNING id INTO v_city_aukland;
  INSERT INTO cities (trip_id, name, "order", lat, lng) VALUES (v_trip_id, 'Rotorua', 2, -38.1368, 176.2497) RETURNING id INTO v_city_rotorua;
  INSERT INTO cities (trip_id, name, "order", lat, lng) VALUES (v_trip_id, 'Taupo', 4, -38.6857, 176.0702) RETURNING id INTO v_city_taupo;
  INSERT INTO cities (trip_id, name, "order", lat, lng) VALUES (v_trip_id, 'Christchurch', 5, -43.5321, 172.6362) RETURNING id INTO v_city_christchurch;
  INSERT INTO cities (trip_id, name, "order", lat, lng) VALUES (v_trip_id, 'Tekapo', 7, -44.0047, 170.4772) RETURNING id INTO v_city_tekapo;
  INSERT INTO cities (trip_id, name, "order", lat, lng) VALUES (v_trip_id, 'Mt.cook', 8, -43.7333, 170.099) RETURNING id INTO v_city_mtcook;
  INSERT INTO cities (trip_id, name, "order", lat, lng) VALUES (v_trip_id, 'Tarras', 9, -44.8217, 169.3495) RETURNING id INTO v_city_tarras;
  INSERT INTO cities (trip_id, name, "order", lat, lng) VALUES (v_trip_id, 'Wanaka', 10, -44.6946, 169.1417) RETURNING id INTO v_city_wanaka;
  INSERT INTO cities (trip_id, name, "order", lat, lng) VALUES (v_trip_id, 'Queenstown', 11, -45.0312, 168.6626) RETURNING id INTO v_city_queenstown;

  -- 3. Insert Spots
  INSERT INTO spots (city_id, type, name, visited_date, description, lat, lng) VALUES (v_city_aukland, 'accommodation', 'Aukland 行程', '2026-06-27', '搭公車 逛超市 住機場附近', -36.85243, 174.77263);
  INSERT INTO spots (city_id, type, name, visited_date, description, lat, lng) VALUES (v_city_rotorua, 'accommodation', 'Rotorua 行程', '2026-06-28', '搭 IC 6219 客運到羅托魯瓦 住haka house', -38.13630, 176.25103);
  INSERT INTO spots (city_id, type, name, visited_date, description, lat, lng) VALUES (v_city_rotorua, 'accommodation', 'Rotorua 行程', '2026-06-29', '羅托魯瓦湖邊+紅木森林公園 住haka house', -38.13687, 176.24946);
  INSERT INTO spots (city_id, type, name, visited_date, description, lat, lng) VALUES (v_city_rotorua, 'accommodation', 'Rotorua 行程', '2026-06-30', '搭 IC 7710 客運到羅托魯瓦 住haka house', -38.14062, 176.25160);
  INSERT INTO spots (city_id, type, name, visited_date, description, lat, lng) VALUES (v_city_rotorua, 'accommodation', 'Rotorua 行程', '2026-07-01', '波利尼西亞溫泉浴場 kuirau公園 住haka house', -38.13765, 176.24471);
  INSERT INTO spots (city_id, type, name, visited_date, description, lat, lng) VALUES (v_city_taupo, 'accommodation', 'Taupo 行程', '2026-07-02', '搭 IC 7701 客運到陶波 逛湖邊 住haka house', -38.68589, 176.06127);
  INSERT INTO spots (city_id, type, name, visited_date, description, lat, lng) VALUES (v_city_taupo, 'accommodation', 'Taupo 行程', '2026-07-03', '住haka house', -38.68472, 176.07850);
  INSERT INTO spots (city_id, type, name, visited_date, description, lat, lng) VALUES (v_city_aukland, 'accommodation', 'Aukland 行程', '2026-07-04', '搭 IC 6602 客運到 manukau city 住奧克蘭機場附近', -36.84519, 174.75354);
  INSERT INTO spots (city_id, type, name, visited_date, description, lat, lng) VALUES (v_city_christchurch, 'accommodation', 'Christchurch 行程', '2026-07-05', '搭飛機到基督城 住haka house', -43.53243, 172.64129);
  INSERT INTO spots (city_id, type, name, visited_date, description, lat, lng) VALUES (v_city_christchurch, 'accommodation', 'Christchurch 行程', '2026-07-06', '住haka house', -43.53182, 172.63518);
  INSERT INTO spots (city_id, type, name, visited_date, description, lat, lng) VALUES (v_city_christchurch, 'accommodation', 'Christchurch 行程', '2026-07-07', '住haka house', -43.53829, 172.63545);
  INSERT INTO spots (city_id, type, name, visited_date, description, lat, lng) VALUES (v_city_christchurch, 'accommodation', 'Christchurch 行程', '2026-07-08', '住haka house', -43.53589, 172.63972);
  INSERT INTO spots (city_id, type, name, visited_date, description, lat, lng) VALUES (v_city_christchurch, 'accommodation', 'Christchurch 行程', '2026-07-09', '住haka house', -43.54208, 172.62815);
  INSERT INTO spots (city_id, type, name, visited_date, description, lat, lng) VALUES (v_city_christchurch, 'accommodation', 'Christchurch 行程', '2026-07-10', '住haka house', -43.52740, 172.63655);
  INSERT INTO spots (city_id, type, name, visited_date, description, lat, lng) VALUES (v_city_christchurch, 'accommodation', 'Christchurch 行程', '2026-07-11', '住haka house', -43.53375, 172.64299);
  INSERT INTO spots (city_id, type, name, visited_date, description, lat, lng) VALUES (v_city_christchurch, 'accommodation', 'Christchurch 行程', '2026-07-13', '住haka house', -43.53003, 172.63837);
  INSERT INTO spots (city_id, type, name, visited_date, description, lat, lng) VALUES (v_city_christchurch, 'accommodation', 'Christchurch 行程', '2026-07-14', '住haka house', -43.54167, 172.63105);
  INSERT INTO spots (city_id, type, name, visited_date, description, lat, lng) VALUES (v_city_christchurch, 'accommodation', 'Christchurch 行程', '2026-07-15', '住haka house', -43.53835, 172.63518);
  INSERT INTO spots (city_id, type, name, visited_date, description, lat, lng) VALUES (v_city_christchurch, 'accommodation', 'Christchurch 行程', '2026-07-16', '住haka house', -43.53918, 172.62763);
  INSERT INTO spots (city_id, type, name, visited_date, description, lat, lng) VALUES (v_city_christchurch, 'accommodation', 'Christchurch 行程', '2026-07-17', '住haka house', -43.53459, 172.64039);
  INSERT INTO spots (city_id, type, name, visited_date, description, lat, lng) VALUES (v_city_tekapo, 'other', 'Tekapo 行程', '2026-07-18', '搭 IC 9557 客運到 tekapo', -44.00610, 170.47851);
  INSERT INTO spots (city_id, type, name, visited_date, description, lat, lng) VALUES (v_city_mtcook, 'accommodation', 'Mt.cook 行程', '2026-07-20', '搭 GA 9661 客運到 mt.cook 住haka house', -43.72824, 170.10375);
  INSERT INTO spots (city_id, type, name, visited_date, description, lat, lng) VALUES (v_city_tarras, 'other', 'Tarras 行程', '2026-07-22', '搭 GA 9661 客運到 tarras', -44.82367, 169.34546);
  INSERT INTO spots (city_id, type, name, visited_date, description, lat, lng) VALUES (v_city_wanaka, 'accommodation', 'Wanaka 行程', '2026-07-22', '搭計程車到 Wanaka 住haka house', -44.69280, 169.14391);
  INSERT INTO spots (city_id, type, name, visited_date, description, lat, lng) VALUES (v_city_wanaka, 'attraction', 'Wanaka 行程', '2026-07-23', '孤獨的樹 步道', -44.69919, 169.13793);
  INSERT INTO spots (city_id, type, name, visited_date, description, lat, lng) VALUES (v_city_queenstown, 'accommodation', 'Queenstown 行程', '2026-07-23', '搭 GS 9827 客運到 Queenstown 住haka house', -45.02871, 168.66847);
  INSERT INTO spots (city_id, type, name, visited_date, description, lat, lng) VALUES (v_city_queenstown, 'accommodation', 'Queenstown 行程', '2026-07-24', 'cardrona 住haka house', -45.02941, 168.65317);
  INSERT INTO spots (city_id, type, name, visited_date, description, lat, lng) VALUES (v_city_queenstown, 'accommodation', 'Queenstown 行程', '2026-07-25', 'Queenstown Hill Walking Track Fergburger 住haka house', -45.02924, 168.66652);
  INSERT INTO spots (city_id, type, name, visited_date, description, lat, lng) VALUES (v_city_queenstown, 'accommodation', 'Queenstown 行程', '2026-07-26', '住haka house', -45.02390, 168.66622);
  INSERT INTO spots (city_id, type, name, visited_date, description, lat, lng) VALUES (v_city_christchurch, 'accommodation', 'Christchurch 行程', '2026-07-27', '搭 IC 8502 客運到 Christchurch 住基督城機場附近', -43.52854, 172.64461);
END $$;
