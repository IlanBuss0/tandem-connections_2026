const DEFAULT_BACKEND_URL = "http://localhost:3000";
const AUTH_TOKEN_KEY = "tandem_auth_token";
const CSRF_COOKIE_KEY = "tandem_csrf_token";
export const AUTH_EXPIRED_EVENT = "tandem:auth-expired";
export const TOKEN_REFRESHED_EVENT = "tandem:token-refreshed";

export type ApiEnvelope<T> = {
  ok: boolean;
  data: T;
};

export type ApiMutationResult = {
  id?: number;
  rowsAffected?: number;
  message?: string;
};

export type ApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  token?: string | null;
  cacheTtlMs?: number;
};

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload: unknown = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

export const API_BASE_URL =
  import.meta.env.VITE_BACKEND_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  DEFAULT_BACKEND_URL;

function buildUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL.replace(/\/$/, "")}${normalizedPath}`;
}

const DEFAULT_GET_CACHE_TTL_MS = 30_000;
const getCache = new Map<string, { expiresAt: number; value: unknown }>();
const getInflight = new Map<string, Promise<unknown>>();

// ---------------------------------------------------------------------------
// Cache de lecturas (GET)
//
// 1. Memoria (30 s por defecto): igual que antes, pero la clave incluye el
//    usuario logueado, asi nunca se reusa una respuesta de otra sesion.
// 2. sessionStorage ("mostrar lo guardado y refrescar por detras"): SOLO para
//    rutas sin datos sensibles (ver PERSISTABLE_GET_RULES). La primera vez que
//    una pantalla pide esa ruta en esta carga de pagina se devuelve al
//    instante lo guardado (maximo 24 h, mismo usuario, misma version de
//    esquema) y se revalida contra el backend en segundo plano; si cambio se
//    avisa con API_CACHE_UPDATED_EVENT para que la pantalla se refresque.
// Notas, emociones, reportes, mensajes, ubicaciones, documentos, datos
// clinicos, notificaciones y permisos nunca se guardan en el navegador.
// Logout / cambio de usuario / sesion vencida borran todo (memoria + storage).
// ---------------------------------------------------------------------------
export const API_CACHE_UPDATED_EVENT = "tandem:api-cache-updated";
export const API_CACHE_STORAGE_PREFIX = "tandem:api-cache:";
export const API_CACHE_SCHEMA_VERSION = 1;
export const API_CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export type ApiCacheUpdatedDetail = { path: string };

type PersistRule = {
  test: (path: string) => boolean;
  /** Ultimo filtro sobre el contenido (p. ej. no guardar datos de contacto). */
  canPersist?: (value: unknown) => boolean;
};

const CATALOG_PATH = /^\/api\/(niveles-apoyos|autonomias-operativas|dificultades-actividades|estados-[a-z-]+|tipos-[a-z-]+|puntos-otorgados|catalogos-permisos-[a-z]+)$/;

function hasNoContactData(value: unknown): boolean {
  return Array.isArray(value) && value.every((item) =>
    !item || typeof item !== "object" || !("correo" in item || "telefono" in item || "fecha_nacimiento" in item));
}

const PERSISTABLE_GET_RULES: PersistRule[] = [
  { test: (path) => CATALOG_PATH.test(path) },
  { test: (path) => path === "/api/actividades" },
  { test: (path) => path === "/api/avatares" },
  { test: (path) => path === "/api/saldos-puntos" },
  // Solo la proyeccion publica (nombre, usuario, rol). La lista de admin trae
  // correo/telefono/nacimiento: esa queda solo en memoria.
  { test: (path) => path === "/api/usuarios", canPersist: hasNoContactData },
  { test: (path) => /^\/api\/tutores\/usuario\/\d+$/.test(path) },
  { test: (path) => path === "/api/vinculos-tutor-pertenecientes" },
  { test: (path) => path === "/api/perfiles-profesionales/directory" },
  { test: (path) => /^\/api\/(pictogramas|pictograms)\/ai\/(creations\/mine|targets)$/.test(path) },
  { test: (path) => /^\/api\/(pictogramas|pictograms)\/(filters|categories)(\?.*)?$/.test(path) },
];

function persistRuleFor(path: string): PersistRule | null {
  return PERSISTABLE_GET_RULES.find((rule) => rule.test(path)) ?? null;
}

/** true si la ruta puede guardarse en sessionStorage (no tiene datos sensibles). */
export function isPersistableApiPath(path: string): boolean {
  return persistRuleFor(path) !== null;
}

let cacheUserId: string | null = null;
// Claves ya revalidadas en esta carga de pagina: lo guardado en storage solo
// se sirve "viejo" la primera vez; despues manda la cache en memoria normal.
const revalidatedKeys = new Set<string>();

function memoryKey(method: string | undefined, path: string): string {
  return `${cacheUserId ?? "anon"} ${String(method || "GET").toUpperCase()} ${path}`;
}

function storageKey(userId: string, path: string): string {
  return `${API_CACHE_STORAGE_PREFIX}v${API_CACHE_SCHEMA_VERSION}:${userId}:${path}`;
}

type PersistedEntry = { v: number; userId: string; savedAt: number; value: unknown };

function safeSessionStorage(): Storage | null {
  try {
    return typeof window !== "undefined" ? window.sessionStorage : null;
  } catch {
    return null;
  }
}

function readPersisted(path: string): PersistedEntry | null {
  const storage = safeSessionStorage();
  if (!storage || !cacheUserId || !persistRuleFor(path)) return null;
  const key = storageKey(cacheUserId, path);
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    const entry = JSON.parse(raw) as PersistedEntry;
    const valid = entry?.v === API_CACHE_SCHEMA_VERSION
      && entry.userId === cacheUserId
      && typeof entry.savedAt === "number"
      && Date.now() - entry.savedAt < API_CACHE_MAX_AGE_MS;
    if (!valid) {
      storage.removeItem(key);
      return null;
    }
    return entry;
  } catch {
    return null;
  }
}

function writePersisted(path: string, value: unknown): void {
  const storage = safeSessionStorage();
  const rule = persistRuleFor(path);
  if (!storage || !cacheUserId || !rule) return;
  if (rule.canPersist && !rule.canPersist(value)) return;
  try {
    const entry: PersistedEntry = { v: API_CACHE_SCHEMA_VERSION, userId: cacheUserId, savedAt: Date.now(), value };
    storage.setItem(storageKey(cacheUserId, path), JSON.stringify(entry));
  } catch {
    // Storage lleno o bloqueado: se sigue solo con la cache en memoria.
  }
}

function removePersisted(path: string): void {
  const storage = safeSessionStorage();
  if (!storage || !cacheUserId) return;
  try {
    storage.removeItem(storageKey(cacheUserId, path));
  } catch {
    // ignorar
  }
}

function clearPersistedApiCache(prefix = API_CACHE_STORAGE_PREFIX): void {
  const storage = safeSessionStorage();
  if (!storage) return;
  try {
    for (let i = storage.length - 1; i >= 0; i--) {
      const key = storage.key(i);
      if (key && key.startsWith(prefix)) storage.removeItem(key);
    }
  } catch {
    // ignorar
  }
}

function clearPersistedApiCacheExcept(keepPrefix: string): void {
  const storage = safeSessionStorage();
  if (!storage) return;
  try {
    for (let i = storage.length - 1; i >= 0; i--) {
      const key = storage.key(i);
      if (key && key.startsWith(API_CACHE_STORAGE_PREFIX) && !key.startsWith(keepPrefix)) storage.removeItem(key);
    }
  } catch {
    // ignorar
  }
}

function isCacheableGet(path: string, method?: string, body?: unknown): boolean {
  return body === undefined && String(method || "GET").toUpperCase() === "GET" && !path.startsWith("/api/auth/");
}

/** Limpia la cache en memoria de GET (todas las sesiones). */
export function clearGetCache(): void {
  getCache.clear();
  getInflight.clear();
  revalidatedKeys.clear();
}

/** Limpia memoria y todo lo guardado en sessionStorage (logout, sesion vencida). */
export function clearApiCache(): void {
  clearGetCache();
  clearPersistedApiCache();
}

/**
 * Indica de quien es la sesion. Si cambia (logout, otro usuario) se borra
 * toda la cache para no mezclar datos entre usuarios.
 */
export function setApiCacheUser(userId: string | number | null | undefined): void {
  const next = userId === null || userId === undefined || userId === "" ? null : String(userId);
  if (next === cacheUserId) return;
  clearGetCache();
  if (next === null) {
    clearPersistedApiCache();
  } else {
    // Al arrancar (sin usuario -> usuario) se conserva lo guardado de ESE
    // usuario; lo de cualquier otro usuario se borra.
    clearPersistedApiCacheExcept(`${API_CACHE_STORAGE_PREFIX}v${API_CACHE_SCHEMA_VERSION}:${next}:`);
  }
  cacheUserId = next;
}

export function getApiCacheUser(): string | null {
  return cacheUserId;
}

// Mutaciones que solo afectan a su propio recurso: no tiran toda la cache,
// solo la de ese recurso. Telemetria de uso y la configuracion del widget de
// accesibilidad (que se guarda sola al cargar cada pantalla).
const ISOLATED_MUTATION_PREFIXES = ["/api/eventos-uso", "/api/configuraciones-accesibilidad"];

function invalidateAfterMutation(path: string): void {
  const isolated = ISOLATED_MUTATION_PREFIXES.find((prefix) => path.startsWith(prefix));
  if (isolated) {
    for (const key of [...getCache.keys()]) {
      if (key.includes(` GET ${isolated}`)) getCache.delete(key);
    }
    return;
  }
  // Cualquier otra escritura puede afectar varias lecturas relacionadas:
  // se descarta todo lo cacheado del usuario para que vea su cambio enseguida.
  clearGetCache();
  if (cacheUserId) clearPersistedApiCache(`${API_CACHE_STORAGE_PREFIX}v${API_CACHE_SCHEMA_VERSION}:${cacheUserId}:`);
}

function dispatchCacheUpdated(path: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<ApiCacheUpdatedDetail>(API_CACHE_UPDATED_EVENT, { detail: { path } }));
}

export function getDefaultAuthToken(): string | null {
  sessionStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_TOKEN_KEY);
  return null;
}

export function storeDefaultAuthToken(_token?: string | null): void {
  sessionStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

export function clearDefaultAuthToken(): void {
  sessionStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

function clearTandemStorage(): void {
  for (let i = sessionStorage.length - 1; i >= 0; i--) {
    const key = sessionStorage.key(i);
    if (key && key.startsWith("tandem:")) sessionStorage.removeItem(key);
  }
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key && (key.startsWith("tandem:auth") || key.startsWith("tandem:user"))) {
      localStorage.removeItem(key);
    }
  }
}

function notifyAuthExpired(): void {
  clearDefaultAuthToken();
  clearApiCache();
  clearTandemStorage();
  fetch(buildUrl("/api/auth/logout"), {
    method: "POST",
    credentials: "include",
    headers: buildCsrfHeaders(),
  }).catch(() => {});
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
  }
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;

  const prefix = `${name}=`;
  const raw = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));

  return raw ? decodeURIComponent(raw.slice(prefix.length)) : null;
}

function isMutatingMethod(method?: string): boolean {
  return !["GET", "HEAD", "OPTIONS"].includes(String(method || "GET").toUpperCase());
}

function buildCsrfHeaders(method?: string): Record<string, string> {
  if (!isMutatingMethod(method)) return {};

  const csrfToken = getCookie(CSRF_COOKIE_KEY);
  return csrfToken ? { "X-CSRF-Token": csrfToken } : {};
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  return apiRequestInternal<T>(path, options, true);
}

let refreshPromise: Promise<boolean> | null = null;

async function doRefresh(): Promise<boolean> {
  const response = await fetch(buildUrl("/api/auth/refresh"), {
    method: "POST",
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    notifyAuthExpired();
    return false;
  }

  await parseResponseBody(response);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(TOKEN_REFRESHED_EVENT));
  }
  return true;
}

async function refreshAccessToken(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = doRefresh().catch(async () => {
      await new Promise((r) => setTimeout(r, 500));
      return doRefresh();
    }).finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

async function apiRequestInternal<T>(
  path: string,
  options: ApiRequestOptions,
  allowRefresh: boolean,
  forceNetwork = false,
): Promise<T> {
  const { body, token, headers, ...init } = options;
  if (token !== undefined) {
    storeDefaultAuthToken(token);
  }
  const method = init.method;
  const cacheKey = memoryKey(method, path);
  const cacheableGet = allowRefresh && isCacheableGet(path, method, body);
  const ttlMs = options.cacheTtlMs ?? DEFAULT_GET_CACHE_TTL_MS;
  if (cacheableGet && !forceNetwork) {
    const cached = getCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return cached.value as T;

    const inflight = getInflight.get(cacheKey);
    if (inflight) return inflight as Promise<T>;

    if (ttlMs > 0 && !revalidatedKeys.has(cacheKey)) {
      revalidatedKeys.add(cacheKey);
      const persisted = readPersisted(path);
      if (persisted) {
        // Mostrar lo guardado ya mismo y revalidar en segundo plano.
        getCache.set(cacheKey, { value: persisted.value, expiresAt: Date.now() + ttlMs });
        const previous = JSON.stringify(persisted.value);
        void apiRequestInternal<T>(path, { ...options, cacheTtlMs: ttlMs }, true, true)
          .then((fresh) => {
            if (JSON.stringify(fresh) !== previous) dispatchCacheUpdated(path);
          })
          .catch(() => {
            // Si ya no se puede leer (403/404/red), no seguir mostrando lo viejo.
            getCache.delete(cacheKey);
            removePersisted(path);
            dispatchCacheUpdated(path);
          });
        return persisted.value as T;
      }
    }
  }

  if (isMutatingMethod(method)) invalidateAfterMutation(path);

  const requestPromise = (async (): Promise<T> => {
  const response = await fetch(buildUrl(path), {
    ...init,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...buildCsrfHeaders(method),
      ...(headers || {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const payload = await parseResponseBody(response);

  if (
    response.status === 401 &&
    allowRefresh &&
    !path.startsWith("/api/auth/login") &&
    !path.startsWith("/api/auth/register") &&
    !path.startsWith("/api/auth/refresh") &&
    !path.startsWith("/api/auth/logout")
  ) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return apiRequestInternal<T>(path, options, false);
    }
  }

  if (!response.ok) {
    const message =
      typeof payload === "string"
        ? payload
        : payload && typeof payload === "object" && "message" in payload && typeof (payload as { message?: unknown }).message === "string"
          ? (payload as { message: string }).message
          : payload && typeof payload === "object" && "error" in payload && typeof (payload as { error?: unknown }).error === "string"
            ? (payload as { error: string }).error
        : `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
  })();

  if (cacheableGet) {
    const userAtStart = cacheUserId;
    getInflight.set(cacheKey, requestPromise);
    try {
      const value = await requestPromise;
      // Si mientras tanto cambio la sesion, no guardar la respuesta.
      if (userAtStart === cacheUserId) {
        getCache.set(cacheKey, { value, expiresAt: Date.now() + ttlMs });
        if (ttlMs > 0) writePersisted(path, value);
      }
      return value;
    } finally {
      if (getInflight.get(cacheKey) === requestPromise) getInflight.delete(cacheKey);
    }
  }

  return requestPromise;
}

export async function apiUploadFile<T>(
  path: string,
  formData: FormData,
  onProgress?: (pct: number) => void,
  signal?: AbortSignal,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", buildUrl(path));
    xhr.withCredentials = true;

    const csrfToken = getCookie(CSRF_COOKIE_KEY);
    if (csrfToken) {
      xhr.setRequestHeader("X-CSRF-Token", csrfToken);
    }

    if (signal) {
      signal.addEventListener("abort", () => xhr.abort());
    }

    xhr.upload.addEventListener("progress", (e) => {
      if (onProgress && e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      let payload: unknown = null;
      if (xhr.responseText) {
        try {
          payload = JSON.parse(xhr.responseText);
        } catch {
          payload = xhr.responseText;
        }
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(payload as T);
      } else {
        const message =
          payload && typeof payload === "string"
            ? payload
            : payload && typeof payload === "object" && "message" in payload
              ? (payload as { message: string }).message
              : `Upload failed with status ${xhr.status}`;
        reject(new ApiError(message, xhr.status, payload));
      }
    });

    xhr.addEventListener("error", () => reject(new ApiError("Network error during upload", 0)));
    xhr.addEventListener("abort", () => reject(new ApiError("Upload aborted", 0)));

    xhr.send(formData);
  });
}

export function unwrapApiData<T>(payload: T | ApiEnvelope<T>): T {
  if (
    payload &&
    typeof payload === "object" &&
    "ok" in payload &&
    "data" in payload
  ) {
    return (payload as ApiEnvelope<T>).data;
  }

  return payload as T;
}
