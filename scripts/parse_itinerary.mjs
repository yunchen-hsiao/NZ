import fs from 'fs';
import path from 'path';

const fileContent = fs.readFileSync(path.join(process.cwd(), 'data/行程.md'), 'utf-8');

const cityCoords = {
  'Aukland': { lat: -36.8485, lng: 174.7633 },
  'Auckland': { lat: -36.8485, lng: 174.7633 },
  'Rotorua': { lat: -38.1368, lng: 176.2497 },
  'Taupo': { lat: -38.6857, lng: 176.0702 },
  'Christchurch': { lat: -43.5321, lng: 172.6362 },
  'Tekapo': { lat: -44.0047, lng: 170.4772 },
  'Mt.cook': { lat: -43.7333, lng: 170.0990 },
  'Tarras': { lat: -44.8217, lng: 169.3495 },
  'Wanaka': { lat: -44.6946, lng: 169.1417 },
  'Queenstown': { lat: -45.0312, lng: 168.6626 },
};

const lines = fileContent.split('\n').filter(l => l.trim().startsWith('|') && !l.includes('---') && !l.includes('做啥'));

let sql = `
-- 為了讓變數跨行作用，使用 DO Block
DO $$
DECLARE
  v_trip_id uuid;
`;

const cityVarsMap = new Map();
const records = [];

let currentDate = '';
for (let line of lines) {
  const parts = line.split('|').map(p => p.trim());
  if (parts.length < 5) continue;
  
  let dateCol = parts[1];
  let cityCol = parts[3];
  let descCol = parts[4];

  if (dateCol) {
    const match = dateCol.match(/(\d+)\/(\d+)/);
    if (match) {
      currentDate = `2026-${match[1].padStart(2, '0')}-${match[2].padStart(2, '0')}`;
    }
  }

  if (cityCol && !cityCol.includes('基督城景點地圖')) {
    let cityName = cityCol.replace(/\*/g, '').trim();
    if (cityName) {
      let varName = 'v_city_' + cityName.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!cityVarsMap.has(cityName)) {
        cityVarsMap.set(cityName, varName);
      }
      
      let type = 'other';
      if (descCol.includes('住')) type = 'accommodation';
      else if (descCol.includes('餐') || descCol.includes('吃')) type = 'restaurant';
      else if (descCol.includes('公園') || descCol.includes('湖') || descCol.includes('步道') || descCol.includes('觀星') || descCol.includes('瀑布') || descCol.includes('浴場')) type = 'attraction';

      records.push({
        date: currentDate,
        cityVarName: varName,
        desc: descCol.replace(/'/g, "''"),
        type: type,
        cityName
      });
    }
  }
}

for (const [name, varName] of cityVarsMap.entries()) {
  sql += `  ${varName} uuid;\n`;
}

sql += `BEGIN
  -- 1. Insert Trip
  INSERT INTO trips (name, start_date, end_date) 
  VALUES ('2026 紐西蘭南島自駕遊', '2026-06-26', '2026-07-28') 
  RETURNING id INTO v_trip_id;

`;

let cityOrder = 1;
for (const [name, varName] of cityVarsMap.entries()) {
  const coords = cityCoords[name] || { lat: -40.0, lng: 170.0 }; // Default to somewhere in NZ
  sql += `  INSERT INTO cities (trip_id, name, "order", lat, lng) VALUES (v_trip_id, '${name}', ${cityOrder++}, ${coords.lat}, ${coords.lng}) RETURNING id INTO ${varName};\n`;
}

sql += `\n  -- 3. Insert Spots\n`;

for (const r of records) {
  const coords = cityCoords[r.cityName] || { lat: -40.0, lng: 170.0 };
  
  // slightly offset spot coords so they don't all overlap on the exact city center
  const latOffset = (Math.random() - 0.5) * 0.02;
  const lngOffset = (Math.random() - 0.5) * 0.02;
  const spotLat = (coords.lat + latOffset).toFixed(5);
  const spotLng = (coords.lng + lngOffset).toFixed(5);

  sql += `  INSERT INTO spots (city_id, type, name, visited_date, description, lat, lng) VALUES (${r.cityVarName}, '${r.type}', '${r.cityName} 行程', '${r.date}', '${r.desc}', ${spotLat}, ${spotLng});\n`;
}

sql += `END $$;\n`;

fs.writeFileSync(path.join(process.cwd(), 'data/seed_itinerary.sql'), sql);
console.log('Done! Generated data/seed_itinerary.sql');
