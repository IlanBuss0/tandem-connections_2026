const DEFAULT_BACKEND_URL = "http://localhost:3000";
const AUTH_TOKEN_KEY = "tandem_auth_token";

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
  const sessionToken = sessionStorage.getItem(AUTH_TOKEN_KEY);
  if (sessionToken) return sessionToken;

  const legacyToken = localStorage.getItem(AUTH_TOKEN_KEY);
  if (!legacyToken) return null;

  sessionStorage.setItem(AUTH_TOKEN_KEY, legacyToken);
  localStorage.removeItem(AUTH_TOKEN_KEY);
  return legacyToken;
}

export function storeDefaultAuthToken(token: string): void {
  sessionStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

export function clearDefaultAuthToken(): void {
  sessionStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_TOKEN_KEY);
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

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = fetch(buildUrl("/api/auth/refresh"), {
      method: "POST",
      credentials: "include",
      headers: { Accept: "application/json" },
    })
      .then(async (response) => {
        const payload = await parseResponseBody(response);
        if (!response.ok) {
          clearDefaultAuthToken();
          return null;
        }

        const data =
          payload && typeof payload === "object" && "data" in payload
            ? (payload as { data?: { accessToken?: string; token?: string } }).data
            : payload as { accessToken?: string; token?: string } | null;
        const token = data?.accessToken || data?.token || null;
        if (token) storeDefaultAuthToken(token);
        return token;
      })
      .finally(() => {
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
  const authToken = token === undefined ? getDefaultAuthToken() : token;

  const response = await fetch(buildUrl(path), {
    ...init,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
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
    const refreshedToken = await refreshAccessToken();
    if (refreshedToken) {
      return apiRequestInternal<T>(path, { ...options, token: refreshedToken }, false);
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
