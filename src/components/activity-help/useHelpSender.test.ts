import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useHelpSender } from './useHelpSender';

describe('useHelpSender', () => {
  it('envía y queda sent con los nombres avisados (repetido también cuenta como éxito)', async () => {
    const sendFn = vi.fn(async (_motivo: string) => ({ avisados: ['Laura', '', 'Pedro'], repetido: true }));
    const { result } = renderHook(() => useHelpSender(sendFn));
    expect(result.current.status).toBe('idle');
    await act(async () => { await result.current.send('ayuda'); });
    expect(sendFn).toHaveBeenCalledWith('ayuda');
    expect(result.current.status).toBe('sent');
    expect(result.current.avisados).toEqual(['Laura', 'Pedro']);
  });

  it('failed si avisados viene vacío o mal formado', async () => {
    const sendFn = vi.fn(async () => ({ avisados: [] as string[] }));
    const { result } = renderHook(() => useHelpSender(sendFn));
    await act(async () => { await result.current.send(); });
    expect(result.current.status).toBe('failed');
    sendFn.mockResolvedValueOnce({ avisados: undefined } as unknown as { avisados: string[] });
    await act(async () => { await result.current.send(); });
    expect(result.current.status).toBe('failed');
    expect(result.current.avisados).toEqual([]);
  });

  it('failed si el pedido tira error, y puede reintentarse después', async () => {
    const sendFn = vi.fn<() => Promise<{ avisados: string[] }>>().mockRejectedValueOnce(new Error('boom')).mockResolvedValueOnce({ avisados: ['Laura'] });
    const { result } = renderHook(() => useHelpSender(sendFn));
    await act(async () => { await result.current.send(); });
    expect(result.current.status).toBe('failed');
    await act(async () => { await result.current.send(); });
    expect(result.current.status).toBe('sent');
    expect(sendFn).toHaveBeenCalledTimes(2);
  });

  it('failed sin pasar por sending cuando sendFn devuelve null o tira sin promesa', async () => {
    const { result } = renderHook(() => useHelpSender(() => null));
    await act(async () => { await result.current.send(); });
    expect(result.current.status).toBe('failed');
    const throwing = renderHook(() => useHelpSender((): Promise<{ avisados: string[] }> => { throw new Error('sync'); }));
    await act(async () => { await throwing.result.current.send(); });
    expect(throwing.result.current.status).toBe('failed');
  });

  it('ignora un doble toque mientras envía', async () => {
    let resolve: (value: { avisados: string[] }) => void = () => {};
    const sendFn = vi.fn(() => new Promise<{ avisados: string[] }>((r) => { resolve = r; }));
    const { result } = renderHook(() => useHelpSender(sendFn));
    await act(async () => {
      void result.current.send();
      void result.current.send();
    });
    expect(sendFn).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe('sending');
    await act(async () => { resolve({ avisados: ['Laura'] }); });
    expect(result.current.status).toBe('sent');
  });

  it('no actualiza el estado si se desmontó antes de que responda', async () => {
    let resolve: (value: { avisados: string[] }) => void = () => {};
    const sendFn = vi.fn(() => new Promise<{ avisados: string[] }>((r) => { resolve = r; }));
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { result, unmount } = renderHook(() => useHelpSender(sendFn));
    await act(async () => { void result.current.send(); });
    unmount();
    await act(async () => { resolve({ avisados: ['Laura'] }); });
    expect(errors).not.toHaveBeenCalled();
    errors.mockRestore();
    expect(result.current.status).toBe('sending');
  });

  it('reset vuelve a idle y borra los nombres', async () => {
    const { result } = renderHook(() => useHelpSender(async () => ({ avisados: ['Laura'] })));
    await act(async () => { await result.current.send(); });
    expect(result.current.status).toBe('sent');
    act(() => result.current.reset());
    expect(result.current.status).toBe('idle');
    expect(result.current.avisados).toEqual([]);
  });
});
