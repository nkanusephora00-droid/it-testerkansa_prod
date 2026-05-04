import React, { useEffect, useState } from 'react';
import { applicationsAPI, Application } from '../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen, faTrash } from '@fortawesome/free-solid-svg-icons';

const Applications: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingApp, setEditingApp] = useState<Application | null>(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formData, setFormData] = useState({ nom: '', description: '', version: '', environnement: '' });
  const [editFormData, setEditFormData] = useState({ nom: '', description: '', version: '', environnement: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const filtered = applications.filter(app => 
      app.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (app.description && app.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (app.version && app.version.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (app.environnement && app.environnement.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredApplications(filtered);
  }, [searchTerm, applications]);

  const fetchApplications = async () => {
    try {
      const data: any = await applicationsAPI.getAll();
      const apps = Array.isArray(data) ? data : (data?.content || []);
      setApplications(apps);
      setFilteredApplications(apps);
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error(err);
      }
      setMessage({ type: 'error', text: 'Erreur de chargement des applications' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await applicationsAPI.create(formData);
      setMessage({ type: 'success', text: 'Application ajoutée avec succès!' });
      setFormData({ nom: '', description: '', version: '', environnement: '' });
      setShowCreateModal(false);
      fetchApplications();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Erreur lors de l\'ajout' });
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingApp) return;
    
    try {
      await applicationsAPI.update(editingApp.id, editFormData);
      setMessage({ type: 'success', text: 'Application mise à jour avec succès!' });
      setShowModal(false);
      setEditingApp(null);
      setEditFormData({ nom: '', description: '', version: '', environnement: '' });
      fetchApplications();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Erreur lors de la mise à jour' });
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette application ?')) return;
    
    try {
      await applicationsAPI.delete(id);
      setMessage({ type: 'success', text: 'Application supprimée avec succès!' });
      fetchApplications();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Erreur lors de la suppression' });
    }
  };

  const openEditModal = (app: Application) => {
    setEditingApp(app);
    setEditFormData({
      nom: app.nom,
      description: app.description || '',
      version: app.version || '',
      environnement: app.environnement || ''
    });
    setShowModal(true);
  };

  return (
    <div style={styles.container}>
      <main style={styles.main}>
        <div style={styles.header}>
          <div>
            <h2 style={styles.pageTitle}>Gestion des applications</h2>
            <p style={styles.pageSubtitle}>Centralisez vos applications, leurs versions et environnements.</p>
          </div>
          <button style={styles.primaryButton} onClick={() => setShowCreateModal(true)}>
            Nouvelle application
          </button>
        </div>
        
        {message.text && (
          <div style={message.type === 'success' ? styles.success : styles.error}>
            {message.text}
          </div>
        )}

        <div style={isMobile ? { ...styles.tableSection, ...styles.tableSectionMobile } : styles.tableSection}>
          <div style={styles.listHeader}>
            <div>
              <h3 style={styles.sectionTitle}>Liste des applications</h3>
              <div style={styles.stats}>
                <span style={styles.statItem}>Total: {applications.length}</span>
                <span style={styles.statItem}>Affichées: {filteredApplications.length}</span>
              </div>
            </div>
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
            />
          </div>
          {loading ? (
            <p>Chargement...</p>
          ) : isMobile ? (
            <div style={isMobile ? { ...styles.applicationsGrid, ...styles.applicationsGridMobile } : styles.applicationsGrid}>
              {filteredApplications.map((app) => (
                <div key={app.id} style={{...styles.appCard, ...(isMobile ? styles.appCardMobile : {})}}>
                  <div style={styles.appCardTop}>
                    <div style={styles.appIcon}>
                      <i className="fas fa-mobile-alt"></i>
                    </div>
                  </div>
                  <div style={styles.appCardContent}>
                    <h4 style={styles.appName}>{app.nom}</h4>
                    <div style={styles.appDetails}>
                      {app.version && (
                        <div style={styles.appDetail}>
                          <span style={styles.detailLabel}>Version:</span>
                          {app.version}
                        </div>
                      )}
                      {app.environnement && (
                        <div style={styles.appDetail}>
                          <span style={styles.detailLabel}>Env:</span>
                          {app.environnement}
                        </div>
                      )}
                    </div>
                    {app.description && (
                      <p style={styles.appDescription}>{app.description}</p>
                    )}
                  </div>
                  <div style={styles.appCardActions}>
                    <button style={styles.iconButton} onClick={() => openEditModal(app)} title="Modifier">
                      <FontAwesomeIcon icon={faPen} />
                    </button>
                    <button style={styles.iconButton} onClick={() => handleDelete(app.id)} title="Supprimer">
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ overflowX: 'auto', margin: '0 -12px', padding: '0 12px' }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.tableTh}>ID</th>
                    <th style={styles.tableTh}>Nom</th>
                    <th style={styles.tableTh}>Version</th>
                    <th style={styles.tableTh}>Environnement</th>
                    <th style={styles.tableTh}>Description</th>
                    <th style={styles.tableTh}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApplications.map((app) => (
                    <tr key={app.id} style={styles.tableTrHover}>
                      <td style={styles.tableTd}>{app.id}</td>
                      <td style={styles.tableTd}>{app.nom}</td>
                      <td style={styles.tableTd}>{app.version || '-'}</td>
                      <td style={styles.tableTd}>{app.environnement || '-'}</td>
                      <td style={styles.tableTd}>{app.description || '-'}</td>
                      <td style={{...styles.tableTd, display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
                        <button style={{...styles.editButton, padding: '8px 12px', backgroundColor: 'transparent', color: '#3498db'}} onClick={() => openEditModal(app)} title="Modifier">
                          <FontAwesomeIcon icon={faPen} />
                        </button>
                        <button style={{...styles.deleteButton, padding: '8px 12px', backgroundColor: 'transparent', color: '#ff6b6b'}} onClick={() => handleDelete(app.id)} title="Supprimer">
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {showCreateModal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <span style={styles.close} onClick={() => setShowCreateModal(false)}>&times;</span>
            <div style={styles.modalHeader}>
              <h3 style={styles.sectionTitle}>Nouvelle application</h3>
              <p style={styles.modalSubtitle}>Ajoutez une application et précisez sa version/environnement si nécessaire.</p>
            </div>
            <form onSubmit={handleSubmit} style={styles.modalForm}>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Nom de l'application *</label>
                  <input
                    type="text"
                    placeholder="Ex: Portail RH"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    style={styles.input}
                    required
                  />
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
                  <label style={styles.label}>Environnement</label>
                  <input
                    type="text"
                    placeholder="Ex: Production, Recette, Mobile"
                    value={formData.environnement}
                    onChange={(e) => setFormData({ ...formData, environnement: e.target.value })}
                    style={styles.input}
                  />
                </div>
              </div>
              <div style={styles.formGroup} >
                <label style={styles.label}>Description</label>
                <textarea
                  placeholder="Description fonctionnelle de l'application..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{ ...styles.textarea, minHeight: '80px' }}
                />
              </div>
              <div style={styles.formActions}>
                <button type="button" style={styles.secondaryButton} onClick={() => setShowCreateModal(false)}>Annuler</button>
                <button type="submit" style={styles.primaryButton}>Ajouter</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showModal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <span style={styles.close} onClick={() => setShowModal(false)}>&times;</span>
            <h3 style={styles.sectionTitle}>Modifier l'application</h3>
            <form onSubmit={handleEdit} style={styles.modalForm}>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Nom</label>
                  <input
                    type="text"
                    value={editFormData.nom}
                    onChange={(e) => setEditFormData({ ...editFormData, nom: e.target.value })}
                    style={styles.input}
                    required
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Version</label>
                  <input
                    type="text"
                    value={editFormData.version}
                    onChange={(e) => setEditFormData({ ...editFormData, version: e.target.value })}
                    style={styles.input}
                    placeholder="ex: 1.0"
                  />
                </div>
              </div>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Environnement</label>
                  <input
                    type="text"
                    value={editFormData.environnement}
                    onChange={(e) => setEditFormData({ ...editFormData, environnement: e.target.value })}
                    style={styles.input}
                    placeholder="ex: Mobile, Production"
                  />
                </div>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Description</label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  style={{ ...styles.textarea, minHeight: '80px' }}
                />
              </div>
              <div style={styles.formActions}>
                <button type="button" style={styles.secondaryButton} onClick={() => setShowModal(false)}>Annuler</button>
                <button type="submit" style={styles.primaryButton}>Enregistrer</button>
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
  tableSection: { backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', padding: '24px', marginBottom: '24px', border: '1px solid var(--border-color)', boxShadow: '0 2px 8px var(--shadow-color)' },
  tableSectionMobile: { padding: '16px', marginBottom: '16px' },
  applicationsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' },
  applicationsGridMobile: { gridTemplateColumns: '1fr', gap: '16px' },
  appCard: { backgroundColor: 'var(--bg-card)', borderRadius: '16px', padding: '0', border: '1px solid var(--border-color)', transition: 'all 0.2s ease', cursor: 'pointer', overflow: 'hidden' },
  appCardMobile: { padding: '0' },
  appCardTop: { display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border-light)' },
  appCardContent: { padding: '20px' },
  appCardActions: { display: 'flex', gap: '8px', justifyContent: 'flex-end', padding: '12px 20px', borderTop: '1px solid var(--border-light)' },
  appIcon: { width: '50px', height: '50px', borderRadius: '10px', backgroundColor: 'var(--info-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '20px' },
  iconButton: { width: '32px', height: '32px', borderRadius: '6px', border: 'none', backgroundColor: 'var(--hover-bg)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease' },
  appName: { margin: '0 0 12px 0', color: 'var(--text-primary)', fontSize: '18px', fontWeight: '600' },
  appDetails: { display: 'flex', gap: '16px', marginBottom: '12px', flexWrap: 'wrap' as const },
  appDetail: { fontSize: '13px', color: 'var(--text-secondary)' },
  detailLabel: { fontWeight: '500', color: 'var(--text-primary)', marginRight: '4px' },
  appDescription: { margin: '0', color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.4', minHeight: '40px' },
  sectionTitle: { margin: '0 0 20px', fontSize: '18px' },
  modalForm: { display: 'flex', flexDirection: 'column' as const, gap: '20px', padding: '8px 0' },
  formRow: { display: 'flex', gap: '16px', flexWrap: 'wrap' as const },
  formGroup: { marginBottom: '16px', flex: 1 },
  label: { display: 'block', marginBottom: '6px', fontWeight: 500, color: 'var(--text-secondary)', fontSize: '13px' },
  input: { 
    width: '100%', 
    padding: '12px 14px', 
    border: '1px solid var(--border-color)', 
    borderRadius: 'var(--radius-md)', 
    fontSize: '14px', 
    backgroundColor: 'var(--input-bg)', 
    color: 'var(--text-primary)'
  },
  textarea: { 
    width: '100%', 
    padding: '12px 14px', 
    border: '1px solid var(--border-color)', 
    borderRadius: 'var(--radius-md)', 
    fontSize: '14px', 
    backgroundColor: 'var(--input-bg)', 
    color: 'var(--text-primary)', 
    resize: 'vertical' as const,
    minHeight: '100px'
  },
  select: { 
    width: '100%', 
    padding: '12px 14px', 
    border: '1px solid var(--border-color)', 
    borderRadius: 'var(--radius-md)', 
    fontSize: '14px', 
    backgroundColor: 'var(--input-bg)', 
    color: 'var(--text-primary)'
  },
  formActions: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginTop: '20px', flexWrap: 'wrap' },
  primaryButton: { 
    padding: '12px 20px', 
    backgroundColor: 'var(--success-color)', 
    color: 'white', 
    border: 'none', 
    borderRadius: 'var(--radius-md)', 
    cursor: 'pointer', 
    fontWeight: 600, 
    display: 'flex', 
    alignItems: 'center', 
    gap: '8px'
  },
  secondaryButton: { 
    padding: '12px 20px', 
    backgroundColor: 'var(--bg-card)', 
    color: 'var(--text-primary)', 
    border: '1px solid var(--border-color)', 
    borderRadius: 'var(--radius-md)', 
    cursor: 'pointer', 
    fontWeight: 500, 
    display: 'flex', 
    alignItems: 'center', 
    gap: '8px'
  },
  table: { 
    width: '100%', 
    borderCollapse: 'separate' as const, 
    borderSpacing: '0',
    borderRadius: 'var(--radius-md)', 
    overflow: 'hidden',
    border: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-card)'
  },
  tableTh: { 
    padding: '12px', 
    textAlign: 'left', 
    backgroundColor: 'var(--hover-bg)', 
    fontWeight: '600', 
    color: 'var(--text-primary)',
    borderBottom: '1px solid var(--border-color)',
    fontSize: '13px'
  },
  tableTd: { 
    padding: '12px', 
    borderBottom: '1px solid var(--border-color)', 
    color: 'var(--text-primary)',
    fontSize: '13px'
  },
  tableTrHover: { 
    backgroundColor: 'var(--hover-bg)',
    transition: 'background-color 0.2s ease'
  },
  searchInput: { padding: '10px 16px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', fontSize: '14px', backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)', minWidth: '250px' },
  stats: { display: 'flex', gap: '16px', marginBottom: '8px' },
  statItem: { fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500' },
  deleteButton: { 
    padding: '8px', 
    backgroundColor: 'transparent', 
    color: 'var(--danger-color)', 
    border: 'none', 
    borderRadius: 'var(--radius-sm)', 
    cursor: 'pointer'
  },
  editButton: { 
    padding: '8px', 
    backgroundColor: 'transparent', 
    color: 'var(--text-secondary)', 
    border: 'none', 
    borderRadius: 'var(--radius-sm)', 
    cursor: 'pointer'
  },
  listHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' as const, gap: '12px' },
  listSubtitle: { fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 400 },
  success: { 
    padding: '14px', 
    backgroundColor: 'var(--success-color)', 
    color: 'white', 
    borderRadius: 'var(--radius-md)', 
    marginBottom: '20px'
  },
  error: { 
    padding: '14px', 
    backgroundColor: 'var(--danger-color)', 
    color: 'white', 
    borderRadius: 'var(--radius-md)', 
    marginBottom: '20px'
  },
  modal: { 
    position: 'fixed' as const, 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0, 
    width: '100%', 
    height: '100%', 
    backgroundColor: 'rgba(0,0,0,0.6)', 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'flex-start', 
    zIndex: 1000, 
    paddingTop: '40px', 
    overflowY: 'auto' as const, 
    backdropFilter: 'blur(4px)'
  },
  modalContent: { 
    backgroundColor: 'var(--bg-card)', 
    padding: '20px', 
    borderRadius: '16px', 
    width: '95%', 
    maxWidth: '500px', 
    position: 'relative' as const,
    margin: '0 auto 40px auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    border: '1px solid var(--border-light)'
  },
  close: { 
    position: 'absolute' as const, 
    top: '15px', 
    right: '20px', 
    fontSize: '28px', 
    cursor: 'pointer', 
    color: 'var(--text-muted)'
  },
  modalHeader: { marginBottom: '24px' },
  modalSubtitle: { fontSize: '14px', color: 'var(--text-secondary)', marginTop: '6px', fontWeight: 400 },
};

export default Applications;
