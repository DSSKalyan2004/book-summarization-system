import { SummaryResult, AuthResponse, UsersListResponse, LoginEvent } from '../types';

// Base URL for the backend API.
// VITE_API_URL = https://book-summarization-system.onrender.com (production)
// VITE_API_URL = "" or unset (development — uses Vite proxy)
const API_BASE_URL =
  ((import.meta as any).env.VITE_API_URL || '') + '/api';

// Debug: log which API URL is being used (visible in browser console)
if (typeof window !== 'undefined') {
  console.log(`[API] Base URL: ${API_BASE_URL}`);
}

// ── Retry helper ────────────────────────────────────────────────
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 800; // base delay; doubles on each attempt

async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries = MAX_RETRIES
): Promise<Response> {
  let lastError: Error = new Error('Unknown error');
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 s timeout
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);

      // Auto-logout on 401 — but ONLY for real data endpoints, not validation/refresh endpoints
      if (response.status === 401) {
        const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register')
          || url.includes('/auth/me') || url.includes('/auth/refresh');
        if (!isAuthEndpoint) {
          console.warn('[API] 401 received — session expired, logging out');
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
          window.dispatchEvent(new CustomEvent('session-expired'));
        }
      }

      return response;
    } catch (err: any) {
      lastError = err;
      const isAborted = err.name === 'AbortError';
      const isNetworkError = err instanceof TypeError;
      if ((!isNetworkError && !isAborted) || attempt === retries) break;
      const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1); // exponential back-off
      console.warn(`[API] Attempt ${attempt}/${retries} failed – retrying in ${delay}ms…`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  // Convert network errors to user-friendly messages
  if (lastError instanceof TypeError || lastError.name === 'AbortError') {
    throw new Error('Cannot connect to server. Please check if the backend is running.');
  }
  throw lastError;
}

// ── Safe JSON parser ─────────────────────────────────────────────
async function safeJson<T = any>(response: Response, fallback: T | null = null): Promise<T> {
  const text = await response.text();
  if (!text) return fallback as T;
  try {
    return JSON.parse(text);
  } catch {
    return fallback as T;
  }
}

// ── Health check ─────────────────────────────────────────────────
// Pings the backend /api/health endpoint.
// Used by App.tsx to show a "server waking up" banner on Render free tier cold starts.
export const checkServerHealth = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(`${API_BASE_URL}/health`, { signal: controller.signal });
    clearTimeout(timeoutId);
    return res.ok;
  } catch {
    return false;
  }
};

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

export const summaryApi = {
  // Get all summaries for the logged-in user (from MongoDB)
  getAll: async (): Promise<SummaryResult[]> => {
    try {
      const response = await fetchWithRetry(`${API_BASE_URL}/summaries/my/all`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch summaries');
      return await safeJson(response, []);
    } catch (error) {
      console.error('Error fetching summaries:', error);
      throw error;
    }
  },

  // Get single summary by ID
  getById: async (id: string): Promise<SummaryResult> => {
    try {
      const response = await fetchWithRetry(`${API_BASE_URL}/summaries/${id}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch summary');
      return await safeJson(response);
    } catch (error) {
      console.error('Error fetching summary:', error);
      throw error;
    }
  },

  // Save summary to user's permanent history (MongoDB)
  create: async (summary: SummaryResult): Promise<SummaryResult> => {
    try {
      const response = await fetchWithRetry(`${API_BASE_URL}/summaries/my/save`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(summary),
      });
      if (!response.ok) throw new Error('Failed to save summary');
      return await safeJson(response);
    } catch (error) {
      console.error('Error saving summary:', error);
      throw error;
    }
  },

  // Delete summary from user's history (MongoDB)
  delete: async (id: string): Promise<void> => {
    try {
      const response = await fetchWithRetry(`${API_BASE_URL}/summaries/my/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to delete summary');
    } catch (error) {
      console.error('Error deleting summary:', error);
      throw error;
    }
  },

  // Update summary
  update: async (id: string, summary: Partial<SummaryResult>): Promise<SummaryResult> => {
    try {
      const response = await fetchWithRetry(`${API_BASE_URL}/summaries/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(summary),
      });
      if (!response.ok) throw new Error('Failed to update summary');
      return await safeJson(response);
    } catch (error) {
      console.error('Error updating summary:', error);
      throw error;
    }
  },

  // Upload file and extract text
  uploadFile: async (file: File): Promise<{ text: string; filename: string }> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const token = localStorage.getItem('auth_token');

      const response = await fetchWithRetry(`${API_BASE_URL}/summaries/upload`, {
        method: 'POST',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await safeJson(response, {});
        throw new Error(errorData.message || 'Failed to upload file');
      }

      return await safeJson(response);
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  },
};

export const authApi = {
  // Register a new user
  register: async (name: string, email: string, password: string): Promise<AuthResponse> => {
    try {
      console.log('Attempting registration with:', { name, email });
      const response = await fetchWithRetry(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      console.log('Registration response status:', response.status);
      if (!response.ok) {
        const errorData = await safeJson(response, {});
        console.error('Registration error response:', errorData);
        throw new Error(errorData.detail || errorData.error || errorData.message || 'Registration failed');
      }
      const data = await safeJson(response);
      console.log('Registration successful, data:', data);
      return data;
    } catch (error: any) {
      console.error('Error registering user:', error);
      throw error;
    }
  },

  // Login user
  login: async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const response = await fetchWithRetry(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        const errorData = await safeJson(response, {});
        throw new Error(errorData.detail || errorData.error || errorData.message || 'Login failed');
      }
      return await safeJson(response);
    } catch (error: any) {
      console.error('Error logging in:', error);
      throw error;
    }
  },

  // Logout user
  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('auth_token');
  },

  // Get current user
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Verify token is still valid with the server and refresh user data.
  // IMPORTANT: only returns { valid: false } on a genuine 401/403 from the server.
  // If the server is offline / unreachable, the user stays logged in with cached data.
  verifyAndRefreshSession: async (): Promise<{ valid: boolean; user?: any; newToken?: string }> => {
    const token = localStorage.getItem('auth_token');
    const cachedUser = authApi.getCurrentUser();
    if (!token) return { valid: false };

    try {
      // 1. Validate token and get fresh user data
      const meRes = await fetchWithRetry(`${API_BASE_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      }, 2);

      if (meRes.status === 401 || meRes.status === 403) {
        // ✅ Genuine token rejection by the server — must logout
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        return { valid: false };
      }

      if (!meRes.ok) {
        // Server error (5xx) or other HTTP error — keep user logged in with cached data
        console.warn('[API] /auth/me returned', meRes.status, '— keeping cached session');
        return { valid: true, user: cachedUser };
      }

      const meData = await safeJson(meRes, {});
      const freshUser = meData.user;
      // Update stored user with fresh data from server
      localStorage.setItem('user', JSON.stringify(freshUser));

      // 2. Silently refresh the token to keep extending its life
      try {
        const refreshRes = await fetchWithRetry(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        }, 1);
        if (refreshRes.ok) {
          const refreshData = await safeJson(refreshRes, {});
          localStorage.setItem('auth_token', refreshData.token);
          return { valid: true, user: freshUser, newToken: refreshData.token };
        }
      } catch { /* refresh failed — existing token is still valid */ }

      return { valid: true, user: freshUser };

    } catch {
      // ✅ Network error — server is offline/unreachable.
      // Do NOT log the user out — keep them logged in with cached data.
      console.warn('[API] Server unreachable during session verify — keeping cached session');
      return { valid: true, user: cachedUser };
    }
  },

  // Get all users (admin only)
  getAllUsers: async (): Promise<UsersListResponse> => {
    try {
      const response = await fetchWithRetry(`${API_BASE_URL}/auth/users`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        const errorData = await safeJson(response, {});
        throw new Error(errorData.error || errorData.message || 'Failed to fetch users');
      }
      return await safeJson(response);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  // Get full login history across all users (admin only)
  getLoginHistory: async (): Promise<{ events: LoginEvent[]; count: number }> => {
    try {
      const response = await fetchWithRetry(`${API_BASE_URL}/auth/login-history`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        const errorData = await safeJson(response, {});
        throw new Error(errorData.error || errorData.message || 'Failed to fetch login history');
      }
      return await safeJson(response);
    } catch (error: any) {
      console.error('Error fetching login history:', error);
      throw error;
    }
  },
};
