import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api, configureApi } from "../api/client";
import type { User } from "../types";

const TOKEN_KEY = "HelpDesk Lite.accessToken";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

interface AuthResponse {
  accessToken: string;
  user: User;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function getTokenExpiry(token: string): number | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const normalized = payload
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(payload.length / 4) * 4, "=");
    const claims = JSON.parse(atob(normalized)) as { exp?: number };
    return typeof claims.exp === "number" ? claims.exp * 1000 : null;
  } catch {
    return null;
  }
}

function isExpired(token: string): boolean {
  const expiry = getTokenExpiry(token);
  return expiry === null || expiry <= Date.now();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(TOKEN_KEY),
  );
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    configureApi(() => token, logout);
  }, [token, logout]);

  useEffect(() => {
    let active = true;
    if (!token || isExpired(token)) {
      logout();
      return () => {
        active = false;
      };
    }

    const expiresAt = getTokenExpiry(token);
    const expiryTimer = window.setTimeout(
      logout,
      Math.max(0, (expiresAt ?? Date.now()) - Date.now()),
    );
    setLoading(true);
    api<User>("/auth/profile")
      .then((profile) => {
        if (active) setUser(profile);
      })
      .catch(() => {
        if (active) logout();
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      window.clearTimeout(expiryTimer);
    };
  }, [token, logout]);

  const authenticate = useCallback(
    async (path: string, email: string, password: string) => {
      const result = await api<AuthResponse>(path, {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem(TOKEN_KEY, result.accessToken);
      setToken(result.accessToken);
      setUser(result.user);
    },
    [],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      login: (email, password) =>
        authenticate("/auth/login", email, password),
      signup: (email, password) =>
        authenticate("/auth/signup", email, password),
      logout,
    }),
    [user, loading, authenticate, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
