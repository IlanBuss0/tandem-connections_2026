// Copia del usuario logueado en sessionStorage para que, al recargar, la app
// arranque sin esperar /api/auth/me (que se valida en paralelo). Solo datos
// de perfil que la propia app ya muestra (nombre, rol, avatar): nada de tokens.
// Se borra en logout, al vencer la sesion o si /api/auth/me no confirma al
// mismo usuario. Vence a las 24 h y lleva version de esquema.
export const AUTH_SNAPSHOT_KEY = "tandem:auth-user-snapshot";
export const AUTH_SNAPSHOT_VERSION = 1;
export const AUTH_SNAPSHOT_MAX_AGE_MS = 24 * 60 * 60 * 1000;

type Snapshot<T> = { v: number; savedAt: number; user: T };

function storage(): Storage | null {
  try {
    return typeof window !== "undefined" ? window.sessionStorage : null;
  } catch {
    return null;
  }
}

export function readAuthSnapshot<T extends { id: string }>(): T | null {
  const store = storage();
  if (!store) return null;
  try {
    const raw = store.getItem(AUTH_SNAPSHOT_KEY);
    if (!raw) return null;
    const snapshot = JSON.parse(raw) as Snapshot<T>;
    const valid = snapshot?.v === AUTH_SNAPSHOT_VERSION
      && typeof snapshot.savedAt === "number"
      && Date.now() - snapshot.savedAt < AUTH_SNAPSHOT_MAX_AGE_MS
      && Boolean(snapshot.user?.id);
    if (!valid) {
      store.removeItem(AUTH_SNAPSHOT_KEY);
      return null;
    }
    return snapshot.user;
  } catch {
    return null;
  }
}

export function writeAuthSnapshot<T extends { id: string; password?: string }>(user: T): void {
  const store = storage();
  if (!store) return;
  try {
    const { password: _password, ...safeUser } = user;
    const snapshot: Snapshot<Omit<T, "password">> = { v: AUTH_SNAPSHOT_VERSION, savedAt: Date.now(), user: safeUser };
    store.setItem(AUTH_SNAPSHOT_KEY, JSON.stringify(snapshot));
  } catch {
    // Sin storage: la app funciona igual, solo espera /api/auth/me.
  }
}

export function clearAuthSnapshot(): void {
  try {
    storage()?.removeItem(AUTH_SNAPSHOT_KEY);
  } catch {
    // ignorar
  }
}
