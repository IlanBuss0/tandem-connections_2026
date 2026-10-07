import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import type { RoutineItem } from '@/data/api';

const api = vi.hoisted(() => ({
  fetchRoutinesForUser: vi.fn(),
  saveRoutinesForUser: vi.fn(async () => undefined),
  fetchCustomCategoriesForUser: vi.fn(async () => ({ customCategories: [], hiddenPredefined: [] })),
  saveCustomCategoriesForUser: vi.fn(async () => undefined),
}));
const logUsageEvent = vi.hoisted(() => vi.fn());
vi.mock('@/data/api', () => api);
vi.mock('@/data/usageApi', () => ({ logUsageEvent }));
// Usuario estable: el contexto recarga todo cuando cambia la referencia de `user`.
const auth = vi.hoisted(() => ({ value: { user: { id: '7', role: 'user' } } }));
vi.mock('./AuthContext', () => ({ useAuth: () => auth.value }));

import { RoutinesProvider, useRoutines } from './RoutinesContext';

const item = (id: string, extra: Partial<RoutineItem> = {}): RoutineItem => ({ id, time: '08:00', title: `Paso ${id}`, icon: '', completed: false, category: 'mañana', ...extra });
const stored = (items: RoutineItem[]) => [{ id: 'r1', name: 'Mi mañana', dayOfWeek: 1, items }];

function Probe() {
  const { routines, toggleItem, duplicateRoutine } = useRoutines();
  return (
    <div>
      {routines.flatMap((routine) => routine.items.map((it) => (
        <p key={it.id} data-testid={it.id}>{`${it.completed ? 'hecho' : 'pendiente'}|${it.completedOn ?? '-'}`}</p>
      )))}
      <button onClick={() => toggleItem('r1', 'a')}>toggle a</button>
      <button onClick={() => duplicateRoutine('r1')}>duplicar</button>
    </div>
  );
}

// Solo se simulan la fecha y el intervalo de 60 s; el guardado (debounce de 300 ms) corre con tiempo real.
const flush = async () => { await act(async () => { await new Promise((resolve) => setTimeout(resolve, 380)); }); };
// waitFor de testing-library usa setInterval (que aca esta simulado): se espera con tiempo real.
async function until(condition: () => boolean) {
  for (let attempt = 0; attempt < 30 && !condition(); attempt += 1) {
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 50)); });
  }
  expect(condition()).toBe(true);
}
async function mount() {
  render(<RoutinesProvider><Probe /></RoutinesProvider>);
  await flush();
}

describe('RoutinesProvider: los pasos cuentan como hechos solo el día en que se completan', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] });
    vi.setSystemTime(new Date(2026, 9, 6, 10, 0));
    api.saveRoutinesForUser.mockClear();
    logUsageEvent.mockClear();
  });
  afterEach(() => { vi.useRealTimers(); });

  it('completar guarda completedOn de hoy (hora local), destildar lo borra, y el registro de uso se mantiene', async () => {
    api.fetchRoutinesForUser.mockResolvedValue(stored([item('a')]));
    await mount();
    expect(screen.getByTestId('a')).toHaveTextContent('pendiente|-');

    await act(async () => { screen.getByText('toggle a').click(); });
    expect(screen.getByTestId('a')).toHaveTextContent('hecho|2026-10-06');
    expect(logUsageEvent).toHaveBeenCalledWith(expect.objectContaining({ tipoEvento: 'rutina_paso_completado', entidadId: 'a' }));

    await act(async () => { screen.getByText('toggle a').click(); });
    expect(screen.getByTestId('a')).toHaveTextContent('pendiente|-');
    expect(logUsageEvent).toHaveBeenCalledTimes(1); // destildar no es un uso
  });

  it('al cargar, lo completado hoy sigue hecho (recargar no lo reinicia) y no genera guardados de más', async () => {
    api.fetchRoutinesForUser.mockResolvedValue(stored([item('a', { completed: true, completedOn: '2026-10-06' })]));
    await mount();
    expect(screen.getByTestId('a')).toHaveTextContent('hecho|2026-10-06');
    await until(() => api.saveRoutinesForUser.mock.calls.length > 0); // el guardado de siempre al cargar
    const savesAfterLoad = api.saveRoutinesForUser.mock.calls.length;
    act(() => { vi.advanceTimersByTime(180_000); }); // 3 chequeos de 60 s
    await flush();
    expect(api.saveRoutinesForUser.mock.calls.length).toBe(savesAfterLoad);
  });

  it('al cargar, lo completado otro día (o sin fecha) aparece sin completar y se guarda reiniciado', async () => {
    api.fetchRoutinesForUser.mockResolvedValue(stored([item('a', { completed: true, completedOn: '2026-10-05' }), item('b', { completed: true })]));
    await mount();
    expect(screen.getByTestId('a')).toHaveTextContent('pendiente|-');
    expect(screen.getByTestId('b')).toHaveTextContent('pendiente|-');
    await until(() => api.saveRoutinesForUser.mock.calls.length > 0);
    const lastSave = api.saveRoutinesForUser.mock.calls.at(-1) as unknown as [string, { items: RoutineItem[] }[]];
    expect(lastSave[1][0].items.every((it) => it.completed === false)).toBe(true);
  });

  it('con la app abierta pasando la medianoche, al volver a la pestaña (o a los 60 s) se reinicia', async () => {
    api.fetchRoutinesForUser.mockResolvedValue(stored([item('a', { completed: true, completedOn: '2026-10-06' }), item('b', { completed: true, completedOn: '2026-10-06' })]));
    await mount();
    expect(screen.getByTestId('a')).toHaveTextContent('hecho|2026-10-06');

    vi.setSystemTime(new Date(2026, 9, 7, 0, 5));
    await act(async () => { window.dispatchEvent(new Event('focus')); });
    expect(screen.getByTestId('a')).toHaveTextContent('pendiente|-');
    expect(screen.getByTestId('b')).toHaveTextContent('pendiente|-');
    await flush();
    expect(api.saveRoutinesForUser).toHaveBeenCalled();
  });

  it('el chequeo cada 60 s también reinicia, y limpia el intervalo al desmontar', async () => {
    api.fetchRoutinesForUser.mockResolvedValue(stored([item('a', { completed: true, completedOn: '2026-10-06' })]));
    const { unmount } = render(<RoutinesProvider><Probe /></RoutinesProvider>);
    await flush();
    vi.setSystemTime(new Date(2026, 9, 7, 0, 5));
    act(() => { vi.advanceTimersByTime(60_000); });
    expect(screen.getByTestId('a')).toHaveTextContent('pendiente|-');
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('duplicar una rutina deja los pasos sin completar y sin fecha', async () => {
    api.fetchRoutinesForUser.mockResolvedValue(stored([item('a', { completed: true, completedOn: '2026-10-06' })]));
    await mount();
    await act(async () => { screen.getByText('duplicar').click(); });
    const copy = screen.getAllByTestId(/^a-c/);
    expect(copy).toHaveLength(1);
    expect(copy[0]).toHaveTextContent('pendiente|-');
  });
});
