import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const login = useCallback(async (username: string, password: string) => {
    try {
      const data = await authAPI.login(username, password);
      
      // Store token and user info
      localStorage.setItem('access_token', data.accessToken);
      localStorage.setItem('token_type', data.tokenType);
      localStorage.setItem('user_role', data.userRole || '');
      localStorage.setItem('user_id', data.userId || '');
      localStorage.setItem('username', data.username || '');
      localStorage.setItem('email', data.email || '');
      
      setUser({
        id: data.userId || 0,
        username: data.username || '',
        email: data.email || '',
        role: data.userRole || '',
      });
      
      return { success: true };
    } catch (err: unknown) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Login error:', err);
      }
      const error = err as { response?: { data?: { detail?: string } }; message?: string };
      return { 
        success: false, 
        error: error.response?.data?.detail || error.message || 'Erreur de connexion' 
      };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('token_type');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_id');
    localStorage.removeItem('username');
    localStorage.removeItem('email');
    setUser(null);
    navigate('/login');
  }, [navigate]);

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      logout();
      return;
    }

    try {
      const userData = await authAPI.me();
      setUser({
        id: userData.id,
        username: userData.username,
        email: userData.email,
        role: userData.role,
      });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Auth check failed:', error);
      }
      logout();
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const isAdmin = user?.role === 'admin';

  return {
    user,
    loading,
    isAdmin,
    login,
    logout,
    checkAuth,
  };
};
