'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export interface UserProfile {
  id: string;
  username: string;
  role: string;
  full_name: string;
}

interface AuthContextType {
  token: string | null;
  user: UserProfile | null;
  login: (token: string, user: UserProfile) => void;
  logout: () => void;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType>({
  token: null, user: null,
  login: () => {}, logout: () => {},
  authFetch: (url) => fetch(url)
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const t = localStorage.getItem('sentinel_token');
    const u = localStorage.getItem('sentinel_user');
    if (t) setToken(t);
    if (u) { try { setUser(JSON.parse(u)); } catch {} }
  }, []);

  // Auth guard: redirect unauthenticated users to login
  useEffect(() => {
    const isLoginPage = pathname === '/login';
    const hasToken = !!localStorage.getItem('sentinel_token');
    if (!isLoginPage && !hasToken) {
      router.push('/login');
    }
  }, [pathname, router]);

  const login = (newToken: string, newUser: UserProfile) => {
    localStorage.setItem('sentinel_token', newToken);
    localStorage.setItem('sentinel_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    router.push('/');
  };

  const logout = () => {
    localStorage.removeItem('sentinel_token');
    localStorage.removeItem('sentinel_user');
    setToken(null);
    setUser(null);
    router.push('/login');
  };

  const authFetch = (url: string, options: RequestInit = {}) => {
    const t = localStorage.getItem('sentinel_token');
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Content-Type': 'application/json',
        ...(t ? { Authorization: `Bearer ${t}` } : {})
      }
    });
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, authFetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
