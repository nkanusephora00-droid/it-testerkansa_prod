import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

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
    <div style={styles.container}>
      <div className="login-card" style={styles.card}>
        <h1 className="login-title" style={styles.title}>IT Access Manager</h1>
        <h2 style={styles.subtitle}>Connexion</h2>
        
        {error && <div style={styles.error}>{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Nom d'utilisateur</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={styles.input}
              required
            />
          </div>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              
              required
            />
          </div>
          
          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
        
        <div style={styles.forgotPassword}>
          <button 
            type="button" 
            style={styles.forgotPasswordLink} 
            onClick={() => navigate('/forgot-password')}
          >
            Mot de passe oublié ?
          </button>
        </div>

      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: 'var(--bg-primary)',
    padding: '20px',
  },
  card: {
    backgroundColor: 'var(--bg-card)',
    padding: '48px',
    borderRadius: '24px',
    boxShadow: '0 24px 80px var(--shadow-strong)',
    width: '100%',
    maxWidth: '440px',
    border: '1px solid var(--border-light)',
  },
  title: {
    textAlign: 'center' as const,
    color: 'var(--text-primary)',
    marginBottom: '8px',
    fontSize: '32px',
    fontWeight: 700,
    letterSpacing: '-0.5px',
  },
  subtitle: {
    textAlign: 'center' as const,
    color: 'var(--text-secondary)',
    marginBottom: '36px',
    fontSize: '15px',
    fontWeight: 400,
  },
  formGroup: {
    marginBottom: '24px',
  },
  label: {
    display: 'block',
    marginBottom: '10px',
    color: 'var(--text-secondary)',
    fontWeight: 600 as const,
    fontSize: '13px',
    letterSpacing: '0.3px',
    textTransform: 'uppercase' as const,
  },
  input: {
    width: '100%',
    padding: '16px 18px',
    border: '2px solid var(--border-color)',
    borderRadius: '14px',
    fontSize: '15px',
    backgroundColor: 'var(--input-bg)',
    color: 'var(--text-primary)',
    transition: 'all 0.2s ease',
    outline: 'none',
    fontWeight: 400,
  },
  button: {
    width: '100%',
    padding: '16px',
    backgroundColor: 'var(--info-color)',
    color: 'white',
    border: 'none',
    borderRadius: '14px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 16px rgba(52, 152, 219, 0.3)',
    letterSpacing: '0.3px',
  },
  error: {
    color: 'white',
    backgroundColor: 'var(--danger-color)',
    padding: '16px 20px',
    borderRadius: '12px',
    marginBottom: '24px',
    fontSize: '14px',
    fontWeight: 500,
    boxShadow: '0 4px 12px rgba(255, 107, 107, 0.2)',
  },
  forgotPassword: {
    textAlign: 'center' as const,
    marginTop: '16px',
  },
  forgotPasswordLink: {
    background: 'none',
    border: 'none',
    color: 'var(--info-color)',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'all 0.2s ease',
  },
};

export default Login;
