export type DateParts = { day: string; month: string; year: string };

export function isoToDateParts(isoDate: string): DateParts {
  const [year = '', month = '', day = ''] = isoDate.split('-');
  return { day, month, year };
}

export function datePartsToIso(parts: DateParts): string | null {
  if (!/^\d{2}$/.test(parts.day) || !/^\d{2}$/.test(parts.month) || !/^\d{4}$/.test(parts.year)) return null;
  const day = Number(parts.day);
  const month = Number(parts.month);
  const year = Number(parts.year);
  if (year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1) return null;
  const maxDay = new Date(year, month, 0).getDate();
  if (day > maxDay) return null;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
