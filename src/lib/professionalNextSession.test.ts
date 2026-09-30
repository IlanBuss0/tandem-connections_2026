import { describe, expect, it } from 'vitest';
import type { ProfessionalSession } from '@/data/api';
import type { UsageEventRecord } from '@/data/usageApi';
import { buildNextSessionModel, formatLastSession, formatSessionWhen, permissionNoteParts, type NextSessionInput } from './professionalNextSession';

const NOW = new Date(2026, 8, 29, 12, 0); // martes 29 sep 2026, 12:00
const at = (days: number, hour: number, minute = 0) => new Date(2026, 8, 29 + days, hour, minute).toISOString();
const session = (over: Partial<ProfessionalSession>) => ({
  id: 1, id_profesional: 1, id_perteneciente: 10, fecha_sesion: at(1, 10), titulo: 'S', duracion_minutos: 45,
  estado: 'programada', recordatorios: [], ...over,
}) as ProfessionalSession;
const pauseEvent = (when: string, id = 'necesito-un-momento') =>
  ({ id: 1, tipo_evento: 'tarjeta_autonomia_usada', entidad_id: id, ocurrido_en: when }) as UsageEventRecord;
const input = (over: Partial<NextSessionInput> = {}): NextSessionInput => ({
  sessions: [], now: NOW, canViewHistory: true, canSchedule: true, usageEvents: [], openAgreements: 0, stepsDirection: null, moodDirection: null, ...over,
});
const ids = (model: ReturnType<typeof buildNextSessionModel>) => model.chips.map(chip => chip.id);
const kinds = (model: ReturnType<typeof buildNextSessionModel>) => model.actions.map(action => action.kind);

describe('formatSessionWhen', () => {
  it('hoy con cuenta regresiva, mañana y día con número', () => {
    expect(formatSessionWhen(at(0, 12, 25), NOW)).toBe('Hoy 12:25 · en 25 min');
    expect(formatSessionWhen(at(0, 14, 25), NOW)).toBe('Hoy 14:25 · en 2 h 25 min');
    expect(formatSessionWhen(at(0, 11, 0), NOW)).toBe('Hoy 11:00');
    expect(formatSessionWhen(at(1, 10), NOW)).toBe('Mañana 10:00');
    expect(formatSessionWhen(at(2, 10), NOW)).toBe('Jueves 1 oct · 10:00');
    expect(formatSessionWhen(at(-4, 9), new Date(2026, 8, 29, 12))).toBe('Viernes 25 · 09:00');
    expect(formatLastSession(at(-5, 10))).toBe('jueves 24 sep');
  });
});

describe('buildNextSessionModel', () => {
  it('sin datos queda solo la fecha y los botones', () => {
    const model = buildNextSessionModel(input({ sessions: [session({})] }));
    expect(model.title).toBe('Mañana 10:00');
    expect(model.chips).toEqual([]);
    expect(kinds(model)).toEqual(['prepare']);
  });

  it('chips con dato real: pausas desde la última sesión, acuerdos y evolución', () => {
    const model = buildNextSessionModel(input({
      sessions: [session({}), session({ id: 2, estado: 'completada', fecha_sesion: at(-3, 10), has_note: true })],
      usageEvents: [pauseEvent(at(-1, 9)), pauseEvent(at(-1, 10)), pauseEvent(at(-5, 9)), pauseEvent(at(-1, 9), 'otra-tarjeta')],
      openAgreements: 1, stepsDirection: 1, moodDirection: 0,
    }));
    expect(model.chips.map(chip => chip.text)).toEqual(['2 tarjetas de pausa', '1 acuerdo sin cerrar', 'Autonomía mejoró', 'Ánimo estable']);
    expect(kinds(model)).toEqual(['prepare', 'previousNote']);
  });

  it('sin sesión completada no hay chip de pausas', () => {
    expect(ids(buildNextSessionModel(input({ sessions: [session({})], usageEvents: [pauseEvent(at(-1, 9))] })))).toEqual([]);
  });

  it('nota de hoy sin escribir: chip ámbar y solo "Escribir nota"', () => {
    const today = session({ id: 3, estado: 'completada', fecha_sesion: at(0, 9), has_note: false });
    const model = buildNextSessionModel(input({ sessions: [session({}), today] }));
    expect(model.chips.map(chip => chip.text)).toEqual(['Nota de hoy sin escribir']);
    expect(model.actions).toEqual([{ kind: 'writeNote', session: today }]);
  });

  it('nota de hoy guardada: chip verde y sin botones', () => {
    const model = buildNextSessionModel(input({ sessions: [session({}), session({ id: 3, estado: 'completada', fecha_sesion: at(0, 9), has_note: true })] }));
    expect(model.chips.map(chip => chip.text)).toEqual(['Nota de hoy guardada']);
    expect(model.actions).toEqual([]);
  });

  it('sin próxima sesión: título, última sesión y Agendar solo con permiso', () => {
    const sessions = [session({ id: 2, estado: 'completada', fecha_sesion: at(-5, 10) })];
    const model = buildNextSessionModel(input({ sessions }));
    expect(model.title).toBe('Sin próxima sesión');
    expect(model.chips.map(chip => chip.text)).toEqual(['Última: jueves 24 sep']);
    expect(kinds(model)).toEqual(['schedule']);
    expect(kinds(buildNextSessionModel(input({ sessions, canSchedule: false })))).toEqual([]);
  });

  it('sin permiso de historial: solo fecha y hora, sin chips ni botones de preparación', () => {
    const model = buildNextSessionModel(input({
      canViewHistory: false, openAgreements: 2, stepsDirection: 1,
      sessions: [session({}), session({ id: 2, estado: 'completada', fecha_sesion: at(0, 9), has_note: false })],
    }));
    expect(model.title).toBe('Mañana 10:00');
    expect(model.chips).toEqual([]);
    expect(model.actions).toEqual([]);
  });
});

describe('permissionNoteParts', () => {
  const all = { canViewHistory: true, canSchedule: true, canAssignActivities: true };
  it('lista solo los permisos habilitados', () => {
    expect(permissionNoteParts(all).enabled).toBe('historial, sesiones y actividades');
    expect(permissionNoteParts({ ...all, canAssignActivities: false }).enabled).toBe('historial y sesiones');
    expect(permissionNoteParts({ ...all, canSchedule: false }).enabled).toBe('historial y actividades');
    expect(permissionNoteParts({ ...all, canSchedule: false, canAssignActivities: false }).enabled).toBe('historial');
  });
  it('sin historial usa el aviso de solo sesiones', () => {
    expect(permissionNoteParts({ ...all, canViewHistory: false })).toEqual({ before: 'La familia todavía no compartió el historial. Ves solo las sesiones.', enabled: '', after: '' });
  });
});
