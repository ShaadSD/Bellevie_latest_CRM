'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  BASE_URL, 
  apiFetch, 
  LoginResponse, 
  UserMeResponse 
} from '@/lib/api';

export type UserRole = 'HQ' | 'NC' | null;

export interface UserSession {
  id?: number;
  publicId?: string;
  username: string;
  firstName?: string;
  lastName?: string;
  name: string;
  email: string;
  phone?: string;
  profileImage?: string | null;
  role: UserRole;
  backendRole?: string;
  networkCentre?: string;
  avatar: string;
  subtext: string;
  notificationsCount: number;
}

interface AuthContextType {
  user: UserSession | null;
  loading: boolean;
  error: string | null;
  login: (username: string, password?: string) => Promise<void>;
  demoLogin: (role: 'HQ' | 'NC') => void;
  logout: () => void;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  error: null,
  login: async () => {},
  demoLogin: () => {},
  logout: () => {},
  changePassword: async () => {}
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Helper to determine HQ vs NC role from Django User.role choices
  const isHqRole = (roleStr?: string): boolean => {
    if (!roleStr) return false;
    const normalized = roleStr.toUpperCase();
    return normalized === 'HQ_ADMIN' || normalized.includes('HQ');
  };

  // Helper to format absolute URL for Django profile images
  const formatProfileImageUrl = (rawPath?: string | null): string | null => {
    if (!rawPath || typeof rawPath !== 'string') return null;
    
    // If already absolute URL
    if (rawPath.startsWith('http://') || rawPath.startsWith('https://')) {
      return rawPath;
    }
    
    const cleanPath = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
    
    // Construct full URL using BASE_URL (http://192.168.0.110:3700)
    const fullUrl = `${BASE_URL}${cleanPath}`;
    console.log('[AuthContext] Formatted profile image URL:', fullUrl);
    return fullUrl;
  };

  const buildUserSession = (meData: UserMeResponse): UserSession => {
    const isHq = isHqRole(meData.role);
    
    // Construct display name from first_name and last_name or username
    const fullName = [meData.first_name, meData.last_name].filter(Boolean).join(' ').trim();
    const displayName = fullName || meData.username || (isHq ? 'HQ Admin' : 'Dhaka Centre User');

    // Calculate avatar initials
    let initials = 'HA';
    if (meData.first_name && meData.last_name) {
      initials = `${meData.first_name[0]}${meData.last_name[0]}`.toUpperCase();
    } else if (displayName) {
      initials = displayName.substring(0, 2).toUpperCase();
    } else {
      initials = isHq ? 'HA' : 'DC';
    }

    const fullProfileImgUrl = formatProfileImageUrl(meData.profile_image);

    return {
      id: meData.id,
      publicId: meData.public_id,
      username: meData.username,
      firstName: meData.first_name,
      lastName: meData.last_name,
      name: displayName,
      email: meData.email || `${meData.username}@bellevie.com`,
      phone: meData.phone,
      profileImage: fullProfileImgUrl,
      role: isHq ? 'HQ' : 'NC',
      backendRole: meData.role,
      networkCentre: meData.network_centre || undefined,
      avatar: initials,
      subtext: isHq ? 'Head Office' : (meData.network_centre || 'Network Centre'),
      notificationsCount: isHq ? 5 : 8,
    };
  };

  useEffect(() => {
    // Check saved tokens or saved state on load
    const checkAuth = async () => {
      const accessToken = localStorage.getItem('access_token');
      const savedRole = localStorage.getItem('bellevie_user_role') as 'HQ' | 'NC' | null;

      if (accessToken) {
        try {
          // Fetch current logged in user from GET /api/auth/me/
          const meData = await apiFetch<UserMeResponse>('/api/auth/me/');
          const session = buildUserSession(meData);
          if (meData.network_centre) {
            localStorage.setItem('active_nc_name', meData.network_centre);
          }
          setUser(session);
          setLoading(false);
          return;
        } catch (err) {
          console.warn('Failed to load user from /api/auth/me/, clearing token', err);
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }
      }

      // Fallback demo saved state
      if (savedRole === 'HQ') {
        setUser({
          username: 'admin',
          name: 'HQ Admin',
          email: 'hq.admin@bellevie.com',
          role: 'HQ',
          avatar: 'HA',
          subtext: 'Head Office',
          notificationsCount: 5,
        });
      } else if (savedRole === 'NC') {
        setUser({
          username: 'dhaka_nc',
          name: 'Dhaka Centre User',
          email: 'dhaka.nc@bellevie.com',
          role: 'NC',
          avatar: 'DC',
          subtext: 'Network Centre',
          notificationsCount: 8,
        });
      }

      setLoading(false);
    };

    checkAuth();
  }, []);

  // Real API Login Call (POST /api/auth/login/)
  const login = async (username: string, password?: string) => {
    setLoading(true);
    setError(null);

    try {
      // 1. Post credentials to /api/auth/login/
      const loginUrl = `${BASE_URL}/api/auth/login/`;
      const loginRes = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!loginRes.ok) {
        let errorMsg = 'Invalid username or password';
        try {
          const errorData = await loginRes.json();
          errorMsg = errorData.detail || errorData.message || errorData.non_field_errors?.[0] || errorMsg;
        } catch (_) {}
        throw new Error(errorMsg);
      }

      const tokens: LoginResponse = await loginRes.json();
      localStorage.setItem('access_token', tokens.access);
      localStorage.setItem('refresh_token', tokens.refresh);

      // 2. Fetch current user profile from GET /api/auth/me/
      const meData = await apiFetch<UserMeResponse>('/api/auth/me/');
      const session = buildUserSession(meData);

      setUser(session);
      localStorage.setItem('bellevie_user_role', session.role || 'HQ');

      // 3. Route according to user role:
      if (session.role === 'HQ') {
        router.push('/hq');
      } else {
        router.push('/nc');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Demo Login Fallback
  const demoLogin = (role: 'HQ' | 'NC') => {
    localStorage.setItem('bellevie_user_role', role);
    if (role === 'HQ') {
      setUser({
        username: 'admin',
        name: 'HQ Admin',
        email: 'hq.admin@bellevie.com',
        role: 'HQ',
        avatar: 'HA',
        subtext: 'Head Office',
        notificationsCount: 5,
      });
      router.push('/hq');
    } else {
      setUser({
        username: 'dhaka_nc',
        name: 'Dhaka Centre User',
        email: 'dhaka.nc@bellevie.com',
        role: 'NC',
        avatar: 'DC',
        subtext: 'Network Centre',
        notificationsCount: 8,
      });
      router.push('/nc');
    }
  };

  // Change Password API (POST /api/auth/change-password/)
  const changePassword = async (oldPassword: string, newPassword: string) => {
    await apiFetch('/api/auth/change-password/', {
      method: 'POST',
      body: JSON.stringify({
        old_password: oldPassword,
        new_password: newPassword,
      }),
    });
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('bellevie_user_role');
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        demoLogin,
        logout,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
