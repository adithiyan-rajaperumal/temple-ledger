import api from './api.js';

const TOKEN_KEY = 'temple_ledger_token';
const USER_KEY = 'temple_ledger_user';

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getCurrentUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function isAuthenticated() {
  const token = getToken();
  const user = getCurrentUser();
  return Boolean(token && user);
}

export function isSuperAdmin() {
  const user = getCurrentUser();
  return Boolean(isAuthenticated() && user?.role === 'ROLE_SUPER_ADMIN');
}

export function isDataEntry() {
  const user = getCurrentUser();
  return Boolean(
    isAuthenticated() &&
      (user?.role === 'ROLE_DATA_ENTRY' || user?.role === 'ROLE_SUPER_ADMIN')
  );
}

export function notifyAuthChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('temple-ledger-auth-change'));
  }
}

export async function login(username, password) {
  const response = await api.post('/auth/login', { username, password });
  const { token, fullName, role, expiresIn } = response.data;

  const user = {
    username: response.data.username || username,
    fullName,
    role,
    expiresIn,
  };

  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (err) {
    console.error('Failed to save auth state to localStorage', err);
  }

  notifyAuthChange();
  return user;
}

export function logout() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch (err) {
    console.error('Failed to clear auth state from localStorage', err);
  }
  notifyAuthChange();
}

export default {
  getToken,
  getCurrentUser,
  isAuthenticated,
  isSuperAdmin,
  isDataEntry,
  login,
  logout,
  notifyAuthChange,
};
