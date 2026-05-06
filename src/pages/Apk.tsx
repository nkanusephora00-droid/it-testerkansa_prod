import React, { useEffect, useState } from 'react';
import { apkAPI, applicationsAPI, ApkFile, Application } from '../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faUpload } from '@fortawesome/free-solid-svg-icons';

const Apk: React.FC = () => {
  const [apks, setApks] = useState<ApkFile[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [uploading, setUploading] = useState(false);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({ applicationId: 0, version: '', packageName: '', description: '' });

  const userRole = localStorage.getItem('user_role');
  const isAdmin = userRole === 'admin';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [apksData, appsData] = await Promise.all([
        apkAPI.getAll(),
        applicationsAPI.getAll(),
      ]);
      setApks(apksData);
      setApplications(appsData);
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error(err);
      }
      setMessage({ type: 'error', text: 'Erreur de chargement des APK' });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setMessage({ type: 'error', text: 'Veuillez sélectionner un fichier APK' });
      return;
    }

    setUploading(true);
    try {
      await apkAPI.upload(
        selectedFile,
        formData.applicationId || undefined,
        formData.version || undefined,
        formData.packageName || undefined,
        formData.description || undefined
      );
      setMessage({ type: 'success', text: 'APK uploadé avec succès!' });
      setSelectedFile(null);
      setFormData({ applicationId: 0, version: '', packageName: '', description: '' });
      setShowUploadModal(false);
      fetchData();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Erreur lors de l\'upload' });
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (id: number, fileName: string) => {
    try {
      const blob = await apkAPI.download(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setMessage({ type: 'error', text: 'Erreur lors du téléchargement' });
    }
  };

  
  
  const handleDelete = async (id: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce APK ?')) return;
    
    try {
      await apkAPI.delete(id);
      setMessage({ type: 'success', text: 'APK supprimé avec succès!' });
      fetchData();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Erreur lors de la suppression' });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getAppName = (appId: number) => {
    const app = applications.find(a => a.id === appId);
    return app ? app.nom : 'Non associé';
  };

  return (
    <div style={styles.container}>
      <main style={styles.main}>
        <div style={styles.header}>
          <div>
            <h2 style={styles.pageTitle}>Gestion des APK</h2>
            <p style={styles.pageSubtitle}>Uploadez et gérez vos fichiers APK Android.</p>
          </div>
          <button style={styles.primaryButton} onClick={() => setShowUploadModal(true)}>
            <FontAwesomeIcon icon={faUpload} style={{ marginRight: '8px' }} />
            Uploader un APK
          </button>
        </div>
        
        {message.text && (
          <div style={message.type === 'success' ? styles.success : styles.error}>
            {message.text}
          </div>
        )}

        <div style={styles.tableSection}>
          <div style={styles.listHeader}>
            <div>
              <h3 style={styles.sectionTitle}>Liste des APK</h3>
              <p style={styles.listSubtitle}>
                {apks.length === 0
                  ? 'Aucun APK uploadé pour le moment.'
                  : `${apks.length} APK${apks.length > 1 ? 's' : ''} disponible${apks.length > 1 ? 's' : ''}.`}
              </p>
            </div>
          </div>
          {loading ? (
            <p>Chargement...</p>
          ) : (
            <div className="table-container" style={{ overflowX: 'auto', margin: '0 -12px', padding: '0 12px' }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th>Nom du fichier</th>
                    <th>Version</th>
                    <th>Package</th>
                    <th>Application</th>
                    <th>Taille</th>
                    <th>Téléchargements</th>
                    <th>Date d'upload</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {apks.map((apk) => (
                    <tr key={apk.id}>
                      <td><strong>{apk.originalFileName}</strong></td>
                      <td>{apk.version || '-'}</td>
                      <td>{apk.packageName || '-'}</td>
                      <td>{getAppName(apk.applicationId || 0)}</td>
                      <td>{formatFileSize(apk.fileSize)}</td>
                      <td>{apk.downloadCount || 0}</td>
                      <td>{new Date(apk.uploadDate).toLocaleDateString('fr-FR')}</td>
                      <td style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button 
                          style={{...styles.downloadButton, padding: '6px', backgroundColor: 'transparent', color: '#27ae60'}} 
                          onClick={() => handleDownload(apk.id, apk.originalFileName)} 
                          title="Télécharger"
                        >
                          📥
                        </button>
                        {isAdmin && (
                          <button 
                            style={{...styles.deleteButton, padding: '6px', backgroundColor: 'transparent', color: '#ff6b6b'}} 
                            onClick={() => handleDelete(apk.id)} 
                            title="Supprimer"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {showUploadModal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <span style={styles.close} onClick={() => setShowUploadModal(false)}>&times;</span>
            <div style={styles.modalHeader}>
              <h3 style={styles.sectionTitle}>Uploader un APK</h3>
              <p style={styles.modalSubtitle}>Sélectionnez un fichier APK et ajoutez ses métadonnées.</p>
            </div>
            <form onSubmit={handleUpload} style={styles.modalForm}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Fichier APK *</label>
                <input
                  type="file"
                  accept=".apk"
                  onChange={handleFileSelect}
                  style={styles.input}
                  required
                />
              </div>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Application</label>
                  <select
                    value={formData.applicationId || ''}
                    onChange={(e) => setFormData({ ...formData, applicationId: parseInt(e.target.value) })}
                    style={styles.select}
                  >
                    <option value="">Sélectionnez une application</option>
                    {applications.map(app => (
                      <option key={app.id} value={app.id}>{app.nom}</option>
                    ))}
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Version</label>
                  <input
                    type="text"
                    placeholder="Ex: 1.0.0"
                    value={formData.version}
                    onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                    style={styles.input}
                  />
                </div>
              </div>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Package Name</label>
                  <input
                    type="text"
                    placeholder="Ex: com.example.app"
                    value={formData.packageName}
                    onChange={(e) => setFormData({ ...formData, packageName: e.target.value })}
                    style={styles.input}
                  />
                </div>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Description</label>
                <textarea
                  placeholder="Description de l'APK..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={styles.textarea}
                />
              </div>
              <div style={styles.formActions}>
                <button type="button" style={styles.secondaryButton} onClick={() => setShowUploadModal(false)} disabled={uploading}>
                  Annuler
                </button>
                <button type="submit" style={styles.primaryButton} disabled={uploading}>
                  {uploading ? 'Upload en cours...' : 'Uploader'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { backgroundColor: 'var(--bg-primary)', minHeight: '100vh' },
  main: { padding: '30px', maxWidth: '1400px', margin: '0 auto', minHeight: 'calc(100vh - 70px)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap' as const, gap: '16px' },
  pageTitle: { margin: 0, fontSize: '24px', display: 'flex', alignItems: 'center', gap: '12px' },
  pageSubtitle: { margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '14px' },
  tableSection: { backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', padding: '24px', border: '1px solid var(--border-color)', boxShadow: '0 2px 8px var(--shadow-color)' },
  sectionTitle: { margin: '0 0 20px', fontSize: '18px' },
  modalForm: { display: 'flex', flexDirection: 'column' as const, gap: '20px', padding: '8px 0' },
  formRow: { display: 'flex', gap: '16px', flexWrap: 'wrap' as const },
  formGroup: { marginBottom: '16px', flex: 1 },
  label: { display: 'block', marginBottom: '6px', fontWeight: 500, color: 'var(--text-secondary)', fontSize: '13px' },
  input: { width: '100%', padding: '12px 14px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', fontSize: '14px', backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)' },
  textarea: { width: '100%', padding: '12px 14px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', fontSize: '14px', backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)', resize: 'vertical' as const, minHeight: '100px' },
  select: { width: '100%', padding: '12px 14px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', fontSize: '14px', backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)' },
  formActions: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginTop: '20px', flexWrap: 'wrap' },
  primaryButton: { padding: '12px 20px', backgroundColor: 'var(--success-color)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' },
  secondaryButton: { padding: '12px 20px', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' },
  table: { width: '100%', borderCollapse: 'collapse' as const, borderRadius: 'var(--radius-md)', overflow: 'hidden' },
  deleteButton: { padding: '8px', backgroundColor: 'transparent', color: 'var(--danger-color)', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer' },
  downloadButton: { padding: '8px', backgroundColor: 'transparent', color: 'var(--success-color)', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer' },
  listHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' as const, gap: '12px' },
  listSubtitle: { fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 400 },
  success: { padding: '14px', backgroundColor: 'var(--success-color)', color: 'white', borderRadius: 'var(--radius-md)', marginBottom: '20px' },
  error: { padding: '14px', backgroundColor: 'var(--danger-color)', color: 'white', borderRadius: 'var(--radius-md)', marginBottom: '20px' },
  modal: { position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', zIndex: 1000, paddingTop: '40px', overflowY: 'auto' as const, backdropFilter: 'blur(4px)' },
  modalContent: { backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: '16px', width: '95%', maxWidth: '500px', position: 'relative' as const, margin: '0 auto 40px auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', border: '1px solid var(--border-light)' },
  close: { position: 'absolute' as const, top: '15px', right: '20px', fontSize: '28px', cursor: 'pointer', color: 'var(--text-muted)' },
  modalHeader: { marginBottom: '24px' },
  modalSubtitle: { fontSize: '14px', color: 'var(--text-secondary)', marginTop: '6px', fontWeight: 400 },
};

export default Apk;
