import axios from 'axios';

const getBaseURL = () => {
  const url = import.meta.env.VITE_API_URL;
  if (!url) return '/api';
  // Ensure protocol is present
  const protocol = url.includes('://') ? '' : 'https://';
  return `${protocol}${url}/api`.replace(/\/+api/, '/api');
};

const BASE = getBaseURL();

const api = axios.create({
  baseURL: BASE,
  withCredentials: true, // Always send cookies
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000,
});

// ── Request interceptor ───────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor ──────────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  (err) => {
    // If 401, fire global event so AuthContext can handle redirect
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }
    return Promise.reject(err);
  }
);

// ── Named endpoints ───────────────────────────────────────────
export const authApi = {
  me:      ()     => api.get('/auth/me'),
  status:  ()     => api.get('/auth/status'),
  logout:  ()     => api.post('/auth/logout'),
  profile: (data) => api.patch('/auth/profile', data),
  // OAuth login — full page redirect (not axios)
  loginUrl: () => `${BASE}/auth/github`,
};

export const githubApi = {
  overview:      (username) => api.get('/github/overview', { params: { username } }),
  repos:         (username) => api.get('/github/repos',    { params: { username } }),
  commits:       (username) => api.get('/github/commits',  { params: { username } }),
  languages:     (username) => api.get('/github/languages',{ params: { username } }),
  contributions: (username) => api.get('/github/contributions', { params: { username } }),
  stats:         (username) => api.get('/github/stats',    { params: { username } }),
};

export const userApi = {
  byUsername: (username) => api.get(`/users/${username}`),
  bySlug:     (slug)     => api.get(`/users/slug/${slug}`),
};

// ── Helpers ───────────────────────────────────────────────────
export const getErrorMessage = (err) =>
  err?.response?.data?.message ||
  err?.message ||
  'Something went wrong. Please try again.';

export default api;
