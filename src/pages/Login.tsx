import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import '../styles/pages/Login.css';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
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

      const response = await login(username, password);
      if (!response.success) {
        setError(response.error || 'Erreur de connexion');
      } else {
        navigate('/dashboard');
      }
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
