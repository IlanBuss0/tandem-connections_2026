import { describe, expect, it } from 'vitest';
import { activate, initialScanState, tick } from './scanEngine';

describe('tick', () => {
  it('sin grupos, no cambia nada', () => {
    const state = initialScanState();
    expect(tick(state, [])).toEqual(state);
  });

  it('en nivel grupo, avanza al siguiente grupo', () => {
    const state = initialScanState();
    expect(tick(state, [3, 2])).toEqual({ level: 'group', groupIndex: 1, itemIndex: 0 });
  });

  it('en nivel grupo, hace wrap-around al final', () => {
    const state = { level: 'group' as const, groupIndex: 1, itemIndex: 0 };
    expect(tick(state, [3, 2])).toEqual({ level: 'group', groupIndex: 0, itemIndex: 0 });
  });

  it('en nivel item, avanza al siguiente item del mismo grupo', () => {
    const state = { level: 'item' as const, groupIndex: 0, itemIndex: 0 };
    expect(tick(state, [3, 2])).toEqual({ level: 'item', groupIndex: 0, itemIndex: 1 });
  });

  it('en nivel item, hace wrap-around dentro del grupo', () => {
    const state = { level: 'item' as const, groupIndex: 0, itemIndex: 2 };
    expect(tick(state, [3, 2])).toEqual({ level: 'item', groupIndex: 0, itemIndex: 0 });
  });
});

describe('activate', () => {
  it('sin grupos, no selecciona nada', () => {
    const state = initialScanState();
    expect(activate(state, [])).toEqual({ state, select: false });
  });

  it('en nivel grupo, baja a nivel item sin seleccionar', () => {
    const state = { level: 'group' as const, groupIndex: 1, itemIndex: 0 };
    const result = activate(state, [3, 2]);
    expect(result.select).toBe(false);
    expect(result.state).toEqual({ level: 'item', groupIndex: 1, itemIndex: 0 });
  });

  it('en nivel item, selecciona y vuelve a nivel grupo', () => {
    const state = { level: 'item' as const, groupIndex: 1, itemIndex: 1 };
    const result = activate(state, [3, 2]);
    expect(result.select).toBe(true);
    expect(result.state).toEqual({ level: 'group', groupIndex: 1, itemIndex: 0 });
  });
});
