declare global {
  interface Window {
    google?: any;
    gapi?: any;
  }
}

export const GOOGLE_DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";
export const GOOGLE_DOCS_SCOPE = "https://www.googleapis.com/auth/documents";
export const GOOGLE_DOCS_MIME_TYPE = "application/vnd.google-apps.document";
export const GOOGLE_FOLDER_MIME_TYPE = "application/vnd.google-apps.folder";
export const GOOGLE_CONSENT_STORAGE_KEY = "tandem.googleDriveConsentGranted";

export class GoogleApiError extends Error {
  status: number;
  reason?: string;

  constructor(message: string, status: number, reason?: string) {
    super(message);
    this.name = "GoogleApiError";
    this.status = status;
    this.reason = reason;
  }
}

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(
      `script[src="${src}"]`,
    ) as HTMLScriptElement | null;
    if (existing?.dataset.loaded === "true") return resolve();
    const script = existing || document.createElement("script");
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = () => reject(new Error("No se pudo cargar Google Drive."));
    if (!existing) document.head.appendChild(script);
  });
}

export async function ensureGoogleScripts() {
  await Promise.all([
    loadScript("https://apis.google.com/js/api.js"),
    loadScript("https://accounts.google.com/gsi/client"),
  ]);
}

let cachedToken: { token: string; expiresAt: number } | null = null;

export function invalidateGoogleToken() {
  cachedToken = null;
}

export async function requestGoogleAccessToken(forceConsent = false) {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error("Falta VITE_GOOGLE_CLIENT_ID.");

  await ensureGoogleScripts();

  return await new Promise<string>((resolve, reject) => {
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: `${GOOGLE_DRIVE_SCOPE} ${GOOGLE_DOCS_SCOPE}`,
      callback: (tokenResponse: {
        access_token?: string;
        expires_in?: number | string;
        error?: string;
        error_description?: string;
      }) => {
        if (tokenResponse?.access_token) {
          localStorage.setItem(GOOGLE_CONSENT_STORAGE_KEY, "1");
          const expiresIn = Number(tokenResponse.expires_in) || 3600;
          cachedToken = {
            token: tokenResponse.access_token,
            expiresAt: Date.now() + (expiresIn - 60) * 1000,
          };
          resolve(tokenResponse.access_token);
          return;
        }
        reject(
          new Error(
            tokenResponse?.error_description ||
              tokenResponse?.error ||
              "Google no devolvio un token.",
          ),
        );
      },
    });

    const alreadyGranted =
      localStorage.getItem(GOOGLE_CONSENT_STORAGE_KEY) === "1";
    tokenClient.requestAccessToken({
      prompt: forceConsent || !alreadyGranted ? "consent" : "",
    });
  });
}

async function getGoogleAccessToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }
  return requestGoogleAccessToken(false);
}

export async function withGoogleToken<T>(
  fn: (token: string) => Promise<T>,
): Promise<T> {
  const token = await getGoogleAccessToken();
  try {
    return await fn(token);
  } catch (error) {
    if (error instanceof GoogleApiError && error.status === 401) {
      invalidateGoogleToken();
      const fresh = await requestGoogleAccessToken(false);
      return await fn(fresh);
    }
    throw error;
  }
}

const RETRY_DELAYS_MS = [500, 1500];

export async function googleFetch(
  token: string,
  url: string,
  init: RequestInit = {},
): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    const response = await fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...(init.headers || {}),
      },
    });
    if (response.ok) return response;

    if (
      (response.status === 429 || response.status >= 500) &&
      attempt < RETRY_DELAYS_MS.length
    ) {
      await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[attempt]));
      continue;
    }

    let message = `Google respondio ${response.status}.`;
    let reason: string | undefined;
    try {
      const payload = await response.json();
      message = payload?.error?.message || message;
      reason = payload?.error?.errors?.[0]?.reason || payload?.error?.status;
    } catch {
      // cuerpo no-JSON: se conserva el mensaje generico
    }
    if (reason === "accessNotConfigured" || reason === "SERVICE_DISABLED") {
      message =
        "Falta habilitar la API de Google Drive en tu proyecto de Google Cloud (console.cloud.google.com/apis/library/drive.googleapis.com).";
    }
    throw new GoogleApiError(message, response.status, reason);
  }
}
