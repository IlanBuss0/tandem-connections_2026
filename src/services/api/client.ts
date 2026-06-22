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
  ((import.meta as any).env?.VITE_BACKEND_URL as string | undefined) ||
  ((import.meta as any).env?.VITE_API_BASE_URL as string | undefined) ||
  DEFAULT_BACKEND_URL;

function buildUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL.replace(/\/$/, "")}${normalizedPath}`;
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
  allowRefresh: boolean
): Promise<T> {
  const { body, token, headers, ...init } = options;
  if (token !== undefined) {
    storeDefaultAuthToken(token);
  }
  const method = init.method;

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
