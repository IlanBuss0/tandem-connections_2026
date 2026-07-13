import { createElement } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ACCESSIBILITY_PROFILES,
  AccessibilityProvider,
  canPersistAccessibilitySettings,
  nextColorBlindnessMode,
  useAccessibility,
} from './AccessibilityContext';

const authState = vi.hoisted(() => ({ user: null as { id: string } | null }));
const apiMocks = vi.hoisted(() => ({
  fetchAccessibilitySettings: vi.fn(async (_userId: string, fallback: object) => fallback),
  saveAccessibilitySettings: vi.fn(async () => undefined),
}));

vi.mock('./AuthContext', () => ({ useAuth: () => authState }));
vi.mock('@/data/api', () => apiMocks);

function PersistenceProbe() {
  const { settings, toggle } = useAccessibility();
  return createElement(
    'button',
    { type: 'button', onClick: () => toggle('smartContrast') },
    String(settings.smartContrast),
  );
}

function DaltonismProfileProbe() {
  const { settings, applyProfile } = useAccessibility();
  return createElement(
    'button',
    { type: 'button', onClick: () => applyProfile('color') },
    `${settings.activeProfile ?? 'none'}:${settings.colorFilter}:${settings.smartContrast}`,
  );
}

beforeEach(() => {
  cleanup();
  document.body.className = '';
  document.body.innerHTML = '';
  localStorage.clear();
  authState.user = null;
  apiMocks.fetchAccessibilitySettings.mockClear();
  apiMocks.saveAccessibilitySettings.mockClear();
});

describe('accessibility color blindness behavior', () => {
  it('cycles through the requested modes and then disables the filter', () => {
    expect(nextColorBlindnessMode('none')).toBe('deuteranopia');
    expect(nextColorBlindnessMode('deuteranopia')).toBe('protanopia');
    expect(nextColorBlindnessMode('protanopia')).toBe('tritanopia');
    expect(nextColorBlindnessMode('tritanopia')).toBe('none');
    expect(nextColorBlindnessMode('monochrome')).toBe('deuteranopia');
  });

  it('starts the Daltonism profile without inversion, dark mode, or link highlighting', () => {
    const profile = ACCESSIBILITY_PROFILES.find(item => item.id === 'color');

    expect(profile?.patch).toEqual({
      colorFilter: 'deuteranopia',
      smartContrast: true,
    });
  });

  it('cycles the Daltonism profile through the three modes and then disables it', () => {
    render(createElement(AccessibilityProvider, null, createElement(DaltonismProfileProbe)));

    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('button')).toHaveTextContent('color:deuteranopia:true');

    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('button')).toHaveTextContent('color:protanopia:true');

    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('button')).toHaveTextContent('color:tritanopia:true');

    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('button')).toHaveTextContent('none:none:false');
  });

  it('applies Daltonism classes to app content without adding them to the widget', () => {
    const appRoot = document.createElement('div');
    appRoot.className = 'accessibility-content-root';
    const widget = document.createElement('div');
    widget.className = 'a11y-widget';
    document.body.append(appRoot, widget);

    render(createElement(AccessibilityProvider, null, createElement(DaltonismProfileProbe)), { container: appRoot });

    fireEvent.click(screen.getByRole('button'));

    expect(appRoot).toHaveClass('accessibility-smart-contrast');
    expect(appRoot).toHaveClass('accessibility-colorblind-deuteranopia');
    expect(widget).not.toHaveClass('accessibility-colorblind-deuteranopia');
    expect(document.body).not.toHaveClass('accessibility-colorblind-deuteranopia');
  });
});

describe('accessibility persistence policy', () => {
  it('only permits persistence for an authenticated user id', () => {
    expect(canPersistAccessibilitySettings(undefined)).toBe(false);
    expect(canPersistAccessibilitySettings(null)).toBe(false);
    expect(canPersistAccessibilitySettings('')).toBe(false);
    expect(canPersistAccessibilitySettings('user-123')).toBe(true);
  });

  it('keeps guest changes in memory and restores defaults after a remount', () => {
    const firstVisit = render(
      createElement(AccessibilityProvider, null, createElement(PersistenceProbe)),
    );

    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('button')).toHaveTextContent('true');
    expect(localStorage.getItem('tandem:accessibility:__guest__')).toBeNull();

    firstVisit.unmount();
    render(createElement(AccessibilityProvider, null, createElement(PersistenceProbe)));

    expect(screen.getByRole('button')).toHaveTextContent('false');
    expect(localStorage.getItem('tandem:accessibility:__guest__')).toBeNull();
  });

  it('persists changes locally after authenticated settings finish loading', async () => {
    authState.user = { id: 'user-123' };
    render(createElement(AccessibilityProvider, null, createElement(PersistenceProbe)));

    await waitFor(() => expect(apiMocks.fetchAccessibilitySettings).toHaveBeenCalled());
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      const stored = localStorage.getItem('tandem:accessibility:user-123');
      expect(stored).not.toBeNull();
      expect(JSON.parse(stored ?? '{}').smartContrast).toBe(true);
    });
  });
});
