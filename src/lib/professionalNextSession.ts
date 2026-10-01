import type { ProfessionalSession } from '@/data/api';
import type { UsageEventRecord } from '@/data/usageApi';
import { formatEta, minutesUntil, PAUSE_CARD_ID, plural, startOfLocalDay } from '@/components/professional/home/homeData';
import { trendLabel } from '@/components/perteneciente/evolution/evolutionHelpers';

const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const capitalize = (text: string) => `${text.charAt(0).toLocaleUpperCase('es-AR')}${text.slice(1)}`;
const clock = (date: Date) => `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
const sameDay = (a: Date, b: Date) => startOfLocalDay(a).getTime() === startOfLocalDay(b).getTime();

export type Direction = 1 | 0 | -1 | null;
export type SessionChipIcon = 'pause' | 'trend-up' | 'trend-flat' | 'support' | 'pencil' | 'check';
export type SessionChip = { id: string; tone: 'amber' | 'purple' | 'green' | 'gray'; icon?: SessionChipIcon; text: string };
export type SessionAction = { kind: 'prepare' | 'writeNote' | 'previousNote' | 'schedule'; session?: ProfessionalSession };

export type NextSessionInput = {
  /** Sesiones de este paciente. */
  sessions: ProfessionalSession[];
  now: Date;
  canViewHistory: boolean;
  canSchedule: boolean;
  usageEvents: UsageEventRecord[];
  openAgreements: number;
  stepsDirection: Direction;
  moodDirection: Direction;
};

/** "Hoy 16:00 · en 25 min" (solo si falta menos de un día y es hoy) o "Jueves 1 · 10:00". */
export function formatSessionWhen(value: string, now: Date) {
  const date = new Date(value);
  if (sameDay(date, now)) {
    const eta = minutesUntil({ fecha_sesion: value } as ProfessionalSession, now);
    return `Hoy ${clock(date)}${eta > 0 ? ` · ${formatEta(eta).toLocaleLowerCase('es-AR')}` : ''}`;
  }
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  if (sameDay(date, tomorrow)) return `Mañana ${clock(date)}`;
  const month = date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear() ? '' : ` ${MONTHS[date.getMonth()]}`;
  return `${capitalize(WEEKDAYS[date.getDay()])} ${date.getDate()}${month} · ${clock(date)}`;
}

/** "jueves 24 sep". */
export const formatLastSession = (value: string) => {
  const date = new Date(value);
  return `${WEEKDAYS[date.getDay()]} ${date.getDate()} ${MONTHS[date.getMonth()]}`;
};

const DIRECTION_TEXT = (direction: 1 | 0 | -1) => (direction === 0 ? 'estable' : trendLabel(direction).toLocaleLowerCase('es-AR'));
const DIRECTION_CHIP = { 1: { tone: 'green', icon: 'trend-up' }, 0: { tone: 'gray', icon: 'trend-flat' }, [-1]: { tone: 'amber', icon: 'support' } } as const;

export function buildNextSessionModel({ sessions, now, canViewHistory, canSchedule, usageEvents, openAgreements, stepsDirection, moodDirection }: NextSessionInput) {
  const next = sessions
    .filter(session => session.estado === 'programada' && new Date(session.fecha_sesion).getTime() >= now.getTime())
    .sort((a, b) => a.fecha_sesion.localeCompare(b.fecha_sesion))[0];
  const completed = sessions.filter(session => session.estado === 'completada').sort((a, b) => b.fecha_sesion.localeCompare(a.fecha_sesion));
  const lastCompleted = completed[0];
  const todaySession = completed.find(session => sameDay(new Date(session.fecha_sesion), now));
  const title = next ? formatSessionWhen(next.fecha_sesion, now) : 'Sin próxima sesión';
  const schedule: SessionAction[] = !next && canSchedule ? [{ kind: 'schedule' }] : [];
  if (!canViewHistory) return { title, chips: [] as SessionChip[], actions: schedule };

  const chips: SessionChip[] = [];
  if (lastCompleted) {
    const since = new Date(lastCompleted.fecha_sesion).getTime();
    const pauses = usageEvents.filter(event => event.tipo_evento === 'tarjeta_autonomia_usada' && event.entidad_id === PAUSE_CARD_ID && new Date(event.ocurrido_en).getTime() >= since).length;
    if (pauses) chips.push({ id: 'pause', tone: 'amber', icon: 'pause', text: plural(pauses, 'tarjeta de pausa', 'tarjetas de pausa') });
  }
  if (openAgreements) chips.push({ id: 'agreements', tone: 'purple', text: `${plural(openAgreements, 'acuerdo', 'acuerdos')} sin cerrar` });
  if (stepsDirection !== null) chips.push({ id: 'autonomy', ...DIRECTION_CHIP[stepsDirection], text: `Autonomía ${DIRECTION_TEXT(stepsDirection)}` });
  if (moodDirection !== null) chips.push({ id: 'mood', ...DIRECTION_CHIP[moodDirection], text: `Ánimo ${DIRECTION_TEXT(moodDirection)}` });
  if (todaySession) chips.push(todaySession.has_note
    ? { id: 'todayNote', tone: 'green', icon: 'check', text: 'Nota de hoy guardada' }
    : { id: 'todayNote', tone: 'amber', icon: 'pencil', text: 'Nota de hoy sin escribir' });
  if (!next && lastCompleted) chips.push({ id: 'last', tone: 'gray', text: `Última: ${formatLastSession(lastCompleted.fecha_sesion)}` });

  // Preparar sesión siempre que haya próxima sesión; "Escribir nota" se suma como secundario si falta la nota de hoy.
  const previous = completed.find(session => session.has_note);
  const actions: SessionAction[] = [
    ...(next ? [{ kind: 'prepare', session: next } as SessionAction] : schedule),
    ...(todaySession && !todaySession.has_note ? [{ kind: 'writeNote', session: todaySession } as SessionAction] : []),
    ...(next && previous ? [{ kind: 'previousNote', session: previous } as SessionAction] : []),
  ];
  return { title, chips, actions };
}

const joinList = (items: string[]) => (items.length > 1 ? `${items.slice(0, -1).join(', ')} y ${items[items.length - 1]}` : items[0] ?? '');

/** Texto de la nota de permisos: solo lo habilitado; sin historial, el aviso de que ve solo sesiones. */
export function permissionNoteParts(perms: { canViewHistory: boolean; canSchedule: boolean; canAssignActivities: boolean }) {
  if (!perms.canViewHistory) return { before: 'La familia todavía no compartió el historial. Ves solo las sesiones.', enabled: '', after: '' };
  const enabled = joinList([
    'historial',
    ...(perms.canSchedule ? ['sesiones'] : []),
    ...(perms.canAssignActivities ? ['actividades'] : []),
  ]);
  return { before: 'Su familia te habilitó ', enabled, after: '.' };
}
