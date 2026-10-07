import { describe, expect, it } from 'vitest';
import type { Notification } from '@/data/api';
import { helpReason, isHelpAlert, parseHelpMessage, pendingHelpAlerts } from './helpAlerts';

const NOW = new Date('2026-10-06T12:00:00Z').getTime();
const minutesAgo = (minutes: number) => new Date(NOW - minutes * 60000).toISOString();
const make = (id: string, referenceType: string | undefined, minutes: number, read = false): Notification => ({
  id, userId: '1', title: 't', message: 'm', type: 'alert', icon: '⚠️', read, timestamp: minutesAgo(minutes), referenceType,
});

describe('isHelpAlert / helpReason', () => {
  it('reconoce los avisos de ayuda y su motivo', () => {
    expect(isHelpAlert(make('1', 'activity_help:ayuda', 1))).toBe(true);
    expect(isHelpAlert(make('2', 'activity', 1))).toBe(false);
    expect(isHelpAlert(make('3', undefined, 1))).toBe(false);
    expect(helpReason(make('1', 'activity_help:no_entiende', 1))).toBe('no_entiende');
    expect(helpReason(make('1', 'activity_help:pausa', 1))).toBe('pausa');
    expect(helpReason(make('1', 'activity_help:otra', 1))).toBe('ayuda');
    expect(helpReason(make('1', 'activity_help', 1))).toBe('ayuda');
  });
});

describe('pendingHelpAlerts', () => {
  it('filtra no leídas, de ayuda, de las últimas 2 horas y no descartadas, la más nueva primero', () => {
    const list = [
      make('viejo', 'activity_help:ayuda', 10),
      make('nuevo', 'activity_help:pausa', 1),
      make('leido', 'activity_help:ayuda', 2, true),
      make('otro-tipo', 'chat', 1),
      make('muy-viejo', 'activity_help:ayuda', 121),
      make('descartado', 'activity_help:ayuda', 3),
      make('limite', 'activity_help:no_entiende', 119),
    ];
    expect(pendingHelpAlerts(list, ['descartado'], NOW).map((n) => n.id)).toEqual(['nuevo', 'viejo', 'limite']);
  });

  it('acepta un Set de descartados y fechas inválidas se ignoran', () => {
    const bad = { ...make('malo', 'activity_help:ayuda', 1), timestamp: 'no-es-fecha' };
    expect(pendingHelpAlerts([bad, make('ok', 'activity_help:ayuda', 1)], new Set(['x']), NOW).map((n) => n.id)).toEqual(['ok']);
  });
});

describe('parseHelpMessage', () => {
  it('resalta el título y el texto del paso', () => {
    expect(parseHelpMessage('En «Preparar la mochila», paso 3 de 5: Agregar cuadernos')).toEqual([
      { text: 'En ', bold: false },
      { text: 'Preparar la mochila', bold: true },
      { text: ', paso 3 de 5:', bold: false },
      { text: 'Agregar cuadernos', bold: true, breakBefore: true },
    ]);
  });

  it('en la pausa solo resalta el título y sin «» deja texto plano', () => {
    expect(parseHelpMessage('Estaba en «Mochila», paso 3 de 5. Quiso que lo sepas.')).toEqual([
      { text: 'Estaba en ', bold: false },
      { text: 'Mochila', bold: true },
      { text: ', paso 3 de 5. Quiso que lo sepas.', bold: false },
    ]);
    expect(parseHelpMessage('Texto simple')).toEqual([{ text: 'Texto simple', bold: false }]);
  });
});
