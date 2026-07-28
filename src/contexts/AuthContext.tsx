import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { clearStoredAuthToken, fetchStoredAuthUser, findUser, loginWithGoogle, logoutStoredAuthSession, registerUser, User, Tutor, Professional, Admin } from '@/data/api';
import type { RegisterRequest } from '@/services/api';
import { AUTH_EXPIRED_EVENT } from '@/services/api/client';
import { resetActiveTabToHome } from '@/lib/activeTab';

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    fetchStoredAuthUser()
      .then(currentUser => {
        if (!mounted) return;
        if (currentUser) {
          setUser(currentUser);
        } else {
          clearStoredAuthToken();
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
