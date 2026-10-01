import { describe, expect, it } from 'vitest';
import type { ProfessionalSession } from '@/data/api';
import { folderLine, folderSummary, groupByMonth, notesCount, notesToWrite, sessionWhen, sessionsWithNote } from './professionalNotesModel';

let seq = 0;
const s = (fecha: string, over: Partial<ProfessionalSession> = {}): ProfessionalSession => ({
  id: ++seq, id_profesional: 1, id_perteneciente: 10, fecha_sesion: fecha, titulo: 'Sesión', duracion_minutos: 45, estado: 'completada', recordatorios: [], ...over,
});

describe('notesToWrite', () => {
  it('solo completadas sin nota, de la más reciente a la más vieja', () => {
    const list = [
      s('2026-09-21T16:00:00'), s('2026-09-29T16:00:00'), s('2026-09-25T16:00:00', { has_note: true }),
      s('2026-09-28T16:00:00', { estado: 'programada' }), s('2026-09-27T16:00:00', { estado: 'cancelada' }), s('2026-09-26T16:00:00', { estado: 'ausente' }),
    ];
    expect(notesToWrite(list).map(x => x.fecha_sesion)).toEqual(['2026-09-29T16:00:00', '2026-09-21T16:00:00']);
  });

  it('deja fuera pacientes sin vínculo', () => {
    const list = [s('2026-09-21T16:00:00', { id_perteneciente: 10 }), s('2026-09-22T16:00:00', { id_perteneciente: 99 })];
    expect(notesToWrite(list, new Set([10]))).toHaveLength(1);
  });
});

describe('folderSummary / folderLine', () => {
  it('cuenta notas, última fecha (mayor fecha de sesión) y pendientes', () => {
    const summary = folderSummary([
      s('2026-09-14T16:00:00', { has_note: true }), s('2026-09-28T16:00:00', { has_note: true }), s('2026-09-21T16:00:00', { has_note: true }), s('2026-09-29T16:00:00'),
    ]);
    expect(summary).toMatchObject({ notes: 3, toWrite: 1 });
    expect(folderLine(summary)).toBe('3 notas · última el 28 sep');
  });

  it('singular, plural y carpeta vacía', () => {
    expect(notesCount(1)).toBe('1 nota');
    expect(notesCount(8)).toBe('8 notas');
    expect(folderLine(folderSummary([s('2026-09-14T16:00:00', { has_note: true })]))).toBe('1 nota · última el 14 sep');
    expect(folderLine(folderSummary([]))).toBe('Todavía no hay notas');
    expect(folderLine(folderSummary([s('2026-09-14T16:00:00')]))).toBe('Todavía no hay notas');
  });
});

describe('groupByMonth', () => {
  it('agrupa por mes, meses y sesiones de más nuevo a más viejo', () => {
    const groups = groupByMonth(sessionsWithNote([
      s('2026-08-31T16:00:00', { has_note: true }), s('2026-09-14T16:00:00', { has_note: true }), s('2026-09-21T16:00:00', { has_note: true }), s('2026-09-30T16:00:00'),
    ]));
    expect(groups.map(g => g.label)).toEqual(['Septiembre 2026', 'Agosto 2026']);
    expect(groups[0].sessions.map(x => x.fecha_sesion.slice(0, 10))).toEqual(['2026-09-21', '2026-09-14']);
  });
});

describe('sessionWhen', () => {
  const now = new Date(2026, 8, 30, 10, 0);
  it('hoy, ayer y día anterior', () => {
    expect(sessionWhen(new Date(2026, 8, 30, 8, 5).toISOString(), now)).toBe('hoy 08:05');
    expect(sessionWhen(new Date(2026, 8, 29, 16, 0).toISOString(), now)).toBe('ayer 16:00');
    expect(sessionWhen(new Date(2026, 8, 28, 18, 0).toISOString(), now)).toBe('lun 28 sep · 18:00');
  });
});
