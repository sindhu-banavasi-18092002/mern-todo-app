import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, tokenStore } from "../api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  // Restore the session from the saved token on first load
  useEffect(() => {
    let cancelled = false;
    async function restore() {
      if (!tokenStore.get()) {
        setReady(true);
        return;
      }
      try {
        const { user: current } = await api.me();
        if (!cancelled) setUser(current);
      } catch {
        tokenStore.clear();
      } finally {
        if (!cancelled) setReady(true);
      }
    }
    restore();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const { token, user: current } = await api.login({ email, password });
    tokenStore.set(token);
    setUser(current);
    return current;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const { token, user: current } = await api.register({ name, email, password });
    tokenStore.set(token);
    setUser(current);
    return current;
  }, []);

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, ready, login, register, logout, isAdmin: user?.role === "admin" }),
    [user, ready, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}
