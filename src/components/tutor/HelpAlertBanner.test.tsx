import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import HelpAlertBanner from './HelpAlertBanner';
import type { Notification } from '@/data/api';

vi.mock('@/contexts/AccessibilityContext', () => ({ useAccessibility: () => ({ settings: { pauseAnimations: true, reduceMotion: false } }) }));

const alert = (id: string, referenceType: string, title: string, message: string): Notification => ({
  id, userId: '1', title, message, type: 'alert', icon: '⚠️', read: false, timestamp: new Date().toISOString(), referenceType, sourceUserId: '9',
});

describe('HelpAlertBanner', () => {
  it('muestra solo el más nuevo con "+1 aviso más" y llama a los callbacks', () => {
    const first = alert('2', 'activity_help:no_entiende', 'Juan no entiende un paso', 'En «Ordenar», paso 2 de 5: Limpiar');
    const second = alert('1', 'activity_help:ayuda', 'Juan pidió ayuda', 'En «Mochila», paso 3: x');
    const onWrite = vi.fn();
    const onDismiss = vi.fn();
    render(<HelpAlertBanner alerts={[first, second]} onWrite={onWrite} onDismiss={onDismiss} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Juan no entiende un paso')).toBeInTheDocument();
    expect(screen.queryByText('Juan pidió ayuda')).not.toBeInTheDocument();
    expect(screen.getByText('+1 aviso más')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Escribirle/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Listo' }));
    expect(onWrite).toHaveBeenCalledWith(first);
    expect(onDismiss).toHaveBeenCalledWith(first);
  });

  it('variante de la tarjeta de ayuda: ícono 🪪, título, mensaje y botones; el estilo de ayuda no cambia', () => {
    const scan = alert('3', 'help_card_scan', 'Abrieron la tarjeta de ayuda de Mateo', 'Alguien escaneó su código QR. Puede que te llamen.');
    const onWrite = vi.fn();
    const onDismiss = vi.fn();
    const { rerender } = render(<HelpAlertBanner alerts={[scan]} onWrite={onWrite} onDismiss={onDismiss} />);
    expect(screen.getByText('🪪')).toBeInTheDocument();
    expect(screen.getByText('Abrieron la tarjeta de ayuda de Mateo')).toBeInTheDocument();
    expect(screen.getByText('Alguien escaneó su código QR. Puede que te llamen.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Escribirle/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Listo' }));
    expect(onWrite).toHaveBeenCalledWith(scan);
    expect(onDismiss).toHaveBeenCalledWith(scan);

    rerender(<HelpAlertBanner alerts={[alert('4', 'activity_help:ayuda', 'Juan pidió ayuda', 'En «Mochila», paso 3: x')]} onWrite={onWrite} onDismiss={onDismiss} />);
    expect(screen.getByText('🙋')).toBeInTheDocument();
    expect(screen.queryByText('🪪')).not.toBeInTheDocument();
  });

  it('no renderiza nada sin avisos', () => {
    const { container } = render(<HelpAlertBanner alerts={[]} onWrite={vi.fn()} onDismiss={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });
});
