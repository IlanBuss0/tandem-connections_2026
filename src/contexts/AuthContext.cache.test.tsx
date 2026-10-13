import { act, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/data/api', () => ({
  clearStoredAuthToken: vi.fn(),
  fetchStoredAuthUser: vi.fn(),
  findUser: vi.fn(),
  loginWithGoogle: vi.fn(),
  logoutStoredAuthSession: vi.fn(async () => undefined),
  registerUser: vi.fn(),
}));

import { fetchStoredAuthUser, findUser } from '@/data/api';
import { AuthProvider, useAuth } from './AuthContext';
import { API_CACHE_STORAGE_PREFIX, apiRequest, getApiCacheUser, setApiCacheUser } from '@/services/api/client';
import { AUTH_SNAPSHOT_KEY, writeAuthSnapshot } from '@/lib/authSnapshot';

const tutor = { id: '5', username: 'tutora', password: '', name: 'Tutora', email: 't@test.com', avatar: '🙂', role: 'tutor' as const, relation: '', linkedUserIds: [], phone: '' };

let api: ReturnType<typeof useAuth> | null = null;
function Probe() {
  api = useAuth();
  return <div data-testid="user">{api.isLoading ? 'loading' : api.user?.id ?? 'none'}</div>;
}

function apiCacheKeys() {
  return Object.keys(sessionStorage).filter((key) => key.startsWith(API_CACHE_STORAGE_PREFIX));
}

beforeEach(() => {
  sessionStorage.clear();
  setApiCacheUser(null);
  vi.mocked(fetchStoredAuthUser).mockReset();
  vi.mocked(findUser).mockReset();
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify([{ id: 1 }]), { status: 200 })));
});

describe('AuthContext + cache', () => {
  it('con usuario guardado arranca sin esperar /api/auth/me y lo valida en paralelo', async () => {
    writeAuthSnapshot(tutor);
    let resolveMe: (value: typeof tutor) => void = () => {};
    vi.mocked(fetchStoredAuthUser).mockReturnValue(new Promise((resolve) => { resolveMe = resolve; }));

    render(<AuthProvider><Probe /></AuthProvider>);
    expect(screen.getByTestId('user').textContent).toBe('5');
    expect(getApiCacheUser()).toBe('5');
    expect(fetchStoredAuthUser).toHaveBeenCalledTimes(1);
    await act(async () => resolveMe(tutor));
    expect(screen.getByTestId('user').textContent).toBe('5');
  });

  it('si /api/auth/me no confirma la sesion, limpia cache y copia de sesion y queda sin usuario', async () => {
    writeAuthSnapshot(tutor);
    setApiCacheUser('5');
    await apiRequest('/api/vinculos-tutor-pertenecientes');
    expect(apiCacheKeys()).toHaveLength(1);
    vi.mocked(fetchStoredAuthUser).mockResolvedValue(null);

    render(<AuthProvider><Probe /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('none'));
    expect(apiCacheKeys()).toHaveLength(0);
    expect(sessionStorage.getItem(AUTH_SNAPSHOT_KEY)).toBeNull();
    expect(getApiCacheUser()).toBeNull();
  });

  it('logout borra toda la cache (memoria y sessionStorage) y la copia del usuario', async () => {
    vi.mocked(fetchStoredAuthUser).mockResolvedValue(tutor);
    render(<AuthProvider><Probe /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('5'));
    await apiRequest('/api/vinculos-tutor-pertenecientes');
    expect(apiCacheKeys()).toHaveLength(1);
    expect(sessionStorage.getItem(AUTH_SNAPSHOT_KEY)).not.toBeNull();

    act(() => api!.logout());
    expect(screen.getByTestId('user').textContent).toBe('none');
    expect(apiCacheKeys()).toHaveLength(0);
    expect(sessionStorage.getItem(AUTH_SNAPSHOT_KEY)).toBeNull();
    const fetchMock = vi.mocked(fetch);
    const callsBefore = fetchMock.mock.calls.length;
    setApiCacheUser('5');
    await apiRequest('/api/vinculos-tutor-pertenecientes');
    expect(fetchMock.mock.calls.length).toBe(callsBefore + 1);
  });

  it('login de otro usuario no ve lo cacheado del anterior', async () => {
    vi.mocked(fetchStoredAuthUser).mockResolvedValue(tutor);
    render(<AuthProvider><Probe /></AuthProvider>);
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('5'));
    await apiRequest('/api/vinculos-tutor-pertenecientes');

    vi.mocked(findUser).mockResolvedValue({ ...tutor, id: '9' });
    await act(async () => { await api!.login('otro', 'clave'); });
    expect(getApiCacheUser()).toBe('9');
    expect(apiCacheKeys()).toHaveLength(0);
  });

  it('la copia de sesion no guarda la contrasena', () => {
    writeAuthSnapshot({ ...tutor, password: 'secreta' });
    expect(sessionStorage.getItem(AUTH_SNAPSHOT_KEY)).not.toContain('secreta');
  });
});
