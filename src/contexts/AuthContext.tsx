import React, { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { clearStoredAuthToken, fetchStoredAuthUser, findUser, loginWithGoogle, logoutStoredAuthSession, registerUser, User, Tutor, Professional, Admin } from '@/data/api';
import type { RegisterRequest } from '@/services/api';
import { AUTH_EXPIRED_EVENT, clearApiCache, setApiCacheUser } from '@/services/api/client';
import { resetActiveTabToHome } from '@/lib/activeTab';
import { clearAuthSnapshot, readAuthSnapshot, writeAuthSnapshot } from '@/lib/authSnapshot';

type AuthUser = User | Tutor | Professional | Admin;

interface AuthContextType {
  user: AuthUser | null;
  login: (username: string, password: string) => Promise<boolean>;
  register: (payload: RegisterRequest) => Promise<AuthUser>;
  googleAuth: (payload: { accessToken: string } & Partial<RegisterRequest>) => Promise<AuthUser>;
  loginAs: (user: AuthUser) => void;
  refreshUser: () => Promise<AuthUser | null>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Usuario de la ultima sesion de esta pestana (sessionStorage). Permite
// disparar los pedidos de la pantalla en paralelo con /api/auth/me en vez de
// esperarlo; /api/auth/me igual decide: si falla se limpia todo y va al login.
function readInitialUser(): AuthUser | null {
  const snapshot = readAuthSnapshot<AuthUser>();
  const initial = snapshot ? ({ ...snapshot, password: '' } as AuthUser) : null;
  // Sincronico (antes del primer render de las pantallas): la cache de API
  // queda asociada a este usuario antes de que se dispare cualquier pedido.
  setApiCacheUser(initial?.id ?? null);
  return initial;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(readInitialUser);
  const [isLoading, setIsLoading] = useState(() => user === null);

  // Todo cambio de usuario pasa por aca: la cache de API se ata al usuario
  // nuevo (y se borra si cambio) y se actualiza o borra la copia de sesion.
  const setUser = useCallback((next: AuthUser | null) => {
    setApiCacheUser(next?.id ?? null);
    if (next) writeAuthSnapshot(next);
    else clearAuthSnapshot();
    setUserState(next);
  }, []);

  useEffect(() => {
    let mounted = true;

    fetchStoredAuthUser()
      .then(currentUser => {
        if (!mounted) return;
        if (currentUser) {
          setUser(currentUser);
        } else {
          clearStoredAuthToken();
          clearApiCache();
          setUser(null);
        }
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [setUser]);

  useEffect(() => {
    const handleAuthExpired = () => {
      clearStoredAuthToken();
      clearApiCache();
      setUser(null);
      setIsLoading(false);
    };

    window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    return () => {
      window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    };
  }, [setUser]);

  const login = async (username: string, password: string): Promise<boolean> => {
    const found = await findUser(username, password);
    if (found) {
      resetActiveTabToHome();
      setUser(found);
      return true;
    }
    return false;
  };

  const register = async (payload: RegisterRequest): Promise<AuthUser> => {
    const created = await registerUser(payload);
    resetActiveTabToHome();
    setUser(created);
    return created;
  };

  const googleAuth = async (
    payload: { accessToken: string } & Partial<RegisterRequest>,
  ): Promise<AuthUser> => {
    const found = await loginWithGoogle(payload);
    resetActiveTabToHome();
    setUser(found);
    return found;
  };

  const loginAs = (u: AuthUser) => {
    setUser(u);
  };

  const refreshUser = async (): Promise<AuthUser | null> => {
    const currentUser = await fetchStoredAuthUser();
    if (currentUser) {
      setUser(currentUser);
      return currentUser;
    }
    return null;
  };

  const logout = () => {
    void logoutStoredAuthSession();
    clearStoredAuthToken();
    clearApiCache();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, googleAuth, loginAs, refreshUser, logout, isAuthenticated: !!user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
