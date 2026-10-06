import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import CalmMode from './CalmMode';

const accessibility = vi.hoisted(() => ({ settings: { pauseAnimations: false, reduceMotion: false } }));
vi.mock('@/contexts/AccessibilityContext', () => ({ useAccessibility: () => accessibility }));

describe('CalmMode', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); document.body.style.overflow = ''; });

  it('pasa de "Tomá aire" a "Soltá el aire" a los 4 s', () => {
    render(<CalmMode onClose={vi.fn()} />);
    expect(screen.getByText('Tomá aire')).toBeInTheDocument();
    expect(screen.getByText('1 de 5 respiraciones')).toBeInTheDocument();
    act(() => { vi.advanceTimersByTime(3900); });
    expect(screen.getByText('Tomá aire')).toBeInTheDocument();
    act(() => { vi.advanceTimersByTime(200); });
    expect(screen.getByText('Soltá el aire')).toBeInTheDocument();
    act(() => { vi.advanceTimersByTime(4000); });
    expect(screen.getByText('2 de 5 respiraciones')).toBeInTheDocument();
  });

  it('tras 5 respiraciones avisa "Cuando quieras, seguimos" y no se cierra solo', () => {
    const onClose = vi.fn();
    render(<CalmMode onClose={onClose} />);
    act(() => { vi.advanceTimersByTime(4000 * 10); });
    expect(screen.getByText('Cuando quieras, seguimos')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('"Ya estoy mejor" y Escape llaman a onClose', () => {
    const onClose = vi.fn();
    render(<CalmMode onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'Ya estoy mejor' }));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('bloquea el scroll del body y lo devuelve al cerrar; enfoca el título', () => {
    const { unmount } = render(<CalmMode onClose={vi.fn()} />);
    expect(document.body.style.overflow).toBe('hidden');
    expect(screen.getByRole('heading', { name: 'Vamos despacio' })).toHaveFocus();
    unmount();
    expect(document.body.style.overflow).toBe('');
  });

  it('no muestra "Avisarle a…" si no hay onNotify', () => {
    const { rerender } = render(<CalmMode onClose={vi.fn()} recipientLabel="Laura" />);
    expect(screen.queryByText(/Avisarle a/)).not.toBeInTheDocument();
    rerender(<CalmMode onClose={vi.fn()} onNotify={vi.fn()} recipientLabel="Laura" />);
    expect(screen.getByText('Avisarle a Laura')).toBeInTheDocument();
  });

  it('con "detener animaciones" sigue cambiando el texto', () => {
    accessibility.settings = { pauseAnimations: true, reduceMotion: false };
    render(<CalmMode onClose={vi.fn()} />);
    act(() => { vi.advanceTimersByTime(4000); });
    expect(screen.getByText('Soltá el aire')).toBeInTheDocument();
    accessibility.settings = { pauseAnimations: false, reduceMotion: false };
  });
});
