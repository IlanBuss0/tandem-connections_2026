import type { ProfessionalSession, SharedSupportAgreement, SharedSupportObjective, SupportNetworkMember } from '@/data/api';

const DAY_MS = 86400000;
export const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
export const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export const firstName = (fullName: string) => fullName.trim().split(/\s+/)[0] || fullName;

export const initials = (fullName: string) =>
  fullName.trim().split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase() ?? '').join('') || '?';

export function peopleLabel(members: SupportNetworkMember[]): string {
  if (!members.length) return '';
  const names = members.map(member => firstName(member.nombre));
  const verb = names.length === 1 ? 'acompaña' : 'acompañan';
  if (names.length === 1) return `${names[0]} ${verb}`;
  const last = names[names.length - 1];
  return `${names.slice(0, -1).join(', ')} y ${last} ${verb}`;
}

export function relativeDays(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const days = Math.floor((now.getTime() - date.getTime()) / DAY_MS);
  if (days <= 0) return 'hoy';
  if (days === 1) return 'ayer';
  if (days < 7) return `hace ${days} días`;
  if (days < 14) return 'hace 1 semana';
  return `hace ${Math.floor(days / 7)} semanas`;
}

// Del más antiguo al más nuevo, para mostrar primero lo que espera hace más tiempo.
export function pendingAgreements(agreements: SharedSupportAgreement[]): SharedSupportAgreement[] {
  return agreements
    .filter(agreement => !agreement.completado)
    .sort((a, b) => new Date(a.fecha_creacion).getTime() - new Date(b.fecha_creacion).getTime());
}

// El objetivo activo sin cambios hace 7 días o más (el más viejo, si hay varios).
export function staleObjective(objectives: SharedSupportObjective[], now: Date = new Date()): SharedSupportObjective | null {
  const stale = objectives
    .map(objective => ({ objective, days: Math.floor((now.getTime() - new Date(objective.fecha_actualizacion).getTime()) / DAY_MS) }))
    .filter(entry => entry.days >= 7);
  if (!stale.length) return null;
  return stale.reduce((oldest, entry) => (entry.days > oldest.days ? entry : oldest)).objective;
}

export function sessionLabel(session: Pick<ProfessionalSession, 'fecha_sesion' | 'titulo' | 'duracion_minutos'>): { when: string; what: string } | null {
  const date = new Date(session.fecha_sesion);
  if (Number.isNaN(date.getTime())) return null;
  const weekday = WEEKDAYS[date.getDay()];
  const time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  return {
    when: `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} ${date.getDate()} de ${MONTHS[date.getMonth()]} · ${time}`,
    what: `${session.titulo} · ${session.duracion_minutos} min`,
  };
}

export function nowCount(pendingAgreementsCount: number, hasStaleObjective: boolean, hasNextSession: boolean): number {
  return pendingAgreementsCount + (hasStaleObjective ? 1 : 0) + (hasNextSession ? 1 : 0);
}
