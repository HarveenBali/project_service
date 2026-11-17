/** Quotes a CSV field and neutralises spreadsheet formula injection (=, +, -, @). */
const cell = (value: unknown): string => {
  let text = value === null || value === undefined ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
};

export const toCsv = (headers: string[], rows: unknown[][]): string =>
  [headers, ...rows].map((r) => r.map(cell).join(',')).join('\r\n');

export function downloadCsv(filename: string, csv: string) {
  const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
