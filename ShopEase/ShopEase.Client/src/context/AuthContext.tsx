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
import type { AuthCredentials, AuthResponse, RegisterCredentials } from "../types";

interface AuthContextValue {
  session: AuthResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: AuthCredentials) => Promise<AuthResponse>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearSession = useCallback(() => setSession(null), []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const login = useCallback(async (credentials: AuthCredentials) => {
    const authenticatedSession = await authApi.login(credentials);
    setSession(authenticatedSession);
    return authenticatedSession;
  }, []);

  const register = useCallback(async (credentials: RegisterCredentials) => {
    setSession(await authApi.register(credentials));
  }, []);

  useEffect(() => {
    let active = true;
    // Remove sessions created by the old localStorage-based bearer-token flow.
    localStorage.removeItem("shopease.auth");
    setUnauthorizedHandler(clearSession);

    authApi.getSession()
      .then((currentSession) => {
        if (active) setSession(currentSession);
      })
      .catch(() => {
        if (active) setSession(null);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
      setUnauthorizedHandler(null);
    };
  }, [clearSession]);

  const value = useMemo(
    () => ({ session, isAuthenticated: Boolean(session), isLoading, login, register, logout }),
    [session, isLoading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider.");
  return context;
}
