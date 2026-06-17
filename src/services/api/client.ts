const DEFAULT_BACKEND_URL = "http://localhost:3000";

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

function getDefaultAuthToken(): string | null {
  const sessionToken = sessionStorage.getItem("tandem_auth_token");
  if (sessionToken) return sessionToken;

  const legacyToken = localStorage.getItem("tandem_auth_token");
  if (!legacyToken) return null;

  sessionStorage.setItem("tandem_auth_token", legacyToken);
  localStorage.removeItem("tandem_auth_token");
  return legacyToken;
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
  const { body, token, headers, ...init } = options;
  const authToken = token === undefined ? getDefaultAuthToken() : token;

  const response = await fetch(buildUrl(path), {
    ...init,
    headers: {
      Accept: "application/json",
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...(headers || {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const payload = await parseResponseBody(response);

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
