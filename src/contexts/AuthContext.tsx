import React, { createContext, useContext, useState, ReactNode } from 'react';
import { findUser, User, Tutor, Professional, Admin } from '@/data/api';

type AuthUser = User | Tutor | Professional | Admin;

interface AuthContextType {
  user: AuthUser | null;
  login: (username: string, password: string) => Promise<boolean>;
  loginAs: (user: AuthUser) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  const login = async (username: string, password: string): Promise<boolean> => {
    const found = await findUser(username, password);
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
