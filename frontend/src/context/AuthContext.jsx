import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("os_token");
    const cached = localStorage.getItem("os_user");
    if (!token) {
      setLoading(false);
      return;
    }
    if (cached) {
      try { setUser(JSON.parse(cached)); } catch { /* ignore */ }
    }
    api.get("/auth/me")
      .then((r) => {
        setUser(r.data);
        localStorage.setItem("os_user", JSON.stringify(r.data));
      })
      .catch(() => {
        localStorage.removeItem("os_token");
        localStorage.removeItem("os_user");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (matricula, password) => {
    const { data } = await api.post("/auth/login", { matricula, password });
    localStorage.setItem("os_token", data.token);
    localStorage.setItem("os_user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const register = async (payload) => {
    const { data } = await api.post("/auth/register", payload);
    return data;
  };

  const logout = () => {
    localStorage.removeItem("os_token");
    localStorage.removeItem("os_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
