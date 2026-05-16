import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import '../styles/pages/Login.css';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (process.env.NODE_ENV === 'development') {
        console.log("Login: Attempting login with:", username);
      }
       const data = await authAPI.login(username, password);
       if (process.env.NODE_ENV === 'development') {
        console.log("Login: Login response:", data);
        console.log("Login: Storing token:", data.accessToken ? data.accessToken.substring(0, 20) + "..." : "NO TOKEN");
       }
       localStorage.setItem('access_token', data.accessToken);
       localStorage.setItem('token_type', data.tokenType);
       // Store user info for Layout component
       localStorage.setItem('user_role', data.userRole || '');
       localStorage.setItem('user_id', data.userId || '');
       localStorage.setItem('username', data.username || '');
       localStorage.setItem('email', data.email || '');
       if (process.env.NODE_ENV === 'development') {
        console.log("Login: Token stored in localStorage");
        console.log("Login: Navigating to dashboard");
       }
       navigate('/dashboard');
    } catch (err: unknown) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Login: Erreur de connexion:', err);
      }
      const error = err as { response?: { data?: { detail?: string; accessToken?: string } }; message?: string };
      const errorMessage = error.response?.data?.detail || error.response?.data?.accessToken || error.message || 'Erreur de connexion';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">IT Access Manager</h1>
        <h2 className="login-subtitle">Connexion</h2>
        
        {error && <div className="login-error">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="login-form-group">
            <label className="login-label">Nom d'utilisateur</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="login-input"
              required
            />
          </div>
          
          <div className="login-form-group">
            <label className="login-label">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="login-input"
              
              required
            />
          </div>
          
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
        
        <div className="login-forgot-password">
          <button 
            type="button" 
            className="login-forgot-password-link" 
            onClick={() => navigate('/forgot-password')}
          >
            Mot de passe oublié ?
          </button>
        </div>

      </div>
    </div>
  );
};

export default Login;
