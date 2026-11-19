import axios from 'axios';
import { getToken, clearToken } from '../utils/storage';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url || '';
    const isAuthCall = url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/password');
    if (err.response?.status === 401 && !isAuthCall) {
      clearToken();
      window.dispatchEvent(new CustomEvent('auth:expired', { detail: err.response?.data?.message }));
    }
    return Promise.reject(err);
  }
);

export const errorMessage = (err) => {
  if (err?.response?.data?.message) return err.response.data.message;
  if (err?.code === 'ECONNABORTED') return 'The server took too long to respond. Try again.';
  if (err?.message === 'Network Error') return 'Cannot reach the server. Check that the backend is running.';
  return err?.message || 'Something went wrong.';
};

export const fieldErrors = (err) => {
  const list = err?.response?.data?.errors || [];
  return list.reduce((acc, e) => (acc[e.field] ? acc : { ...acc, [e.field]: e.message }), {});
};

// Downloads a file (e.g. CSV) from an authenticated endpoint
export const downloadFile = async (url, filename) => {
  const res = await api.get(url, { responseType: 'blob' });
  const href = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(href);
};

export default api;
