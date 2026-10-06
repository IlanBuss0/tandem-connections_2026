import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { Activity } from '@/data/api';
import { joinNames, useHelpRequest } from './useHelpRequest';

const requestHelp = vi.hoisted(() => vi.fn());
vi.mock('@/services/api/tandem-api', () => ({ tandemApi: { actividadesAsignadas: { requestHelp } } }));

const activity = { id: '1', steps: ['Uno', 'Dos', 'Tres'], assignedActivityId: 7 } as unknown as Activity;

describe('useHelpRequest', () => {
  beforeEach(() => { requestHelp.mockReset(); });

  it('sent: manda paso, totalPasos y el texto del paso (no el ícono)', async () => {
    requestHelp.mockResolvedValue({ avisados: ['Laura'], repetido: false });
    const { result } = renderHook(() => useHelpRequest(activity));
    await act(async () => { await result.current.send('ayuda', 1); });
    expect(requestHelp).toHaveBeenCalledWith(7, { motivo: 'ayuda', paso: 2, totalPasos: 3, pasoTexto: 'Dos' });
    expect(result.current.status).toBe('sent');
    expect(result.current.avisados).toEqual(['Laura']);
  });

  it('failed si la request falla', async () => {
    requestHelp.mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => useHelpRequest(activity));
    await act(async () => { await result.current.send('ayuda', 0); });
    expect(result.current.status).toBe('failed');
  });

  it('failed si no avisó a nadie', async () => {
    requestHelp.mockResolvedValue({ avisados: [], repetido: false });
    const { result } = renderHook(() => useHelpRequest(activity));
    await act(async () => { await result.current.send('pausa', 0); });
    expect(result.current.status).toBe('failed');
  });

  it('failed sin llamar al backend si no hay assignedActivityId numérico', async () => {
    const { result } = renderHook(() => useHelpRequest({ ...activity, assignedActivityId: undefined } as unknown as Activity));
    await act(async () => { await result.current.send('ayuda', 0); });
    expect(result.current.status).toBe('failed');
    expect(requestHelp).not.toHaveBeenCalled();
  });

  it('un doble toque manda una sola request', async () => {
    let resolve: (value: { avisados: string[]; repetido: boolean }) => void = () => {};
    requestHelp.mockReturnValue(new Promise((r) => { resolve = r; }));
    const { result } = renderHook(() => useHelpRequest(activity));
    await act(async () => {
      void result.current.send('ayuda', 0);
      void result.current.send('ayuda', 0);
    });
    expect(requestHelp).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe('sending');
    await act(async () => { resolve({ avisados: ['Laura'], repetido: false }); });
    expect(result.current.status).toBe('sent');
  });
});

describe('joinNames', () => {
  it('une uno, dos o tres nombres', () => {
    expect(joinNames(['Laura'])).toBe('Laura');
    expect(joinNames(['Laura', 'Pedro'])).toBe('Laura y Pedro');
    expect(joinNames(['Laura', 'Pedro', 'Ana'])).toBe('Laura, Pedro y Ana');
  });
});
