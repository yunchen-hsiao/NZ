import fs from 'fs';
import path from 'path';

const fileContent = fs.readFileSync(path.join(process.cwd(), 'data/開銷.md'), 'utf-8');
const lines = fileContent.split('\n').map(l => l.trim());

let sql = `
-- Insert Expenses
DO $$
DECLARE
  v_trip_id uuid;
BEGIN
  -- 取得剛才建立的旅次 ID
  SELECT id INTO v_trip_id FROM trips WHERE name LIKE '%紐西蘭%' LIMIT 1;

`;

let currentDate = '';
const expenses = [];

for (let line of lines) {
  if (!line) continue;

  // Check date
  const dateMatch = line.match(/^(\d+)\/(\d+)/);
  if (dateMatch) {
    let month = dateMatch[1].padStart(2, '0');
    let day = dateMatch[2].padStart(2, '0');
    currentDate = `2026-${month}-${day}`;
    continue;
  }

  // Check if it contains an expense amount
  // Match number + '紐幣'
  const expenseMatch = line.match(/(.*?)(?:：|:| )?([\d.]+)紐幣(.*)/);
  if (expenseMatch) {
    let prefix = expenseMatch[1].trim();
    let amount = parseFloat(expenseMatch[2]);
    let note = expenseMatch[3].trim();
    
    // Clean prefix
    if (prefix.endsWith('：')) prefix = prefix.slice(0, -1);
    
    // Determine category and store/item name
    let category = 'leisure';
    let storeName = prefix;
    let itemName = prefix;

    if (prefix.includes('餐') || prefix.includes('MELBA') || prefix.includes('Taco') || prefix.includes('Burger') || prefix.includes('河粉')) {
      category = 'food';
      storeName = prefix.split('：').pop().trim() || prefix;
    } else if (prefix.includes('超') || prefix.includes('new world')) {
      category = 'food'; // Supermarket food
    } else if (prefix.includes('公車') || prefix.includes('uber') || prefix.includes('飛機')) {
      category = 'transport';
    } else if (prefix.includes('洗衣服')) {
      category = 'shopping';
    } else if (prefix.includes('macpac')) {
      category = 'shopping';
    } else if (prefix.includes('住宿')) {
      category = 'accommodation';
    }

    // Strip TWD amounts from note (e.g. " 466-14台幣", " 110-4☑️台幣")
    let cleanNote = note.replace(/[\d\.\-\+☑️\s]+台幣/, '').trim();
    if (cleanNote.startsWith('紐幣')) cleanNote = cleanNote.replace('紐幣', '').trim();

    expenses.push({
      date: currentDate,
      store: storeName.replace(/'/g, "''"),
      item: itemName.replace(/'/g, "''"),
      amount: amount,
      category: category,
      note: cleanNote.replace(/'/g, "''")
    });
  }
}

for (const e of expenses) {
  sql += `  INSERT INTO expenses (trip_id, date, store_name, item_name, amount_nzd, category, note) VALUES (v_trip_id, '${e.date}', '${e.store}', '${e.item}', ${e.amount}, '${e.category}', '${e.note}');\n`;
}

sql += `END $$;\n`;

fs.writeFileSync(path.join(process.cwd(), 'data/seed_expenses.sql'), sql);
console.log(`Done! Parsed ${expenses.length} expenses into data/seed_expenses.sql`);
