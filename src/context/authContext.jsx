"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { hasPermission as checkPermission } from "../libs/permissions";

const AuthContext = createContext(null);

// A sessão vive num cookie HttpOnly assinado; o cliente só pergunta ao servidor quem está logado.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadMe = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (!res.ok) {
        setUser(null);
        return null;
      }
      const me = await res.json();
      setUser(me);
      return me;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    loadMe().finally(() => setLoading(false));
  }, [loadMe]);

  // Revalida a cada 30 min (usuário desativado/alterado é deslogado)
  useEffect(() => {
    if (!user) return;
    const id = setInterval(loadMe, 30 * 60 * 1000);
    return () => clearInterval(id);
  }, [user, loadMe]);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data.error || "Usuário ou senha inválidos";
        setError(msg);
        return msg;
      }
      setUser(data);
      return true;
    } catch {
      const msg = "Erro de conexão. Tente novamente.";
      setError(msg);
      return msg;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
    setError(null);
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
  }, []);

  const hasPermission = useCallback(
    (resource, action) => checkPermission(user, resource, action),
    [user],
  );

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      login,
      logout,
      refreshUser: loadMe,
      isAuthenticated: !!user,
      isAdmin: user?.role === "admin",
      hasPermission,
      role: user?.role || null,
    }),
    [user, loading, error, login, logout, loadMe, hasPermission],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}
