'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({ token: null, login: () => {}, logout: () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const t = localStorage.getItem('sentinel_token');
    if (t) setToken(t);
  }, []);

  const login = (newToken: string) => {
    localStorage.setItem('sentinel_token', newToken);
    setToken(newToken);
    router.push('/');
  };

  const logout = () => {
    localStorage.removeItem('sentinel_token');
    setToken(null);
    router.push('/login');
  };

  return <AuthContext.Provider value={{ token, login, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
