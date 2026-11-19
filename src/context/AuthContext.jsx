import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import api from '../api/client';
import { clearToken, getToken, replaceToken, setToken, tokenExpiry } from '../utils/storage';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const timer = useRef(null);
  const toast = useToast();

  const scheduleExpiry = useCallback((token) => {
    clearTimeout(timer.current);
    const exp = tokenExpiry(token);
    if (!exp) return;
    const ms = exp - Date.now();
    if (ms <= 0) return;
    // setTimeout max is ~24.8 days; tokens are much shorter
    timer.current = setTimeout(() => {
      clearToken();
      setUser(null);
      toast.info('Your session has expired. Please log in again.');
    }, Math.min(ms, 2 ** 31 - 1));
  }, [toast]);

  const logout = useCallback((message) => {
    clearTimeout(timer.current);
    clearToken();
    setUser(null);
    if (message) toast.info(message);
  }, [toast]);

  // Restore the session on page load
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    const exp = tokenExpiry(token);
    if (exp && exp <= Date.now()) {
      clearToken();
      setLoading(false);
      return;
    }
    api.get('/auth/me')
      .then((res) => {
        setUser(res.data.user);
        scheduleExpiry(token);
      })
      .catch(() => clearToken())
      .finally(() => setLoading(false));
  }, [scheduleExpiry]);

  // Server rejected the token (expired / password changed / deactivated)
  useEffect(() => {
    const onExpired = (e) => {
      setUser((current) => {
        if (current) toast.info(e.detail || 'Your session has ended. Please log in again.');
        return null;
      });
    };
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, [toast]);

  const login = useCallback(async (email, password, rememberMe) => {
    const res = await api.post('/auth/login', { email, password, rememberMe });
    setToken(res.data.token, rememberMe);
    scheduleExpiry(res.data.token);
    setUser(res.data.user);
    return res.data.user;
  }, [scheduleExpiry]);

  const register = useCallback(async (data) => {
    const res = await api.post('/auth/register', data);
    setToken(res.data.token, false);
    scheduleExpiry(res.data.token);
    setUser(res.data.user);
    return res.data.user;
  }, [scheduleExpiry]);

  const refreshToken = useCallback((token) => {
    replaceToken(token);
    scheduleExpiry(token);
  }, [scheduleExpiry]);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, setUser, refreshToken }),
    [user, loading, login, register, logout, refreshToken]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
