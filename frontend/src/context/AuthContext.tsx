import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { api, setTokens, clearTokens, getToken, ApiError } from "../lib/apiClient";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  phone?: string | null;
};

type AuthContextType = {
  currentUser: AuthUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  error: string | null;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isLoading,   setIsLoading]   = useState(true);
  const [error,       setError]       = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) { setIsLoading(false); return; }
    api.get<{ user: AuthUser }>("/auth/me")
      .then(d => setCurrentUser(d.user))
      .catch(() => clearTokens())
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    const data = await api.post<{ user: AuthUser; accessToken: string; refreshToken: string }>(
      "/auth/login", { email, password }
    );
    setTokens(data.accessToken, data.refreshToken);
    setCurrentUser(data.user);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string, phone?: string) => {
    setError(null);
    const data = await api.post<{ user: AuthUser; accessToken: string; refreshToken: string }>(
      "/auth/register", { name, email, password, ...(phone ? { phone } : {}) }
    );
    setTokens(data.accessToken, data.refreshToken);
    setCurrentUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    const rt = localStorage.getItem("seen_refresh_token");
    try { await api.post("/auth/logout", { refreshToken: rt }); } catch { /* ignore */ }
    clearTokens();
    setCurrentUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const d = await api.get<{ user: AuthUser }>("/auth/me");
      setCurrentUser(d.user);
    } catch { /* ignore */ }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider value={{
      currentUser,
      isAuthenticated: !!currentUser,
      isAdmin: currentUser?.role === "admin",
      isLoading,
      login, register, logout, refreshUser,
      error, clearError,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
