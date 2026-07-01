import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import MiniGame from './MiniGame';

describe('WheelPrecision interaction', () => {
  afterEach(() => vi.restoreAllMocks());

  const setup = () => {
    let id = 0;
    const frames = new Map<number, FrameRequestCallback>();
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      id += 1;
      frames.set(id, callback);
      return id;
    });
    vi.stubGlobal('cancelAnimationFrame', (frameId: number) => frames.delete(frameId));
    render(<MiniGame gameType="wheel" gameData={{ wheel: { settings: { segments: 4, initialSpeed: 3, speedIncrease: false }, rounds: [{ targetWord: 'PERA', image: 'pera', options: ['pera', 'uva', 'limón', 'manzana'], correct: 0 }] } }} onFinish={vi.fn()} />);
    return frames;
  };

  it('accepts only one stop command and exposes the stopping state immediately', () => {
    const frames = setup();

    fireEvent.click(screen.getByRole('button', { name: /girar/i }));
    const stop = screen.getByRole('button', { name: /parar/i });
    fireEvent.pointerDown(stop);
    expect(screen.getByRole('button', { name: /frenando/i })).toHaveAttribute('aria-disabled', 'true');
    expect(frames.size).toBe(1);

    fireEvent.pointerDown(screen.getByRole('button', { name: /frenando/i }));
    expect(frames.size).toBe(1);

    const callback = [...frames.values()][0];
    act(() => callback(performance.now() + 2500));
    expect(screen.getByText(/correcto/i)).toBeInTheDocument();
  });

  it('uses one stable button and ignores the synthetic click after pointerdown', () => {
    const frames = setup();
    const button = screen.getByRole('button', { name: /girar/i });

    fireEvent.pointerDown(button);
    expect(button).toHaveAccessibleName(/parar/i);
    fireEvent.click(button, { detail: 1 });
    expect(button).toHaveAccessibleName(/parar/i);

    const spinFrame = [...frames.values()][0];
    act(() => spinFrame(performance.now() + 16));
    expect(screen.getByLabelText(/ruleta de 4/i).getAttribute('style')).toContain('rotate(');
    expect(screen.getByRole('button', { name: /parar/i })).toBe(button);

    fireEvent.pointerDown(button);
    expect(button).toHaveAccessibleName(/frenando/i);
  });

  it('keeps keyboard activation through click events without pointer detail', () => {
    setup();
    const button = screen.getByRole('button', { name: /girar/i });
    fireEvent.click(button, { detail: 0 });
    expect(button).toHaveAccessibleName(/parar/i);
  });
});
