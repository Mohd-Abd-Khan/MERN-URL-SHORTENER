import { useState, useEffect, useCallback, useMemo } from "react";
import { AuthContext } from "./AuthContextObject";
import {
  loginUser as loginApi,
  registerUser as registerApi,
  logoutUser as logoutApi,
  refreshToken as refreshApi,
} from "../api/authApi";
import api from "../api/axiosInstance";

/**
 * Provides authentication state and actions to the component tree.
 * - Stores accessToken in memory (React state), never localStorage.
 * - On mount, attempts to restore session via refresh cookie.
 * - Configures Axios interceptor for automatic 401 → refresh → retry.
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // ──── Update the Axios instance with the current token ────
  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use((config) => {
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
      return config;
    });

    return () => {
      api.interceptors.request.eject(requestInterceptor);
    };
  }, [accessToken]);

  // ──── Response interceptor: 401 → refresh → retry once ────
  useEffect(() => {
    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Only intercept 401s that aren't already retries or refresh requests
        if (
          error.response?.status === 401 &&
          !originalRequest._retry &&
          !originalRequest.url?.includes("/api/auth/refresh") &&
          !originalRequest.url?.includes("/api/auth/login")
        ) {
          originalRequest._retry = true;

          try {
            const data = await refreshApi();
            setAccessToken(data.accessToken);
            setUser(data.user);

            originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
            return api(originalRequest);
          } catch {
            // Refresh failed — log out
            setUser(null);
            setAccessToken(null);
            return Promise.reject(error);
          }
        }

        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.response.eject(responseInterceptor);
    };
  }, []); // only mount once — uses refreshApi directly

  // ──── Restore session on mount ────
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const data = await refreshApi();
        setAccessToken(data.accessToken);
        setUser(data.user);
      } catch {
        // No valid refresh token — user stays logged out
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  // ──── Actions ────
  const login = useCallback(async (email, password) => {
    const data = await loginApi({ email, password });
    setAccessToken(data.accessToken);
    setUser(data.user);
    return data;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const data = await registerApi({ name, email, password });
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } catch {
      // Best-effort logout — clear local state regardless
    } finally {
      setUser(null);
      setAccessToken(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, accessToken, loading, login, register, logout }),
    [user, accessToken, loading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
