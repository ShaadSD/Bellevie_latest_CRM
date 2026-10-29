// Base URL from environment variable or fallback to the Django backend on port 8000.
export const BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://192.168.0.107:8000/').replace(/\/$/, '');

export interface LoginRequest {
  username: string;
  password?: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
}

export interface RefreshTokenRequest {
  refresh: string;
}

export interface RefreshTokenResponse {
  access: string;
}

export interface UserMeResponse {
  id: number;
  public_id: string;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  profile_image?: string | null;
  role: 'HQ_ADMIN' | 'NETWORK_CENTRE' | string;
  network_centre?: string | null;
  is_active: boolean;
}

export interface ChangePasswordRequest {
  old_password?: string;
  new_password?: string;
}

export function formatApiError(errorData: any): string {
  if (!errorData) return 'An unexpected error occurred';
  if (typeof errorData === 'string') return errorData;
  if (Array.isArray(errorData)) {
    return errorData.map(v => (typeof v === 'object' ? formatApiError(v) : String(v))).join(' | ');
  }
  if (errorData.detail) return String(errorData.detail);
  if (errorData.message) return String(errorData.message);

  if (typeof errorData === 'object' && errorData !== null) {
    const messages: string[] = [];
    for (const [key, val] of Object.entries(errorData)) {
      if (Array.isArray(val)) {
        const valStr = val.map(v => (typeof v === 'object' ? formatApiError(v) : String(v))).join(' ');
        messages.push(key !== 'non_field_errors' ? `${key}: ${valStr}` : valStr);
      } else if (typeof val === 'string') {
        messages.push(key !== 'detail' && key !== 'non_field_errors' ? `${key}: ${val}` : val);
      } else if (typeof val === 'object' && val !== null) {
        messages.push(formatApiError(val));
      }
    }
    if (messages.length > 0) {
      return messages.join(' | ');
    }
  }

  return 'Request failed';
}

// API helper wrapper targeting the Django backend directly.
export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Ensure leading slash and trailing slash on path segment for Django REST Framework
  let cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const queryIndex = cleanEndpoint.indexOf('?');
  if (queryIndex !== -1) {
    const path = cleanEndpoint.substring(0, queryIndex);
    const query = cleanEndpoint.substring(queryIndex);
    const cleanPath = path.endsWith('/') ? path : `${path}/`;
    cleanEndpoint = `${cleanPath}${query}`;
  } else if (!cleanEndpoint.endsWith('/')) {
    cleanEndpoint += '/';
  }

  // Target backend server URL directly to avoid proxy redirect loops
  const fullUrl = cleanEndpoint.startsWith('http') ? cleanEndpoint : `${BASE_URL}${cleanEndpoint}`;
  let response: Response;
  try {
    response = await fetch(fullUrl, {
      ...options,
      headers,
    });
  } catch (err) {
    throw err;
  }



  if (!response.ok) {
    // If token expired (401), attempt refresh
    if (response.status === 401 && !cleanEndpoint.includes('/refresh/') && !cleanEndpoint.includes('/login/')) {
      const refreshedToken = await refreshAccessToken();
      if (refreshedToken) {
        headers['Authorization'] = `Bearer ${refreshedToken}`;
        const retryResponse = await fetch(fullUrl, {
          ...options,
          headers,
        });
        if (retryResponse.ok) {
          if (retryResponse.status === 204 || retryResponse.status === 205) {
            return {} as T;
          }
          const text = await retryResponse.text();
          return text && text.trim() ? (JSON.parse(text) as T) : ({} as T);
        }
      }
    }

    const errorData = await response.json().catch(() => ({}));
    const errorMessage = formatApiError(errorData) || `Request failed with status ${response.status}`;
    console.error(`API Error [${response.status}] on ${cleanEndpoint}:`, errorData);
    const apiErr: any = new Error(errorMessage);
    apiErr.status = response.status;
    apiErr.errorData = errorData;
    throw apiErr;
  }

  if (response.status === 204 || response.status === 205) {
    return {} as T;
  }

  const text = await response.text();
  if (!text || !text.trim()) {
    return {} as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch (err) {
    return {} as T;
  }
}

// Refresh token helper
export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${BASE_URL}/api/auth/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (res.ok) {
      const data: RefreshTokenResponse = await res.json();
      localStorage.setItem('access_token', data.access);
      return data.access;
    }
  } catch (err) {
    console.error('Failed to refresh token', err);
  }

  // Clear invalid tokens
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  return null;
}
