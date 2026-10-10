import { cleanup, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it } from 'vitest';
import { TandemLoadingScreen } from './TandemLoadingScreen';
import { TandemAnimatedLogo } from './TandemAnimatedLogo';

afterEach(cleanup);

describe('TandemLoadingScreen', () => {
  it('expone un estado de carga accesible sin texto visible', () => {
    render(<TandemLoadingScreen />);
    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-busy', 'true');
    expect(status).toHaveTextContent('Cargando TÁNDEM');
    expect(screen.getByText('Cargando TÁNDEM')).toHaveClass('sr-only');
  });

  it('usa el umbral de aparición indicado', () => {
    render(<TandemLoadingScreen delayMs={300} />);
    expect(screen.getByRole('status').style.getPropertyValue('--tl-delay')).toBe('300ms');
  });

  it('anima solo las capas de los dos puntos; la M no lleva animación', () => {
    const { container } = render(<TandemAnimatedLogo />);
    const imgs = container.querySelectorAll('img');
    expect(imgs).toHaveLength(3);
    expect(imgs[0]).not.toHaveClass('tandem-logo__dot');
    expect(imgs[1]).toHaveClass('tandem-logo__dot--1');
    expect(imgs[2]).toHaveClass('tandem-logo__dot--2');
    expect(container.firstElementChild).toHaveAttribute('data-animated', 'true');
  });

  it('puede mostrarse quieto', () => {
    const { container } = render(<TandemAnimatedLogo animated={false} />);
    expect(container.firstElementChild).toHaveAttribute('data-animated', 'false');
  });
});
