import React, { useEffect, useState, useCallback } from 'react';
import { comptesAPI, applicationsAPI, Compte } from '../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import '../styles/pages/Comptes.css';

const Comptes: React.FC = () => {
  const [comptes, setComptes] = useState<Compte[]>([]);
  const [filteredComptes, setFilteredComptes] = useState<Compte[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCompte, setEditingCompte] = useState<Compte | null>(null);
  const [viewingCompte, setViewingCompte] = useState<Compte | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  
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
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
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
    <div className="comptes-container">
      <main className="comptes-main">
        <div className="comptes-header">
          <div>
            <h2 className="comptes-page-title">Gestion des comptes</h2>
            <p className="comptes-page-subtitle">Suivez les accès par application et centralisez les identifiants sensibles.</p>
          </div>
          <button className="comptes-primary-button" onClick={() => setShowCreateModal(true)}>
            Nouveau compte
          </button>
        </div>
        
        {message.text && (
          <div className={message.type === 'success' ? 'comptes-success' : 'comptes-error'}>
            {message.text}
          </div>
        )}

        <div className="comptes-table-section">
          <div className="comptes-list-header">
            <div>
              <h3 className="comptes-section-title">Liste des comptes</h3>
              <div className="comptes-stats">
                <span className="comptes-stat-item">Total: {comptes.length}</span>
                <span className="comptes-stat-item">Affichées: {filteredComptes.length}</span>
              </div>
            </div>
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="comptes-search-input"
            />
          </div>
          {loading ? (
            <p>Chargement...</p>
          ) : isMobile ? (
            <div className={isMobile ? 'comptes-comptes-grid comptes-comptes-grid-mobile' : 'comptes-comptes-grid'}>
              {filteredComptes.map((compte) => (
                <div key={compte.id} className="comptes-compte-card">
                  <div className="comptes-compte-card-header">
                    <div className="comptes-compte-icon">
                      <i className="fas fa-user"></i>
                    </div>
                    <div className="comptes-compte-info">
                      <h4 className="comptes-compte-username">{compte.username}</h4>
                      <p className="comptes-compte-app">{getAppName(compte.applicationId)}</p>
                    </div>
                  </div>
                  <div className="comptes-compte-card-content">
                    {compte.role && (
                      <div className="comptes-compte-detail">
                        <span className="comptes-detail-label">Rôle:</span>
                        {compte.role}
                      </div>
                    )}
                    {compte.commentaire && (
                      <p className="comptes-compte-commentaire">{compte.commentaire}</p>
                    )}
                  </div>
                  <div className="comptes-compte-card-actions">
                    <button className="comptes-icon-button" onClick={() => { setViewingCompte(compte); setShowViewModal(true); }} title="Voir">
                      <FontAwesomeIcon icon={faEye} />
                    </button>
                    <button className="comptes-icon-button" onClick={() => openEditModal(compte)} title="Modifier">
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                    <button className="comptes-icon-button" onClick={() => handleDelete(compte.id)} title="Supprimer">
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ overflowX: 'auto', margin: '0 -12px', padding: '0 12px' }}>
              <table className="comptes-table">
                <thead>
                  <tr>
                    <th className="comptes-table-th">ID</th>
                    <th className="comptes-table-th">Utilisateur</th>
                    <th className="comptes-table-th">Application</th>
                    <th className="comptes-table-th">Rôle</th>
                    <th className="comptes-table-th">Commentaire</th>
                    <th className="comptes-table-th">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredComptes.map((compte) => (
                    <tr key={compte.id} className="comptes-table-tr-hover">
                      <td className="comptes-table-td">{compte.id}</td>
                      <td className="comptes-table-td">{compte.username}</td>
                      <td className="comptes-table-td">{getAppName(compte.applicationId)}</td>
                      <td className="comptes-table-td">{compte.role || '-'}</td>
                      <td className="comptes-table-td">{compte.commentaire || '-'}</td>
                      <td className="comptes-table-td">
                        <button className="comptes-icon-button" onClick={() => { setViewingCompte(compte); setShowViewModal(true); }} title="Voir">
                          <FontAwesomeIcon icon={faEye} />
                        </button>
                        <button className="comptes-icon-button" onClick={() => openEditModal(compte)} title="Modifier">
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button className="comptes-icon-button" onClick={() => handleDelete(compte.id)} title="Supprimer">
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
        <div className="comptes-modal">
          <div className="comptes-modal-content">
            <span className="comptes-close" onClick={() => setShowCreateModal(false)}>&times;</span>
            <div className="comptes-modal-header">
              <h3 className="comptes-section-title">Nouveau compte</h3>
              <p className="comptes-modal-subtitle">Ajoutez un compte et liez-le à une application.</p>
            </div>
            <form onSubmit={handleSubmit} className="comptes-modal-form">
              <div className="comptes-form-row">
                <div className="comptes-form-group">
                  <label className="comptes-label">Application *</label>
                  <select
                    value={formData.applicationId || ''}
                    onChange={(e) => setFormData({ ...formData, applicationId: parseInt(e.target.value) })}
                    className="comptes-select"
                    required
                  >
                    <option value="">Sélectionnez une application</option>
                    {applications.map(app => (
                      <option key={app.id} value={app.id}>{app.nom}</option>
                    ))}
                  </select>
                </div>
                <div className="comptes-form-group">
                  <label className="comptes-label">Nom d'utilisateur *</label>
                  <input
                    type="text"
                    placeholder="Ex: jdupont"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="comptes-input"
                    required
                  />
                </div>
              </div>
              <div className="comptes-form-row">
                <div className="comptes-form-group">
                  <label className="comptes-label">Code / mot de passe *</label>
                  <input
                    type="text"
                    placeholder="Saisir le secret ou code d'accès"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="comptes-input"
                    required
                  />
                </div>
                <div className="comptes-form-group">
                  <label className="comptes-label">Rôle</label>
                  <input
                    type="text"
                    placeholder="Ex: Administrateur, Lecture seule..."
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="comptes-input"
                  />
                </div>
              </div>
              <div className="comptes-form-group">
                <label className="comptes-label">Commentaire</label>
                <textarea
                  placeholder="Contexte, remarques sur ce compte..."
                  value={formData.commentaire}
                  onChange={(e) => setFormData({ ...formData, commentaire: e.target.value })}
                  className="comptes-textarea"
                />
              </div>
              <div className="comptes-form-actions">
                <button type="button" className="comptes-secondary-button" onClick={() => setShowCreateModal(false)}>Annuler</button>
                <button type="submit" className="comptes-primary-button">Ajouter</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && viewingCompte && (
        <div className="comptes-modal">
          <div className="comptes-modal-content">
            <span className="comptes-close" onClick={() => setShowViewModal(false)}>&times;</span>
            <h3 className="comptes-section-title">Détails du compte</h3>
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
                  className="comptes-icon-button"
                  style={{ marginLeft: '8px' }}
                  title={showPassword ? 'Masquer' : 'Afficher'}
                >
                  <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                </button>
              </p>
              <p><strong>Rôle:</strong> {viewingCompte.role || 'Non défini'}</p>
              <p><strong>Commentaire:</strong> {viewingCompte.commentaire || 'Aucun'}</p>
            </div>
            <div className="comptes-form-actions">
              <button type="button" className="comptes-secondary-button" onClick={() => setShowViewModal(false)}>Fermer</button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="comptes-modal">
          <div className="comptes-modal-content">
            <span className="comptes-close" onClick={() => setShowModal(false)}>&times;</span>
            <h3 className="comptes-section-title">Modifier le compte</h3>
            <form onSubmit={handleEdit} className="comptes-modal-form">
              <div className="comptes-form-row">
                <div className="comptes-form-group">
                  <label className="comptes-label">Application</label>
                  <select
                    value={editFormData.applicationId || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, applicationId: parseInt(e.target.value) })}
                    className="comptes-select"
                    required
                  >
                    <option value="">Sélectionnez une application</option>
                    {applications.map(app => (
                      <option key={app.id} value={app.id}>{app.nom}</option>
                    ))}
                  </select>
                </div>
                <div className="comptes-form-group">
                  <label className="comptes-label">Nom d'utilisateur</label>
                  <input
                    type="text"
                    value={editFormData.username}
                    onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value })}
                    className="comptes-input"
                    required
                  />
                </div>
              </div>
              <div className="comptes-form-row">
                <div className="comptes-form-group">
                  <label className="comptes-label">Code (mot de passe)</label>
                  <input
                    type="text"
                    value={editFormData.code}
                    onChange={(e) => setEditFormData({ ...editFormData, code: e.target.value })}
                    className="comptes-input"
                  />
                </div>
                <div className="comptes-form-group">
                  <label className="comptes-label">Rôle</label>
                  <input
                    type="text"
                    value={editFormData.role}
                    onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                    className="comptes-input"
                  />
                </div>
              </div>
              <div className="comptes-form-group">
                <label className="comptes-label">Commentaire</label>
                <textarea
                  value={editFormData.commentaire}
                  onChange={(e) => setEditFormData({ ...editFormData, commentaire: e.target.value })}
                  className="comptes-textarea"
                  style={{ minHeight: '70px' }}
                />
              </div>
              <div className="comptes-form-actions">
                <button type="button" className="comptes-secondary-button" onClick={() => setShowModal(false)}>Annuler</button>
                <button type="submit" className="comptes-primary-button">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Comptes;
