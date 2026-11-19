// "Remember me" stores the token in localStorage; otherwise sessionStorage (cleared when the browser closes)
const KEY = 'srs_token';

export const getToken = () => localStorage.getItem(KEY) || sessionStorage.getItem(KEY);

export const setToken = (token, remember) => {
  clearToken();
  (remember ? localStorage : sessionStorage).setItem(KEY, token);
};

export const replaceToken = (token) => {
  // keep the same storage the user originally chose
  if (localStorage.getItem(KEY)) localStorage.setItem(KEY, token);
  else sessionStorage.setItem(KEY, token);
};

export const clearToken = () => {
  localStorage.removeItem(KEY);
  sessionStorage.removeItem(KEY);
};

// Reads the expiry (ms) from a JWT without verifying it (verification happens on the server)
export const tokenExpiry = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload.exp ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
};
