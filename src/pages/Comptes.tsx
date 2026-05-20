import React, { useEffect, useState, useCallback } from 'react';
import { comptesAPI, applicationsAPI, Application, ApplicationInfoDTO } from '../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen, faTrash, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

interface Compte {
  id: number;
  applicationId: number;
  username: string;
  code?: string;
  role?: string;
  commentaire?: string;
  createdBy?: number;
  application?: ApplicationInfoDTO;
}

const Comptes: React.FC = () => {
  const [comptes, setComptes] = useState<Compte[]>([]);
  const [filteredComptes, setFilteredComptes] = useState<Compte[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCompte, setEditingCompte] = useState<Compte | null>(null);
  const [viewingCompte, setViewingCompte] = useState<Compte | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({ applicationId: 0, username: '', code: '', role: '', commentaire: '' });
  const [editFormData, setEditFormData] = useState({ applicationId: 0, username: '', code: '', role: '', commentaire: '' });

  const getAppName = useCallback((appId: number) => {
    const app = applications.find(a => a.id === appId);
    return app ? app.nom : 'Application inconnue';
  }, [applications]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const filtered = comptes.filter(compte => 
      compte.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (compte.role && compte.role.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (compte.commentaire && compte.commentaire.toLowerCase().includes(searchTerm.toLowerCase())) ||
      getAppName(compte.applicationId).toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredComptes(filtered);
  }, [searchTerm, comptes, applications, getAppName]);

  const fetchData = async () => {
    try {
      const [comptesData, appsData] = await Promise.all([
        comptesAPI.getAll(),
        applicationsAPI.getAll(),
      ]);
      // Gérer à la fois les réponses tableau direct et PageResponse
      const comptes: any = comptesData;
      const apps: any = appsData;
      const comptesList = Array.isArray(comptes) ? comptes : (comptes?.content || []);
      setComptes(comptesList);
      setFilteredComptes(comptesList);
      setApplications(Array.isArray(apps) ? apps : (apps?.content || []));
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error(err);
      }
      setMessage({ type: 'error', text: 'Erreur de chargement des comptes' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await comptesAPI.create(formData);
      setMessage({ type: 'success', text: 'Compte ajouté avec succès!' });
      setFormData({ applicationId: 0, username: '', code: '', role: '', commentaire: '' });
      setShowCreateModal(false);
      fetchData();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Erreur lors de l\'ajout' });
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCompte) return;
    
    try {
      const updateData: Partial<Compte> = {
        applicationId: editFormData.applicationId,
        username: editFormData.username,
        role: editFormData.role,
        commentaire: editFormData.commentaire,
        code: editFormData.code,
      };
      
      await comptesAPI.update(editingCompte.id, updateData);
      setMessage({ type: 'success', text: 'Compte mis à jour avec succès!' });
      setShowModal(false);
      setEditingCompte(null);
      setEditFormData({ applicationId: 0, username: '', code: '', role: '', commentaire: '' });
      fetchData();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Erreur lors de la mise à jour' });
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce compte ?')) return;
    
    try {
      await comptesAPI.delete(id);
      setMessage({ type: 'success', text: 'Compte supprimé avec succès!' });
      fetchData();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setMessage({ type: 'error', text: error.response?.data?.detail || 'Erreur lors de la suppression' });
    }
  };

  const openEditModal = (compte: Compte) => {
    setEditingCompte(compte);
    setEditFormData({
      applicationId: compte.applicationId,
      username: compte.username,
      code: compte.code || '',
      role: compte.role || '',
      commentaire: compte.commentaire || '',
    });
    setShowModal(true);
  };

  return (
    <div style={styles.container}>
      <main style={styles.main}>
        <div style={styles.header}>
          <div>
            <h2 style={styles.pageTitle}>Gestion des comptes</h2>
            <p style={styles.pageSubtitle}>Suivez les accès par application et centralisez les identifiants sensibles.</p>
          </div>
          <button style={styles.primaryButton} onClick={() => setShowCreateModal(true)}>
            Nouveau compte
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
              <h3 style={styles.sectionTitle}>Liste des comptes</h3>
              <div style={styles.stats}>
                <span style={styles.statItem}>Total: {comptes.length}</span>
                <span style={styles.statItem}>Affichées: {filteredComptes.length}</span>
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
          ) : (
            <div style={{ overflowX: 'auto', margin: '0 -12px', padding: '0 12px' }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.tableTh}>ID</th>
                    <th style={styles.tableTh}>Username</th>
                    <th style={styles.tableTh}>Application</th>
                    <th style={styles.tableTh}>Rôle</th>
                    <th style={styles.tableTh}>Commentaire</th>
                    <th style={styles.tableTh}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredComptes.map((compte) => (
                    <tr key={compte.id} style={styles.tableTrHover}>
                      <td style={styles.tableTd}>{compte.id}</td>
                      <td style={styles.tableTd}>{compte.username}</td>
                      <td style={styles.tableTd}>{getAppName(compte.applicationId)}</td>
                      <td style={styles.tableTd}>{compte.role || '-'}</td>
                      <td style={styles.tableTd}>{compte.commentaire || '-'}</td>
                      <td style={{...styles.tableTd, display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
                        <button style={{...styles.viewButton, padding: '8px 12px', backgroundColor: 'transparent', color: '#27ae60'}} onClick={() => { setViewingCompte(compte); setShowViewModal(true); }} title="Voir">
                          <FontAwesomeIcon icon={faEye} />
                        </button>
                        <button style={{...styles.editButton, padding: '8px 12px', backgroundColor: 'transparent', color: '#3498db'}} onClick={() => openEditModal(compte)} title="Modifier">
                          <FontAwesomeIcon icon={faPen} />
                        </button>
                        <button style={{...styles.deleteButton, padding: '8px 12px', backgroundColor: 'transparent', color: '#ff6b6b'}} onClick={() => handleDelete(compte.id)} title="Supprimer">
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
              <h3 style={styles.sectionTitle}>Nouveau compte</h3>
              <p style={styles.modalSubtitle}>Ajoutez un compte et liez-le à une application.</p>
            </div>
            <form onSubmit={handleSubmit} style={styles.modalForm}>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Application *</label>
                  <select
                    value={formData.applicationId || ''}
                    onChange={(e) => setFormData({ ...formData, applicationId: parseInt(e.target.value) })}
                    style={styles.select}
                    required
                  >
                    <option value="">Sélectionnez une application</option>
                    {applications.map(app => (
                      <option key={app.id} value={app.id}>{app.nom}</option>
                    ))}
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Nom d'utilisateur *</label>
                  <input
                    type="text"
                    placeholder="Ex: jdupont"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    style={styles.input}
                    required
                  />
                </div>
              </div>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Code / mot de passe *</label>
                  <input
                    type="text"
                    placeholder="Saisir le secret ou code d'accès"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    style={styles.input}
                    required
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Rôle</label>
                  <input
                    type="text"
                    placeholder="Ex: Administrateur, Lecture seule..."
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    style={styles.input}
                  />
                </div>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Commentaire</label>
                <textarea
                  placeholder="Contexte, remarques sur ce compte..."
                  value={formData.commentaire}
                  onChange={(e) => setFormData({ ...formData, commentaire: e.target.value })}
                  style={styles.textarea}
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

      {/* View Modal */}
      {showViewModal && viewingCompte && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <span style={styles.close} onClick={() => setShowViewModal(false)}>&times;</span>
            <h3 style={styles.sectionTitle}>Détails du compte</h3>
            <div style={{ marginTop: '20px' }}>
              <p><strong>ID:</strong> {viewingCompte.id}</p>
              <p><strong>Application:</strong> {getAppName(viewingCompte.applicationId)}</p>
              <p><strong>Nom d'utilisateur:</strong> {viewingCompte.username}</p>
              <p>
                <strong>Code:</strong> {' '}
                <span style={{ fontFamily: 'monospace', backgroundColor: '#f0f0f0', padding: '2px 6px', borderRadius: '4px' }}>
                  {showPassword ? (viewingCompte.code || '---') : '********'}
                </span>
                <button 
                  onClick={() => setShowPassword(!showPassword)} 
                  style={{ ...styles.iconButton, marginLeft: '8px' }}
                  title={showPassword ? 'Masquer' : 'Afficher'}
                >
                  <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                </button>
              </p>
              <p><strong>Rôle:</strong> {viewingCompte.role || 'Non défini'}</p>
              <p><strong>Commentaire:</strong> {viewingCompte.commentaire || 'Aucun'}</p>
            </div>
            <div style={styles.formActions}>
              <button type="button" style={styles.secondaryButton} onClick={() => setShowViewModal(false)}>Fermer</button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <span style={styles.close} onClick={() => setShowModal(false)}>&times;</span>
            <h3 style={styles.sectionTitle}>Modifier le compte</h3>
            <form onSubmit={handleEdit} style={styles.modalForm}>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Application</label>
                  <select
                    value={editFormData.applicationId || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, applicationId: parseInt(e.target.value) })}
                    style={styles.select}
                    required
                  >
                    <option value="">Sélectionnez une application</option>
                    {applications.map(app => (
                      <option key={app.id} value={app.id}>{app.nom}</option>
                    ))}
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Nom d'utilisateur</label>
                  <input
                    type="text"
                    value={editFormData.username}
                    onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value })}
                    style={styles.input}
                    required
                  />
                </div>
              </div>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Code (mot de passe)</label>
                  <input
                    type="text"
                    value={editFormData.code}
                    onChange={(e) => setEditFormData({ ...editFormData, code: e.target.value })}
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Rôle</label>
                  <input
                    type="text"
                    value={editFormData.role}
                    onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                    style={styles.input}
                  />
                </div>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Commentaire</label>
                <textarea
                  value={editFormData.commentaire}
                  onChange={(e) => setEditFormData({ ...editFormData, commentaire: e.target.value })}
                  style={{ ...styles.textarea, minHeight: '70px' }}
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
  formSection: { backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', padding: '24px', marginBottom: '24px', border: '1px solid var(--border-color)', boxShadow: '0 2px 8px var(--shadow-color)' },
  tableSection: { backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', padding: '24px', border: '1px solid var(--border-color)', boxShadow: '0 2px 8px var(--shadow-color)' },
  sectionTitle: { margin: '0 0 20px', fontSize: '18px' },
  form: { display: 'flex', flexDirection: 'column' as const, gap: '18px', maxWidth: '760px' },
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
  table: { 
    width: '100%', 
    borderCollapse: 'separate' as const, 
    borderSpacing: '0',
    borderRadius: 'var(--radius-md)', 
    overflow: 'hidden',
    border: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-card)'
  },
  searchInput: { padding: '10px 16px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', fontSize: '14px', backgroundColor: 'var(--input-bg)', color: 'var(--text-primary)', minWidth: '250px' },
  stats: { display: 'flex', gap: '16px', marginBottom: '8px' },
  statItem: { fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500' },
  editButton: { padding: '8px', backgroundColor: 'transparent', color: 'var(--text-secondary)', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer' },
  deleteButton: { padding: '8px', backgroundColor: 'transparent', color: 'var(--danger-color)', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer' },
  viewButton: { padding: '8px', backgroundColor: 'transparent', color: 'var(--success-color)', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer' },
  listHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' as const, gap: '12px' },
  listSubtitle: { fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 400 },
  success: { padding: '14px', backgroundColor: 'var(--success-color)', color: 'white', borderRadius: 'var(--radius-md)', marginBottom: '20px' },
  error: { padding: '14px', backgroundColor: 'var(--danger-color)', color: 'white', borderRadius: 'var(--radius-md)', marginBottom: '20px' },
  modal: { position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', zIndex: 1000, paddingTop: '40px', overflowY: 'auto' as const, backdropFilter: 'blur(4px)' },
  modalContent: { backgroundColor: 'var(--bg-card)', padding: '20px', borderRadius: '16px', width: '95%', maxWidth: '500px', position: 'relative' as const, margin: '0 auto 40px auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', border: '1px solid var(--border-light)' },
  comptesGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' },
  compteCard: { backgroundColor: 'var(--bg-card)', borderRadius: '16px', padding: '0', border: '1px solid var(--border-color)', transition: 'all 0.2s ease', cursor: 'pointer', overflow: 'hidden' },
  compteCardHeader: { display: 'flex', alignItems: 'center', padding: '20px', borderBottom: '1px solid var(--border-light)' },
  compteIcon: { width: '50px', height: '50px', borderRadius: '10px', backgroundColor: 'var(--info-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '20px', marginRight: '16px' },
  compteInfo: { flex: 1 },
  compteUsername: { margin: '0 0 4px 0', color: 'var(--text-primary)', fontSize: '18px', fontWeight: '600' },
  compteApp: { color: 'var(--text-secondary)', fontSize: '14px' },
  compteCardContent: { padding: '20px' },
  compteDetail: { marginBottom: '12px', fontSize: '14px', color: 'var(--text-secondary)' },
  detailLabel: { fontWeight: '500', color: 'var(--text-primary)', marginRight: '4px' },
  compteCardActions: { display: 'flex', gap: '8px', justifyContent: 'flex-end', padding: '16px 20px', borderTop: '1px solid var(--border-light)' },
  iconButton: { width: '36px', height: '36px', borderRadius: '8px', border: 'none', backgroundColor: 'var(--hover-bg)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease' },
  close: { position: 'absolute' as const, top: '15px', right: '20px', fontSize: '28px', cursor: 'pointer', color: 'var(--text-muted)' },
  modalHeader: { marginBottom: '24px' },
  modalSubtitle: { fontSize: '14px', color: 'var(--text-secondary)', marginTop: '6px', fontWeight: 400 },
  compteDetails: { display: 'flex', gap: '16px', marginBottom: '12px', flexWrap: 'wrap' as const },
  compteCommentaire: { margin: '0', color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.4', minHeight: '40px' },
  cardBody: { marginBottom: '12px' },
  cardRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '6px' },
  cardLabel: { fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500' },
  cardValue: { fontSize: '13px', color: 'var(--text-primary)', fontWeight: '600' },
  cardActions: { display: 'flex', gap: '8px', justifyContent: 'flex-end' },
};

export default Comptes;
