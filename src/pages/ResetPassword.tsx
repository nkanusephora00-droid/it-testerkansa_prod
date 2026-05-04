import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../services/api';

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (newPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);

    try {
      if (process.env.NODE_ENV === 'development') {
        console.log("ResetPassword: Resetting password with token");
      }
      const response = await authAPI.resetPassword(token, newPassword);
      setMessage(response);
      if (process.env.NODE_ENV === 'development') {
        console.log("ResetPassword: Password reset successfully");
      }
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: unknown) {
      if (process.env.NODE_ENV === 'development') {
        console.error('ResetPassword: Error:', err);
      }
      const error = err as { response?: { data?: { detail?: string } }; message?: string };
      const errorMessage = error.response?.data?.detail || error.message || 'Erreur lors de la réinitialisation';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>Token invalide</h1>
          <p style={styles.subtitle}>Aucun token de réinitialisation fourni</p>
          <button 
            style={styles.button} 
            onClick={() => navigate('/login')}
          >
            Retour à la connexion
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Nouveau mot de passe</h1>
        <p style={styles.subtitle}>Entrez votre nouveau mot de passe</p>
        
        {message && <div style={styles.success}>{message}</div>}
        {error && <div style={styles.error}>{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Nouveau mot de passe</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={styles.input}
              required
              minLength={6}
            />
          </div>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>Confirmer le mot de passe</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={styles.input}
              required
              minLength={6}
            />
          </div>
          
          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
          </button>
        </form>
        
        <button 
          type="button" 
          style={styles.backButton} 
          onClick={() => navigate('/login')}
        >
          Retour à la connexion
        </button>
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
    fontSize: '28px',
    fontWeight: 700,
    letterSpacing: '-0.5px',
  },
  subtitle: {
    textAlign: 'center' as const,
    color: 'var(--text-secondary)',
    marginBottom: '32px',
    fontSize: '14px',
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
    marginBottom: '16px',
  },
  backButton: {
    width: '100%',
    padding: '16px',
    backgroundColor: 'transparent',
    color: 'var(--text-secondary)',
    border: '2px solid var(--border-color)',
    borderRadius: '14px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    letterSpacing: '0.3px',
  },
  success: {
    color: 'white',
    backgroundColor: 'var(--success-color)',
    padding: '16px 20px',
    borderRadius: '12px',
    marginBottom: '24px',
    fontSize: '14px',
    fontWeight: 500,
    boxShadow: '0 4px 12px rgba(39, 174, 96, 0.2)',
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
};

export default ResetPassword;
