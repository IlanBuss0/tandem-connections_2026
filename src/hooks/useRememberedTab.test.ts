import { describe, expect, it, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRememberedTab } from './useRememberedTab';

describe('useRememberedTab', () => {
  beforeEach(() => window.sessionStorage.clear());

  it('sin valor guardado, usa el fallback', () => {
    const { result } = renderHook(() => useRememberedTab('k1', ['a', 'b'] as const, 'a'));
    expect(result.current[0]).toBe('a');
  });

  it('con un valor válido guardado, lo respeta', () => {
    window.sessionStorage.setItem('k2', 'b');
    const { result } = renderHook(() => useRememberedTab('k2', ['a', 'b'] as const, 'a'));
    expect(result.current[0]).toBe('b');
  });

  it('con un valor inválido guardado, cae al fallback', () => {
    window.sessionStorage.setItem('k3', 'z');
    const { result } = renderHook(() => useRememberedTab('k3', ['a', 'b'] as const, 'a'));
    expect(result.current[0]).toBe('a');
  });

  it('al cambiar, persiste solo el id en sessionStorage', () => {
    const { result } = renderHook(() => useRememberedTab('k4', ['a', 'b'] as const, 'a'));
    act(() => result.current[1]('b'));
    expect(result.current[0]).toBe('b');
    expect(window.sessionStorage.getItem('k4')).toBe('b');
  });

  it('si sessionStorage rompe (modo privado), no explota', () => {
    const original = window.sessionStorage.getItem;
    window.sessionStorage.getItem = () => { throw new Error('blocked'); };
    const { result } = renderHook(() => useRememberedTab('k5', ['a', 'b'] as const, 'a'));
    expect(result.current[0]).toBe('a');
    window.sessionStorage.getItem = original;
  });

  it('si cambia la clave, relee el valor para la nueva clave', () => {
    window.sessionStorage.setItem('k7', 'b');
    const { result, rerender } = renderHook(({ key }) => useRememberedTab(key, ['a', 'b'] as const, 'a'), { initialProps: { key: 'k6' } });
    expect(result.current[0]).toBe('a');
    rerender({ key: 'k7' });
    expect(result.current[0]).toBe('b');
  });
});
