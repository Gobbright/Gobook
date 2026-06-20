import { clearSession, getToken } from './authToken.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api';

export async function apiClient(path, options = {}) {
  const token = getToken();
  const isFormData = options.body instanceof FormData;
  const { headers: customHeaders = {}, ...fetchOptions } = options;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...fetchOptions,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...customHeaders,
    },
  });

  if (response.status === 401 && !path.startsWith('/auth/')) {
    clearSession();
    window.location.hash = '/login';
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `API request failed: ${response.status}`);
  }

  return data;
}
