import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthContext } from "./auth.context.js";

const API_URL = import.meta.env.VITE_SERVER_URL;
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [csrfToken, setCsrfToken] = useState(() =>
    sessionStorage.getItem("csrfToken")
  );
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(() => {
    sessionStorage.removeItem("csrfToken");
    setCsrfToken(null);
    setUser(null);
    setLoading(false);
  }, []);

  const setSession = useCallback((nextUser, nextCsrfToken) => {
    sessionStorage.setItem("csrfToken", nextCsrfToken);
    setCsrfToken(nextCsrfToken);
    setUser(nextUser);
    setLoading(false);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    fetch(`${API_URL}/auth/me`, {
      credentials: "include",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Session is no longer valid");
        return response.json();
      })
      .then((data) => {
        if (active) setSession(data.user, data.csrfToken);
      })
      .catch((error) => {
        if (active && error.name !== "AbortError") clearSession();
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [clearSession, setSession]);

  const apiFetch = useCallback(
    async (path, options = {}) => {
      const headers = new Headers(options.headers || {});
      const method = (options.method || "GET").toUpperCase();

      if (!SAFE_METHODS.has(method) && csrfToken) {
        headers.set("X-CSRF-Token", csrfToken);
      }

      const response = await fetch(`${API_URL}${path}`, {
        ...options,
        credentials: "include",
        headers,
      });

      if (response.status === 401) clearSession();
      return response;
    },
    [clearSession, csrfToken]
  );

  const logout = useCallback(async () => {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: csrfToken ? { "X-CSRF-Token": csrfToken } : {},
      });
    } finally {
      clearSession();
    }
  }, [clearSession, csrfToken]);

  const value = useMemo(
    () => ({ user, loading, setSession, apiFetch, logout }),
    [apiFetch, loading, logout, setSession, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

