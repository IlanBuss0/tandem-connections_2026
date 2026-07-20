declare global {
  interface Window {
    google?: any;
    gapi?: any;
  }
}

// drive.file alcanza para documents.create/get/batchUpdate sobre archivos
// creados por la app o abiertos via el Picker (confirmado en la doc oficial
// de Google) — no hace falta el scope "documents" completo, que da acceso a
// TODOS los Docs del profesional y dispara la pantalla de consentimiento
// "sensible" de Google (mas alarmante de lo necesario, y puede requerir
// verificacion CASA para apps en produccion).
export const GOOGLE_DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";
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

// Se persiste en localStorage (no solo en memoria) para que sobreviva a un
// refresh de pagina o cierre de pestaña — mientras el access token de Google
// siga vigente (hasta ~1h), no hace falta volver a autenticar. Google no da
// refresh tokens en este flujo 100% client-side (Token Client de GIS), asi
// que pasado ese ~1h igual hace falta un pedido nuevo — pero al tener
// consentimiento ya otorgado (ver GOOGLE_CONSENT_STORAGE_KEY) ese pedido es
// silencioso (prompt vacio), sin mostrarle nada al profesional.
const GOOGLE_TOKEN_STORAGE_KEY = "tandem.googleDriveAccessToken";

type StoredToken = { token: string; expiresAt: number };

function readStoredToken(): StoredToken | null {
  try {
    const raw = localStorage.getItem(GOOGLE_TOKEN_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredToken;
    if (!parsed?.token || !parsed?.expiresAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeStoredToken(value: StoredToken) {
  localStorage.setItem(GOOGLE_TOKEN_STORAGE_KEY, JSON.stringify(value));
}

export function invalidateGoogleToken() {
  localStorage.removeItem(GOOGLE_TOKEN_STORAGE_KEY);
}

function requestTokenOnce(clientId: string, prompt: string) {
  return new Promise<string>((resolve, reject) => {
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: GOOGLE_DRIVE_SCOPE,
      callback: (tokenResponse: {
        access_token?: string;
        expires_in?: number | string;
        error?: string;
        error_description?: string;
      }) => {
        if (tokenResponse?.access_token) {
          localStorage.setItem(GOOGLE_CONSENT_STORAGE_KEY, "1");
          const expiresIn = Number(tokenResponse.expires_in) || 3600;
          writeStoredToken({
            token: tokenResponse.access_token,
            expiresAt: Date.now() + (expiresIn - 60) * 1000,
          });
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
    tokenClient.requestAccessToken({ prompt });
  });
}

export async function requestGoogleAccessToken(forceConsent = false) {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error("Falta VITE_GOOGLE_CLIENT_ID.");

  await ensureGoogleScripts();

  const alreadyGranted =
    localStorage.getItem(GOOGLE_CONSENT_STORAGE_KEY) === "1";
  const attemptSilently = !forceConsent && alreadyGranted;

  try {
    return await requestTokenOnce(clientId, attemptSilently ? "" : "consent");
  } catch (error) {
    if (!attemptSilently) throw error;
    // El intento silencioso fallo — lo mas probable es que el profesional
    // haya revocado el acceso de Tandem desde su cuenta de Google. En vez
    // de dejarlo trabado con un error generico, se limpia la bandera de
    // consentimiento vieja y se reintenta mostrando la pantalla de permiso
    // de Google de nuevo (como la primera vez).
    localStorage.removeItem(GOOGLE_CONSENT_STORAGE_KEY);
    return await requestTokenOnce(clientId, "consent");
  }
}

async function getGoogleAccessToken() {
  const stored = readStoredToken();
  if (stored && stored.expiresAt > Date.now()) {
    return stored.token;
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
