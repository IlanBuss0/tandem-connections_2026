import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import MiniGame from './MiniGame';

const pairs = [
  { a: '🍎', b: 'Manzana' },
  { a: '🍌', b: 'Banana' },
  { a: '🍐', b: 'Pera' },
  { a: '🍊', b: 'Naranja' },
];

describe('Memory interaction', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('shows an optional preview and then hides the cards', () => {
    vi.useFakeTimers();
    render(<MiniGame gameType="memory" gameData={{ memory: { pairs, settings: { previewEnabled: true, previewSeconds: 2, timed: false, timeLimitSeconds: 60 } } }} onFinish={vi.fn()} />);
    expect(screen.getByText(/memorizá las cartas/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /manzana/i })).toBeDisabled();
    act(() => vi.advanceTimersByTime(2000));
    expect(screen.queryByText(/memorizá las cartas/i)).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /oculta/i })).toHaveLength(8);
  });

  it('expires a timed game and supports a clean retry', () => {
    vi.useFakeTimers();
    render(<MiniGame gameType="memory" gameData={{ memory: { pairs, settings: { previewEnabled: false, previewSeconds: 3, timed: true, timeLimitSeconds: 30 } } }} onFinish={vi.fn()} />);
    act(() => vi.advanceTimersByTime(30000));
    expect(screen.getByText(/se terminó el tiempo/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /intentar de nuevo/i }));
    expect(screen.getByText('Tiempo: 30s')).toBeInTheDocument();
    expect(screen.queryByText(/se terminó el tiempo/i)).not.toBeInTheDocument();
  });

  it('uses neutral feedback when two cards do not match', () => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    render(<MiniGame gameType="memory" gameData={{ memory: { pairs, settings: { previewEnabled: false, previewSeconds: 3, timed: false, timeLimitSeconds: 60 } } }} onFinish={vi.fn()} />);
    const hidden = screen.getAllByRole('button', { name: /oculta/i });
    fireEvent.click(hidden[0]);
    fireEvent.click(hidden[1]);
    expect(screen.getByText('Probemos otra pareja')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(900));
    expect(screen.getAllByRole('button', { name: /oculta/i })).toHaveLength(8);
  });

  it('finishes once with a score based on attempts', () => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const onFinish = vi.fn();
    render(<MiniGame gameType="memory" gameData={{ memory: { pairs, settings: { previewEnabled: false, previewSeconds: 3, timed: false, timeLimitSeconds: 60 } } }} onFinish={onFinish} />);
    const cards = screen.getByLabelText('Tablero de memoria').querySelectorAll('button');
    for (const [first, second] of [[0, 7], [1, 2], [3, 4], [5, 6]]) {
      fireEvent.click(cards[first]);
      fireEvent.click(cards[second]);
      act(() => vi.advanceTimersByTime(500));
    }
    act(() => vi.advanceTimersByTime(600));
    expect(onFinish).toHaveBeenCalledOnce();
    expect(onFinish).toHaveBeenCalledWith(100);
  });
});
