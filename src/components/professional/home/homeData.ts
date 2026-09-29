import type { AcompanamientoData, GeneratedReport, PersonalNote, ProfessionalSession, User } from '@/data/api';
import type { AutonomyCardUsage } from '@/data/usageApi';

const DAY_MS = 86_400_000;
const PAUSE_CARD_ID = 'necesito-un-momento';

export const startOfLocalDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const time = (session: ProfessionalSession) => new Date(session.fecha_sesion).getTime();
const isSameLocalDay = (a: Date, b: Date) => startOfLocalDay(a).getTime() === startOfLocalDay(b).getTime();
const sortByTime = (rows: ProfessionalSession[]) => [...rows].sort((a, b) => time(a) - time(b));

export const formatClock = (value: string) => new Date(value).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });

export function formatLongDate(now: Date) {
  const text = now.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }).replace(',', '');
  return `${text.charAt(0).toLocaleUpperCase('es-AR')}${text.slice(1)} · ${formatClock(now.toISOString())}`;
}

export const todaySessions = (sessions: ProfessionalSession[], now: Date) =>
  sortByTime(sessions.filter(session => session.estado !== 'cancelada' && isSameLocalDay(new Date(session.fecha_sesion), now)));

/** La primera sesión programada de hoy que todavía no terminó. */
export const nextTodaySession = (today: ProfessionalSession[], now: Date) =>
  today.find(session => session.estado === 'programada' && time(session) + session.duracion_minutos * 60_000 > now.getTime());

export const minutesUntil = (session: ProfessionalSession, now: Date) => Math.round((time(session) - now.getTime()) / 60_000);

export function formatEta(minutes: number) {
  if (minutes < 60) return `En ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return `En ${hours} h${minutes % 60 ? ` ${minutes % 60} min` : ''}`;
}

/** Sesiones completadas del mes en curso sin nota escrita. */
export const sessionsWithoutNote = (sessions: ProfessionalSession[], now: Date) =>
  sortByTime(sessions.filter(session => {
    const date = new Date(session.fecha_sesion);
    return session.estado === 'completada' && !session.has_note && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }));

export const unfinishedAgreements = (data?: AcompanamientoData) => data?.acuerdos.filter(item => !item.completado).length ?? 0;

export const pauseCardUsage = (usage?: AutonomyCardUsage[]) => usage?.find(row => row.entidadId === PAUSE_CARD_ID && row.count > 0);

export const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

/** Línea de contexto de una fila de "Hoy": solo con datos reales. */
export function buildContextLine(parts: { eta?: string; usage?: AutonomyCardUsage; agreements: number; finished?: string }) {
  const items = [
    parts.finished,
    parts.eta,
    parts.usage ? `usó «${parts.usage.label}» ${parts.usage.count === 1 ? '1 vez' : `${parts.usage.count} veces`}` : undefined,
    parts.agreements ? `${plural(parts.agreements, 'acuerdo', 'acuerdos')} sin cerrar` : undefined,
  ].filter(Boolean);
  return items.join(' · ');
}

export const hasRecentNote = (notes: PersonalNote[] | undefined, now: Date) =>
  Boolean(notes?.some(note => now.getTime() - Date.parse(note.createdAt) <= 7 * DAY_MS));

export const latestTutorName = (data?: AcompanamientoData) =>
  data?.notas.filter(note => note.autor_rol === 'tutor' && note.autor_nombre).sort((a, b) => b.fecha_creacion.localeCompare(a.fecha_creacion))[0]?.autor_nombre?.split(' ')[0];

export const unsentReportsThisMonth = (reports: GeneratedReport[], now: Date) =>
  reports.filter(report => {
    const date = new Date(report.fecha_generacion);
    return !report.enviado_al_tutor && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  });

export type WeekDay = { label: string; count: number; isToday: boolean };
const DAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'];

export function buildWeek(sessions: ProfessionalSession[], now: Date) {
  const monday = startOfLocalDay(now);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const weekend = new Date(monday); weekend.setDate(weekend.getDate() + 7);
  const inWeek = sessions.filter(session => time(session) >= monday.getTime() && time(session) < weekend.getTime());
  const active = inWeek.filter(session => session.estado !== 'cancelada');
  const days: WeekDay[] = DAY_LABELS.map((label, index) => {
    const day = new Date(monday); day.setDate(day.getDate() + index);
    return { label, count: active.filter(session => isSameLocalDay(new Date(session.fecha_sesion), day)).length, isToday: isSameLocalDay(day, now) };
  });
  const completed = inWeek.filter(session => session.estado === 'completada').length;
  const absent = inWeek.filter(session => session.estado === 'ausente').length;
  return {
    days,
    scheduled: active.length,
    cancelled: inWeek.length - active.length,
    remaining: active.filter(session => session.estado === 'programada' && time(session) + session.duracion_minutos * 60_000 > now.getTime()).length,
    attendance: completed + absent > 0 ? Math.round((completed / (completed + absent)) * 100) : null,
  };
}

export type AttentionInput = {
  patients: User[];
  now: Date;
  notesByUser: Record<string, PersonalNote[]>;
  agreements: Record<string, AcompanamientoData>;
  unscheduledUserIds: string[];
};

/** Señales con dato real por paciente; los pacientes sin señal no aparecen. */
export function attentionItems({ patients, now, notesByUser, agreements, unscheduledUserIds }: AttentionInput) {
  return patients.flatMap(patient => {
    const chips: { tone: 'purple' | 'amber' | 'gray'; text: string }[] = [];
    if (hasRecentNote(notesByUser[patient.id], now)) {
      const tutor = latestTutorName(agreements[patient.id]);
      chips.push({ tone: 'purple', text: tutor ? `Nota nueva de ${tutor}` : 'Nota nueva' });
    }
    const open = unfinishedAgreements(agreements[patient.id]);
    if (open) chips.push({ tone: 'amber', text: `${plural(open, 'acuerdo', 'acuerdos')} sin cerrar` });
    const unscheduled = unscheduledUserIds.includes(patient.id);
    if (unscheduled) chips.push({ tone: 'gray', text: 'Sin próxima sesión' });
    return chips.length ? [{ patient, chips, unscheduled }] : [];
  });
}
