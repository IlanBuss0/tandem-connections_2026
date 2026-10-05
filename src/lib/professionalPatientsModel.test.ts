import { describe, expect, it } from 'vitest';
import type { AcompanamientoData, ProfessionalSession, User } from '@/data/api';
import {
  buildPatientItems, filterAndSortPatients, formatInviteCode, formatNextSession, nextSessionForPatient, normalizeText, patientChip,
  type PatientLink,
} from './professionalPatientsModel';

const NOW = new Date(2026, 9, 7, 12, 0); // miércoles 7 oct 2026, 12:00
const at = (days: number, hour: number) => new Date(2026, 9, 7 + days, hour, 0).toISOString();
const daysAgo = (days: number) => new Date(NOW.getTime() - days * 86_400_000).toISOString();

const user = (id: string, name: string) => ({ id, name, avatar: '' }) as unknown as User;
const session = (over: Partial<ProfessionalSession>) => ({
  id: 1, id_profesional: 1, id_perteneciente: 10, fecha_sesion: at(1, 10), titulo: 'S', duracion_minutos: 45,
  estado: 'programada', recordatorios: [], ...over,
}) as ProfessionalSession;
const acomp = (notas: Array<{ autor_rol: string; autor_nombre?: string; fecha_creacion: string }>) =>
  ({ id_perteneciente: 10, notas, objetivos: [], acuerdos: [] }) as unknown as AcompanamientoData;
const link = (over: Partial<PatientLink> = {}): PatientLink => ({ pertenecienteId: 10, canViewHistory: true, canSchedule: true, canAssignActivities: true, ...over });

describe('formatNextSession', () => {
  it('formatea hoy, mañana, día de la semana y fecha', () => {
    expect(formatNextSession(at(0, 16), NOW)).toBe('Hoy 16:00');
    expect(formatNextSession(at(1, 10), NOW)).toBe('Mañana 10:00');
    expect(formatNextSession(at(2, 10), NOW)).toBe('Viernes 10:00');
    expect(formatNextSession(at(5, 9), NOW)).toBe('Lunes 09:00');
    expect(formatNextSession(at(7, 9), NOW)).toBe('14 oct 09:00');
  });
});

describe('nextSessionForPatient', () => {
  it('elige la programada futura más cercana del paciente', () => {
    const rows = [
      session({ id: 1, fecha_sesion: at(3, 10) }),
      session({ id: 2, fecha_sesion: at(1, 10) }),
      session({ id: 3, fecha_sesion: at(-1, 10) }),
      session({ id: 4, fecha_sesion: at(0, 18), estado: 'cancelada' }),
      session({ id: 5, fecha_sesion: at(0, 18), id_perteneciente: 99 }),
    ];
    expect(nextSessionForPatient(rows, 10, NOW.getTime())?.id).toBe(2);
    expect(nextSessionForPatient(rows, undefined, NOW.getTime())).toBeUndefined();
  });
});

describe('patientChip', () => {
  const pastNoNote = session({ estado: 'completada', fecha_sesion: daysAgo(1), has_note: false });

  it('prioriza historial privado sobre todo lo demás', () => {
    expect(patientChip(link({ canViewHistory: false }), [pastNoNote], acomp([]), NOW)?.kind).toBe('private');
  });
  it('sin vínculo (permisos sin cargar) no hay chip', () => {
    expect(patientChip(undefined, [], undefined, NOW)).toBeUndefined();
  });
  it('sesión sin nota gana a nota del tutor', () => {
    const data = acomp([{ autor_rol: 'tutor', autor_nombre: 'Laura Pérez', fecha_creacion: daysAgo(1) }]);
    expect(patientChip(link(), [pastNoNote], data, NOW)?.text).toBe('Sesión sin nota');
  });
  it('nota reciente del tutor usa su nombre de pila', () => {
    const data = acomp([{ autor_rol: 'tutor', autor_nombre: 'Laura Pérez', fecha_creacion: daysAgo(2) }]);
    expect(patientChip(link(), [], data, NOW)).toMatchObject({ kind: 'tutorNote', text: 'Nota nueva de Laura' });
  });
  it('ignora notas viejas o de otros roles', () => {
    const data = acomp([
      { autor_rol: 'tutor', autor_nombre: 'Laura', fecha_creacion: daysAgo(8) },
      { autor_rol: 'profesional', autor_nombre: 'Yo', fecha_creacion: daysAgo(1) },
    ]);
    expect(patientChip(link(), [], data, NOW)?.kind).toBe('upToDate');
  });
  it('recién vinculado si el vínculo tiene menos de 7 días', () => {
    expect(patientChip(link({ linkedAt: daysAgo(3) }), [], acomp([]), NOW)).toMatchObject({ kind: 'recent', text: 'Recién vinculado' });
  });
  it('espera el acompañamiento antes de decidir entre novedades, recién vinculado y al día', () => {
    expect(patientChip(link({ linkedAt: daysAgo(3) }), [], undefined, NOW)).toBeUndefined();
  });
});

describe('filterAndSortPatients', () => {
  const links = { a: link({ pertenecienteId: 1 }), b: link({ pertenecienteId: 2 }), c: link({ pertenecienteId: 3 }), d: link({ pertenecienteId: 4 }) };
  const items = buildPatientItems({
    patients: [user('a', 'Zoe'), user('b', 'Ángel'), user('c', 'Bruno'), user('d', 'Álvaro')],
    sessions: [
      session({ id: 1, id_perteneciente: 1, fecha_sesion: at(1, 10) }),
      session({ id: 2, id_perteneciente: 2, fecha_sesion: at(3, 10) }),
      session({ id: 3, id_perteneciente: 4, estado: 'completada', fecha_sesion: daysAgo(1), has_note: false }),
    ],
    links,
    acompanamiento: { a: acomp([]), b: acomp([{ autor_rol: 'tutor', fecha_creacion: daysAgo(1) }]), c: acomp([]), d: acomp([]) },
    now: NOW,
  });
  const names = (rows: typeof items) => rows.map(row => row.patient.name);

  it('próxima sesión: más cercana primero, sin sesión al final y A–Z', () => {
    expect(names(filterAndSortPatients(items, '', 'next'))).toEqual(['Zoe', 'Ángel', 'Álvaro', 'Bruno']);
  });
  it('A–Z ignora tildes en el orden', () => {
    expect(names(filterAndSortPatients(items, '', 'az'))).toEqual(['Álvaro', 'Ángel', 'Bruno', 'Zoe']);
  });
  it('con novedades: solo sesión sin nota o nota del tutor', () => {
    expect(names(filterAndSortPatients(items, '', 'news'))).toEqual(['Ángel', 'Álvaro']);
  });
  it('el buscador ignora tildes y mayúsculas', () => {
    expect(names(filterAndSortPatients(items, 'ANGEL', 'az'))).toEqual(['Ángel']);
    expect(normalizeText(' Álvaro ')).toBe('alvaro');
  });
});

describe('formatInviteCode', () => {
  it('normaliza a mayúsculas con guion y máximo 9 caracteres', () => {
    expect(formatInviteCode('abcd')).toBe('ABCD');
    expect(formatInviteCode('abcd1234')).toBe('ABCD-1234');
    expect(formatInviteCode('ab cd-12_34zz')).toBe('ABCD-1234');
    expect(formatInviteCode('!!')).toBe('');
  });
});
