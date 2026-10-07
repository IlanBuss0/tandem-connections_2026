import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';

const auth = vi.hoisted(() => ({ value: { user: null as null | { id: string; role: string; emailVerified?: boolean }, isAuthenticated: false, isLoading: false } }));
vi.mock('@/contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => auth.value,
}));

// Proveedores y pantallas pesadas: solo importa qué vista elige AuthGate.
const passthrough = vi.hoisted(() => (name: string) => ({ [name]: ({ children }: { children: unknown }) => children }));
vi.mock('@/contexts/WalletContext', () => passthrough('WalletProvider'));
vi.mock('@/contexts/CustomActivitiesContext', () => passthrough('CustomActivitiesProvider'));
vi.mock('@/contexts/AccessibilityContext', () => passthrough('AccessibilityProvider'));
vi.mock('@/contexts/EmotionsContext', () => passthrough('EmotionsProvider'));
vi.mock('@/contexts/RoutinesContext', () => passthrough('RoutinesProvider'));
vi.mock('@/contexts/CalendarContext', () => passthrough('CalendarProvider'));
vi.mock('@/contexts/MobileMenuProvider', () => ({ default: ({ children }: { children: React.ReactNode }) => children }));
vi.mock('@/components/AccessibilityWidget', () => ({ default: () => null }));
vi.mock('@/components/SwitchScanningOverlay', () => ({ default: () => null }));
vi.mock('@/components/ui/toaster', () => ({ Toaster: () => null }));
vi.mock('@/components/ui/tooltip', () => ({ TooltipProvider: ({ children }: { children: React.ReactNode }) => children }));
vi.mock('@/components/AppShell', () => ({ default: () => <p>Pantalla con sesión</p> }));
vi.mock('@/pages/Landing', () => ({ default: () => <p>Landing</p> }));
vi.mock('@/pages/NotFoundPage', () => ({ default: () => <p>Página no encontrada</p> }));
vi.mock('@/pages/Login', () => ({ default: ({ initialView }: { initialView?: string }) => <p>Login {initialView}</p> }));
vi.mock('@/pages/InviteLinkHandler', () => ({ default: () => <p>Invitación</p> }));
vi.mock('@/data/api', () => ({ fetchOnboardingStatus: vi.fn(async () => ({ done: true, skipped: false })) }));

import App from './App';

const loggedIn = { user: { id: '1', role: 'tutor', emailVerified: true }, isAuthenticated: true, isLoading: false };
const loggedOut = { user: null, isAuthenticated: false, isLoading: false };

describe('AuthGate: cerrar sesión', () => {
  beforeEach(() => {
    window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
    auth.value = loggedOut;
    window.history.replaceState(null, '', '/');
  });

  it('con sesión en /tutor/inicio, al cerrar sesión muestra la landing y deja la URL en /', async () => {
    window.history.replaceState(null, '', '/tutor/inicio');
    auth.value = loggedIn;
    const { rerender } = render(<App />);
    expect(await screen.findByText('Pantalla con sesión')).toBeInTheDocument();

    auth.value = loggedOut;
    await act(async () => { rerender(<App />); });

    expect(screen.getByText('Landing')).toBeInTheDocument();
    expect(screen.queryByText('Página no encontrada')).not.toBeInTheDocument();
    expect(window.location.pathname).toBe('/');
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
  });

  it('no deja una entrada nueva en el historial (usa replaceState)', async () => {
    window.history.replaceState(null, '', '/tutor/inicio');
    auth.value = loggedIn;
    const { rerender } = render(<App />);
    await screen.findByText('Pantalla con sesión');
    const before = window.history.length;
    auth.value = loggedOut;
    await act(async () => { rerender(<App />); });
    expect(window.history.length).toBe(before);
  });

  it('sin sesión, entrar a una ruta que no existe sigue mostrando la 404', () => {
    window.history.replaceState(null, '', '/cualquier-cosa');
    render(<App />);
    expect(screen.getByText('Página no encontrada')).toBeInTheDocument();
    expect(window.location.pathname).toBe('/cualquier-cosa');
  });

  it('mientras carga la sesión no actúa, y un link de invitación sin sesión sigue yendo al login', () => {
    window.history.replaceState(null, '', '/vincular/abc123');
    render(<App />);
    expect(screen.getByText('Login login')).toBeInTheDocument();
    expect(window.location.pathname).toBe('/vincular/abc123');
  });

  it('cerrar sesión estando en un link de invitación vuelve a la landing', async () => {
    window.history.replaceState(null, '', '/vincular/abc123');
    auth.value = loggedIn;
    const { rerender } = render(<App />);
    expect(await screen.findByText('Invitación')).toBeInTheDocument();
    auth.value = loggedOut;
    await act(async () => { rerender(<App />); });
    expect(screen.getByText('Landing')).toBeInTheDocument();
    expect(window.location.pathname).toBe('/');
  });
});
