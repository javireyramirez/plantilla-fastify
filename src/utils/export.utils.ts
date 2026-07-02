import XLSX from 'xlsx';

/**
 * Resolves a nested path in an object (e.g. "team.name" -> obj.team.name)
 */
export function resolvePath(obj: any, path: string): any {
  return path.split('.').reduce((acc, part) => {
    if (acc === null || acc === undefined) return undefined;
    return acc[part];
  }, obj);
}

/**
 * Escapes a cell value for CSV formatting.
 */
export function escapeCSVValue(val: any): string {
  if (val === null || val === undefined) return '';

  let stringVal = '';
  if (val instanceof Date) {
    stringVal = val.toISOString();
  } else if (typeof val === 'object') {
    stringVal = JSON.stringify(val);
  } else {
    stringVal = String(val);
  }

  // Escape double quotes by doubling them
  const needsEscaping =
    stringVal.includes(',') ||
    stringVal.includes('"') ||
    stringVal.includes('\n') ||
    stringVal.includes('\r');
  if (needsEscaping) {
    return `"${stringVal.replace(/"/g, '""')}"`;
  }
  return stringVal;
}

/**
 * Flattens an object to a single level depth using dot notation for nested objects.
 * E.g., { name: 'John', team: { name: 'Devs' } } -> { name: 'John', 'team.name': 'Devs' }
 */
export function flattenObject(obj: any, prefix = ''): Record<string, any> {
  const result: Record<string, any> = {};

  if (!obj || typeof obj !== 'object') return result;

  for (const key of Object.keys(obj)) {
    const value = obj[key];
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (value instanceof Date) {
      result[newKey] = value;
    } else if (Array.isArray(value)) {
      result[newKey] = value
        .map((item) => (typeof item === 'object' ? JSON.stringify(item) : item))
        .join(', ');
    } else if (value && typeof value === 'object') {
      Object.assign(result, flattenObject(value, newKey));
    } else {
      result[newKey] = value;
    }
  }

  return result;
}

/**
 * Transforms an array of complex/nested objects into a flat array of key-value pairs,
 * respecting the specified columns list (if any).
 */
export function getFlatData(data: any[], columns?: string[]): Record<string, any>[] {
  if (!data || data.length === 0) return [];

  if (columns && columns.length > 0) {
    // If specific columns are requested, map each item resolving the paths
    return data.map((item) => {
      const flatItem: Record<string, any> = {};
      for (const col of columns) {
        flatItem[col] = resolvePath(item, col);
      }
      return flatItem;
    });
  }

  // If no columns are specified, flatten all properties of each object
  return data.map((item) => flattenObject(item));
}

/**
 * Converts an array of objects to a CSV string.
 */
export function convertToCSV(data: any[], columns?: string[]): string {
  const flatData = getFlatData(data, columns);
  if (flatData.length === 0) {
    if (columns && columns.length > 0) {
      return columns.join(',') + '\r\n';
    }
    return '';
  }

  // Determine headers
  const headers = columns && columns.length > 0 ? columns : Object.keys(flatData[0]);

  const csvRows: string[] = [];

  // Header row
  csvRows.push(headers.map((h) => escapeCSVValue(h)).join(','));

  // Data rows
  for (const item of flatData) {
    const values = headers.map((header) => escapeCSVValue(item[header]));
    csvRows.push(values.join(','));
  }

  return csvRows.join('\r\n');
}

/**
 * Converts an array of objects to an Excel (XLSX) buffer.
 */
export function convertToExcel(data: any[], columns?: string[]): Buffer {
  const flatData = getFlatData(data, columns);

  // If no data, write an empty sheet with columns if specified
  const worksheet =
    flatData.length > 0
      ? XLSX.utils.json_to_sheet(flatData)
      : XLSX.utils.json_to_sheet(
          columns && columns.length > 0
            ? [columns.reduce((acc, col) => ({ ...acc, [col]: '' }), {})]
            : [],
        );

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Export');

  // Generate buffer
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}
