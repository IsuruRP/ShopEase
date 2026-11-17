import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import * as authApi from "../api/auth";
import { setUnauthorizedHandler } from "../api/client";
import type { AuthCredentials, AuthResponse } from "../types";

const STORAGE_KEY = "shopease.auth";

interface AuthContextValue {
  session: AuthResponse | null;
  isAuthenticated: boolean;
  login: (credentials: AuthCredentials) => Promise<AuthResponse>;
  register: (credentials: AuthCredentials) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredSession(): AuthResponse | null {
  const storedSession = localStorage.getItem(STORAGE_KEY);

  if (!storedSession) return null;

  try {
    const session = JSON.parse(storedSession) as AuthResponse;

    if (new Date(session.expiresAtUtc).getTime() <= Date.now()) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return session;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthResponse | null>(readStoredSession);

  const saveSession = useCallback((newSession: AuthResponse) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSession));
    setSession(newSession);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setSession(null);
  }, []);

  const login = useCallback(
    async (credentials: AuthCredentials) => {
      const authenticatedSession = await authApi.login(credentials);
      saveSession(authenticatedSession);
      return authenticatedSession;
    },
    [saveSession],
  );

  const register = useCallback(
    async (credentials: AuthCredentials) => {
      saveSession(await authApi.register(credentials));
    },
    [saveSession],
  );

  useEffect(() => {
    setUnauthorizedHandler(logout);
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  const value = useMemo(
    () => ({
      session,
      isAuthenticated: Boolean(session),
      login,
      register,
      logout,
    }),
    [session, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
