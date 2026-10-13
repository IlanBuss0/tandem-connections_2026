import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  API_CACHE_MAX_AGE_MS,
  API_CACHE_STORAGE_PREFIX,
  API_CACHE_UPDATED_EVENT,
  apiRequest,
  clearApiCache,
  clearGetCache,
  getApiCacheUser,
  isPersistableApiPath,
  setApiCacheUser,
} from './client';

type Responder = (url: string, init?: RequestInit) => unknown;

function mockFetch(responder: Responder) {
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    const body = responder(url, init);
    return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function persistedKeys(): string[] {
  return Object.keys(sessionStorage).filter((key) => key.startsWith(API_CACHE_STORAGE_PREFIX));
}

/** Simula recargar la pagina: se pierde la memoria y el usuario, queda sessionStorage. */
function simulateReload() {
  const saved = { ...sessionStorage };
  setApiCacheUser(null);
  clearGetCache();
  Object.entries(saved).forEach(([key, item]) => sessionStorage.setItem(key, String(item)));
}

beforeEach(() => {
  sessionStorage.clear();
  setApiCacheUser(null);
  clearApiCache();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('cache de API por usuario', () => {
  it('la clave incluye el usuario: otro usuario nunca recibe la respuesta cacheada del anterior', async () => {
    let owner = 'A';
    const fetchMock = mockFetch(() => [{ id: 1, nombre: `de-${owner}` }]);
    setApiCacheUser('1');
    expect(await apiRequest('/api/vinculos-tutor-pertenecientes')).toEqual([{ id: 1, nombre: 'de-A' }]);

    owner = 'B';
    setApiCacheUser('2');
    expect(await apiRequest('/api/vinculos-tutor-pertenecientes')).toEqual([{ id: 1, nombre: 'de-B' }]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(getApiCacheUser()).toBe('2');
  });

  it('pedidos iguales en la misma pantalla se deduplican', async () => {
    const fetchMock = mockFetch(() => [{ id: 1 }]);
    setApiCacheUser('1');
    await Promise.all([apiRequest('/api/usuarios'), apiRequest('/api/usuarios'), apiRequest('/api/usuarios')]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('clearApiCache (logout) borra memoria y sessionStorage', async () => {
    const fetchMock = mockFetch(() => [{ id: 1, nombre: 'Ana' }]);
    setApiCacheUser('1');
    await apiRequest('/api/vinculos-tutor-pertenecientes');
    expect(persistedKeys()).toHaveLength(1);

    clearApiCache();
    expect(persistedKeys()).toHaveLength(0);
    await apiRequest('/api/vinculos-tutor-pertenecientes');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('cambiar de usuario borra lo guardado del usuario anterior', async () => {
    mockFetch(() => [{ id: 1 }]);
    setApiCacheUser('1');
    await apiRequest('/api/vinculos-tutor-pertenecientes');
    setApiCacheUser('2');
    expect(persistedKeys()).toHaveLength(0);
  });

  it('al recargar con el mismo usuario se conserva lo guardado; con otro usuario no', async () => {
    mockFetch(() => [{ id: 1 }]);
    setApiCacheUser('1');
    await apiRequest('/api/vinculos-tutor-pertenecientes');
    simulateReload();
    setApiCacheUser('1');
    expect(persistedKeys()).toHaveLength(1);
    simulateReload();
    setApiCacheUser('2');
    expect(persistedKeys()).toHaveLength(0);
  });
});

describe('datos sensibles', () => {
  it('nunca se guardan en el navegador', async () => {
    mockFetch(() => [{ id: 1, contenido: 'privado' }]);
    setApiCacheUser('1');
    for (const path of [
      '/api/notificaciones/mine', '/api/mensajes/chat/1', '/api/chats', '/api/reportes-profesionales/tutor',
      '/api/configuraciones-usuarios', '/api/ubicaciones-actuales', '/api/archivos', '/api/acompanamiento/7',
      '/api/pertenecientes', '/api/permisos/contexto', '/api/sesiones-profesionales', '/api/configuraciones-accesibilidad',
    ]) {
      expect(isPersistableApiPath(path)).toBe(false);
      await apiRequest(path);
    }
    expect(persistedKeys()).toHaveLength(0);
  });

  it('la lista de usuarios con datos de contacto (admin) queda solo en memoria', async () => {
    mockFetch(() => [{ id: 1, nombre: 'Ana', correo: 'ana@test.com', telefono: '123' }]);
    setApiCacheUser('1');
    await apiRequest('/api/usuarios');
    expect(persistedKeys()).toHaveLength(0);
  });
});

describe('mostrar lo guardado y refrescar por detras', () => {
  async function seedAndReload(value: unknown) {
    mockFetch(() => value);
    setApiCacheUser('1');
    await apiRequest('/api/perfiles-profesionales/directory');
    simulateReload();
    setApiCacheUser('1');
  }

  it('devuelve al instante lo guardado y avisa cuando el backend trae algo distinto', async () => {
    await seedAndReload([{ id: 1, nombre: 'Viejo' }]);
    let release: () => void = () => {};
    const fetchMock = vi.fn(() => new Promise<Response>((resolve) => {
      release = () => resolve(new Response(JSON.stringify([{ id: 1, nombre: 'Nuevo' }]), { status: 200 }));
    }));
    vi.stubGlobal('fetch', fetchMock);
    const updated = vi.fn();
    window.addEventListener(API_CACHE_UPDATED_EVENT, updated);

    expect(await apiRequest('/api/perfiles-profesionales/directory')).toEqual([{ id: 1, nombre: 'Viejo' }]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    release();
    await vi.waitFor(() => expect(updated).toHaveBeenCalledTimes(1));
    expect(await apiRequest('/api/perfiles-profesionales/directory')).toEqual([{ id: 1, nombre: 'Nuevo' }]);
    window.removeEventListener(API_CACHE_UPDATED_EVENT, updated);
  });

  it('lo guardado hace mas de 24 h o de otra version se ignora', async () => {
    await seedAndReload([{ id: 1 }]);
    const [key] = persistedKeys();
    const entry = JSON.parse(sessionStorage.getItem(key)!);
    sessionStorage.setItem(key, JSON.stringify({ ...entry, savedAt: Date.now() - API_CACHE_MAX_AGE_MS - 1 }));
    const fetchMock = mockFetch(() => [{ id: 2 }]);
    expect(await apiRequest('/api/perfiles-profesionales/directory')).toEqual([{ id: 2 }]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('si al revalidar el backend rechaza, se descarta lo guardado', async () => {
    await seedAndReload([{ id: 1 }]);
    vi.stubGlobal('fetch', vi.fn(async () => new Response('prohibido', { status: 403 })));
    await apiRequest('/api/perfiles-profesionales/directory');
    await vi.waitFor(() => expect(persistedKeys()).toHaveLength(0));
  });
});

describe('invalidacion despues de mutaciones', () => {
  it('POST/PUT/PATCH/DELETE descartan lo cacheado para ver el cambio enseguida', async () => {
    let version = 1;
    const fetchMock = mockFetch((_url, init) => (init?.method && init.method !== 'GET' ? { ok: true } : [{ id: 1, v: version }]));
    setApiCacheUser('1');
    expect(await apiRequest('/api/vinculos-tutor-pertenecientes')).toEqual([{ id: 1, v: 1 }]);

    for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
      version += 1;
      await apiRequest('/api/vinculos-tutor-pertenecientes/1', { method, body: method === 'DELETE' ? undefined : {} });
      expect(persistedKeys()).toHaveLength(0);
      expect(await apiRequest('/api/vinculos-tutor-pertenecientes')).toEqual([{ id: 1, v: version }]);
    }
    expect(fetchMock).toHaveBeenCalledTimes(9);
  });

  it('guardar la configuracion de accesibilidad solo invalida esa configuracion', async () => {
    const fetchMock = mockFetch(() => [{ id: 1 }]);
    setApiCacheUser('1');
    await apiRequest('/api/vinculos-tutor-pertenecientes');
    await apiRequest('/api/configuraciones-accesibilidad');
    await apiRequest('/api/configuraciones-accesibilidad/6', { method: 'PUT', body: { valor: '{}' } });
    await apiRequest('/api/vinculos-tutor-pertenecientes');
    await apiRequest('/api/configuraciones-accesibilidad');
    // vinculos sale de cache; configuraciones-accesibilidad se vuelve a pedir.
    expect(fetchMock.mock.calls.map(([url]) => String(url).replace(/^https?:\/\/[^/]+/, ''))).toEqual([
      '/api/vinculos-tutor-pertenecientes',
      '/api/configuraciones-accesibilidad',
      '/api/configuraciones-accesibilidad/6',
      '/api/configuraciones-accesibilidad',
    ]);
  });

  it('la telemetria (POST /api/eventos-uso) no descarta el resto de la cache', async () => {
    const fetchMock = mockFetch(() => [{ id: 1 }]);
    setApiCacheUser('1');
    await apiRequest('/api/vinculos-tutor-pertenecientes');
    await apiRequest('/api/eventos-uso', { method: 'POST', body: { tipo: 'x' } });
    await apiRequest('/api/vinculos-tutor-pertenecientes');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(persistedKeys()).toHaveLength(1);
  });
});
