export function toCsv(rows: Array<Record<string, unknown>>) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const escape = (value: unknown) => {
    const text = value == null ? "" : String(value);
    if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
    return text;
  };

  return [headers.join(","), ...rows.map((row) => headers.map((key) => escape(row[key])).join(","))].join("\n");
}
