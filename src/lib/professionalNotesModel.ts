import type { ProfessionalSession } from '@/data/api';
import { MONTH_NAMES } from '@/lib/professionalReports';
import { MONTHS_SHORT, WEEKDAYS } from '@/lib/emotionSummary';
import { localDateKey } from '@/lib/agendaFormat';

/** Funciones puras de "Documentos y notas": qué sesiones esperan nota y cómo se agrupan las que ya la tienen. */

const byDateDesc = (a: ProfessionalSession, b: ProfessionalSession) => b.fecha_sesion.localeCompare(a.fecha_sesion);

/** Sesiones completadas sin nota, de la más reciente a la más vieja. `pertenecienteIds` deja fuera pacientes sin vínculo. */
export function notesToWrite(sessions: ProfessionalSession[], pertenecienteIds?: ReadonlySet<number>) {
  return sessions
    .filter(s => s.estado === 'completada' && !s.has_note && (!pertenecienteIds || pertenecienteIds.has(Number(s.id_perteneciente))))
    .sort(byDateDesc);
}

/** Sesiones del paciente que ya tienen nota, de la más reciente a la más vieja. */
export const sessionsWithNote = (sessions: ProfessionalSession[]) => sessions.filter(s => s.has_note).sort(byDateDesc);

export type FolderSummary = { notes: number; lastNoteAt?: string; toWrite: number };

/** Resumen de la carpeta de un paciente (sus sesiones). La última nota es la de mayor fecha de sesión. */
export function folderSummary(sessions: ProfessionalSession[]): FolderSummary {
  const withNote = sessionsWithNote(sessions);
  return { notes: withNote.length, lastNoteAt: withNote[0]?.fecha_sesion, toWrite: notesToWrite(sessions).length };
}

/** Sesiones agrupadas por mes ("Septiembre 2026"), del más reciente al más viejo. */
export function groupByMonth(sessions: ProfessionalSession[]) {
  const groups: { label: string; sessions: ProfessionalSession[] }[] = [];
  [...sessions].sort(byDateDesc).forEach(session => {
    const date = new Date(session.fecha_sesion);
    const label = Number.isNaN(date.getTime()) ? 'Sin fecha' : `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
    const group = groups.find(entry => entry.label === label);
    if (group) group.sessions.push(session);
    else groups.push({ label, sessions: [session] });
  });
  return groups;
}

export const notesCount = (count: number) => `${count} ${count === 1 ? 'nota' : 'notas'}`;

const clock = (date: Date) => `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
const dayMonth = (date: Date) => `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]}`;
const dayName = (date: Date) => WEEKDAYS[date.getDay()].slice(0, 3);

/** "28 sep" */
export const shortDay = (value: string) => dayMonth(new Date(value));

/** "lun 21 sep · 16:00" */
export const sessionDateTime = (value: string) => {
  const date = new Date(value);
  return `${dayName(date)} ${dayMonth(date)} · ${clock(date)}`;
};

/** "hoy 16:00", "ayer 16:00" o "lun 28 sep · 18:00". */
export function sessionWhen(value: string, now = new Date()) {
  const date = new Date(value);
  const key = localDateKey(date);
  if (key === localDateKey(now)) return `hoy ${clock(date)}`;
  if (key === localDateKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1))) return `ayer ${clock(date)}`;
  return sessionDateTime(value);
}

/** "8 notas · última el 28 sep" o "Todavía no hay notas". */
export const folderLine = ({ notes, lastNoteAt }: FolderSummary) =>
  notes && lastNoteAt ? `${notesCount(notes)} · última el ${shortDay(lastNoteAt)}` : 'Todavía no hay notas';
