/**
 * Robust CSV parser that handles quoted values with commas and newlines.
 */
export function parseCSV(csvText) {
  if (!csvText || !csvText.trim()) return [];
  const lines = [];
  let row = [];
  let inQuotes = false;
  let currentToken = '';

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentToken += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(currentToken.trim());
      currentToken = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') i++;
      row.push(currentToken.trim());
      currentToken = '';
      if (row.length > 0 && row.some((x) => x.length > 0)) {
        lines.push(row);
      }
      row = [];
    } else {
      currentToken += char;
    }
  }
  if (currentToken || row.length > 0) {
    row.push(currentToken.trim());
    if (row.some((x) => x.length > 0)) lines.push(row);
  }

  if (lines.length < 2) return [];

  const headers = lines[0];
  const records = [];

  for (let r = 1; r < lines.length; r++) {
    const values = lines[r];
    const obj = {};
    headers.forEach((h, colIdx) => {
      let val = values[colIdx] ?? '';
      // Parse numeric values if clean number
      if (!isNaN(val) && val !== '') {
        const num = parseFloat(val);
        if (!isNaN(num)) val = num;
      }
      obj[h] = val;
    });
    records.push(obj);
  }

  return records;
}
