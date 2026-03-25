import { create } from 'zustand';

const STORAGE_KEY = 'chat_auth';

function decodeJwtPayload(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((char) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join('')
    );

    return JSON.parse(json);
  } catch {
    return null;
  }
}

function isTokenValid(token) {
  if (!token || typeof token !== 'string') return false;

  const payload = decodeJwtPayload(token);
  if (!payload) return false;

  if (!payload.exp) return true;

  const now = Math.floor(Date.now() / 1000);
  return payload.exp > now;
}

function loadInitialState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { token: null, user: null };

    const parsed = JSON.parse(raw);
    const token = parsed?.token || null;
    const user = parsed?.user || null;

    if (!isTokenValid(token)) {
      localStorage.removeItem(STORAGE_KEY);
      return { token: null, user: null };
    }

    return { token, user };
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return { token: null, user: null };
  }
}

const useAuthStore = create((set) => ({
  ...loadInitialState(),
  setAuth: ({ token, user }) => {
    const payload = { token, user };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    set(payload);
  },
  clearAuth: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ token: null, user: null });
  }
}));

export default useAuthStore;
