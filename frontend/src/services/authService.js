import { apiClient } from './apiClient.js';
import { clearSession, getStoredUser, isAuthenticated, setSession } from './authToken.js';

export { getStoredUser as getCurrentUser, isAuthenticated };

export async function login(email, password) {
  const data = await apiClient('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  setSession(data.token, data.user);
  return data.user;
}

export async function register(payload) {
  const data = await apiClient('/auth/register', { method: 'POST', body: JSON.stringify(payload) });
  return data.user;
}

export function logout() {
  clearSession();
  window.location.hash = '/login';
}
