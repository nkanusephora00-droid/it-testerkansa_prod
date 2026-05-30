import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, User } from '../services/api';

interface AuthContextData {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const clearStorage = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('token_type');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_id');
    localStorage.removeItem('username');
    localStorage.removeItem('email');
  };

  const logout = useCallback(() => {
    clearStorage();
    setUser(null);
    navigate('/login');
  }, [navigate]);

  const login = useCallback(async (username: string, password: string) => {
    try {
      const data = await authAPI.login(username, password);
      localStorage.setItem('access_token', data.accessToken);
      localStorage.setItem('token_type', data.tokenType);

      const me = await authAPI.me();
      setUser(me);
      localStorage.setItem('user_role', me.role || '');
      localStorage.setItem('user_id', String(me.id ?? ''));
      localStorage.setItem('username', me.username || '');
      localStorage.setItem('email', me.email || '');

      return { success: true };
    } catch (err: unknown) {
      if (process.env.NODE_ENV === 'development') {
        console.error('AuthProvider: login error', err);
      }
      const error = err as { response?: { data?: { detail?: string } }; message?: string };
      return {
        success: false,
        error: error.response?.data?.detail || error.message || 'Erreur de connexion',
      };
    }
  }, []);

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const me = await authAPI.me();
      setUser(me);
    } catch (err: unknown) {
      const error = err as { response?: { status?: number } };
      if (error.response?.status === 401) {
        clearStorage();
        setUser(null);
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAdmin: user?.role === 'admin',
      login,
      logout,
      checkAuth,
    }),
    [user, loading, login, logout, checkAuth],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
