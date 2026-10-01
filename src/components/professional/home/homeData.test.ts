import { describe, expect, it } from 'vitest';
import type { ProfessionalSession } from '@/data/api';
import { buildContextLine, buildWeek, formatLongDate, nextTodaySession, sessionsWithoutNote, todaySessions } from './homeData';

const session = (id: number, fecha: string, extra: Partial<ProfessionalSession> = {}): ProfessionalSession => ({
  id, id_profesional: 1, id_perteneciente: 7, fecha_sesion: fecha, titulo: 'Sesión', duracion_minutos: 45, estado: 'programada', recordatorios: [], ...extra,
});
const now = new Date(2026, 8, 29, 15, 35); // martes 29/09/2026 local

describe('homeData', () => {
  it('usa la fecha local para decidir qué es "hoy" y excluye canceladas', () => {
    const rows = [
      session(1, new Date(2026, 8, 29, 23, 30).toISOString()),
      session(2, new Date(2026, 8, 29, 10, 0).toISOString(), { estado: 'completada' }),
      session(3, new Date(2026, 8, 29, 12, 0).toISOString(), { estado: 'cancelada' }),
      session(4, new Date(2026, 8, 30, 0, 30).toISOString()),
    ];
    expect(todaySessions(rows, now).map(row => row.id)).toEqual([2, 1]);
  });

  it('elige la próxima sesión por empezar', () => {
    const today = todaySessions([session(1, new Date(2026, 8, 29, 10, 0).toISOString()), session(2, new Date(2026, 8, 29, 16, 0).toISOString())], now);
    expect(nextTodaySession(today, now)?.id).toBe(2);
  });

  it('cuenta solo sesiones completadas del mes sin nota', () => {
    const rows = [
      session(1, new Date(2026, 8, 2).toISOString(), { estado: 'completada' }),
      session(2, new Date(2026, 8, 3).toISOString(), { estado: 'completada', has_note: true }),
      session(3, new Date(2026, 7, 30).toISOString(), { estado: 'completada' }),
    ];
    expect(sessionsWithoutNote(rows, now).map(row => row.id)).toEqual([1]);
  });

  it('arma la línea de contexto solo con datos existentes', () => {
    expect(buildContextLine({ agreements: 0 })).toBe('');
    expect(buildContextLine({ eta: 'En 25 min', agreements: 1, usage: { entidadTipo: 't', entidadId: 'necesito-un-momento', label: 'Necesito un momento', count: 3 } }))
      .toBe('En 25 min · usó «Necesito un momento» 3 veces · 1 acuerdo sin cerrar');
  });

  it('calcula la semana y la asistencia', () => {
    const rows = [
      session(1, new Date(2026, 8, 28, 10).toISOString(), { estado: 'completada' }),
      session(2, new Date(2026, 8, 28, 11).toISOString(), { estado: 'ausente' }),
      session(3, new Date(2026, 8, 29, 16).toISOString()),
      session(4, new Date(2026, 8, 29, 17).toISOString(), { estado: 'cancelada' }),
    ];
    const week = buildWeek(rows, now);
    expect(week.days.map(day => day.count)).toEqual([2, 1, 0, 0, 0]);
    expect(week.days[1].isToday).toBe(true);
    expect([week.scheduled, week.cancelled, week.remaining, week.attendance]).toEqual([3, 1, 1, 50]);
    expect(buildWeek([], now).attendance).toBeNull();
  });
});

describe('formatLongDate', () => {
  it('formatea fecha y hora en es-AR sin coma', () => {
    expect(formatLongDate(now)).toBe('Martes 29 de septiembre · 15:35');
  });
});
