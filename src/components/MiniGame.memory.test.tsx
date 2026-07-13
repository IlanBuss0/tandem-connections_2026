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

    expect(screen.getByText(/memoriz/i)).toBeInTheDocument();
    const previewCard = screen.getByRole('button', { name: /manzana/i });
    expect(previewCard).toBeDisabled();
    expect(previewCard).toHaveAttribute('data-state', 'front');
    expect(previewCard.querySelector('[data-testid="memory-card-inner"]')).toHaveClass('[transform:rotateY(180deg)]');

    act(() => vi.advanceTimersByTime(2000));

    expect(screen.queryByText(/memoriz/i)).not.toBeInTheDocument();
    const hiddenCards = screen.getAllByRole('button', { name: /oculta/i });
    expect(hiddenCards).toHaveLength(8);
    expect(hiddenCards[0]).toHaveAttribute('data-state', 'back');
    expect(hiddenCards[0].querySelector('[data-testid="memory-card-inner"]')).not.toHaveClass('[transform:rotateY(180deg)]');
  });

  it('expires a timed game and supports a clean retry', () => {
    vi.useFakeTimers();
    render(<MiniGame gameType="memory" gameData={{ memory: { pairs, settings: { previewEnabled: false, previewSeconds: 3, timed: true, timeLimitSeconds: 30 } } }} onFinish={vi.fn()} />);

    act(() => vi.advanceTimersByTime(30000));

    expect(screen.getByText(/se termin/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /intentar de nuevo/i }));
    expect(screen.getByText('Tiempo: 30s')).toBeInTheDocument();
    expect(screen.queryByText(/se termin/i)).not.toBeInTheDocument();
  });

  it('uses neutral feedback when two cards do not match and blocks interactions while comparing', () => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    render(<MiniGame gameType="memory" gameData={{ memory: { pairs, settings: { previewEnabled: false, previewSeconds: 3, timed: false, timeLimitSeconds: 60 } } }} onFinish={vi.fn()} />);

    const hidden = screen.getAllByRole('button', { name: /oculta/i });
    fireEvent.click(hidden[0]);
    fireEvent.click(hidden[1]);

    expect(screen.getByText('Probemos otra pareja')).toBeInTheDocument();
    expect(hidden[0]).toHaveAttribute('data-state', 'front');
    expect(hidden[1]).toHaveAttribute('data-state', 'front');
    expect(screen.getAllByRole('button').every(button => button.disabled)).toBe(true);

    act(() => vi.advanceTimersByTime(900));

    expect(screen.getAllByRole('button', { name: /oculta/i })).toHaveLength(8);
  });

  it('keeps matched cards face up and unavailable', () => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    render(<MiniGame gameType="memory" gameData={{ memory: { pairs, settings: { previewEnabled: false, previewSeconds: 3, timed: false, timeLimitSeconds: 60 } } }} onFinish={vi.fn()} />);

    const cards = screen.getByLabelText('Tablero de memoria').querySelectorAll('button');
    fireEvent.click(cards[0]);
    fireEvent.click(cards[7]);
    act(() => vi.advanceTimersByTime(500));

    expect(cards[0]).toHaveAttribute('data-state', 'front');
    expect(cards[7]).toHaveAttribute('data-state', 'front');
    expect(cards[0]).toHaveAttribute('data-matched', 'true');
    expect(cards[7]).toBeDisabled();
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
