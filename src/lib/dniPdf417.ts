// Helpers for the DNI PDF417 text read in the browser. They never expose personal data: logs only carry
// the layout with letters/digits masked (e.g. "9{8}@A{5}") and counts.

const KNOWN_FIELD_COUNTS = [8, 9, 16, 17];

function splitFields(raw: string): string[] {
  // eslint-disable-next-line no-control-regex
  const fields = raw.replace(/[\u0000-\u001f\u007f\u00a0\ufeff]/g, ' ').split('@').map(value => value.trim());
  if (!KNOWN_FIELD_COUNTS.includes(fields.length) && fields.at(-1) === '') fields.pop();
  return fields;
}

export function pdf417Shape(raw: string): string {
  return raw
    .replace(/(\p{L}+)|(\d+)|(\r?\n)/gu, (match, letters?: string, digits?: string, newline?: string) => (
      letters ? `A{${letters.length}}` : digits ? `9{${digits.length}}` : newline ? '\\n' : match
    ))
    .slice(0, 300);
}

/** True when the text looks like an Argentine DNI barcode (known field count and a 7-8 digit document). */
export function isPlausibleDniPdf417(raw: string): boolean {
  if (raw.length > 4096) return false;
  const fields = splitFields(raw);
  if (!KNOWN_FIELD_COUNTS.includes(fields.length)) return false;
  const modern = fields.length === 8 || fields.length === 9;
  const document = (modern ? fields[4] : fields[1]).replace(/\./g, '');
  return /^\d{7,8}$/.test(document);
}

export function describePdf417(raw: string): { length: number; fieldCount: number; plausible: boolean; shape: string } {
  return { length: raw.length, fieldCount: splitFields(raw).length, plausible: isPlausibleDniPdf417(raw), shape: pdf417Shape(raw) };
}
