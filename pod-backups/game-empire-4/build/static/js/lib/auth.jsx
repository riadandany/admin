import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import api, { getToken, setToken, clearToken } from "./api";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!getToken()) { setUser(null); setLoading(false); return; }
    try {
      const r = await api.get("/auth/me");
      setUser(r.data);
    } catch {
      clearToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const login = async (identifier, password) => {
    const r = await api.post("/auth/login", { identifier, password });
    setToken(r.data.token); setUser(r.data.user);
    return r.data.user;
  };
  const signup = async (data) => {
    const r = await api.post("/auth/signup", data);
    setToken(r.data.token); setUser(r.data.user);
    return r.data.user;
  };
  const logout = () => { clearToken(); setUser(null); };

  return (
    <AuthCtx.Provider value={{ user, setUser, loading, login, signup, logout, refresh }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
