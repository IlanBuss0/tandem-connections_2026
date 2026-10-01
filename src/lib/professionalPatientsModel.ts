import type { AcompanamientoData, PermissionContext, ProfessionalSession, User } from '@/data/api';
import { isPermissionEnabled, PROFESIONAL_PERMISSIONS } from '@/hooks/usePermissions';
import { formatClock, latestTutorName, sessionsWithoutNote, startOfLocalDay } from '@/components/professional/home/homeData';

const DAY_MS = 86_400_000;

export type PatientSort = 'next' | 'news' | 'az';
export type PatientChipKind = 'private' | 'noNote' | 'tutorNote' | 'recent' | 'upToDate';
export type PatientChip = { kind: PatientChipKind; tone: 'gray' | 'amber' | 'purple' | 'green'; text: string };

export type PatientLink = {
  pertenecienteId: number;
  canViewHistory: boolean;
  canSchedule: boolean;
  canAssignActivities: boolean;
  /** Fecha en que el vínculo quedó activo (resolución o, si falta, solicitud). */
  linkedAt?: string;
};

export type PatientListItem = {
  patient: User;
  nextSessionAt?: string;
  chip?: PatientChip;
  canSchedule: boolean;
};

export function nextSessionForPatient(sessions: ProfessionalSession[], pertenecienteId: number | undefined, now = Date.now()) {
  if (!pertenecienteId) return undefined;
  return sessions
    .filter(session =>
      Number(session.id_perteneciente) === pertenecienteId
      && session.estado === 'programada'
      && new Date(session.fecha_sesion).getTime() >= now,
    )
    .sort((a, b) => a.fecha_sesion.localeCompare(b.fecha_sesion))[0];
}

/** Vínculos por id de usuario del paciente. Sin contexto de permisos no hay datos de vínculo. */
export function buildPatientLinks(context: PermissionContext | null | undefined, patients: User[]) {
  const byUser = new Map((context?.vinculos ?? []).map(item => [String(item.perteneciente.usuario.id), item]));
  const links: Record<string, PatientLink> = {};
  patients.forEach(patient => {
    const item = byUser.get(String(patient.id));
    if (!item) return;
    const permisos = item.permisos_efectivos.permisos;
    const approved = Boolean(item.permisos_efectivos.vinculo_aprobado);
    links[patient.id] = {
      pertenecienteId: Number(item.perteneciente.id),
      canViewHistory: isPermissionEnabled(permisos, PROFESIONAL_PERMISSIONS.VER_HISTORIAL, false),
      canSchedule: approved && isPermissionEnabled(permisos, PROFESIONAL_PERMISSIONS.AGENDAR_SESIONES, true),
      canAssignActivities: isPermissionEnabled(permisos, PROFESIONAL_PERMISSIONS.ASIGNAR_ACTIVIDADES, true),
      linkedAt: item.vinculo.fecha_resolucion ?? item.vinculo.fecha_solicitud,
    };
  });
  return links;
}

const WEEKDAY_FORMAT = new Intl.DateTimeFormat('es-AR', { weekday: 'long' });

/** "Hoy 16:00", "Mañana 10:00", "Jueves 10:00" (próximos 6 días) o "12 oct 10:00". */
export function formatNextSession(value: string, now: Date) {
  const date = new Date(value);
  const days = Math.round((startOfLocalDay(date).getTime() - startOfLocalDay(now).getTime()) / DAY_MS);
  const clock = formatClock(value);
  if (days <= 0) return `Hoy ${clock}`;
  if (days === 1) return `Mañana ${clock}`;
  if (days < 7) {
    const weekday = WEEKDAY_FORMAT.format(date);
    return `${weekday.charAt(0).toLocaleUpperCase('es-AR')}${weekday.slice(1)} ${clock}`;
  }
  return `${date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }).replace('.', '')} ${clock}`;
}

const within7Days = (value: string | undefined, now: Date) => {
  const time = Date.parse(value || '');
  return Number.isFinite(time) && now.getTime() - time >= 0 && now.getTime() - time < 7 * DAY_MS;
};

/**
 * Un solo chip por prioridad. Devuelve undefined mientras falte el dato que decide
 * (acompañamiento sin cargar) para no mostrar un chip que después cambie.
 */
export function patientChip(
  link: PatientLink | undefined,
  patientSessions: ProfessionalSession[],
  acompanamiento: AcompanamientoData | undefined,
  now: Date,
): PatientChip | undefined {
  if (!link) return undefined;
  if (!link.canViewHistory) return { kind: 'private', tone: 'gray', text: 'Historial privado' };
  if (sessionsWithoutNote(patientSessions, now).length) return { kind: 'noNote', tone: 'amber', text: 'Sesión sin nota' };
  if (!acompanamiento) return undefined;
  if (acompanamiento.notas.some(note => note.autor_rol === 'tutor' && within7Days(note.fecha_creacion, now))) {
    const tutor = latestTutorName(acompanamiento);
    return { kind: 'tutorNote', tone: 'purple', text: tutor ? `Nota nueva de ${tutor}` : 'Nota nueva' };
  }
  if (within7Days(link.linkedAt, now)) return { kind: 'recent', tone: 'green', text: 'Recién vinculado' };
  return { kind: 'upToDate', tone: 'green', text: 'Al día' };
}

type BuildInput = {
  patients: User[];
  sessions: ProfessionalSession[];
  links: Record<string, PatientLink>;
  acompanamiento: Record<string, AcompanamientoData>;
  now: Date;
};

export function buildPatientItems({ patients, sessions, links, acompanamiento, now }: BuildInput): PatientListItem[] {
  return patients.map(patient => {
    const link = links[patient.id];
    const own = link ? sessions.filter(session => Number(session.id_perteneciente) === link.pertenecienteId) : [];
    return {
      patient,
      nextSessionAt: nextSessionForPatient(own, link?.pertenecienteId, now.getTime())?.fecha_sesion,
      chip: patientChip(link, own, acompanamiento[patient.id], now),
      canSchedule: Boolean(link?.canSchedule),
    };
  });
}

export const normalizeText = (value: string) =>
  value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLocaleLowerCase('es').trim();

const byName = (a: PatientListItem, b: PatientListItem) => a.patient.name.localeCompare(b.patient.name, 'es');
const byNextSession = (a: PatientListItem, b: PatientListItem) => {
  if (a.nextSessionAt && b.nextSessionAt) return a.nextSessionAt.localeCompare(b.nextSessionAt) || byName(a, b);
  if (a.nextSessionAt) return -1;
  if (b.nextSessionAt) return 1;
  return byName(a, b);
};

export function filterAndSortPatients(items: PatientListItem[], query: string, sort: PatientSort) {
  const text = normalizeText(query);
  const matches = items.filter(item => normalizeText(item.patient.name).includes(text));
  if (sort === 'az') return [...matches].sort(byName);
  if (sort === 'news') return matches.filter(item => item.chip?.kind === 'noNote' || item.chip?.kind === 'tutorNote').sort(byNextSession);
  return [...matches].sort(byNextSession);
}

/** Normaliza lo tipeado/pegado: mayúsculas, solo A-Z 0-9, y guion tras 4 caracteres (máx. 9). */
export function formatInviteCode(raw: string) {
  const compact = raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
  return compact.length > 4 ? `${compact.slice(0, 4)}-${compact.slice(4)}` : compact;
}
