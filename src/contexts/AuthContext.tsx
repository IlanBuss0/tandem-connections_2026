import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { clearStoredAuthToken, fetchStoredAuthUser, findUser, logoutStoredAuthSession, User, Tutor, Professional, Admin } from '@/data/api';
import { AUTH_EXPIRED_EVENT } from '@/services/api/client';

type AuthUser = User | Tutor | Professional | Admin;

interface AuthContextType {
  user: AuthUser | null;
  login: (username: string, password: string) => Promise<boolean>;
  loginAs: (user: AuthUser) => void;
  refreshUser: () => Promise<AuthUser | null>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);
const AUTH_USER_KEY = 'tandem_auth_user';

function loadStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    return raw ? JSON.parse(raw) as AuthUser : null;
  } catch {
    return null;
  }
}

function storeUser(user: AuthUser | null) {
  try {
    if (user) {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_USER_KEY);
    }
  } catch {
    // Storage can fail in private mode or restricted browsers.
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => loadStoredUser());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    setIsLoading(!user);
    fetchStoredAuthUser()
      .then(currentUser => {
        if (!mounted) return;
        if (currentUser) {
          setUser(currentUser);
          storeUser(currentUser);
        } else {
          clearStoredAuthToken();
          storeUser(null);
          setUser(null);
        }
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const handleAuthExpired = () => {
      clearStoredAuthToken();
      storeUser(null);
      setUser(null);
      setIsLoading(false);
    };

    window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    return () => {
      window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    };
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    const found = await findUser(username, password);
    if (found) {
      setUser(found);
      storeUser(found);
      return true;
    }
    return false;
  };

  const loginAs = (u: AuthUser) => {
    setUser(u);
    storeUser(u);
  };

  const refreshUser = async (): Promise<AuthUser | null> => {
    const currentUser = await fetchStoredAuthUser();
    if (currentUser) {
      setUser(currentUser);
      storeUser(currentUser);
      return currentUser;
    }
    return null;
  };

  const logout = () => {
    void logoutStoredAuthSession();
    clearStoredAuthToken();
    storeUser(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, loginAs, refreshUser, logout, isAuthenticated: !!user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
