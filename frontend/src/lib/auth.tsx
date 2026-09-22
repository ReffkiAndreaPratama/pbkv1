import { createContext, useContext, useState, type ReactNode } from "react";
import { getToken, setToken, getCachedUser, cacheUser, clearToken, type SessionUser } from "./api";

interface AuthState {
  user: SessionUser | null;
  hydrated: boolean;
  login: (token: string, user: SessionUser) => void;
  logout: () => void;
  setUser: (u: SessionUser) => void;
}

const AuthContext = createContext<AuthState>({ user: null, hydrated: false, login: () => {}, logout: () => {}, setUser: () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<SessionUser | null>(() => (getToken() ? getCachedUser() : null));
  const [hydrated] = useState(true);

  const login = (token: string, u: SessionUser) => {
    setToken(token);
    cacheUser(u);
    setUserState(u);
  };

  const logout = () => {
    clearToken();
    setUserState(null);
  };

  const setUser = (u: SessionUser) => {
    cacheUser(u);
    setUserState(u);
  };

  return <AuthContext.Provider value={{ user, hydrated, login, logout, setUser }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}