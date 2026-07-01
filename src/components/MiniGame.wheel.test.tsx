import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import MiniGame from './MiniGame';

describe('WheelPrecision interaction', () => {
  afterEach(() => vi.restoreAllMocks());

  const setup = (correct = 0, segments = 4, useImages = false) => {
    let id = 0;
    const frames = new Map<number, FrameRequestCallback>();
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      id += 1;
      frames.set(id, callback);
      return id;
    });
    vi.stubGlobal('cancelAnimationFrame', (frameId: number) => frames.delete(frameId));
    const options = Array.from({ length: segments }, (_, index) => useImages ? `https://example.com/${index}.png` : `opción ${index + 1}`);
    const view = render(<MiniGame gameType="wheel" gameData={{ wheel: { settings: { segments, initialSpeed: 3, speedIncrease: false }, rounds: [{ targetWord: 'PERA', image: options[correct], options, correct }] } }} onFinish={vi.fn()} />);
    return { frames, ...view };
  };

  it('accepts only one stop command and exposes the stopping state immediately', () => {
    const { frames } = setup();

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
    const { frames } = setup();
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

  it('keeps spinning after the first touch following an error until a second gesture', () => {
    const { frames } = setup(1);
    const button = screen.getByRole('button', { name: /girar/i });

    fireEvent.click(button, { detail: 0 });
    fireEvent.pointerDown(button);
    const stoppingFrame = [...frames.values()][0];
    act(() => stoppingFrame(performance.now() + 2500));
    expect(screen.getByText(/no era ese/i)).toBeInTheDocument();

    fireEvent.pointerDown(button);
    fireEvent.click(button, { detail: 0 });
    expect(button).toHaveAccessibleName(/parar/i);

    fireEvent.pointerDown(button);
    expect(button).toHaveAccessibleName(/frenando/i);
  });

  it.each([4, 6, 8])('keeps all pictograms inside the wheel for %i segments', (segments) => {
    const { unmount } = setup(0, segments, true);
    const images = screen.getByLabelText(new RegExp(`ruleta de ${segments}`, 'i')).querySelectorAll('image');
    expect(images).toHaveLength(segments);
    images.forEach(image => {
      const x = Number(image.getAttribute('x'));
      const y = Number(image.getAttribute('y'));
      expect(Math.hypot(x + 24 - 130, y + 24 - 130)).toBeCloseTo(78);
      expect(x).toBeGreaterThanOrEqual(0);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(x + 48).toBeLessThanOrEqual(260);
      expect(y + 48).toBeLessThanOrEqual(260);
    });
    unmount();
  });
});
