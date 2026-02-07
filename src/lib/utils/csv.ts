/**
 * Simple CSV parser
 * Handles basic CSV parsing with support for quoted fields
 */
export function parseCSV(csvText: string): string[][] {
  const lines: string[][] = [];
  const rows = csvText.split(/\r?\n/).filter((line) => line.trim() !== "");
  
  for (const row of rows) {
    const fields: string[] = [];
    let currentField = "";
    let inQuotes = false;
    
    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      const nextChar = row[i + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          currentField += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        // Field separator
        fields.push(currentField.trim());
        currentField = "";
      } else {
        currentField += char;
      }
    }
    
    // Add the last field
    fields.push(currentField.trim());
    lines.push(fields);
  }
  
  return lines;
}

/**
 * Parse CSV and convert to objects using header row
 */
export function parseCSVToObjects<T extends Record<string, any>>(
  csvText: string,
  headerMap: Record<string, keyof T>
): T[] {
  const rows = parseCSV(csvText);
  if (rows.length < 2) {
    throw new Error("CSV must have at least a header row and one data row");
  }
  
  const headers = rows[0].map((h) => h.trim().toLowerCase());
  const objects: T[] = [];
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const obj: any = {};
    
    headers.forEach((header, index) => {
      const mappedKey = headerMap[header];
      if (mappedKey) {
        obj[mappedKey] = row[index]?.trim() || "";
      }
    });
    
    objects.push(obj as T);
  }
  
  return objects;
}
