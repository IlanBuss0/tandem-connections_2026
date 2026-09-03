import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AccessibilityWidget from './AccessibilityWidget';
import { DEFAULT_SETTINGS, type AccessibilitySettings } from '@/contexts/AccessibilityContext';

const accessibilityState = vi.hoisted(() => ({
  settings: null as AccessibilitySettings | null,
  updateWidgetPosition: vi.fn(),
}));

vi.mock('@/contexts/AccessibilityContext', async () => {
  const actual = await vi.importActual<typeof import('@/contexts/AccessibilityContext')>('@/contexts/AccessibilityContext');
  return {
    ...actual,
    useAccessibility: () => ({
      settings: accessibilityState.settings ?? actual.DEFAULT_SETTINGS,
      update: vi.fn(),
      updateWidgetPosition: accessibilityState.updateWidgetPosition,
      applyProfile: vi.fn(),
      reset: vi.fn(),
      toggle: vi.fn(),
    }),
  };
});

vi.mock('@/contexts/MobileMenuState', () => ({
  useMobileMenu: () => ({ isMobileMenuOpen: false }),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: '1', role: 'user' } }),
}));

describe('AccessibilityWidget mobile launcher', () => {
  beforeEach(() => {
    accessibilityState.settings = { ...DEFAULT_SETTINGS };
    accessibilityState.updateWidgetPosition.mockClear();
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 390 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 740 });
  });

  it('opens the accessibility menu on a regular click', () => {
    render(<AccessibilityWidget />);

    fireEvent.click(screen.getByLabelText('Abrir opciones de accesibilidad'));

    expect(screen.getByRole('dialog', { name: 'Menu de Accesibilidad' })).toBeInTheDocument();
  });

  it('stores a constrained position after dragging the mobile launcher', () => {
    render(<AccessibilityWidget />);
    const button = screen.getByLabelText('Abrir opciones de accesibilidad');

    dispatchPointerEvent(button, 'pointerdown', 370, 260);
    dispatchPointerEvent(button, 'pointermove', 250, 280);
    dispatchPointerEvent(button, 'pointerup', 250, 280);
    fireEvent.click(button);

    expect(accessibilityState.updateWidgetPosition).toHaveBeenCalledWith({ x: 178, y: 258 });
    expect(screen.queryByRole('dialog', { name: 'Menu de Accesibilidad' })).not.toBeInTheDocument();
  });

  it('tucks into the right edge when dropped near the side', () => {
    render(<AccessibilityWidget />);
    const button = screen.getByLabelText('Abrir opciones de accesibilidad');

    dispatchPointerEvent(button, 'pointerdown', 250, 260);
    dispatchPointerEvent(button, 'pointermove', 382, 280);
    dispatchPointerEvent(button, 'pointerup', 382, 280);

    expect(accessibilityState.updateWidgetPosition).toHaveBeenCalledWith({ x: 354, y: 258 });
  });

  it('tucks into the left edge with the icon still on the visible side', () => {
    accessibilityState.settings = {
      ...DEFAULT_SETTINGS,
      mobileWidgetPosition: { x: -108, y: 258 },
    };

    render(<AccessibilityWidget />);
    const button = screen.getByLabelText('Abrir opciones de accesibilidad');

    expect(button).toHaveClass('flex-row-reverse');
    expect(button).toHaveStyle({ left: '-108px', top: '258px' });
  });
});

function dispatchPointerEvent(element: Element, type: string, clientX: number, clientY: number) {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperties(event, {
    pointerId: { value: 1 },
    isPrimary: { value: true },
    clientX: { value: clientX },
    clientY: { value: clientY },
  });
  fireEvent(element, event);
}
