import React, { createContext, useContext, useState, ReactNode } from 'react';
import { findUser, User, Tutor, Professional, Admin } from '@/data/mockData';

type AuthUser = User | Tutor | Professional | Admin;

interface AuthContextType {
  user: AuthUser | null;
  login: (username: string, password: string) => boolean;
  loginAs: (user: AuthUser) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  const login = (username: string, password: string): boolean => {
    const found = findUser(username, password);
    if (found) {
      setUser(found);
      return true;
    }
    return false;
  };

  const loginAs = (u: AuthUser) => setUser(u);
  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, loginAs, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
