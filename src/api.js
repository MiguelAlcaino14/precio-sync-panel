const TOKEN_KEY = 'ps_token';
const USER_KEY  = 'ps_user';

export const getToken   = ()  => localStorage.getItem(TOKEN_KEY);
export const setToken   = t   => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = ()  => localStorage.removeItem(TOKEN_KEY);

export const getUser   = ()  => JSON.parse(localStorage.getItem(USER_KEY) || 'null');
export const setUser   = u   => localStorage.setItem(USER_KEY, JSON.stringify(u));
export const clearUser = ()  => localStorage.removeItem(USER_KEY);

export async function apiFetch(path, options = {}) {
  const token   = getToken();
  const headers = { ...(options.headers || {}) };

  if (token) headers['Authorization'] = `Bearer ${token}`;

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const base = import.meta.env.VITE_API_URL || '';
  const res = await fetch(`${base}/api${path}`, { ...options, headers });

  if (res.status === 401) {
    clearToken();
    clearUser();
    window.location.href = '/login';
    throw new Error('No autorizado');
  }

  return res;
}
