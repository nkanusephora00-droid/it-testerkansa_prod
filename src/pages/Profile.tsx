import React, { useEffect, useState, useRef } from 'react';
import { profileAPI, User } from '../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faCamera, faLock, faSave } from '@fortawesome/free-solid-svg-icons';
import '../styles/pages/Profile.css';

interface ProfileData extends User {
  profilePhoto?: string | null;
  createdAt?: string | null;
}

const Profile: React.FC = () => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [activeTab, setActiveTab] = useState<'info' | 'password'>('info');
  
  const [formData, setFormData] = useState({
    email: '',
  });
  
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await profileAPI.getMe();
      const profileData = data as ProfileData;
      setProfile(profileData);
      setFormData({ email: data.email || '' });
      setPreviewPhoto(profileData.profilePhoto !== undefined ? profileData.profilePhoto : null);
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error(err);
      }
      setMessage({ type: 'error', text: 'Erreur de chargement du profil' });
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setPreviewPhoto(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updateData: { email: string; profilePhoto?: string } = {
        email: formData.email,
      };
      
      if (previewPhoto !== profile?.profilePhoto) {
        updateData.profilePhoto = previewPhoto || undefined;
      }
      
      await profileAPI.updateMe(updateData);
      setMessage({ type: 'success', text: 'Profil mis à jour avec succès!' });
      fetchProfile();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Erreur lors de la mise à jour' });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'Les mots de passe ne correspondent pas' });
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Le mot de passe doit contenir au moins 6 caractères' });
      return;
    }
    
    setSaving(true);
    try {
      await profileAPI.changePassword(passwordData.oldPassword, passwordData.newPassword);
      setMessage({ type: 'success', text: 'Mot de passe changé avec succès!' });
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Erreur lors du changement de mot de passe' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="profile-loading">Chargement...</div>
      </div>
    );
  }

  const defaultPhoto = `data:image/svg+xml,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="35" r="25" fill="#cbd5e1"/>
      <circle cx="50" cy="100" r="40" fill="#cbd5e1"/>
    </svg>
  `)}`;

  return (
    <div className="profile-container">
      <main className="profile-main">
        <h2>Mon Profil</h2>
        
        {message.text && (
          <div className={message.type === 'success' ? 'profile-success' : 'profile-error'}>
            {message.text}
          </div>
        )}

        <div className="profile-header">
          <div className="profile-photo-container" onClick={handlePhotoClick}>
            <img
              src={previewPhoto || defaultPhoto}
              alt="Profil"
              className="profile-photo"
            />
            <div className="profile-photo-overlay">
              <FontAwesomeIcon icon={faCamera} size="lg" />
              <span>Changer</span>
            </div>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handlePhotoChange}
            accept="image/*"
            style={{ display: 'none' }}
          />
          <div className="profile-user-info">
            <h3>{profile?.username}</h3>
            <p>{profile?.email}</p>
            <span className="profile-role-badge">
              {profile?.role === 'admin' ? 'Administrateur' : 'Utilisateur'}
            </span>
          </div>
        </div>

        <div className="profile-tabs">
          <button 
            className={activeTab === 'info' ? 'profile-tab-active' : 'profile-tab'}
            onClick={() => setActiveTab('info')}
          >
            <FontAwesomeIcon icon={faUser} /> Informations
          </button>
          <button 
            className={activeTab === 'password' ? 'profile-tab-active' : 'profile-tab'}
            onClick={() => setActiveTab('password')}
          >
            <FontAwesomeIcon icon={faLock} /> Changer le mot de passe
          </button>
        </div>

        {activeTab === 'info' && (
          <div className="profile-form-section">
            <form onSubmit={handleSubmit}>
              <div className="profile-form-group">
                <label className="profile-label">Nom d'utilisateur</label>
                <input 
                  type="text" 
                  value={profile?.username || ''} 
                  disabled 
                  className="profile-input-disabled"
                />
              </div>
              <div className="profile-form-group">
                <label className="profile-label">Email</label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="profile-input"
                  required
                />
              </div>
              <div className="profile-form-group">
                <label className="profile-label">Date de création</label>
                <input 
                  type="text" 
                  value={profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('fr-FR') : ''} 
                  disabled 
                  className="profile-input-disabled"
                />
              </div>
              <button 
                type="submit" 
                className="profile-submit-button"
                disabled={saving}
              >
                <FontAwesomeIcon icon={faSave} /> {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'password' && (
          <div className="profile-form-section">
            <form onSubmit={handlePasswordSubmit}>
              <div className="profile-form-group">
                <label className="profile-label">Ancien mot de passe</label>
                <input 
                  type="password"
                  value={passwordData.oldPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                  className="profile-input"
                  required
                />
              </div>
              <div className="profile-form-group">
                <label className="profile-label">Nouveau mot de passe</label>
                <input 
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="profile-input"
                  required
                  minLength={6}
                />
              </div>
              <div className="profile-form-group">
                <label className="profile-label">Confirmer le mot de passe</label>
                <input 
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="profile-input"
                  required
                />
              </div>
              <button 
                type="submit" 
                className="profile-submit-button"
                disabled={saving}
              >
                <FontAwesomeIcon icon={faLock} /> {saving ? 'Enregistrement...' : 'Changer le mot de passe'}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
};

export default Profile;