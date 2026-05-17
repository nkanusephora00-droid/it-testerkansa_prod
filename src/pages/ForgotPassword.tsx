import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import '../styles/pages/ForgotPassword.css';

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (process.env.NODE_ENV === 'development') {
        console.log("ForgotPassword: Requesting password reset for:", email);
      }
      const response = await authAPI.forgotPassword(email);
      setMessage(response);
      if (process.env.NODE_ENV === 'development') {
        console.log("ForgotPassword: Reset email sent successfully");
      }
    } catch (err: unknown) {
      if (process.env.NODE_ENV === 'development') {
        console.error('ForgotPassword: Error:', err);
      }
      const error = err as { response?: { data?: { detail?: string } }; message?: string };
      const errorMessage = error.response?.data?.detail || error.message || 'Erreur lors de la demande de réinitialisation';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-card">
        <h1 className="forgot-password-title">Réinitialisation du mot de passe</h1>
        <p className="forgot-password-subtitle">Entrez votre email pour recevoir un lien de réinitialisation</p>

        {message && <div className="forgot-password-success">{message}</div>}
        {error && <div className="forgot-password-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="forgot-password-form-group">
            <label className="forgot-password-label">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="forgot-password-input"
              required
            />
          </div>

          <button type="submit" className="forgot-password-button" disabled={loading}>
            {loading ? 'Envoi en cours...' : 'Envoyer le lien'}
          </button>
        </form>

        <button
          type="button"
          className="forgot-password-back-button"
          onClick={() => navigate('/login')}
        >
          Retour à la connexion
        </button>
      </div>
    </div>
  );
};

export default ForgotPassword;
