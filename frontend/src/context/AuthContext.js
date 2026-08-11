import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "../lib/api";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [role, setRoleState] = useState(() => localStorage.getItem("aq_role") || null);

  const setRole = (r) => {
    if (r) localStorage.setItem("aq_role", r);
    else localStorage.removeItem("aq_role");
    setRoleState(r);
  };

  const refresh = useCallback(async () => {
    const token = localStorage.getItem("aq_access_token");
    if (!token) {
      setUser(null);
      setLoading(false);
      return null;
    }
    try {
      const { data } = await api.get("/auth/me");
      setUser(data);
      return data;
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const applyTokens = (t) => {
    if (t?.access_token) localStorage.setItem("aq_access_token", t.access_token);
    if (t?.refresh_token) localStorage.setItem("aq_refresh_token", t.refresh_token);
    if (t?.user) setUser(t.user);
  };

  const logout = () => {
    localStorage.removeItem("aq_access_token");
    localStorage.removeItem("aq_refresh_token");
    setUser(null);
  };

  return (
    <AuthCtx.Provider value={{ user, loading, role, setRole, applyTokens, logout, refresh }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
