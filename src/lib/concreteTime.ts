// Unica responsabilidad: convertir una fecha futura en un tiempo CONCRETO
// (Sesion 14, item 18) — "faltan 3 noches" en vez de "el martes". Un
// nombre de dia de la semana no le dice a todo el mundo cuanto falta de
// verdad; contar noches/dias si lo hace. Puro, testeable con `now` fijo.
export function formatConcreteDays(targetDateIso: string, now: Date): string {
  const target = new Date(`${targetDateIso}T00:00:00`);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffMs = target.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000));

  if (diffDays < 0) return 'ya pasó';
  if (diffDays === 0) return 'hoy';
  if (diffDays === 1) return 'mañana';
  if (diffDays === 2) return 'faltan 2 noches';
  if (diffDays <= 6) return `faltan ${diffDays} noches`;
  if (diffDays === 7) return 'falta 1 semana';
  const weeks = Math.round(diffDays / 7);
  if (diffDays < 30) return `faltan ${weeks} semanas`;
  const months = Math.round(diffDays / 30);
  return months <= 1 ? 'falta como 1 mes' : `faltan como ${months} meses`;
}
