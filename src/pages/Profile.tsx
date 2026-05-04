import React, { useEffect, useState, useRef } from 'react';
import { profileAPI, User } from '../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faCamera, faLock, faSave } from '@fortawesome/free-solid-svg-icons';

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
      <div style={styles.container}>
        <div style={styles.loading}>Chargement...</div>
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
    <div style={styles.container}>
      <main style={styles.main}>
        <h2>Mon Profil</h2>
        
        {message.text && (
          <div style={message.type === 'success' ? styles.success : styles.error}>
            {message.text}
          </div>
        )}

        <div style={styles.profileHeader}>
          <div style={styles.photoContainer} onClick={handlePhotoClick}>
            <img
              src={previewPhoto || defaultPhoto}
              alt="Profil"
              style={styles.photo}
            />
            <div style={styles.photoOverlay}>
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
          <div style={styles.userInfo}>
            <h3>{profile?.username}</h3>
            <p>{profile?.email}</p>
            <span style={styles.roleBadge}>
              {profile?.role === 'admin' ? 'Administrateur' : 'Utilisateur'}
            </span>
          </div>
        </div>

        <div style={styles.tabs}>
          <button 
            style={activeTab === 'info' ? styles.tabActive : styles.tab}
            onClick={() => setActiveTab('info')}
          >
            <FontAwesomeIcon icon={faUser} /> Informations
          </button>
          <button 
            style={activeTab === 'password' ? styles.tabActive : styles.tab}
            onClick={() => setActiveTab('password')}
          >
            <FontAwesomeIcon icon={faLock} /> Changer le mot de passe
          </button>
        </div>

        {activeTab === 'info' && (
          <div style={styles.formSection}>
            <form onSubmit={handleSubmit}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Nom d'utilisateur</label>
                <input 
                  type="text" 
                  value={profile?.username || ''} 
                  disabled 
                  style={styles.inputDisabled}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Email</label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={styles.input}
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Date de création</label>
                <input 
                  type="text" 
                  value={profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('fr-FR') : ''} 
                  disabled 
                  style={styles.inputDisabled}
                />
              </div>
              <button 
                type="submit" 
                style={styles.submitButton}
                disabled={saving}
              >
                <FontAwesomeIcon icon={faSave} /> {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'password' && (
          <div style={styles.formSection}>
            <form onSubmit={handlePasswordSubmit}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Ancien mot de passe</label>
                <input 
                  type="password"
                  value={passwordData.oldPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                  style={styles.input}
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Nouveau mot de passe</label>
                <input 
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  style={styles.input}
                  required
                  minLength={6}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Confirmer le mot de passe</label>
                <input 
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  style={styles.input}
                  required
                />
              </div>
              <button 
                type="submit" 
                style={styles.submitButton}
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

const styles = {
  container: { backgroundColor: 'var(--bg-primary)', minHeight: '100vh' },
  main: { padding: '30px', maxWidth: '800px', margin: '0 auto', minHeight: 'calc(100vh - 70px)' },
  loading: { textAlign: 'center' as const, padding: '40px', color: 'var(--text-muted)' },
  profileHeader: { display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '30px', flexWrap: 'wrap' as const },
  photoContainer: { position: 'relative' as const, width: '120px', height: '120px', borderRadius: '50%', overflow: 'hidden', cursor: 'pointer' },
  photo: { width: '100%', height: '100%', objectFit: 'cover' as const },
  photoOverlay: { position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', color: 'white', opacity: 0, transition: 'opacity 0.2s', gap: '4px', fontSize: '12px' },
  userInfo: { flex: 1 },
  roleBadge: { display: 'inline-block', padding: '4px 12px', backgroundColor: 'var(--info-color)', color: 'white', borderRadius: '16px', fontSize: '12px', marginTop: '8px' },
  tabs: { display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' as const },
  tab: { padding: '12px 20px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' },
  tabActive: { padding: '12px 20px', backgroundColor: 'var(--info-color)', border: 'none', borderRadius: '8px', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' },
  formSection: { backgroundColor: 'var(--bg-card)', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px var(--shadow-color)' },
  formGroup: { marginBottom: '20px' },
  label: { display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' },
  input: { width: '100%', padding: '12px 14px', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '14px', backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)', boxSizing: 'border-box' as const },
  inputDisabled: { width: '100%', padding: '12px 14px', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '14px', backgroundColor: 'var(--bg-primary)', color: 'var(--text-muted)', boxSizing: 'border-box' as const },
  submitButton: { padding: '12px 24px', backgroundColor: 'var(--success-color)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' },
  success: { padding: '14px', backgroundColor: 'var(--success-color)', color: 'white', borderRadius: '8px', marginBottom: '20px' },
  error: { padding: '14px', backgroundColor: 'var(--danger-color)', color: 'white', borderRadius: '8px', marginBottom: '20px' },
};

export default Profile;