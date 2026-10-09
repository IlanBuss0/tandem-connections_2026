import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

vi.mock('@/data/usageApi', () => ({ fetchHelpSpots: vi.fn() }));
import { fetchHelpSpots } from '@/data/usageApi';
import { useHelpSpots } from './useHelpSpots';

const report = { dias: 30, total: 1, porMotivo: { ayuda: 1, no_entiende: 0, pausa: 0 }, lugares: [] };

describe('useHelpSpots', () => {
  beforeEach(() => { vi.mocked(fetchHelpSpots).mockReset(); });

  it('carga una sola vez por persona y no pide nada si está deshabilitado', async () => {
    vi.mocked(fetchHelpSpots).mockResolvedValue(report);
    const { result, rerender } = renderHook(({ id, on }) => useHelpSpots(id, on), { initialProps: { id: '7', on: false } });
    expect(fetchHelpSpots).not.toHaveBeenCalled();
    rerender({ id: '7', on: true });
    await waitFor(() => expect(result.current.report).toEqual(report));
    rerender({ id: '7', on: false });
    rerender({ id: '7', on: true });
    expect(fetchHelpSpots).toHaveBeenCalledTimes(1);
    rerender({ id: '8', on: true });
    await waitFor(() => expect(fetchHelpSpots).toHaveBeenCalledTimes(2));
  });

  it('marca error cuando el pedido falla (null)', async () => {
    vi.mocked(fetchHelpSpots).mockResolvedValue(null);
    const { result } = renderHook(() => useHelpSpots('7', true));
    await waitFor(() => expect(result.current.failed).toBe(true));
    expect(result.current.loading).toBe(false);
  });
});
