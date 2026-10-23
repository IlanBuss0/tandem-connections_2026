// Both bodies share head/accessory, waist and ankle anchors. Garment control
// points follow the same horizontal body profile; products never change IDs.
const feminineProfile = [[190, 1], [205, .88], [245, .92], [285, .86], [318, .92], [333, 1], [360, 1.1], [405, 1.04], [470, 1], [533, 1]];

export function fitBodyX(x: number, y: number, base = 'masculine') {
  if (base !== 'feminine' || y <= 190 || y >= 533) return x;
  const index = feminineProfile.findIndex(([height]) => height >= y);
  const [startY, startScale] = feminineProfile[index - 1];
  const [endY, endScale] = feminineProfile[index];
  const scale = startScale + (endScale - startScale) * (y - startY) / (endY - startY);
  return Number((150 + (x - 150) * scale).toFixed(3));
}

/** Our original garment paths use absolute M/L/Q/C commands and x/y pairs. */
export function fitBodyPath(path: string, base = 'masculine') {
  if (base !== 'feminine') return path;
  return path.replace(/(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g,
    (_pair, x: string, y: string) => `${fitBodyX(Number(x), Number(y), base)} ${y}`);
}
